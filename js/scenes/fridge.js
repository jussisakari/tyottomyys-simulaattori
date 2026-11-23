// fridge.js – close-up of the open fridge. Sad leftovers and the cheapest beer.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const T = () => TS.T;
  const F = () => TS.S.fridge;

  const CLOSE = { x: 234, y: 162, w: 54, h: 14 }; // the phone icon is in the corner
  let flicker = 0;

  // Each thing is drawn at its original small size (ORIG), then moved and scaled up:
  // PLACE = { cx: centre x, by: bottom y (the shelf), k: how many times bigger }.
  const ORIG = {
    fish: { x: 146, y: 36, w: 22, h: 10 },
    maka: { x: 86, y: 74, w: 46, h: 15 },
    jar: { x: 198, y: 66, w: 18, h: 22 },
    onion: { x: 98, y: 114, w: 16, h: 14 },
    pulla: { x: 132, y: 118, w: 22, h: 10 },
    makkara: { x: 160, y: 118, w: 40, h: 10 },
    nuudeli: { x: 206, y: 114, w: 22, h: 14 },
    mustard: { x: 32, y: 38, w: 14, h: 22 },
    viina: { x: 32, y: 92, w: 14, h: 22 },
    viini: { x: 48, y: 88, w: 14, h: 26 },
    leipa: { x: 200, y: 156, w: 32, h: 13 },
  };
  const PLACE = {
    fish: { cx: 160, by: 51, k: 1.7 },
    maka: { cx: 110, by: 89, k: 1.55 },
    leipa: { cx: 170, by: 89, k: 1.5 },
    jar: { cx: 225, by: 89, k: 1.45 },
    onion: { cx: 98, by: 129, k: 1.7 },
    pulla: { cx: 132, by: 129, k: 1.6 },
    makkara: { cx: 177, by: 129, k: 1.45 },
    nuudeli: { cx: 226, by: 129, k: 1.45 },
    mustard: { cx: 40, by: 62, k: 1.35 },
    viina: { cx: 33, by: 114, k: 1.3 },
    viini: { cx: 55, by: 114, k: 1.3 },
  };
  // Click areas = where the things are now
  const SPOT = {};
  Object.keys(PLACE).forEach((id) => {
    const o = ORIG[id], p = PLACE[id];
    SPOT[id] = { x: p.cx - o.w * p.k / 2, y: p.by - o.h * p.k, w: o.w * p.k, h: o.h * p.k };
  });
  function drawPlaced(g, id, fn) {
    const o = ORIG[id], p = PLACE[id];
    g.save();
    g.translate(p.cx, p.by);
    g.scale(p.k, p.k);
    g.translate(-(o.x + o.w / 2), -(o.y + o.h));
    fn();
    g.restore();
  }

  // Drinks on the bottom shelf, big: beers first, then lonkero cans.
  function drinkSpots() {
    const out = [];
    const f = F();
    let x = 80;
    for (let i = 0; i < Math.min(f.beer, 6); i++) { out.push({ kind: 'beer', r: { x: x, y: 133, w: 12, h: 36 } }); x += 14; }
    x += 2;
    for (let i = 0; i < Math.min(f.lonkero, 4); i++) { out.push({ kind: 'lonkero', r: { x: x, y: 139, w: 15, h: 30 } }); x += 17; }
    return out;
  }
  function eat(id, minutes, line, extra) {
    const f = TS.FOODS[id];
    F()[id]--;
    TS.S.flags.ate = true;
    TS.doAction({ min: minutes, label: 'NAM', fx: Object.assign({ hunger: f.hunger, mood: f.mood }, extra || {}), say: line });
  }

  function useItem(id) {
    const s = TS.S, X = T().fridge;
    if (id === 'maka') {
      const eatIt = () => {
        eat('maka', 15, X.makaEat);
        if (s.makaBad) { s.sick = true; ui.say(X.sick); TS.fx({ mood: -10, energy: -10 }); }
      };
      ui.choose(X.maka, [
        { label: 'Syö suoraan vuoasta (15 min)', fn: eatIt },
        { label: 'Haista ensin', fn() {
          ui.say(s.makaBad ? X.makaBad : X.makaOk);
          ui.choose('Syötkö?', [{ label: 'Syö silti', fn: eatIt }, { label: 'Jätä' }]);
        } },
        { label: 'Jätä' },
      ]);
    } else if (id === 'mustard') {
      if (F().mustard <= 0) { ui.say(X.mustardEmpty); return; }
      eat('mustard', 1, F().mustard === 1 ? [X.mustard, X.mustardEmpty] : X.mustard);
    } else if (id === 'jar') {
      ui.choose(X.jar, [
        { label: 'Syö se', fn() {
          eat('jar', 5, X.jarEat);
          if (TS.chance(0.5)) { s.sick = true; ui.say(X.sick); }
        } },
        { label: 'Sulje kansi nopeasti' },
      ]);
    } else if (id === 'fish') {
      ui.choose(X.fish, [{ label: 'Syö jäisenä (5 min)', fn() { eat('fish', 5, X.fishEat, { energy: -2 }); } }, { label: 'Jätä' }]);
    } else if (id === 'viini' || id === 'viina' || id === 'beer' || id === 'lonkero') {
      const d = TS.DRINKS[id];
      ui.choose(d.name + '.', [
        { label: 'Juo (10 min)', fn() { F()[id]--; TS.drink(id, 10); } },
        { label: 'Jätä myöhemmäksi' },
      ]);
    } else {
      // onion, pulla, makkara, leipa, nuudeli
      const lines = { onion: X.onion, pulla: X.pulla, makkara: X.makkara, leipa: X.leipa, nuudeli: X.nuudeli };
      eat(id, 10, lines[id]);
    }
  }

  TS.scenes.fridge = {
    hud: true,
    enter() {
      const f = F();
      const total = Object.keys(f).reduce((a, k) => a + f[k], 0);
      if (total === 0) ui.say(T().fridge.empty);
      else if (!TS.S.flags.fridgeSeen) { TS.S.flags.fridgeSeen = true; ui.say(T().fridge.open); }
    },
    click(x, y) {
      if (TS.hit(CLOSE, x, y)) { TS.sfx.click(); TS.go('apartment'); return; }
      for (const d of drinkSpots()) if (TS.hit(d.r, x, y)) { useItem(d.kind); return; }
      for (const id of Object.keys(SPOT)) {
        if (F()[id] > 0 && TS.hit(SPOT[id], x, y)) { useItem(id); return; }
      }
    },
    update(dt) {
      TS.idleTick(dt);
      flicker -= dt;
      if (flicker < -2 - Math.random() * 4) flicker = 0.12;
    },
    draw(g) {
      const R = TS.rect, f = F();
      // dark kitchen around
      R(g, 0, 17, 320, 163, '#2a2620');
      // open door on the left
      R(g, 18, 20, 52, 158, '#cfcab2');
      R(g, 22, 24, 44, 150, '#e4e0cc');
      [62, 114, 160].forEach((y) => { R(g, 24, y, 40, 3, '#b8c8cc'); R(g, 24, y - 6, 1, 6, '#b8c8cc'); R(g, 63, y - 6, 1, 6, '#b8c8cc'); });
      // fridge body
      R(g, 72, 18, 180, 160, '#bdb7a0');
      R(g, 76, 22, 172, 152, '#eeece2');
      // freezer box
      R(g, 80, 24, 164, 30, '#d8eef2');
      for (let i = 0; i < 20; i++) R(g, 82 + ((i * 37) % 160), 26 + ((i * 13) % 26), 3, 1, '#ffffff');
      R(g, 80, 54, 164, 2, '#a8b8bc');
      // light bulb
      R(g, 156, 58, 12, 4, '#fff8c8');
      // shelves
      [89, 129, 169].forEach((y) => R(g, 78, y, 168, 2, '#b8c8cc'));
      R(g, 78, 171, 168, 3, '#d0d0c8');
      // a sad stain
      R(g, 120, 126, 14, 3, '#d8c890');

      // things (each drawn small, then placed and scaled up)
      const R2 = (x, y, w, h, c) => R(g, x, y, w, h, c);
      const DRAW = {
        fish() { R2(148, 40, 18, 5, '#e09a40'); R2(148, 40, 18, 1, '#f0c070'); },
        maka() {
          R2(86, 80, 46, 9, '#8a8a90'); R2(88, 77, 42, 4, '#d8a040');
          R2(95, 77, 3, 2, '#6a8a3a'); R2(112, 78, 4, 2, '#6a8a3a'); R2(122, 77, 2, 2, '#4a6a2a');
        },
        jar() {
          R2(200, 66, 14, 3, '#b0a040'); R2(199, 69, 16, 19, '#c8dce0');
          R2(200, 76, 14, 12, '#4a2a4a'); R2(201, 74, 6, 2, '#7aa050'); R2(207, 73, 5, 3, '#9ac070');
        },
        onion() { R2(100, 118, 12, 10, '#a05a8a'); R2(102, 120, 8, 6, '#f0e0f0'); R2(104, 122, 4, 2, '#c0a0c0'); },
        pulla() { R2(134, 121, 18, 7, '#d8a060'); R2(136, 120, 14, 2, '#e8c080'); R2(140, 122, 2, 1, '#fff'); R2(145, 123, 2, 1, '#fff'); },
        makkara() { R2(162, 122, 36, 6, '#a04a3a'); R2(160, 123, 2, 4, '#e8d8c0'); R2(198, 123, 2, 4, '#e8d8c0'); },
        nuudeli() { R2(206, 116, 22, 12, '#e8c040'); R2(208, 119, 18, 2, '#c03a3a'); },
        leipa() { R2(202, 158, 28, 11, '#5a3a20'); R2(204, 156, 24, 3, '#6a4a2a'); },
        mustard() { R2(36, 42, 8, 18, '#e8c020'); R2(38, 38, 4, 4, '#c03a3a'); },
        viina() { TS.drawFlask(g, 34, 94, 2); },
        viini() { TS.drawTetra(g, 48, 90, 2); },
      };
      Object.keys(DRAW).forEach((id) => { if (f[id] > 0) drawPlaced(g, id, DRAW[id]); });
      drinkSpots().forEach((d) => {
        if (d.kind === 'beer') TS.drawBottle(g, d.r.x, d.r.y, 3);
        else TS.drawCan(g, d.r.x, d.r.y + 3, 3);
      });
      // labels on the front edge of the bottom shelf
      if (f.beer > 0) TS.text(g, 'KALJAASI III x' + f.beer, 80, 170.5, '#5c3b17', { s: 0.8, bold: true });
      if (f.lonkero > 0) TS.text(g, 'LONKERO x' + f.lonkero, 182, 170.5, '#3c5aa8', { s: 0.8, bold: true });
      // the light flickers
      if (flicker > 0) { g.globalAlpha = 0.45; R(g, 18, 17, 234, 163, '#000'); g.globalAlpha = 1; }

      // hover name
      const hv = hoverName();
      if (hv && !ui.busy()) TS.text(g, hv, 160, 20, '#f0c850', { align: 'center', shadow: '#000' });

      TS.button(g, CLOSE, 'SULJE OVI');
      ui.drawHUD(g);
    },
  };

  function hoverName() {
    const mx = TS.mouse.x, my = TS.mouse.y;
    for (const d of drinkSpots()) if (TS.hit(d.r, mx, my)) return TS.DRINKS[d.kind].name;
    for (const id of Object.keys(SPOT)) {
      if (F()[id] > 0 && TS.hit(SPOT[id], mx, my)) return (TS.FOODS[id] || TS.DRINKS[id]).name;
    }
    return '';
  }
})();
