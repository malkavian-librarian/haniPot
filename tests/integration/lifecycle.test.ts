import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {connect} from 'node:net';
import {openRecorder} from '../../src/evidence/recorder.js';
import {referenceWorldFromDataset} from '../../src/world/generate.js';
import {startGateway} from '../../src/gateway/server.js';
test('compact world references, parser errors and expired sockets are recorded',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-life-'));const r=await openRecorder({dataDir:dir});const server=await startGateway({world:referenceWorldFromDataset(),recorder:r,policy:{kind:'open-control'},config:{port:0,handshakeMs:30,idleMs:60}});
 try{const socket=new WebSocket(`ws://127.0.0.1:${server.port}`);await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('expiry timeout')),3000);socket.addEventListener('close',()=>{clearTimeout(timer);resolve();});socket.addEventListener('error',()=>{});});
 await new Promise<void>(resolve=>{const tcp=connect(server.port,'127.0.0.1',()=>tcp.write('INVALID REQUEST\r\n\r\n'));tcp.on('error',()=>{});tcp.on('close',()=>resolve());});
 await server.close();const events=await r.readEvents();assert.ok(events.some(e=>e.kind==='parser_error'));assert.deepEqual(Object.keys(events[0].world).sort(),['profileId','worldHash','worldId']);
 }finally{await server.close();await r.close();await rm(dir,{recursive:true,force:true});}
});
test('retention removes expired closed evidence, preserving active records',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-retention-'));const r=await openRecorder({dataDir:dir});const world=referenceWorldFromDataset();
 try{await r.append({world,connectionId:'expired',kind:'closed',direction:'internal',transport:'http',timestampMs:1});await r.append({world,connectionId:'active',kind:'wire_input',direction:'in',transport:'websocket',timestampMs:Date.now()});const result=await r.maintain();assert.equal(result.deletedConnections,1);assert.equal((await r.readEvents()).length,1);}finally{await r.close();await rm(dir,{recursive:true,force:true});}
});
