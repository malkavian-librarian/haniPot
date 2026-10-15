import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decideAccess} from '../../src/gateway/policy.js';
import {dispatch} from '../../src/gateway/dispatch.js';
import {referenceWorldFromDataset} from '../../src/world/generate.js';
const world=referenceWorldFromDataset(), clock={now:()=>1790000000000};
test('token policy separates read and admin without trusting device claims',()=>{
 const policy={kind:'token-gated' as const,token:world.token,grants:['operator.read']};
 assert.equal(decideAccess({role:'operator',auth:{token:'wrong'}},policy).allowed,false);
 const access=decideAccess({role:'operator',auth:{token:world.token},scopes:['operator.admin'],device:{id:'forged'}},policy);
 assert.ok(access.allowed);assert.equal(access.deviceVerified,false);
 assert.equal(dispatch('config.get',{},world,access,clock).ok,false);
 assert.equal(dispatch('agents.list',{},world,access,clock).ok,true);
 assert.equal(decideAccess({role:'node'},{kind:'open-control'}).allowed,false);
});
test('all eight read methods use consistent synthetic state',()=>{
 const access=decideAccess({},{kind:'open-control'});
 for(const method of ['health','system-presence','agents.list','models.list','skills.status','config.get','sessions.list'])assert.equal(dispatch(method,{},world,access,clock).ok,true,method);
 const history=dispatch('chat.history',{sessionKey:world.sessions[0].key,limit:1},world,access,clock);assert.ok(history.ok);assert.equal((history.payload as {messages:unknown[]}).messages.length,1);
 const list=dispatch('sessions.list',{search:'Invoices',includeLastMessage:true},world,access,clock);assert.ok(list.ok);assert.equal((list.payload as {count:number}).count,1);
 assert.equal(dispatch('version',{},world,access,clock).ok,false);
 assert.equal(dispatch('chat.history',{},world,access,clock).ok,false);
 assert.equal(dispatch('agents.list',JSON.parse('{"__proto__":{}}'),world,access,clock).ok,false);
});
