// engine.js – canvas and pixel scaling, mouse/touch input, game loop,
// switching scenes and small sounds.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;

  // The game world is 320x180 "game units". The canvas itself has 3x more
  // real pixels (960x540), so shapes and text stay smooth and sharp.
  const W = 320, H = 180, K = 3;
  TS.W = W;
  TS.H = H;
  TS.K = K;
  TS.scenes = {};
  TS.realTime = 0;     // seconds since the page opened
  TS.lastInput = 0;    // realTime of the last click

  // ---------- Small helpers ----------
  TS.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  TS.hit = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  TS.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  TS.chance = (p) => Math.random() < p;
  TS.rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  TS.euro = (n) => n.toFixed(2).replace('.', ',') + ' €';

  // ---------- Canvas ----------
  const canvas = document.getElementById('game');
  canvas.width = W * K;
  canvas.height = H * K;
  const g = canvas.getContext('2d');
  TS.canvas = canvas;
  TS.g = g;

  function resize() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', resize);

  // ---------- Input ----------
  TS.mouse = { x: -1, y: -1 };

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * W,
      y: (e.clientY - r.top) / r.height * H,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    TS.audioInit();
    const p = toGame(e);
    TS.mouse = p;
    TS.lastInput = TS.realTime;
    TS.handleClick(p.x, p.y);
  });
  // ---------- Full screen on phones and tablets ----------
  // The game goes full screen (no address bar) on the first tap with a finger,
  // and again after the full screen was closed. Browsers only allow this right
  // after a tap, so it is asked in the touch "up" event. (Same as in Matkapeli.)
  function goFullscreen(e) {
    if (e.pointerType === 'mouse') return;                       // not on a computer
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    if (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) return; // installed app
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      const lock = () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) { /* not supported */ } };
      if (p && p.then) p.then(lock, () => {}); else lock();
    } catch (_) { /* not allowed here */ }
  }
  canvas.addEventListener('pointerup', goFullscreen);
  window.addEventListener('orientationchange', resize);
  document.addEventListener('fullscreenchange', resize);

  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    // Dragging with a finger or a held mouse button (used to scroll the some feed)
    if (e.buttons && TS.scene && TS.scene.drag) TS.scene.drag(p.y - TS.mouse.y);
    TS.mouse = p;
  });
  canvas.addEventListener('wheel', (e) => {
    if (TS.scene && TS.scene.wheel) { e.preventDefault(); TS.scene.wheel(e.deltaY > 0 ? 1 : -1); }
  }, { passive: false });
  canvas.addEventListener('pointerleave', () => { TS.mouse = { x: -1, y: -1 }; });

  // A click goes first to dialogs, then to the top bar (HUD), then to the scene.
  TS.handleClick = function (x, y) {
    if (TS.ui && TS.ui.click(x, y)) return;
    const sc = TS.scene;
    if (sc && sc.hud && TS.ui.hudClick(x, y)) return;
    if (sc && sc.click) sc.click(x, y);
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      TS.muted = !TS.muted;
      if (TS.ui) TS.ui.toast(TS.muted ? 'ÄÄNET POIS' : 'ÄÄNET PÄÄLLE');
    }
    if (TS.scene && TS.scene.key) TS.scene.key(e.key);
  });

  // ---------- Scenes ----------
  TS.go = function (name, arg) {
    TS.sceneName = name;
    TS.scene = TS.scenes[name];
    if (TS.scene.enter) TS.scene.enter(arg);
  };

  // ---------- Game loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    TS.realTime += dt;
    if (TS.scene && TS.scene.update) TS.scene.update(dt);
    if (TS.ui) TS.ui.update(dt);

    g.setTransform(K, 0, 0, K, 0, 0);
    g.imageSmoothingEnabled = true;
    g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    if (TS.scene && TS.scene.draw) TS.scene.draw(g);
    if (TS.ui) TS.ui.draw(g);
    requestAnimationFrame(frame);
  }

  TS.start = function (firstScene, arg) {
    resize();
    TS.go(firstScene, arg);
    requestAnimationFrame(frame);
  };

  // ---------- Sounds (tiny 8-bit beeps made with WebAudio) ----------
  let actx = null;
  TS.muted = false;
  TS.audioInit = function () {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    if (actx) TS.music.start();
  };

  // ---------- Background music: a slow, sad 8-bit tune in A minor ----------
  // 8 bars, 4 beats each. Bass (triangle), quiet arpeggio (square), melody (square).
  // Played by a small scheduler that queues notes a moment ahead.
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const BEAT = 60 / 66;               // 66 beats per minute: slow and heavy
  const CHORDS = [                     // [bass note, three arpeggio notes]
    [45, [57, 60, 64]],  // Am
    [41, [53, 57, 60]],  // F
    [36, [55, 60, 64]],  // C
    [43, [55, 59, 62]],  // G
    [45, [57, 60, 64]],  // Am
    [38, [53, 57, 62]],  // Dm
    [40, [56, 59, 64]],  // E
    [45, [57, 60, 64]],  // Am
  ];
  // Melody per bar: [note, length in eighth notes]. 0 = rest.
  const MELODY = [
    [[76, 4], [72, 2], [71, 2]],
    [[69, 6], [72, 2]],
    [[67, 4], [64, 2], [67, 2]],
    [[74, 6], [71, 2]],
    [[72, 4], [71, 2], [69, 2]],
    [[65, 4], [69, 2], [74, 2]],
    [[68, 4], [71, 2], [76, 2]],
    [[69, 6], [0, 2]],
  ];
  // The second time round, the melody is sparser and lower: even the tune gives up a bit.
  const MELODY2 = [
    [[64, 6], [0, 2]],
    [[65, 4], [64, 2], [60, 2]],
    [[64, 8]],
    [[62, 4], [0, 4]],
    [[60, 4], [59, 2], [57, 2]],
    [[57, 4], [62, 4]],
    [[59, 6], [56, 2]],
    [[57, 8]],
  ];
  const ARP = [0, 1, 2, 1, 0, 1, 2, 1];
  const EIGHTH = BEAT / 2;

  TS.music = { playing: false, step: 0, loop: 0, next: 0, timer: null };

  function playStep() {
    const m = TS.music;
    const bar = Math.floor(m.step / 8), pos = m.step % 8;
    const when = m.next - actx.currentTime;
    const [bass, arp] = CHORDS[bar];
    if (pos === 0 || pos === 4) TS.beep(midi(bass), BEAT * 1.9, 'triangle', 0.07, when);
    TS.beep(midi(arp[ARP[pos]]), EIGHTH * 0.9, 'square', 0.009, when);
    // melody notes that start on this eighth
    const mel = (m.loop % 2 ? MELODY2 : MELODY)[bar];
    let at = 0;
    mel.forEach(([note, len]) => {
      if (at === pos && note) TS.beep(midi(note), EIGHTH * len * 0.95, 'square', 0.022, when);
      at += len;
    });
    m.step++;
    if (m.step >= 64) { m.step = 0; m.loop++; }
    m.next += EIGHTH;
  }

  TS.music.start = function () {
    const m = TS.music;
    if (m.playing || !actx) return;
    m.playing = true;
    m.next = actx.currentTime + 0.3;
    m.timer = setInterval(() => {
      if (!actx) return;
      if (m.next < actx.currentTime) m.next = actx.currentTime + 0.05; // tab was asleep
      while (m.next < actx.currentTime + 0.4) playStep();
    }, 100);
  };

  TS.beep = function (freq, dur, type, vol, when) {
    if (!actx || TS.muted) return;
    const t = actx.currentTime + (when || 0);
    const o = actx.createOscillator();
    const gn = actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    gn.gain.setValueAtTime(vol || 0.04, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  TS.sfx = {
    click() { TS.beep(520, 0.04, 'square', 0.03); },
    alarm() { for (let i = 0; i < 4; i++) TS.beep(1250, 0.08, 'square', 0.04, i * 0.15); },
    ring() { for (let i = 0; i < 6; i++) TS.beep(i % 2 ? 700 : 880, 0.05, 'square', 0.035, i * 0.06); },
    gulp() { TS.beep(300, 0.08, 'sine', 0.08); TS.beep(220, 0.1, 'sine', 0.08, 0.1); },
    snore() { TS.beep(70, 0.5, 'sawtooth', 0.05); TS.beep(55, 0.6, 'sawtooth', 0.04, 0.6); },
    send() { [400, 500, 600, 800].forEach((f, i) => TS.beep(f, 0.07, 'square', 0.03, i * 0.07)); },
    fail() { [300, 250, 200].forEach((f, i) => TS.beep(f, 0.15, 'square', 0.035, i * 0.15)); },
    coin() { TS.beep(990, 0.06, 'square', 0.03); TS.beep(1320, 0.12, 'square', 0.03, 0.06); },
    sad() {
      [392, 349, 330, 294, 262, 247, 262].forEach((f, i) => TS.beep(f, 0.3, 'triangle', 0.06, i * 0.32));
    },
  };
})();
