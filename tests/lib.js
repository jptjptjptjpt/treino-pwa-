'use strict';
/* Infra da suíte: servidor estático, cliente CDP, Chromium headless e helpers.
 * Nada aqui depende de pacotes npm — apenas Node 18+ (fetch/WebSocket). */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function serveStatic(root, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      let file = url.pathname === '/' ? '/index.html' : url.pathname;
      const full = path.join(root, file);
      if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(full)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(full).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function findChrome() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const candidates = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'];
  for (const name of candidates) {
    const r = spawnSync('which', [name], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

function tempProfile() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'treino-tests-'));
}

async function startChrome(chromeBin, cdpPort, profile) {
  const chrome = spawn(chromeBin, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + cdpPort,
    '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1000,1400',
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stderr.on('data', () => {});

  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + cdpPort + '/json/version');
      if (res.ok) return chrome;
    } catch (e) { /* ainda subindo */ }
    await sleep(200);
  }
  chrome.kill('SIGKILL');
  throw new Error('Chromium não abriu a porta de depuração ' + cdpPort);
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
}

async function cdpHttp(cdpPort, pathname) {
  const res = await fetch('http://127.0.0.1:' + cdpPort + pathname, { method: 'PUT' });
  return res.json();
}

/* Relógio determinístico no dia do cenário, mas avançando em tempo real
 * (necessário para cronômetros e descanso regressivo). */
function clockShim(isoDate) {
  const fixed = new Date(isoDate + 'T10:00:00Z').getTime();
  return `(function(){
    var R = Date;
    var BASE = ${fixed};
    var REAL_START = R.now();
    function now(){ return BASE + (R.now() - REAL_START); }
    function D(a,b,c,d,e,f,g){
      if (!(this instanceof D)) return new R(now()).toString();
      if (arguments.length === 0) return new R(now());
      if (arguments.length === 1) return new R(a);
      return new R(a,b,c,d||0,e||0,f||0,g||0);
    }
    D.prototype = R.prototype;
    D.now = now;
    D.parse = R.parse;
    D.UTC = R.UTC;
    window.Date = D;
    window.confirm = function(){ return true; };
  })();`;
}

async function evaluate(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('erro na página: ' + JSON.stringify(r.exceptionDetails).slice(0, 800));
  return r.result.value;
}

async function waitFor(cdp, expr, timeoutMs) {
  const limit = Date.now() + (timeoutMs || 15000);
  while (Date.now() < limit) {
    if (await evaluate(cdp, expr)) return true;
    await sleep(100);
  }
  throw new Error('timeout esperando: ' + expr);
}

/* opts: { cdpPort, appPort, mockPort, apiBase, isoDate, auth, lang, expectAuth } */
async function newSession(opts) {
  const target = await cdpHttp(opts.cdpPort, '/json/new?' + encodeURIComponent('about:blank'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // O app compara datas em horário local; fixar o fuso mantém os cenários
  // iguais em qualquer máquina.
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Sao_Paulo' });
  await cdp.send('Storage.clearDataForOrigin', {
    origin: 'http://127.0.0.1:' + opts.appPort,
    storageTypes: 'service_workers,cache_storage,local_storage'
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: clockShim(opts.isoDate || '2026-10-23') });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + opts.appPort + '/?api=' + encodeURIComponent(opts.apiBase) });
  await waitFor(cdp, "document.readyState === 'complete'");

  const session = { cdp, targetId: target.id, ws };

  if (opts.auth) {
    await evaluate(cdp, 'localStorage.setItem("treino.auth.v1", ' + JSON.stringify(JSON.stringify(opts.auth)) + '); 1');
    if (opts.lang) {
      await evaluate(cdp, 'localStorage.setItem("treino.lang.v1", ' + JSON.stringify(opts.lang) + '); 1');
    }
    if (opts.extended) {
      await evaluate(cdp, 'localStorage.setItem("treino.extended.v1", ' + JSON.stringify(opts.extended) + '); 1');
    }
    await cdp.send('Page.reload');
    await waitFor(cdp, "document.readyState === 'complete' && !!document.querySelector('#screen-routines')");
    await waitFor(cdp, "!document.querySelector('#screen-routines').hidden");
  } else {
    await waitFor(cdp, "!document.querySelector('#screen-login').hidden");
  }
  return session;
}

async function closeSession(session, cdpPort) {
  try { session.ws.close(); } catch (e) { /* noop */ }
  try { await fetch('http://127.0.0.1:' + cdpPort + '/json/close/' + session.targetId); } catch (e) { /* noop */ }
}

function makeChecker() {
  const results = [];
  function check(name, ok, detail) {
    results.push({ name, ok: !!ok, detail });
    const line = (ok ? 'PASS  ' : 'FAIL  ') + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '');
    console.log(line);
  }
  return { results, check };
}

module.exports = {
  serveStatic,
  findChrome,
  tempProfile,
  startChrome,
  newSession,
  closeSession,
  evaluate,
  waitFor,
  sleep,
  makeChecker,
  CDP
};
