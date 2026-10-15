import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sanitize} from '../../tools/sanitize-reference.mjs';
test('normalisation removes ephemeral host identity without altering business data',()=>{
 const input={host:'container-identity',connId:'random',payload:{business:'Juniper Supply',sessionId:'reference-main',nonce:'random-nonce'}};
 assert.deepEqual(sanitize(input),{host:'reference-host',connId:'reference-connection',payload:{business:'Juniper Supply',sessionId:'reference-main',nonce:'reference-nonce'}});
 assert.equal(input.host,'container-identity');
});
