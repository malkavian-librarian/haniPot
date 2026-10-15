import {cp,mkdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
await mkdir(new URL('dist/src/profile/',root),{recursive:true});
await cp(new URL('tests/fixtures/openclaw/schemas/',root),new URL('dist/src/profile/schemas/',root),{recursive:true});
await cp(new URL('tests/fixtures/reference-dataset.json',root),new URL('dist/src/profile/dataset.json',root));
await cp(new URL('tests/fixtures/openclaw/reference.json',root),new URL('dist/src/profile/reference.json',root));
// SQL becomes required only when its owning task introduces the writer.
try {await access(new URL('src/evidence/schema.sql',root));await mkdir(new URL('dist/src/evidence/',root),{recursive:true});await cp(new URL('src/evidence/schema.sql',root),new URL('dist/src/evidence/schema.sql',root));} catch(error) {if(error.code!=='ENOENT') throw error;}
