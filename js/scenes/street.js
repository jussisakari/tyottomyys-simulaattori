// street.js – outside: home, the corner shop (with a trash bin in front),
// Alko, the bar and the park.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const T = () => TS.T;

  const FOOT_Y = 174;
  const walker = { x: 30, target: null, dir: 1, onArrive: null };
  let ringTimer = 0;

  // Opening hours in minutes of the day.
  TS.isOpen = function (id, t) {
    const m = t % 1440;
    if (id === 'store') return true; // Ass-market is open 24/7
    if (id === 'alko') return m >= 9 * 60 && m < 21 * 60;
    if (id === 'bar') return m >= 9 * 60 || m < 3 * 60; // Istuva Härkä opens at 9
    return true;
  };
  const NAMES = { store: 'Ass-market', alko: 'Alko', bar: 'Istuva Härkä', park: 'Puisto' };

  const HOT = [
    { id: 'home', name: 'Koti', r: { x: 14, y: 110, w: 30, h: 44 }, stand: 30 },
    { id: 'bin', name: 'Roskis', r: { x: 128, y: 128, w: 14, h: 24 }, stand: 135 },
    { id: 'store', name: 'Ass-market', r: { x: 62, y: 70, w: 64, h: 84 }, stand: 96 },
    { id: 'alko', name: 'Alko', r: { x: 146, y: 66, w: 54, h: 88 }, stand: 174 },
    { id: 'bar', name: 'Istuva Härkä', r: { x: 206, y: 72, w: 52, h: 82 }, stand: 232 },
    { id: 'park', name: 'Puisto', r: { x: 262, y: 60, w: 58, h: 94 }, stand: 292 },
  ];
  // The morning queue outside Alko: [x, colours, stamping feet]
  const ALKO_QUEUE = [
    [154, { w: '#3a5a3a', W: '#2a4a2a', h: '#8a8a8a', j: '#3a3a4a', J: '#2a2a3a', cap: '#6a2a2a' }, false],
    [171, { w: '#6a5a3a', W: '#4a3e28', h: '#3a2a20', b: '#5a4a3a', j: '#2c3a55', J: '#22304a' }, true],
    [189, { w: '#4a4a6a', W: '#36364e', h: '#c8c0b8', b: '#b8b0a8', j: '#4a4a3a', J: '#3a3a2a' }, false],
  ];
  TS.streetStand = (id) => (HOT.find((h) => h.id === id) || HOT[0]).stand;

  function use(h) {
    const s = TS.S;
    if (h.id === 'home') {
      TS.doAction({ min: 10, label: 'PORTAAT YLÖS', fx: { energy: -2 }, say: T().street.home, after() { TS.man.x = 22; TS.go('apartment'); } });
    } else if (h.id === 'bin') {
      binSearch();
    } else if (!TS.isOpen(h.id, s.t)) {
      ui.say(h.id === 'alko' && s.t % 1440 < 9 * 60 ? T().alko.early : T().street.closed.replace('{p}', NAMES[h.id]));
    } else {
      TS.go('place', { id: h.id });
    }
  }

  function binSearch() {
    const s = TS.S, X = T().street;
    if (s.binSearches >= 3) { ui.say(X.binNone); return; }
    ui.choose(X.bin, [
      { label: 'Kaiva pulloja (10 min)', fn() {
        s.binSearches++;
        const n = TS.rand(0, 3);
        s.bottleBag += n; // straight into the plastic bag
        const line = n === 0 ? X.binZero : TS.pick(X.binFind).replace('{n}', n);
        TS.doAction({ min: 10, label: 'KAIVELET...', fx: { hyg: -4, mood: -3 }, say: line });
      } },
      { label: 'Ei sentään' },
    ]);
  }

  TS.scenes.street = {
    hud: true,
    enter(arg) {
      arg = arg || {};
      TS.S.outside = true;
      walker.x = arg.from && arg.from !== 'home' ? TS.streetStand(arg.from) : 30;
      walker.target = null;
      walker.onArrive = null;
      if (arg.from === 'home' && TS.ui.isDark() && !TS.S.flags.darkOut) { TS.S.flags.darkOut = true; ui.say(T().street.dark); }
    },
    click(x, y) {
      if (y < 17) return;
      const h = HOT.find((q) => TS.hit(q.r, x, y));
      if (h) { walker.target = h.stand; walker.onArrive = () => use(h); }
      else if (y > 150) { walker.target = TS.clamp(x, 10, 310); walker.onArrive = null; }
    },
    update(dt) {
      if (walker.target != null && !ui.busy()) {
        const d = walker.target - walker.x;
        const step = 46 * dt;
        if (Math.abs(d) <= step) {
          walker.x = walker.target;
          walker.target = null;
          const cb = walker.onArrive;
          walker.onArrive = null;
          if (cb) cb();
        } else { walker.x += Math.sign(d) * step; walker.dir = Math.sign(d); }
      }
      TS.idleTick(dt);
      if (TS.S.phone) { ringTimer -= dt; if (ringTimer <= 0) { TS.sfx.ring(); ringTimer = 1.6; } }
    },
    draw(g) {
      const R = TS.rect, s = TS.S;
      const m = s.t % 1440;
      const dark = ui.isDark();
      // sky
      let sky = dark ? '#0e1226' : (m < 9 * 60 + 30 || m >= 15 * 60) ? '#3c3a52' : '#8a919a';
      R(g, 0, 17, 320, 140, sky);
      // far blocks of flats
      R(g, 0, 50, 320, 100, dark ? '#181a26' : '#6a6f78');
      for (let i = 0; i < 40; i++) {
        const wx = (i * 37) % 316, wy = 56 + ((i * 11) % 5) * 9;
        R(g, wx, wy, 3, 4, dark && (i * 7) % 3 === 0 ? '#e8c860' : dark ? '#22253a' : '#5a5f68');
      }

      // home block
      R(g, 0, 30, 58, 124, '#8a8478'); R(g, 0, 30, 58, 3, '#6a6458');
      for (let i = 0; i < 8; i++) R(g, 6 + (i % 3) * 18, 40 + Math.floor(i / 3) * 24, 10, 12, dark ? ((i === 4) ? '#e8c860' : '#2a2c3a') : '#4a5060');
      R(g, 18, 118, 22, 36, '#4a3a2a'); R(g, 20, 120, 18, 34, '#6b4a2e'); R(g, 34, 136, 2, 3, '#c9a640');
      TS.text(g, 'A', 27, 110, '#e8e0c8');

      // corner shop
      R(g, 62, 72, 64, 82, '#b8b0a0');
      R(g, 62, 73, 64, 13, '#f4f2ec'); // white facade band with the yellow brush-stroke sign
      TS.brushSign(g, 63, 74, 62, 11, 'ASS-MARKET', 1.05);
      R(g, 66, 90, 34, 40, '#a8c8d8'); R(g, 104, 96, 18, 58, '#7a9aa8');
      // round 24/7 sticker on the window (Ass-market never closes)
      TS.ell(g, 78, 101, 9, 9, '#16214e', '#ffe500', 0.8);
      TS.text(g, '24/7', 78, 98.6, '#ffe500', { align: 'center', bold: true, s: 0.85 });
      R(g, 86, 108, 12, 14, '#ffffff'); R(g, 88, 110, 8, 3, '#3c5aa8');
      const storeOpen = TS.isOpen('store', s.t);
      if (dark && storeOpen) { g.globalAlpha = 0.35; R(g, 66, 90, 56, 64, '#fff8c8'); g.globalAlpha = 1; }
      // trash bin
      R(g, 129, 132, 12, 20, '#3a6a3a'); R(g, 128, 130, 14, 3, '#2a4a2a'); R(g, 131, 136, 8, 2, '#1e1e1e');
      if (s.binSearches < 3) { R(g, 131, 127, 2, 4, TS.PAL.t); R(g, 136, 128, 3, 3, '#c8ccd2'); }

      // Alko
      R(g, 146, 66, 54, 88, '#9a9488');
      TS.alkoLogo(g, 173, 77, 9.5); // the round red Alko sign
      R(g, 150, 88, 46, 36, '#8aa8b0');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(g, 154 + i * 10, 92 + j * 11, 3, 8, ['#6a1f2e', '#cfe3ea', '#5c3b17', '#3a6a3a'][(i + j) % 4]);
      R(g, 164, 128, 18, 26, '#5a6a70');
      if (!TS.isOpen('alko', s.t)) TS.text(g, 'SULJETTU', 173, 136, '#c03a3a', { align: 'center' });

      // bar
      R(g, 206, 72, 52, 82, '#5a4a40');
      const neon = TS.isOpen('bar', s.t) && Math.floor(TS.realTime * 2) % 5 !== 0;
      R(g, 210, 76, 44, 12, '#1e1a1e');
      TS.text(g, 'ISTUVA HÄRKÄ', 232, 79.5, neon ? '#f070b0' : '#5a3a4a', { align: 'center', s: 0.78, bold: true });
      R(g, 212, 94, 40, 26, '#2a1e18'); R(g, 214, 96, 36, 22, dark ? '#c8803a' : '#4a3a2a');
      R(g, 226, 124, 14, 30, '#3a2a20');
      TS.text(g, 'PUB', 232, 112, '#e8c860', { align: 'center', bold: true });

      // park: trees, bench, lamp
      R(g, 262, 120, 58, 34, dark ? '#1e2a1e' : '#4a6a3a');
      R(g, 272, 92, 4, 40, '#4a3a2a'); R(g, 262, 72, 24, 26, dark ? '#1a2a1a' : '#3a5a2a');
      R(g, 302, 96, 4, 36, '#4a3a2a'); R(g, 292, 80, 24, 22, dark ? '#1a2a1a' : '#3a5a2a');
      R(g, 280, 136, 24, 3, '#6b4a2e'); R(g, 282, 139, 2, 8, '#3a3a3a'); R(g, 300, 139, 2, 8, '#3a3a3a'); R(g, 280, 130, 24, 2, '#6b4a2e');
      R(g, 314, 70, 2, 84, '#2a2a2a'); R(g, 310, 68, 8, 3, dark ? '#fff0a0' : '#555');
      TS.text(g, 'PUISTO', 290, 64, '#e8e0c8', { align: 'center', shadow: '#000' });

      // sidewalk + street
      R(g, 0, 154, 320, 26, '#7a7a78');
      for (let x = 0; x < 320; x += 20) R(g, x, 154, 1, 26, '#6a6a68');
      R(g, 0, 154, 320, 1, '#5a5a58');
      R(g, 40, 170, 18, 2, '#5a6a7a'); R(g, 190, 166, 22, 3, '#5a6a7a'); // puddles

      // sleet
      for (let i = 0; i < 26; i++) {
        const px = (i * 47 + Math.floor(TS.realTime * 25)) % 320;
        const py = 17 + ((i * 29 + Math.floor(TS.realTime * 60)) % 160);
        R(g, px, py, 1, 2, '#c8d0d8');
      }

      const walking = walker.target != null && !ui.busy();
      ui.drawTint(g, 0.6);
      if (dark) { g.globalAlpha = 0.2; R(g, 296, 70, 24, 90, '#fff0a0'); g.globalAlpha = 1; }
      // Before Alko opens at 9, the regulars wait outside the door, stamping their feet
      const mm = s.t % 1440;
      if (mm >= 6 * 60 && mm < 9 * 60) {
        ALKO_QUEUE.forEach(([qx, look, stamp], i) => TS.drawMan(g, qx, FOOT_Y - (i % 2), 1, stamp, true, look));
      }
      TS.drawMan(g, walker.x, FOOT_Y, walker.dir, walking, true); // after the tint: solid
      ui.drawHUD(g);
      if (!ui.busy()) {
        const h = HOT.find((q) => TS.hit(q.r, TS.mouse.x, TS.mouse.y));
        if (h) {
          const open = TS.isOpen(h.id, s.t);
          const label = h.name + (open ? '' : ' (KIINNI)');
          TS.text(g, label, 160, 20, open ? '#f0c850' : '#d0544a', { align: 'center', shadow: '#000' });
        }
      }
    },
  };
})();
