// EjDawid overlay – cała logika. Spec: docs/spec-overlay.md
// Loader (se/loader.html) przekazuje tu zdarzenia SE przez window.EjOverlay.handle(type, detail).
(() => {
  'use strict';

  const MODES = ['gra', 'start', 'przerwa', 'koniec'];
  const DEFAULT_GOAL = 100;
  const NO_FOLLOWER = 'jeszcze nikt';
  const EXIT_MS = 700; // czas animacji wyjścia (odwrócona pieczątka), jak w overlay.css
  const CHAT_MAX = 30; // E3: tyle ostatnich wiadomości w DOM (spec 6)
  // E2: napisy na taśmie według trybu; koniec: jeden duży napis
  const TAPE_TEXT = { start: 'ZARAZ ZACZYNAMY', przerwa: 'ZARAZ WRACAMY', koniec: 'DZIĘKI ZA DZIŚ' };
  const SVG_NS = 'http://www.w3.org/2000/svg';

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
    queue: [], // kolejka alertów G5/G6
    busy: false,
    testBitsBig: false, // przycisk testBits na zmianę: mało / dużo
  };

  const el = {};

  // ---------- Pomocnicy ----------

  // Element z klasą i opcjonalnym tekstem (zawsze textContent)
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svg(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    return node;
  }

  // Polska odmiana: 1 sub, 2 suby, 5 subów
  function plural(n, one, few, many) {
    if (n === 1) return one;
    const d = n % 10;
    const t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  }

  function num(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  // Liczba z pola widgetu albo domyślna
  function field(name, fallback) {
    return num(state.fields[name], fallback);
  }

  // Długi tekst: zmniejsza czcionkę do minSize; jeśli dalej się nie mieści
  // i wrap = true, zawija do 2 linii (klasa .is-wrap). Element musi być już w DOM.
  function fitText(node, maxSize, minSize, wrap) {
    node.classList.remove('is-wrap');
    let size = maxSize;
    node.style.fontSize = size + 'px';
    while (node.scrollWidth > node.clientWidth && size > minSize) {
      size -= 1;
      node.style.fontSize = size + 'px';
    }
    if (wrap && node.scrollWidth > node.clientWidth) node.classList.add('is-wrap');
  }

  // Słowa typu „Cheer100” z wiadomości bitsów
  function stripCheers(text) {
    return text.replace(/(^|\s)[a-z]+\d+(?=\s|$)/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  // ---------- Budowa DOM ----------

  function build() {
    let root = document.getElementById('ej-root');
    if (!root) {
      root = make('div');
      root.id = 'ej-root';
      document.body.appendChild(root);
    }

    // Ekrany start / przerwa / koniec (spec 2: E1–E7); CSS chowa je w trybie gra
    root.appendChild(make('div', 'e-screen e1-scene'));
    const tapeWrap = make('div', 'e-screen e2-tape');
    el.tapeText = make('div', 'e2-text');
    tapeWrap.appendChild(el.tapeText);
    root.appendChild(tapeWrap);
    // E3: ramka + lista w środku; lista obcina stare wiadomości przed ramką
    const chatBox = make('div', 'e-screen e3-chat');
    el.chat = make('div', 'e3-list');
    chatBox.appendChild(el.chat);
    root.appendChild(chatBox);

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

    // G3: ostatni follow (tekst do lewej, jak G2)
    el.g3 = make('div', 'ej-bar g3-follow');
    const g3Inner = make('div', 'ej-bar-inner');
    el.g3Nick = make('span', 'g3-nick');
    g3Inner.append(make('span', 'g3-label', 'Ostatni follow:'), el.g3Nick);
    el.g3.appendChild(g3Inner);

    column.append(el.g2, el.g3);
    root.appendChild(column);

    // Miejsca na alerty: G5 przy kamerce, G6 obok kolumny (na ekranach: prześwit nieba)
    el.g5Slot = make('div', 'ej-slot g5-slot');
    el.g6Slot = make('div', 'ej-slot g6-slot');
    root.append(el.g5Slot, el.g6Slot);

    if (debug) {
      el.debug = make('div', 'ej-debug', 'debug: czekam na zdarzenia');
      root.appendChild(el.debug);
    }
  }

  // Kłosek po boku naszywki (łodyga + listki)
  function wheat(x, mirror) {
    const g = svg('g', { class: 'g5-wheat', transform: 'translate(' + x + ' 64)' + (mirror ? ' scale(-1 1)' : '') });
    g.appendChild(svg('path', { d: 'M0 50 Q -6 25 2 0', fill: 'none' }));
    [8, 18, 28, 38].forEach((y, i) => {
      const side = i % 2 ? 1 : -1;
      g.appendChild(svg('ellipse', {
        cx: side * 4, cy: y, rx: 2.4, ry: 5.5,
        transform: 'rotate(' + side * 30 + ' ' + side * 4 + ' ' + y + ')',
      }));
    });
    return g;
  }

  // G5: naszywka-tarcza 200×175 (SVG) + tekst
  function buildBadge(headline, nick) {
    const badge = make('div', 'g5-badge');
    const shape = svg('svg', { class: 'g5-shape', viewBox: '0 0 200 175', width: 200, height: 175 });
    const d = 'M12 30 Q100 2 188 30 L186 96 Q182 140 100 171 Q18 140 14 96 Z';
    shape.appendChild(svg('path', { class: 'g5-rim', d: d }));
    const scale = (k) => 'translate(100 92) scale(' + k + ') translate(-100 -92)';
    shape.appendChild(svg('path', { class: 'g5-field', d: d, transform: scale(0.87) }));
    shape.appendChild(svg('path', { class: 'g5-stitch', d: d, transform: scale(0.79) }));
    shape.append(wheat(27, false), wheat(173, true));

    const text = make('div', 'g5-text');
    text.append(make('div', 'g5-headline', headline), make('div', 'g5-nick', nick));
    badge.append(shape, text);
    return badge;
  }

  // G6: karta zdarzenia 440×190 (różowa kartka z tyłu, papier z podartymi rogami, panel)
  function buildCard(headline, line, message) {
    const card = make('div', 'g6-card');
    const paper = make('div', 'g6-paper');
    const panel = make('div', 'g6-panel');
    panel.append(make('div', 'g6-headline', headline), make('div', 'g6-line', line));
    if (message) panel.appendChild(make('div', 'g6-message', message));
    paper.appendChild(panel);
    card.append(make('div', 'g6-back'), paper);
    return card;
  }

  // ---------- Tryb i paski ----------

  // Tryb ekranu -> klasa na <body>
  function setMode(mode) {
    state.mode = MODES.includes(mode) ? mode : 'gra';
    MODES.forEach((m) => document.body.classList.remove('mode-' + m));
    document.body.classList.add('mode-' + state.mode);
    renderTape();
  }

  // E2: start/przerwa – napis powtarzany z gwiazdką; koniec – jeden duży napis
  function renderTape() {
    const text = TAPE_TEXT[state.mode];
    if (!text) {
      el.tapeText.textContent = '';
      return;
    }
    el.tapeText.textContent = state.mode === 'koniec' ? text : Array(4).fill(text).join(' ★ ') + ' ★';
  }

  // ---------- E3: czat ----------

  // Bezpieczny adres obrazka emotki (tylko https)
  function emoteUrl(emote) {
    const urls = (emote && emote.urls) || {};
    const url = urls['2'] || urls['1'] || urls['4'] || '';
    return /^https:\/\//.test(url) ? url : '';
  }

  // Tekst wiadomości -> węzły: słowa będące emotkami jako <img>, reszta jako tekst
  function messageNodes(text, emotes) {
    const byName = {};
    (emotes || []).forEach((e) => {
      const url = emoteUrl(e);
      if (e && e.name && url) byName[e.name] = url;
    });
    const out = [];
    text.split(/(\s+)/).forEach((part) => {
      if (byName[part]) {
        const img = document.createElement('img');
        img.className = 'e3-emote';
        img.src = byName[part];
        img.alt = part;
        out.push(img);
      } else if (part) {
        out.push(document.createTextNode(part));
      }
    });
    return out;
  }

  function onChatMessage(data) {
    if (!data) return;
    const text = String(data.text || '');
    if (!text.trim()) return;
    const msg = make('div', 'e3-msg');
    msg.dataset.msgid = String(data.msgId || '');
    msg.dataset.userid = String(data.userId || '');
    msg.appendChild(make('span', 'e3-name', String(data.displayName || data.nick || '') + ': '));
    messageNodes(text, data.emotes).forEach((n) => msg.appendChild(n));
    el.chat.appendChild(msg);
    while (el.chat.children.length > CHAT_MAX) el.chat.firstChild.remove();
  }

  // Usuwanie przez moderację: jedna wiadomość albo wszystkie od widza
  function removeChat(attr, value) {
    if (!value) return;
    Array.from(el.chat.children).forEach((m) => {
      if (m.dataset[attr] === String(value)) m.remove();
    });
  }

  // G2: „Cel followów: 32/50” + „64%” po prawej, albo „Cel osiągnięty ★”
  function renderGoal() {
    if (state.followers >= state.goal) state.goalReached = true;

    if (state.goalReached) {
      el.g2Text.textContent = 'Cel osiągnięty ★';
      el.g2Percent.textContent = '';
      setProgress(100);
      return;
    }
    const percent = Math.min(100, Math.floor((state.followers / state.goal) * 100));
    el.g2Text.textContent = 'Cel followów: ' + state.followers + '/' + state.goal;
    el.g2Percent.textContent = percent + '%';
    setProgress(percent);
  }

  // Wypełnienie G2; przy 0% bez kreski na krawędzi
  function setProgress(percent) {
    el.g2Progress.style.width = percent + '%';
    el.g2Progress.classList.toggle('is-empty', percent === 0);
  }

  // G3: nick ostatniego followa; długi nick zmniejsza czcionkę całego paska (22 -> 14 px)
  function renderLatest() {
    el.g3Nick.textContent = state.latestFollower || NO_FOLLOWER;
    const inner = el.g3Nick.parentNode;
    let size = 22;
    inner.style.fontSize = size + 'px';
    while (el.g3Nick.scrollWidth > el.g3Nick.clientWidth && size > 14) {
      size -= 1;
      inner.style.fontSize = size + 'px';
    }
  }

  // Błysk morelowy G3
  function flashLatest() {
    el.g3.classList.remove('is-flash');
    void el.g3.offsetWidth; // restart animacji
    el.g3.classList.add('is-flash');
  }

  // ---------- Kolejka alertów (G5, G6) ----------
  // alert = { kind: 'badge'|'card', node, seconds, sound, onShow }

  function enqueue(alert) {
    state.queue.push(alert);
    if (!state.busy) next();
  }

  function next() {
    const alert = state.queue.shift();
    if (!alert) {
      state.busy = false;
      return;
    }
    state.busy = true;
    const slot = alert.kind === 'badge' ? el.g5Slot : el.g6Slot;
    // warstwy: .ej-alert (pojemnik) > node (animacje pieczątki)
    const holder = make('div', 'ej-alert');
    holder.appendChild(alert.node);
    alert.node.classList.add('is-in');
    slot.appendChild(holder);
    // długie nicki: mniejsza czcionka, w ostateczności 2 linie
    alert.node.querySelectorAll('.g5-nick').forEach((n) => fitText(n, 22, 15, true));
    alert.node.querySelectorAll('.g6-line').forEach((n) => fitText(n, 24, 17, true));
    playSound(alert.sound);
    if (alert.onShow) alert.onShow();

    setTimeout(() => {
      alert.node.classList.remove('is-in');
      alert.node.classList.add('is-out');
      setTimeout(() => {
        holder.remove();
        next();
      }, EXIT_MS);
    }, alert.seconds * 1000);
  }

  // Dźwięk z pola sound-input SE; puste pole = cisza
  function playSound(url) {
    if (!url || typeof url !== 'string') return;
    try {
      const audio = new Audio(url);
      audio.play().catch(() => {});
    } catch (e) {
      // brak dźwięku nie może zatrzymać alertu
    }
  }

  function badgeAlert(headline, nick, onShow) {
    enqueue({
      kind: 'badge',
      node: buildBadge(headline, nick),
      seconds: field('badgeSeconds', 4),
      sound: state.fields.soundFollow,
      onShow: onShow,
    });
  }

  function cardAlert(headline, line, message) {
    enqueue({
      kind: 'card',
      node: buildCard(headline, line, message),
      seconds: field('cardSeconds', 7),
      sound: state.fields.soundCard,
    });
  }

  // ---------- Zdarzenia ----------

  function onFollow(ev) {
    const name = String(ev.name || '');
    if (!ev.isTest) {
      state.latestFollower = name;
      renderLatest();
    }
    badgeAlert('NOWY FOLLOW!', name, flashLatest);
  }

  function onCheer(ev) {
    const name = String(ev.name || '');
    const amount = Math.floor(num(ev.amount, 0));
    if (amount < field('bitsThreshold', 100)) {
      badgeAlert(amount + ' ' + plural(amount, 'BITS', 'BITSY', 'BITSÓW'), name);
      return;
    }
    const message = stripCheers(String(ev.message || ''));
    cardAlert('DZIĘKI ZA BITSY!', name + ' · ' + amount + ' ' + plural(amount, 'bits', 'bitsy', 'bitsów'), message);
  }

  function onSub(ev) {
    if (ev.isCommunityGift) return; // pojedyncze suby z paczki: bez kart (spec 6)
    const name = String(ev.name || '');
    const sender = String(ev.sender || name);
    const amount = Math.floor(num(ev.amount, 1));
    if (ev.bulkGifted) {
      cardAlert(amount + ' ' + plural(amount, 'SUB', 'SUBY', 'SUBÓW') + ' DLA CZATU!', 'od ' + sender);
    } else if (ev.gifted) {
      cardAlert('SUB W PREZENCIE!', 'od ' + sender + ' dla ' + name);
    } else if (amount > 1) {
      cardAlert('DZIĘKI ZA SUB!', name + ' · ' + amount + '. miesiąc', String(ev.message || ''));
    } else {
      cardAlert('DZIĘKI ZA SUB!', name, String(ev.message || ''));
    }
  }

  function onRaid(ev) {
    const amount = Math.floor(num(ev.amount, 0));
    cardAlert('DZIĘKI ZA RAID!', String(ev.name || '') + ' · ' + amount + ' ' + plural(amount, 'widz', 'widzów', 'widzów'));
  }

  // W2: przyciski testowe w polach widgetu -> sztuczne zdarzenia
  function onTestButton(fieldName) {
    const t = { isTest: true };
    const fake = (listener, ev) => onEventReceived({ listener: listener, event: Object.assign({}, t, ev) });
    if (fieldName === 'testFollow') fake('follower-latest', { name: 'test_widz' });
    else if (fieldName === 'testSub') fake('subscriber-latest', { name: 'test_widz', amount: 5, message: 'Testowa wiadomość suba' });
    else if (fieldName === 'testGift') fake('subscriber-latest', { name: 'test_widz', sender: 'test_widz', amount: 5, gifted: true, bulkGifted: true });
    else if (fieldName === 'testRaid') fake('raid-latest', { name: 'test_widz', amount: 12 });
    else if (fieldName === 'testChat') {
      fake('message', { data: {
        displayName: 'test_widz',
        text: 'Hej, testowa wiadomość z emotką Kappa',
        emotes: [{ name: 'Kappa', urls: { 2: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0' } }],
        msgId: 'test-' + Date.now(),
        userId: 'test',
      } });
    }
    else if (fieldName === 'testBits') {
      // na zmianę: poniżej progu (G5) i od progu (G6)
      state.testBitsBig = !state.testBitsBig;
      const threshold = field('bitsThreshold', 100);
      fake('cheer-latest', { name: 'test_widz', amount: state.testBitsBig ? threshold * 5 : Math.max(1, Math.floor(threshold / 2)), message: 'Testowe bitsy' });
    }
  }

  function onEventReceived(detail) {
    if (!detail || !detail.event) return;
    const ev = detail.event;
    // Przycisk pola: SE podaje 'widget-button' w detail.listener albo w detail.event.listener
    if (detail.listener === 'widget-button' || ev.listener === 'widget-button') {
      onTestButton(ev.field);
      return;
    }
    switch (detail.listener) {
      case 'follower-latest': onFollow(ev); break;
      case 'cheer-latest': onCheer(ev); break;
      case 'subscriber-latest': onSub(ev); break;
      case 'raid-latest': onRaid(ev); break;
      case 'message': onChatMessage(ev.data); break;
      case 'delete-message': removeChat('msgid', ev.msgId || (ev.data && ev.data.msgId)); break;
      case 'delete-messages': removeChat('userid', ev.userId || (ev.data && ev.data.userId)); break;
      default: break;
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
    state.goal = Math.floor(field('followGoal', DEFAULT_GOAL));
    state.goalReached = false;
    readSession(detail && detail.session && detail.session.data);
    renderGoal();
    renderLatest();
  }

  function onSessionUpdate(detail) {
    readSession(detail && detail.session);
    renderGoal();
    renderLatest();
  }

  function showDebug(type, detail) {
    if (!el.debug) return;
    let info = '';
    try {
      if (type === 'onEventReceived') info = detail.listener + ' ' + JSON.stringify(detail.event).slice(0, 200);
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
  renderLatest();

  // po wczytaniu fontów przelicz dopasowanie G3
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderLatest);

  window.EjOverlay = { handle };

  // Zdarzenia, które przyszły, zanim skrypt się wczytał (bufor z loadera)
  const queued = window.EjOverlayQueue || [];
  window.EjOverlayQueue = null;
  queued.forEach(([type, detail]) => handle(type, detail));
})();
