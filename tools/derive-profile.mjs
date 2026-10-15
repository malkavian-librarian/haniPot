import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {ProtocolSchemas}=await import('/app/dist/gateway/protocol/schema.js');
const output=process.argv[2]??'/captures/schemas';
await mkdir(output,{recursive:true});
const hashes={};
for(const [name,schema] of Object.entries(ProtocolSchemas)) {
 const body=JSON.stringify(schema,null,2)+'\n';
 await writeFile(`${output}/${name}.json`,body);
 hashes[name]=createHash('sha256').update(body).digest('hex');
}
await writeFile(`${output}/provenance.json`,JSON.stringify({sourceCommit:'77e703c69b07a236c2f0962bd195e03aae1b8da0',hashes},null,2));
