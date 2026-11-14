// EjDawid overlay – cała logika. Spec: docs/spec-overlay.md
// Loader (se/loader.html) przekazuje tu zdarzenia SE przez window.EjOverlay.handle(type, detail).
(() => {
  'use strict';

  const MODES = ['gra', 'start', 'przerwa', 'koniec'];
  const MODE_LABELS = { gra: 'gra', start: 'start', przerwa: 'przerwa', koniec: 'koniec' };

  // ?debug=1 w adresie skryptu włącza napis z ostatnim zdarzeniem
  const scriptSrc = (document.currentScript && document.currentScript.src) || '';
  const debug = /[?&]debug=1\b/.test(scriptSrc);

  const state = {
    fields: {},
    mode: 'gra',
  };

  let root = null;
  let modeLabel = null;
  let debugBox = null;

  // Budowa DOM (tylko createElement/textContent)
  function build() {
    root = document.getElementById('ej-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'ej-root';
      document.body.appendChild(root);
    }

    const hello = document.createElement('div');
    hello.className = 'ej-hello';
    hello.append('overlay działa · tryb: ');
    modeLabel = document.createElement('span');
    modeLabel.className = 'ej-hello-mode';
    hello.appendChild(modeLabel);
    root.appendChild(hello);

    if (debug) {
      debugBox = document.createElement('div');
      debugBox.className = 'ej-debug';
      debugBox.textContent = 'debug: czekam na zdarzenia';
      root.appendChild(debugBox);
    }
  }

  // Tryb ekranu -> klasa na <body>
  function setMode(mode) {
    state.mode = MODES.includes(mode) ? mode : 'gra';
    MODES.forEach((m) => document.body.classList.remove('mode-' + m));
    document.body.classList.add('mode-' + state.mode);
    modeLabel.textContent = MODE_LABELS[state.mode];
  }

  function showDebug(type, detail) {
    if (!debugBox) return;
    let info = '';
    try {
      if (type === 'onEventReceived') info = (detail && detail.listener) || '';
      else if (type === 'onWidgetLoad') info = 'mode=' + ((detail && detail.fieldData && detail.fieldData.mode) || '?');
    } catch (e) {
      info = '(błąd odczytu)';
    }
    debugBox.textContent = new Date().toLocaleTimeString() + ' ' + type + ' ' + info;
  }

  function handle(type, detail) {
    showDebug(type, detail);
    if (type === 'onWidgetLoad') {
      state.fields = (detail && detail.fieldData) || {};
      setMode(state.fields.mode);
    }
    // onEventReceived, onSessionUpdate: od kawałka 2
  }

  build();
  setMode('gra');

  window.EjOverlay = { handle };

  // Zdarzenia, które przyszły, zanim skrypt się wczytał (bufor z loadera)
  const queued = window.EjOverlayQueue || [];
  window.EjOverlayQueue = null;
  queued.forEach(([type, detail]) => handle(type, detail));
})();
