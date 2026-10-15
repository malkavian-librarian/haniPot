import {Ajv,type ValidateFunction} from 'ajv';
import {readFileSync} from 'node:fs';
import type {ValidationResult} from '../contracts.js';
const ajv=new Ajv({allErrors:false,strict:true});
// TypeBox emits an annotation here, not Ajv's incompatible discriminator extension.
ajv.addKeyword({keyword:'discriminator',schemaType:'string',valid:true});
const compiled=new Map<string,ValidateFunction>();
const paramNames:Record<string,string>={'connect':'ConnectParams','agents.list':'AgentsListParams','models.list':'ModelsListParams','skills.status':'SkillsStatusParams','config.get':'ConfigGetParams','sessions.list':'SessionsListParams','chat.history':'ChatHistoryParams'};
const resultNames:Record<string,string>={'agents.list':'AgentsListResult','models.list':'ModelsListResult'};
export function safeInput(value:unknown,depth=0):boolean {
 if(depth>32) return false;
 if(typeof value==='string') return value.length<=65536;
 if(Array.isArray(value)) return value.length<=4096 && value.every(v=>safeInput(v,depth+1));
 if(value && typeof value==='object') return Object.entries(value).length<=256 && Object.entries(value).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&safeInput(v,depth+1));
 return true;
}
export function validateNamed(name:string,value:unknown):ValidationResult {
 if(!/^[A-Za-z]+$/.test(name)) return {ok:false,errors:['unknown schema']};
 let check=compiled.get(name);
 if(!check) {const schema=JSON.parse(readFileSync(new URL(`./schemas/${name}.json`,import.meta.url),'utf8'));check=ajv.compile(schema);compiled.set(name,check);}
 const ok=Boolean(check(value));return {ok,errors:ok?[]:ajv.errorsText(check.errors).split(', ')};
}
export function validateFrame(value:unknown):ValidationResult {return safeInput(value)?validateNamed('RequestFrame',value):{ok:false,errors:['input limits']};}
export function validateParams(method:string,value:unknown):ValidationResult {
 if(!safeInput(value)) return {ok:false,errors:['input limits']};
 const name=paramNames[method];return name?validateNamed(name,value):{ok:typeof value==='object'&&value!==null&&!Array.isArray(value)&&Object.keys(value).length===0,errors:[]};
}
export function validateResult(method:string,value:unknown):ValidationResult {const name=resultNames[method];return name?validateNamed(name,value):{ok:true,errors:[]};}
