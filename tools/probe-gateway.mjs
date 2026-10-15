import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
const {values}=parseArgs({options:{url:{type:'string'},out:{type:'string'},'reference-report':{type:'string'},token:{type:'string'}}});
const target=new URL(values.url??'ws://127.0.0.1:18789');
if(!['ws:','wss:'].includes(target.protocol)||!['127.0.0.1','localhost','[::1]'].includes(target.hostname))throw Error('Probe restricted to explicit loopback targets');
const output=values.out??'artifacts/discovery/gateway.json';
const socket=new WebSocket(target);const pending=new Map();let challenge;let next=0;
const ready=new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{socket.close();reject(Error('handshake timeout'));},5000);
 socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WebSocket unavailable'));});
 socket.addEventListener('message',({data})=>{try{const frame=JSON.parse(String(data));
  if(frame.event==='connect.challenge'){assert.equal(frame.type,'event');assert.equal(typeof frame.payload.nonce,'string');assert.ok(frame.payload.nonce.length>=16);challenge=frame;socket.send(JSON.stringify({type:'req',id:'connect',method:'connect',params:{minProtocol:3,maxProtocol:3,client:{id:'openclaw-control-ui',version:'2026.1.29',platform:'linux',mode:'webchat'},role:'operator',scopes:['operator.admin'],...(values.token?{auth:{token:values.token}}:{})}}));}
  else if(frame.id==='connect'){clearTimeout(timer);resolve(frame);}
  else if(pending.has(frame.id)){pending.get(frame.id)(frame);pending.delete(frame.id);}
 }catch(error){clearTimeout(timer);reject(error);socket.close();}});
});
async function call(method,params={}){const id=`probe-${++next}`;const promise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('method timeout'));},5000);pending.set(id,frame=>{clearTimeout(timer);resolve(frame);});});socket.send(JSON.stringify({type:'req',id,method,params}));return promise;}
try{
 const hello=await ready;assert.equal(hello.ok,true);assert.equal(hello.payload.type,'hello-ok');assert.equal(hello.payload.protocol,3);assert.equal(typeof hello.payload.server.connId,'string');assert.ok(Array.isArray(hello.payload.features.methods));assert.ok(hello.payload.snapshot.health);assert.ok(hello.payload.policy.maxPayload>0);
 const results={};for(const method of ['health','system-presence','agents.list','models.list','skills.status','config.get','sessions.list']){const params=method==='sessions.list'?{includeLastMessage:true}:{};results[method]=await call(method,params);assert.equal(results[method].ok,true,method);}
 const first=results['sessions.list'].payload.sessions[0];assert.ok(first.key);results['chat.history']=await call('chat.history',{sessionKey:first.key});assert.ok(results['chat.history'].payload.messages.length>0);
 assert.equal(results['agents.list'].payload.defaultId,'main');assert.equal(results['sessions.list'].payload.count,6);assert.equal(results['config.get'].payload.parsed.agents.list[0].name,results['agents.list'].payload.agents[0].name);
 assert.equal((await call('does.not.exist')).ok,false);assert.equal((await call('chat.history')).ok,false);
 const comparisons=[];
 if(values['reference-report']){const reference=JSON.parse(await readFile(values['reference-report'],'utf8'));
  for(const method of ['agents.list','chat.history']){assert.deepEqual(results[method].payload,reference.results[method].payload,method+' differential');comparisons.push(method);}
  assert.deepEqual(results['config.get'].payload.parsed,reference.results['config.get'].payload.parsed);assert.equal(results['config.get'].payload.hash,reference.results['config.get'].payload.hash);comparisons.push('config.get raw/parsed/hash');
  assert.deepEqual(results['sessions.list'].payload.sessions,reference.results['sessions.list'].payload.sessions);comparisons.push('sessions.list records');
 }
 await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify({ok:true,evidenceLevel:'historical-protocol-subset',challengeObserved:!!challenge,comparisons,methods:Object.keys(results),hello,results},null,2));
 console.log(JSON.stringify({ok:true,methods:8,comparisons}));
}catch(error){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify({ok:false,evidenceLevel:'not-confirmed',error:error.message}));console.error(error.message);process.exitCode=1;}finally{socket.close();}
