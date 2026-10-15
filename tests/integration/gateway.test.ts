import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startGateway} from '../../src/gateway/server.js';
import {openRecorder} from '../../src/evidence/recorder.js';
import {referenceWorldFromDataset} from '../../src/world/generate.js';
import {validateNamed} from '../../src/profile/validate.js';
test('real HTTP and WebSocket journey is captured and profile-valid',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-gateway-'));const recorder=await openRecorder({dataDir:dir});
 const server=await startGateway({world:referenceWorldFromDataset(),recorder,policy:{kind:'open-control'},config:{port:0}});
 try{
 const response=await fetch(`http://127.0.0.1:${server.port}/`);assert.equal(response.status,200);assert.match(await response.text(),/<title>OpenClaw Control/);
 const head=await fetch(`http://127.0.0.1:${server.port}/`,{method:'HEAD'});assert.equal((await head.text()).length,0);
 assert.equal((await fetch(`http://127.0.0.1:${server.port}/mcp`)).status,404);
 const socket=new WebSocket(`ws://127.0.0.1:${server.port}`);
 const frames:Record<string,any>[]=[];
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('journey timeout')),5000);socket.addEventListener('error',()=>reject(Error('socket error')));socket.addEventListener('message',({data})=>{const frame=JSON.parse(String(data));frames.push(frame);if(frame.event==='connect.challenge')socket.send(JSON.stringify({type:'req',id:'connect',method:'connect',params:{minProtocol:3,maxProtocol:3,client:{id:'openclaw-control-ui',version:'2026.1.29',platform:'linux',mode:'webchat'},role:'operator'}}));else if(frame.id==='connect'){assert.equal(frame.ok,true);assert.equal(validateNamed('HelloOk',frame.payload).ok,true);socket.send(JSON.stringify({type:'req',id:'history',method:'chat.history',params:{sessionKey:'agent:main:main'}}));}else if(frame.id==='history'){assert.equal(frame.payload.messages.length,2);clearTimeout(timer);socket.close();resolve();}});});
 await server.close();const events=await recorder.readEvents();assert.ok(events.some(e=>e.method==='chat.history'));assert.ok(events.some(e=>e.transport==='http'));assert.ok(events.some(e=>e.sendStatus==='send_callback_success'));
 }finally{await server.close();await recorder.close();await rm(dir,{recursive:true,force:true});}
});
test('record failure prevents a successful HTTP response',async()=>{
 const recorder={append:async()=>{throw Error('disk failed');},close:async()=>{},maintain:async()=>({accepting:false,deletedConnections:0}),health:async()=>({accepting:false,queuedBytes:0,usedBytes:0}),readEvents:async()=>[]};
 const server=await startGateway({world:referenceWorldFromDataset(),recorder,policy:{kind:'open-control'},config:{port:0}});
 try{await assert.rejects(fetch(`http://127.0.0.1:${server.port}/`));}finally{await server.close();}
});
