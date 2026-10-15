import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadOrCreateWorld,reprovisionWorld,acquireLease} from '../../src/world/store.js';
test('restart preserves identity, lease excludes concurrent writers, reprovision archives',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-world-'));
 try {const clock={now:()=>1790000000000};const a=await loadOrCreateWorld(dir,clock);const b=await loadOrCreateWorld(dir,clock);assert.equal(a.worldHash,b.worldHash);
 const lease=await acquireLease(dir);await assert.rejects(acquireLease(dir));await lease.release();
 const c=await reprovisionWorld(dir,clock);assert.notEqual(c.worldId,a.worldId);
 await writeFile(join(dir,'world.json'),'{}');await assert.rejects(loadOrCreateWorld(dir,clock));
 }finally{await rm(dir,{recursive:true,force:true});}
});
