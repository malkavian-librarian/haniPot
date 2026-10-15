import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PROFILE_ID} from '../contracts.js';
import {safeInput} from '../profile/validate.js';
import type {World} from './types.js';
function canonical(value:unknown):string {if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';return JSON.stringify(value);}
export function hashWorld(world:Omit<World,'worldHash'>|World):string {const {worldHash,...rest}=world as World;return createHash('sha256').update(canonical(rest)).digest('hex');}
type Dataset={business:string;owner:string;agentId:string;model:string;sessions:{key:string;id:string;messages:{role:string;content:string}[]}[]};
const dataset=JSON.parse(readFileSync(new URL('../profile/dataset.json',import.meta.url),'utf8')) as Dataset;
function build(input:{seed:string;generatedAtMs:number;worldId:string},reference=false):World {
 const hex=createHash('sha256').update(input.seed).digest('hex');
 const business=reference?dataset.business:`${['Juniper','Maple','Cedar','Willow'][parseInt(hex.slice(0,2),16)%4]} Supply ${hex.slice(2,6)}`;
 const owner=reference?dataset.owner:`Morgan ${hex.slice(6,12)}`;
 const world:World={schemaVersion:1,generatorRevision:1,...input,profileId:PROFILE_ID,worldHash:'',syntheticBootAtMs:input.generatedAtMs-21*86400000,owner,business,host:`ops-${hex.slice(0,8)}`,token:reference?'hanipot-reference-only-nonfunctional-token':`synthetic-${hex.slice(0,32)}`,model:dataset.model,agents:[{id:'main',name:business}],skills:['order-review','supplier-report','support-triage'],integrations:['orders','support','suppliers'],sessions:dataset.sessions.map((s,index)=>({key:s.key,id:reference?s.id:`${hex.slice(0,8)}-${index}`,agentId:'main',label:['Operations','Invoices','Support','Stock','Returns','Daily report'][index],updatedAt:reference?1781568000000:input.generatedAtMs-(index+1)*3600000,messages:s.messages.map(m=>({role:m.role,content:[{type:'text',text:m.content.replaceAll(dataset.business,business)}],timestamp:reference?1781568000000:input.generatedAtMs-(index+1)*3600000}))})),config:{}};
 world.config={gateway:{mode:'local',port:18789,bind:'lan',auth:{mode:'token',token:world.token},controlUi:{dangerouslyDisableDeviceAuth:true}},agents:{defaults:{workspace:'/state/workspace',model:{primary:world.model},thinkingDefault:'off',heartbeat:{every:'0m'}},list:[{id:'main',default:true,name:business}]},channels:{}};
 world.worldHash=hashWorld(world);return validateWorld(world);
}
export function generateWorld(input:{seed:string;generatedAtMs:number;worldId:string}):World {return build(input);}
export function referenceWorldFromDataset():World {return build({seed:'reference-dataset',generatedAtMs:1781568000000,worldId:'reference-world'},true);}
export function validateWorld(value:unknown):World {
 if(!value||typeof value!=='object'||Buffer.byteLength(JSON.stringify(value))>2*1024*1024||!safeInput(value))throw Error('invalid world');
 const world=value as World;
 if(world.schemaVersion!==1||world.profileId!==PROFILE_ID||!Array.isArray(world.agents)||!Array.isArray(world.sessions)||world.sessions.length!==6||typeof world.token!=='string'||!Number.isFinite(world.generatedAtMs)||world.syntheticBootAtMs>world.generatedAtMs)throw Error('invalid world structure');
 if(!/^[A-Za-z0-9_-]{1,128}$/.test(world.worldId)||new Set(world.sessions.map(s=>s.key)).size!==world.sessions.length)throw Error('invalid world identity');
 if(world.sessions.some(s=>!world.agents.some(a=>a.id===s.agentId)||s.updatedAt>world.generatedAtMs||!Array.isArray(s.messages)))throw Error('invalid world references');
 if(hashWorld(world)!==world.worldHash)throw Error('world hash mismatch');return world;
}
