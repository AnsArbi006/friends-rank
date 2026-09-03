import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';

const port = 8897;
let server;

test.before(async () => {
  server = spawn('node', ['index.js'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: String(port), DATA_FILE: `/tmp/friends-rank-test-${Date.now()}.json` } });
  await once(server.stdout, 'data');
});
test.after(() => server.kill());

test('creates a room and rejects a join with an invalid profile', async () => {
  const created = await fetch(`http://127.0.0.1:${port}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Host', avatar: '😎' }) }).then((response) => response.json());
  assert.match(created.code, /^[A-Z0-9]{5}$/);
  assert.equal(created.room.players[0].token, undefined);
  const rejected = await fetch(`http://127.0.0.1:${port}/api/rooms/${created.code}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', avatar: '🐸' }) });
  assert.equal(rejected.status, 400);
});

test('reconnects with the private session token and rejects a wrong token', async () => {
  const created = await fetch(`http://127.0.0.1:${port}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Reconnect', avatar: '🦊' }) }).then((response) => response.json());
  const restored = await fetch(`http://127.0.0.1:${port}/api/rooms/${created.code}/reconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: created.playerId, token: created.token }) });
  assert.equal(restored.status, 200);
  const rejected = await fetch(`http://127.0.0.1:${port}/api/rooms/${created.code}/reconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: created.playerId, token: 'wrong-token' }) });
  assert.equal(rejected.status, 401);
});
