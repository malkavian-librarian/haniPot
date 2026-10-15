import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const address = process.argv[2] ?? 'ws://127.0.0.1:18789';
const target = new URL(address);
if (!['127.0.0.1','localhost','[::1]','reference'].includes(target.hostname) || target.protocol!=='ws:') throw Error('Only isolated reference or loopback targets are allowed');
const output = process.argv[3] ?? 'artifacts/reference/reference.json';
const sleep = ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connect(overrides={}) {
  const socket = new WebSocket(address);
  const transcript=[]; const pending=new Map(); let hello;
  const ready = new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.close();reject(Error('reference connect timeout'));},5000);
    socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('reference connection failed'));});
    socket.addEventListener('message',({data})=>{
      const frame=JSON.parse(String(data)); transcript.push({direction:'in',frame});
      if(frame.event==='connect.challenge') {
        const request={type:'req',id:'connect',method:'connect',params:{minProtocol:3,maxProtocol:3,client:{id:'openclaw-control-ui',version:'2026.1.29',platform:'linux',mode:'webchat'},role:'operator',scopes:['operator.admin'],auth:{token:'hanipot-reference-only-nonfunctional-token'},...overrides}};
        transcript.push({direction:'out',frame:request});socket.send(JSON.stringify(request));
      } else if(frame.id==='connect') { clearTimeout(timer); hello=frame; resolve(); }
      else if(frame.type==='res' && pending.has(frame.id)) {pending.get(frame.id)(frame);pending.delete(frame.id);}
    });
  });
  await ready;
  return {socket, transcript, hello, async call(method,params={}) {
    const id=`request-${transcript.length}`;
    const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('RPC timeout'));},5000);pending.set(id,frame=>{clearTimeout(timer);resolve(frame);});});
    const frame={type:'req',id,method,params};transcript.push({direction:'out',frame});socket.send(JSON.stringify(frame));return result;
  }};
}
let client;
for(let attempt=0;attempt<120;attempt++) {try {client=await connect();break;} catch(error) {if(attempt===119) throw error;await sleep(1000);}}
try {
 assert.equal(client.hello.ok,true);
 const results={};
 for(const [method,params] of [['health',{}],['system-presence',{}],['agents.list',{}],['models.list',{}],['skills.status',{}],['config.get',{}],['sessions.list',{includeLastMessage:true}],['chat.history',{sessionKey:'agent:main:main'}],['does.not.exist',{}],['chat.history',{}]]) {
   const response=await client.call(method,params);results[method+(method==='chat.history'&&!params.sessionKey?'.invalid':'')]=response;
 }
 assert.ok(results['chat.history'].payload.messages.length>0,'Seeded history must be readable');
 const badToken=await connect({auth:{token:'deliberately-wrong-reference-token'}});
 const wrongToken=badToken.hello;badToken.socket.close();
 const badVersion=await connect({minProtocol:4,maxProtocol:4});
 const wrongVersion=badVersion.hello;badVersion.socket.close();
 const tickDeadline=Date.now()+client.hello.payload.policy.tickIntervalMs+5000;
 while(!client.transcript.some(e=>e.frame.event==='tick') && Date.now()<tickDeadline) await sleep(100);
 const report={sourceCommit:'77e703c69b07a236c2f0962bd195e03aae1b8da0',capturedAt:new Date().toISOString(),hello:client.hello,results,wrongToken,wrongVersion,transcript:client.transcript};
 await writeFile(output,JSON.stringify(report,null,2));
 console.log('Captured reference fixtures');
} finally {client?.socket.close();}
