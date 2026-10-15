import type {StoredEvent} from '../evidence/types.js';
import {METHODS} from '../contracts.js';
const uuid=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)?value:null;
const kinds=['accepted','closed','upgrade','wire_input','invalid_frame','body_aborted','body_complete','parser_error','response_prepared','send_outcome'];
const observations=['handshake_failure','invalid_frame','enumeration','config_access','history_access','privilege_claim','unsupported_protocol','resource_limit'];
export function exportSafe(event:StoredEvent){return {eventId:uuid(event.eventId),connectionId:uuid(event.connectionId),worldId:uuid(event.world.worldId),rowId:event.rowId,sequence:event.sequence,timestampMs:event.timestampMs,kind:kinds.includes(event.kind)?event.kind:'unknown',direction:['in','out','internal'].includes(event.direction)?event.direction:'unknown',transport:['http','websocket','tcp_error'].includes(event.transport)?event.transport:'unknown',method:(METHODS as readonly unknown[]).includes(event.method)?event.method:'unknown',payloadBytes:event.payload?.byteLength??0,observations:event.observations?.filter(o=>observations.includes(o))??[]};}
export function exportRaw(event:StoredEvent){const {payload,...rest}=event;return {...rest,...(payload?{payloadBase64:Buffer.from(payload).toString('base64')}:{})};}
