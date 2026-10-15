import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function sanitize(value) {
 if(Array.isArray(value)) return value.map(sanitize);
 if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,
   key==='host'?'reference-host':key==='connId'?'reference-connection':key==='nonce'?'reference-nonce':sanitize(item)]));
 return value;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const input=await readFile('artifacts/reference/reference.json','utf8');
 const output=JSON.stringify(sanitize(JSON.parse(input)),null,2)+'\n';
 await mkdir('tests/fixtures/openclaw',{recursive:true});
 await writeFile('tests/fixtures/openclaw/reference.json',output);
 await writeFile('tests/fixtures/openclaw/capture-provenance.json',JSON.stringify({sourceCommit:'77e703c69b07a236c2f0962bd195e03aae1b8da0',rawSha256:createHash('sha256').update(input).digest('hex'),sanitizedSha256:createHash('sha256').update(output).digest('hex'),normalization:{host:'reference-host',connId:'reference-connection',nonce:'reference-nonce'},syntheticCredentialInventory:['hanipot-reference-only-nonfunctional-token','deliberately-wrong-reference-token']},null,2)+'\n');
}
