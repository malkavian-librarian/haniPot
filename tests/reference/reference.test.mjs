import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('reference preparation pins source and synthetic dataset', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../artifacts/reference/provenance.json', import.meta.url)));
  assert.equal(manifest.commit, '77e703c69b07a236c2f0962bd195e03aae1b8da0');
  assert.match(manifest.archiveSha256, /^[a-f0-9]{64}$/);
  const dataset = JSON.parse(await readFile(new URL('../fixtures/reference-dataset.json', import.meta.url)));
  assert.equal(dataset.sessions.length, 6);
  assert.equal(new Set(dataset.sessions.map(s => s.key)).size, 6);
  assert.ok(dataset.sessions.every(s => s.messages.length > 0));
});
test('reference runtime capture covers real enumeration and rejection', async () => {
  const report=JSON.parse(await readFile(new URL('../../artifacts/reference/reference.json',import.meta.url)));
  assert.equal(report.hello.payload.protocol,3);
  for(const method of ['health','system-presence','agents.list','models.list','skills.status','config.get','sessions.list','chat.history']) assert.equal(report.results[method].ok,true,method);
  assert.ok(report.results['chat.history'].payload.messages.length>0);
  assert.equal(report.wrongToken.ok,false);
  assert.equal(report.wrongVersion.ok,false);
  assert.ok(report.transcript.some(e=>e.frame.event==='tick'));
});
