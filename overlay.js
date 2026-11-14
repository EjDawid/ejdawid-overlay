// EjDawid overlay – cała logika. Spec: docs/spec-overlay.md
// Loader (se/loader.html) przekazuje tu zdarzenia SE przez window.EjOverlay.handle(type, detail).
(() => {
  'use strict';

  const MODES = ['gra', 'start', 'przerwa', 'koniec'];
  const DEFAULT_GOAL = 100;
  const NO_FOLLOWER = 'jeszcze nikt';

  // ?debug=1 w adresie skryptu włącza napis z ostatnim zdarzeniem
  const scriptSrc = (document.currentScript && document.currentScript.src) || '';
  const debug = /[?&]debug=1\b/.test(scriptSrc);

  const state = {
    fields: {},
    mode: 'gra',
    followers: 0,
    goal: DEFAULT_GOAL,
    goalReached: false, // raz osiągnięty zostaje do przeładowania (spec 5.4)
    latestFollower: '',
  };

  const el = {};

  // Pomocnik: element z klasą i opcjonalnym tekstem (zawsze textContent)
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build() {
    let root = document.getElementById('ej-root');
    if (!root) {
      root = make('div');
      root.id = 'ej-root';
      document.body.appendChild(root);
    }

    // Kolumna przy lewej krawędzi (tylko tryb gra)
    const column = make('div', 'g-column');

    // G2: pasek celu followów (biała obwódka > kremowy środek > koralowe wypełnienie)
    el.g2 = make('div', 'ej-bar g2-goal');
    const g2Inner = make('div', 'ej-bar-inner');
    el.g2Text = make('span', 'g2-text');
    el.g2Percent = make('span', 'g2-percent');
    el.g2Progress = make('div', 'g2-progress');
    g2Inner.append(el.g2Progress, el.g2Text, el.g2Percent);
    el.g2.appendChild(g2Inner);

    // G3: ostatni follow (tekst na środku, gwiazdka w rogu z CSS)
    el.g3 = make('div', 'ej-bar g3-follow');
    const g3Inner = make('div', 'ej-bar-inner');
    el.g3Nick = make('span', 'g3-nick');
    g3Inner.append(make('span', 'g3-label', 'Ostatni follow:'), el.g3Nick);
    el.g3.appendChild(g3Inner);

    column.append(el.g2, el.g3);
    root.appendChild(column);

    if (debug) {
      el.debug = make('div', 'ej-debug', 'debug: czekam na zdarzenia');
      root.appendChild(el.debug);
    }
  }

  // Tryb ekranu -> klasa na <body>
  function setMode(mode) {
    state.mode = MODES.includes(mode) ? mode : 'gra';
    MODES.forEach((m) => document.body.classList.remove('mode-' + m));
    document.body.classList.add('mode-' + state.mode);
  }

  // G2: „Cel: 32/50 followów  64%” albo „Cel osiągnięty ★”
  function renderGoal() {
    if (state.followers >= state.goal) state.goalReached = true;

    if (state.goalReached) {
      el.g2Text.textContent = 'Cel osiągnięty ★';
      el.g2Percent.textContent = '';
      setProgress(100);
      return;
    }
    const percent = Math.min(100, Math.floor((state.followers / state.goal) * 100));
    el.g2Text.textContent = 'Cel: ' + state.followers + '/' + state.goal + ' followów';
    el.g2Percent.textContent = percent + '%';
    setProgress(percent);
  }

  // Wypełnienie G2; przy 0% bez kreski na krawędzi
  function setProgress(percent) {
    el.g2Progress.style.width = percent + '%';
    el.g2Progress.classList.toggle('is-empty', percent === 0);
  }

  // G3: nick ostatniego followa; flash = błysk morelowy
  function renderLatest(flash) {
    el.g3Nick.textContent = state.latestFollower || NO_FOLLOWER;
    if (flash) {
      el.g3.classList.remove('is-flash');
      void el.g3.offsetWidth; // restart animacji
      el.g3.classList.add('is-flash');
    }
  }

  // Odczyt danych sesji (wspólny dla onWidgetLoad i onSessionUpdate)
  function readSession(data) {
    if (!data) return;
    const total = data['follower-total'];
    if (total && typeof total.count === 'number') state.followers = total.count;
    const latest = data['follower-latest'];
    if (latest && typeof latest.name === 'string') state.latestFollower = latest.name;
  }

  function onWidgetLoad(detail) {
    state.fields = (detail && detail.fieldData) || {};
    setMode(state.fields.mode);
    const goal = Number(state.fields.followGoal);
    state.goal = goal > 0 ? Math.floor(goal) : DEFAULT_GOAL;
    state.goalReached = false;
    readSession(detail && detail.session && detail.session.data);
    renderGoal();
    renderLatest(false);
  }

  function onSessionUpdate(detail) {
    readSession(detail && detail.session);
    renderGoal();
    renderLatest(false);
  }

  function onEventReceived(detail) {
    if (!detail || !detail.event) return;
    if (detail.listener === 'follower-latest') {
      state.latestFollower = String(detail.event.name || '');
      renderLatest(true);
      // licznik G2 rośnie przez onSessionUpdate, który SE wysyła po followie
    }
  }

  function showDebug(type, detail) {
    if (!el.debug) return;
    let info = '';
    try {
      if (type === 'onEventReceived') info = detail.listener + ' ' + ((detail.event && detail.event.name) || '');
      else if (type === 'onWidgetLoad') info = 'mode=' + detail.fieldData.mode + ' goal=' + detail.fieldData.followGoal;
      else if (type === 'onSessionUpdate') info = 'followers=' + detail.session['follower-total'].count;
    } catch (e) {
      info = '(brak pól)';
    }
    el.debug.textContent = new Date().toLocaleTimeString() + ' ' + type + ' ' + info;
  }

  function handle(type, detail) {
    showDebug(type, detail);
    if (type === 'onWidgetLoad') onWidgetLoad(detail);
    else if (type === 'onSessionUpdate') onSessionUpdate(detail);
    else if (type === 'onEventReceived') onEventReceived(detail);
  }

  build();
  setMode('gra');
  renderGoal();
  renderLatest(false);

  window.EjOverlay = { handle };

  // Zdarzenia, które przyszły, zanim skrypt się wczytał (bufor z loadera)
  const queued = window.EjOverlayQueue || [];
  window.EjOverlayQueue = null;
  queued.forEach(([type, detail]) => handle(type, detail));
})();
