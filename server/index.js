import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const DATA_FILE = process.env.DATA_FILE || '/data/rooms.json';
const ROOM_TTL_MS = 1000 * 60 * 60 * 12;
const rooms = new Map();
const connections = new Map();
const defaultSettings = { questionCount: 3, rounds: 2, mode: 'friends', questionSource: 'preset' };

function load() { if (!existsSync(DATA_FILE)) return; for (const room of JSON.parse(readFileSync(DATA_FILE, 'utf8')).rooms || []) rooms.set(room.code, room); }
function save() { mkdirSync(new URL('.', `file://${DATA_FILE}`).pathname, { recursive: true }); writeFileSync(DATA_FILE, JSON.stringify({ rooms: [...rooms.values()] })); }
function code() { let value; do value = randomBytes(4).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); while (rooms.has(value)); return value; }
function publicRoom(room) { return { code: room.code, hostId: room.hostId, phase: room.phase, players: room.players.map(({ token, ...player }) => player), settings: room.settings, updatedAt: room.updatedAt, questionProgress: Object.keys(room.customQuestions).length, questionTarget: room.players.length }; }
function touch(room) { room.updatedAt = Date.now(); save(); broadcast(room); }
function broadcast(room) { const data = JSON.stringify({ type: 'room_state', room: publicRoom(room) }); for (const player of room.players) { const socket = connections.get(player.id); if (socket?.readyState === 1) socket.send(data); } }
function error(socket, message) { socket.send(JSON.stringify({ type: 'error', message })); }
function getRoom(code) { const room = rooms.get(code); return room && Date.now() - room.updatedAt < ROOM_TTL_MS ? room : null; }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => raw += chunk); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Ungültige Anfrage.')); } }); }); }
function validateProfile({ name, avatar }) { return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 16 && typeof avatar === 'string' && [...avatar].length <= 4; }
function createPlayer(name, avatar) { return { id: randomUUID(), token: randomUUID(), name: name.trim(), avatar, joinedAt: Date.now(), ready: false, connected: false }; }

load();
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();
  try {
    if (req.method === 'GET' && /^\/api\/rooms\/[A-Z0-9]{5}$/.test(req.url)) { const room = getRoom(req.url.split('/').pop()); if (!room) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'Lobby nicht gefunden oder abgelaufen.' })); } return res.end(JSON.stringify({ room: publicRoom(room) })); }
    if (req.method === 'POST' && req.url === '/api/rooms') { const profile = await body(req); if (!validateProfile(profile)) throw new Error('Bitte Name und Emoji ausfüllen.'); const player = createPlayer(profile.name, profile.avatar); player.ready = true; const room = { code: code(), hostId: player.id, phase: 'lobby', players: [player], settings: { ...defaultSettings }, customQuestions: {}, rankings: {}, updatedAt: Date.now() }; rooms.set(room.code, room); save(); return res.end(JSON.stringify({ code: room.code, playerId: player.id, token: player.token, room: publicRoom(room) })); }
    const joinMatch = req.url.match(/^\/api\/rooms\/([A-Z0-9]{5})\/join$/);
    if (req.method === 'POST' && joinMatch) { const room = getRoom(joinMatch[1]); const profile = await body(req); if (!room) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'Lobby nicht gefunden oder abgelaufen.' })); } if (room.phase !== 'lobby') { res.statusCode = 409; return res.end(JSON.stringify({ error: 'Diese Runde hat bereits begonnen.' })); } if (room.players.length >= 10) { res.statusCode = 409; return res.end(JSON.stringify({ error: 'Diese Lobby ist voll.' })); } if (!validateProfile(profile)) throw new Error('Bitte Name und Emoji ausfüllen.'); const player = createPlayer(profile.name, profile.avatar); room.players.push(player); touch(room); return res.end(JSON.stringify({ code: room.code, playerId: player.id, token: player.token, room: publicRoom(room) })); }
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Nicht gefunden.' }));
  } catch (err) { res.statusCode = 400; res.end(JSON.stringify({ error: err.message })); }
});
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => { const url = new URL(req.url, `http://${req.headers.host}`); if (url.pathname !== '/ws') return socket.destroy(); wss.handleUpgrade(req, socket, head, (ws) => { ws.context = { code: url.searchParams.get('code'), playerId: url.searchParams.get('playerId'), token: url.searchParams.get('token') }; wss.emit('connection', ws); }); });
wss.on('connection', (socket) => { const { code: roomCode, playerId, token } = socket.context; const room = getRoom(roomCode); const player = room?.players.find((entry) => entry.id === playerId && entry.token === token); if (!room || !player) return socket.close(1008, 'Nicht autorisiert'); player.connected = true; connections.set(player.id, socket); touch(room); socket.on('message', (raw) => { try { const event = JSON.parse(raw); const current = getRoom(roomCode); const actor = current?.players.find((entry) => entry.id === playerId && entry.token === token); if (!current || !actor) return error(socket, 'Lobby ist nicht mehr verfügbar.'); if (event.type === 'settings_updated') { if (current.hostId !== actor.id || current.phase !== 'lobby') return error(socket, 'Nur der Host darf die Einstellungen ändern.'); current.settings = event.settings; } else if (event.type === 'ready_updated') actor.ready = Boolean(event.ready); else if (event.type === 'questions_submitted') { if (current.phase !== 'question_draft') return error(socket, 'Fragen können gerade nicht abgegeben werden.'); current.customQuestions[actor.id] = event.questions.filter((q) => typeof q === 'string' && q.trim()).slice(0, 3); } else if (event.type === 'start_game') { if (current.hostId !== actor.id) return error(socket, 'Nur der Host kann starten.'); if (current.players.length < 2) return error(socket, 'Mindestens zwei Personen werden benötigt.'); if (!current.players.every((p) => p.ready)) return error(socket, 'Warte, bis alle bereit sind.'); if (current.settings.questionSource === 'custom' && current.phase === 'lobby') current.phase = 'question_draft'; else if (current.settings.questionSource === 'preset' || Object.keys(current.customQuestions).length === current.players.length) current.phase = 'ranking'; else return error(socket, 'Warte auf die Fragen der Gruppe.'); } else if (event.type === 'ranking_submitted') { if (current.phase !== 'ranking') return error(socket, 'Ranking ist noch nicht aktiv.'); current.rankings[actor.id] = event.order; actor.ready = true; if (Object.keys(current.rankings).length === current.players.length) current.phase = 'reveal'; } else return error(socket, 'Unbekannte Aktion.'); touch(current); } catch { error(socket, 'Ungültige Nachricht.'); } }); socket.on('close', () => { const current = getRoom(roomCode); if (!current) return; const entry = current.players.find((p) => p.id === playerId); if (entry) entry.connected = false; connections.delete(playerId); if (current.hostId === playerId) current.hostId = current.players.filter((p) => p.id !== playerId).sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id || playerId; touch(current); }); });
setInterval(() => { for (const [key, room] of rooms) if (Date.now() - room.updatedAt > ROOM_TTL_MS) rooms.delete(key); save(); }, 60_000);
server.listen(PORT, () => console.log(`Friends Rank server on :${PORT}`));
