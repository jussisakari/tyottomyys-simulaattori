// tarja.js – Tarja's apartment. You get here by taxi (10 €) if the booty call
// goes well. Everything here is one conversation (TS.CALLS.tarjaVisit).
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;

  TS.scenes.tarja = {
    hud: true,
    enter() {
      TS.S.outside = true; // away from home: no neighbour knocking on your door
      TS.S.flags.candle = false;
      TS.talk(TS.CALLS.tarjaVisit, 'start', TS.tarjaCtx);
    },
    click() {},
    update() {},
    draw(g) {
      const R = TS.rect, s = TS.S;
      const candle = s.flags.candle;
      // a tidy, warm home: everything Keijo's place is not
      R(g, 0, 17, 320, 125, '#d8b890');
      for (let x = 10; x < 320; x += 20) R(g, x, 17, 6, 125, '#d0ae84');
      R(g, 0, 140, 320, 40, '#8a5a3a');
      for (let x = 0; x < 320; x += 30) R(g, x, 140, 1, 40, '#7a4e32');
      R(g, 90, 148, 140, 26, '#a04a4a'); R(g, 94, 151, 132, 20, '#b85a5a'); // rug
      // window with curtains
      R(g, 30, 38, 50, 52, '#1a2240'); TS.ell(g, 44, 52, 1, 1, '#fff'); TS.ell(g, 66, 46, 0.8, 0.8, '#fff');
      R(g, 24, 34, 14, 62, '#7a3a5a'); R(g, 72, 34, 14, 62, '#7a3a5a');
      // bookshelf and a plant
      R(g, 250, 50, 50, 90, '#6b4a2e');
      for (let i = 0; i < 4; i++) {
        R(g, 252, 70 + i * 20, 46, 2, '#4f3520');
        for (let b = 0; b < 8; b++) R(g, 254 + b * 5.5, 56 + i * 20, 4, 14, ['#3a6ac0', '#c03a3a', '#e8c040', '#4a8a4a'][(b + i) % 4]);
      }
      TS.rbox(g, 228, 118, 14, 22, 3, '#c86a3a');
      TS.ell(g, 235, 110, 10, 12, '#3a7a3a'); TS.ell(g, 229, 104, 5, 7, '#4a8a4a'); TS.ell(g, 241, 102, 5, 8, '#4a8a4a');
      // framed photo: a cat. Of course.
      R(g, 120, 44, 24, 20, '#c9a640'); R(g, 122, 46, 20, 16, '#e8e0d0'); TS.ell(g, 132, 56, 5, 4, '#e09040');
      // sofa
      TS.rbox(g, 100, 104, 110, 22, 6, '#3a5a7a', '#24384c');
      TS.rbox(g, 96, 118, 118, 22, 6, '#4a6a8a', '#24384c');
      TS.rbox(g, 120, 108, 18, 12, 4, '#e8c040'); // cushion
      // the cat on the windowsill, judging you like a TE official
      R(g, 22, 90, 66, 4, '#e8dcc8');
      TS.ell(g, 64, 85, 9, 5.5, '#e09040', '#5a3a1a');
      TS.ell(g, 72, 79, 5, 4.5, '#e09040', '#5a3a1a');
      R(g, 69, 73.5, 2, 3, '#e09040'); R(g, 74, 73.5, 2, 3, '#e09040');
      TS.ell(g, 70.5, 78.5, 0.9, 0.9, '#2a6a2a'); TS.ell(g, 73.8, 78.5, 0.9, 0.9, '#2a6a2a');
      R(g, 54, 84, 2, 8, '#e09040'); // tail
      // a small shelf for the candle
      R(g, 150, 92, 26, 2, '#6b4a2e');
      // Keijo and Tarja drawn big, so their faces show above the dialog box
      big(g, 105, 150, () => TS.drawMan(g, 0, 0, 1, false, true));
      big(g, 215, 150, () => TS.pixelDraw(g, -15, -70, 30, 74, TS.CHAR_RES, (p) => drawTarja(p, 0, 0)));
      // lighting: a lamp, or a candle after the honest answer
      if (candle) {
        g.globalAlpha = 0.45; R(g, 0, 17, 320, 163, '#1a1020'); g.globalAlpha = 1;
        TS.rect(g, 161, 84, 4, 8, '#f0f0e0');
        TS.ell(g, 163, 82, 1.6, 2.6 + Math.sin(TS.realTime * 9) * 0.4, '#ffc040');
        g.globalAlpha = 0.18; TS.ell(g, 163, 82, 70, 50, '#ffb040'); g.globalAlpha = 1;
      } else {
        g.globalAlpha = 0.08; R(g, 0, 17, 320, 163, '#ffd080'); g.globalAlpha = 1;
      }
      ui.drawHUD(g);
    },
  };

  // Draws something 1.5x bigger, feet at (x, y).
  function big(g, x, y, fn) {
    g.save();
    g.translate(x, y);
    g.scale(1.5, 1.5);
    fn();
    g.restore();
  }

  // Tarja, mid-40s: blonde ponytail, cardigan, arms crossed.
  function drawTarja(g, x, footY) {
    const OL = '#2a2320';
    g.save();
    g.translate(x, footY);
    TS.rbox(g, -6, -16, 5, 15, 2.4, '#3a3a4a', OL); TS.rbox(g, 1, -16, 5, 15, 2.4, '#3a3a4a', OL);
    TS.ell(g, -3.5, -1.2, 3.6, 1.8, '#5a2a2a', OL); TS.ell(g, 3.5, -1.2, 3.6, 1.8, '#5a2a2a', OL);
    TS.rbox(g, -9, -40, 18, 26, 6, '#7a4a8a', OL);         // cardigan
    TS.rect(g, -1, -39, 2, 24, '#5a3a6a');
    TS.rbox(g, -10, -32, 20, 5, 2.5, '#7a4a8a', OL);       // crossed arms
    TS.ell(g, -9, -29.5, 2, 2, '#f0c8a8', OL); TS.ell(g, 9, -29.5, 2, 2, '#f0c8a8', OL);
    TS.rbox(g, -2, -44, 4, 5, 1, '#e0b090');
    TS.ell(g, 9, -52, 3, 6, '#e8c870', OL);                // ponytail
    TS.ell(g, 0, -50, 7, 7.5, '#e8c870', OL);              // hair
    TS.ell(g, -1, -48.5, 5.6, 6.2, '#f0c8a8', OL);         // face (looking left at Keijo)
    TS.ell(g, -3.5, -49.5, 0.8, 0.8, '#2a2a3a');
    TS.ell(g, 0.5, -49.5, 0.8, 0.8, '#2a2a3a');
    TS.ell(g, -3.5, -47.4, 1.2, 0.6, '#e0a0a0');           // a little blush
    g.lineWidth = 0.6; g.strokeStyle = '#a04050';
    g.beginPath(); g.moveTo(-3.2, -45); g.lineTo(-0.4, -45.3); g.stroke();
    g.restore();
  }
})();
