'use strict';
/* Suíte headless do modo treino.
 * Uso: node tests/run.js
 * Requisitos: Node 18+ (fetch/WebSocket) e um Chromium/Chrome instalado.
 * Se o binário não estiver no PATH, aponte CHROMIUM=/caminho/do/chromium.
 *
 * Cada cenário abre uma aba nova (localStorage limpo) e usa um mock da API v2
 * em memória, então os ids dos registros são determinísticos. */

const path = require('path');
const fs = require('fs');
const {
  serveStatic,
  findChrome,
  tempProfile,
  startChrome,
  newSession,
  closeSession,
  evaluate,
  waitFor,
  sleep,
  makeChecker
} = require('./lib');
const mock = require('./mock');

const WEBAPP = path.resolve(__dirname, '..');
const APP_PORT = Number(process.env.APP_PORT || 8891);
const MOCK_PORT = Number(process.env.MOCK_PORT || 8890);
const CDP_PORT = Number(process.env.CDP_PORT || 9334);
const API_BASE = 'http://127.0.0.1:' + MOCK_PORT;
const APP_URL = 'http://127.0.0.1:' + APP_PORT + '/';

const AUTH = {
  access: 'placeholder',
  refresh: 'refresh-token',
  session: 'session-token',
  user: { username: 'teste' }
};

const { results, check } = makeChecker();

// ---------------------------------------------------------------- helpers

function checkEq(name, actual, expected, extra) {
  const ok = actual === expected;
  check(name, ok, ok ? extra : { esperado: expected, obtido: actual });
}

function checkIncludes(name, haystack, needle) {
  const ok = String(haystack || '').indexOf(needle) >= 0;
  check(name, ok, ok ? undefined : { esperado_conter: needle, obtido: haystack });
}

async function until(fn, timeout, label) {
  const limit = Date.now() + (timeout || 12000);
  let last = null;
  while (Date.now() < limit) {
    try {
      if (await fn()) return true;
    } catch (err) {
      last = err;
    }
    await sleep(100);
  }
  throw new Error('timeout esperando ' + (label || 'condição') + (last ? ' (' + last.message + ')' : ''));
}

async function entries() {
  const res = await fetch(API_BASE + '/__log');
  const data = await res.json();
  return data.entries;
}

async function mockToken() {
  const res = await fetch(API_BASE + '/__log');
  const data = await res.json();
  return data.token;
}

async function resetMock() {
  await fetch(API_BASE + '/__reset');
}

async function failNext(method, match, count, status) {
  await fetch(API_BASE + '/__fail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: method, match: match, count: count || 1, status: status || 500 })
  });
}

const plainPath = (entry) => entry.path.split('?')[0];

const isPost = (list, name) => list.filter((e) => e.method === 'POST' && plainPath(e) === name);
const isPatch = (list, re) => list.filter((e) => e.method === 'PATCH' && re.test(plainPath(e)));
const isDelete = (list, re) => list.filter((e) => e.method === 'DELETE' && re.test(plainPath(e)));

async function openSession(opts) {
  const o = opts || {};
  const session = await newSession({
    cdpPort: CDP_PORT,
    appPort: APP_PORT,
    apiBase: API_BASE,
    isoDate: o.date || '2026-10-23',
    auth: o.auth === false ? null : AUTH,
    lang: o.lang || null,
    extended: o.extended === undefined ? 'off' : o.extended
  });
  if (o.auth !== false) {
    await waitFor(session.cdp, "document.querySelectorAll('.routine-card').length > 0", 20000);
  }
  return session;
}

async function close(session) {
  await closeSession(session, CDP_PORT);
}

/* Código executado na página para fotografar o estado da UI. */
const READ = `(() => {
  const q = (sel) => document.querySelector(sel);
  const text = (node) => node ? node.textContent.trim() : null;
  const rowsOf = (ex) => Array.from(ex.querySelectorAll('.set-row:not(.set-head)')).map((row) => {
    const inputs = Array.from(row.querySelectorAll('input'));
    return {
      kg: inputs[0] ? inputs[0].value : null,
      reps: inputs[1] ? inputs[1].value : null,
      rir: inputs[2] ? inputs[2].value : null,
      done: row.classList.contains('done')
    };
  });
  const blocks = Array.from(document.querySelectorAll('#workout-list .block')).map((block) => ({
    kicker: text(block.querySelector('.block-kicker')),
    title: text(block.querySelector('.block-title')),
    meta: text(block.querySelector('.block-meta')),
    chips: Array.from(block.querySelectorAll('.badges .chip')).map((c) => c.textContent.trim()),
    exercises: Array.from(block.querySelectorAll('.exercise')).map((ex) => ({
      name: text(ex.querySelector('.exercise-name')),
      chips: Array.from(ex.querySelectorAll('.badges .chip')).map((c) => c.textContent.trim()),
      rows: rowsOf(ex)
    })),
    cardio: Array.from(block.querySelectorAll('.cardio')).map((c) => {
      const inputs = Array.from(c.querySelectorAll('input'));
      return {
        title: text(c.querySelector('.cardio-title')),
        minutes: inputs[0] ? inputs[0].value : null,
        distance: inputs[1] ? inputs[1].value : null,
        done: c.classList.contains('done'),
        button: text(c.querySelector('.btn-primary'))
      };
    })
  }));
  const rect = (sel) => {
    const node = q(sel);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
  };
  const sheet = q('#cancel-sheet');
  const toast = q('#toast');
  const timer = q('#workout-timer');
  const rest = q('#rest-bar');
  const summary = q('#screen-summary');
  const loginError = q('#login-error');
  const activeScreen = q('#' + document.body.dataset.screen);
  const menuBtn = activeScreen ? activeScreen.querySelector('[data-menu-toggle]') : null;
  const menuToggle = q('[data-menu-extended]');
  const menuLinkNode = q('.menu-popover .menu-link');
  const aside = q('#workout-aside');
  const columns = (sel) => {
    const node = q(sel);
    if (!node) return null;
    return getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length;
  };
  return {
    screen: document.body.dataset.screen,
    lang: document.documentElement.lang,
    storedLang: localStorage.getItem('treino.lang.v1'),
    langButton: text(q('#screen-routines [data-lang-toggle]')),
    routines: Array.from(document.querySelectorAll('.routine-card h2')).map((h) => h.textContent.trim()),
    routinesSection: text(q('#screen-routines .section-label')),
    logout: text(q('#btn-logout')),
    empty: text(q('#workout-list .empty')),
    blocks: blocks,
    progress: text(q('#workout-progress')),
    cancelText: text(q('#btn-cancel')),
    toolsHidden: q('#workout-tools') ? q('#workout-tools').hidden : null,
    finishDisabled: q('#btn-finish') ? q('#btn-finish').disabled : null,
    timer: { hidden: timer ? timer.hidden : null, text: timer ? timer.textContent.trim() : null },
    exTimers: Array.from(document.querySelectorAll('.ex-timer')).map((n) => ({
      id: n.getAttribute('data-entry-id'), hidden: n.hidden, text: n.textContent.trim()
    })),
    rest: { hidden: rest ? rest.hidden : null, time: text(q('#rest-time')), label: text(q('#rest-label')) },
    toast: { hidden: toast ? toast.hidden : null, text: toast ? toast.textContent.trim() : null },
    sheet: {
      visible: sheet ? !sheet.hidden : null,
      title: text(q('#cancel-title')),
      body: text(q('#cancel-sheet .confirm-text')),
      dismiss: text(q('#cancel-dismiss')),
      confirm: text(q('#cancel-confirm'))
    },
    summary: {
      visible: summary ? !summary.hidden : null,
      sub: text(q('#summary-sub')),
      pairs: Array.from(document.querySelectorAll('#summary-stats > div')).map((box) => {
        const dt = box.querySelector('dt');
        return { label: dt ? dt.textContent.trim() : null, value: text(box.querySelector('dd')) };
      }),
      pendingItems: Array.from(document.querySelectorAll('.summary-pending-item')).map((p) => p.textContent.trim())
    },
    login: { error: text(q('#login-error')), errorHidden: loginError ? loginError.hidden : null },
    popover: Array.from(document.querySelectorAll('.rir-popover .rir-option')).map((n) => n.textContent.trim()),
    extended: {
      active: document.body.classList.contains('extended'),
      stored: localStorage.getItem('treino.extended.v1'),
      menuVisible: !!(menuBtn && menuBtn.offsetParent !== null),
      menuOpen: !!q('.menu-popover'),
      menuItems: Array.from(document.querySelectorAll('.menu-popover [data-popover-option]')).map((n) => {
        const label = n.querySelector('.menu-label') || n;
        return label.textContent.trim();
      }),
      checked: menuToggle ? menuToggle.getAttribute('aria-checked') : null,
      checkMark: q('.menu-popover .menu-check') ? q('.menu-popover .menu-check').textContent.trim() : null,
      link: menuLinkNode ? {
        href: menuLinkNode.getAttribute('href'),
        target: menuLinkNode.getAttribute('target'),
        rel: menuLinkNode.getAttribute('rel')
      } : null,
      aside: {
        hidden: aside ? aside.hidden : null,
        visible: aside ? aside.offsetParent !== null : null,
        rows: aside ? aside.querySelectorAll('.set-row:not(.set-head)').length : 0,
        setsInExercise: document.querySelectorAll('#workout-list .exercise .sets').length,
        clocks: aside ? aside.querySelectorAll('.aside-clock, .aside-rest').length : 0
      },
      columns: { routines: columns('.routines'), history: columns('.history'), workout: columns('#screen-workout .wrap') }
    },
    rects: { cancel: rect('#btn-cancel'), finish: rect('#btn-finish'), confirm: rect('.confirm-panel') },
    viewport: { sw: document.documentElement.scrollWidth, iw: window.innerWidth }
  };
})()`;

async function read(session) {
  return evaluate(session.cdp, READ);
}

async function click(session, selector, index) {
  const ok = await evaluate(session.cdp, `(() => {
    const nodes = document.querySelectorAll(${JSON.stringify(selector)});
    const node = nodes[${index || 0}];
    if (!node) return false;
    node.click();
    return true;
  })()`);
  if (!ok) throw new Error('elemento não encontrado: ' + selector + '[' + (index || 0) + ']');
}

async function clickInside(session, blockIdx, exIdx, rowIdx, selector) {
  const ok = await evaluate(session.cdp, `(() => {
    const block = document.querySelectorAll('#workout-list .block')[${blockIdx}];
    if (!block) return false;
    const exercise = block.querySelectorAll('.exercise')[${exIdx}];
    if (!exercise) return false;
    const row = exercise.querySelectorAll('.set-row:not(.set-head)')[${rowIdx}];
    if (!row) return false;
    const node = row.querySelector(${JSON.stringify(selector)});
    if (!node) return false;
    node.click();
    return true;
  })()`);
  if (!ok) throw new Error('elemento não encontrado: block ' + blockIdx + ' ex ' + exIdx + ' row ' + rowIdx + ' ' + selector);
}

async function fillSet(session, blockIdx, exIdx, rowIdx, field, value) {
  const inputIdx = { kg: 0, reps: 1, rir: 2 }[field];
  const ok = await evaluate(session.cdp, `(() => {
    const block = document.querySelectorAll('#workout-list .block')[${blockIdx}];
    if (!block) return false;
    const exercise = block.querySelectorAll('.exercise')[${exIdx}];
    if (!exercise) return false;
    const row = exercise.querySelectorAll('.set-row:not(.set-head)')[${rowIdx}];
    if (!row) return false;
    const input = row.querySelectorAll('input')[${inputIdx}];
    if (!input) return false;
    input.value = ${JSON.stringify(String(value))};
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error('input não encontrado: ' + field);
}

async function clickSet(session, blockIdx, exIdx, rowIdx) {
  await clickInside(session, blockIdx, exIdx, rowIdx, '.set-check');
}

async function fillCardio(session, index, field, value) {
  const ok = await evaluate(session.cdp, `(() => {
    const card = document.querySelectorAll('#workout-list .cardio')[${index}];
    if (!card) return false;
    const inputs = card.querySelectorAll('input');
    const input = inputs[${field === 'minutes' ? 0 : 1}];
    if (!input) return false;
    input.value = ${JSON.stringify(String(value))};
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error('cardio não encontrado: ' + index);
}

async function clickCardio(session, index) {
  const ok = await evaluate(session.cdp, `(() => {
    const card = document.querySelectorAll('#workout-list .cardio')[${index}];
    if (!card) return false;
    const button = card.querySelector('.btn-primary');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!ok) throw new Error('botão do cardio não encontrado: ' + index);
}

async function openRoutine(session, namePart) {
  const ok = await evaluate(session.cdp, `(() => {
    const cards = Array.from(document.querySelectorAll('.routine-card'));
    const card = cards.find((c) => {
      const h = c.querySelector('h2');
      return h && h.textContent.indexOf(${JSON.stringify(namePart)}) >= 0;
    });
    if (!card) return false;
    card.click();
    return true;
  })()`);
  if (!ok) throw new Error('rotina não encontrada: ' + namePart);
  await waitFor(session.cdp,
    "document.body.dataset.screen === 'screen-workout' && " +
    "(document.querySelectorAll('#workout-list .block').length > 0 || !!document.querySelector('#workout-list .empty'))", 20000);
  await sleep(250);
}

async function backToRoutines(session) {
  await click(session, '#btn-back');
  await waitFor(session.cdp, "document.body.dataset.screen === 'screen-routines'", 15000);
  await sleep(150);
}

async function openCancelSheet(session) {
  await click(session, '#btn-cancel');
  await waitFor(session.cdp, "!document.querySelector('#cancel-sheet').hidden", 8000);
}

async function pickLang(session, code) {
  await click(session, '#screen-routines [data-lang-toggle]');
  await waitFor(session.cdp, "!!document.querySelector('.lang-popover')", 8000);
  const ok = await evaluate(session.cdp, `(() => {
    const item = document.querySelector('.lang-popover [data-lang-code=${JSON.stringify(code)}]');
    if (!item) return false;
    item.click();
    return true;
  })()`);
  if (!ok) throw new Error('idioma não encontrado no popover: ' + code);
  await waitFor(session.cdp, "!document.querySelector('.lang-popover')", 8000);
  await sleep(200);
}

async function reload(session, waitExpr) {
  await session.cdp.send('Page.reload');
  await waitFor(session.cdp, "document.readyState === 'complete'", 20000);
  if (waitExpr) await waitFor(session.cdp, waitExpr, 20000);
}

const postLogs = (list) => isPost(list, '/api/v2/workoutlog/');
const patchLogs = (list) => isPatch(list, /^\/api\/v2\/workoutlog\/\d+\/$/);

async function waitPostLogs(n) {
  await until(async () => postLogs(await entries()).length >= n, 12000, n + ' POSTs de workoutlog');
}

async function waitPatchLogs(n) {
  await until(async () => patchLogs(await entries()).length >= n, 12000, n + ' PATCHes de workoutlog');
}

async function lastPatchBody(index) {
  const list = patchLogs(await entries());
  return list[index] ? list[index].body : null;
}

// ---------------------------------------------------------------- cenários

async function c0Login() {
  console.log('\n== C0 — login (allauth headless) ==');
  await resetMock();
  const s = await openSession({ auth: false });
  try {
    let r = await read(s);
    checkEq('C0 tela de login', r.screen, 'screen-login');

    await click(s, '#login-submit');
    await waitFor(s.cdp, "!document.querySelector('#login-error').hidden", 8000);
    r = await read(s);
    checkEq('C0 validação local', r.login.error, 'Preencha usuário e senha.');

    await evaluate(s.cdp, "document.querySelector('#login-user').value = 'teste'; document.querySelector('#login-pass').value = 'errada'; 1");
    await click(s, '#login-submit');
    await until(async () => {
      const st = await read(s);
      return st.login.error === 'Usuário ou senha inválidos.' && !st.screen.includes('routines');
    }, 12000, 'mensagem de credencial inválida');
    r = await read(s);
    checkEq('C0 credencial inválida', r.login.error, 'Usuário ou senha inválidos.');

    await evaluate(s.cdp, "document.querySelector('#login-user').value = 'teste'; document.querySelector('#login-pass').value = 'segredo'; 1");
    await click(s, '#login-submit');
    await waitFor(s.cdp, "document.querySelectorAll('.routine-card').length === 3", 20000);
    r = await read(s);
    checkEq('C0 entra nas rotinas', r.screen, 'screen-routines');
    checkEq('C0 nome do usuário', await evaluate(s.cdp, "document.querySelector('#user-name').textContent.trim()"), 'teste');
    checkEq('C0 três rotinas', r.routines.length, 3);
    check('C0 sem template', r.routines.every((name) => name.indexOf('Template') < 0), r.routines);

    const stored = await evaluate(s.cdp, "localStorage.getItem('treino.auth.v1')");
    check('C0 sessão salva', !!stored && JSON.parse(stored).access.length > 0);

    const list = await entries();
    const posts = isPost(list, '/allauth/app/v1/auth/login');
    checkEq('C0 POST de login', posts.length, 2);
    checkEq('C0 login com usuário teste', posts[posts.length - 1].body.username, 'teste');

    const routineGets = list.filter((e) => e.method === 'GET' && plainPath(e) === '/api/v2/routine/' &&
      e.path.indexOf('is_template=false') >= 0);
    check('C0 filtro de templates na API', routineGets.length > 0);
  } finally {
    await close(s);
  }
}

async function c1ForcaIteracao1() {
  console.log('\n== C1 — rotina Força, iteração 1 (dia 2026-10-23) ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await openRoutine(s, 'Rotina A');
    let r = await read(s);

    checkEq('C1 três blocos', r.blocks.length, 3);
    checkEq('C1 nome do primeiro exercício', r.blocks[0].exercises[0].name, 'Supino reto');
    checkEq('C1 3 séries de supino', r.blocks[0].exercises[0].rows.length, 3);
    checkEq('C1 kg prescrito', r.blocks[0].exercises[0].rows[0].kg, '50');
    checkEq('C1 reps prescritas', r.blocks[0].exercises[0].rows[0].reps, '8');
    checkEq('C1 RIR prescrito', r.blocks[0].exercises[0].rows[0].rir, '2');
    checkEq('C1 chip do esquema', r.blocks[0].exercises[0].chips[0], '3 × 8');
    checkEq('C1 kicker ausente sem comentário', r.blocks[0].kicker, null);
    checkEq('C1 título do bloco', r.blocks[0].title, 'Supino reto');
    checkEq('C1 superset com 2 exercícios', r.blocks[1].meta, '2 exercícios');
    checkEq('C1 progresso inicial', r.progress, '0/8 séries');
    checkEq('C1 tools visível', r.toolsHidden, false);
    checkEq('C1 botão cancelar traduzido', r.cancelText, 'Cancelar treino');
    check('C1 cronômetro visível', r.timer.hidden === false && !!r.timer.text, r.timer);

    await sleep(2200);
    const t2 = await read(s);
    check('C1 cronômetro avança', t2.timer.text !== r.timer.text, { antes: r.timer.text, depois: t2.timer.text });

    await openCancelSheet(s);
    r = await read(s);
    check('C1 sheet abre', r.sheet.visible === true);
    checkEq('C1 título do sheet', r.sheet.title, 'Cancelar treino?');
    checkEq('C1 corpo do sheet', r.sheet.body, 'Os registros desta sessão serão apagados.');
    checkEq('C1 dispensar', r.sheet.dismiss, 'Voltar');
    checkEq('C1 confirmar', r.sheet.confirm, 'Cancelar treino');

    await evaluate(s.cdp, "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    r = await read(s);
    check('C1 Escape fecha e preserva treino', !r.sheet.visible && r.blocks.length === 3);

    await clickSet(s, 0, 0, 0);
    await waitPostLogs(1);
    let list = await entries();
    let body = postLogs(list)[0].body;
    checkEq('C1 POST iteration', body.iteration, 1);
    checkEq('C1 POST peso', body.weight, 50);
    checkEq('C1 POST reps', body.repetitions, 8);
    checkEq('C1 POST RIR', body.rir, 2);
    checkEq('C1 POST descanso', body.rest, 40);
    checkEq('C1 POST slot_entry', body.slot_entry, 500);
    checkEq('C1 POST exercício', body.exercise, 10);
    checkEq('C1 POST sessão', body.session, 900);
    checkEq('C1 POST data local', body.date, '2026-10-23');
    checkEq('C1 POST target de reps', body.repetitions_target, 8);

    r = await read(s);
    checkEq('C1 progresso após 1 série', r.progress, '1/8 séries');
    check('C1 linha marcada', r.blocks[0].exercises[0].rows[0].done === true);
    check('C1 barra de descanso visível', r.rest.hidden === false, r.rest);
    checkEq('C1 descanso 0:40', r.rest.time, '0:40');
    checkEq('C1 rótulo descanso', r.rest.label, 'Descanso');

    await sleep(2300);
    r = await read(s);
    const restSeconds = Number(r.rest.time.split(':')[0]) * 60 + Number(r.rest.time.split(':')[1]);
    check('C1 descanso regressivo', r.rest.time !== '0:40' && restSeconds < 40 && restSeconds > 30, r.rest.time);

    await click(s, '#rest-skip');
    await waitFor(s.cdp, "document.querySelector('#rest-bar').hidden", 8000);
    check('C1 pular descanso', (await read(s)).rest.hidden === true);

    await fillSet(s, 0, 0, 0, 'kg', '55');
    await waitPatchLogs(1);
    body = await lastPatchBody(0);
    checkEq('C1 PATCH de carga', body.weight, 55);
    checkEq('C1 PATCH unidade da carga', body.weight_unit, 1);
    check('C1 PATCH só com carga', Object.keys(body).length === 2, body);

    await fillSet(s, 0, 0, 0, 'reps', '7');
    await waitPatchLogs(2);
    body = await lastPatchBody(1);
    checkEq('C1 PATCH de reps', body.repetitions, 7);
    check('C1 PATCH só com reps', Object.keys(body).length === 1, body);

    await fillSet(s, 0, 0, 0, 'rir', '1');
    await waitPatchLogs(3);
    body = await lastPatchBody(2);
    checkEq('C1 PATCH de RIR digitado', body.rir, 1);

    await clickInside(s, 0, 0, 0, '.rir-toggle');
    await waitFor(s.cdp, "!!document.querySelector('.rir-popover')", 8000);
    r = await read(s);
    checkEq('C1 popover com 4 opções', r.popover.length, 4);
    checkIncludes('C1 opção de RIR 3', r.popover.join(' | '), '3 — sobravam 3 repetições (leve)');
    const picked = await evaluate(s.cdp, `(() => {
      const items = Array.from(document.querySelectorAll('.rir-popover .rir-option'));
      const item = items.find((n) => n.textContent.trim().charAt(0) === '3');
      if (!item) return false;
      item.click();
      return true;
    })()`);
    check('C1 opção de RIR clicada', picked === true);
    await waitPatchLogs(4);
    body = await lastPatchBody(3);
    checkEq('C1 PATCH de RIR pelo seletor', body.rir, 3);
    checkEq('C1 input após seletor', (await read(s)).blocks[0].exercises[0].rows[0].rir, '3');

    await fillSet(s, 0, 0, 0, 'rir', '');
    await waitPatchLogs(5);
    body = await lastPatchBody(4);
    checkEq('C1 RIR vazio volta ao padrão', body.rir, 2);
    checkEq('C1 input volta ao padrão', (await read(s)).blocks[0].exercises[0].rows[0].rir, '2');

    r = await read(s);
    const runningTimer = r.exTimers.filter((t) => t.id === '500' && !t.hidden);
    check('C1 cronômetro do exercício visível', runningTimer.length === 1, r.exTimers);

    await clickSet(s, 0, 0, 1);
    await waitPostLogs(2);
    list = await entries();
    body = postLogs(list)[1].body;
    checkEq('C1 segundo POST de série', body.slot_entry, 500);
    checkEq('C1 segundo POST sessão', body.session, 900);
    r = await read(s);
    checkEq('C1 progresso após 2 séries', r.progress, '2/8 séries');

    await failNext('PATCH', 'workoutlog/', 5);
    await fillSet(s, 0, 0, 0, 'kg', '60');
    await sleep(700);
    await click(s, '#btn-finish');
    await waitFor(s.cdp, "!document.querySelector('#screen-summary').hidden", 25000);
    await sleep(300);

    r = await read(s);
    check('C1 tela de resumo', r.summary.visible === true);
    checkIncludes('C1 pendência registrada', r.summary.pendingItems.join(' | '), 'Supino reto — série 1');
    const setsPair = r.summary.pairs.find((p) => p.label === 'Séries');
    checkEq('C1 séries no resumo', setsPair ? setsPair.value : null, '2');
    const pendingPair = r.summary.pairs.find((p) => p.label === 'Pendências');
    check('C1 bloco de pendências', !!pendingPair, r.summary.pairs);

    list = await entries();
    const sessionPatch = isPatch(list, /^\/api\/v2\/workoutsession\/\d+\/$/);
    checkEq('C1 PATCH de datetime_end', sessionPatch.length, 1);
    check('C1 datetime_end enviado', !!sessionPatch[0].body.datetime_end, sessionPatch[0].body);
    checkEq('C1 rascunho removido',
      await evaluate(s.cdp, "localStorage.getItem('treino.workout.1')"), null);
  } finally {
    await close(s);
  }
}

async function c2ForcaIteracao2() {
  console.log('\n== C2 — rotina Força, iteração 2 (dia 2026-10-24, retomada) ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-24' });
  try {
    await openRoutine(s, 'Rotina A');
    let r = await read(s);
    checkEq('C2 kg da 2ª iteração', r.blocks[0].exercises[0].rows[0].kg, '51.25');
    checkEq('C2 RIR da 2ª iteração', r.blocks[0].exercises[0].rows[0].rir, '1');

    await clickSet(s, 0, 0, 0);
    await waitPostLogs(1);
    const list = await entries();
    const body = postLogs(list)[0].body;
    checkEq('C2 POST iteration 2', body.iteration, 2);
    checkEq('C2 POST descanso 80s', body.rest, 80);
    checkEq('C2 POST data', body.date, '2026-10-24');

    r = await read(s);
    checkEq('C2 descanso 1:20', r.rest.time, '1:20');
    await click(s, '#rest-skip');
    await waitFor(s.cdp, "document.querySelector('#rest-bar').hidden", 8000);

    const draft = await evaluate(s.cdp, "localStorage.getItem('treino.workout.1')");
    const parsed = draft ? JSON.parse(draft) : null;
    check('C2 rascunho salvo', !!parsed, parsed);
    checkEq('C2 iteration no rascunho', parsed ? parsed.iteration : null, 2);
    checkEq('C2 data no rascunho', parsed ? parsed.date : null, '2026-10-24');
    checkEq('C2 logId no rascunho', parsed && parsed.sets['500:0'] ? parsed.sets['500:0'].logId : null, 1000);

    await evaluate(s.cdp, "localStorage.removeItem('treino.rest.v1'); 1");
    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C2 série retomada marcada', r.blocks[0].exercises[0].rows[0].done, true);
    checkEq('C2 demais séries com kg da iteração', r.blocks[0].exercises[0].rows[1].kg, '51.25');
    checkEq('C2 progresso após retomar', r.progress, '1/8 séries');
    checkEq('C2 tools volta visível na retomada', r.toolsHidden, false);
  } finally {
    await close(s);
  }
}

async function c3Cardio() {
  console.log('\n== C3 — rotina Cardio (tempo e distância) ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await openRoutine(s, 'Rotina B');
    let r = await read(s);
    checkEq('C3 um bloco', r.blocks.length, 1);
    checkEq('C3 meta 10 min', r.blocks[0].meta, '10 min');
    checkEq('C3 tempo pré-preenchido', r.blocks[0].cardio[0].minutes, '10');
    checkEq('C3 distância vazia', r.blocks[0].cardio[0].distance, '');

    await fillCardio(s, 0, 'minutes', '12');
    await fillCardio(s, 0, 'distance', '2.5');
    await clickCardio(s, 0);
    await waitPostLogs(2);

    const posts = postLogs(await entries());
    const minutes = posts.find((e) => e.body.repetitions_unit === 4);
    const distance = posts.find((e) => e.body.repetitions_unit === 6);
    check('C3 POST de minutos', !!minutes, posts.map((e) => e.body));
    checkEq('C3 minutos', minutes ? minutes.body.repetitions : null, 12);
    checkEq('C3 meta dos minutos', minutes ? minutes.body.repetitions_target : null, 10);
    checkEq('C3 sessão dos minutos', minutes ? minutes.body.session : null, 900);
    checkEq('C3 iteration do cardio', minutes ? minutes.body.iteration : null, 3);
    check('C3 POST de distância', !!distance, posts.map((e) => e.body));
    checkEq('C3 distância', distance ? distance.body.repetitions : null, 2.5);
    checkEq('C3 sessão da distância', distance ? distance.body.session : null, 900);

    r = await read(s);
    check('C3 cartão marcado', r.blocks[0].cardio[0].done === true);

    await fillCardio(s, 0, 'minutes', '15');
    await waitPatchLogs(1);
    const patch = patchLogs(await entries())[0];
    checkEq('C3 PATCH do tempo em /1000/', plainPath(patch), '/api/v2/workoutlog/1000/');
    checkEq('C3 PATCH repetitions', patch.body.repetitions, 15);

    await fillCardio(s, 0, 'distance', '');
    await until(async () => isDelete(await entries(), /^\/api\/v2\/workoutlog\/1001\/$/).length === 1,
      12000, 'DELETE da distância');
    const dels = isDelete(await entries(), /^\/api\/v2\/workoutlog\/\d+\/$/);
    checkEq('C3 um DELETE', dels.length, 1);
    checkEq('C3 distância apagada', plainPath(dels[0]), '/api/v2/workoutlog/1001/');
  } finally {
    await close(s);
  }
}

async function c4CancelarCardio() {
  console.log('\n== C4 — cancelar treino de cardio ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await openRoutine(s, 'Rotina B');
    await fillCardio(s, 0, 'minutes', '12');
    await fillCardio(s, 0, 'distance', '2.5');
    await clickCardio(s, 0);
    await waitPostLogs(2);

    await openCancelSheet(s);
    let r = await read(s);
    check('C4 sheet abre no cardio', r.sheet.visible === true);
    await click(s, '#cancel-confirm');
    await waitFor(s.cdp, "document.body.dataset.screen === 'screen-routines'", 20000);

    r = await read(s);
    checkEq('C4 volta para rotinas', r.screen, 'screen-routines');
    checkEq('C4 toast de cancelamento', r.toast.text, 'Treino cancelado');
    checkEq('C4 toast visível', r.toast.hidden, false);
    checkEq('C4 tools escondido', r.toolsHidden, true);

    const list = await entries();
    const dels = isDelete(list, /^\/api\/v2\/workoutlog\/\d+\/$/).map((e) => plainPath(e)).sort();
    checkEq('C4 DELETE dos 2 logs', dels.join(','), '/api/v2/workoutlog/1000/,/api/v2/workoutlog/1001/');
    const sessionDels = isDelete(list, /^\/api\/v2\/workoutsession\/\d+\/$/);
    checkEq('C4 DELETE da sessão', sessionDels.length, 1);
    checkEq('C4 sessão apagada', sessionDels.length ? plainPath(sessionDels[0]) : null, '/api/v2/workoutsession/900/');
    checkEq('C4 sem datetime_end', isPatch(list, /^\/api\/v2\/workoutsession\/\d+\/$/).length, 0);
    checkEq('C4 rascunho limpo', await evaluate(s.cdp, "localStorage.getItem('treino.workout.2')"), null);
  } finally {
    await close(s);
  }
}

async function c5CancelarForca() {
  console.log('\n== C5 — cancelar treino de força (dispensar, backdrop e confirmar) ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await openRoutine(s, 'Rotina A');
    await clickSet(s, 0, 0, 0);
    await waitPostLogs(1);
    await clickSet(s, 0, 0, 1);
    await waitPostLogs(2);

    let r = await read(s);
    checkEq('C5 duas séries registradas', r.progress, '2/8 séries');
    check('C5 descanso ativo', r.rest.hidden === false);

    await openCancelSheet(s);
    await click(s, '#cancel-dismiss');
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    r = await read(s);
    check('C5 dispensar mantém o treino', r.blocks.length === 3 && r.progress === '2/8 séries');
    checkEq('C5 sessão preservada', isDelete(await entries(), /^\/api\/v2\/workoutlog\//).length, 0);

    await openCancelSheet(s);
    await click(s, '#cancel-sheet');
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    r = await read(s);
    check('C5 clique no fundo fecha', !r.sheet.visible && r.blocks.length === 3);

    await openCancelSheet(s);
    await click(s, '#cancel-confirm');
    await waitFor(s.cdp, "document.body.dataset.screen === 'screen-routines'", 20000);

    r = await read(s);
    checkEq('C5 volta para rotinas', r.screen, 'screen-routines');
    checkEq('C5 toast', r.toast.text, 'Treino cancelado');
    checkEq('C5 timer parado', r.timer.hidden, true);
    checkEq('C5 descanso parado', r.rest.hidden, true);
    checkEq('C5 tools escondido', r.toolsHidden, true);

    const list = await entries();
    const dels = isDelete(list, /^\/api\/v2\/workoutlog\/\d+\/$/).map((e) => plainPath(e)).sort();
    checkEq('C5 DELETE dos 2 logs', dels.join(','), '/api/v2/workoutlog/1000/,/api/v2/workoutlog/1001/');
    const sessionDels = isDelete(list, /^\/api\/v2\/workoutsession\/\d+\/$/);
    checkEq('C5 DELETE da sessão', sessionDels.length ? plainPath(sessionDels[0]) : null, '/api/v2/workoutsession/900/');
    checkEq('C5 sem datetime_end', isPatch(list, /^\/api\/v2\/workoutsession\/\d+\/$/).length, 0);
    checkEq('C5 rascunho limpo', await evaluate(s.cdp, "localStorage.getItem('treino.workout.1')"), null);
  } finally {
    await close(s);
  }
}

async function c6Descanso() {
  console.log('\n== C6 — rotina com dia de descanso ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await openRoutine(s, 'Rotina C');
    const r = await read(s);
    checkIncludes('C6 aviso de descanso', r.empty, 'Hoje é dia de descanso nesta rotina.');
    checkIncludes('C6 detalhe do descanso', r.empty, 'Caminhe e durma bem.');
    checkEq('C6 tools escondido', r.toolsHidden, true);
    checkEq('C6 concluir desabilitado', r.finishDisabled, true);
    checkEq('C6 sem blocos', r.blocks.length, 0);
  } finally {
    await close(s);
  }
}

async function c7Idiomas() {
  console.log('\n== C7 — idiomas (pt, en, es) e persistência ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23', lang: 'pt-BR' });
  try {
    let r = await read(s);
    checkEq('C7 pt: sair', r.logout, 'Sair');
    checkEq('C7 pt: seção', r.routinesSection, 'Suas rotinas');

    await pickLang(s, 'en');
    await waitFor(s.cdp, "document.querySelector('#btn-logout').textContent.trim() === 'Sign out'", 12000);
    r = await read(s);
    checkEq('C7 en: sair', r.logout, 'Sign out');
    checkEq('C7 en: seção', r.routinesSection, 'Your routines');
    checkEq('C7 en: botão cancelar', r.cancelText, 'Cancel workout');
    checkEq('C7 en: idioma salvo', r.storedLang, 'en');
    checkEq('C7 en: <html lang>', r.lang, 'en');

    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C7 en: tradução do exercício', r.blocks[0].exercises[0].name, 'Bench Press');
    checkEq('C7 en: fallback em pt', r.blocks[1].exercises[0].name, 'Rosca direta');
    await openCancelSheet(s);
    r = await read(s);
    checkEq('C7 en: título do sheet', r.sheet.title, 'Cancel workout?');
    checkEq('C7 en: corpo do sheet', r.sheet.body, "This session's records will be deleted.");
    checkEq('C7 en: dispensar', r.sheet.dismiss, 'Back');
    await click(s, '#cancel-dismiss');
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    await backToRoutines(s);

    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await waitFor(s.cdp, "document.querySelector('#btn-logout').textContent.trim() === 'Sign out'", 15000);
    r = await read(s);
    checkEq('C7 en persiste após reload', r.logout, 'Sign out');
    checkEq('C7 botão de idioma', r.langButton, 'EN');

    await pickLang(s, 'es');
    await waitFor(s.cdp, "document.querySelector('#btn-logout').textContent.trim() === 'Salir'", 12000);
    r = await read(s);
    checkEq('C7 es: sair', r.logout, 'Salir');
    checkEq('C7 es: seção', r.routinesSection, 'Tus rutinas');
    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C7 es: exercício', r.blocks[0].exercises[0].name, 'Press de banca');
    await openCancelSheet(s);
    r = await read(s);
    checkEq('C7 es: título do sheet', r.sheet.title, '¿Cancelar entrenamiento?');
    await click(s, '#cancel-dismiss');
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    await backToRoutines(s);

    await pickLang(s, 'pt-BR');
    await waitFor(s.cdp, "document.querySelector('#btn-logout').textContent.trim() === 'Sair'", 12000);
    r = await read(s);
    checkEq('C7 pt de volta', r.logout, 'Sair');
    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C7 pt: exercício', r.blocks[0].exercises[0].name, 'Supino reto');
    await openCancelSheet(s);
    r = await read(s);
    checkEq('C7 pt: título do sheet', r.sheet.title, 'Cancelar treino?');
    checkEq('C7 pt: dispensar', r.sheet.dismiss, 'Voltar');
  } finally {
    await close(s);
  }
}

async function c8Mobile() {
  console.log('\n== C8 — 360 px sem overflow ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23' });
  try {
    await s.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 800, deviceScaleFactor: 2, mobile: true
    });
    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await sleep(200);

    let r = await read(s);
    checkEq('C8 viewport 360', r.viewport.iw, 360);
    check('C8 rotinas sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);

    await openRoutine(s, 'Rotina A');
    r = await read(s);
    check('C8 treino sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);
    check('C8 botão cancelar dentro da tela', r.rects.cancel && r.rects.cancel.left >= 0 && r.rects.cancel.right <= r.viewport.iw, r.rects.cancel);
    check('C8 botão concluir dentro da tela', r.rects.finish && r.rects.finish.left >= 0 && r.rects.finish.right <= r.viewport.iw, r.rects.finish);

    await openCancelSheet(s);
    r = await read(s);
    check('C8 sheet sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);
    check('C8 painel do sheet dentro da tela', r.rects.confirm && r.rects.confirm.left >= 0 && r.rects.confirm.right <= r.viewport.iw,
      r.rects.confirm);

    await click(s, '#cancel-dismiss');
    await waitFor(s.cdp, "document.querySelector('#cancel-sheet').hidden", 8000);
    await s.cdp.send('Emulation.clearDeviceMetricsOverride');
  } finally {
    await close(s);
  }
}

async function c9Menu() {
  console.log('\n== C9 — menu "⋯": abrir, itens, fechar e link ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23', lang: 'pt-BR' });
  try {
    let r = await read(s);
    checkEq('C9 padrão desligado', r.extended.active, false);
    checkEq('C9 escolha inicial', r.extended.stored, 'off');
    checkEq('C9 botão do menu visível', r.extended.menuVisible, true);

    await click(s, '#screen-routines [data-menu-toggle]');
    await waitFor(s.cdp, "!!document.querySelector('.menu-popover')", 8000);
    r = await read(s);
    checkEq('C9 menu abre', r.extended.menuOpen, true);
    checkEq('C9 itens do menu', JSON.stringify(r.extended.menuItems), JSON.stringify(['Modo estendido', 'Interface web completa']));
    checkEq('C9 estado do toggle', r.extended.checked, 'false');
    checkEq('C9 sem check quando desligado', r.extended.checkMark, '');
    checkEq('C9 link href', r.extended.link && r.extended.link.href, '/');
    checkEq('C9 link nova aba', r.extended.link && r.extended.link.target, '_blank');
    checkEq('C9 link sem opener', r.extended.link && r.extended.link.rel, 'noopener');

    await evaluate(s.cdp, "document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
    await waitFor(s.cdp, "!document.querySelector('.menu-popover')", 8000);
    check('C9 Escape fecha', true);

    await click(s, '#screen-routines [data-menu-toggle]');
    await waitFor(s.cdp, "!!document.querySelector('.menu-popover')", 8000);
    await evaluate(s.cdp, "document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); 1");
    await waitFor(s.cdp, "!document.querySelector('.menu-popover')", 8000);
    check('C9 clique fora fecha', true);

    await click(s, '#btn-history');
    await waitFor(s.cdp, "document.body.dataset.screen === 'screen-history'", 12000);
    r = await read(s);
    checkEq('C9 menu também no histórico', r.extended.menuVisible, true);
  } finally {
    await close(s);
  }
}

async function c10Extended() {
  console.log('\n== C10 — modo estendido em 1280 px ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23', lang: 'pt-BR' });
  try {
    await s.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 900, deviceScaleFactor: 1, mobile: false
    });
    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await sleep(250);

    await click(s, '#screen-routines [data-menu-toggle]');
    await waitFor(s.cdp, "!!document.querySelector('.menu-popover')", 8000);
    await click(s, '.menu-popover [data-menu-extended]');
    await waitFor(s.cdp, "document.body.classList.contains('extended')", 8000);
    await sleep(250);

    let r = await read(s);
    checkEq('C10 liga a classe', r.extended.active, true);
    checkEq('C10 grava a escolha', r.extended.stored, 'on');
    checkEq('C10 popover fecha ao escolher', r.extended.menuOpen, false);
    check('C10 rotinas em 2+ colunas', r.extended.columns.routines >= 2, r.extended.columns);
    check('C10 rotinas sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);

    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C10 treino em duas colunas', r.extended.columns.workout, 2);
    checkEq('C10 coluna lateral visível', r.extended.aside.visible, true);
    check('C10 séries na coluna lateral', r.extended.aside.rows > 0, r.extended.aside);
    check('C10 coluna lateral com cronômetros', r.extended.aside.clocks >= 2, r.extended.aside);
    check('C10 treino sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);

    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await sleep(250);
    r = await read(s);
    checkEq('C10 modo persiste após reload', r.extended.active, true);
    checkEq('C10 escolha persiste após reload', r.extended.stored, 'on');

    await click(s, '#screen-routines [data-menu-toggle]');
    await waitFor(s.cdp, "!!document.querySelector('.menu-popover')", 8000);
    r = await read(s);
    checkEq('C10 check quando ligado', r.extended.checkMark, '✓');
    checkEq('C10 aria-checked ligado', r.extended.checked, 'true');
    await click(s, '.menu-popover [data-menu-extended]');
    await waitFor(s.cdp, "!document.body.classList.contains('extended')", 8000);
    r = await read(s);
    checkEq('C10 desliga a classe', r.extended.active, false);
    checkEq('C10 grava desligado', r.extended.stored, 'off');

    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C10 sem duas colunas ao desligar', r.extended.columns.workout, 1);
    check('C10 séries de volta ao cartão', r.extended.aside.setsInExercise > 0, r.extended.aside);

    await s.cdp.send('Emulation.clearDeviceMetricsOverride');
  } finally {
    await close(s);
  }
}

async function c11ExtendedMobile() {
  console.log('\n== C11 — modo estendido ligado em 360 px continua mobile ==');
  await resetMock();
  const s = await openSession({ date: '2026-10-23', lang: 'pt-BR', extended: 'on' });
  try {
    await s.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 800, deviceScaleFactor: 2, mobile: true
    });
    await reload(s, "document.body.dataset.screen === 'screen-routines' && document.querySelectorAll('.routine-card').length === 3");
    await sleep(250);

    let r = await read(s);
    checkEq('C11 classe ligada', r.extended.active, true);
    checkEq('C11 rotinas em 1 coluna', r.extended.columns.routines, 1);
    check('C11 rotinas sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);
    checkEq('C11 menu oculto no mobile', r.extended.menuVisible, false);

    await openRoutine(s, 'Rotina A');
    r = await read(s);
    checkEq('C11 treino em 1 coluna', r.extended.columns.workout, 1);
    checkEq('C11 coluna lateral oculta', r.extended.aside.hidden, true);
    check('C11 séries dentro do exercício', r.extended.aside.setsInExercise > 0, r.extended.aside);
    check('C11 treino sem overflow', r.viewport.sw <= r.viewport.iw, r.viewport);

    await s.cdp.send('Emulation.clearDeviceMetricsOverride');
  } finally {
    await close(s);
  }
}

// ---------------------------------------------------------------- execução

async function main() {
  const chromeBin = findChrome();
  if (!chromeBin) {
    console.error('Chromium/Chrome não encontrado no PATH. Defina CHROMIUM=/caminho/do/binário.');
    process.exit(1);
  }

  const profile = tempProfile();
  let staticServer = null;
  let mockServer = null;
  let chrome = null;

  try {
    staticServer = await serveStatic(WEBAPP, APP_PORT);
    const started = await mock.start(MOCK_PORT);
    mockServer = started.server;
    AUTH.access = started.token;

    chrome = await startChrome(chromeBin, CDP_PORT, profile);
    console.log('Chromium: ' + chromeBin);
    console.log('App: ' + APP_URL + '  API mock: ' + API_BASE);

    await c0Login();
    await c1ForcaIteracao1();
    await c2ForcaIteracao2();
    await c3Cardio();
    await c4CancelarCardio();
    await c5CancelarForca();
    await c6Descanso();
    await c7Idiomas();
    await c8Mobile();
    await c9Menu();
    await c10Extended();
    await c11ExtendedMobile();
  } finally {
    if (chrome) {
      try { chrome.kill('SIGKILL'); } catch (err) { /* noop */ }
    }
    if (mockServer) mockServer.close();
    if (staticServer) staticServer.close();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (err) { /* noop */ }
  }

  const failed = results.filter((item) => !item.ok);
  const total = results.length;
  console.log('\n' + (total - failed.length) + '/' + total + ' verificações OK');
  if (failed.length) {
    console.log('Falhas:');
    failed.forEach((item) => console.log(' - ' + item.name + '  -> ' + JSON.stringify(item.detail)));
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('\nERRO FATAL:', err && err.stack ? err.stack : err);
  process.exit(2);
});
