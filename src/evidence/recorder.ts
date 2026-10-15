import {Worker} from 'node:worker_threads';
import {mkdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import type {Recorder,RecorderOptions,EvidenceInput,StoredEvent} from './types.js';
export async function openRecorder(options:RecorderOptions):Promise<Recorder>{
 const dataDir=resolve(options.dataDir);await mkdir(dataDir,{recursive:true});
 if((await lstat(dataDir)).isSymbolicLink())throw Error('unsafe data directory');
 for(const name of ['evidence.db','evidence.db-wal','evidence.db-shm']){try{if((await lstat(join(dataDir,name))).isSymbolicLink())throw Error('unsafe database link');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}}
 const worker=new Worker(new URL('./worker.js',import.meta.url),{workerData:{dataDir,maxStorageBytes:options.maxStorageBytes??512*1024*1024}});
 let next=0,queuedBytes=0,closed=false;const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:NodeJS.Timeout;bytes:number}>();
 const fail=(error:Error)=>{closed=true;for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();queuedBytes=0;};
 await new Promise<void>((resolve,reject)=>{worker.once('message',message=>message.ready?resolve():reject(Error('writer startup failed')));worker.once('error',reject);});
 worker.on('error',fail);worker.on('exit',code=>{if(!closed)fail(Error(`writer exited ${code}`));});
 worker.on('message',message=>{const p=pending.get(message.id);if(!p)return;clearTimeout(p.timer);pending.delete(message.id);queuedBytes-=p.bytes;message.error?p.reject(Error(message.error)):p.resolve(message.result);});
 function rpc<T>(op:string,data:unknown,bytes=0):Promise<T>{if(closed)return Promise.reject(Error('recorder closed'));if(pending.size>=(options.maxEntries??128)||queuedBytes+bytes>(options.maxQueuedBytes??8*1024*1024))return Promise.reject(Error('record queue capacity'));const id=++next;queuedBytes+=bytes;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{fail(Error('record acknowledgement timeout'));void worker.terminate();},options.ackTimeoutMs??2000);pending.set(id,{resolve,reject,timer,bytes});worker.postMessage({id,op,data});});}
 return {append(input:EvidenceInput){const event={...input,world:{worldId:input.world.worldId,worldHash:input.world.worldHash,profileId:input.world.profileId}};const bytes=Buffer.byteLength(JSON.stringify({...event,payload:undefined}))+2*(event.payload?.byteLength??0);return rpc('append',event,bytes);},maintain:()=>rpc('maintain',null),async health(){const h=await rpc<{accepting:boolean;usedBytes:number}>('health',null);return {...h,queuedBytes};},readEvents:(limit=32,after=0)=>rpc<StoredEvent[]>('read',{limit,after}),async close(){if(closed){await worker.terminate();return;}await rpc('close',null);closed=true;await worker.terminate();}};
}
