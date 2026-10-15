import {mkdir,writeFile} from 'node:fs/promises';
import {startGateway} from '../dist/src/gateway/server.js';
import {referenceWorldFromDataset} from '../dist/src/world/generate.js';
import {openRecorder} from '../dist/src/evidence/recorder.js';
const port=Number(process.argv[2]??18789);if(![18789,18890].includes(port))throw Error('Fixture port must be 18789 or 18890');
const dataDir=`artifacts/discovery/state-${port}`;await mkdir(dataDir,{recursive:true});
const recorder=await openRecorder({dataDir});const server=await startGateway({world:referenceWorldFromDataset(),recorder,policy:{kind:'open-control'},config:{port}});
await writeFile(`artifacts/discovery/fixture-${port}.json`,JSON.stringify({port,pid:process.pid}));console.log(`Discovery fixture ready on loopback ${port}`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void server.close().then(()=>recorder.close());});
