// bathroom.js – shower, toilet, mirror. Showering and the toilet also give
// a bit of energy back.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const B = () => TS.T.bath;

  const EXIT = { x: 234, y: 162, w: 54, h: 14 }; // the phone icon is in the corner
  const HOT = [
    { id: 'shower', name: 'Suihku', r: { x: 10, y: 26, w: 74, h: 150 } },
    { id: 'toilet', name: 'Vessanpönttö', r: { x: 108, y: 108, w: 46, h: 62 } },
    { id: 'mirror', name: 'Peili', r: { x: 194, y: 34, w: 68, h: 54 } },
    { id: 'brush', name: 'Hammasharja', r: { x: 248, y: 92, w: 12, h: 16 } },
    { id: 'razor', name: 'Partakone', r: { x: 200, y: 100, w: 20, h: 8 } },
    { id: 'mold', name: 'Hometaideteos', r: { x: 276, y: 22, w: 36, h: 34 } },
  ];

  function use(id) {
    const s = TS.S;
    if (id === 'shower') {
      ui.choose('Suihku. Suihkuverhossa on kuvioita. Osa niistä on tarkoituksellisia.', [
        { label: 'Käy suihkussa (20 min)', fn() {
          const again = s.showered;
          s.showered = true;
          TS.doAction({ min: 20, label: 'SUIHKU... KYLMÄÄ!', fx: { hyg: 60, energy: 15, mood: again ? 0 : 6 }, say: again ? B().showerAgain : B().shower });
        } },
        { label: 'Ei tänään' },
      ]);
    } else if (id === 'toilet') {
      const sick = s.sick;
      s.sick = false;
      TS.doAction({ min: sick ? 20 : 10, label: 'VESSASSA', fx: { energy: sick ? 8 : 5, mood: sick ? 5 : 1 }, say: sick ? B().toiletSick : TS.pick(B().toilet) });
    } else if (id === 'mirror') {
      TS.doAction({ min: 2, fx: { mood: TS.chance(0.3) ? 3 : -2 }, say: TS.pick(B().mirror) });
    } else if (id === 'brush') {
      TS.doAction({ min: 5, fx: { hyg: 8 }, say: B().teeth });
    } else if (id === 'razor') {
      if (s.shaved) { ui.say('Parta on jo ajettu. Haavat paranevat. Toisin kuin itsetunto.'); return; }
      s.shaved = true;
      TS.doAction({ min: 10, label: 'PARRANAJO', fx: { hyg: 6, mood: -2 }, say: B().shave });
    } else if (id === 'mold') {
      ui.say(B().mold);
    }
  }

  TS.scenes.bathroom = {
    hud: true,
    enter() {
      if (!TS.S.flags.bathSeen) { TS.S.flags.bathSeen = true; ui.say(B().enter); }
    },
    click(x, y) {
      if (TS.hit(EXIT, x, y)) { TS.sfx.click(); TS.go('apartment'); return; }
      const h = HOT.find((q) => TS.hit(q.r, x, y));
      if (h) use(h.id);
    },
    update(dt) { TS.idleTick(dt); },
    draw(g) {
      const R = TS.rect, s = TS.S;
      // tiles
      R(g, 0, 17, 320, 163, '#9fb3b0');
      for (let x = 0; x < 320; x += 10) R(g, x, 17, 1, 130, '#8a9e9b');
      for (let y = 20; y < 147; y += 10) R(g, 0, y, 320, 1, '#8a9e9b');
      R(g, 0, 146, 320, 34, '#5a6a6a');
      for (let x = 0; x < 320; x += 16) R(g, x, 146, 1, 34, '#4a5a5a');
      // mold art (blue period)
      R(g, 280, 26, 22, 10, '#2a3a3a'); R(g, 286, 34, 18, 12, '#2a4a40'); R(g, 296, 24, 10, 8, '#1e2e3a'); R(g, 290, 46, 6, 6, '#2a3a3a');
      // shower: rail, head, curtain
      R(g, 10, 26, 76, 2, '#c0c4c8');
      R(g, 48, 30, 2, 20, '#c0c4c8'); R(g, 44, 48, 10, 4, '#c0c4c8');
      R(g, 14, 28, 26, 146, '#c88aa0');
      for (let y = 34; y < 170; y += 12) for (let x = 16; x < 38; x += 8) R(g, x + ((y / 12) % 2) * 4, y, 3, 3, '#e8b0c4');
      R(g, 14, 160, 26, 14, '#a8708a'); R(g, 20, 150, 6, 6, '#6a7a5a'); // mold on the curtain hem
      R(g, 40, 170, 46, 4, '#d8dcdc'); // shower tray edge
      // toilet
      R(g, 112, 112, 30, 18, '#f0f0ec'); R(g, 114, 110, 26, 3, '#d8d8d4'); // tank
      R(g, 108, 130, 40, 8, '#f0f0ec'); R(g, 110, 130, 36, 2, '#c8c8c4'); // seat
      R(g, 116, 138, 24, 28, '#e8e8e4'); R(g, 114, 166, 28, 4, '#d0d0cc');
      R(g, 122, 116, 10, 2, '#a0a0a0'); // flush button
      R(g, 152, 120, 8, 10, '#f0f0ec'); R(g, 154, 118, 4, 2, '#888'); // toilet roll (last one)
      // magazines pile
      R(g, 152, 160, 18, 8, '#c84a3a'); R(g, 153, 157, 16, 3, '#3a6ac0');
      // sink + mirror
      R(g, 196, 36, 64, 52, '#c0c4c8');
      R(g, 199, 39, 58, 46, '#a8c0c8');
      // reflection: Keijo's face
      TS.drawFace(g, 200, 42, 4);
      R(g, 200, 40, 3, 30, '#d0e0e8'); R(g, 240, 44, 2, 20, '#d0e0e8'); // glare
      if (!s.shaved) { /* stubble is already in the sprite */ } else { R(g, 216, 70, 3, 2, '#c03a3a'); R(g, 236, 66, 2, 2, '#c03a3a'); }
      R(g, 228, 52, 4, 1, '#3a2a2a'); // crack
      R(g, 196, 96, 64, 10, '#f0f0ec'); R(g, 222, 100, 12, 4, '#c8c8c4');
      R(g, 210, 106, 36, 40, '#e8e8e4');
      R(g, 226, 92, 2, 4, '#c0c4c8');
      R(g, 202, 101, 14, 3, '#3a6ac0'); R(g, 214, 101, 4, 3, '#c0c4c8'); // razor
      R(g, 250, 98, 6, 8, '#3a8a6a'); R(g, 251, 92, 2, 7, '#e86a6a'); R(g, 251, 92, 2, 2, '#f0f0f0'); // cup + brush

      ui.drawTint(g, 0.5);
      if (!ui.busy()) {
        const h = HOT.find((q) => TS.hit(q.r, TS.mouse.x, TS.mouse.y));
        if (h) TS.text(g, h.name, 160, 20, '#f0c850', { align: 'center', shadow: '#000' });
      }
      TS.button(g, EXIT, 'POIS');
      ui.drawHUD(g);
    },
  };
})();
