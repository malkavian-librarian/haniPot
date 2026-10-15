import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ByteBudget,TokenBucket} from '../../src/gateway/limits.js';
test('byte reservation and rate refill cannot exceed budgets',()=>{
 const bytes=new ByteBudget(10);assert.equal(bytes.reserve(8),true);assert.equal(bytes.reserve(3),false);bytes.release(8);assert.equal(bytes.used,0);
 const rate=new TokenBucket(20,40,0);for(let i=0;i<40;i++)assert.ok(rate.consume(0));assert.equal(rate.consume(0),false);assert.ok(rate.consume(50));
});
