import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {startGateway} from '../../src/gateway/server.js';
import {openRecorder} from '../../src/evidence/recorder.js';
import {referenceWorldFromDataset} from '../../src/world/generate.js';
function probe(url:string,out:string,reference=false):Promise<number|null>{return new Promise(resolveExit=>{const child=spawn(process.execPath,[resolve('tools/probe-gateway.mjs'),'--url',url,'--out',out,...(reference?['--reference-report',resolve('tests/fixtures/openclaw/reference.json')]:[])],{stdio:'ignore'});child.on('exit',resolveExit);});}
test('independent probe compares canonical gateway and rejects a title-only lookalike',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-discovery-'));const recorder=await openRecorder({dataDir:dir});const gateway=await startGateway({world:referenceWorldFromDataset(),recorder,policy:{kind:'open-control'},config:{port:0}});
 const fake=createServer((_req,res)=>res.end('<title>OpenClaw Control</title><openclaw-app>'));
 await new Promise<void>(resolveListen=>fake.listen(0,'127.0.0.1',resolveListen));
 try {assert.equal(await probe(`ws://127.0.0.1:${gateway.port}`,join(dir,'probe.json'),true),0);assert.notEqual(await probe(`ws://127.0.0.1:${(fake.address() as {port:number}).port}`,join(dir,'fake.json')),0);}
 finally{fake.closeAllConnections();await new Promise<void>(resolveClose=>fake.close(()=>resolveClose()));await gateway.close();await recorder.close();await rm(dir,{recursive:true,force:true});}
});
