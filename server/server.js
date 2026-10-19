// Car Town Remake server: serves the built game (dist/) and relays online
// drag races between friends over WebSocket at /ws.
//
//   npm run build && npm start      -> http://localhost:3000
//   PORT=8080 npm start             -> custom port

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, players: wss.clients.size }));
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (e) {
    res.writeHead(400);
    res.end();
    return;
  }
  let file = path.normalize(path.join(DIST, pathname));
  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    if (!fs.existsSync(path.join(DIST, 'index.html'))) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('Car Town server is running. Build the game first with "npm run build" to serve it here.');
      return;
    }
    file = path.join(DIST, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new Map();
let nextId = 1;

function code4() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do {
    c = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('');
  } while (rooms.has(c));
  return c;
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function roomInfo(room) {
  return {
    code: room.code,
    players: room.players.map((p) => ({ id: p.id, player: p.player, ready: p.ready })),
    state: room.state,
  };
}

function broadcast(room, msg) {
  for (const p of room.players) send(p.ws, msg);
}

function sanitizePlayer(p) {
  const name = String(p?.name || 'Racer').slice(0, 14);
  const car = p?.car && typeof p.car === 'object' ? p.car : { model: 'hatch' };
  const avatar = p?.avatar && typeof p.avatar === 'object' ? p.avatar : {};
  return { name, car: JSON.parse(JSON.stringify(car)), avatar: JSON.parse(JSON.stringify(avatar)), level: Number(p?.level) || 1 };
}

function leaveRoom(client) {
  const room = client.room;
  if (!room) return;
  room.players = room.players.filter((p) => p !== client);
  client.room = null;
  client.ready = false;
  if (!room.players.length) {
    rooms.delete(room.code);
    return;
  }
  if (room.state === 'racing') {
    for (const p of room.players) send(p.ws, { type: 'result', winner: p.id, forfeit: true, times: {} });
  }
  room.state = 'lobby';
  for (const p of room.players) p.ready = false;
  broadcast(room, { type: 'room', room: roomInfo(room) });
}

function maybeStart(room) {
  if (room.players.length === 2 && room.players.every((p) => p.ready) && room.state === 'lobby') {
    room.state = 'racing';
    room.finish = {};
    room.startAt = Date.now() + 4500;
    broadcast(room, { type: 'start', startAt: room.startAt, now: Date.now(), room: roomInfo(room) });
    room.timeout = setTimeout(() => decide(room), 30000);
  }
}

function decide(room) {
  if (room.state !== 'racing') return;
  clearTimeout(room.timeout);
  const entries = Object.entries(room.finish);
  let winner = null;
  if (entries.length) winner = entries.sort((a, b) => a[1].time - b[1].time)[0][0];
  broadcast(room, { type: 'result', winner: winner ? Number(winner) : null, times: room.finish });
  room.state = 'lobby';
  for (const p of room.players) p.ready = false;
}

wss.on('connection', (ws) => {
  const client = { id: nextId++, ws, room: null, ready: false, player: null };
  send(ws, { type: 'hello', id: client.id });
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'create': {
        leaveRoom(client);
        client.player = sanitizePlayer(msg.player);
        const room = { code: code4(), players: [client], state: 'lobby' };
        rooms.set(room.code, room);
        client.room = room;
        send(ws, { type: 'room', room: roomInfo(room) });
        break;
      }
      case 'join': {
        const room = rooms.get(String(msg.code || '').toUpperCase());
        if (!room) { send(ws, { type: 'error', error: 'Room not found' }); break; }
        if (room.players.length >= 2) { send(ws, { type: 'error', error: 'Room is full' }); break; }
        leaveRoom(client);
        client.player = sanitizePlayer(msg.player);
        room.players.push(client);
        client.room = room;
        broadcast(room, { type: 'room', room: roomInfo(room) });
        break;
      }
      case 'player': {
        client.player = sanitizePlayer(msg.player);
        if (client.room) broadcast(client.room, { type: 'room', room: roomInfo(client.room) });
        break;
      }
      case 'ready': {
        if (!client.room) break;
        client.ready = true;
        broadcast(client.room, { type: 'room', room: roomInfo(client.room) });
        maybeStart(client.room);
        break;
      }
      case 'progress': {
        const room = client.room;
        if (!room || room.state !== 'racing') break;
        for (const p of room.players) if (p !== client) send(p.ws, { type: 'progress', id: client.id, dist: Number(msg.dist) || 0, v: Number(msg.v) || 0, rpm: Number(msg.rpm) || 0, gear: Number(msg.gear) || 1, nitro: !!msg.nitro, launched: !!msg.launched });
        break;
      }
      case 'finish': {
        const room = client.room;
        if (!room || room.state !== 'racing') break;
        room.finish[client.id] = { time: Number(msg.time) || 99, trap: Number(msg.trap) || 0 };
        for (const p of room.players) if (p !== client) send(p.ws, { type: 'opponentFinish', id: client.id, time: room.finish[client.id].time, trap: room.finish[client.id].trap });
        if (Object.keys(room.finish).length >= room.players.length) decide(room);
        break;
      }
      case 'leave':
        leaveRoom(client);
        break;
      default:
        break;
    }
  });
  ws.on('close', () => leaveRoom(client));
});

server.listen(PORT, () => {
  console.log(`Car Town Remake running at http://localhost:${PORT}`);
  console.log(`Online races: share the URL with friends on your network (WebSocket at /ws).`);
});
