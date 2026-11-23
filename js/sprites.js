// sprites.js – colours and the drawing of Keijo, plus small drawn things
// (bottles, cans) that many scenes use.
window.TS = window.TS || {};

// Palette letters used in the sprite grids.
TS.PAL = {
  h: '#6c655d', // hair (going grey)
  s: '#e2b593', // skin
  S: '#c48f6e', // skin shadow
  e: '#1e1a18', // eye
  b: '#8d7363', // stubble
  w: '#7d838c', // college shirt
  W: '#626872', // shirt shadow
  y: '#b19a4c', // old stain
  p: '#34508a', // boxer shorts
  P: '#c9cbd6', // boxer pattern
  f: '#d9d2bd', // tennis socks (once white)
  j: '#3a4a6a', // jeans (when he goes out)
  J: '#2c3a55',
  t: '#5c3b17', // beer bottle brown
  l: '#d9c25a', // label
};

(function () {
  const TS = window.TS;

  // ---------------------------------------------------------------------
  // Keijo, drawn with smooth shapes and some shading. Looking right (a bit
  // towards us), (0,0) = between his feet, up is minus. About 66 units tall:
  // real-ish proportions, a heavy belly, grey stubble and a receding hairline.
  // ---------------------------------------------------------------------
  const OL = 'rgba(42,32,28,0.8)'; // soft outline

  // A rounded, tapering limb from (x1,y1) to (x2,y2), widths w1 -> w2.
  function limb(g, x1, y1, x2, y2, w1, w2, fill) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const nx = -Math.sin(a), ny = Math.cos(a);
    g.beginPath();
    g.moveTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
    g.lineTo(x2 + nx * w2 / 2, y2 + ny * w2 / 2);
    g.arc(x2, y2, w2 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
    g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
    g.arc(x1, y1, w1 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = 0.45;
    g.strokeStyle = OL;
    g.stroke();
  }

  // Point at distance d from (x,y) in direction ang (0 = straight down).
  const down = (x, y, ang, d) => [x - Math.sin(ang) * d, y + Math.cos(ang) * d];

  function drawBody(g, o) {
    const P = Object.assign({}, TS.PAL, o.look || {}); // o.look = other colours (Tarmo)
    const outside = o.outside;
    const sw = o.walking ? Math.sin(TS.realTime * 8) : 0;

    if (!o.headOnly) {
      // ---- legs: hip -> knee -> ankle. Back leg first, a bit darker.
      const leg = (hx, ang, fill, foot) => {
        const [kx, ky] = down(hx, -29, ang, 13.5);
        const bend = ang > 0 ? -ang * 0.9 : ang * 0.2;
        const [ax, ay] = down(kx, ky, ang + bend, 12.5);
        limb(g, hx, -29, kx, ky, 6.6, 4.8, fill);
        limb(g, kx, ky, ax, ay, 4.8, 3.2, fill);
        TS.ell(g, ax + 1.6, ay + 1.1, 3.3, 1.6, foot, OL, 0.45);
      };
      const legC = outside ? P.j : P.s, legD = outside ? P.J : P.S;
      const foot = outside ? '#2a2a2e' : P.f, footD = outside ? '#1a1a1e' : '#bfb8a2';
      leg(-1.6, -sw * 0.45, legD, footD);
      leg(1.8, sw * 0.45, legC, foot);
      if (!outside) { // hairy shins
        g.globalAlpha = 0.35; g.lineWidth = 0.3; g.strokeStyle = '#6a5040';
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(1 + i * 0.6, -12 + i * 1.5); g.lineTo(1.6 + i * 0.6, -12.8 + i * 1.5); g.stroke(); }
        g.globalAlpha = 1;
      }

      // ---- boxers (or jeans top + belt)
      TS.rbox(g, -6.2, -35, 13.6, 9, 3, outside ? P.j : P.p, OL, 0.45);
      if (outside) TS.rect(g, -6, -33.5, 13.2, 1.2, '#2a2420');
      else for (let i = 0; i < 7; i++) TS.ell(g, -4.6 + i * 2, -31.5 + (i % 2) * 2.6, 0.55, 0.55, P.P);

      // ---- back arm (behind the body)
      const armBack = sw * 0.35;
      const [ebx, eby] = down(-2.2, -48.5, armBack, 10.5);
      const [wbx, wby] = down(ebx, eby, armBack - 0.25, 9.5);
      limb(g, -2.2, -48.5, ebx, eby, 5, 4.2, P.W);
      limb(g, ebx, eby, wbx, wby, 4.2, 3.6, P.W);
      TS.ell(g, wbx - 0.2, wby + 1.8, 1.8, 2.3, P.S, OL, 0.4);

      // ---- torso: the college shirt over a heavy belly, shaded front to back
      const grad = g.createLinearGradient(-7, 0, 13, 0);
      grad.addColorStop(0, P.W);
      grad.addColorStop(0.55, P.w);
      grad.addColorStop(1, P.W);
      g.beginPath();
      g.moveTo(-4.2, -52);
      g.bezierCurveTo(-7.2, -47, -7.8, -38, -6.6, -30.5);
      g.lineTo(5.5, -30.5);
      g.bezierCurveTo(12.8, -32.5, 13.6, -43, 6.4, -49.2);
      g.bezierCurveTo(4.8, -51.4, 1.6, -53, -4.2, -52);
      g.closePath();
      g.fillStyle = grad; g.fill();
      g.lineWidth = 0.5; g.strokeStyle = OL; g.stroke();
      // belly skin peeking out under the hem
      g.save();
      g.beginPath(); g.rect(-8, -31, 22, 3); g.clip(); // only the strip under the hem
      TS.ell(g, 4.6, -31, 4.6, 2, P.s, OL, 0.4);
      g.restore();
      TS.ell(g, 6.2, -30.2, 0.45, 0.3, P.S); // belly button
      // ribbed hem, folds and old stains
      g.lineWidth = 0.35; g.strokeStyle = P.W;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-5.5 + i * 2, -32.6); g.lineTo(-5.5 + i * 2, -30.8); g.stroke(); }
      g.globalAlpha = 0.5; g.lineWidth = 0.4;
      g.beginPath(); g.moveTo(-3, -44); g.quadraticCurveTo(2, -42, 6, -45); g.stroke();
      g.beginPath(); g.moveTo(-2, -38); g.quadraticCurveTo(4, -35.5, 9, -38); g.stroke();
      g.globalAlpha = 0.75;
      TS.ell(g, 8.6, -40.5, 1.6, 1.1, P.y);
      TS.ell(g, 5.2, -36.4, 1, 0.75, P.y);
      TS.ell(g, 10, -36, 0.7, 0.6, P.y);
      g.globalAlpha = 1;

      // ---- neck (thick) and collar
      limb(g, 0.6, -51.6, 1.4, -55.4, 4.6, 4.4, P.S);
      g.lineWidth = 1; g.strokeStyle = P.W;
      g.beginPath(); g.moveTo(-2.2, -52.3); g.quadraticCurveTo(1, -50.6, 4.2, -52); g.stroke();

      // ---- front arm, swings when walking
      const armF = -sw * 0.35;
      const [efx, efy] = down(0.8, -48.5, armF, 10.5);
      const [wfx, wfy] = down(efx, efy, armF - 0.3, 9.5);
      limb(g, 0.8, -48.5, efx, efy, 5.2, 4.4, P.w);
      limb(g, efx, efy, wfx, wfy, 4.4, 3.8, P.w);
      TS.rbox(g, wfx - 2, wfy - 1.4, 4, 1.6, 0.6, P.W); // cuff
      TS.ell(g, wfx + 0.3, wfy + 1.9, 1.9, 2.4, P.s, OL, 0.4);
      TS.ell(g, wfx + 1.4, wfy + 1.2, 0.7, 1.1, P.s, OL, 0.3); // thumb
    }

    drawHead(g, P);
  }

  function drawHead(g, P) {
    const DARK = '#3a302a';
    // skull with a soft highlight
    const rg = g.createRadialGradient(2.2, -63, 0.5, 1, -60, 7);
    rg.addColorStop(0, '#f0caa8');
    rg.addColorStop(1, P.s);
    TS.ell(g, 0.6, -60.8, 4.9, 5.8, rg, OL, 0.45);
    // heavy lower face / jowls and a double chin
    TS.ell(g, 2.4, -57.8, 4.5, 3.9, P.s, OL, 0.45);
    TS.ell(g, 0.6, -60.8, 4.5, 5.4, rg);   // hide the seam between skull and jaw
    TS.ell(g, 2.2, -55.2, 3.2, 1.4, P.S, OL, 0.35);
    // stubble: a grey shadow on the jaw, plus little dots
    g.save();
    g.beginPath(); g.ellipse(2.4, -57.8, 4.4, 3.8, 0, 0, Math.PI * 2); g.clip();
    g.globalAlpha = 0.42;
    TS.ell(g, 3, -56.4, 4.6, 3, P.b);
    g.globalAlpha = 0.6;
    for (let i = 0; i < 26; i++) TS.rect(g, -0.5 + (i * 37 % 70) / 10, -59.2 + (i * 23 % 45) / 10, 0.22, 0.22, '#5a4a40');
    g.restore();
    g.globalAlpha = 1;
    // ear
    TS.ell(g, -1.7, -60.2, 1.3, 1.9, P.S, OL, 0.4);
    TS.ell(g, -1.5, -60.2, 0.55, 1, '#b07a5c');
    // cheek redness (beer and November)
    g.globalAlpha = 0.28; TS.ell(g, 3.8, -58.8, 1.6, 1.1, '#d8705a'); g.globalAlpha = 1;
    // eye: small, tired, with a heavy lid and a bag under it
    TS.ell(g, 3.9, -61.3, 1.15, 0.62, '#efe9df');
    TS.ell(g, 4.45, -61.25, 0.5, 0.52, '#4a3a2e');
    TS.ell(g, 4.6, -61.4, 0.15, 0.15, '#fff');
    g.lineWidth = 0.5; g.strokeStyle = DARK;
    g.beginPath(); g.moveTo(2.7, -61.5); g.quadraticCurveTo(3.9, -62.15, 5.1, -61.5); g.stroke();
    g.lineWidth = 0.3; g.strokeStyle = '#a8785c';
    g.beginPath(); g.arc(4, -60.4, 1.2, 0.3, Math.PI - 0.3); g.stroke();
    // eyebrow: thick and greying
    g.lineWidth = 0.9; g.lineCap = 'round'; g.strokeStyle = '#5a5048';
    g.beginPath(); g.moveTo(2.3, -62.9); g.quadraticCurveTo(3.8, -63.5, 5.2, -62.8); g.stroke();
    // nose: big and a bit red at the tip
    g.beginPath();
    g.moveTo(4.9, -62.2);
    g.quadraticCurveTo(6.2, -60.4, 7.1, -58.9);
    g.quadraticCurveTo(7.3, -58.1, 6.3, -58);
    g.quadraticCurveTo(5.6, -57.9, 5.2, -58.4);
    g.fillStyle = P.s; g.fill();
    g.lineWidth = 0.4; g.strokeStyle = OL; g.stroke();
    g.globalAlpha = 0.45; TS.ell(g, 6.5, -58.7, 0.8, 0.6, '#d87a68'); g.globalAlpha = 1;
    TS.ell(g, 5.9, -58.3, 0.35, 0.25, '#7a4a3a'); // nostril
    // mouth: flat, the corner turning down
    g.lineWidth = 0.45; g.strokeStyle = '#7a4a40';
    g.beginPath(); g.moveTo(4.1, -56.4); g.quadraticCurveTo(5, -56.6, 5.9, -56.8); g.stroke();
    g.beginPath(); g.moveTo(4.1, -56.4); g.lineTo(3.8, -56); g.stroke();
    // forehead lines
    g.globalAlpha = 0.35; g.lineWidth = 0.3; g.strokeStyle = '#9a6a50';
    g.beginPath(); g.moveTo(1.6, -64.4); g.quadraticCurveTo(3, -64.8, 4.4, -64.2); g.stroke();
    g.beginPath(); g.moveTo(1.8, -65.3); g.quadraticCurveTo(3, -65.6, 4, -65.1); g.stroke();
    g.globalAlpha = 1;
    // hair: short and grey at the back and sides, thin on top (or a cap)
    TS.ell(g, -2.6, -61.4, 2.7, 4.6, P.h);
    TS.ell(g, -0.6, -64.6, 3.4, 1.9, P.h);
    TS.ell(g, -3.2, -59, 1.4, 2.4, P.h);
    g.lineWidth = 0.35; g.strokeStyle = '#a8a29a';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-4.6 + i * 0.6, -63.5 + i * 0.3); g.lineTo(-3.4 + i * 0.6, -61 + i * 0.3); g.stroke(); }
    if (P.cap) {
      TS.ell(g, 0, -64.6, 5.4, 2.8, P.cap, OL, 0.45);
      TS.rbox(g, 2.5, -64.6, 6.4, 1.6, 0.8, P.cap, OL, 0.4);
    } else {
      g.lineWidth = 0.3; g.strokeStyle = P.h;
      [[0.2, -65.8, 2.4, -66.4], [1, -65.6, 3.4, -65.9], [-0.6, -65.9, 1.2, -66.7]].forEach(([x1, y1, x2, y2]) => {
        g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, y2 - 0.6, x2, y2); g.stroke();
      });
    }
    g.lineCap = 'butt';
  }

  // look = optional other colours, e.g. for Tarmo: { w: shirt, W: shirt shadow, h: hair, cap }
  // All characters are drawn with TS.pixelDraw: the same shapes, but in chunky pixels.
  // CHAR_RES = pixels per game unit (1.5 = one character pixel is 2x2 screen pixels).
  TS.CHAR_RES = 1.5;
  // The colours characters may use. Soft edges snap to these, so they look like pixel art.
  TS.setCharPalette([
    '#2a201c', '#3a302a', '#1e1a18', '#ffffff', '#efe9df',
    // Keijo: skin, hair, stubble, shirt (+ a middle shade), boxers, socks, jeans
    '#f0caa8', '#e2b593', '#d3a280', '#c48f6e', '#b07a5c', '#a8785c', '#d8705a', '#d87a68', '#7a4a3a', '#7a4a40',
    '#6c655d', '#a8a29a', '#5a5048', '#8d7363', '#5a4a40', '#9a6a50', '#6a5040', '#4a3a2e',
    '#8f959d', '#7d838c', '#6f757e', '#626872', '#b19a4c',
    '#34508a', '#c9cbd6', '#d9d2bd', '#bfb8a2', '#3a4a6a', '#33425f', '#2c3a55', '#2a2a2e', '#1a1a1e', '#2a2420',
    // Tarmo
    '#8a3a2a', '#6a2a1e', '#cfc8b8', '#a8a090', '#e8b898', '#c89070', '#4a4a3a', '#2a4a6a',
    // Tarja
    '#3a3a4a', '#5a2a2a', '#7a4a8a', '#5a3a6a', '#f0c8a8', '#e0b090', '#e8c870', '#c8a858', '#2a2a3a', '#e0a0a0', '#a04050',
  ]);
  TS.drawMan = function (g, x, footY, dir, walking, outside, look) {
    const bob = walking ? -Math.abs(Math.sin(TS.realTime * 8)) * 0.8 : 0;
    TS.pixelDraw(g, x - 18, footY - 70, 36, 74, TS.CHAR_RES, (p) => {
      p.translate(x, footY + bob);
      p.scale(dir < 0 ? -1 : 1, 1);
      drawBody(p, { walking: walking, outside: outside, look: look });
    });
    // Outside, Keijo always carries his yellow Alepa bag in the front hand
    if (outside && !look && TS.S && TS.sceneName !== 'tarja') {
      const sw = walking ? Math.sin(TS.realTime * 8) : 0;
      const a = -sw * 0.35;
      const ex = 0.8 - Math.sin(a) * 10.5, ey = -48.5 + Math.cos(a) * 10.5;
      const hx = ex - Math.sin(a - 0.3) * 9.5 + 0.3, hy = ey + Math.cos(a - 0.3) * 9.5 + 2.4;
      const d = dir < 0 ? -1 : 1;
      const S = TS.S;
      TS.drawAlepaBag(g, x + hx * d, footY + bob + hy, {
        bottles: S.bottleBag > 0,
        stuff: Object.keys(S.bag || {}).some((k) => S.bag[k] > 0),
        swing: -sw * 0.25 * d,
      });
    }
  };

  // Keijo lying on his back: head on the left, belly up. x,y = top-left of a 60x28 area.
  TS.drawLyingMan = function (g, x, y) {
    TS.pixelDraw(g, x - 2, y - 4, 66, 36, TS.CHAR_RES, (p) => {
      p.translate(x + 60, y + 15);
      p.rotate(-Math.PI / 2);
      p.scale(0.9, 0.9);
      drawBody(p, {});
    });
  };

  // Keijo's face for the bathroom mirror (x,y = top-left of the mirror glass, s = size).
  TS.drawFace = function (g, x, y, s) {
    const k = s * 0.62;
    TS.pixelDraw(g, x - 2, y - 6, 62, 56, 1, (p) => {
      p.translate(x + 28 - 2 * k, y + 22 + 60 * k);
      p.scale(k, k);
      drawHead(p, Object.assign({}, TS.PAL));
    });
  };
  // The yellow Alepa plastic bag with red text. (hx, hy) = where the handles are held.
  // o.bottles = bottle necks stick out, o.stuff = shopping sticks out, o.swing = sway angle.
  TS.drawAlepaBag = function (g, hx, hy, o) {
    o = o || {};
    g.save();
    g.translate(hx, hy);
    g.rotate(o.swing || 0);
    // handles
    g.lineWidth = 1.1; g.strokeStyle = '#e8bf10';
    g.beginPath(); g.moveTo(-4.5, 5); g.quadraticCurveTo(-2.5, -1, 0, 0); g.stroke();
    g.beginPath(); g.moveTo(4.5, 5); g.quadraticCurveTo(2.5, -1, 0, 0); g.stroke();
    // what sticks out of the bag
    if (o.bottles) for (let i = 0; i < 4; i++) TS.drawBottle(g, -5.5 + i * 3, 0.5 + (i % 2) * 1.2, 0.6);
    if (o.stuff) { TS.rbox(g, -4, 1.5, 4, 5, 1, '#c03a3a'); TS.drawCan(g, 1, 2, 0.6); }
    // the bag itself, a bit wider at the bottom
    g.beginPath();
    g.moveTo(-6, 5); g.lineTo(6, 5); g.lineTo(7.2, 19); g.quadraticCurveTo(0, 20.5, -7.2, 19); g.closePath();
    g.fillStyle = '#f5d218'; g.fill();
    g.lineWidth = 0.5; g.strokeStyle = '#a88a10'; g.stroke();
    // crinkles and the red text
    g.globalAlpha = 0.35; g.lineWidth = 0.4; g.strokeStyle = '#c8a810';
    g.beginPath(); g.moveTo(-3, 6); g.lineTo(-4, 18); g.stroke();
    g.beginPath(); g.moveTo(3.5, 6); g.lineTo(4.5, 17); g.stroke();
    g.globalAlpha = 1;
    TS.text(g, 'ALEPA', 0, 10, '#d4141c', { align: 'center', bold: true, s: 0.62 });
    g.restore();
  };

  // A small beer bottle (s = size). x,y = top-left.
  TS.drawBottle = function (g, x, y, s, col) {
    s = s || 1;
    const c = col || TS.PAL.t;
    TS.rbox(g, x + 1.1 * s, y, 1.8 * s, 4 * s, 0.5 * s, c);
    TS.rbox(g, x, y + 3 * s, 4 * s, 9 * s, 1.4 * s, c);
    TS.rect(g, x, y + 6 * s, 4 * s, 3 * s, TS.PAL.l);
    TS.rect(g, x + 0.6 * s, y + 4 * s, 0.6 * s, 7 * s, 'rgba(255,255,255,0.25)'); // shine
  };

  // A lonkero can: grapefruit pink and blue.
  TS.drawCan = function (g, x, y, s) {
    s = s || 1;
    TS.rbox(g, x, y, 5 * s, 9 * s, 1 * s, '#e8869a');
    TS.rect(g, x, y + 3 * s, 5 * s, 3 * s, '#3c5aa8');
    TS.rbox(g, x + 0.5 * s, y - s, 4 * s, 1.4 * s, 0.6 * s, '#bfc3c9');
  };

  // A wine box (tetra).
  TS.drawTetra = function (g, x, y, s) {
    s = s || 1;
    TS.rect(g, x, y, 8 * s, 12 * s, '#6a1f2e');
    TS.rect(g, x + s, y + 3 * s, 6 * s, 4 * s, '#e8dcc0');
    TS.rect(g, x + 3 * s, y - 2 * s, 2 * s, 2 * s, '#e8dcc0');
  };

  // A small flat bottle of vodka.
  TS.drawFlask = function (g, x, y, s) {
    s = s || 1;
    TS.rect(g, x + s, y, 2 * s, 2 * s, '#2a2a2a');
    TS.rect(g, x, y + 2 * s, 4 * s, 8 * s, '#cfe3ea');
    TS.rect(g, x, y + 5 * s, 4 * s, 2 * s, '#1d5fa8');
  };
})();
