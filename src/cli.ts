import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {checkReadiness} from './config.js';
import {acquireLease,loadOrCreateWorld,reprovisionWorld,recoverLease} from './world/store.js';
import {openRecorder} from './evidence/recorder.js';
import {exportSafe,exportRaw} from './operator/export.js';
import {startGateway} from './gateway/server.js';
export async function runCli(argv:string[]){
 const command=argv[0];const {values}=parseArgs({args:argv.slice(1),options:{'data-dir':{type:'string',default:'data'},host:{type:'string',default:process.env.HANIPOT_BIND??'127.0.0.1'},port:{type:'string',default:'18789'},policy:{type:'string',default:'open-control'},raw:{type:'boolean'},'acknowledge-stopped':{type:'boolean'},public:{type:'boolean'},'deployment-report':{type:'string'}},strict:true});
 if(!['provision','serve','reprovision','export','replay','check','recover'].includes(command))throw Error('unknown command');
 if(values.public){if(!values['deployment-report'])throw Error('readiness report required');checkReadiness(JSON.parse(await readFile(values['deployment-report'],'utf8')));}
 const dataDir=resolve(values['data-dir']!);const clock={now:Date.now};
 if(command==='recover'){await recoverLease(dataDir,values['acknowledge-stopped']);console.log(JSON.stringify({recovered:true}));return;}
 const lease=await acquireLease(dataDir);
 try {
  const world=command==='reprovision'?await reprovisionWorld(dataDir,clock):await loadOrCreateWorld(dataDir,clock);
  if(command==='provision'||command==='reprovision'){console.log(JSON.stringify({worldId:world.worldId,profileId:world.profileId}));return;}
  const recorder=await openRecorder({dataDir});
  try{
   if(command==='check'){console.log(JSON.stringify({worldId:world.worldId,profileId:world.profileId,storage:await recorder.health(),publicReady:false}));return;}
   if(command==='export'||command==='replay'){
    let cursor=0;while(true){const events=await recorder.readEvents(32,cursor);if(!events.length)break;for(const event of events){const output=command==='replay'||values.raw?exportRaw(event):exportSafe(event);if(!process.stdout.write(JSON.stringify(output)+'\n'))await once(process.stdout,'drain');cursor=event.rowId;}}return;
   }
   const port=Number(values.port);if(!Number.isInteger(port)||port<0||port>65535)throw Error('invalid port');
   if(!['open-control','token-gated'].includes(values.policy!))throw Error('invalid policy');
   const policy=values.policy==='token-gated'?{kind:'token-gated' as const,token:world.token,grants:['operator.admin']}:{kind:'open-control' as const};
   const server=await startGateway({world,recorder,policy,config:{host:values.host!,port}});
   console.log(JSON.stringify({listening:true,host:values.host,port:server.port,worldId:world.worldId}));
   let stop!:()=>void;const stopped=new Promise<void>(resolve=>{stop=resolve;});let failed=false;
   const onSignal=()=>stop();process.once('SIGTERM',onSignal);process.once('SIGINT',onSignal);
   const maintenance=setInterval(()=>{void recorder.maintain().then(result=>{if(!result.accepting){failed=true;stop();}}).catch(()=>{failed=true;stop();});},30000);
   try{await stopped;}finally{clearInterval(maintenance);process.removeListener('SIGTERM',onSignal);process.removeListener('SIGINT',onSignal);await server.close();}
   if(failed)throw Error('recorder unavailable');
  }finally{await recorder.close();}
 }finally{await lease.release();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){runCli(process.argv.slice(2)).catch(error=>{console.error(JSON.stringify({error:'operation_failed',code:(error as NodeJS.ErrnoException).code??'INVALID_OPERATION'}));process.exitCode=1;});}
