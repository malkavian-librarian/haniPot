import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('compiled CLI works from another directory and refuses an active lease',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hanipot-cli-'));const cli=resolve('dist/src/cli.js');
 const run=(...args:string[])=>spawnSync(process.execPath,[cli,...args,'--data-dir',join(dir,'state with spaces')],{cwd:dir,encoding:'utf8'});
 try {let result=run('provision');assert.equal(result.status,0,result.stderr);const first=JSON.parse(await readFile(join(dir,'state with spaces/world.json'),'utf8'));result=run('reprovision');assert.equal(result.status,0,result.stderr);const second=JSON.parse(await readFile(join(dir,'state with spaces/world.json'),'utf8'));assert.notEqual(first.worldId,second.worldId);assert.equal(run('check').status,0);assert.equal(run('nonsense').status,1);}finally{await rm(dir,{recursive:true,force:true});}
});
