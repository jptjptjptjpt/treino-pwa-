/* Modo treino — PWA sem dependências.
 * Fala com a API v2 do wger e com o allauth headless (app client) da mesma origem.
 */
(function () {
  'use strict';

  var qs = new URLSearchParams(location.search);
  var API_BASE = (qs.get('api') || location.origin).replace(/\/+$/, '');
  var LS_AUTH = 'treino.auth.v1';
  var LS_REST = 'treino.rest.v1';
  var LS_WORKOUT = 'treino.workout.';
  var NAME_LANGUAGE_ID = 7; // pt-br
  var SESSION_MAX_AGE = 12 * 60 * 60 * 1000;
  var LS_LANG = 'treino.lang.v1';
  var LS_EXTENDED = 'treino.extended.v1';

  var LANGS = [
    { code: 'pt-BR', short: 'PT', label: 'Português', api: 7, locale: 'pt-BR' },
    { code: 'en', short: 'EN', label: 'English', api: 2, locale: 'en-US' },
    { code: 'es', short: 'ES', label: 'Español', api: 4, locale: 'es-ES' }
  ];

  var I18N = {
    'pt-BR': {
      'app.title': 'Treino',
      'app.description': 'Modo treino para as rotinas do wger',
      'app.subtitle': 'Entre com sua conta do wger para carregar as rotinas.',
      'login.user': 'Usuário',
      'login.pass': 'Senha',
      'login.submit': 'Entrar',
      'login.submitting': 'Entrando…',
      'login.note': 'A sessão fica salva neste aparelho. Toque em “Sair” para apagar.',
      'login.missing': 'Preencha usuário e senha.',
      'login.bad': 'Usuário ou senha inválidos.',
      'login.rate': 'Muitas tentativas de login. Aguarde um minuto.',
      'login.failStatus': 'Não foi possível entrar (erro {status}).',
      'login.unexpected': 'Resposta de login inesperada.',
      'session.expired': 'Sua sessão expirou. Entre novamente.',
      'error.connect': 'Não foi possível conectar.',
      'error.server': 'Não foi possível conectar ao servidor.',
      'error.status': 'Erro {status}',
      'nav.help': 'Ajuda',
      'nav.back': 'Voltar',
      'nav.history': 'Histórico',
      'nav.logout': 'Sair',
      'nav.finish': 'Concluir',
      'nav.language': 'Idioma',
      'nav.menu': 'Menu',
      'menu.title': 'Menu',
      'menu.extended': 'Modo estendido',
      'menu.web': 'Interface web completa',
      'aside.title': 'Séries em andamento',
      'aside.elapsed': 'Tempo de treino',
      'aside.empty': 'Abra um bloco para ver as séries aqui.',
      'routines.section': 'Suas rotinas',
      'routines.empty': 'Nenhuma rotina encontrada nesta conta.',
      'routines.load': 'Não foi possível carregar as rotinas.',
      'routines.retry': 'Tentar de novo',
      'routines.inProgress': 'Em andamento',
      'routines.fallback': 'Rotina',
      'history.sub': 'Últimos registros',
      'history.empty': 'Nenhuma série registrada ainda.',
      'history.load': 'Não foi possível carregar o histórico.',
      'history.today': 'Hoje',
      'history.yesterday': 'Ontem',
      'workout.title': 'Treino',
      'workout.day': 'Dia',
      'workout.noDay': 'Esta rotina não tem um dia de treino.',
      'workout.noExercises': 'Esta rotina não tem exercícios cadastrados.',
      'workout.open': 'Não foi possível abrir o treino.',
      'workout.resumed': 'Treino retomado',
      'workout.restDay': 'Hoje é dia de descanso nesta rotina.',
      'workout.closed': 'Treino fechado',
      'workout.progress': '{done}/{total} séries',
      'workout.exerciseCount': '{n} exercícios',
      'exercise.fallback': 'Exercício #{id}',
      'warmup': 'Aquecimento',
      'superset': 'Superset {n}',
      'cardio': 'Cardio',
      'summary.title': 'Treino concluído',
      'summary.duration': 'Duração',
      'summary.sets': 'Séries',
      'summary.volume': 'Volume',
      'summary.pending': 'Pendências',
      'summary.back': 'Voltar às rotinas',
      'summary.sessionEnd': 'Encerramento da sessão',
      'summary.setPart': '{name} — série {n}',
      'summary.part': '{name} — {part}',
      'finish.confirm': 'Concluir treino? As séries já estão salvas.',
      'finish.confirmEmpty': 'Nenhuma série registrada. Concluir o treino mesmo assim?',
      'leave.confirm': 'Sair do treino? As séries registradas ficam salvas e você pode retomar depois.',
      'cancel.action': 'Cancelar treino',
      'cancel.title': 'Cancelar treino?',
      'cancel.body': 'Os registros desta sessão serão apagados.',
      'cancel.confirm': 'Cancelar treino',
      'cancel.done': 'Treino cancelado',
      'logout.confirm': 'Sair da conta neste aparelho?',
      'set.header': 'Série',
      'set.reps': 'reps',
      'set.seconds': 'seg',
      'set.rir': 'RIR',
      'set.rirAria': 'RIR da série {n}',
      'set.rirChoose': 'Escolher RIR',
      'set.rirOptions': 'Opções de RIR',
      'set.register': 'Registrar série',
      'set.unregister': 'Desfazer série',
      'set.updated': 'Série atualizada',
      'set.removed': 'Série removida',
      'set.removeConfirm': 'Remover esta série do histórico?',
      'set.removeError': 'Não foi possível remover a série.',
      'set.needReps': 'Informe as repetições',
      'set.needSeconds': 'Informe os segundos',
      'set.rirRange': 'O RIR vai de 0 a 4',
      'rir.what': 'O que é RIR?',
      'rir.aria': 'RIR da série',
      'rir.option0': '0 — até a falha',
      'rir.option1': '1 — sobrava 1 repetição',
      'rir.option2': '2 — sobravam 2 repetições (padrão)',
      'rir.option3': '3 — sobravam 3 repetições (leve)',
      'cardio.sub': 'Registre tempo e distância do cardio.',
      'cardio.minutes': 'Tempo (min)',
      'cardio.distance': 'Distância (km)',
      'cardio.register': 'Registrar',
      'cardio.registered': 'Registrado ✓',
      'cardio.removed': 'Cardio removido',
      'cardio.removeConfirm': 'Remover este cardio do histórico?',
      'cardio.removeError': 'Não foi possível remover o cardio.',
      'cardio.needTime': 'Informe o tempo',
      'cardio.needEither': 'Informe o tempo ou a distância',
      'cardio.time': 'tempo',
      'cardio.distanceWord': 'distância',
      'cardio.timeUpdated': 'Tempo atualizado',
      'cardio.distanceUpdated': 'Distância atualizada',
      'cardio.distanceRemoved': 'Distância removida',
      'cardio.removePart': 'Não foi possível remover {part}.',
      'rest.label': 'Descanso',
      'rest.done': 'Descanso concluído',
      'rest.add': '+15s',
      'rest.skip': 'Pular',
      'online': 'Conexão restabelecida',
      'offline': 'Sem conexão — o app precisa de internet',
      'help.title': 'Como ler a tabela',
      'help.rir.title': 'O que é RIR',
      'help.rir.intro': 'RIR — Repetições na Reserva (Reps in Reserve): quantas repetições você ainda conseguiria fazer com boa técnica antes de falhar.',
      'help.rir.li1': '<strong>RIR 2</strong> — parou podendo fazer mais 2 (esforço moderado — padrão das suas séries)',
      'help.rir.li2': '<strong>RIR 1</strong> — só mais 1 (pesado)',
      'help.rir.li3': '<strong>RIR 0</strong> — até a falha (máximo — só na última série de cada exercício)',
      'help.rir.note': 'O RIR de cada série é ajustável: digite um valor de 0 a 4 no campo ou toque no botão ▾ para escolher a opção. A alteração vale inclusive para séries já registradas.',
      'help.cols.title': 'Colunas da tabela de séries',
      'help.cols.num': '<strong>#</strong> — número da série',
      'help.cols.kg': '<strong>KG</strong> — carga usada (peso)',
      'help.cols.reps': '<strong>REPS</strong> — repetições feitas',
      'help.cols.check': '<strong>✓</strong> — confirma a série e inicia o descanso',
      'help.screen.title': 'Na tela do treino',
      'help.screen.timer': 'O cronômetro no topo é o tempo total do treino.',
      'help.screen.ex': 'O chip no exercício é o tempo daquele exercício.',
      'help.screen.rest': 'A barra inferior é o descanso regressivo.',
      'help.close': 'Fechar'
    },
    en: {
      'app.title': 'Workout',
      'app.description': 'Workout mode for your wger routines',
      'app.subtitle': 'Sign in with your wger account to load your routines.',
      'login.user': 'Username',
      'login.pass': 'Password',
      'login.submit': 'Sign in',
      'login.submitting': 'Signing in…',
      'login.note': 'Your session stays saved on this device. Tap “Sign out” to erase it.',
      'login.missing': 'Enter your username and password.',
      'login.bad': 'Invalid username or password.',
      'login.rate': 'Too many login attempts. Wait a minute.',
      'login.failStatus': 'Could not sign in (error {status}).',
      'login.unexpected': 'Unexpected login response.',
      'session.expired': 'Your session expired. Sign in again.',
      'error.connect': 'Could not connect.',
      'error.server': 'Could not connect to the server.',
      'error.status': 'Error {status}',
      'nav.help': 'Help',
      'nav.back': 'Back',
      'nav.history': 'History',
      'nav.logout': 'Sign out',
      'nav.finish': 'Finish',
      'nav.language': 'Language',
      'nav.menu': 'Menu',
      'menu.title': 'Menu',
      'menu.extended': 'Extended mode',
      'menu.web': 'Full web interface',
      'aside.title': 'Sets in progress',
      'aside.elapsed': 'Workout time',
      'aside.empty': 'Open a block to see its sets here.',
      'routines.section': 'Your routines',
      'routines.empty': 'No routines found in this account.',
      'routines.load': 'Could not load your routines.',
      'routines.retry': 'Try again',
      'routines.inProgress': 'In progress',
      'routines.fallback': 'Routine',
      'history.sub': 'Latest entries',
      'history.empty': 'No sets logged yet.',
      'history.load': 'Could not load the history.',
      'history.today': 'Today',
      'history.yesterday': 'Yesterday',
      'workout.title': 'Workout',
      'workout.day': 'Day',
      'workout.noDay': 'This routine has no workout day.',
      'workout.noExercises': 'This routine has no exercises.',
      'workout.open': 'Could not open the workout.',
      'workout.resumed': 'Workout resumed',
      'workout.restDay': 'Today is a rest day in this routine.',
      'workout.closed': 'Workout closed',
      'workout.progress': '{done}/{total} sets',
      'workout.exerciseCount': '{n} exercises',
      'exercise.fallback': 'Exercise #{id}',
      'warmup': 'Warm-up',
      'superset': 'Superset {n}',
      'cardio': 'Cardio',
      'summary.title': 'Workout complete',
      'summary.duration': 'Duration',
      'summary.sets': 'Sets',
      'summary.volume': 'Volume',
      'summary.pending': 'Pending',
      'summary.back': 'Back to routines',
      'summary.sessionEnd': 'Session close',
      'summary.setPart': '{name} — set {n}',
      'summary.part': '{name} — {part}',
      'finish.confirm': 'Finish workout? Your sets are already saved.',
      'finish.confirmEmpty': 'No sets logged. Finish the workout anyway?',
      'leave.confirm': 'Leave the workout? Logged sets stay saved and you can resume later.',
      'cancel.action': 'Cancel workout',
      'cancel.title': 'Cancel workout?',
      'cancel.body': "This session's records will be deleted.",
      'cancel.confirm': 'Cancel workout',
      'cancel.done': 'Workout cancelled',
      'logout.confirm': 'Sign out of this device?',
      'set.header': 'Set',
      'set.reps': 'reps',
      'set.seconds': 'sec',
      'set.rir': 'RIR',
      'set.rirAria': 'Set {n} RIR',
      'set.rirChoose': 'Choose RIR',
      'set.rirOptions': 'RIR options',
      'set.register': 'Log set',
      'set.unregister': 'Undo set',
      'set.updated': 'Set updated',
      'set.removed': 'Set removed',
      'set.removeConfirm': 'Remove this set from the history?',
      'set.removeError': 'Could not remove the set.',
      'set.needReps': 'Enter the repetitions',
      'set.needSeconds': 'Enter the seconds',
      'set.rirRange': 'RIR ranges from 0 to 4',
      'rir.what': 'What is RIR?',
      'rir.aria': 'Set RIR',
      'rir.option0': '0 — to failure',
      'rir.option1': '1 — 1 rep left',
      'rir.option2': '2 — 2 reps left (default)',
      'rir.option3': '3 — 3 reps left (light)',
      'cardio.sub': 'Log cardio time and distance.',
      'cardio.minutes': 'Time (min)',
      'cardio.distance': 'Distance (km)',
      'cardio.register': 'Log',
      'cardio.registered': 'Logged ✓',
      'cardio.removed': 'Cardio removed',
      'cardio.removeConfirm': 'Remove this cardio from the history?',
      'cardio.removeError': 'Could not remove the cardio.',
      'cardio.needTime': 'Enter the time',
      'cardio.needEither': 'Enter the time or the distance',
      'cardio.time': 'time',
      'cardio.distanceWord': 'distance',
      'cardio.timeUpdated': 'Time updated',
      'cardio.distanceUpdated': 'Distance updated',
      'cardio.distanceRemoved': 'Distance removed',
      'cardio.removePart': 'Could not remove {part}.',
      'rest.label': 'Rest',
      'rest.done': 'Rest complete',
      'rest.add': '+15s',
      'rest.skip': 'Skip',
      'online': 'Connection restored',
      'offline': 'No connection — the app needs internet',
      'help.title': 'How to read the table',
      'help.rir.title': 'What RIR means',
      'help.rir.intro': 'RIR — Reps in Reserve: how many more reps you could still do with good form before failing.',
      'help.rir.li1': '<strong>RIR 2</strong> — stopped with 2 more in the tank (moderate effort — the default for your sets)',
      'help.rir.li2': '<strong>RIR 1</strong> — just 1 more left (heavy)',
      'help.rir.li3': '<strong>RIR 0</strong> — to failure (maximum — only on the last set of each exercise)',
      'help.rir.note': 'The RIR of each set is adjustable: type a value from 0 to 4 in the field or tap the ▾ button to pick an option. The change also applies to sets already logged.',
      'help.cols.title': 'Set table columns',
      'help.cols.num': '<strong>#</strong> — set number',
      'help.cols.kg': '<strong>KG</strong> — load used (weight)',
      'help.cols.reps': '<strong>REPS</strong> — reps performed',
      'help.cols.check': '<strong>✓</strong> — confirms the set and starts the rest timer',
      'help.screen.title': 'On the workout screen',
      'help.screen.timer': 'The timer at the top is the total workout time.',
      'help.screen.ex': 'The chip on the exercise is that exercise’s time.',
      'help.screen.rest': 'The bottom bar is the countdown rest timer.',
      'help.close': 'Close'
    },
    es: {
      'app.title': 'Entrenamiento',
      'app.description': 'Modo entrenamiento para tus rutinas de wger',
      'app.subtitle': 'Inicia sesión con tu cuenta de wger para cargar tus rutinas.',
      'login.user': 'Usuario',
      'login.pass': 'Contraseña',
      'login.submit': 'Entrar',
      'login.submitting': 'Entrando…',
      'login.note': 'La sesión se guarda en este dispositivo. Toca “Salir” para borrarla.',
      'login.missing': 'Completa usuario y contraseña.',
      'login.bad': 'Usuario o contraseña incorrectos.',
      'login.rate': 'Demasiados intentos de inicio de sesión. Espera un minuto.',
      'login.failStatus': 'No se pudo entrar (error {status}).',
      'login.unexpected': 'Respuesta de inicio de sesión inesperada.',
      'session.expired': 'Tu sesión expiró. Inicia sesión de nuevo.',
      'error.connect': 'No se pudo conectar.',
      'error.server': 'No se pudo conectar al servidor.',
      'error.status': 'Error {status}',
      'nav.help': 'Ayuda',
      'nav.back': 'Volver',
      'nav.history': 'Historial',
      'nav.logout': 'Salir',
      'nav.finish': 'Terminar',
      'nav.language': 'Idioma',
      'nav.menu': 'Menú',
      'menu.title': 'Menú',
      'menu.extended': 'Modo extendido',
      'menu.web': 'Interfaz web completa',
      'aside.title': 'Series en curso',
      'aside.elapsed': 'Tiempo de entrenamiento',
      'aside.empty': 'Abre un bloque para ver sus series aquí.',
      'routines.section': 'Tus rutinas',
      'routines.empty': 'No se encontraron rutinas en esta cuenta.',
      'routines.load': 'No se pudieron cargar las rutinas.',
      'routines.retry': 'Reintentar',
      'routines.inProgress': 'En curso',
      'routines.fallback': 'Rutina',
      'history.sub': 'Últimos registros',
      'history.empty': 'Aún no hay series registradas.',
      'history.load': 'No se pudo cargar el historial.',
      'history.today': 'Hoy',
      'history.yesterday': 'Ayer',
      'workout.title': 'Entrenamiento',
      'workout.day': 'Día',
      'workout.noDay': 'Esta rutina no tiene un día de entrenamiento.',
      'workout.noExercises': 'Esta rutina no tiene ejercicios registrados.',
      'workout.open': 'No se pudo abrir el entrenamiento.',
      'workout.resumed': 'Entrenamiento reanudado',
      'workout.restDay': 'Hoy es día de descanso en esta rutina.',
      'workout.closed': 'Entrenamiento cerrado',
      'workout.progress': '{done}/{total} series',
      'workout.exerciseCount': '{n} ejercicios',
      'exercise.fallback': 'Ejercicio #{id}',
      'warmup': 'Calentamiento',
      'superset': 'Superserie {n}',
      'cardio': 'Cardio',
      'summary.title': 'Entrenamiento completado',
      'summary.duration': 'Duración',
      'summary.sets': 'Series',
      'summary.volume': 'Volumen',
      'summary.pending': 'Pendientes',
      'summary.back': 'Volver a las rutinas',
      'summary.sessionEnd': 'Cierre de la sesión',
      'summary.setPart': '{name} — serie {n}',
      'summary.part': '{name} — {part}',
      'finish.confirm': '¿Terminar el entrenamiento? Las series ya están guardadas.',
      'finish.confirmEmpty': 'No hay series registradas. ¿Terminar el entrenamiento igual?',
      'leave.confirm': '¿Salir del entrenamiento? Las series registradas quedan guardadas y puedes reanudar después.',
      'cancel.action': 'Cancelar entrenamiento',
      'cancel.title': '¿Cancelar entrenamiento?',
      'cancel.body': 'Los registros de esta sesión se borrarán.',
      'cancel.confirm': 'Cancelar entrenamiento',
      'cancel.done': 'Entrenamiento cancelado',
      'logout.confirm': '¿Salir de la cuenta en este dispositivo?',
      'set.header': 'Serie',
      'set.reps': 'reps',
      'set.seconds': 'seg',
      'set.rir': 'RIR',
      'set.rirAria': 'RIR de la serie {n}',
      'set.rirChoose': 'Elegir RIR',
      'set.rirOptions': 'Opciones de RIR',
      'set.register': 'Registrar serie',
      'set.unregister': 'Deshacer serie',
      'set.updated': 'Serie actualizada',
      'set.removed': 'Serie eliminada',
      'set.removeConfirm': '¿Eliminar esta serie del historial?',
      'set.removeError': 'No se pudo eliminar la serie.',
      'set.needReps': 'Indica las repeticiones',
      'set.needSeconds': 'Indica los segundos',
      'set.rirRange': 'El RIR va de 0 a 4',
      'rir.what': '¿Qué es el RIR?',
      'rir.aria': 'RIR de la serie',
      'rir.option0': '0 — hasta el fallo',
      'rir.option1': '1 — quedaba 1 repetición',
      'rir.option2': '2 — quedaban 2 repeticiones (predeterminado)',
      'rir.option3': '3 — quedaban 3 repeticiones (ligero)',
      'cardio.sub': 'Registra tiempo y distancia del cardio.',
      'cardio.minutes': 'Tiempo (min)',
      'cardio.distance': 'Distancia (km)',
      'cardio.register': 'Registrar',
      'cardio.registered': 'Registrado ✓',
      'cardio.removed': 'Cardio eliminado',
      'cardio.removeConfirm': '¿Eliminar este cardio del historial?',
      'cardio.removeError': 'No se pudo eliminar el cardio.',
      'cardio.needTime': 'Indica el tiempo',
      'cardio.needEither': 'Indica el tiempo o la distancia',
      'cardio.time': 'tiempo',
      'cardio.distanceWord': 'distancia',
      'cardio.timeUpdated': 'Tiempo actualizado',
      'cardio.distanceUpdated': 'Distancia actualizada',
      'cardio.distanceRemoved': 'Distancia eliminada',
      'cardio.removePart': 'No se pudo eliminar {part}.',
      'rest.label': 'Descanso',
      'rest.done': 'Descanso terminado',
      'rest.add': '+15s',
      'rest.skip': 'Saltar',
      'online': 'Conexión restablecida',
      'offline': 'Sin conexión — la app necesita internet',
      'help.title': 'Cómo leer la tabla',
      'help.rir.title': 'Qué es el RIR',
      'help.rir.intro': 'RIR — Repeticiones en Reserva (Reps in Reserve): cuántas repeticiones más podrías hacer con buena técnica antes del fallo.',
      'help.rir.li1': '<strong>RIR 2</strong> — paraste pudiendo hacer 2 más (esfuerzo moderado — predeterminado de tus series)',
      'help.rir.li2': '<strong>RIR 1</strong> — solo 1 más (pesado)',
      'help.rir.li3': '<strong>RIR 0</strong> — hasta el fallo (máximo — solo en la última serie de cada ejercicio)',
      'help.rir.note': 'El RIR de cada serie es ajustable: escribe un valor de 0 a 4 en el campo o toca el botón ▾ para elegir la opción. El cambio también aplica a series ya registradas.',
      'help.cols.title': 'Columnas de la tabla de series',
      'help.cols.num': '<strong>#</strong> — número de la serie',
      'help.cols.kg': '<strong>KG</strong> — carga usada (peso)',
      'help.cols.reps': '<strong>REPS</strong> — repeticiones hechas',
      'help.cols.check': '<strong>✓</strong> — confirma la serie e inicia el descanso',
      'help.screen.title': 'En la pantalla del entrenamiento',
      'help.screen.timer': 'El cronómetro de arriba es el tiempo total del entrenamiento.',
      'help.screen.ex': 'El chip del ejercicio es el tiempo de ese ejercicio.',
      'help.screen.rest': 'La barra inferior es el descanso regresivo.',
      'help.close': 'Cerrar'
    }
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function langByCode(code) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code === code) return LANGS[i];
    }
    return null;
  }

  function storedLang() {
    var code = null;
    try { code = localStorage.getItem(LS_LANG); } catch (e) { code = null; }
    return langByCode(code) ? code : LANGS[0].code;
  }

  var currentLangCode = storedLang();

  function currentLang() {
    return langByCode(currentLangCode) || LANGS[0];
  }

  function uiLocale() {
    return currentLang().locale;
  }

  function t(key, vars) {
    var table = I18N[currentLang().code] || I18N['pt-BR'];
    var text = table[key];
    if (text == null) text = I18N['pt-BR'][key];
    if (text == null) return key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, function (match, name) {
      return vars[name] != null ? String(vars[name]) : match;
    });
  }

  function updateLangButtons() {
    var buttons = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].textContent = currentLang().short;
      buttons[i].setAttribute('aria-label', t('nav.language'));
      buttons[i].setAttribute('title', t('nav.language'));
    }
  }

  function applyTranslations() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    nodes = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < nodes.length; j++) {
      nodes[j].innerHTML = t(nodes[j].getAttribute('data-i18n-html'));
    }
    nodes = document.querySelectorAll('[data-i18n-title]');
    for (var k = 0; k < nodes.length; k++) {
      nodes[k].setAttribute('title', t(nodes[k].getAttribute('data-i18n-title')));
    }
    nodes = document.querySelectorAll('[data-i18n-aria-label]');
    for (var m = 0; m < nodes.length; m++) {
      nodes[m].setAttribute('aria-label', t(nodes[m].getAttribute('data-i18n-aria-label')));
    }
    nodes = document.querySelectorAll('[data-i18n-content]');
    for (var n = 0; n < nodes.length; n++) {
      nodes[n].setAttribute('content', t(nodes[n].getAttribute('data-i18n-content')));
    }
    document.documentElement.lang = currentLang().code;
    updateLangButtons();
  }

  function setLanguage(code) {
    var next = langByCode(code);
    if (!next) return;
    var changed = next.code !== currentLang().code;
    currentLangCode = next.code;
    try { localStorage.setItem(LS_LANG, next.code); } catch (e) { /* modo privado */ }
    applyTranslations();
    if (!changed) return;

    var screen = document.body.dataset.screen;
    if (screen === 'screen-workout' && view) {
      startWorkout(view.routine);
    } else if (screen === 'screen-history') {
      showHistory();
    } else if (screen === 'screen-routines') {
      renderRoutines();
    }
  }

  // ---------- modo estendido ----------

  function storedExtendedChoice() {
    var value = null;
    try { value = localStorage.getItem(LS_EXTENDED); } catch (e) { value = null; }
    return value === 'on' || value === 'off' ? value : null;
  }

  function wideViewport() {
    return !!(window.matchMedia && window.matchMedia('(min-width: 900px)').matches);
  }

  function extendedWanted() {
    var choice = storedExtendedChoice();
    if (choice) return choice === 'on';
    return wideViewport();
  }

  function applyExtendedMode() {
    document.body.classList.toggle('extended', extendedWanted());
  }

  function setExtendedMode(on) {
    try { localStorage.setItem(LS_EXTENDED, on ? 'on' : 'off'); } catch (e) { /* modo privado */ }
    applyExtendedMode();
    syncWorkoutAside();
  }

  var auth = readJSON(LS_AUTH);
  var refreshing = null;
  var nameMaps = {};
  var routinesCache = [];
  var view = null;
  var toastTimer = null;
  var wakeLock = null;
  var restState = { endAt: 0, total: 0, timer: null, hideTimer: null };
  var workoutClock = { timer: null };

  function AuthError(message) {
    this.name = 'AuthError';
    this.message = message || t('session.expired');
  }
  AuthError.prototype = Object.create(Error.prototype);
  AuthError.prototype.constructor = AuthError;

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function parseNum(value) {
    if (value == null) return null;
    var raw = String(value).trim().replace(',', '.');
    if (!raw) return null;
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function fmtNum(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return '';
    if (Number.isInteger(n)) return String(n);
    var text = String(Math.round(n * 100) / 100);
    return uiLocale() === 'en-US' ? text : text.replace('.', ',');
  }

  function fmtClock(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function fmtElapsed(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  function fmtDuration(ms) {
    var minutes = Math.max(1, Math.round(ms / 60000));
    if (minutes < 60) return minutes + ' min';
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '');
  }

  function localDateISO(date) {
    var d = date || new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dateLabel(iso) {
    var parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[0]) return iso || '';
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = Math.round((today - date) / 86400000);
    if (diff === 0) return t('history.today');
    if (diff === 1) return t('history.yesterday');
    return new Intl.DateTimeFormat(uiLocale(), { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
  }

  // ---------- sessão / tokens ----------

  function saveAuth(next) {
    auth = next;
    if (next) writeJSON(LS_AUTH, next);
    else localStorage.removeItem(LS_AUTH);
  }

  function tokenExpMs(token) {
    try {
      var part = token.split('.')[1];
      var padded = part.replace(/-/g, '+').replace(/_/g, '/');
      padded += '='.repeat((4 - (padded.length % 4)) % 4);
      var payload = JSON.parse(atob(padded));
      return payload.exp ? payload.exp * 1000 : 0;
    } catch (e) { return 0; }
  }

  async function doRefresh() {
    if (!auth || !auth.refresh) throw new AuthError('Sem refresh token');
    var res = await fetch(API_BASE + '/allauth/app/v1/tokens/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: auth.refresh })
    });
    if (!res.ok) throw new AuthError('Refresh recusado');
    var body = await res.json().catch(function () { return {}; });
    var data = body.data || body;
    if (!data || !data.access_token) throw new AuthError('Refresh sem token');
    auth.access = data.access_token;
    if (data.refresh_token) auth.refresh = data.refresh_token;
    saveAuth(auth);
    return auth.access;
  }

  function refreshTokens() {
    if (!refreshing) {
      refreshing = doRefresh().finally(function () { refreshing = null; });
    }
    return refreshing;
  }

  async function api(path, opts) {
    if (!auth) throw new AuthError('Deslogado');
    if (auth.access && tokenExpMs(auth.access) - Date.now() < 90000) {
      try {
        await refreshTokens();
      } catch (err) {
        if (err instanceof AuthError) throw err;
        // falha de rede: segue com o token atual
      }
    }

    var options = opts || {};
    var headers = new Headers(options.headers || {});
    if (auth.access) headers.set('Authorization', 'Bearer ' + auth.access);
    var body = options.body;
    if (body && typeof body !== 'string') {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }

    var res = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: body
    });

    if (res.status === 401 && !options._retry) {
      await refreshTokens();
      return api(path, Object.assign({}, options, { _retry: true }));
    }
    return res;
  }

  async function apiJSON(path, opts) {
    var res = await api(path, opts);
    if (!res.ok) {
      var text = await res.text().catch(function () { return ''; });
      var message = '';
      try { message = extractApiError(JSON.parse(text)); } catch (e) { /* texto puro */ }
      if (!message) message = text ? text.slice(0, 160) : t('error.status', { status: res.status });
      throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function extractApiError(body) {
    if (!body) return '';
    if (typeof body === 'string') return body;
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.errors) && body.errors[0]) return body.errors[0].message || '';
    if (Array.isArray(body.non_field_errors)) return body.non_field_errors.join(' ');
    var keys = Object.keys(body);
    for (var i = 0; i < keys.length; i++) {
      var value = body[keys[i]];
      if (Array.isArray(value) && value.length) return keys[i] + ': ' + value.join(' ');
      if (typeof value === 'string' && value) return keys[i] + ': ' + value;
    }
    return '';
  }

  function loginMessage(body, status) {
    if (status === 429) return t('login.rate');
    var raw = (body && body.errors && body.errors[0] && body.errors[0].message) || '';
    var known = {
      'Unable to log in with provided credentials.': t('login.bad'),
      'This field is required.': t('login.missing')
    };
    if (known[raw]) return known[raw];
    if (raw) return raw;
    if (status === 400) return t('login.bad');
    return t('login.failStatus', { status: status });
  }

  function clearLocalWorkouts() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(LS_WORKOUT) === 0) keys.push(key);
    }
    keys.forEach(function (key) { localStorage.removeItem(key); });
  }

  function gotoLogin(message) {
    saveAuth(null);
    view = null;
    stopRest();
    releaseWakeLock();
    show('screen-login');
    var box = $('#login-error');
    if (message) {
      box.textContent = message;
      box.hidden = false;
    } else {
      box.hidden = true;
    }
    var input = $('#login-user');
    if (input) setTimeout(function () { input.focus(); }, 60);
  }

  function handleError(err) {
    if (err instanceof AuthError) {
      gotoLogin(t('session.expired'));
      return;
    }
    console.error(err);
    var message = err && err.message ? err.message : t('error.connect');
    if (err instanceof TypeError) message = t('error.server');
    toast(message);
  }

  // ---------- login / logout ----------

  async function submitLogin(event) {
    event.preventDefault();
    var username = $('#login-user').value.trim();
    var password = $('#login-pass').value;
    var errorBox = $('#login-error');
    var button = $('#login-submit');

    if (!username || !password) {
      errorBox.textContent = t('login.missing');
      errorBox.hidden = false;
      return;
    }

    errorBox.hidden = true;
    button.disabled = true;
    button.textContent = t('login.submitting');

    try {
      var res = await fetch(API_BASE + '/allauth/app/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(loginMessage(body, res.status));
      var meta = body.meta || {};
      if (!meta.access_token) throw new Error(t('login.unexpected'));
      saveAuth({
        access: meta.access_token,
        refresh: meta.refresh_token || null,
        session: meta.session_token || null,
        user: (body.data && body.data.user) || { username: username }
      });
      $('#login-pass').value = '';
      enterApp();
    } catch (err) {
      var message = err instanceof TypeError ? t('error.server') : err.message;
      errorBox.textContent = message;
      errorBox.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = t('login.submit');
    }
  }

  function logout() {
    if (!confirm(t('logout.confirm'))) return;
    saveAuth(null);
    clearLocalWorkouts();
    localStorage.removeItem(LS_REST);
    view = null;
    stopRest();
    releaseWakeLock();
    show('screen-login');
    $('#login-error').hidden = true;

    // Não há revogação server-side para tokens do allauth headless: DELETE
    // /allauth/app/v1/auth/session só aceita sessão por cookie e responde 401
    // com Bearer e/ou X-Session-Token. O refresh token continua válido até
    // expirar (120 dias); apagar do aparelho é o que dá para fazer daqui.
  }

  // ---------- screens ----------

  function show(id) {
    closePopover();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].hidden = screens[i].id !== id;
    }
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
  }

  function toast(message) {
    var node = $('#toast');
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, 3200);
  }

  function enterApp() {
    show('screen-routines');
    var user = auth && auth.user;
    var name = user && (user.username || user.email) ? (user.username || user.email) : '';
    $('#user-name').textContent = name;
    loadRoutines();
  }

  function renderRoutines() {
    var list = $('#routines-list');
    list.innerHTML = '';

    if (!routinesCache.length) {
      list.appendChild(el('p', 'empty', t('routines.empty')));
      return;
    }

    routinesCache.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (routine) {
      var card = el('button', 'routine-card');
      card.type = 'button';

      var match = /Rotina\s+([A-Za-z0-9]+)/i.exec(routine.name || '');
      var letter = match ? match[1] : ((routine.name || '?').trim().charAt(0) || '?');
      card.appendChild(el('span', 'routine-badge', letter.toUpperCase()));

      var info = el('div', 'routine-info');
      info.appendChild(el('h2', null, routine.name || t('routines.fallback')));
      if (routine.description) info.appendChild(el('p', null, routine.description));

      var saved = readJSON(LS_WORKOUT + routine.id);
      if (saved && saved.startedAt && Date.now() - saved.startedAt < SESSION_MAX_AGE) {
        info.appendChild(el('span', 'routine-chip', t('routines.inProgress')));
      }
      card.appendChild(info);
      card.appendChild(el('span', 'routine-arrow', '›'));

      card.addEventListener('click', function () { startWorkout(routine); });
      list.appendChild(card);
    });
  }

  async function loadRoutines() {
    var list = $('#routines-list');
    list.innerHTML = '<div class="spinner"></div>';
    try {
      var data = await apiJSON('/api/v2/routine/?limit=100&is_template=false');
      routinesCache = data.results || [];
      renderRoutines();
    } catch (err) {
      if (err instanceof AuthError) {
        handleError(err);
        return;
      }
      list.innerHTML = '';
      var box = el('div', 'empty');
      box.appendChild(el('p', null, t('routines.load')));
      var retry = el('button', 'btn btn-ghost btn-sm', t('routines.retry'));
      retry.type = 'button';
      retry.style.marginTop = '12px';
      retry.addEventListener('click', loadRoutines);
      box.appendChild(retry);
      list.appendChild(box);
      handleError(err);
    }
  }

  // ---------- dados auxiliares ----------

  function nameMapFor(languageId) {
    if (!nameMaps[languageId]) {
      nameMaps[languageId] = apiJSON('/api/v2/exercise-translation/?language=' + languageId + '&limit=1000')
        .then(function (data) {
          var map = new Map();
          (data.results || []).forEach(function (item) {
            if (item.name) map.set(item.exercise, item.name);
          });
          return map;
        })
        .catch(function (err) {
          delete nameMaps[languageId];
          throw err;
        });
    }
    return nameMaps[languageId];
  }

  async function preloadNames() {
    var langId = currentLang().api;
    if (langId === NAME_LANGUAGE_ID) return nameMapFor(NAME_LANGUAGE_ID);
    var base = await nameMapFor(NAME_LANGUAGE_ID).catch(function () { return new Map(); });
    var current = await nameMapFor(langId).catch(function () { return new Map(); });
    if (!current.size) return base;
    var merged = new Map(base);
    current.forEach(function (name, id) { merged.set(id, name); });
    return merged;
  }

  async function loadVideos() {
    var data = await apiJSON('/api/v2/video/?limit=500');
    var map = new Map();
    (data.results || []).forEach(function (item) {
      if (!item.video) return;
      var url;
      try {
        url = API_BASE + new URL(item.video, API_BASE).pathname;
      } catch (e) { return; }
      var current = map.get(item.exercise);
      if (!current || (item.is_main && !current.isMain)) {
        map.set(item.exercise, { url: url, isMain: !!item.is_main });
      }
    });
    var plain = new Map();
    map.forEach(function (value, key) { plain.set(key, value.url); });
    return plain;
  }

  async function loadPreviousWeights(exerciseIds) {
    if (!exerciseIds.length) return new Map();
    var data = await apiJSON('/api/v2/workoutlog/?exercise__in=' + exerciseIds.join(',') + '&ordering=-date&limit=100');
    var map = new Map();
    (data.results || []).forEach(function (log) {
      if (log.weight == null || map.has(log.exercise)) return;
      map.set(log.exercise, { date: log.date, weight: Number(log.weight) });
    });
    return map;
  }

  function splitComment(comment) {
    var text = String(comment || '').trim();
    var match = /^([^—–]+?)\s*[—–]\s*(.+)$/.exec(text);
    if (match) return { kicker: match[1].trim(), detail: match[2].trim() };
    return { kicker: '', detail: text };
  }

  // A sequência diária cobre o intervalo inteiro da rotina (70 itens hoje).
  // A tela usa só a entrada de hoje; fora do intervalo cai no dia anterior
  // mais próximo e, se não houver nenhum, no primeiro.
  function pickDay(sequence) {
    if (!Array.isArray(sequence) || !sequence.length) return null;
    var today = localDateISO();
    var past = null;
    for (var i = 0; i < sequence.length; i++) {
      var item = sequence[i];
      if (!item || !item.date) continue;
      if (item.date === today) return item;
      if (item.date < today && (!past || item.date > past.date)) past = item;
    }
    return past || sequence[0];
  }

  function prescriptionOf(set) {
    var reps = set.repetitions;
    return {
      weight: set.weight == null ? null : Number(set.weight),
      reps: reps == null || reps === '' ? null : Number(reps),
      rir: set.rir == null || set.rir === '' ? null : Number(set.rir),
      rest: Number(set.rest) || 0,
      type: set.type
    };
  }

  function entryPrescription(entry, index) {
    var list = entry.prescriptions || [];
    return list[index] || list[0] || { weight: null, reps: null, rir: null, rest: 0 };
  }

  // O modo gym devolve um item por série (superset intercalado A, B, A, B...),
  // já com peso, repetições, RIR e descanso calculados para a iteração do dia.
  function parseDay(dayItem, nameMap, videoMap, prevWeights) {
    var blocks = [];
    var ssCounter = 0;
    var day = dayItem.day || {};

    (dayItem.slots || []).forEach(function (slot, slotIndex) {
      var groups = new Map();
      var order = [];
      (slot.sets || []).forEach(function (set) {
        if (set.slot_entry_id == null) return;
        if (!groups.has(set.slot_entry_id)) {
          groups.set(set.slot_entry_id, []);
          order.push(set.slot_entry_id);
        }
        groups.get(set.slot_entry_id).push(set);
      });

      var entries = order.map(function (entryId) {
        var sets = groups.get(entryId);
        var first = sets[0];
        var prescriptions = sets.map(prescriptionOf);
        var targetReps = null;
        var targetRir = null;
        var rest = 0;
        prescriptions.forEach(function (prescription) {
          if (targetReps == null) targetReps = prescription.reps;
          if (targetRir == null) targetRir = prescription.rir;
          if (!rest) rest = prescription.rest;
        });
        var previous = prevWeights.get(first.exercise);
        return {
          id: first.slot_entry_id,
          exerciseId: first.exercise,
          name: nameMap.get(first.exercise) || t('exercise.fallback', { id: first.exercise }),
          video: videoMap.get(first.exercise) || null,
          comment: first.comment || '',
          type: first.type,
          repUnit: first.repetitions_unit || 1,
          weightUnit: first.weight_unit || 1,
          targetReps: targetReps,
          setCount: Math.max(1, prescriptions.length),
          targetRir: targetRir,
          rest: rest,
          previous: previous || null,
          prescriptions: prescriptions
        };
      });

      if (!entries.length) return;

      var isCardio = entries.every(function (entry) { return entry.repUnit === 4; });
      var parts = splitComment(slot.comment);
      var label = parts.kicker;
      var title = entries.map(function (entry) { return entry.name; }).join(' + ');
      var kind = 'single';

      if (isCardio) {
        kind = 'cardio';
        label = t('cardio');
        title = parts.detail || title;
        title = title.charAt(0).toUpperCase() + title.slice(1);
      } else if (entries.length >= 2) {
        kind = 'superset';
        var m = /^SS\s*(\d+)/i.exec(label);
        if (m) ssCounter = parseInt(m[1], 10);
        else ssCounter += 1;
        label = t('superset', { n: ssCounter });
      }

      blocks.push({
        key: 'slot-' + slotIndex,
        dayId: day.id,
        dayName: day.name || '',
        kind: kind,
        label: label,
        title: title,
        entries: entries
      });
    });

    return { blocks: blocks };
  }

  // ---------- treino ----------

  function renderRestDay(dayItem) {
    view = null;
    $('#workout-tools').hidden = true;
    stopWorkoutClock();
    stopRest();
    var list = $('#workout-list');
    list.innerHTML = '';
    var box = el('div', 'empty');
    box.appendChild(el('p', null, t('workout.restDay')));
    var day = dayItem.day || {};
    if (day.description) box.appendChild(el('p', null, day.description));
    var back = el('button', 'btn btn-ghost btn-sm', t('nav.back'));
    back.type = 'button';
    back.style.marginTop = '12px';
    back.addEventListener('click', leaveWorkout);
    box.appendChild(back);
    list.appendChild(box);
    $('#workout-progress').textContent = '';
    $('#btn-finish').disabled = true;
  }

  async function startWorkout(routine) {
    show('screen-workout');
    $('#workout-tools').hidden = true;
    $('#workout-name').textContent = routine.name || t('workout.title');
    $('#workout-progress').textContent = '';
    $('#workout-list').innerHTML = '<div class="spinner"></div>';
    $('#btn-finish').disabled = true;
    closePopover();

    try {
      var results = await Promise.all([
        apiJSON('/api/v2/routine/' + routine.id + '/date-sequence-gym/'),
        preloadNames().catch(function () { return new Map(); }),
        loadVideos().catch(function () { return new Map(); })
      ]);

      var dayItem = pickDay(results[0]);
      if (!dayItem || !dayItem.day) {
        $('#workout-list').innerHTML = '';
        $('#workout-list').appendChild(el('p', 'empty', t('workout.noDay')));
        return;
      }

      if (dayItem.day.is_rest) {
        renderRestDay(dayItem);
        return;
      }

      var nameMap = results[1];
      var videoMap = results[2];

      var exerciseIds = [];
      (dayItem.slots || []).forEach(function (slot) {
        (slot.sets || []).forEach(function (set) {
          if (set.exercise != null && exerciseIds.indexOf(set.exercise) === -1) {
            exerciseIds.push(set.exercise);
          }
        });
      });

      var prevWeights = await loadPreviousWeights(exerciseIds).catch(function () { return new Map(); });
      var parsed = parseDay(dayItem, nameMap, videoMap, prevWeights);

      if (!parsed.blocks.length) {
        $('#workout-list').innerHTML = '';
        $('#workout-list').appendChild(el('p', 'empty', t('workout.noExercises')));
        return;
      }

      var startWorkoutSaved = readJSON(LS_WORKOUT + routine.id);
      var sets = {};
      var exTimes = {};
      var sessionId = null;
      var startedAt = Date.now();

      if (startWorkoutSaved && startWorkoutSaved.startedAt &&
          Date.now() - startWorkoutSaved.startedAt < SESSION_MAX_AGE) {
        sets = startWorkoutSaved.sets || {};
        exTimes = startWorkoutSaved.exTimes || {};
        sessionId = startWorkoutSaved.sessionId || null;
        startedAt = startWorkoutSaved.startedAt;
      }

      var validKeys = new Set();
      var validEntryIds = new Set();
      parsed.blocks.forEach(function (block) {
        block.entries.forEach(function (entry) {
          if (block.kind !== 'cardio') validEntryIds.add(String(entry.id));
          var count = block.kind === 'cardio' ? 1 : entry.setCount;
          for (var i = 0; i < count; i++) validKeys.add(entry.id + ':' + i);
        });
      });
      Object.keys(sets).forEach(function (key) {
        if (!validKeys.has(key)) delete sets[key];
      });
      Object.keys(exTimes).forEach(function (id) {
        if (!validEntryIds.has(String(id))) delete exTimes[id];
      });

      view = {
        routine: routine,
        blocks: parsed.blocks,
        dayCount: 1,
        dayId: dayItem.day.id,
        iteration: dayItem.iteration,
        date: dayItem.date,
        open: new Set(),
        sets: sets,
        exTimes: exTimes,
        sessionId: sessionId,
        startedAt: startedAt,
        busy: false
      };

      var firstOpen = firstIncompleteBlock();
      if (firstOpen) view.open.add(firstOpen);

      renderWorkout();
      $('#workout-tools').hidden = false;
      updateProgress();
      startWorkoutClock();
      maybeResumeRest();
      requestWakeLock();
      $('#btn-finish').disabled = false;

      if (Object.keys(sets).length) toast(t('workout.resumed'));
    } catch (err) {
      if (err instanceof AuthError) {
        handleError(err);
        return;
      }
      $('#workout-list').innerHTML = '';
      $('#workout-tools').hidden = true;
      var box = el('div', 'empty');
      box.appendChild(el('p', null, t('workout.open')));
      var back = el('button', 'btn btn-ghost btn-sm', t('nav.back'));
      back.type = 'button';
      back.style.marginTop = '12px';
      back.addEventListener('click', leaveWorkout);
      box.appendChild(back);
      $('#workout-list').appendChild(box);
      handleError(err);
    }
  }

  function firstIncompleteBlock() {
    if (!view) return null;
    for (var b = 0; b < view.blocks.length; b++) {
      var block = view.blocks[b];
      for (var e = 0; e < block.entries.length; e++) {
        var count = block.kind === 'cardio' ? 1 : block.entries[e].setCount;
        for (var i = 0; i < count; i++) {
          if (!view.sets[block.entries[e].id + ':' + i]) return block.key;
        }
      }
    }
    return view.blocks.length ? view.blocks[view.blocks.length - 1].key : null;
  }

  function progress() {
    var total = 0;
    var done = 0;
    if (!view) return { total: total, done: done };
    view.blocks.forEach(function (block) {
      block.entries.forEach(function (entry) {
        var count = block.kind === 'cardio' ? 1 : entry.setCount;
        total += count;
        for (var i = 0; i < count; i++) {
          if (view.sets[entry.id + ':' + i]) done += 1;
        }
      });
    });
    return { total: total, done: done };
  }

  function updateProgress() {
    var stats = progress();
    $('#workout-progress').textContent = stats.total
      ? t('workout.progress', { done: stats.done, total: stats.total })
      : '';
  }

  // ---------- cronômetros ----------

  function renderWorkoutClock() {
    var node = $('#workout-timer');
    var asideClock = $('#aside-clock');
    if (!view) {
      if (node) node.hidden = true;
      if (asideClock) asideClock.textContent = '00:00';
      return;
    }
    var text = fmtElapsed(Date.now() - view.startedAt);
    if (node) {
      node.hidden = false;
      node.textContent = text;
    }
    if (asideClock) asideClock.textContent = text;
  }

  function renderExerciseTimers() {
    if (!view) return;
    var nodes = document.querySelectorAll('.ex-timer');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var timer = view.exTimes ? view.exTimes[node.getAttribute('data-entry-id')] : null;
      if (!timer) {
        node.hidden = true;
        continue;
      }
      node.hidden = false;
      node.classList.toggle('is-running', !timer.end);
      node.textContent = fmtElapsed((timer.end || Date.now()) - timer.start);
    }
  }

  function tickWorkoutClock() {
    renderWorkoutClock();
    renderExerciseTimers();
  }

  function startWorkoutClock() {
    stopWorkoutClock();
    tickWorkoutClock();
    workoutClock.timer = setInterval(tickWorkoutClock, 1000);
  }

  function stopWorkoutClock() {
    clearInterval(workoutClock.timer);
    workoutClock.timer = null;
    var node = $('#workout-timer');
    if (node) node.hidden = true;
  }

  function entryHasSets(entry) {
    for (var i = 0; i < entry.setCount; i++) {
      if (view.sets[entry.id + ':' + i]) return true;
    }
    return false;
  }

  function entryAllSetsDone(entry) {
    for (var i = 0; i < entry.setCount; i++) {
      if (!view.sets[entry.id + ':' + i]) return false;
    }
    return true;
  }

  function trackEntryTimer(entry) {
    if (!view.exTimes) view.exTimes = {};
    var timer = view.exTimes[entry.id];
    if (!timer) timer = view.exTimes[entry.id] = { start: Date.now(), end: null };
    timer.end = entryAllSetsDone(entry) ? Date.now() : null;
    renderExerciseTimers();
  }

  function untrackEntryTimer(entry) {
    if (!view.exTimes || !view.exTimes[entry.id]) return;
    if (!entryHasSets(entry)) {
      delete view.exTimes[entry.id];
    } else {
      view.exTimes[entry.id].end = entryAllSetsDone(entry) ? Date.now() : null;
    }
    renderExerciseTimers();
  }

  // ---------- coluna lateral do treino (modo estendido) ----------

  var asideMoves = [];
  var asideTimers = [];

  function restoreAsideNodes() {
    asideMoves.forEach(function (move) { move.parent.appendChild(move.sets); });
    asideMoves = [];
    asideTimers.forEach(function (node) { if (node.parentNode) node.parentNode.removeChild(node); });
    asideTimers = [];
  }

  function resetWorkoutAside() {
    asideMoves = [];
    asideTimers = [];
    var aside = $('#workout-aside');
    if (!aside) return;
    aside.innerHTML = '';
    aside.hidden = true;
  }

  function updateAsideRest() {
    var node = $('#aside-rest');
    if (!node) return;
    var running = restState.endAt > Date.now();
    node.hidden = !running;
    if (running) node.textContent = fmtClock(restState.endAt - Date.now());
  }

  function syncWorkoutAside() {
    var aside = $('#workout-aside');
    if (!aside) return;
    restoreAsideNodes();
    aside.innerHTML = '';
    aside.hidden = true;
    if (!view || !document.body.classList.contains('extended') || !wideViewport()) return;

    var card = el('div', 'aside-card');

    var clocks = el('div', 'aside-clocks');
    var clockRow = el('div', 'aside-clock-row');
    clockRow.appendChild(el('span', 'aside-clock-label', t('aside.elapsed')));
    var clock = el('strong', 'aside-clock', '00:00');
    clock.id = 'aside-clock';
    clockRow.appendChild(clock);
    clocks.appendChild(clockRow);

    var restRow = el('div', 'aside-clock-row');
    restRow.appendChild(el('span', 'aside-clock-label', t('rest.label')));
    var rest = el('strong', 'aside-rest');
    rest.id = 'aside-rest';
    rest.hidden = true;
    restRow.appendChild(rest);
    clocks.appendChild(restRow);
    card.appendChild(clocks);

    card.appendChild(el('p', 'section-label', t('aside.title')));

    var any = false;
    view.blocks.forEach(function (block) {
      if (!view.open.has(block.key)) return;
      any = true;
      if (block.kind === 'cardio') {
        var cardioBox = el('div', 'aside-exercise');
        cardioBox.appendChild(el('h3', 'aside-exercise-name', block.title));
        cardioBox.appendChild(el('span', 'chip', t('cardio')));
        card.appendChild(cardioBox);
        return;
      }
      block.entries.forEach(function (entry) {
        var exercise = document.querySelector('#workout-list .exercise[data-entry-id="' + entry.id + '"]');
        if (!exercise) return;
        var box = el('div', 'aside-exercise');
        var head = el('div', 'aside-exercise-head');
        head.appendChild(el('h3', 'aside-exercise-name', entry.name));
        var badges = el('div', 'badges');
        badges.appendChild(el('span', 'chip', schemeText(entry)));
        var timer = exercise.querySelector('.ex-timer');
        if (timer) {
          var clone = timer.cloneNode(true);
          asideTimers.push(clone);
          badges.appendChild(clone);
        }
        head.appendChild(badges);
        box.appendChild(head);
        var sets = exercise.querySelector('.sets');
        if (sets) {
          asideMoves.push({ sets: sets, parent: exercise });
          box.appendChild(sets);
        }
        card.appendChild(box);
      });
    });

    if (!any) card.appendChild(el('p', 'aside-hint', t('aside.empty')));

    aside.appendChild(card);
    aside.hidden = false;
    $('#aside-clock').textContent = fmtElapsed(Date.now() - view.startedAt);
    renderExerciseTimers();
    updateAsideRest();
  }

  function renderWorkout() {
    closePopover();
    var list = $('#workout-list');
    list.innerHTML = '';
    resetWorkoutAside();
    if (!view) return;

    var lastDayId = null;
    view.blocks.forEach(function (block) {
      if (view.dayCount > 1 && block.dayId !== lastDayId) {
        list.appendChild(el('p', 'section-label', block.dayName || t('workout.day')));
        lastDayId = block.dayId;
      }

      var isOpen = view.open.has(block.key);
      var card = el('section', 'block' + (isOpen ? ' open' : ''));

      var head = el('button', 'block-head');
      head.type = 'button';
      head.setAttribute('aria-expanded', String(isOpen));

      var text = el('div', 'block-head-text');
      if (block.label) text.appendChild(el('span', 'block-kicker', block.label));
      text.appendChild(el('span', 'block-title', block.title));
      head.appendChild(text);

      if (block.kind === 'cardio') {
        var target = block.entries[0] && block.entries[0].targetReps;
        if (target) head.appendChild(el('span', 'block-meta', fmtNum(target) + ' min'));
      } else if (block.kind === 'superset') {
        head.appendChild(el('span', 'block-meta', t('workout.exerciseCount', { n: block.entries.length })));
      }
      head.appendChild(el('span', 'chev', '›'));
      card.appendChild(head);

      var body = el('div', 'block-body');
      body.hidden = !isOpen;

      if (block.kind === 'cardio') {
        block.entries.forEach(function (entry) { body.appendChild(buildCardio(entry)); });
      } else {
        block.entries.forEach(function (entry, index) {
          body.appendChild(buildExercise(block, entry, index));
        });
      }

      head.addEventListener('click', function () {
        var opening = body.hidden;
        body.hidden = !opening;
        card.classList.toggle('open', opening);
        head.setAttribute('aria-expanded', String(opening));
        if (opening) view.open.add(block.key);
        else view.open.delete(block.key);
        syncWorkoutAside();
      });

      card.appendChild(body);
      list.appendChild(card);
    });
    syncWorkoutAside();
  }

  function schemeText(entry) {
    var reps = entry.targetReps == null ? '—' : fmtNum(entry.targetReps);
    var suffix = entry.repUnit === 3 ? ' s' : '';
    return entry.setCount + ' × ' + reps + suffix;
  }

  function buildRirChip(text) {
    var chip = el('button', 'chip chip-rir', text);
    chip.type = 'button';
    chip.setAttribute('aria-haspopup', 'dialog');
    chip.title = t('rir.what');
    chip.addEventListener('click', function () { openHelp('help-rir'); });
    return chip;
  }

  function rirOptions() {
    return [0, 1, 2, 3].map(function (value) {
      return { value: value, label: t('rir.option' + value) };
    });
  }

  var popover = null;
  var popoverOwner = null;

  function closePopover() {
    if (!popover) return;
    var owner = popoverOwner;
    popover.remove();
    popover = null;
    popoverOwner = null;
    if (owner) owner.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onPopoverDocumentPointer, true);
    document.removeEventListener('keydown', onPopoverDocumentKey, true);
    window.removeEventListener('resize', closePopover);
    window.removeEventListener('scroll', closePopover, true);
  }

  function onPopoverDocumentPointer(ev) {
    if (!popover) return;
    if (popover.contains(ev.target)) return;
    if (popoverOwner && popoverOwner.contains(ev.target)) return;
    closePopover();
  }

  function onPopoverDocumentKey(ev) {
    if (!popover) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      var owner = popoverOwner;
      closePopover();
      if (owner) owner.focus({ preventScroll: true });
      return;
    }
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    var options = Array.prototype.slice.call(popover.querySelectorAll('[data-popover-option]'));
    if (!options.length) return;
    ev.preventDefault();
    var index = options.indexOf(document.activeElement);
    index += ev.key === 'ArrowDown' ? 1 : -1;
    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;
    options[index].focus();
  }

  function positionPopover(panel, anchor, maxWidth) {
    var margin = 8;
    var rect = anchor.getBoundingClientRect();
    var width = Math.min(maxWidth || 240, window.innerWidth - margin * 2);
    panel.style.width = width + 'px';
    var height = panel.offsetHeight;
    var left = rect.right - width;
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
    var top = rect.bottom + 6;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, rect.top - height - 6);
    panel.style.left = Math.round(left) + 'px';
    panel.style.top = Math.round(top) + 'px';
  }

  function showPopover(panel, anchor, focusSelector, maxWidth) {
    document.body.appendChild(panel);
    popover = panel;
    popoverOwner = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    positionPopover(panel, anchor, maxWidth);

    document.addEventListener('pointerdown', onPopoverDocumentPointer, true);
    document.addEventListener('keydown', onPopoverDocumentKey, true);
    window.addEventListener('resize', closePopover);
    window.addEventListener('scroll', closePopover, true);

    var focused = (focusSelector && panel.querySelector(focusSelector)) ||
      panel.querySelector('.is-selected') ||
      panel.querySelector('[data-popover-option]');
    if (focused) focused.focus({ preventScroll: true });
  }

  function openRirPopover(anchor, input) {
    if (popover && popoverOwner === anchor) {
      closePopover();
      return;
    }
    closePopover();

    var current = parseNum(input.value);
    var panel = el('div', 'rir-popover');
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', t('rir.aria'));

    rirOptions().forEach(function (option) {
      var selected = current != null && current === option.value;
      var item = el('button', 'rir-option' + (selected ? ' is-selected' : ''), option.label);
      item.type = 'button';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(selected));
      item.setAttribute('data-popover-option', '');
      item.addEventListener('click', function () {
        closePopover();
        input.value = String(option.value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus({ preventScroll: true });
      });
      panel.appendChild(item);
    });

    showPopover(panel, anchor, '.rir-option.is-selected', 240);
  }

  function openLangPopover(anchor) {
    if (popover && popoverOwner === anchor) {
      closePopover();
      return;
    }
    closePopover();

    var panel = el('div', 'rir-popover lang-popover');
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', t('nav.language'));

    LANGS.forEach(function (language) {
      var selected = language.code === currentLangCode;
      var item = el('button', 'rir-option lang-option' + (selected ? ' is-selected' : ''), language.label);
      item.type = 'button';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(selected));
      item.setAttribute('data-popover-option', '');
      item.setAttribute('lang', language.code);
      item.setAttribute('data-lang-code', language.code);
      item.addEventListener('click', function () {
        closePopover();
        setLanguage(language.code);
        anchor.focus({ preventScroll: true });
      });
      panel.appendChild(item);
    });

    showPopover(panel, anchor, '.lang-option.is-selected', 200);
  }

  function openMenuPopover(anchor) {
    if (popover && popoverOwner === anchor) {
      closePopover();
      return;
    }
    closePopover();

    var enabled = document.body.classList.contains('extended');
    var panel = el('div', 'rir-popover menu-popover');
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-label', t('menu.title'));

    var toggle = el('button', 'rir-option menu-option');
    toggle.type = 'button';
    toggle.setAttribute('role', 'menuitemcheckbox');
    toggle.setAttribute('aria-checked', String(enabled));
    toggle.setAttribute('data-popover-option', '');
    toggle.setAttribute('data-menu-extended', '');
    var mark = el('span', 'menu-check', enabled ? '✓' : '');
    mark.setAttribute('aria-hidden', 'true');
    toggle.appendChild(mark);
    toggle.appendChild(el('span', 'menu-label', t('menu.extended')));
    toggle.addEventListener('click', function () {
      setExtendedMode(!document.body.classList.contains('extended'));
      closePopover();
      anchor.focus({ preventScroll: true });
    });
    panel.appendChild(toggle);

    var link = el('a', 'rir-option menu-option menu-link');
    link.href = '/';
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('role', 'menuitem');
    link.setAttribute('data-popover-option', '');
    var spacer = el('span', 'menu-check', '');
    spacer.setAttribute('aria-hidden', 'true');
    link.appendChild(spacer);
    link.appendChild(el('span', 'menu-label', t('menu.web')));
    link.addEventListener('click', function () { closePopover(); });
    panel.appendChild(link);

    showPopover(panel, anchor, '[data-menu-extended]', 240);
  }

  function buildExercise(block, entry, index) {
    var card = el('div', 'exercise');
    card.setAttribute('data-entry-id', String(entry.id));

    var head = el('div', 'exercise-head');
    head.appendChild(el('h3', 'exercise-name', entry.name));

    var badges = el('div', 'badges');
    if (block.kind === 'superset') {
      badges.appendChild(el('span', 'chip chip-accent', String.fromCharCode(65 + index)));
    }
    if (entry.type === 'warmup') badges.appendChild(el('span', 'chip chip-warn', t('warmup')));
    badges.appendChild(el('span', 'chip', schemeText(entry)));
    var rirValue = /\bRIR\s*(\d+(?:[.,]\d+)?)/i.exec(entry.comment || '');
    if (rirValue) badges.appendChild(buildRirChip('RIR ' + rirValue[1].replace(',', '.')));
    var timer = el('span', 'ex-timer');
    timer.hidden = true;
    timer.setAttribute('data-entry-id', String(entry.id));
    badges.appendChild(timer);
    head.appendChild(badges);

    if (entry.comment) head.appendChild(el('p', 'exercise-comment', entry.comment));
    card.appendChild(head);

    if (entry.video) {
      var wrap = el('div', 'video-wrap');
      var video = document.createElement('video');
      video.className = 'ex-video';
      video.src = entry.video;
      video.muted = true;
      video.loop = true;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('playsinline', '');
      video.addEventListener('loadedmetadata', function () {
        if (!video.videoWidth || !video.videoHeight) return;
        wrap.style.aspectRatio = video.videoWidth + ' / ' + video.videoHeight;
      });
      wrap.appendChild(video);
      card.appendChild(wrap);
    }

    var sets = el('div', 'sets');
    var header = el('div', 'set-row set-head');
    header.appendChild(el('span', null, t('set.header')));
    header.appendChild(el('span', null, 'kg'));
    header.appendChild(el('span', null, entry.repUnit === 3 ? t('set.seconds') : t('set.reps')));
    header.appendChild(el('span', null, t('set.rir')));
    header.appendChild(el('span', null, ''));
    sets.appendChild(header);

    for (var i = 0; i < entry.setCount; i++) {
      (function (index2) {
        var key = entry.id + ':' + index2;
        var saved = view.sets[key];
        var prescription = entryPrescription(entry, index2);
        var defaultWeight = prescription.weight != null
          ? prescription.weight
          : (entry.previous && entry.previous.weight != null ? entry.previous.weight : '');
        var row = el('div', 'set-row' + (saved ? ' done' : ''));

        row.appendChild(el('span', 'set-num', String(index2 + 1)));

        var kg = numberInput(saved ? saved.kg : defaultWeight, '0.5');
        kg.placeholder = '—';
        var reps = numberInput(saved ? saved.reps : prescription.reps, '1');
        var rir = numberInput(saved ? saved.rir : prescription.rir, '1');
        rir.placeholder = '—';
        rir.setAttribute('aria-label', t('set.rirAria', { n: index2 + 1 }));
        rir.min = '0';
        rir.max = '4';

        var rirField = el('div', 'rir-field');
        rirField.appendChild(rir);
        var rirToggle = el('button', 'rir-toggle', '▾');
        rirToggle.type = 'button';
        rirToggle.title = t('set.rirChoose');
        rirToggle.setAttribute('aria-label', t('set.rirOptions'));
        rirToggle.setAttribute('aria-haspopup', 'listbox');
        rirToggle.setAttribute('aria-expanded', 'false');
        rirToggle.addEventListener('click', function () {
          openRirPopover(rirToggle, rir);
        });
        rirField.appendChild(rirToggle);

        row.appendChild(kg);
        row.appendChild(reps);
        row.appendChild(rirField);

        var check = el('button', 'set-check' + (saved ? ' is-done' : ''), '✓');
        check.type = 'button';
        check.title = saved ? t('set.unregister') : t('set.register');
        check.addEventListener('click', function () {
          toggleSet(entry, key, row, { kg: kg, reps: reps, rir: rir }, check);
        });

        kg.addEventListener('change', function () {
          updateSetLog(entry, key, { kg: kg, reps: reps, rir: rir });
        });
        reps.addEventListener('change', function () {
          updateSetLog(entry, key, { kg: kg, reps: reps, rir: rir });
        });
        rir.addEventListener('change', function () {
          updateSetLog(entry, key, { kg: kg, reps: reps, rir: rir });
        });

        row.appendChild(check);
        sets.appendChild(row);
      })(i);
    }

    card.appendChild(sets);
    return card;
  }

  function numberInput(value, step) {
    var input = document.createElement('input');
    input.type = 'number';
    input.className = 'set-input';
    input.inputMode = 'decimal';
    input.min = '0';
    input.step = step || '1';
    input.value = value == null || value === '' ? '' : String(value);
    return input;
  }

  function setRowDone(row, inputs, button, done) {
    row.classList.toggle('done', done);
    inputs.kg.readOnly = false;
    inputs.reps.readOnly = false;
    inputs.rir.readOnly = false;
    button.classList.toggle('is-done', done);
    button.title = done ? t('set.unregister') : t('set.register');
  }

  var logPatches = {};

  function rirFallback(entry, prescription) {
    var rir = prescription && prescription.rir != null ? prescription.rir : entry.targetRir;
    return rir != null ? Number(rir) : 2;
  }

  function patchLog(logId, body) {
    var chain = (logPatches[logId] || Promise.resolve()).catch(function () {});
    var run = chain.then(function () {
      return apiJSON('/api/v2/workoutlog/' + logId + '/', { method: 'PATCH', body: body });
    });
    logPatches[logId] = run.catch(function () {});
    return run;
  }

  async function updateSetLog(entry, key, inputs) {
    if (!view) return;
    var saved = view.sets[key];
    if (!saved || !saved.logId) return;

    var kgValue = parseNum(inputs.kg.value);
    var repsValue = parseNum(inputs.reps.value);
    var rirValue = parseNum(inputs.rir.value);
    var prescription = entryPrescription(entry, Number(String(key).split(':')[1]) || 0);

    if (repsValue == null || repsValue <= 0) {
      toast(entry.repUnit === 3 ? t('set.needSeconds') : t('set.needReps'));
      inputs.reps.value = saved.reps == null ? '' : String(saved.reps);
      return;
    }

    if (kgValue != null && kgValue < 0) {
      inputs.kg.value = saved.kg == null ? '' : String(saved.kg);
      return;
    }

    if (kgValue == null && saved.kg != null) {
      inputs.kg.value = String(saved.kg);
      return;
    }

    if (rirValue != null && (rirValue < 0 || rirValue > 4)) {
      toast(t('set.rirRange'));
      inputs.rir.value = saved.rir == null ? '' : String(saved.rir);
      return;
    }

    if (rirValue == null) {
      rirValue = rirFallback(entry, prescription);
      inputs.rir.value = String(rirValue);
    }

    var savedRir = saved.rir == null ? null : Number(saved.rir);

    var body = {};
    if (repsValue !== Number(saved.reps)) body.repetitions = repsValue;
    if (kgValue != null && kgValue !== Number(saved.kg)) {
      body.weight = kgValue;
      body.weight_unit = 1;
    }
    if (rirValue != null && rirValue !== savedRir) body.rir = rirValue;
    if (!Object.keys(body).length) return;

    if (body.repetitions != null) saved.reps = repsValue;
    if (body.weight != null) saved.kg = kgValue;
    if (body.rir != null) saved.rir = rirValue;
    persistWorkout();

    try {
      await patchLog(saved.logId, body);
      if (!view || view.sets[key] !== saved) return;
      delete saved.dirty;
      persistWorkout();
      toast(t('set.updated'));
    } catch (err) {
      if (!view || view.sets[key] !== saved) return;
      saved.dirty = true;
      persistWorkout();
      handleError(err);
    }
  }

  function setPayload(entry, sessionId, key, kgValue, repsValue, rirValue) {
    var prescription = entryPrescription(entry, Number(String(key).split(':')[1]) || 0);
    var payload = {
      date: localDateISO(),
      session: sessionId,
      routine: view.routine.id,
      iteration: view && view.iteration ? view.iteration : 1,
      slot_entry: entry.id,
      exercise: entry.exerciseId,
      repetitions_unit: entry.repUnit || 1,
      repetitions: repsValue
    };
    if (prescription.reps != null) payload.repetitions_target = prescription.reps;
    if (kgValue != null) {
      payload.weight = kgValue;
      payload.weight_unit = 1;
    }
    if (rirValue != null) {
      payload.rir = rirValue;
      var rirTarget = prescription.rir != null ? prescription.rir : entry.targetRir;
      if (rirTarget != null) payload.rir_target = rirTarget;
    }
    if (prescription.rest) {
      payload.rest = prescription.rest;
      payload.rest_target = prescription.rest;
    }
    return payload;
  }

  async function toggleSet(entry, key, row, inputs, button) {
    if (!view || view.busy) return;
    var current = view.sets[key];

    if (current) {
      if (!confirm(t('set.removeConfirm'))) return;
      view.busy = true;
      button.disabled = true;
      try {
        var res = await api('/api/v2/workoutlog/' + current.logId + '/', { method: 'DELETE' });
        if (!res.ok && res.status !== 404) throw new Error(t('set.removeError'));
        delete view.sets[key];
        untrackEntryTimer(entry);
        persistWorkout();
        setRowDone(row, inputs, button, false);
        updateProgress();
        toast(t('set.removed'));
      } catch (err) {
        handleError(err);
      } finally {
        view.busy = false;
        button.disabled = false;
      }
      return;
    }

    var kgValue = parseNum(inputs.kg.value);
    var repsValue = parseNum(inputs.reps.value);
    var rirValue = parseNum(inputs.rir.value);
    var prescription = entryPrescription(entry, Number(String(key).split(':')[1]) || 0);

    if (repsValue == null || repsValue <= 0) {
      toast(entry.repUnit === 3 ? t('set.needSeconds') : t('set.needReps'));
      inputs.reps.focus();
      return;
    }

    if (rirValue == null) {
      rirValue = rirFallback(entry, prescription);
      inputs.rir.value = String(rirValue);
    }

    view.busy = true;
    button.disabled = true;

    try {
      var sessionId = await ensureSession();
      var payload = setPayload(entry, sessionId, key, kgValue, repsValue, rirValue);

      var log = await apiJSON('/api/v2/workoutlog/', { method: 'POST', body: payload });
      view.sets[key] = { logId: log.id, kg: kgValue, reps: repsValue, rir: rirValue };
      trackEntryTimer(entry);
      persistWorkout();
      setRowDone(row, inputs, button, true);
      updateProgress();
      if (prescription.rest) startRest(prescription.rest);
    } catch (err) {
      handleError(err);
    } finally {
      if (view) view.busy = false;
      button.disabled = false;
    }
  }

  function cardioState(saved) {
    if (!saved) return null;
    if (saved.minutes || saved.distance) return saved;
    if (!saved.logId) return null;
    return { minutes: { logId: saved.logId, value: saved.reps }, distance: null };
  }

  function setCardioDone(card, inputs, button, done) {
    card.classList.toggle('done', done);
    inputs.minutes.readOnly = false;
    inputs.distance.readOnly = false;
    button.textContent = done ? t('cardio.registered') : t('cardio.register');
  }

  function buildCardio(entry) {
    var key = entry.id + ':0';
    var raw = view.sets[key];
    var saved = cardioState(raw);
    if (saved && saved !== raw) view.sets[key] = saved;

    var card = el('div', 'cardio' + (saved ? ' done' : ''));
    card.appendChild(el('p', 'cardio-title', entry.name));
    card.appendChild(el('p', 'cardio-sub', entry.comment || t('cardio.sub')));

    var row = el('div', 'cardio-row');

    var timeField = el('label', 'field');
    timeField.appendChild(el('span', null, t('cardio.minutes')));
    var minutes = numberInput(saved && saved.minutes ? saved.minutes.value : entry.targetReps, '1');
    minutes.min = '1';
    timeField.appendChild(minutes);
    row.appendChild(timeField);

    var distField = el('label', 'field');
    distField.appendChild(el('span', null, t('cardio.distance')));
    var distance = numberInput(saved && saved.distance ? saved.distance.value : '', '0.1');
    distance.min = '0';
    distance.placeholder = '—';
    distField.appendChild(distance);
    row.appendChild(distField);

    var button = el('button', 'btn btn-primary', saved ? t('cardio.registered') : t('cardio.register'));
    button.type = 'button';
    row.appendChild(button);
    card.appendChild(row);

    var inputs = { minutes: minutes, distance: distance };
    setCardioDone(card, inputs, button, !!saved);

    button.addEventListener('click', function () {
      toggleCardio(entry, key, card, inputs, button);
    });

    minutes.addEventListener('change', function () {
      updateCardioLog(entry, key, inputs, 'minutes');
    });
    distance.addEventListener('change', function () {
      updateCardioLog(entry, key, inputs, 'distance');
    });

    return card;
  }

  function cardioRowPayload(entry, sessionId, unit, value, target) {
    var payload = {
      date: localDateISO(),
      session: sessionId,
      routine: view.routine.id,
      iteration: view && view.iteration ? view.iteration : 1,
      slot_entry: entry.id,
      exercise: entry.exerciseId,
      repetitions_unit: unit,
      repetitions: value,
      rest: 0,
      rest_target: 0
    };
    if (target != null) payload.repetitions_target = target;
    return payload;
  }

  function cardioUnit(which) {
    return which === 'minutes' ? 4 : 6;
  }

  function cardioLabel(which) {
    return which === 'minutes' ? t('cardio.time') : t('cardio.distanceWord');
  }

  async function updateCardioLog(entry, key, inputs, which) {
    if (!view) return;
    var saved = cardioState(view.sets[key]);
    if (!saved) return;

    var input = inputs[which];
    var value = parseNum(input.value);
    if (value != null && value <= 0) value = null;

    if (which === 'minutes' && value == null) {
      toast(t('cardio.needTime'));
      input.value = saved.minutes && saved.minutes.value != null ? String(saved.minutes.value) : '';
      return;
    }

    var part = saved[which];
    var previous = part && part.value != null ? Number(part.value) : null;
    if (!part && value == null) return;
    if (part && !part.dirty && previous === value) return;

    if (part) {
      part.value = value;
    } else {
      saved[which] = { logId: null, value: value };
    }
    persistWorkout();

    var label = cardioLabel(which);

    try {
      var pending = saved[which];
      if (pending.logId) {
        if (value == null) {
          var res = await api('/api/v2/workoutlog/' + pending.logId + '/', { method: 'DELETE' });
          if (!res.ok && res.status !== 404) throw new Error(t('cardio.removePart', { part: label }));
          if (!view || view.sets[key] !== saved) return;
          saved[which] = null;
          if (!saved.minutes && !saved.distance) delete view.sets[key];
        } else {
          await patchLog(pending.logId, { repetitions: value });
          if (!view || view.sets[key] !== saved) return;
          delete saved[which].dirty;
        }
      } else if (value != null) {
        var sessionId = await ensureSession();
        var target = which === 'minutes'
          ? (entry.targetReps != null ? entry.targetReps : 10)
          : null;
        var log = await apiJSON('/api/v2/workoutlog/', {
          method: 'POST',
          body: cardioRowPayload(entry, sessionId, cardioUnit(which), value, target)
        });
        if (!view || view.sets[key] !== saved) return;
        saved[which] = { logId: log.id, value: value };
      } else {
        return;
      }

      persistWorkout();
      updateProgress();
      toast(value == null ? t('cardio.distanceRemoved')
        : (which === 'minutes' ? t('cardio.timeUpdated') : t('cardio.distanceUpdated')));
    } catch (err) {
      if (!view || view.sets[key] !== saved) return;
      if (saved[which]) saved[which].dirty = true;
      persistWorkout();
      handleError(err);
    }
  }

  async function toggleCardio(entry, key, card, inputs, button) {
    if (!view || view.busy) return;
    var current = cardioState(view.sets[key]);

    if (current) {
      if (!confirm(t('cardio.removeConfirm'))) return;
      view.busy = true;
      button.disabled = true;
      try {
        var ids = [];
        if (current.minutes && current.minutes.logId) ids.push(current.minutes.logId);
        if (current.distance && current.distance.logId) ids.push(current.distance.logId);
        await Promise.all(ids.map(function (logId) {
          return api('/api/v2/workoutlog/' + logId + '/', { method: 'DELETE' }).then(function (res) {
            if (!res.ok && res.status !== 404) throw new Error(t('cardio.removeError'));
          });
        }));
        delete view.sets[key];
        persistWorkout();
        setCardioDone(card, inputs, button, false);
        updateProgress();
        toast(t('cardio.removed'));
      } catch (err) {
        handleError(err);
      } finally {
        if (view) view.busy = false;
        button.disabled = false;
      }
      return;
    }

    var minutes = parseNum(inputs.minutes.value);
    var distance = parseNum(inputs.distance.value);
    if (minutes != null && minutes <= 0) minutes = null;
    if (distance != null && distance <= 0) distance = null;

    if (minutes == null && distance == null) {
      toast(t('cardio.needEither'));
      inputs.minutes.focus();
      return;
    }

    view.busy = true;
    button.disabled = true;

    var state = { minutes: null, distance: null };

    try {
      var sessionId = await ensureSession();

      if (minutes != null) {
        var minutesPayload = cardioRowPayload(entry, sessionId, 4, minutes,
          entry.targetReps != null ? entry.targetReps : 10);
        var minutesLog = await apiJSON('/api/v2/workoutlog/', { method: 'POST', body: minutesPayload });
        state.minutes = { logId: minutesLog.id, value: minutes };
      }

      if (distance != null) {
        try {
          var distancePayload = cardioRowPayload(entry, sessionId, 6, distance, null);
          var distanceLog = await apiJSON('/api/v2/workoutlog/', { method: 'POST', body: distancePayload });
          state.distance = { logId: distanceLog.id, value: distance };
        } catch (err) {
          if (!state.minutes) throw err;
          view.sets[key] = state;
          persistWorkout();
          setCardioDone(card, inputs, button, true);
          updateProgress();
          handleError(err);
          return;
        }
      }

      view.sets[key] = state;
      persistWorkout();
      setCardioDone(card, inputs, button, true);
      updateProgress();
      toast(t('cardio.registered'));
    } catch (err) {
      handleError(err);
    } finally {
      if (view) view.busy = false;
      button.disabled = false;
    }
  }

  async function ensureSession() {
    if (!view) throw new Error(t('workout.closed'));
    if (view.sessionId) return view.sessionId;

    var payload = {
      routine: view.routine.id,
      datetime_start: new Date(view.startedAt || Date.now()).toISOString()
    };
    if (view.dayId) payload.day = view.dayId;

    var session = await apiJSON('/api/v2/workoutsession/', { method: 'POST', body: payload });
    view.sessionId = session.id;
    persistWorkout();
    return session.id;
  }

  function persistWorkout() {
    if (!view) return;
    writeJSON(LS_WORKOUT + view.routine.id, {
      sessionId: view.sessionId,
      startedAt: view.startedAt,
      iteration: view.iteration,
      date: view.date,
      sets: view.sets,
      exTimes: view.exTimes
    });
  }

  function leaveWorkout() {
    if (view) {
      var count = Object.keys(view.sets).length;
      if (count && !confirm(t('leave.confirm'))) {
        return;
      }
    }
    closePopover();
    stopRest();
    stopWorkoutClock();
    releaseWakeLock();
    view = null;
    $('#workout-tools').hidden = true;
    show('screen-routines');
    renderRoutines();
  }

  async function finishWorkout() {
    if (!view) return;
    var stats = progress();
    var message = stats.done
      ? t('finish.confirm')
      : t('finish.confirmEmpty');
    if (!confirm(message)) return;

    closePopover();
    stopRest();
    stopWorkoutClock();
    releaseWakeLock();

    var finished = view;
    var pending = [];

    $('#btn-finish').disabled = true;

    try {
      pending = await reconcileWorkout(finished);
    } catch (err) {
      handleError(err);
    }
    if (!view) {
      $('#btn-finish').disabled = false;
      return;
    }

    var volume = 0;
    Object.keys(finished.sets).forEach(function (key) {
      var item = finished.sets[key];
      var kg = Number(item.kg) || 0;
      var reps = Number(item.reps) || 0;
      volume += kg * reps;
    });
    var duration = Date.now() - (finished.startedAt || Date.now());

    try {
      if (finished.sessionId) {
        await apiJSON('/api/v2/workoutsession/' + finished.sessionId + '/', {
          method: 'PATCH',
          body: { datetime_end: new Date().toISOString() }
        });
      }
    } catch (err) {
      handleError(err);
      if (!view) {
        $('#btn-finish').disabled = false;
        return;
      }
      pending.push(t('summary.sessionEnd'));
    }

    localStorage.removeItem(LS_WORKOUT + finished.routine.id);
    view = null;
    showSummary(finished.routine, {
      sets: Object.keys(finished.sets).length,
      volume: volume,
      duration: duration,
      pending: pending
    });
    $('#btn-finish').disabled = false;
  }

  // ---------- cancelar treino ----------

  function collectSessionLogIds(workout) {
    var ids = [];
    var seen = new Set();
    function add(id) {
      if (id == null) return;
      var key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      ids.push(id);
    }
    if (!workout) return ids;
    Object.keys(workout.sets || {}).forEach(function (key) {
      var item = workout.sets[key];
      if (!item) return;
      add(item.logId);
      if (item.minutes) add(item.minutes.logId);
      if (item.distance) add(item.distance.logId);
    });
    return ids;
  }

  async function deleteQuietly(path, label) {
    try {
      var res = await api(path, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        console.warn('Cancelamento: falha ao apagar ' + label + ' (HTTP ' + res.status + ').');
      }
    } catch (err) {
      console.warn('Cancelamento: falha ao apagar ' + label + '.', err);
    }
  }

  async function discardWorkout(workout) {
    var ids = collectSessionLogIds(workout);
    await Promise.all(ids.map(function (id) {
      return deleteQuietly('/api/v2/workoutlog/' + id + '/', 'registro ' + id);
    }));
    if (workout && workout.sessionId) {
      await deleteQuietly('/api/v2/workoutsession/' + workout.sessionId + '/', 'sessão ' + workout.sessionId);
    }
  }

  function openCancelSheet() {
    if (!view) return;
    $('#cancel-sheet').hidden = false;
    $('#cancel-dismiss').focus();
  }

  function closeCancelSheet() {
    $('#cancel-sheet').hidden = true;
  }

  async function cancelWorkout() {
    if (!view || view.busy) return;
    var workout = view;
    var confirmBtn = $('#cancel-confirm');
    view.busy = true;
    confirmBtn.disabled = true;

    closeCancelSheet();
    closePopover();
    stopRest();
    stopWorkoutClock();
    releaseWakeLock();

    try {
      await discardWorkout(workout);
    } catch (err) {
      console.warn('Cancelamento: falha ao apagar a sessão.', err);
    }

    try {
      localStorage.removeItem(LS_WORKOUT + workout.routine.id);
    } catch (err) {
      console.warn('Cancelamento: falha ao limpar o rascunho local.', err);
    }

    view = null;
    $('#workout-tools').hidden = true;
    $('#workout-list').innerHTML = '';
    $('#workout-progress').textContent = '';
    $('#btn-finish').disabled = true;
    confirmBtn.disabled = false;
    show('screen-routines');
    renderRoutines();
    toast(t('cancel.done'));
  }

  // ---------- consolidação antes de encerrar ----------

  async function reconcileWorkout(workout) {
    var pending = [];

    for (var b = 0; b < workout.blocks.length; b++) {
      var block = workout.blocks[b];
      for (var e = 0; e < block.entries.length; e++) {
        var entry = block.entries[e];
        if (block.kind === 'cardio') {
          await reconcileCardio(workout, entry, pending);
        } else {
          for (var i = 0; i < entry.setCount; i++) {
            await reconcileSet(workout, entry, entry.id + ':' + i, pending);
          }
        }
      }
    }

    persistWorkout();
    return pending;
  }

  async function reconcileSet(workout, entry, key, pending) {
    var saved = workout.sets[key];
    if (!saved) return;
    var label = t('summary.setPart', { name: entry.name, n: Number(key.split(':')[1]) + 1 });
    var prescription = entryPrescription(entry, Number(key.split(':')[1]) || 0);

    try {
      if (!saved.logId) {
        var sessionId = await ensureSession();
        var log = await apiJSON('/api/v2/workoutlog/', {
          method: 'POST',
          body: setPayload(entry, sessionId, key, saved.kg, saved.reps, saved.rir)
        });
        saved.logId = log.id;
        delete saved.dirty;
        return;
      }
      if (!saved.dirty) return;

      var body = { repetitions: saved.reps };
      if (saved.kg != null) {
        body.weight = saved.kg;
        body.weight_unit = 1;
      }
      if (saved.rir != null) {
        body.rir = saved.rir;
        var rirTarget = prescription.rir != null ? prescription.rir : entry.targetRir;
        if (rirTarget != null) body.rir_target = rirTarget;
      }
      await apiJSON('/api/v2/workoutlog/' + saved.logId + '/', { method: 'PATCH', body: body });
      delete saved.dirty;
    } catch (err) {
      console.error(err);
      pending.push(label);
    }
  }

  async function reconcileCardio(workout, entry, pending) {
    var saved = workout.sets[entry.id + ':0'];
    if (!saved) return;

    var parts = ['minutes', 'distance'];
    for (var i = 0; i < parts.length; i++) {
      var which = parts[i];
      var part = saved[which];
      if (!part) continue;
      if (part.logId && !part.dirty) continue;
      if (!part.logId && part.value == null) continue;

      var label = t('summary.part', { name: entry.name, part: cardioLabel(which) });

      try {
        if (part.logId) {
          if (part.value == null) {
            var res = await api('/api/v2/workoutlog/' + part.logId + '/', { method: 'DELETE' });
            if (!res.ok && res.status !== 404) throw new Error(t('cardio.removePart', { part: cardioLabel(which) }));
            saved[which] = null;
          } else {
            await apiJSON('/api/v2/workoutlog/' + part.logId + '/', {
              method: 'PATCH',
              body: { repetitions: part.value }
            });
            delete part.dirty;
          }
        } else {
          var sessionId = await ensureSession();
          var target = which === 'minutes'
            ? (entry.targetReps != null ? entry.targetReps : 10)
            : null;
          var log = await apiJSON('/api/v2/workoutlog/', {
            method: 'POST',
            body: cardioRowPayload(entry, sessionId, cardioUnit(which), part.value, target)
          });
          part.logId = log.id;
          delete part.dirty;
        }
      } catch (err) {
        console.error(err);
        pending.push(label);
      }
    }

    if (!saved.minutes && !saved.distance) delete workout.sets[entry.id + ':0'];
  }

  function showSummary(routine, stats) {
    $('#summary-sub').textContent = routine.name || '';
    var list = $('#summary-stats');
    list.innerHTML = '';

    function add(label, value) {
      var box = el('div');
      box.appendChild(el('dt', null, label));
      box.appendChild(el('dd', null, value));
      list.appendChild(box);
    }

    add(t('summary.duration'), fmtDuration(stats.duration));
    add(t('summary.sets'), String(stats.sets));
    if (stats.volume > 0) {
      add(t('summary.volume'), Math.round(stats.volume).toLocaleString(uiLocale()) + ' kg');
    } else {
      add(t('summary.volume'), '—');
    }

    if (stats.pending && stats.pending.length) {
      var pendingBox = el('div', 'summary-pending');
      pendingBox.appendChild(el('dt', null, t('summary.pending')));
      var detail = el('dd');
      stats.pending.forEach(function (text) {
        detail.appendChild(el('p', 'summary-pending-item', text));
      });
      pendingBox.appendChild(detail);
      list.appendChild(pendingBox);
    }

    show('screen-summary');
  }

  // ---------- histórico ----------

  async function showHistory() {
    show('screen-history');
    var list = $('#history-list');
    list.innerHTML = '<div class="spinner"></div>';

    try {
      var results = await Promise.all([
        apiJSON('/api/v2/workoutlog/?ordering=-date&limit=100'),
        preloadNames().catch(function () { return new Map(); })
      ]);

      var logs = results[0].results || [];
      var names = results[1];

      if (!logs.length) {
        list.innerHTML = '';
        list.appendChild(el('p', 'empty', t('history.empty')));
        return;
      }

      var groups = new Map();
      logs.forEach(function (log) {
        var key = log.date || '';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(log);
      });

      list.innerHTML = '';
      groups.forEach(function (items, date) {
        var day = el('section', 'history-day');
        day.appendChild(el('h2', 'history-date', dateLabel(date)));

        var byExercise = new Map();
        items.forEach(function (log) {
          var cardio = log.repetitions_unit === 4 || log.repetitions_unit === 6;
          var key = cardio ? log.exercise + '|' + String(log.session || '') : String(log.exercise);
          if (!byExercise.has(key)) byExercise.set(key, []);
          byExercise.get(key).push(log);
        });

        byExercise.forEach(function (sets) {
          var exerciseId = sets[0].exercise;
          var cardio = sets[0].repetitions_unit === 4 || sets[0].repetitions_unit === 6;
          if (cardio) {
            sets.sort(function (a, b) {
              return (a.repetitions_unit === 4 ? 0 : 1) - (b.repetitions_unit === 4 ? 0 : 1);
            });
          }
          var row = el('div', 'history-row');
          row.appendChild(el('span', 'history-name',
            names.get(exerciseId) || t('exercise.fallback', { id: exerciseId })));
          var text = sets.map(logSummary).filter(Boolean).join(' · ');
          row.appendChild(el('span', 'history-sets', text || '—'));
          day.appendChild(row);
        });

        list.appendChild(day);
      });
    } catch (err) {
      if (err instanceof AuthError) {
        handleError(err);
        return;
      }
      list.innerHTML = '';
      list.appendChild(el('p', 'empty', t('history.load')));
      handleError(err);
    }
  }

  function logSummary(log) {
    var reps = '';
    if (log.repetitions != null) {
      var suffix = log.repetitions_unit === 4 ? ' min'
        : (log.repetitions_unit === 3 ? ' s' : (log.repetitions_unit === 6 ? ' km' : ''));
      reps = fmtNum(log.repetitions) + suffix;
    }
    var weight = log.weight != null ? fmtNum(log.weight) + ' kg' : '';
    if (weight && reps) return weight + ' × ' + reps;
    return weight || reps;
  }

  // ---------- descanso ----------

  function writeRest() {
    writeJSON(LS_REST, { endAt: restState.endAt, total: restState.total });
  }

  function renderRest() {
    var left = Math.max(0, restState.endAt - Date.now());
    $('#rest-time').textContent = fmtClock(left);
    var pct = restState.total ? (left / restState.total) * 100 : 0;
    $('#rest-fill').style.width = Math.max(0, Math.min(100, pct)) + '%';
    updateAsideRest();
  }

  function vibrate() {
    if (navigator.vibrate) {
      try { navigator.vibrate([240, 120, 240]); } catch (e) { /* ignorado */ }
    }
  }

  function startRest(seconds) {
    if (!seconds || seconds <= 0) return;
    restState.endAt = Date.now() + seconds * 1000;
    restState.total = seconds * 1000;
    writeRest();
    runRest();
  }

  function runRest() {
    clearInterval(restState.timer);
    clearTimeout(restState.hideTimer);
    restState.hideTimer = null;

    var bar = $('#rest-bar');
    bar.hidden = false;
    $('#rest-label').textContent = t('rest.label');
    renderRest();

    restState.timer = setInterval(function () {
      if (Date.now() >= restState.endAt) {
        clearInterval(restState.timer);
        restState.timer = null;
        restState.endAt = 0;
        restState.total = 0;
        localStorage.removeItem(LS_REST);
        $('#rest-label').textContent = t('rest.done');
        $('#rest-time').textContent = '0:00';
        $('#rest-fill').style.width = '0%';
        updateAsideRest();
        vibrate();
        restState.hideTimer = setTimeout(function () {
          if (!restState.timer) bar.hidden = true;
        }, 5000);
        return;
      }
      renderRest();
    }, 200);
  }

  function stopRest() {
    clearInterval(restState.timer);
    clearTimeout(restState.hideTimer);
    restState.timer = null;
    restState.hideTimer = null;
    restState.endAt = 0;
    restState.total = 0;
    localStorage.removeItem(LS_REST);
    $('#rest-bar').hidden = true;
    updateAsideRest();
  }

  function addRest(seconds) {
    if (!restState.endAt || restState.endAt <= Date.now()) return;
    restState.endAt += seconds * 1000;
    restState.total += seconds * 1000;
    writeRest();
    renderRest();
  }

  function maybeResumeRest() {
    var saved = readJSON(LS_REST);
    if (saved && saved.endAt && saved.endAt > Date.now()) {
      restState.endAt = saved.endAt;
      restState.total = saved.total || (saved.endAt - Date.now());
      runRest();
    } else if (saved) {
      localStorage.removeItem(LS_REST);
    }
  }

  // ---------- wake lock ----------

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', function () { wakeLock = null; });
    } catch (e) { /* sem permissão ou sem suporte */ }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      try { wakeLock.release(); } catch (e) { /* ignorado */ }
      wakeLock = null;
    }
  }

  // ---------- service worker ----------

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    var secure = location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';
    if (!secure) return;
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service worker não registrado:', err);
    });
  }

  // ---------- ajuda ----------

  var helpFocusTimer = null;

  function openHelp(sectionId) {
    if (typeof sectionId !== 'string') sectionId = null;
    var sheet = $('#help-sheet');
    sheet.hidden = false;
    if (helpFocusTimer) { clearTimeout(helpFocusTimer); helpFocusTimer = null; }
    var section = sectionId ? $('#' + sectionId) : null;
    if (section) {
      section.classList.add('help-focus');
      section.setAttribute('tabindex', '-1');
      if (section.focus) section.focus({ preventScroll: true });
      if (section.scrollIntoView) section.scrollIntoView({ block: 'start' });
      helpFocusTimer = setTimeout(function () {
        section.classList.remove('help-focus');
        helpFocusTimer = null;
      }, 1600);
    } else {
      $('#help-close').focus();
    }
  }

  function closeHelp() {
    $('#help-sheet').hidden = true;
    var focused = $('.help-focus');
    if (focused) focused.classList.remove('help-focus');
    if (helpFocusTimer) { clearTimeout(helpFocusTimer); helpFocusTimer = null; }
  }

  // ---------- boot ----------

  function init() {
    $('#login-form').addEventListener('submit', submitLogin);
    $('#btn-logout').addEventListener('click', logout);
    $('#btn-history').addEventListener('click', showHistory);
    $('#btn-history-back').addEventListener('click', function () { show('screen-routines'); });
    $('#btn-back').addEventListener('click', leaveWorkout);
    $('#btn-finish').addEventListener('click', finishWorkout);
    $('#btn-cancel').addEventListener('click', openCancelSheet);
    $('#cancel-dismiss').addEventListener('click', closeCancelSheet);
    $('#cancel-confirm').addEventListener('click', cancelWorkout);
    $('#cancel-sheet').addEventListener('click', function (ev) {
      if (ev.target === this) closeCancelSheet();
    });
    $('#btn-help').addEventListener('click', openHelp);
    $('#btn-help-routines').addEventListener('click', openHelp);
    $('#help-close').addEventListener('click', closeHelp);
    $('#help-sheet').addEventListener('click', function (ev) {
      if (ev.target === this) closeHelp();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (!$('#cancel-sheet').hidden) {
          closeCancelSheet();
          return;
        }
        closeHelp();
      }
    });
    $('#btn-summary-ok').addEventListener('click', function () {
      show('screen-routines');
      renderRoutines();
    });
    $('#rest-add').addEventListener('click', function () { addRest(15); });
    $('#rest-skip').addEventListener('click', function () { stopRest(); });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && view) {
        requestWakeLock();
        if (restState.endAt) renderRest();
      }
    });

    window.addEventListener('online', function () { toast(t('online')); });
    window.addEventListener('offline', function () { toast(t('offline')); });

    applyTranslations();

    var langToggles = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < langToggles.length; i++) {
      langToggles[i].addEventListener('click', function () { openLangPopover(this); });
    }

    applyExtendedMode();

    var menuToggles = document.querySelectorAll('[data-menu-toggle]');
    for (var m = 0; m < menuToggles.length; m++) {
      menuToggles[m].addEventListener('click', function () { openMenuPopover(this); });
    }

    if (window.matchMedia) {
      var wideQuery = window.matchMedia('(min-width: 900px)');
      var onWideChange = function () {
        if (!storedExtendedChoice()) applyExtendedMode();
        syncWorkoutAside();
      };
      if (wideQuery.addEventListener) wideQuery.addEventListener('change', onWideChange);
      else if (wideQuery.addListener) wideQuery.addListener(onWideChange);
    }

    if (auth && auth.access) {
      enterApp();
    } else {
      show('screen-login');
    }

    registerServiceWorker();
  }

  init();
})();
