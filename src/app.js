const PREFECTURES = window.PREFECTURE_DATA;

const app = document.querySelector('#app');
const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

const state = {
  screen: 'home', round: [], roundIndex: 0, current: null, replay: false,
  quickQuiz: false,
  newlyUnlocked: new Set(), rewardRevealIndex: 0,
  writeMode: 'hiragana', strokes: [], trace: true, mapZoomed: false,
  reviewIndex: 0, reviewPhase: 'location', reviewHints: {}, reviewResults: {}, inkPreview: '',
  reviewLocationAttempts: {}, reviewLocationWrong: {}, reviewLocationResolved: false,
  collectionPage: 0, collectionResetPending: false,
  locationWrong: new Set(), locationResolved: false, locationHitTest: null,
  unlocked: new Set(storage.get('47quest-unlocked', [])),
  sound: storage.get('47quest-sound', true),
  bgmVolume: Math.max(0, Math.min(100, Number(storage.get('47quest-bgm-volume', 85)) || 0)),
  seVolume: Math.max(0, Math.min(100, Number(storage.get('47quest-se-volume', 85)) || 0)),
  cleanup: [], gameFinished: false, currentRun: null,
};

const shuffle = (values) => values
  .map((value) => ({ value, order: Math.random() }))
  .sort((a, b) => a.order - b.order)
  .map(({ value }) => value);

function drawPrefectureRound(deckKey) {
  const result = window.QUEST_PREFECTURE_DECK.draw(
    PREFECTURES.map((pref) => pref.code),
    storage.get(deckKey, []),
    3,
  );
  storage.set(deckKey, result.deck);
  return result.selected.map((code) => PREFECTURES.find((pref) => pref.code === code));
}

function todayKey() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function dailyProgress() {
  const saved = storage.get('47quest-daily-play', {});
  return saved.date === todayKey() ? saved : { date: todayKey(), clears: 0 };
}

function gameRecords() {
  const saved = storage.get('47quest-game-records', {});
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}

function buildRunMeta(pref) {
  const previous = gameRecords()[pref.code] || {};
  const challenges = [
    { id: 'combo', icon: '🔥', label: '3コンボを きめよう' },
    { id: 'clean', icon: '👑', label: 'まちがえずに クリア' },
    { id: 'speed', icon: '⚡', label: '15秒以上 のこそう' },
  ];
  return {
    play: (previous.plays || 0) + 1,
    bestStars: previous.stars || 0,
    challenge: challenges[Math.floor(Math.random() * challenges.length)],
  };
}

const saveProgress = () => storage.set('47quest-unlocked', [...state.unlocked]);
const cleanups = () => {
  state.cleanup.forEach((cleanup) => cleanup());
  state.cleanup = [];
};

function mapDisplayBox(width, height) {
  const safeHeight = Math.max(1, height);
  const mapAspect = 8 / 5;
  const surfaceAspect = width / safeHeight;
  const drawWidth = surfaceAspect > mapAspect ? safeHeight * mapAspect : width;
  const drawHeight = surfaceAspect > mapAspect ? safeHeight : width / mapAspect;
  return { width: drawWidth, height: drawHeight, left: (width - drawWidth) / 2, top: (safeHeight - drawHeight) / 2 };
}

function initMapZoom(surface, content, options = {}) {
  if (!surface || !content) return null;
  let scale = 1; let x = 0; let y = 0; let dragged = false;
  const pointers = new Map();
  const clamp = () => {
    const width = surface.clientWidth; const height = surface.clientHeight;
    x = Math.min(0, Math.max(width - width * scale, x));
    y = Math.min(0, Math.max(height - height * scale, y));
  };
  const apply = () => {
    clamp();
    content.style.transformOrigin = '0 0';
    content.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    surface.classList.toggle('is-map-zoomed', scale > 1.01);
  };
  const zoomAt = (clientX, clientY, requestedScale) => {
    const rect = surface.getBoundingClientRect();
    const localX = clientX - rect.left; const localY = clientY - rect.top;
    const mapX = (localX - x) / scale; const mapY = (localY - y) / scale;
    const nextScale = Math.max(1, Math.min(4, requestedScale));
    x = localX - mapX * nextScale; y = localY - mapY * nextScale; scale = nextScale;
    apply();
  };
  const reset = () => { scale = 1; x = 0; y = 0; apply(); };
  const centerOn = (point, requestedScale = 2) => {
    const width = surface.clientWidth; const height = surface.clientHeight;
    const box = mapDisplayBox(width, height);
    const focusX = box.left + box.width * point.x / 100;
    const focusY = box.top + box.height * point.y / 100;
    scale = Math.max(1, Math.min(4, requestedScale));
    x = width / 2 - focusX * scale; y = height / 2 - focusY * scale;
    apply();
  };
  const onWheel = (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, scale * Math.exp(-event.deltaY * .0022));
  };
  const onPointerDown = (event) => {
    if (event.target.closest('button, a')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    surface.setPointerCapture?.(event.pointerId); dragged = false;
  };
  const onPointerMove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    const before = [...pointers.values()];
    const previous = pointers.get(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.values()];
    if (after.length >= 2) {
      const oldDistance = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y) || 1;
      const newDistance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y) || 1;
      const oldMid = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 };
      const newMid = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 };
      const mapX = (oldMid.x - surface.getBoundingClientRect().left - x) / scale;
      const mapY = (oldMid.y - surface.getBoundingClientRect().top - y) / scale;
      scale = Math.max(1, Math.min(4, scale * newDistance / oldDistance));
      x = newMid.x - surface.getBoundingClientRect().left - mapX * scale;
      y = newMid.y - surface.getBoundingClientRect().top - mapY * scale;
      dragged = true; apply(); return;
    }
    if (scale > 1.01 && event.buttons !== 0) {
      x += event.clientX - previous.x; y += event.clientY - previous.y;
      if (Math.hypot(event.clientX - previous.x, event.clientY - previous.y) > 2) dragged = true;
      apply();
    }
  };
  const onPointerEnd = (event) => { pointers.delete(event.pointerId); };
  surface.addEventListener('wheel', onWheel, { passive: false });
  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', onPointerEnd);
  surface.addEventListener('pointercancel', onPointerEnd);
  surface.dataset.mapPannable = 'true';
  const controller = {
    reset,
    toggle: () => {
      if (scale > 1.01) return reset();
      if (options.focus) return centerOn(options.focus, options.buttonScale || 2);
      const rect = surface.getBoundingClientRect();
      return zoomAt(rect.left + surface.clientWidth / 2, rect.top + surface.clientHeight / 2, 2);
    },
    getState: () => ({ scale, x, y }),
    consumeDrag: () => { const value = dragged; dragged = false; return value; },
  };
  surface._mapZoom = controller;
  state.cleanup.push(() => {
    surface.removeEventListener('wheel', onWheel);
    surface.removeEventListener('pointerdown', onPointerDown);
    surface.removeEventListener('pointermove', onPointerMove);
    surface.removeEventListener('pointerup', onPointerEnd);
    surface.removeEventListener('pointercancel', onPointerEnd);
  });
  return controller;
}

function mapEventCoordinates(surface, event) {
  const rect = surface.getBoundingClientRect();
  const zoom = surface._mapZoom?.getState() || { scale: 1, x: 0, y: 0 };
  const box = mapDisplayBox(rect.width, rect.height);
  const unzoomedX = (event.clientX - rect.left - zoom.x) / zoom.scale;
  const unzoomedY = (event.clientY - rect.top - zoom.y) / zoom.scale;
  return {
    x: Math.max(0, Math.min(100, (unzoomedX - box.left) / box.width * 100)),
    y: Math.max(0, Math.min(100, (unzoomedY - box.top) / box.height * 100)),
  };
}

let audioContext;
let musicTimer = 0;
let musicStep = 0;
let musicNextAt = 0;
let requestedMusic = { scene: 'home', variant: '' };
const ADVENTURE_MOTIF = [0, 4, 7, 9, 7, 4, 2, 7];
const MUSIC_SCENES = {
  home:       { bpm: 92,  root: 55, wave: 'triangle', gain: .018, notes: [0, 4, 7, 9, 7, 4, 2, 7] },
  map:        { bpm: 104, root: 55, wave: 'sine',     gain: .016, notes: [0, 7, 4, 9, 7, 2, 4, 7] },
  writing:    { bpm: 72,  root: 48, wave: 'sine',     gain: .012, notes: [0, 4, 7, 4, 2, 4, 9, 7] },
  game:       { bpm: 132, root: 60, wave: 'square',   gain: .012, notes: [0, 4, 7, 4, 9, 7, 4, 2] },
  location:   { bpm: 108, root: 53, wave: 'triangle', gain: .015, notes: [0, 2, 4, 7, 9, 7, 4, 2] },
  review:     { bpm: 84,  root: 50, wave: 'sine',     gain: .014, notes: [0, 4, 2, 7, 4, 9, 7, 4] },
  reward:     { bpm: 116, root: 60, wave: 'triangle', gain: .02,  notes: [0, 4, 7, 12, 9, 7, 11, 12] },
  collection: { bpm: 96,  root: 55, wave: 'sine',     gain: .015, notes: [0, 7, 9, 7, 4, 2, 4, 7] },
  detail:     { bpm: 100, root: 57, wave: 'triangle', gain: .015, notes: ADVENTURE_MOTIF },
};

let audioChannels;
function updateAudioVolume() {
  if (!audioChannels) return;
  for (const [name, value] of [['bgm', state.bgmVolume], ['se', state.seVolume]]) {
    const gain = audioChannels[name].gain;
    gain.cancelScheduledValues(audioContext.currentTime);
    gain.setTargetAtTime(state.sound ? (value / 100) ** 2 : 0, audioContext.currentTime, .015);
  }
}
function ensureAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (!audioChannels) {
    audioChannels = { bgm: audioContext.createGain(), se: audioContext.createGain() };
    audioChannels.bgm.connect(audioContext.destination);
    audioChannels.se.connect(audioContext.destination);
    updateAudioVolume();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(frequency, duration, wave = 'sine', volume = .035, at = null, channel = 'se') {
  if (!state.sound) return;
  const context = ensureAudio();
  const startAt = at ?? context.currentTime;
  // BGMは連続音ではなく短い発音を重ねるため、線形値のままだと聴感上かなり小さい。
  // 0は完全消音のまま、中～最大域をしっかり持ち上げる音量カーブにする。
  const finalVolume = Math.max(.0001, volume * (channel === 'bgm' ? 1.6 : .8));
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(finalVolume, startAt + Math.min(.018, duration / 3));
  gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
  oscillator.connect(gain).connect(audioChannels[channel]);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + .02);
}

function midi(note) { return 440 * (2 ** ((note - 69) / 12)); }

function stopBgm() {
  clearInterval(musicTimer);
  musicTimer = 0;
}

function startBgm(scene = state.screen, variant = state.current?.code || '') {
  requestedMusic = { scene, variant };
  stopBgm();
  if (!state.sound || !audioContext) return;
  const musicScene = scene.startsWith('review') ? 'review' : scene.startsWith('location') ? 'location' : scene.startsWith('reward') ? 'reward' : scene;
  const profile = MUSIC_SCENES[musicScene] || MUSIC_SCENES.home;
  const mode = window.QUEST_MICROGAMES?.catalog?.[variant]?.mode || '';
  const variantShift = scene === 'game' ? (Number.parseInt(variant, 10) % 5) - 2 : 0;
  const modeShift = ['rhythm', 'sequence', 'reaction'].includes(mode) ? 12 : 0;
  const stepLength = 60 / profile.bpm / 2;
  musicStep = 0;
  musicNextAt = audioContext.currentTime + .04;
  const schedule = () => {
    if (!state.sound || !audioContext) return;
    while (musicNextAt < audioContext.currentTime + .28) {
      const note = profile.root + profile.notes[musicStep % profile.notes.length] + variantShift + modeShift;
      const strong = musicStep % 4 === 0;
      tone(midi(note), stepLength * .72, profile.wave, profile.gain * (strong ? 1.25 : 1), musicNextAt, 'bgm');
      if (strong) tone(midi(profile.root - 12 + variantShift), stepLength * 1.5, 'sine', profile.gain * .58, musicNextAt, 'bgm');
      musicStep += 1;
      musicNextAt += stepLength;
    }
  };
  schedule();
  musicTimer = window.setInterval(schedule, 80);
}

function sound(kind = 'tap') {
  if (!state.sound) return;
  try {
    const context = ensureAudio();
    const now = context.currentTime;
    const patterns = {
      tap:   [[520, .045, 'sine', .028, 0]],
      draw:  [[760, .025, 'sine', .018, 0]],
      pop:   [[620, .07, 'sine', .035, 0], [880, .06, 'triangle', .018, .025]],
      good:  [[660, .10, 'triangle', .042, 0], [880, .13, 'sine', .028, .055]],
      combo: [[660, .08, 'triangle', .045, 0], [880, .10, 'triangle', .04, .045], [1100, .14, 'sine', .038, .09]],
      bonus: [[784, .08, 'sine', .045, 0], [988, .11, 'triangle', .04, .06], [1319, .18, 'sine', .04, .12]],
      reveal:[[147, .42, 'sawtooth', .018, 0], [294, .5, 'sine', .025, .12]],
      stamp: [[523, .08, 'square', .035, 0], [1047, .22, 'triangle', .045, .05]],
      wrong: [[210, .09, 'square', .025, 0], [165, .11, 'triangle', .022, .06]],
      win:   [[660, .14, 'triangle', .04, 0], [880, .18, 'triangle', .04, .09], [1047, .28, 'sine', .045, .19]],
    };
    (patterns[kind] || patterns.tap).forEach(([hz, duration, wave, volume, delay]) => tone(hz, duration, wave, volume, now + delay));
  } catch { /* sound is an enhancement */ }
}

function button(label, action, className = 'primary-button', extra = '') {
  return `<button class="${className}" data-action="${action}" ${extra}>${label}</button>`;
}

function mascot(pref, className = 'pref-mascot') {
  return `<div class="${className} pref-mascot-art" role="img" aria-label="${pref.character}"><img src="./assets/characters/${pref.code}.png" alt="" draggable="false" /></div>`;
}

function characterCry(pref) {
  if (!state.sound || state.seVolume <= 0) return;
  try { window.QUEST_CHARACTER_CRIES.play(ensureAudio(), pref.code, .55, audioChannels.se); } catch { /* Audio may be unavailable. */ }
}

function characterStats(pref, className = '') {
  return `<div class="character-stats ${className}" aria-label="キャラクターの遊び用ステータス">
    ${[['げんき',pref.stats.genki],['すばやさ',pref.stats.speed],['ひらめき',pref.stats.idea]].map(([label,value], index) => `<div style="--stat-delay:${index * 150}ms"><span>${label}</span><i><b style="--stat:${value}%"></b></i><strong data-stat-value="${value}">0</strong></div>`).join('')}
    <p class="stat-rarity">レア度 <span aria-label="星${pref.stats.rarity}つ">${'★'.repeat(pref.stats.rarity)}${'☆'.repeat(5-pref.stats.rarity)}</span></p>
    <small>※ キャラクターの遊び用データ</small>
  </div>`;
}

function animateCharacterStats(root = document) {
  const values = root.querySelectorAll?.('[data-stat-value]') || [];
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  values.forEach((element) => {
    const target = Number(element.dataset.statValue) || 0;
    if (reduce) { element.textContent = target; return; }
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / 900);
      const eased = 1 - ((1 - progress) ** 3);
      element.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function compactCharacterStats(pref) {
  return `<span class="collection-statline" aria-label="げんき${pref.stats.genki}、すばやさ${pref.stats.speed}、ひらめき${pref.stats.idea}">
    ${[['げんき',pref.stats.genki],['はやさ',pref.stats.speed],['ひらめき',pref.stats.idea]].map(([label,value], index) => `<span style="--mini-delay:${index * 100}ms"><b>${label}</b>${value}<i><em style="--stat:${value}%"></em></i></span>`).join('')}
    <strong aria-label="レア度 星${pref.stats.rarity}つ">${'★'.repeat(pref.stats.rarity)}</strong>
  </span>`;
}

function mapLayers(pref, alt) {
  return `<div class="map-layers"><img class="map-image map-base" src="./assets/images/japan-map-play.png" alt="${alt}" /><img class="map-image map-overlay" src="${pref.overlay}" alt="" aria-hidden="true" /><a class="map-source-link" href="https://frame-illust.com/?p=10006" target="_blank" rel="noopener" aria-label="地図素材の出典を開く">出典</a></div>`;
}

function shell(content, { progress = 0, label = 'にほん発見アドベンチャー', home = false } = {}) {
  queueMicrotask(() => startBgm(state.screen, state.current?.code || ''));
  return `
    <section class="app-screen ${home ? 'is-title-screen' : ''}">
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="ホームへ戻る">
          <span class="brand-mark">47Q</span><span class="brand-name">47Quest</span>
        </button>
        <div class="top-title">${label}</div>
        <div class="top-actions">
          ${!home ? '<button class="icon-button" data-action="collection" aria-label="図鑑を見る">ずかん</button>' : ''}
          <button class="icon-button sound-menu-button" data-action="audio-panel" aria-label="音量を調整する" aria-expanded="false">${state.sound ? '🔊' : '音×'}</button>
          <section class="audio-panel" hidden aria-label="音量設定">
            <header><strong>おとの大きさ</strong><button type="button" data-action="audio-panel" aria-label="音量設定を閉じる">×</button></header>
            <label><span>BGM <output data-volume-output="bgm">${state.bgmVolume}</output></span><input type="range" min="0" max="100" step="1" value="${state.bgmVolume}" data-volume="bgm" aria-label="BGM音量"></label>
            <label><span>こうか音 <output data-volume-output="se">${state.seVolume}</output></span><input type="range" min="0" max="100" step="1" value="${state.seVolume}" data-volume="se" aria-label="効果音音量"></label>
            <button type="button" class="audio-master-button" data-action="sound">${state.sound ? 'すべての音を消す' : '音を出す'}</button>
          </section>
        </div>
      </header>
      <div id="game-main" class="viewport">${content}</div>
    </section>`;
}

function renderHome() {
  cleanups();
  state.screen = 'home';
  const count = state.unlocked.size;
  const daily = dailyProgress();
  const openingFriends = ['01','02','10','29','37','47'].map((code) => PREFECTURES.find((pref) => pref.code === code));
  app.innerHTML = shell(`
    <section class="scene home-scene">
      <div class="map-card home-map">
        <img class="map-image" src="./assets/images/japan-map-play.png" alt="47都道府県の日本地図" />
        <a class="map-source-link" href="https://frame-illust.com/?p=10006" target="_blank" rel="noopener" aria-label="地図素材の出典を開く">出典</a>
        <div class="title-clouds" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="home-roamers">
          ${openingFriends.map((pref, index) => `<button type="button" class="home-roamer roamer-${index + 1}" data-action="hero-cheer" data-code="${pref.code}" aria-label="${pref.character}を応援する">${mascot(pref, 'home-roamer-art')}<span>${pref.character}</span></button>`).join('')}
        </div>
      </div>
      <header class="title-stage">
        <p class="title-call">にほん全国・発見アドベンチャー</p>
        <div class="game-logo" aria-label="47Quest"><span>47</span><strong>Quest</strong><i>ご当地なかまを つかまえろ</i></div>
        <p class="title-copy">地図を見つけて、ご当地ゲームへ飛びこもう</p>
        <div class="daily-quest" aria-label="今日の冒険 ${Math.min(3, daily.clears)}回クリア">
          <span>きょうの ぼうけん</span>
          <strong>${Array.from({ length: 3 }, (_, index) => `<i class="${index < daily.clears ? 'is-done' : ''}">${index < daily.clears ? '★' : '☆'}</i>`).join('')}</strong>
          <small>${daily.clears >= 3 ? 'きょうのスタンプ完成' : `あと ${3 - daily.clears}回で スタンプ完成`}</small>
        </div>
        <div class="title-actions">
          ${button('▶ ぼうけん スタート', 'start', 'primary-button sun title-start-button')}
          <div>${button('⚡ いきなりクイズ', 'quick-quiz', 'primary-button quick-quiz-button')}${button(`図鑑 ${count} / 47`, 'collection', 'secondary-button')}${button('🔊 おと', 'audio-panel', 'secondary-button')}</div>
        </div>
        <span class="title-progress">仲間 ${count} / 47</span>
      </header>
    </section>`, { home: true, progress: Math.round(count / 47 * 100), label: '47の仲間をさがそう' });
}

function startRound() {
  sound('good');
  state.round = drawPrefectureRound('47quest-adventure-deck');
  storage.set('47quest-recent', state.round.map((pref) => pref.code));
  state.roundIndex = 0;
  state.current = state.round[0];
  state.replay = false;
  state.quickQuiz = false;
  state.newlyUnlocked = new Set();
  renderMap();
}

function startQuickQuiz() {
  sound('good');
  state.round = drawPrefectureRound('47quest-quick-quiz-deck');
  state.roundIndex = 0;
  state.current = state.round[0];
  state.replay = false;
  state.quickQuiz = true;
  state.newlyUnlocked = new Set();
  state.reviewIndex = 0;
  state.reviewPhase = 'location';
  state.reviewHints = {};
  state.reviewResults = {};
  state.reviewLocationAttempts = {};
  state.reviewLocationWrong = {};
  renderReviewLocation();
}

function progressFor(stage = 0) {
  return Math.min(82, ((state.roundIndex * 5 + stage) / 15) * 82);
}

function renderMap() {
  cleanups();
  state.screen = 'map';
  state.mapZoomed = false;
  const pref = state.current;
  const point = mapPoint(pref);
  app.innerHTML = shell(`
    <section class="scene map-scene">
      <aside class="discovery-brief">
        <p class="discovery-step">ぼうけん ${state.roundIndex + 1} <span>/ 3</span></p>
        <p class="eyebrow">こんどの場所は</p>
        <h1><ruby>${pref.name}<rt>${pref.reading}</rt></ruby></h1>
        <span class="discovery-region">${pref.region}</span>
        <p class="discovery-instruction"><i aria-hidden="true"></i>赤いところを<br>おぼえよう</p>
        <div class="discovery-route" aria-label="場所、文字、ゲームの順で遊ぶ"><b>1 場所</b><span>2 文字</span><span>3 ゲーム</span></div>
      </aside>
      <div class="map-card map-stage map-discovery-stage" data-code="${pref.code}" style="--origin:${point.x}% ${point.y}%;--shift-x:${50 - point.x}%;--shift-y:${50 - point.y}%;--zoom:2.2">
        ${mapLayers(pref, `${pref.name}を赤色で示した日本地図`)}
        <button class="zoom-button" data-action="map-zoom">＋ 近くで見る</button>
      </div>
      <div class="map-learning-tray">
        <p>場所をおぼえたら、つぎは文字を書こう</p>
        ${button('場所を おぼえた →', 'start-writing', 'primary-button sun')}
      </div>
    </section>`, { label: `${state.roundIndex + 1} / 3　${pref.name}の場所を おぼえよう` });
  initMapZoom(document.querySelector('.map-stage'), document.querySelector('.map-stage .map-layers'), { focus: point });
}

function renderWriting(mode = state.writeMode) {
  cleanups();
  state.screen = 'writing';
  state.writeMode = mode;
  state.strokes = [];
  state.trace = true;
  const pref = state.current;
  const isHiragana = mode === 'hiragana';
  const word = isHiragana ? pref.reading : pref.name;
  state.requiredWord = word;
  app.innerHTML = shell(`
    <section class="scene writing-scene">
      <aside class="lesson-panel">
        <p class="eyebrow">${isHiragana ? 'まずは よみかた' : 'つぎは 漢字'}</p>
        <h1 class="title">お手本を見て<br>書いてみよう</h1>
        <div class="sample-word" aria-label="お手本 ${word}"><span class="sample-word-text">${word}</span></div>
        <p class="lesson-tip">大きく、のびのび書こう。</p>
      </aside>
      <div class="writing-board">
        <div class="canvas-shell">
          <div class="trace-word">${word}</div>
          <canvas id="write-canvas" tabindex="0" aria-label="${word}を書く場所"></canvas>
          <span class="canvas-hint">ここに書いてね</span>
          <span class="ink-status" aria-live="polite">線を書いたら「書けた」が押せるよ</span>
          ${button(isHiragana ? '書けた → 漢字へ' : '書けた → ゲームへ', 'writing-next', 'primary-button sun canvas-next-button', 'disabled')}
        </div>
        <div class="writing-tools">
          ${button('↶ 一画もどす', 'undo', 'tool-button')}
          ${button('全部けす', 'clear', 'tool-button')}
          ${button('なぞり OFF', 'trace', 'tool-button')}
        </div>
      </div>
    </section>`, { progress: progressFor(isHiragana ? 2 : 3), label: `${state.roundIndex + 1} / 3　${isHiragana ? 'ひらがな' : '漢字'}` });
  initCanvas();
}

function handwritingRequirement() {
  const strokes = state.strokes.filter((stroke) => stroke.length >= 2);
  const points = strokes.flat();
  if (!points.length) return { ready: false, message: '線を書いたら「書けた」が押せるよ' };
  let pathLength = 0;
  strokes.forEach((stroke) => stroke.slice(1).forEach(([x, y], index) => {
    const [previousX, previousY] = stroke[index];
    pathLength += Math.hypot(x - previousX, y - previousY);
  }));
  if (pathLength < .012) return { ready: false, message: 'もう少しだけ線をのばそう' };
  return { ready: true, message: '書けた！ 次へ進めるよ' };
}

function updateInkReadiness() {
  const result = handwritingRequirement();
  const next = document.querySelector('[data-action="writing-next"], [data-action="review-check"]');
  if (next) next.disabled = !result.ready;
  const status = document.querySelector('.ink-status');
  if (status) { status.textContent = result.message; status.classList.toggle('is-ready', result.ready); }
}

function initCanvas() {
  const canvas = document.querySelector('#write-canvas');
  if (!canvas) return;
  const shellElement = canvas.closest('.canvas-shell');
  let context;
  const redraw = () => {
    const rect = canvas.getBoundingClientRect();
    const trace = shellElement.querySelector('.trace-word');
    if (trace) {
      const letters = Math.max(1, [...trace.textContent.trim()].length);
      trace.style.fontSize = `${Math.min(rect.width * .9 / letters, rect.height * .62)}px`;
    }
    const sample = document.querySelector('.sample-word-text');
    if (sample) sample.style.fontSize = `${Math.min(72, sample.parentElement.clientWidth * .9 / Math.max(1, [...sample.textContent].length))}px`;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#123b53';
    context.lineWidth = Math.max(5, Math.min(13, rect.width / 70));
    state.strokes.forEach((stroke) => {
      if (!stroke.length) return;
      context.beginPath();
      stroke.forEach(([x, y], index) => {
        const px = x * rect.width; const py = y * rect.height;
        if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.stroke();
    });
  };
  const observer = new ResizeObserver(redraw);
  observer.observe(shellElement);
  state.cleanup.push(() => observer.disconnect());
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))];
  };
  let drawing = false;
  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    state.strokes.push([point(event)]);
    document.querySelector('.canvas-hint')?.classList.add('is-hidden');
    sound('draw');
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    state.strokes.at(-1).push(point(event));
    redraw();
    updateInkReadiness();
  });
  const end = (event) => {
    if (!drawing) return;
    if (event?.clientX != null) state.strokes.at(-1).push(point(event));
    drawing = false;
    updateInkReadiness();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  window.addEventListener('pointerup', end);
  state.cleanup.push(() => {
    drawing = false;
    window.removeEventListener('pointerup', end);
  });
  redraw();
  state.canvasRedraw = redraw;
}

const currentMicroGame = () => window.QUEST_MICROGAMES?.catalog[state.current.code]
  || { goal: 3, time: 8, mode: 'course', title: state.current.gameTitle, command: state.current.rule };

function renderGame() {
  cleanups();
  state.screen = 'game';
  state.gameFinished = false;
  const pref = state.current;
  const setup = currentMicroGame();
  state.currentRun = buildRunMeta(pref);
  if (window.QUEST_FEATURED_GAMES?.definitions[pref.code]) {
    state.currentRun.challenge = { id:'score', icon:'★', label:`${setup.goal}点でクリア・${setup.goal*3}点で３つ星！` };
  }
  app.innerHTML = shell(`
    <section class="scene game-scene ${window.QUEST_FEATURED_GAMES?.definitions[pref.code] ? 'featured-scene' : ''}">
      <aside class="game-info">
        <div><p class="eyebrow">${pref.name}・${setup.title}</p><h1 class="micro-command">${setup.command}</h1></div>
        ${button('ゲームはあとで →', 'game-skip', 'game-skip-button')}
      </aside>
      <div class="game-board">
        <div class="run-challenge"><span>${state.currentRun.challenge.icon}</span><strong>${state.currentRun.challenge.label}</strong><small>${state.currentRun.play}回目・ベスト ${'★'.repeat(state.currentRun.bestStars)}${'☆'.repeat(3 - state.currentRun.bestStars)}</small></div>
        <div class="game-hud"><span id="game-score" class="hud-chip">0 / ${setup.goal}</span><span id="game-time" class="hud-chip">${setup.time.toFixed(1)}</span></div>
        <div id="game-field" class="game-field rapid-field rapid-${setup.mode}"></div>
      </div>
    </section>`, { progress: progressFor(4), label: `${state.roundIndex + 1} / 3　ご当地ゲーム` });
  window.QUEST_MICROGAMES?.start({
    field: document.querySelector('#game-field'), pref, updateHud, finish: finishGame, sound,
    runMeta: state.currentRun,
    registerCleanup: (cleanup) => state.cleanup.push(cleanup),
  });
}

function updateHud(score, goal, time) {
  const scoreElement = document.querySelector('#game-score');
  const timeElement = document.querySelector('#game-time');
  if (scoreElement) scoreElement.textContent = `${score} / ${goal}`;
  if (timeElement) timeElement.textContent = Math.max(0, time).toFixed(1);
}

function finishGame(success, performance = {}) {
  if (state.gameFinished) return;
  state.gameFinished = true;
  cleanups();
  sound(success ? 'win' : 'wrong');
  if (success) characterCry(state.current);
  const records = gameRecords();
  const previous = records[state.current.code] || {};
  const stars = success ? Math.max(1, Math.min(3, performance.stars || 1)) : 0;
  const newBest = stars > (previous.stars || 0);
  records[state.current.code] = {
    plays: (previous.plays || 0) + 1,
    stars: Math.max(previous.stars || 0, stars),
    bestStreak: Math.max(previous.bestStreak || 0, performance.maxStreak || 0),
    bestScore: Math.max(previous.bestScore || 0, performance.score || 0),
  };
  storage.set('47quest-game-records', records);
  if (success) {
    const daily = dailyProgress();
    daily.clears += 1;
    storage.set('47quest-daily-play', daily);
  }
  const board = document.querySelector('.game-board');
  if (!board) return;
  board.insertAdjacentHTML('beforeend', `
    <div class="game-overlay">
      <div class="result-card ${success ? 'is-clear' : 'is-retry'}">
        <div class="result-stars" aria-label="星${stars}つ">${success ? Array.from({ length: 3 }, (_, index) => `<i style="--star-delay:${index * 140}ms" class="${index < stars ? 'is-earned' : ''}">${index < stars ? '★' : '☆'}</i>`).join('') : '↻'}</div>
        <h3>${success ? 'できた！' : 'もう一歩！'}</h3>
        ${Number.isFinite(performance.score) ? `<p class="result-learning">今回 ${performance.score}点 ／ 最高 ${records[state.current.code].bestScore}点</p>` : ''}
        ${success && newBest ? '<strong class="new-record">NEW BEST</strong>' : ''}
        ${success ? `<div class="clear-friend is-mystery">${mascot(state.current, 'clear-friend-art')}<div><strong>${state.current.character}</strong><p>仲間も おおよろこび！</p><span>おさらいで 仲間にしよう</span></div></div>` : '<p>もう一度やってみよう。</p>'}
        <p class="result-learning"><b>${state.current.name}メモ</b>${state.current.feature}<br><span>名産・名物：${state.current.specialty}</span></p>
        ${success
          ? `<div class="result-actions">${button('もう一度あそぶ', 'game-retry', 'secondary-button')}${button(state.replay ? '県のページへ' : '場所クイズへ', 'game-next', 'primary-button sun')}</div>`
          : `<div class="result-actions">
              ${button('もう一度', 'game-retry', 'primary-button sun')}
              ${button('場所クイズへ', 'game-skip', 'secondary-button')}
            </div>`}
      </div>
    </div>`);
}

function initAppleGame() {
  const field = document.querySelector('#game-field');
  field.insertAdjacentHTML('beforeend', '<div class="basket" aria-hidden="true"></div>');
  const basket = field.querySelector('.basket');
  let score = 0; let elapsed = 0; let spawnElapsed = .6; let last = performance.now(); let raf;
  const apples = [];
  const moveBasket = (event) => {
    const rect = field.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    basket.style.left = `${x}px`;
  };
  field.addEventListener('pointerdown', moveBasket);
  field.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || event.buttons) moveBasket(event); });
  const spawn = () => {
    const apple = document.createElement('i');
    apple.className = 'apple-item';
    const rect = field.getBoundingClientRect();
    const x = 28 + Math.random() * Math.max(20, rect.width - 70);
    const item = { element: apple, x, y: -40, speed: 105 + Math.random() * 85 };
    apple.style.left = `${x}px`; apple.style.top = '-40px';
    field.append(apple); apples.push(item);
  };
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; spawnElapsed += dt;
    if (spawnElapsed > .62) { spawnElapsed = 0; spawn(); }
    const fieldRect = field.getBoundingClientRect(); const basketRect = basket.getBoundingClientRect();
    apples.slice().forEach((apple) => {
      apple.y += apple.speed * dt;
      apple.element.style.transform = `translateY(${apple.y + 40}px) rotate(${apple.y * .7}deg)`;
      const rect = apple.element.getBoundingClientRect();
      if (rect.bottom >= basketRect.top && rect.left < basketRect.right && rect.right > basketRect.left && rect.top < basketRect.bottom) {
        score += 1; sound('pop'); apple.element.remove(); apples.splice(apples.indexOf(apple), 1);
      } else if (apple.y > fieldRect.height + 30) { apple.element.remove(); apples.splice(apples.indexOf(apple), 1); }
    });
    updateHud(score, 5, 15 - elapsed);
    if (score >= 5) return finishGame(true);
    if (elapsed >= 15) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initUdonGame() {
  const field = document.querySelector('#game-field');
  field.innerHTML = '<div class="udon-machine"><div class="udon-bar"></div><div class="target-zone"></div><div class="noodle-rope"></div></div><button class="hold-button">長押しで のばす</button>';
  const machine = field.querySelector('.udon-machine'); const buttonElement = field.querySelector('.hold-button');
  let score = 0; let value = 12; let target = 55 + Math.random() * 15; let holding = false; let elapsed = 0; let last = performance.now(); let raf;
  const setTarget = () => { target = 46 + Math.random() * 27; machine.style.setProperty('--target', `${target}%`); };
  const startHold = (event) => { event.preventDefault(); holding = true; buttonElement.classList.add('is-holding'); sound('tap'); };
  const endHold = () => {
    if (!holding) return;
    holding = false; buttonElement.classList.remove('is-holding');
    if (Math.abs(value - target) <= 9) { score += 1; sound('good'); } else { sound('wrong'); }
    value = 12; setTarget();
  };
  buttonElement.addEventListener('pointerdown', startHold);
  buttonElement.addEventListener('pointerup', endHold);
  buttonElement.addEventListener('pointercancel', endHold);
  buttonElement.addEventListener('pointerleave', (event) => { if (event.buttons) endHold(); });
  setTarget();
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt;
    if (holding) { value += 40 * dt; if (value >= 84) { value = 84; endHold(); } }
    machine.style.setProperty('--noodle', `${value}%`);
    updateHud(score, 3, 18 - elapsed);
    if (score >= 3) return finishGame(true);
    if (elapsed >= 18) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initSurfGame() {
  const field = document.querySelector('#game-field');
  field.innerHTML = `<div class="surfer"><img src="${state.current.art}" alt="" /></div>`;
  const surfer = field.querySelector('.surfer');
  let score = 0; let elapsed = 0; let spawnElapsed = .7; let last = performance.now(); let raf;
  const rings = [];
  const move = (event) => {
    const rect = field.getBoundingClientRect();
    const x = Math.max(35, Math.min(rect.width - 35, event.clientX - rect.left));
    const y = Math.max(65, Math.min(rect.height - 35, event.clientY - rect.top));
    surfer.style.left = `${x}px`; surfer.style.top = `${y}px`;
  };
  field.addEventListener('pointerdown', (event) => { field.setPointerCapture(event.pointerId); move(event); });
  field.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || event.buttons) move(event); });
  const spawn = () => {
    const rect = field.getBoundingClientRect(); const element = document.createElement('i'); element.className = 'surf-ring';
    const ring = { element, x: rect.width + 20, y: 70 + Math.random() * Math.max(30, rect.height - 150), speed: 125 + Math.random() * 65 };
    element.style.left = `${ring.x}px`; element.style.top = `${ring.y}px`; field.append(element); rings.push(ring);
  };
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; spawnElapsed += dt;
    if (spawnElapsed > 1.1) { spawnElapsed = 0; spawn(); }
    const surferRect = surfer.getBoundingClientRect();
    rings.slice().forEach((ring) => {
      ring.x -= ring.speed * dt; ring.element.style.left = `${ring.x}px`;
      const rect = ring.element.getBoundingClientRect();
      const hit = rect.left < surferRect.right && rect.right > surferRect.left && rect.top < surferRect.bottom && rect.bottom > surferRect.top;
      if (hit) { score += 1; sound('good'); ring.element.remove(); rings.splice(rings.indexOf(ring), 1); }
      else if (rect.right < 0) { ring.element.remove(); rings.splice(rings.indexOf(ring), 1); }
    });
    updateHud(score, 3, 18 - elapsed);
    if (score >= 3) return finishGame(true);
    if (elapsed >= 18) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  state.cleanup.push(() => cancelAnimationFrame(raf));
}

function flashField(className) {
  const field = document.querySelector('#game-field');
  field?.classList.remove('flash-good', 'flash-bad');
  void field?.offsetWidth;
  field?.classList.add(className);
}

function initCatchGame() {
  const field = document.querySelector('#game-field');
  field.insertAdjacentHTML('beforeend', '<div class="basket" aria-hidden="true"></div><div class="combo-label"></div>');
  const basket = field.querySelector('.basket');
  const comboLabel = field.querySelector('.combo-label');
  const tokens = [];
  let score = 0; let combo = 0; let elapsed = 0; let spawnElapsed = .4; let last = performance.now(); let raf;
  const { goal, time } = currentMicroGame();
  const moveBasket = (event) => {
    const rect = field.getBoundingClientRect();
    basket.style.left = `${Math.max(30, Math.min(rect.width - 30, event.clientX - rect.left))}px`;
  };
  field.addEventListener('pointerdown', (event) => { field.setPointerCapture(event.pointerId); moveBasket(event); });
  field.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || event.buttons) moveBasket(event); });
  const spawn = () => {
    const good = Math.random() > .18;
    const element = document.createElement('i');
    element.className = `catch-token ${good ? 'is-good' : 'is-bad'}`;
    element.textContent = good ? state.current.symbol : '🌪️';
    const rect = field.getBoundingClientRect();
    const token = { element, good, x: 28 + Math.random() * Math.max(20, rect.width - 70), y: -55, speed: 125 + Math.random() * 95 };
    element.style.left = `${token.x}px`; element.style.top = '-55px'; field.append(element); tokens.push(token);
  };
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; spawnElapsed += dt;
    if (spawnElapsed > Math.max(.42, .68 - elapsed * .012)) { spawnElapsed = 0; spawn(); }
    const fieldRect = field.getBoundingClientRect(); const basketRect = basket.getBoundingClientRect();
    tokens.slice().forEach((token) => {
      token.y += token.speed * dt; token.element.style.transform = `translateY(${token.y + 55}px) rotate(${token.y * .55}deg)`;
      const rect = token.element.getBoundingClientRect();
      if (rect.bottom >= basketRect.top && rect.left < basketRect.right && rect.right > basketRect.left && rect.top < basketRect.bottom) {
        if (token.good) { score += 1; combo += 1; sound(combo >= 3 ? 'good' : 'pop'); flashField('flash-good'); }
        else { score = Math.max(0, score - 1); combo = 0; sound('wrong'); flashField('flash-bad'); }
        comboLabel.textContent = combo >= 2 ? `${combo} COMBO` : '';
        token.element.remove(); tokens.splice(tokens.indexOf(token), 1);
      } else if (token.y > fieldRect.height + 30) { if (token.good) combo = 0; token.element.remove(); tokens.splice(tokens.indexOf(token), 1); }
    });
    updateHud(score, goal, time - elapsed);
    if (score >= goal) return finishGame(true);
    if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initGrowGame() {
  const field = document.querySelector('#game-field');
  field.innerHTML = `<div class="udon-machine"><div class="udon-bar"></div><div class="target-zone"></div><div class="noodle-rope"><span>${state.current.symbol}</span></div></div><button class="hold-button">長押しで ちょうせつ</button><div class="judgement"></div>`;
  const machine = field.querySelector('.udon-machine'); const hold = field.querySelector('.hold-button'); const judgement = field.querySelector('.judgement');
  const { goal, time } = currentMicroGame();
  let score = 0; let value = 12; let target = 55; let holding = false; let elapsed = 0; let last = performance.now(); let raf;
  const newTarget = () => { target = 45 + Math.random() * 31; machine.style.setProperty('--target', `${target}%`); };
  const start = (event) => { event.preventDefault(); holding = true; hold.classList.add('is-holding'); sound('tap'); };
  const stop = () => {
    if (!holding) return;
    holding = false; hold.classList.remove('is-holding');
    const gap = Math.abs(value - target);
    if (gap <= 8) { score += 1; judgement.textContent = gap <= 3 ? 'PERFECT' : 'GOOD'; judgement.className = 'judgement is-good'; sound(gap <= 3 ? 'win' : 'good'); flashField('flash-good'); }
    else { judgement.textContent = value < target ? 'もう少し！' : 'のばしすぎ！'; judgement.className = 'judgement is-bad'; sound('wrong'); flashField('flash-bad'); }
    value = 12; newTarget();
  };
  hold.addEventListener('pointerdown', start); hold.addEventListener('pointerup', stop); hold.addEventListener('pointercancel', stop);
  newTarget();
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt;
    if (holding) { value += (38 + score * 5) * dt; if (value >= 86) { value = 86; stop(); } }
    machine.style.setProperty('--noodle', `${value}%`); updateHud(score, goal, time - elapsed);
    if (score >= goal) return finishGame(true); if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initDodgeGame() {
  const field = document.querySelector('#game-field');
  field.innerHTML = `<div class="surfer">${mascot(state.current, 'player-mascot')}</div><div class="combo-label"></div>`;
  const { goal, time } = currentMicroGame();
  const player = field.querySelector('.surfer'); const objects = []; let score = 0; let elapsed = 0; let spawnElapsed = .6; let last = performance.now(); let raf; let invincible = 0;
  const move = (event) => {
    const rect = field.getBoundingClientRect();
    player.style.left = `${Math.max(38, Math.min(rect.width - 38, event.clientX - rect.left))}px`;
    player.style.top = `${Math.max(62, Math.min(rect.height - 38, event.clientY - rect.top))}px`;
  };
  field.addEventListener('pointerdown', (event) => { field.setPointerCapture(event.pointerId); move(event); });
  field.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || event.buttons) move(event); });
  const spawn = () => {
    const good = Math.random() > .34; const element = document.createElement('i');
    element.className = good ? 'surf-ring' : 'surf-rock'; element.textContent = good ? '' : '◆';
    const rect = field.getBoundingClientRect(); const object = { element, good, x: rect.width + 30, y: 65 + Math.random() * Math.max(30, rect.height - 135), speed: 145 + elapsed * 3 + Math.random() * 55 };
    element.style.left = `${object.x}px`; element.style.top = `${object.y}px`; field.append(element); objects.push(object);
  };
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; spawnElapsed += dt; invincible -= dt;
    if (spawnElapsed > Math.max(.58, 1.05 - elapsed * .015)) { spawnElapsed = 0; spawn(); }
    const playerRect = player.getBoundingClientRect();
    objects.slice().forEach((object) => {
      object.x -= object.speed * dt; object.element.style.left = `${object.x}px`; const rect = object.element.getBoundingClientRect();
      const hit = rect.left < playerRect.right && rect.right > playerRect.left && rect.top < playerRect.bottom && rect.bottom > playerRect.top;
      if (hit && (object.good || invincible <= 0)) {
        if (object.good) { score += 1; sound('good'); flashField('flash-good'); }
        else { score = Math.max(0, score - 1); invincible = .8; sound('wrong'); flashField('flash-bad'); }
        object.element.remove(); objects.splice(objects.indexOf(object), 1);
      } else if (rect.right < 0) { object.element.remove(); objects.splice(objects.indexOf(object), 1); }
    });
    player.classList.toggle('is-hit', invincible > 0); updateHud(score, goal, time - elapsed);
    if (score >= goal) return finishGame(true); if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initTapGame() {
  const field = document.querySelector('#game-field');
  const { goal, time } = currentMicroGame();
  let score = 0; let elapsed = 0; let spawnElapsed = .8; let last = performance.now(); let raf;
  const spawn = () => {
    const target = document.createElement('button'); target.className = 'pop-target'; target.textContent = state.current.symbol;
    target.style.left = `${10 + Math.random() * 76}%`; target.style.top = `${18 + Math.random() * 62}%`;
    target.addEventListener('click', () => { if (!target.isConnected) return; score += 1; sound('pop'); flashField('flash-good'); target.remove(); });
    field.append(target); setTimeout(() => target.remove(), 1500 - Math.min(550, elapsed * 25));
  };
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; spawnElapsed += dt;
    if (spawnElapsed > Math.max(.45, .85 - elapsed * .02)) { spawnElapsed = 0; spawn(); }
    updateHud(score, goal, time - elapsed); if (score >= goal) return finishGame(true); if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initTimingGame() {
  const field = document.querySelector('#game-field');
  field.innerHTML = `<div class="timing-lane"><div class="timing-zone"></div><div class="timing-marker">${state.current.symbol}</div></div><button class="timing-button">ここ！</button><div class="judgement"></div>`;
  const marker = field.querySelector('.timing-marker'); const zone = field.querySelector('.timing-zone'); const buttonElement = field.querySelector('.timing-button'); const judgement = field.querySelector('.judgement');
  const { goal, time } = currentMicroGame();
  let score = 0; let elapsed = 0; let position = 0; let direction = 1; let target = 50; let last = performance.now(); let raf;
  const resetZone = () => { target = 25 + Math.random() * 50; zone.style.left = `${target}%`; };
  buttonElement.addEventListener('click', () => {
    const gap = Math.abs(position - target);
    if (gap <= 10) { score += 1; judgement.textContent = gap <= 4 ? 'PERFECT' : 'GOOD'; judgement.className = 'judgement is-good'; sound('good'); flashField('flash-good'); }
    else { judgement.textContent = 'おしい！'; judgement.className = 'judgement is-bad'; sound('wrong'); flashField('flash-bad'); }
    resetZone();
  });
  resetZone();
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; position += direction * (55 + score * 9) * dt;
    if (position >= 100) { position = 100; direction = -1; } if (position <= 0) { position = 0; direction = 1; }
    marker.style.left = `${position}%`; updateHud(score, goal, time - elapsed);
    if (score >= goal) return finishGame(true); if (elapsed >= time) return finishGame(false); raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initCarryGame() {
  const field = document.querySelector('#game-field');
  const { goal, time } = currentMicroGame();
  field.innerHTML = `<div class="wind-ribbon" aria-hidden="true"></div><div class="carry-target"><i></i><span>ここへ！</span></div><div class="carry-item" role="button" aria-label="${state.current.symbol}をつかむ">${state.current.symbol}</div><p class="carry-copy">かざりを つかんで、光る輪へ</p>`;
  const item = field.querySelector('.carry-item');
  const target = field.querySelector('.carry-target');
  let score = 0; let elapsed = 0; let last = performance.now(); let raf; let dragging = false;
  let targetX = 72; let targetY = 50; let phase = Math.random() * Math.PI * 2;
  const resetItem = () => {
    item.style.left = '15%'; item.style.top = '55%';
    item.classList.remove('is-dragging');
  };
  const moveTarget = () => {
    targetX = 62 + Math.random() * 25;
    targetY = 28 + Math.random() * 46;
    phase = Math.random() * Math.PI * 2;
  };
  const moveItem = (event) => {
    if (!dragging) return;
    const rect = field.getBoundingClientRect();
    const x = Math.max(7, Math.min(93, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(14, Math.min(88, (event.clientY - rect.top) / rect.height * 100));
    item.style.left = `${x}%`; item.style.top = `${y}%`;
  };
  item.addEventListener('pointerdown', (event) => {
    dragging = true; item.classList.add('is-dragging');
    item.setPointerCapture(event.pointerId); moveItem(event); sound('pop');
  });
  item.addEventListener('pointermove', moveItem);
  item.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    const itemRect = item.getBoundingClientRect(); const targetRect = target.getBoundingClientRect();
    const itemX = itemRect.left + itemRect.width / 2; const itemY = itemRect.top + itemRect.height / 2;
    const targetXPixel = targetRect.left + targetRect.width / 2; const targetYPixel = targetRect.top + targetRect.height / 2;
    const caught = Math.hypot(itemX - targetXPixel, itemY - targetYPixel) < Math.max(targetRect.width, targetRect.height) * .55;
    if (caught) {
      score += 1; sound('good'); flashField('flash-good'); target.classList.add('is-caught');
      setTimeout(() => target.classList.remove('is-caught'), 260); moveTarget();
    } else { sound('tap'); item.classList.add('is-returning'); setTimeout(() => item.classList.remove('is-returning'), 280); }
    resetItem();
  });
  resetItem(); moveTarget();
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; phase += dt * (1.3 + score * .12);
    const bob = Math.sin(phase) * (5 + Math.min(5, score));
    target.style.left = `${targetX}%`; target.style.top = `${targetY + bob}%`;
    updateHud(score, goal, time - elapsed);
    if (score >= goal) return finishGame(true); if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); state.cleanup.push(() => cancelAnimationFrame(raf));
}

function initSearchGame() {
  const field=document.querySelector('#game-field');field.innerHTML='<div class="search-grid"></div>';const grid=field.firstElementChild;const { goal, time }=currentMicroGame();
  let found=0;let elapsed=0;let last=performance.now();let raf;const winners=shuffle([0,1,2,3,4,5,6,7,8]).slice(0,goal);
  for(let index=0;index<9;index+=1){const tile=document.createElement('button');tile.className='search-tile';tile.textContent='？';tile.addEventListener('click',()=>{if(tile.disabled)return;tile.disabled=true;if(winners.includes(index)){tile.textContent=state.current.symbol;tile.classList.add('is-found');found+=1;sound('good');flashField('flash-good');}else{tile.textContent='○';tile.classList.add('is-empty');sound('tap');}});grid.append(tile);}
  const loop=(now)=>{const dt=Math.min(.04,(now-last)/1000);last=now;elapsed+=dt;updateHud(found,goal,time-elapsed);if(found>=goal)return finishGame(true);if(elapsed>=time)return finishGame(false);raf=requestAnimationFrame(loop);};
  raf=requestAnimationFrame(loop);state.cleanup.push(()=>cancelAnimationFrame(raf));
}

function initTraceGame() {
  const field=document.querySelector('#game-field');const { goal, time }=currentMicroGame();const points=Array.from({length:goal},(_,index)=>({x:14+index*(72/Math.max(1,goal-1)),y:22+Math.random()*56}));let current=0;let drawing=false;let elapsed=0;let last=performance.now();let raf;
  field.innerHTML=`<svg class="trace-route" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${points.map(p=>`${p.x},${p.y}`).join(' ')}"/></svg>${points.map((point,index)=>`<i class="route-point ${index===0?'is-next':''}" style="left:${point.x}%;top:${point.y}%">${index+1}</i>`).join('')}<div class="trace-player">${state.current.symbol}</div>`;
  const player=field.querySelector('.trace-player');const pointElements=[...field.querySelectorAll('.route-point')];
  const move=(event)=>{if(!drawing)return;const rect=field.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width*100;const y=(event.clientY-rect.top)/rect.height*100;player.style.left=`${x}%`;player.style.top=`${y}%`;const target=points[current];if(target&&Math.hypot(x-target.x,y-target.y)<8){pointElements[current].classList.remove('is-next');pointElements[current].classList.add('is-done');current+=1;if(pointElements[current])pointElements[current].classList.add('is-next');sound('pop');}};
  field.addEventListener('pointerdown',event=>{drawing=true;field.setPointerCapture(event.pointerId);move(event);});field.addEventListener('pointermove',move);field.addEventListener('pointerup',()=>{drawing=false;});
  const loop=(now)=>{const dt=Math.min(.04,(now-last)/1000);last=now;elapsed+=dt;updateHud(current,goal,time-elapsed);if(current>=goal)return finishGame(true);if(elapsed>=time)return finishGame(false);raf=requestAnimationFrame(loop);};
  raf=requestAnimationFrame(loop);state.cleanup.push(()=>cancelAnimationFrame(raf));
}

function initBalanceGame() {
  const field=document.querySelector('#game-field');field.innerHTML=`<div class="balance-track"><div class="safe-zone"></div><div class="balance-ball">${state.current.symbol}</div></div><p class="balance-copy">指でまんなかを守ろう</p>`;const ball=field.querySelector('.balance-ball');const { goal, time }=currentMicroGame();let position=50;let target=50;let safeTime=0;let elapsed=0;let last=performance.now();let raf;
  const move=event=>{const rect=field.getBoundingClientRect();target=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100));};field.addEventListener('pointerdown',event=>{field.setPointerCapture(event.pointerId);move(event);});field.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'||event.buttons)move(event);});
  const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;elapsed+=dt;position+=(target-position)*dt*3+(Math.random()-.5)*dt*12;position=Math.max(2,Math.min(98,position));ball.style.left=`${position}%`;if(Math.abs(position-50)<12)safeTime+=dt;else safeTime=Math.max(0,safeTime-dt*.8);updateHud(Math.floor(safeTime),goal,time-elapsed);if(safeTime>=goal)return finishGame(true);if(elapsed>=time)return finishGame(false);raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);state.cleanup.push(()=>cancelAnimationFrame(raf));
}

function initRhythmGame() {
  const field = document.querySelector('#game-field');
  const { goal, time } = currentMicroGame();
  const colors = ['#ff6b56','#ffcf54','#71d3ad','#80ccef'];
  let round = 0; let sequence = []; let inputIndex = 0; let locked = true;
  let started = false; let elapsed = 0; let last = performance.now(); let raf;
  field.innerHTML = `
    <div class="rhythm-pads">${colors.map((color,index)=>`<button style="--pad:${color}" data-pad="${index}" aria-label="色のボタン ${index + 1}">${index+1}</button>`).join('')}</div>
    <p class="rhythm-copy">準備できたら「順番を見る」を押そう</p>
    <button class="rhythm-control" type="button">順番を見る</button>`;
  const pads = [...field.querySelectorAll('[data-pad]')];
  const copy = field.querySelector('.rhythm-copy');
  const control = field.querySelector('.rhythm-control');
  const playSequence = async (reuse = false) => {
    if (locked && started) return;
    started = true; locked = true; inputIndex = 0;
    if (!reuse || !sequence.length) sequence = Array.from({ length: 2 + Math.min(round, 1) }, () => Math.floor(Math.random() * 4));
    control.disabled = true;
    control.textContent = 'よく見てね';
    copy.textContent = '光る順番をおぼえよう';
    await new Promise((resolve) => setTimeout(resolve, 450));
    for (const index of sequence) {
      pads[index].classList.add('is-lit'); sound('pop');
      await new Promise((resolve) => setTimeout(resolve, 520));
      pads[index].classList.remove('is-lit');
      await new Promise((resolve) => setTimeout(resolve, 230));
    }
    locked = false;
    control.disabled = false;
    control.textContent = 'もう一度見る';
    copy.textContent = '同じ順番でボタンをタップ';
  };
  control.addEventListener('click', () => playSequence(started));
  pads.forEach((pad, index) => pad.addEventListener('click', () => {
    if (locked || !started) return;
    pad.classList.add('is-lit'); setTimeout(() => pad.classList.remove('is-lit'), 180);
    if (index === sequence[inputIndex]) {
      inputIndex += 1; sound('pop');
      if (inputIndex === sequence.length) {
        round += 1; locked = true; sound('good'); flashField('flash-good');
        copy.textContent = round >= goal ? 'ぜんぶ覚えられたね' : 'できた。次の順番を見よう';
        control.disabled = true;
        if (round < goal) setTimeout(() => { locked = false; playSequence(false); }, 700);
      }
    } else {
      sound('wrong'); flashField('flash-bad'); inputIndex = 0;
      copy.textContent = '大丈夫。「もう一度見る」で確認しよう';
    }
  }));
  const loop = (now) => {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    if (started && !locked) elapsed += dt;
    updateHud(round, goal, time - elapsed);
    if (round >= goal) return finishGame(true);
    if (elapsed >= time) return finishGame(false);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  state.cleanup.push(() => cancelAnimationFrame(raf));
}

function mapPoint(pref) {
  return window.PREFECTURE_MAP_POINTS[pref.code] || { x: 50, y: 50 };
}

function nearestPrefecture(x, y) {
  return PREFECTURES.reduce((nearest, pref) => {
    const point = mapPoint(pref);
    const distance = Math.hypot(point.x - x, point.y - y);
    return !nearest || distance < nearest.distance ? { pref, distance } : nearest;
  }, null);
}

function prepareLocationHitTest() {
  const image = document.querySelector('.quiz-answer-overlay');
  if (!image) return;
  const prepare = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    try {
      context.drawImage(image, 0, 0);
      // file:// で直接開いた場合、ローカル画像を描いた canvas はブラウザーに
      // よって読み取り禁止になる。ここで一度だけ確認し、クリック時の例外を防ぐ。
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      state.locationHitTest = { pixels, width: canvas.width, height: canvas.height };
    } catch {
      state.locationHitTest = { pixels: null, width: canvas.width, height: canvas.height };
    }
  };
  if (image.complete && image.naturalWidth) prepare(); else image.addEventListener('load', prepare, { once: true });
}

function overlayContainsPoint(x, y, displayedMapWidth) {
  const hitTest = state.locationHitTest;
  if (!hitTest?.pixels) return null;
  const centerX = Math.round(x / 100 * hitTest.width);
  const centerY = Math.round(y / 100 * hitTest.height);
  const radius = Math.max(2, Math.round(hitTest.width / Math.max(1, displayedMapWidth) * 8));
  const startX = Math.max(0, centerX - radius); const startY = Math.max(0, centerY - radius);
  const width = Math.min(hitTest.width - startX, radius * 2 + 1);
  const height = Math.min(hitTest.height - startY, radius * 2 + 1);
  if (width <= 0 || height <= 0) return false;
  for (let row = startY; row < startY + height; row += 1) {
    for (let column = startX; column < startX + width; column += 1) {
      const alphaIndex = (row * hitTest.width + column) * 4 + 3;
      if (hitTest.pixels[alphaIndex] > 24) return true;
    }
  }
  return false;
}

function renderLocationQuiz() {
  cleanups();
  if (state.replay) return renderDetail(state.current);
  state.screen = 'location-quiz';
  state.locationResolved = false;
  state.locationWrong = new Set();
  state.locationHitTest = null;
  const pref = state.current;
  const targetPoint = mapPoint(pref);
  app.innerHTML = shell(`
    <section class="scene location-quiz-scene">
      <div class="location-quiz-map-card">
        <div class="quiz-map-frame" data-action="location-map" role="button" tabindex="0" aria-label="日本地図。${pref.name}だと思う場所を直接タップ">
          <div class="map-zoom-content">
          <img class="quiz-map-base" src="./assets/images/japan-map-play.png" alt="47都道府県の日本地図" />
          <img class="quiz-answer-overlay" src="${pref.overlay}" alt="" aria-hidden="true" />
          <span class="map-tap-guide">👆 ${pref.name}だと思う場所をタップ</span>
          <i class="location-answer-ring" style="--answer-x:${targetPoint.x}%;--answer-y:${targetPoint.y}%" aria-hidden="true"></i>
          </div>
          <button class="zoom-button" data-action="map-zoom">＋ 近くで見る</button>
        </div>
        <a class="map-source-link" href="https://frame-illust.com/?p=10006" target="_blank" rel="noopener" aria-label="地図素材の出典を開く">出典</a>
        <div class="location-quiz-overlay">
          <div id="location-feedback" class="location-feedback" aria-live="polite">まちがえても、地図を何回でもタップできるよ</div>
          <div class="location-quiz-actions">
            ${button('答えを見る', 'location-reveal', 'secondary-button')}
            ${button(state.roundIndex < state.round.length - 1 ? 'つぎの県へ' : 'おさらいへ', 'location-next', 'primary-button sun', 'hidden')}
          </div>
        </div>
      </div>
    </section>`, { progress: progressFor(5), label: `${state.roundIndex + 1} / 3　${pref.name}はどこかな？` });
  prepareLocationHitTest();
  initMapZoom(document.querySelector('.quiz-map-frame'), document.querySelector('.quiz-map-frame .map-zoom-content'));
}

function revealLocationAnswer(foundByPlayer = false) {
  if (state.locationResolved) return;
  state.locationResolved = true;
  document.querySelector('.quiz-answer-overlay')?.classList.add('is-revealed');
  document.querySelector('.location-answer-ring')?.classList.add('is-revealed');
  document.querySelector('.location-guess-marker')?.remove();
  document.querySelector('.map-tap-guide')?.classList.add('is-hidden');
  const feedback = document.querySelector('#location-feedback');
  if (feedback) {
    feedback.className = 'location-feedback is-correct';
    feedback.innerHTML = `<strong>${foundByPlayer ? 'せいかい' : 'ここだよ'}</strong><span>${state.current.name}は、この赤く光った場所。</span>`;
  }
  document.querySelector('[data-action="location-reveal"]')?.setAttribute('hidden', '');
  document.querySelector('[data-action="location-next"]')?.removeAttribute('hidden');
  sound(foundByPlayer ? 'win' : 'good');
}

function nextAfterGame() {
  if (state.replay) return renderDetail(state.current);
  state.roundIndex += 1;
  if (state.roundIndex < state.round.length) {
    state.current = state.round[state.roundIndex];
    renderMap();
  } else {
    state.reviewIndex = 0;
    state.reviewPhase = 'location';
    state.reviewHints = {};
    state.reviewResults = {};
    state.reviewLocationAttempts = {};
    state.reviewLocationWrong = {};
    renderReviewLocation();
  }
}

function renderReviewLegacy() {
  cleanups();
  state.screen = 'review';
  state.strokes = [];
  state.trace = false;
  const pref = state.round[state.reviewIndex];
  state.current = pref;
  const hint = state.reviewHints[pref.code] || 0;
  app.innerHTML = shell(`
    <section class="scene review-scene">
      <aside class="lesson-panel">
        <p class="eyebrow">おさらいタイム　${state.reviewIndex + 1} / 3</p>
        <h1 class="title">さっきの場所を<br>思い出そう</h1>
        <div class="review-list">
          ${state.round.map((item, index) => `<div class="review-place ${index === state.reviewIndex ? 'is-current' : ''} ${index < state.reviewIndex ? 'is-done' : ''}"><span class="review-number">${index < state.reviewIndex ? '✓' : index + 1}</span><span>${index === state.reviewIndex ? item.region : index < state.reviewIndex ? item.name : '？？？'}</span><span>${index === state.reviewIndex ? 'いまここ' : ''}</span></div>`).join('')}
        </div>
        <div class="hint-stack">
          ${hint >= 1 ? `<span class="hint-chip">ひらがな: ${pref.reading}</span>` : ''}
          ${hint >= 2 ? `<span class="hint-chip">漢字: ${pref.name}</span>` : ''}
        </div>
        ${button(hint === 0 ? 'ヒントをひとつ' : hint === 1 ? 'もうひとつヒント' : '答えを見て書こう', 'review-hint', 'secondary-button', hint >= 2 ? 'disabled' : '')}
      </aside>
      <div class="writing-board">
        <div class="canvas-shell">
          <div class="trace-word ${hint >= 2 ? '' : 'is-hidden'}">${pref.name}</div>
          <canvas id="write-canvas" tabindex="0" aria-label="思い出した都道府県名を書く場所"></canvas>
          <span class="canvas-hint">ひらがなと漢字を、思い出して書こう</span>
        </div>
        <div class="writing-tools">
          ${button('↶ 一画もどす', 'undo', 'tool-button')}
          ${button('全部けす', 'clear', 'tool-button')}
          ${button('答えを見る', 'review-hint', 'tool-button')}
          ${button('書けた！', 'review-done', 'primary-button sun', 'disabled')}
        </div>
      </div>
    </section>`, { progress: 84 + state.reviewIndex * 5, label: 'おさらいタイム' });
  initCanvas();
}

function completeReviewLegacy() {
  state.unlocked.add(state.current.code);
  saveProgress();
  sound('win');
  state.reviewIndex += 1;
  if (state.reviewIndex < 3) renderReview(); else renderReward();
}

function renderReviewLocation() {
  cleanups();
  state.screen = 'review-location';
  state.reviewPhase = 'location';
  state.mapZoomed = false;
  const pref = state.round[state.reviewIndex];
  state.current = pref;
  state.reviewLocationResolved = false;
  state.reviewLocationAttempts[pref.code] ||= 0;
  state.reviewLocationWrong[pref.code] ||= new Set();
  const point = mapPoint(pref);
  app.innerHTML = shell(`
    <section class="scene review-location-scene">
      <div class="review-location-map map-stage" data-code="${pref.code}" data-show-entire-japan="true" style="--origin:${point.x}% ${point.y}%;--shift-x:${50 - point.x}%;--shift-y:${50 - point.y}%;--zoom:2.7">
        ${mapLayers(pref, `赤く光っている${pref.name}の場所を示した日本地図`)}
        <span class="review-map-guide">赤く光っている県の名前を思い出そう</span>
        <button class="zoom-button" data-action="map-zoom">＋ 近くで見る</button>
      </div>
      <aside class="review-location-picker">
        <div class="review-picker-heading">
          <p class="eyebrow">47都道府県から えらぼう</p>
          <strong>赤い場所は どこ？</strong>
        </div>
        <div id="review-location-answer" class="review-location-answer" aria-live="polite">
          <strong>あと3回</strong><span>名前をタップして答えよう</span>
        </div>
        <div class="review-prefecture-grid" role="group" aria-label="47都道府県の選択肢">
          ${PREFECTURES.map((item) => `<button type="button" class="review-prefecture-choice" data-action="review-location-choice" data-code="${item.code}">${item.name}</button>`).join('')}
        </div>
        ${button('漢字を書く →', 'review-location-next', 'primary-button sun review-location-next', 'hidden')}
      </aside>
    </section>`, { label: `${state.quickQuiz ? 'いきなりクイズ' : 'おさらい'} ${state.reviewIndex + 1} / 3　赤い場所の県を選ぼう` });
  initMapZoom(document.querySelector('.map-stage'), document.querySelector('.map-stage .map-layers'), { focus: point });
}

function revealReviewLocationAnswer(foundByPlayer = false) {
  if (state.reviewLocationResolved) return;
  state.reviewLocationResolved = true;
  const answer = document.querySelector('#review-location-answer');
  if (answer) {
    answer.className = `review-location-answer ${foundByPlayer ? 'is-correct' : 'is-revealed'}`;
    answer.innerHTML = `<strong>${foundByPlayer ? 'せいかい！' : `正解は ${state.current.name}`}</strong><span>${state.current.reading}</span>`;
  }
  document.querySelectorAll('[data-action="review-location-choice"]').forEach((choice) => {
    choice.disabled = true;
    if (choice.dataset.code === state.current.code) choice.classList.add('is-correct');
  });
  document.querySelector('[data-action="review-location-next"]')?.removeAttribute('hidden');
  sound(foundByPlayer ? 'win' : 'good');
}

function answerReviewLocation(control) {
  if (state.reviewLocationResolved) return;
  if (control.dataset.code === state.current.code) return revealReviewLocationAnswer(true);

  const code = state.current.code;
  state.reviewLocationWrong[code].add(control.dataset.code);
  const attempts = state.reviewLocationAttempts[code] + 1;
  state.reviewLocationAttempts[code] = attempts;
  control.disabled = true;
  control.classList.add('is-wrong');
  sound('wrong');

  if (attempts >= 3) return revealReviewLocationAnswer(false);
  const remaining = 3 - attempts;
  const answer = document.querySelector('#review-location-answer');
  if (answer) {
    answer.className = 'review-location-answer is-wrong';
    answer.innerHTML = `<strong>ちがうよ</strong><span>あと${remaining}回。地図をよく見て選ぼう</span>`;
  }
}

function renderReview() {
  if (state.reviewPhase === 'location') return renderReviewLocation();
  cleanups();
  state.screen = 'review';
  state.strokes = [];
  state.trace = false;
  const pref = state.round[state.reviewIndex];
  state.current = pref;
  state.reviewPhase = 'kanji';
  state.writeMode = 'kanji';
  const word = pref.name;
  state.requiredWord = word;
  const hintKey = `${pref.code}-${state.reviewPhase}`;
  const hint = state.reviewHints[hintKey] || 0;
  const characters = [...word];
  const maskedWord = `${characters[0]}${'○'.repeat(Math.max(0, characters.length - 1))}`;
  app.innerHTML = shell(`
    <section class="scene review-scene">
      <header class="review-writing-top">
        <div class="review-writing-context"><span class="review-number">漢</span><strong>${pref.region}の赤い場所</strong><span>漢字</span></div>
        <div class="hint-stack">
          ${hint >= 1 ? `<span class="hint-chip">最初の文字: ${maskedWord}</span>` : '<span class="hint-chip">答えはまだ見えないよ</span>'}
          ${hint >= 2 ? `<span class="hint-chip">見本: ${word}</span>` : ''}
        </div>
        ${button(hint === 0 ? '最初の文字を見る' : hint === 1 ? '答えを見る' : '見本を表示中', 'review-hint', 'secondary-button', hint >= 2 ? 'disabled' : '')}
      </header>
      <div class="writing-board">
        <div class="canvas-shell">
          <div class="trace-word ${hint >= 2 ? '' : 'is-hidden'}">${word}</div>
          <canvas id="write-canvas" tabindex="0" aria-label="漢字を書く場所"></canvas>
          <span class="canvas-hint">答えを見ないで、漢字を書こう</span>
          <span class="ink-status" aria-live="polite">線を書いたら答え合わせできるよ</span>
          ${button('答えと見くらべる', 'review-check', 'primary-button sun canvas-next-button', 'disabled')}
        </div>
        <div class="writing-tools">
          ${button('↶ 一画もどす', 'undo', 'tool-button')}
          ${button('全部けす', 'clear', 'tool-button')}
          ${button('ヒント', 'review-hint', 'tool-button', hint >= 2 ? 'disabled' : '')}
        </div>
      </div>
    </section>`, { progress: 86 + state.reviewIndex * 5, label: `おさらい ${state.reviewIndex + 1} / 3　漢字で書こう` });
  initCanvas();
}

function renderReviewCompare() {
  cleanups();
  state.screen = 'review-compare';
  const pref = state.current;
  const answer = pref.name;
  const hintUsed = (state.reviewHints[`${pref.code}-${state.reviewPhase}`] || 0) > 0;
  app.innerHTML = shell(`
    <section class="scene compare-scene">
      <aside class="compare-heading">
        <p class="eyebrow">答え合わせ　漢字</p>
        <h1 class="title">同じように<br>書けたかな？</h1>
        <p class="body-copy">形と文字の順番を、自分の目でゆっくり見くらべよう。</p>
      </aside>
      <div class="compare-grid">
        <section class="compare-card"><span>じぶんの文字</span><img src="${state.inkPreview}" alt="自分が書いた文字" /></section>
        <section class="compare-card answer-card"><span>正しい漢字</span><strong>${answer}</strong></section>
      </div>
      <div class="compare-actions">
        ${hintUsed ? '<p>ヒントを見たので、今回は練習として進めるよ。</p>' : button('見本を見ずに書けた', 'review-correct', 'primary-button sun')}
        ${button('ちがった・もう一度', 'review-retry', 'secondary-button')}
        ${hintUsed ? button('見本を見て練習できた', 'review-learned', 'primary-button') : ''}
      </div>
    </section>`, { progress: 88 + state.reviewIndex * 5, label: '答え合わせ　漢字' });
}

function advanceReview(correct) {
  const pref = state.current;
  state.reviewResults[pref.code] ||= { kanji: false };
  state.reviewResults[pref.code].kanji = correct;
  if (state.reviewResults[pref.code].kanji) {
    if (!state.unlocked.has(pref.code)) state.newlyUnlocked.add(pref.code);
    state.unlocked.add(pref.code);
    saveProgress();
    sound('win');
  }
  state.reviewIndex += 1;
  state.reviewPhase = 'location';
  if (state.reviewIndex < 3) renderReviewLocation(); else startRewardReveal();
}

function earnedThisRound() {
  return state.round.filter((pref) => state.reviewResults[pref.code]?.kanji);
}

function startRewardReveal() {
  state.rewardRevealIndex = 0;
  if (earnedThisRound().length) return renderRewardReveal();
  return renderReward();
}

function renderRewardReveal() {
  cleanups();
  state.screen = 'reward-reveal';
  const earned = earnedThisRound();
  const pref = earned[state.rewardRevealIndex];
  const isNew = state.newlyUnlocked.has(pref.code);
  const isLast = state.rewardRevealIndex >= earned.length - 1;
  app.innerHTML = shell(`
    <section class="scene reward-reveal-scene" style="--reveal-color:${pref.color}">
      <div class="reveal-curtain" aria-hidden="true"><i></i><i></i></div>
      <div class="reveal-portal" aria-hidden="true"></div>
      <div class="reveal-rays" aria-hidden="true"></div>
      <div class="reveal-sparks" aria-hidden="true">${Array.from({ length: 30 }, (_, i) => `<i style="--spark-angle:${i * 12}deg;--spark-delay:${(i % 10) * .055}s"></i>`).join('')}</div>
      <div class="reveal-get-banner" aria-hidden="true">仲間ゲット</div>
      <p class="reveal-kicker">${isNew ? 'NEW FRIEND!' : 'WELCOME BACK!'}</p>
      <div class="reveal-character-wrap">
        <div class="reveal-silhouette" aria-hidden="true"></div>
        ${mascot(pref, 'reveal-character')}
      </div>
      <div class="reveal-name-card">
        <small>${pref.name}から やってきた</small>
        <h1>${pref.character}</h1>
        <p>${pref.characterCopy}</p>
        <div class="reveal-profile-chips"><span>名産 ${pref.specialty}</span><span>とくいわざ ${pref.specialMove}</span></div>
        <p class="reveal-prefecture-feature"><b>${pref.name}って？</b>${pref.feature}</p>
        ${characterStats(pref, 'reveal-stats')}
      </div>
      ${button(isLast ? 'みんなを見る →' : 'つぎの仲間 →', 'reward-reveal-next', 'primary-button sun reveal-next-button')}
    </section>`, { progress: 100, label: `仲間ゲット！ ${state.rewardRevealIndex + 1} / ${earned.length}` });
  sound('win');
  sound('reveal');
  const revealSounds = [
    window.setTimeout(() => sound('bonus'), 430),
    window.setTimeout(() => { sound('stamp'); characterCry(pref); }, 920),
  ];
  state.cleanup.push(() => revealSounds.forEach(clearTimeout));
  animateCharacterStats(document.querySelector('.reward-reveal-scene'));
}

function renderReward() {
  cleanups();
  state.screen = 'reward';
  const earned = earnedThisRound();
  const confetti = Array.from({ length: 28 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--color:${['#ff6b56','#ffcf54','#71d3ad','#80ccef','#c9ace5'][index % 5]};--speed:${3.4 + (index % 6) * .35}s;--delay:${-(index % 9) * .45}s"></i>`).join('');
  app.innerHTML = shell(`
    <section class="scene reward-scene">
      <div class="confetti">${confetti}</div>
      <p class="eyebrow">${earned.length ? '場所を選んで、漢字も思い出せた' : '今回は練習できたね'}</p>
      <h1 class="title">${earned.length ? `${earned.length}県の仲間を発見。` : 'つぎは見本なしで書こう。'}</h1>
      <div class="reward-characters">
        ${earned.length ? earned.map((pref, index) => mascot(pref, 'reward-character')).join('') : '<div class="empty-reward">書き直しは何回でもできるよ。失敗ではなく、覚える途中。</div>'}
      </div>
      <div class="button-row">
        ${button('もう1セット遊ぶ', 'start', 'primary-button sun')}
        ${button('図鑑を見る', 'collection', 'secondary-button')}
      </div>
    </section>`, { progress: 100, label: state.quickQuiz ? 'いきなりクイズ クリア' : '冒険クリア' });
}

function renderCollection() {
  cleanups();
  state.screen = 'collection';
  const pageSize = 6;
  const pageCount = Math.ceil(PREFECTURES.length / pageSize);
  state.collectionPage = Math.max(0, Math.min(pageCount - 1, state.collectionPage));
  const pageItems = PREFECTURES.slice(state.collectionPage * pageSize, (state.collectionPage + 1) * pageSize);
  app.innerHTML = shell(`
    <section class="scene collection-scene">
      <div class="section-head">
        <div><p class="eyebrow">ご当地なかまずかん</p><h1 class="title">集めた仲間</h1></div>
        <div class="button-row">${button('‹', 'collection-prev', 'secondary-button', state.collectionPage === 0 ? 'disabled' : '')}<span class="page-count">${state.collectionPage + 1} / ${pageCount}</span>${button('›', 'collection-next', 'secondary-button', state.collectionPage === pageCount - 1 ? 'disabled' : '')}${button('図鑑をリセット', 'collection-reset', 'secondary-button reset-button')}${button('ホームへ', 'home', 'secondary-button')} ${button('冒険へ', 'start', 'primary-button sun')}</div>
      </div>
      <div class="collection-grid">
        ${pageItems.map((pref) => {
          const unlocked = state.unlocked.has(pref.code);
          return `<button class="collection-card ${unlocked ? '' : 'is-locked'}" data-action="open-pref" data-code="${pref.code}" ${unlocked ? '' : 'aria-disabled="true"'}>
            ${unlocked ? '<span class="new-tag">GET</span>' : ''}
            ${unlocked
              ? mascot(pref, 'collection-mascot')
              : '<div class="collection-mascot collection-mascot-locked" role="img" aria-label="まだ見つけていない仲間"><span aria-hidden="true">？</span></div>'}
            <span><small class="eyebrow">${unlocked ? pref.name : '？？？'}</small><h3>${unlocked ? pref.character : 'まだ ひみつ'}</h3><p>${unlocked ? `名産：${pref.specialty}` : '冒険のおさらいをすると出会えるよ。'}</p>${unlocked ? `<span class="collection-feature">${pref.feature}</span>${compactCharacterStats(pref)}` : ''}</span>
          </button>`;
        }).join('')}
      </div>
      ${state.collectionResetPending ? `<div class="collection-reset-scrim">
        <section class="collection-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <span aria-hidden="true">⚠️</span>
          <h2 id="reset-title">図鑑を空っぽにする？</h2>
          <p>集めた仲間と進み具合が、すべて最初に戻るよ。</p>
          <div class="button-row">${button('やめる', 'collection-reset-cancel', 'secondary-button')}${button('本当にリセット', 'collection-reset-confirm', 'primary-button danger-button')}</div>
        </section>
      </div>` : ''}
    </section>`, { progress: Math.round(state.unlocked.size / 47 * 100), label: `図鑑 ${state.unlocked.size} / 47` });
}

function renderDetail(pref) {
  cleanups();
  state.screen = 'detail';
  state.current = pref;
  const game = window.QUEST_MICROGAMES?.catalog[pref.code];
  app.innerHTML = shell(`
    <section class="scene detail-scene">
      <div class="map-card map-stage" data-code="${pref.code}">
        ${mapLayers(pref, `${pref.name}を示した日本地図`)}
        <button class="zoom-button" data-action="map-zoom">＋ 近くで見る</button>
      </div>
      <aside class="character-profile-card" style="--profile-color:${pref.color}">
        <div class="profile-heading">${mascot(pref, 'detail-mascot')}<div><small>${pref.reading}</small><h1>${pref.character}</h1><strong>${pref.name}</strong></div></div>
        <p class="profile-copy">${pref.characterCopy}</p>
        <dl class="prefecture-facts">
          <div><dt>名産・名物</dt><dd>${pref.specialty}</dd></div>
          <div><dt>こんな場所</dt><dd>${pref.feature}</dd></div>
          <div><dt>とくいわざ</dt><dd>${pref.specialMove}</dd></div>
        </dl>
        ${characterStats(pref)}
        ${button('♪ なきごえを きく', 'character-cry', 'secondary-button')}
        ${button(`${game?.title || pref.gameTitle}を遊ぶ`, 'replay-game', 'primary-button sun profile-play-button')}
      </aside>
    </section>`, { progress: Math.round(state.unlocked.size / 47 * 100), label: `${pref.name}のページ` });
  initMapZoom(document.querySelector('.map-stage'), document.querySelector('.map-stage .map-layers'), { focus: mapPoint(pref) });
  animateCharacterStats(document.querySelector('.character-profile-card'));
  characterCry(pref);
}

app.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control || control.disabled) return;
  const action = control.dataset.action;
  if (action === 'home') return renderHome();
  if (action === 'character-cry') { characterCry(state.current); return; }
  if (action === 'start') return startRound();
  if (action === 'quick-quiz') return startQuickQuiz();
  if (action === 'hero-cheer') {
    const art = control.querySelector('.home-roamer-art');
    art?.getAnimations().forEach(animation => animation.cancel());
    art?.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-24px) scale(1.12) rotate(8deg)', offset: .45 }, { transform: 'translateY(0) scale(1)' }], { duration: 650, easing: 'ease-out' });
    characterCry(PREFECTURES.find(pref => pref.code === control.dataset.code));
    return;
  }
  if (action === 'collection') return renderCollection();
  if (action === 'collection-prev') { state.collectionPage -= 1; return renderCollection(); }
  if (action === 'collection-next') { state.collectionPage += 1; return renderCollection(); }
  if (action === 'collection-reset') { state.collectionResetPending = true; return renderCollection(); }
  if (action === 'collection-reset-cancel') { state.collectionResetPending = false; return renderCollection(); }
  if (action === 'collection-reset-confirm') {
    state.unlocked.clear();
    state.collectionPage = 0;
    state.collectionResetPending = false;
    saveProgress();
    sound('wrong');
    return renderCollection();
  }
  if (action === 'audio-panel') {
    const panel = document.querySelector('.audio-panel');
    const opener = document.querySelector('.sound-menu-button');
    if (!panel) return;
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    opener?.setAttribute('aria-expanded', String(willOpen));
    if (willOpen && state.sound && !musicTimer) startBgm(requestedMusic.scene, requestedMusic.variant);
    return;
  }
  if (action === 'sound') {
    state.sound = !state.sound; storage.set('47quest-sound', state.sound);
    updateAudioVolume();
    const soundButton = document.querySelector('.sound-menu-button');
    if (soundButton) soundButton.textContent = state.sound ? '🔊' : '音×';
    control.textContent = state.sound ? 'すべての音を消す' : '音を出す';
    if (state.sound) { sound('good'); startBgm(requestedMusic.scene, requestedMusic.variant); } else stopBgm();
    return;
  }
  if (action === 'map-zoom') {
    const mapStage = control.closest('[data-map-pannable="true"]')
      || document.querySelector('[data-map-pannable="true"]');
    mapStage?._mapZoom?.toggle();
    state.mapZoomed = mapStage?.classList.contains('is-map-zoomed') || false;
    control.textContent = state.mapZoomed ? '－ 全国を見る' : '＋ 近くで見る'; return;
  }
  if (action === 'start-writing') return renderWriting('hiragana');
  if (action === 'undo') {
    state.strokes.pop(); state.canvasRedraw?.();
    updateInkReadiness(); return;
  }
  if (action === 'clear') {
    state.strokes = []; state.canvasRedraw?.(); document.querySelector('.canvas-hint')?.classList.remove('is-hidden');
    updateInkReadiness(); return;
  }
  if (action === 'trace') {
    state.trace = !state.trace; document.querySelector('.trace-word')?.classList.toggle('is-hidden', !state.trace); control.textContent = state.trace ? 'なぞり OFF' : 'なぞり ON'; return;
  }
  if (action === 'writing-next') return state.writeMode === 'hiragana' ? renderWriting('kanji') : renderGame();
  if (action === 'game-retry') return renderGame();
  if (action === 'game-next') return state.replay ? renderDetail(state.current) : renderLocationQuiz();
  if (action === 'game-skip') return renderLocationQuiz();
  if (action === 'reward-reveal-next') {
    state.rewardRevealIndex += 1;
    return state.rewardRevealIndex < earnedThisRound().length ? renderRewardReveal() : renderReward();
  }
  if (action === 'location-map') {
    if (state.locationResolved || event.clientX == null) return;
    if (control._mapZoom?.consumeDrag()) return;
    const rect = control.getBoundingClientRect();
    const { x, y } = mapEventCoordinates(control, event);
    const nearest = nearestPrefecture(x, y);
    const zoomScale = control._mapZoom?.getState().scale || 1;
    const overlayHit = overlayContainsPoint(x, y, mapDisplayBox(rect.width, rect.height).width * zoomScale);
    // ローカルファイル表示では canvas の画素を読めないため、最寄りの県中心点で
    // フォールバックする。HTTP 表示では従来どおり県形状のアルファマスクを使う。
    const targetPoint = mapPoint(state.current);
    const targetDistance = Math.hypot(targetPoint.x - x, targetPoint.y - y);
    // 沖縄は島しょ部が小さく、実縮尺のままでは指の標準タップ領域を下回る。
    // 地形画像は変えず、入力レイヤーだけを広げて確実に選べるようにする。
    const centerHitRadius = (state.current.code === '47' ? 4.8 : 1.8) / zoomScale;
    const isCorrect = overlayHit === true
      || targetDistance <= centerHitRadius
      || (overlayHit === null && nearest.pref.code === state.current.code);
    if (isCorrect) return revealLocationAnswer(true);
    state.locationWrong.add(nearest.pref.code);
    document.querySelector('.location-guess-marker')?.remove();
    (control.querySelector('.map-zoom-content') || control).insertAdjacentHTML('beforeend', `<i class="location-guess-marker" style="--guess-x:${x}%;--guess-y:${y}%" aria-hidden="true">×</i>`);
    document.querySelector('.map-tap-guide')?.classList.add('is-hidden');
    const feedback = document.querySelector('#location-feedback');
    if (feedback) {
      feedback.className = 'location-feedback is-wrong';
      const place = nearest.distance > 9 ? '海の上みたい' : `そこは ${nearest.pref.name}の近く`;
      feedback.innerHTML = `<strong>${place}</strong><span>${state.current.name}は ${state.current.region}。地図をもう一度タップしよう。</span>`;
    }
    sound('wrong');
    return;
  }
  if (action === 'location-reveal') return revealLocationAnswer(false);
  if (action === 'location-next') return nextAfterGame();
  if (action === 'review-location-choice') return answerReviewLocation(control);
  if (action === 'review-location-next') {
    state.reviewPhase = 'kanji';
    return renderReview();
  }
  if (action === 'review-hint') {
    const key = `${state.current.code}-${state.reviewPhase}`;
    state.reviewHints[key] = Math.min(2, (state.reviewHints[key] || 0) + 1); return renderReview();
  }
  if (action === 'review-check') {
    const canvas = document.querySelector('#write-canvas');
    state.inkPreview = canvas?.toDataURL('image/png') || '';
    return renderReviewCompare();
  }
  if (action === 'review-retry') return renderReview();
  if (action === 'review-correct') return advanceReview(true);
  if (action === 'review-learned') return advanceReview(false);
  if (action === 'open-pref') {
    const pref = PREFECTURES.find((item) => item.code === control.dataset.code);
    if (pref && state.unlocked.has(pref.code)) return renderDetail(pref);
    control.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 }); return;
  }
  if (action === 'replay-game') { state.replay = true; return renderGame(); }
});

app.addEventListener('pointerdown', (event) => {
  const control = event.target.closest('button, [role="button"]');
  if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
  sound('tap');
  const ripple = document.createElement('i');
  ripple.className = 'tap-spark';
  ripple.style.left = `${event.clientX}px`;
  ripple.style.top = `${event.clientY}px`;
  ripple.innerHTML = '<b></b><b></b><b></b><b></b>';
  document.body.append(ripple);
  control.classList.add('is-pressing');
  window.setTimeout(() => ripple.remove(), 520);
  const release = () => control.classList.remove('is-pressing');
  control.addEventListener('pointerup', release, { once: true });
  control.addEventListener('pointercancel', release, { once: true });
});

app.addEventListener('input', (event) => {
  const slider = event.target.closest('[data-volume]');
  if (!slider) return;
  const value = Math.max(0, Math.min(100, Number(slider.value) || 0));
  const channel = slider.dataset.volume;
  if (channel === 'bgm') {
    state.bgmVolume = value;
    storage.set('47quest-bgm-volume', value);
    if (state.sound && !musicTimer) startBgm(requestedMusic.scene, requestedMusic.variant);
  } else {
    state.seVolume = value;
    storage.set('47quest-se-volume', value);
  }
  const output = document.querySelector(`[data-volume-output="${channel}"]`);
  ensureAudio();
  updateAudioVolume();
  if (output) output.textContent = value;
  slider.style.setProperty('--volume-fill', `${value}%`);
});

app.addEventListener('change', (event) => {
  const slider = event.target.closest('[data-volume]');
  if (!slider || !state.sound) return;
  if (slider.dataset.volume === 'se') sound('good');
});

window.addEventListener('wheel', (event) => {
  if (event.ctrlKey && !event.target.closest?.('[data-map-pannable="true"]')) event.preventDefault();
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') {
    state.sound = !state.sound; storage.set('47quest-sound', state.sound);
    updateAudioVolume();
    document.querySelector('.sound-menu-button')?.replaceChildren(document.createTextNode(state.sound ? '🔊' : '音×'));
    if (state.sound) startBgm(requestedMusic.scene, requestedMusic.variant); else stopBgm();
  }
});

renderHome();
