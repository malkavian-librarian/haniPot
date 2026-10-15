import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportSafe} from '../../src/operator/export.js';
test('safe export excludes secrets in arbitrary fields and unknown enum values',()=>{
 const secret='private-value';const line=exportSafe({eventId:'0bbecf0a-83e0-48a5-9c51-bec598ed319a',rowId:1,sequence:1,world:{worldId:secret,worldHash:secret,profileId:secret},connectionId:secret,kind:secret,direction:'in',transport:'websocket',timestampMs:1,requestId:secret,rawMethod:secret,method:'unknown',claimedIdentity:{displayName:secret},payload:Buffer.from(secret)});
 assert.equal(JSON.stringify(line).includes(secret),false);assert.equal(line.method,'unknown');
});
