// Online drag races over WebSocket (see server/server.js). Rooms are joined
// with a 4-letter code; each client simulates its own car and streams its
// progress, the server times the start and decides the winner.

import { Emitter } from '../core/util.js';

export class NetClient extends Emitter {
  constructor() {
    super();
    this.ws = null;
    this.room = null;
    this.id = null;
  }

  url() {
    const custom = (() => { try { return localStorage.getItem('cartown-server'); } catch (e) { return null; } })();
    if (custom) return custom;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === 1) {
        resolve();
        return;
      }
      let settled = false;
      try {
        this.ws = new WebSocket(this.url());
      } catch (e) {
        reject(e);
        return;
      }
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { this.ws.close(); } catch (e) { /* ignore */ }
          reject(new Error('timeout'));
        }
      }, 4000);
      this.ws.onopen = () => {
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      this.ws.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error('unreachable'));
        }
      };
      this.ws.onclose = () => this.emit('close');
      this.ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (msg.type === 'hello') this.id = msg.id;
        if (msg.type === 'room') this.room = msg.room;
        this.emit(msg.type, msg);
        this.emit('message', msg);
      };
    });
  }

  send(type, data = {}) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ type, ...data }));
  }

  createRoom(player) { this.send('create', { player }); }
  joinRoom(code, player) { this.send('join', { code: code.toUpperCase().trim(), player }); }
  ready() { this.send('ready'); }
  progress(state) { this.send('progress', state); }
  finish(time, trap) { this.send('finish', { time, trap }); }
  leave() {
    this.send('leave');
    this.room = null;
  }

  close() {
    try { this.ws?.close(); } catch (e) { /* ignore */ }
    this.ws = null;
  }
}

export const net = new NetClient();
