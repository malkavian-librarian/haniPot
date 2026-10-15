import type {WorldRef} from '../contracts.js';
export type Message={role:string;content:{type:'text';text:string}[];timestamp:number};
export type Session={key:string;id:string;agentId:string;updatedAt:number;label:string;messages:Message[]};
export type World=WorldRef & {schemaVersion:1;generatorRevision:1;seed:string;generatedAtMs:number;syntheticBootAtMs:number;owner:string;business:string;host:string;token:string;model:string;agents:{id:string;name:string}[];sessions:Session[];skills:string[];integrations:string[];config:Record<string,unknown>};
