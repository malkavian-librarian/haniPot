import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFrame,validateParams,validateResult,validateNamed} from '../../src/profile/validate.js';
test('rejects generic JSON-RPC and invalid gateway params',()=>{
 assert.equal(validateFrame({jsonrpc:'2.0',id:1,method:'health'}).ok,false);
 assert.equal(validateParams('chat.history',{}).ok,false);
 assert.equal(validateParams('chat.history',{sessionKey:'agent:main:main'}).ok,true);
 assert.equal(validateParams('agents.list',{unexpected:true}).ok,false);
});
test('validates source-backed reference hello and typed results',()=>{
 const reference=JSON.parse(readFileSync('tests/fixtures/openclaw/reference.json','utf8'));
 assert.equal(validateNamed('HelloOk',reference.hello.payload).ok,true);
 assert.equal(validateResult('agents.list',reference.results['agents.list'].payload).ok,true);
 // The pinned handler emits an extra input field absent from its own strict schema.
 assert.equal(validateResult('models.list',reference.results['models.list'].payload).ok,false);
 const projected={models:reference.results['models.list'].payload.models.map(({input,...model}:Record<string,unknown>)=>model)};
 assert.equal(validateResult('models.list',projected).ok,true);
 assert.equal(validateResult('agents.list',{}).ok,false);
});
