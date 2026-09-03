import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import WebSocket from 'ws';

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

test('runs Guess The Friend with private roles and rejects duplicate answers', async () => {
  const created = await fetch(`http://127.0.0.1:${port}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Host', avatar: '😎' }) }).then((response) => response.json());
  const joined = await fetch(`http://127.0.0.1:${port}/api/rooms/${created.code}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Gast', avatar: '🐸' }) }).then((response) => response.json());
  const sockets = [created, joined].map((session) => new WebSocket(`ws://127.0.0.1:${port}/ws?code=${created.code}&playerId=${session.playerId}&token=${session.token}`));
  const events = [[], []];
  sockets.forEach((socket, index) => socket.on('message', (raw) => events[index].push(JSON.parse(raw))));
  await new Promise((resolve) => setTimeout(resolve, 100));
  sockets[0].send(JSON.stringify({ type: 'settings_updated', settings: { questionCount: 3, customQuestionsPerPlayer: 1, mode: 'guessFriend', questionSource: 'preset' } }));
  sockets[1].send(JSON.stringify({ type: 'ready_updated', ready: true }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  sockets[0].send(JSON.stringify({ type: 'start_game' }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const author = events.findIndex((list) => list.some((event) => event.room?.phase === 'clue_writing' && event.room.guessRole === 'author'));
  assert.notEqual(author, -1);
  const authorRoom = events[author].find((event) => event.room?.phase === 'clue_writing').room;
  const target = authorRoom.players[author === 0 ? 0 : 1].id;
  sockets[author].send(JSON.stringify({ type: 'guess_question_submitted', text: 'Wer kennt die besten Geschichten?', targetId: target }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const guesser = author === 0 ? 1 : 0;
  const guessingRoom = events[guesser].find((event) => event.room?.phase === 'guessing').room;
  assert.equal(guessingRoom.guessRole, 'detective');
  assert.equal(guessingRoom.guessOptions.includes(target), true);
  sockets[guesser].send(JSON.stringify({ type: 'guess_answer_submitted', targetId: target }));
  sockets[guesser].send(JSON.stringify({ type: 'guess_answer_submitted', targetId: target }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(events[guesser].some((event) => event.type === 'error' && event.message.includes('bereits')), true);
  sockets.forEach((socket) => socket.close());
});

test('rejects oversized HTTP bodies', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'x'.repeat(20000), avatar: '😎' }) });
  assert.equal(response.status, 400);
});
