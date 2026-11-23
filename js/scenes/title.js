// title.js – title screen: dark room, alarm clock blinking 07:00.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  let saved = null;
  let alarmT = 0;
  const NEW = { x: 104, y: 128, w: 112, h: 14 };
  const CONT = { x: 104, y: 146, w: 112, h: 14 };

  TS.scenes.title = {
    enter() {
      saved = TS.loadSave();
      if (saved && saved.ended) saved = null;
    },
    click(x, y) {
      if (TS.hit(NEW, x, y)) { TS.sfx.click(); TS.newGame(); }
      else if (saved && TS.hit(CONT, x, y)) { TS.sfx.click(); TS.continueGame(saved); }
    },
    update(dt) {
      alarmT -= dt;
      if (alarmT <= 0) { TS.sfx.alarm(); alarmT = 2.5; }
    },
    draw(g) {
      const R = TS.rect;
      R(g, 0, 0, 320, 180, '#0c0b14');
      // window with sleet
      R(g, 230, 40, 50, 46, '#2a2838'); R(g, 233, 43, 44, 40, '#141a30');
      R(g, 254, 43, 2, 40, '#2a2838'); R(g, 233, 62, 44, 2, '#2a2838');
      for (let i = 0; i < 8; i++) R(g, 234 + ((i * 13 + Math.floor(TS.realTime * 20)) % 42), 44 + ((i * 17 + Math.floor(TS.realTime * 40)) % 38), 1, 2, '#6a7488');
      // bed and Keijo
      R(g, 20, 120, 96, 14, '#2a2018'); R(g, 22, 112, 92, 9, '#5a5648'); R(g, 24, 104, 18, 9, '#6a6658');
      TS.drawLyingMan(g, 26, 88);
      R(g, 42, 96, 72, 20, '#2e3a20'); R(g, 52, 92, 20, 5, '#2e3a20');
      // nightstand + alarm clock
      R(g, 120, 112, 22, 22, '#2a2018');
      R(g, 122, 102, 18, 10, '#1a1a1a');
      if (Math.floor(TS.realTime * 2) % 2) TS.text(g, '07:00', 123, 105, '#e03a3a');
      if (Math.floor(TS.realTime * 4) % 2) TS.text(g, 'PIIP PIIP', 131, 92, '#e03a3a', { align: 'center' });
      g.globalAlpha = 0.5; R(g, 0, 0, 320, 180, '#000'); g.globalAlpha = 1;

      TS.text(g, 'TYÖTTÖMYYS-', 160, 22, '#f0c850', { s: 3, align: 'center', shadow: '#5a3a10' });
      TS.text(g, 'SIMULAATTORI', 160, 46, '#f0c850', { s: 3, align: 'center', shadow: '#5a3a10' });
      TS.text(g, 'YKSI PÄIVÄ. 24 TUNTIA. NELJÄ HAKEMUSTA. EI YHTÄÄN TOIVOA.', 160, 72, '#c8c0b0', { align: 'center' });

      TS.button(g, NEW, 'HERÄÄ (UUSI PÄIVÄ)');
      if (saved) TS.button(g, CONT, 'JATKA PÄIVÄÄ (' + TS.clockStr(saved.t) + ')');
      TS.text(g, 'M = ÄÄNET PÄÄLLE / POIS', 160, 170, '#5a5668', { align: 'center' });
    },
  };
})();
