'use strict';
/* Mock da API wger v2 + allauth headless.
 * Payloads enlatados para os cenários da suíte. Sem dependências externas.
 * Endpoints de controle (fora de /api): /__log, /__reset, /__fail. */

const http = require('http');

const TOKEN = 'header.' + Buffer.from(JSON.stringify({ exp: 4102444800, user_id: 1 })).toString('base64url') + '.signature';

const log = [];
const failures = [];

function setItem(slotEntryId, exercise, weight, rest, rir, reps, unit) {
  return {
    slot_entry_id: slotEntryId,
    exercise: exercise,
    sets: 1,
    weight: weight,
    weight_unit: 1,
    repetitions: reps,
    repetitions_unit: unit || 1,
    rir: rir == null ? null : String(rir),
    rest: String(rest),
    type: 'normal',
    text_repr: '',
    comment: 'Exercício ' + exercise,
    max_weight: null,
    max_repetitions: null,
    rpe: null
  };
}

function day(id, routine, iteration, date, weight, rest, rir, isRest) {
  const d = {
    date: date,
    iteration: iteration,
    label: 'Semana ' + iteration,
    day: {
      id: id,
      routine: routine,
      order: iteration,
      name: 'Dia ' + iteration,
      description: isRest ? 'Caminhe e durma bem.' : '',
      is_rest: !!isRest,
      need_logs_to_advance: false,
      type: isRest ? 'rest' : 'gym',
      config: {}
    },
    slots: []
  };
  if (isRest) return d;
  d.slots = [
    {
      comment: '',
      is_superset: false,
      exercises: [10],
      sets: [
        setItem(500, 10, weight, rest, rir, '8'),
        setItem(500, 10, weight, rest, rir, '8'),
        setItem(500, 10, weight, rest, rir, '8')
      ]
    },
    {
      comment: 'Rosca + tríceps',
      is_superset: true,
      exercises: [11, 12],
      sets: [
        setItem(501, 11, 30, rest, rir, '10'),
        setItem(502, 12, 20, rest, rir, '10'),
        setItem(501, 11, 30, rest, rir, '10'),
        setItem(502, 12, 20, rest, rir, '10')
      ]
    },
    {
      comment: 'Aquecimento — barra vazia',
      is_superset: false,
      exercises: [13],
      sets: [Object.assign(setItem(503, 13, null, 30, null, '15'), { type: 'warmup' })]
    }
  ];
  return d;
}

function cardioDay() {
  return {
    date: '2026-10-23',
    iteration: 3,
    label: 'Semana 1',
    day: {
      id: 30,
      routine: 2,
      order: 1,
      name: 'Cardio',
      description: '',
      is_rest: false,
      need_logs_to_advance: false,
      type: 'cardio',
      config: {}
    },
    slots: [{
      comment: 'Esteira — moderado',
      is_superset: false,
      exercises: [20],
      sets: [setItem(600, 20, null, 0, null, '10', 4)]
    }]
  };
}

const sequences = {
  1: [
    day(11, 1, 1, '2026-10-23', 50, 40, 2, false),
    day(12, 1, 2, '2026-10-24', 51.25, 80, 1, false)
  ],
  2: [cardioDay()],
  3: [day(31, 3, 1, '2026-10-23', null, 0, null, true)]
};

const routines = [
  { id: 1, name: 'Rotina A — Força', description: 'Teste' },
  { id: 2, name: 'Rotina B — Cardio', description: 'Teste' },
  { id: 3, name: 'Rotina C — Descanso', description: 'Teste' }
];

const templates = [
  { id: 9, name: 'Template — Full Body', description: 'Modelo', is_template: true }
];

let nextLogId = 1000;

function json(res, status, body) {
  const payload = body == null ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS'
  });
  res.end(payload);
}

function noContent(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS'
  });
  res.end();
}

function start(port) {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const url = new URL(req.url, 'http://127.0.0.1');
      const path = url.pathname;
      let body = null;
      if (raw) { try { body = JSON.parse(raw); } catch (e) { body = raw; } }

      if (req.method === 'OPTIONS') return json(res, 204, null);

      if (path === '/__log') return json(res, 200, { entries: log, token: TOKEN });
      if (path === '/__reset') {
        log.length = 0;
        failures.length = 0;
        nextLogId = 1000;
        return json(res, 200, { ok: true });
      }
      if (path === '/__fail') {
        failures.push({
          method: body && body.method ? body.method : null,
          match: (body && body.match) || '',
          count: body && body.count ? body.count : 1,
          status: body && body.status ? body.status : 500
        });
        return json(res, 200, { ok: true });
      }

      // allauth headless
      if (req.method === 'POST' && path === '/allauth/app/v1/auth/login') {
        log.push({ method: req.method, path: path + url.search, body: body });
        const ok = body && body.username === 'teste' && body.password === 'segredo';
        if (!ok) {
          return json(res, 400, { errors: [{ message: 'Unable to log in with provided credentials.', code: 'invalid' }] });
        }
        return json(res, 200, {
          meta: { access_token: TOKEN, refresh_token: 'refresh-token', session_token: 'session-token' },
          data: { user: { username: 'teste' } }
        });
      }

      if (!path.startsWith('/api/v2/')) return json(res, 404, { detail: 'no route' });

      const rest = path.slice('/api/v2/'.length);
      log.push({ method: req.method, path: path + url.search, body: body });

      const failure = failures.find((f) =>
        f.count > 0 &&
        (!f.method || f.method === req.method) &&
        rest.indexOf(f.match) >= 0
      );
      if (failure) {
        failure.count -= 1;
        return json(res, failure.status, { detail: 'falha simulada' });
      }

      let m;
      if (req.method === 'GET' && rest === 'routine/') {
        const filtered = url.searchParams.get('is_template') === 'false';
        const results = filtered ? routines : routines.concat(templates);
        return json(res, 200, { count: results.length, results: results });
      }
      if (req.method === 'GET' && (m = /^routine\/(\d+)\/date-sequence-gym\/$/.exec(rest))) {
        const seq = sequences[Number(m[1])];
        return seq ? json(res, 200, seq) : json(res, 404, { detail: 'not found' });
      }
      if (req.method === 'GET' && rest === 'exercise-translation/') {
        const lang = url.searchParams.get('language');
        if (lang === '2') {
          return json(res, 200, { results: [
            { exercise: 10, name: 'Bench Press', language: 2 }
          ] });
        }
        if (lang === '4') {
          return json(res, 200, { results: [
            { exercise: 10, name: 'Press de banca', language: 4 }
          ] });
        }
        return json(res, 200, { results: [
          { exercise: 10, name: 'Supino reto', language: 7 },
          { exercise: 11, name: 'Rosca direta', language: 7 },
          { exercise: 12, name: 'Tríceps testa', language: 7 },
          { exercise: 13, name: 'Barra vazia', language: 7 },
          { exercise: 20, name: 'Corrida na esteira', language: 7 }
        ] });
      }
      if (req.method === 'GET' && rest === 'video/') return json(res, 200, { results: [] });
      if (req.method === 'GET' && rest === 'workoutlog/') {
        if (url.searchParams.get('exercise__in')) {
          return json(res, 200, { results: [
            { id: 800, exercise: 10, date: '2026-10-20', weight: '45.00', repetitions: '8', repetitions_unit: 1 }
          ] });
        }
        return json(res, 200, { results: [] });
      }
      if (req.method === 'POST' && rest === 'workoutlog/') {
        const id = nextLogId++;
        return json(res, 201, Object.assign({ id: id }, body));
      }
      if (req.method === 'DELETE' && (m = /^workoutlog\/(\d+)\/$/.exec(rest))) {
        return noContent(res);
      }
      if (req.method === 'PATCH' && (m = /^workoutlog\/(\d+)\/$/.exec(rest))) {
        return json(res, 200, Object.assign({ id: Number(m[1]) }, body));
      }
      if (req.method === 'POST' && rest === 'workoutsession/') {
        return json(res, 201, Object.assign({ id: 900 }, body));
      }
      if (req.method === 'PATCH' && (m = /^workoutsession\/(\d+)\/$/.exec(rest))) {
        return json(res, 200, Object.assign({ id: Number(m[1]) }, body));
      }
      if (req.method === 'DELETE' && (m = /^workoutsession\/(\d+)\/$/.exec(rest))) {
        return noContent(res);
      }
      return json(res, 404, { detail: 'no route: ' + req.method + ' ' + rest });
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, token: TOKEN })));
}

module.exports = { start, log };
