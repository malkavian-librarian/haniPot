export const PROFILE_ID='openclaw-2026.1.29-v3';
export const PROFILE_COMMIT='77e703c69b07a236c2f0962bd195e03aae1b8da0';
export const METHODS=['health','system-presence','agents.list','models.list','skills.status','config.get','sessions.list','chat.history'] as const;
export type KnownMethod=typeof METHODS[number];
export type Clock={now():number};
export type WorldRef={worldId:string;worldHash:string;profileId:string};
export type ValidationResult={ok:boolean;errors:string[]};
export type Observation='handshake_failure'|'invalid_frame'|'enumeration'|'config_access'|'history_access'|'privilege_claim'|'unsupported_protocol'|'resource_limit';
