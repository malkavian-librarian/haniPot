import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkReadiness} from '../../src/config.js';
test('public deployment requires fresh explicit evidence for every boundary',()=>{
 assert.throws(()=>checkReadiness({}));
 const report={issuedAtMs:Date.now(),profileId:'openclaw-2026.1.29-v3',firewall:true,hardQuota:true,saturation:true,tls:true};
 assert.doesNotThrow(()=>checkReadiness(report));assert.throws(()=>checkReadiness({...report,firewall:false}));assert.throws(()=>checkReadiness({...report,issuedAtMs:1}));
});
