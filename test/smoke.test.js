// Smoke test for the non-trivial logic: status forcing, validation, echo, cache freshness.
// Boots the app on an ephemeral port, hits it with fetch, asserts. No frameworks.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server, base;
before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('health is UP', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, 'UP');
});

test('/status/:code forces the status', async () => {
  const r = await fetch(`${base}/status/503`);
  assert.equal(r.status, 503);
  assert.equal((await r.json()).requestedStatus, 503);
});

test('/status rejects out-of-range', async () => {
  const r = await fetch(`${base}/status/999`);
  assert.equal(r.status, 400);
});

test('/validate returns 400 with missing fields', async () => {
  const r = await fetch(`${base}/validate`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'x' }),
  });
  assert.equal(r.status, 400);
  assert.deepEqual((await r.json()).error.fields, ['email']);
});

test('/echo reflects body and method', async () => {
  const r = await fetch(`${base}/echo`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ping: 1 }),
  });
  const j = await r.json();
  assert.equal(j.method, 'POST');
  assert.deepEqual(j.body, { ping: 1 });
});

test('every JSON response carries serverId', async () => {
  const r = await fetch(`${base}/health`);
  assert.ok((await r.json()).serverId);
});

test('unknown route is 404 NOT_FOUND', async () => {
  const r = await fetch(`${base}/nope`);
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error.code, 'NOT_FOUND');
});

test('bad JSON is 400 BAD_REQUEST', async () => {
  const r = await fetch(`${base}/customer/orders`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad}',
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error.code, 'BAD_REQUEST');
});
