import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const dataset = JSON.parse(await readFile('/reference/dataset.json', 'utf8'));
const dir = '/state/agents/main/sessions';
await mkdir(dir, {recursive:true});
await mkdir('/state/workspace', {recursive:true});
await writeFile('/state/openclaw.json', JSON.stringify({
  gateway:{mode:'local', port:18789, bind:'lan', auth:{mode:'token', token:'hanipot-reference-only-nonfunctional-token'}, controlUi:{dangerouslyDisableDeviceAuth:true}},
  agents:{defaults:{workspace:'/state/workspace', model:{primary:dataset.model}, thinkingDefault:'off', heartbeat:{every:'0m'}}, list:[{id:'main', default:true, name:dataset.business}]},
  channels:{},
}));
const store = {};
for (const session of dataset.sessions) {
  store[session.key] = {sessionId:session.id, updatedAt:1781568000000, thinkingLevel:'off', sessionFile:`${dir}/${session.id}.jsonl`};
  const rows = [{type:'session',version:3,id:session.id,timestamp:'2026-06-16T00:00:00.000Z',cwd:'/state/workspace'},
    ...session.messages.map((message,i)=>({type:'message', id:`m${i}`,parentId:i?`m${i-1}`:null,timestamp:'2026-06-16T00:00:00.000Z',message:{...message,content:[{type:'text',text:message.content}],timestamp:1781568000000}}))];
  await writeFile(`${dir}/${session.id}.jsonl`, rows.map(row=>JSON.stringify(row)).join('\n')+'\n');
}
await writeFile(`${dir}/sessions.json`, JSON.stringify(store));
const child = spawn(process.execPath, ['/app/dist/index.js','gateway','--allow-unconfigured'], {stdio:'inherit'});
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
