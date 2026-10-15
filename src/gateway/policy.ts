import {timingSafeEqual} from 'node:crypto';
export type DeceptionPolicy={kind:'open-control'}|{kind:'token-gated';token:string;grants:readonly string[]};
export type AccessDecision={allowed:false;reason:'invalid_role'|'missing_token'|'wrong_token';claimedScopes:readonly string[]}|{allowed:true;grants:readonly string[];claimedScopes:readonly string[];authentication:'synthetic_token'|'intentional_bypass';deviceVerified:false};
export function decideAccess(input:unknown,policy:DeceptionPolicy):AccessDecision {
 const p=(input??{}) as {role?:unknown;scopes?:unknown;auth?:{token?:unknown}};
 const claimedScopes=Array.isArray(p.scopes)?p.scopes.filter((s):s is string=>typeof s==='string'):[];
 if(p.role!==undefined && p.role!=='operator')return {allowed:false,reason:'invalid_role',claimedScopes};
 if(policy.kind==='open-control')return {allowed:true,grants:['operator.admin'],claimedScopes,authentication:'intentional_bypass',deviceVerified:false};
 const token=p.auth?.token;
 if(typeof token!=='string')return {allowed:false,reason:'missing_token',claimedScopes};
 const a=Buffer.from(token),b=Buffer.from(policy.token);
 if(a.length!==b.length||!timingSafeEqual(a,b))return {allowed:false,reason:'wrong_token',claimedScopes};
 return {allowed:true,grants:policy.grants,claimedScopes,authentication:'synthetic_token',deviceVerified:false};
}
