import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {METHODS,type Clock,type KnownMethod,type Observation} from '../contracts.js';
import {validateParams,validateResult} from '../profile/validate.js';
import type {World} from '../world/types.js';
import type {AccessDecision} from './policy.js';
export type HandlerResult={ok:true;payload:unknown;observations:Observation[]}|{ok:false;error:{code:string;message:string};observations:Observation[]};
const reference=JSON.parse(readFileSync(new URL('../profile/reference.json',import.meta.url),'utf8'));
function error(message:string):HandlerResult{return {ok:false,error:{code:'INVALID_REQUEST',message},observations:[]};}
export function dispatch(method:string,params:unknown,world:Readonly<World>,access:AccessDecision,clock:Clock):HandlerResult {
 if(!(METHODS as readonly string[]).includes(method))return error(`unknown method: ${method.slice(0,128)}`);
 if(!access.allowed)return error('unauthorized');
 const admin=access.grants.includes('operator.admin');
 if(method==='config.get'?!admin:!admin&&!access.grants.some(s=>s==='operator.read'||s==='operator.write'))return error(method==='config.get'?'missing scope: operator.admin':'missing scope: operator.read');
 const checked=validateParams(method,params);if(!checked.ok)return error(`invalid ${method} params`);
 const p=params as Record<string,unknown>;let payload:unknown;const now=clock.now();
 const defaults={modelProvider:world.model.split('/')[0],model:world.model.split('/').slice(1).join('/'),contextTokens:128000};
 const recent=world.sessions.slice(0,5).map(s=>({key:s.key,updatedAt:s.updatedAt,age:Math.max(0,now-s.updatedAt)}));
 switch(method as KnownMethod){
  case 'health': {const health=structuredClone(reference.results.health.payload);const sessions={path:'/state/agents/main/sessions/sessions.json',count:world.sessions.length,recent};payload={...health,ts:now,durationMs:0,sessions,agents:world.agents.map(a=>({...health.agents[0],agentId:a.id,name:a.name,isDefault:a.id==='main',sessions}))};break;}
  case 'system-presence':payload=[{host:world.host,ip:'192.0.2.10',version:'2026.1.29',platform:'linux',deviceFamily:'Linux',modelIdentifier:'x64',mode:'gateway',reason:'self',text:`Gateway: ${world.host}`,ts:now}];break;
  case 'agents.list':payload={defaultId:'main',mainKey:'main',scope:'per-sender',agents:world.agents};break;
  case 'models.list':payload={models:[{id:defaults.model,name:defaults.model,provider:defaults.modelProvider,contextWindow:128000,reasoning:false}]};break;
  case 'skills.status':payload={workspaceDir:'/state/workspace',managedSkillsDir:'/state/skills',skills:world.skills.map(name=>({name,description:`${name} workflow`,source:'openclaw-workspace',filePath:`/state/workspace/skills/${name}/SKILL.md`,baseDir:`/state/workspace/skills/${name}`,skillKey:name,always:false,disabled:false,blockedByAllowlist:false,eligible:true,requirements:{bins:[],anyBins:[],env:[],config:[],os:[]},missing:{bins:[],anyBins:[],env:[],config:[],os:[]},configChecks:[],install:[]}))};break;
  case 'config.get':{const raw=JSON.stringify(world.config);const config=structuredClone(world.config);payload={path:'/state/openclaw.json',exists:true,raw,parsed:structuredClone(world.config),valid:true,config,hash:createHash('sha256').update(raw).digest('hex'),issues:[],warnings:[],legacyIssues:[]};break;}
  case 'sessions.list':{let sessions=world.sessions.filter(s=>(!p.agentId||s.agentId===p.agentId)&&(!p.label||s.label===p.label)&&(!p.search||(s.label+' '+s.key).toLowerCase().includes(String(p.search).toLowerCase()))&&(!p.activeMinutes||s.updatedAt>=now-Number(p.activeMinutes)*60000)&&!p.spawnedBy);sessions=sessions.slice(0,Math.min(Number(p.limit??sessions.length),1000));payload={ts:now,path:'(multiple)',count:sessions.length,defaults,sessions:sessions.map(s=>({key:s.key,kind:'direct',updatedAt:s.updatedAt,sessionId:s.id,thinkingLevel:'off',totalTokens:0,...(p.includeDerivedTitles?{derivedTitle:s.messages[0]?.content[0]?.text.slice(0,60)}:{}),...(p.includeLastMessage?{lastMessagePreview:s.messages.at(-1)?.content[0]?.text}:{}),...(world.worldId==='reference-world'?{}:{label:s.label})}))};break;}
  case 'chat.history':{const session=world.sessions.find(s=>s.key===p.sessionKey);payload={sessionKey:p.sessionKey,...(session?{sessionId:session.id}:{}),messages:session?.messages.slice(-Math.min(Number(p.limit??200),1000))??[],thinkingLevel:'off'};break;}
 }
 if(!validateResult(method,payload).ok)throw Error('internal profile result invalid');
 return {ok:true,payload,observations:[method==='config.get'?'config_access':method==='chat.history'?'history_access':'enumeration']};
}
