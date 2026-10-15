import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateWorld,validateWorld,referenceWorldFromDataset} from '../../src/world/generate.js';
test('world is deterministic, varied and referentially valid',()=>{
 const input={seed:'world-a',generatedAtMs:1790000000000,worldId:'world-a'};
 const a=generateWorld(input);assert.deepEqual(a,generateWorld(input));
 assert.notEqual(a.owner,generateWorld({...input,seed:'world-b'}).owner);
 assert.equal(a.sessions.length,6);assert.equal(validateWorld(a).worldHash,a.worldHash);
 const broken=structuredClone(a);broken.sessions[0].agentId='missing';assert.throws(()=>validateWorld(broken));
});
test('canonical differential world preserves reference sessions',()=>{
 const world=referenceWorldFromDataset();assert.equal(world.sessions[0].key,'agent:main:main');
 assert.equal(world.sessions[0].messages[1].content[0].text,'Juniper Supply has three pending supplier invoices.');
});
