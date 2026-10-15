import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openRecorder} from '../../src/evidence/recorder.js';
const ref={worldId:'test-world',worldHash:'a'.repeat(64),profileId:'test'};
test('writer persists bytes, allocates sequences and reopens',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-evidence-'));
 try{let r=await openRecorder({dataDir:dir});const a=await r.append({world:ref,connectionId:'connection-a',kind:'wire_input',direction:'in',transport:'websocket',timestampMs:1,payload:Buffer.from([255,0,27])});const b=await r.append({world:ref,connectionId:'connection-a',kind:'closed',direction:'internal',transport:'websocket',timestampMs:2});assert.equal(b.sequence,a.sequence+1);await r.close();r=await openRecorder({dataDir:dir});const events=await r.readEvents();assert.equal(events.length,2);assert.deepEqual(Buffer.from(events[0].payload!),Buffer.from([255,0,27]));await r.close();}
 finally{await rm(dir,{recursive:true,force:true});}
});
test('bounded recorder rejects oversized queued evidence',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-budget-'));const r=await openRecorder({dataDir:dir,maxQueuedBytes:64});
 try{await assert.rejects(r.append({world:ref,connectionId:'x',kind:'wire_input',direction:'in',transport:'websocket',timestampMs:1,payload:Buffer.alloc(1024)}),/capacity/);}finally{await r.close();await rm(dir,{recursive:true,force:true});}
});
