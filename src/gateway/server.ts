import {createServer,type IncomingMessage} from 'node:http';
import {randomUUID,randomBytes} from 'node:crypto';
import type {Socket} from 'node:net';
import {WebSocketServer,WebSocket} from 'ws';
import type {World} from '../world/types.js';
import {METHODS,type Clock} from '../contracts.js';
import type {Recorder,EvidenceInput} from '../evidence/types.js';
import {validateFrame,validateParams,validateNamed} from '../profile/validate.js';
import {decideAccess,type DeceptionPolicy,type AccessDecision} from './policy.js';
import {dispatch} from './dispatch.js';
import {ByteBudget,TokenBucket} from './limits.js';
export type GatewayConfig={host:string;port:number;handshakeMs:number;idleMs:number;tickMs:number;lifetimeMs:number;maxConnectionBytes:number;maxSockets:number};
const defaults:GatewayConfig={host:'127.0.0.1',port:18789,handshakeMs:10000,idleMs:120000,tickMs:30000,lifetimeMs:900000,maxConnectionBytes:4*1024*1024,maxSockets:128};
const landing=Buffer.from('<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>OpenClaw Control</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><openclaw-app><h1>OpenClaw Control</h1><p>Gateway online</p><p>Connect an operator client to manage sessions.</p></openclaw-app></body></html>');
export async function startGateway(options:{world:Readonly<World>;recorder:Recorder;policy:DeceptionPolicy;config?:Partial<GatewayConfig>;clock?:Clock}){
 const {world,recorder,policy}=options,config={...defaults,...options.config},clock=options.clock??{now:Date.now};
 const inbound=new ByteBudget(16*1024*1024),outbound=new ByteBudget(8*1024*1024),connections=new TokenBucket(10,20),requests=new TokenBucket(100,200),evidenceRate=new TokenBucket(2*1024*1024,4*1024*1024);
 const sockets=new Map<Socket,{id:string;requests:number;created:number;bytes:number}>();const jobs=new Set<Promise<unknown>>();let closing=false,closePromise:Promise<void>|undefined,lost=0;
 const server=createServer({maxHeaderSize:16384,headersTimeout:5000,requestTimeout:10000,keepAliveTimeout:5000});server.maxRequestsPerSocket=100;
 const wss=new WebSocketServer({noServer:true,maxPayload:262144,perMessageDeflate:false});
 function track<T>(promise:Promise<T>):Promise<T>{jobs.add(promise);void promise.finally(()=>jobs.delete(promise)).catch(()=>{});return promise;}
 async function record(event:EvidenceInput){const count=(event.payload?.byteLength??0)+Buffer.byteLength(JSON.stringify({...event,payload:undefined}));if(!evidenceRate.consume(Date.now(),count)){lost=Math.min(lost+1,Number.MAX_SAFE_INTEGER);throw Error('evidence admission');}return recorder.append(event);}
 function base(id:string,transport:EvidenceInput['transport'],direction:EvidenceInput['direction'],kind:string,socket:Socket):EvidenceInput{return {world,connectionId:id,transport,direction,kind,timestampMs:clock.now(),peerAddress:socket.remoteAddress??null};}
 server.on('connection',socket=>{if(closing||sockets.size>=config.maxSockets||!connections.consume()){lost++;socket.destroy();return;}const state={id:randomUUID(),requests:0,created:Date.now(),bytes:0};sockets.set(socket,state);socket.setTimeout(5000,()=>socket.destroy());socket.on('close',()=>{sockets.delete(socket);void track(record(base(state.id,'tcp_error','internal','closed',socket))).catch(()=>{lost++;});});});
 server.on('clientError',(error,socket)=>{const s=socket as Socket;const state=sockets.get(s);if(state)void track(record({...base(state.id,'tcp_error','in','parser_error',s),captureStatus:'unavailable',observations:['invalid_frame']})).catch(()=>{lost++;});socket.destroy();});
 server.on('request',(req,res)=>{
  const state=sockets.get(req.socket);if(!state||closing||!requests.consume()){req.socket.destroy();return;}
  const id=randomUUID();let size=0,held=0,aborted=false;const chunks:Buffer[]=[];const timer=setTimeout(()=>req.destroy(),10000);
  const release=()=>{clearTimeout(timer);inbound.release(held);held=0;};
  req.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>16384||!inbound.reserve(chunk.length)){aborted=true;req.destroy();return;}held+=chunk.length;chunks.push(chunk);});
  req.on('error',()=>{});
  req.on('aborted',()=>{aborted=true;clearTimeout(timer);void track(record({...base(id,'http','in','body_aborted',req.socket),payload:Buffer.concat(chunks),captureStatus:'prefix_only',observedBytes:size})).catch(()=>{lost++;}).finally(release);});
  req.on('end',()=>{void track((async()=>{try{if(aborted)return;await record({...base(id,'http','in','body_complete',req.socket),payload:Buffer.concat(chunks),observedBytes:size,captureStatus:'complete',claimedIdentity:{method:req.method,path:req.url,headers:req.rawHeaders}});
    const status=req.url==='/'&&(req.method==='GET'||req.method==='HEAD')?200:404;
    const content=status===200?landing:Buffer.from('Not Found');const body=req.method==='HEAD'?Buffer.alloc(0):content;
    const prepared=await record({...base(id,'http','out','response_prepared',req.socket),payload:body,sendStatus:'prepared'});
    res.writeHead(status,{'Content-Type':status===200?'text/html; charset=utf-8':'text/plain; charset=utf-8','Content-Length':content.length,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});
    await new Promise<void>((resolve,reject)=>{res.once('error',reject);res.once('close',()=>{if(!res.writableFinished)reject(Error('response aborted'));});res.end(body,resolve);});
    await record({...base(id,'http','internal','send_outcome',req.socket),relatedEventId:prepared.eventId,sendStatus:'send_callback_success'});await record(base(id,'http','internal','closed',req.socket));
   }catch{lost++;req.socket.destroy();}finally{release();}})());});
 });
 server.on('upgrade',(req,socket,head)=>{const s=socket as Socket;const state=sockets.get(s);if(!state||closing||req.url!=='/'||!requests.consume()){socket.destroy();return;}
  socket.pause();void track((async()=>{try{await record({...base(state.id,'http','in','upgrade',s),captureStatus:'complete',claimedIdentity:{method:req.method,path:req.url,headers:req.rawHeaders}});wss.handleUpgrade(req,socket,head,ws=>{s.setTimeout(0);wss.emit('connection',ws,req);});socket.resume();}catch{lost++;socket.destroy();}})());
 });
 wss.on('connection',(ws,req)=>{
  const state=sockets.get(req.socket)!;let connected=false,access:AccessDecision={allowed:false,reason:'missing_token',claimedScopes:[]},active=false,lastInput=Date.now();const ids=new Set<string>();const queue:Buffer[]=[];const rate=new TokenBucket(20,40);let pendingBytes=0;
  const handshake=setTimeout(()=>ws.close(1008,'connect required'),config.handshakeMs);
  const lifetime=setTimeout(()=>ws.close(1008,'session limit'),config.lifetimeMs);
  const idle=setInterval(()=>{if(Date.now()-lastInput>=config.idleMs)ws.close(1008,'idle timeout');},Math.min(config.idleMs,1000));
  async function send(frame:unknown,metadata:Partial<EvidenceInput>={}){const bytes=Buffer.from(JSON.stringify(frame));if(bytes.length>1048576||ws.bufferedAmount+bytes.length>1048576||!outbound.reserve(bytes.length))throw Error('outbound capacity');try{const prepared=await record({...base(state.id,'websocket','out','response_prepared',req.socket),payload:bytes,sendStatus:'prepared',...metadata});await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('send timeout')),2000);ws.send(bytes,{binary:false},error=>{clearTimeout(timeout);error?reject(error):resolve();});});await record({...base(state.id,'websocket','internal','send_outcome',req.socket),relatedEventId:prepared.eventId,sendStatus:'send_callback_success'});}finally{outbound.release(bytes.length);}}
  const tick=setInterval(()=>{if(connected&&ws.readyState===WebSocket.OPEN)void track(send({type:'event',event:'tick',payload:{ts:clock.now()}})).catch(()=>ws.terminate());},config.tickMs);
  ws.on('error',()=>{void track(record({...base(state.id,'websocket','in','invalid_frame',req.socket),captureStatus:'unavailable',observations:['invalid_frame']})).catch(()=>{lost++;});});
  ws.on('close',()=>{clearTimeout(handshake);clearTimeout(lifetime);clearInterval(idle);clearInterval(tick);for(const buffer of queue)inbound.release(buffer.length);queue.length=0;});
  async function pump(){if(active)return;active=true;try{while(queue.length&&ws.readyState===WebSocket.OPEN){const buffer=queue.shift()!;pendingBytes-=buffer.length;try{
    let frame:Record<string,any>;try{frame=JSON.parse(buffer.toString('utf8'));}catch{await record({...base(state.id,'websocket','in','invalid_frame',req.socket),payload:buffer,parseStatus:'invalid',observations:['invalid_frame']});ws.close(1008,'invalid JSON');continue;}
    const valid=validateFrame(frame);const fields=frame!==null&&typeof frame==='object'&&!Array.isArray(frame)?frame:{};
    await record({...base(state.id,'websocket','in','wire_input',req.socket),payload:buffer,captureStatus:'complete',observedBytes:buffer.length,parseStatus:valid.ok?'valid':'invalid',requestId:typeof fields.id==='string'?fields.id:null,method:(METHODS as readonly unknown[]).includes(fields.method)?fields.method:'unknown',rawMethod:typeof fields.method==='string'?fields.method:null});
    if(!valid.ok){ws.close(1008,'invalid request frame');continue;}
    if(ids.has(frame.id)){await send({type:'res',id:frame.id,ok:false,error:{code:'INVALID_REQUEST',message:'duplicate request id'}});ws.close(1008,'duplicate request id');continue;}ids.add(frame.id);
    if(!connected){
     if(frame.method!=='connect'||!validateParams('connect',frame.params).ok){ws.close(1008,'invalid connect');continue;}
     const p=frame.params;if(p.minProtocol>3||p.maxProtocol<3){await send({type:'res',id:frame.id,ok:false,error:{code:'INVALID_REQUEST',message:'protocol mismatch',details:{expectedProtocol:3}}});ws.close(1002,'protocol mismatch');continue;}
     access=decideAccess(p,policy);if(!access.allowed){await send({type:'res',id:frame.id,ok:false,error:{code:'INVALID_REQUEST',message:access.reason==='invalid_role'?'invalid role':'unauthorized: gateway token mismatch (open a tokenized dashboard URL or paste token in Control UI settings)'}});ws.close(1008,'unauthorized');continue;}
     connected=true;clearTimeout(handshake);
     const health=dispatch('health',{},world,access,clock),presence=dispatch('system-presence',{},world,access,clock);
     const hello={type:'hello-ok',protocol:3,server:{version:'2026.1.29',host:world.host,connId:state.id},features:{methods:[...METHODS],events:['connect.challenge','tick']},snapshot:{presence:presence.ok?presence.payload:[],health:health.ok?health.payload:{},stateVersion:{presence:1,health:1},uptimeMs:Math.max(0,clock.now()-world.syntheticBootAtMs),configPath:'/state/openclaw.json',stateDir:'/state',sessionDefaults:{defaultAgentId:'main',mainKey:'main',mainSessionKey:'agent:main:main',scope:'per-sender'}},policy:{maxPayload:262144,maxBufferedBytes:1048576,tickIntervalMs:config.tickMs}};
     if(!validateNamed('HelloOk',hello).ok)throw Error('invalid hello');await send({type:'res',id:frame.id,ok:true,payload:hello},{access});
    }else if(frame.method==='connect'){await send({type:'res',id:frame.id,ok:false,error:{code:'INVALID_REQUEST',message:'already connected'}});ws.close(1008,'already connected');}
    else{const result=dispatch(frame.method,frame.params??{},world,access,clock);const {observations,...wire}=result;await send({type:'res',id:frame.id,...wire},{observations,access});}
   }catch{ws.terminate();}finally{inbound.release(buffer.length);}}}finally{active=false;}}
  ws.on('message',(data,isBinary)=>{if(isBinary){ws.close(1003,'text only');return;}const buffer=Buffer.isBuffer(data)?data:Buffer.from(data as ArrayBuffer);lastInput=Date.now();state.bytes+=buffer.length;
   if(state.bytes>config.maxConnectionBytes||queue.length>=32||!rate.consume()||!inbound.reserve(buffer.length)){ws.close(1008,'resource limit');return;}queue.push(buffer);pendingBytes+=buffer.length;void track(pump());});
  void track(send({type:'event',event:'connect.challenge',payload:{nonce:randomBytes(32).toString('hex'),ts:clock.now()}})).catch(()=>ws.terminate());
 });
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,resolve);});const port=(server.address() as {port:number}).port;
 return {port,stats:()=>({connections:sockets.size,lost,inboundBytes:inbound.used,outboundBytes:outbound.used}),close(){if(closePromise)return closePromise;closing=true;closePromise=(async()=>{for(const socket of sockets.keys())socket.destroy();await new Promise<void>(resolve=>server.close(()=>resolve()));await Promise.race([Promise.allSettled([...jobs]),new Promise(resolve=>{const timer=setTimeout(resolve,3000);timer.unref();})]);wss.close();})();return closePromise;}};
}
