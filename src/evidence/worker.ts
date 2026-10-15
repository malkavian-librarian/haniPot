import {parentPort,workerData} from 'node:worker_threads';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,statSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {EvidenceInput} from './types.js';
const options=workerData as {dataDir:string;maxStorageBytes:number};
const path=join(options.dataDir,'evidence.db');
const db=new DatabaseSync(path);
db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
if((db.prepare('SELECT version FROM meta').get() as {version:number}).version!==1)throw Error('unsupported evidence schema');
db.exec('PRAGMA max_page_count=131072');
db.prepare('UPDATE connections SET ended=? WHERE ended IS NULL').run(Date.now());
// A previous process may have died after a send and before its outcome transaction.
let cursor=0;
while(true){const pending=db.prepare("SELECT row_id,metadata FROM events WHERE row_id>? AND kind='response_prepared' AND json_extract(metadata,'$.sendStatus')='prepared' ORDER BY row_id LIMIT 32").all(cursor) as {row_id:number;metadata:string}[];if(!pending.length)break;for(const row of pending){cursor=row.row_id;const meta=JSON.parse(row.metadata);const outcome=db.prepare("SELECT 1 FROM events WHERE kind='send_outcome' AND json_extract(metadata,'$.relatedEventId')=? LIMIT 1").get(meta.eventId);if(!outcome){meta.sendStatus='unknown_after_crash';db.prepare('UPDATE events SET metadata=? WHERE row_id=?').run(JSON.stringify(meta),row.row_id);}}}
function usedBytes(){let size=0;for(const name of readdirSync(options.dataDir)){if(name==='worlds'){for(const archive of readdirSync(join(options.dataDir,name)))size+=statSync(join(options.dataDir,name,archive)).size;}else {const stat=statSync(join(options.dataDir,name));if(stat.isFile())size+=stat.size;}}return size;}
function maintain(){const before=Number((db.prepare('SELECT count(*) n FROM connections').get() as {n:number}).n);const cutoff=Date.now()-7*86400000;
 db.prepare('DELETE FROM connections WHERE id IN (SELECT id FROM connections WHERE ended IS NOT NULL AND ended<? ORDER BY ended LIMIT 100)').run(cutoff);
 if(usedBytes()>Math.min(options.maxStorageBytes,448*1024*1024))db.exec('DELETE FROM connections WHERE id IN (SELECT id FROM connections WHERE ended IS NOT NULL ORDER BY ended LIMIT 100)');
 db.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA incremental_vacuum(128)');
 return {accepting:usedBytes()<options.maxStorageBytes,deletedConnections:before-Number((db.prepare('SELECT count(*) n FROM connections').get() as {n:number}).n)};
}
parentPort!.on('message',({id,op,data})=>{
 try{let result:unknown;
  if(op==='append'){
   const event=data as EvidenceInput;
   const eventBytes=Buffer.byteLength(JSON.stringify({...event,payload:undefined}))+(event.payload?.byteLength??0)+4096;
   if(usedBytes()+eventBytes>options.maxStorageBytes){maintain();if(usedBytes()+eventBytes>options.maxStorageBytes)throw Error('record storage capacity');}
   const eventId=randomUUID();let sequence=0;
   db.exec('BEGIN IMMEDIATE');
   try {db.prepare('INSERT OR IGNORE INTO connections(id,world_id,started) VALUES(?,?,?)').run(event.connectionId,event.world.worldId,event.timestampMs);
    sequence=Number((db.prepare('SELECT COALESCE(MAX(seq),0)+1 n FROM events WHERE connection_id=?').get(event.connectionId) as {n:number}).n);
    const {payload,...metadata}=event;
    db.prepare('INSERT INTO events(id,connection_id,seq,ts,kind,metadata,payload) VALUES(?,?,?,?,?,?,?)').run(eventId,event.connectionId,sequence,event.timestampMs,event.kind,JSON.stringify({...metadata,eventId}),payload?new Uint8Array(payload):null);
    if(event.kind==='closed')db.prepare('UPDATE connections SET ended=? WHERE id=?').run(event.timestampMs,event.connectionId);
    db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}
   result={eventId,sequence};
  }else if(op==='read'){const rows=db.prepare('SELECT row_id,id,seq,metadata,payload FROM events WHERE row_id>? ORDER BY row_id LIMIT ?').all(data.after,Math.min(Math.max(data.limit,1),32)) as {row_id:number;id:string;seq:number;metadata:string;payload:Uint8Array|null}[];result=rows.map(r=>({...JSON.parse(r.metadata),rowId:r.row_id,eventId:r.id,sequence:r.seq,payload:r.payload??undefined}));}
  else if(op==='maintain')result=maintain();
  else if(op==='health')result={accepting:usedBytes()<options.maxStorageBytes,usedBytes:usedBytes()};
  else if(op==='close'){db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();result=true;}
  else throw Error('unknown writer operation');
  parentPort!.postMessage({id,result});if(op==='close')parentPort!.close();
 }catch(error){parentPort!.postMessage({id,error:(error as Error).message});}
});
parentPort!.postMessage({ready:true});
