// call.js – a phone call as a video call: Keijo's hand holds the phone, the
// caller's face talks on the screen, and the conversation builds up as chat
// bubbles on the right. The answers are in the dialog box next to the phone.
//
// It starts by itself when a phone conversation (a tree with `face`) begins,
// and when it ends you are back in the scene you were in (without re-entering it).
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;

  const PHONE = { x: 14, y: 22, w: 106, h: 182 };
  const SCR = { x: 20, y: 30, w: 94, h: 150 };
  const OL = 'rgba(42,32,28,0.8)';

  TS.call = null;

  TS.callBegin = function (tree) {
    if (TS.call && TS.call.tree === tree && TS.sceneName === 'call') return;
    const prev = TS.sceneName === 'call' && TS.call ? TS.call.prev : { name: TS.sceneName, scene: TS.scene };
    TS.call = { tree: tree, log: [], t0: TS.realTime, prev: prev, ended: false };
    TS.sceneName = 'call';
    TS.scene = TS.scenes.call;
  };
  TS.callLog = function (from, text) { if (TS.call) TS.call.log.push({ from: from, text: text }); };
  // noReturn = the call leads somewhere else (e.g. a taxi to Tarja's)
  TS.callEnd = function (noReturn) {
    if (!TS.call) return;
    if (noReturn) { TS.call = null; return; }
    TS.call.ended = true;
  };

  TS.scenes.call = {
    hud: true,
    boxArea: { x: 126, w: 190 },
    click() {},
    update() {
      const c = TS.call;
      if (!c) return;
      // Hang up when the last line has been read
      if (c.ended && !ui.busy()) {
        TS.sceneName = c.prev.name;
        TS.scene = c.prev.scene;
        TS.call = null;
        TS.sfx.click();
      }
    },
    draw(g) {
      const c = TS.call;
      drawBackground(g);
      if (!c) { ui.drawHUD(g); return; }
      // phone + video
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      g.save();
      g.beginPath(); g.rect(SCR.x, SCR.y, SCR.w, SCR.h); g.clip();
      // the video in chunky pixels, like the other characters
      TS.pixelDraw(g, SCR.x, SCR.y, SCR.w, SCR.h, 1, (p) => drawCaller(p, c.tree.face), false);
      // top bar: name and call time
      g.globalAlpha = 0.45; TS.rect(g, SCR.x, SCR.y, SCR.w, 17, '#000'); g.globalAlpha = 1;
      TS.text(g, c.tree.name, SCR.x + 4, SCR.y + 3, '#fff', { bold: true, s: 0.85 });
      const sec = Math.floor(TS.realTime - c.t0);
      TS.text(g, 'Videopuhelu  ' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), SCR.x + 4, SCR.y + 10.5, '#ddd', { s: 0.7 });
      // a small self-view: Keijo sees himself. Unfortunately.
      TS.rbox(g, SCR.x + SCR.w - 22, SCR.y + 21, 19, 24, 2, '#3a3428', '#fff', 0.6);
      g.save();
      g.beginPath(); g.rect(SCR.x + SCR.w - 22, SCR.y + 21, 19, 24); g.clip();
      TS.drawFace(g, SCR.x + SCR.w - 40, SCR.y + 11, 1.6);
      g.restore();
      // hang-up button
      TS.ell(g, SCR.x + SCR.w / 2, SCR.y + SCR.h - 16, 7, 7, '#e03a3a');
      g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.lineCap = 'round';
      g.beginPath(); g.arc(SCR.x + SCR.w / 2, SCR.y + SCR.h - 13, 4, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.lineCap = 'butt';
      g.restore();
      drawHand(g);
      drawChat(g, c);
      ui.drawHUD(g);
    },
  };

  // ---------------- Pieces ----------------
  function drawBackground(g) {
    const R = TS.rect;
    R(g, 0, 17, 320, 163, '#2a2620');
    R(g, 0, 17, 320, 60, '#3a3428');
    for (let x = 6; x < 320; x += 12) R(g, x, 17, 1, 60, '#332e24');
    TS.ell(g, 70, 235, 150, 85, TS.PAL.w, '#2a2320', 1); // Keijo's belly under the phone
    TS.ell(g, 140, 168, 6, 4, TS.PAL.y);
    g.globalAlpha = 0.12; TS.ell(g, 67, 110, 70, 80, '#cfe0ff'); g.globalAlpha = 1;
  }

  function drawHand(g) {
    const S = TS.PAL.s;
    TS.ell(g, 64, 182, 24, 14, S, OL, 0.6);
    [[14, 104], [13, 119], [13, 134], [14, 149]].forEach(([fx, fy]) => TS.rbox(g, fx - 4.5, fy - 4.6, 9, 9.2, 4.3, S, OL, 0.5));
    g.save();
    g.translate(121, 150);
    g.rotate(-0.45);
    TS.rbox(g, -5, -17, 10, 28, 5, S, OL, 0.5);
    TS.rbox(g, -3.5, -16, 7, 6, 3, '#f0d0b8');
    g.restore();
  }

  // Chat bubbles, newest at the bottom (just above the answer box).
  function drawChat(g, c) {
    const bottom = ui.boxTop() - 4;
    let y = bottom;
    const S = 0.85, LH = 7;
    for (let i = c.log.length - 1; i >= 0 && y > 24; i--) {
      const m = c.log[i];
      if (m.from === 'narrator') {
        const lines = TS.wrap(m.text, 44, 0.75);
        y -= lines.length * 6.5 + 4;
        lines.forEach((ln, k) => TS.text(g, ln, 221, y + k * 6.5, '#9a9488', { align: 'center', s: 0.75 }));
        continue;
      }
      const me = m.from === 'me';
      const lines = TS.wrap(m.text, 34, S);
      const w = Math.max.apply(null, lines.map((ln) => TS.textW(ln, S))) + 8;
      const h = lines.length * LH + 5;
      y -= h + 3;
      const x = me ? 314 - w : 128;
      TS.rbox(g, x, y, w, h, 4, me ? '#3a7ad0' : '#e8e4dc');
      lines.forEach((ln, k) => TS.text(g, ln, x + 4, y + 3 + k * LH, me ? '#fff' : '#2a2a2a', { s: S }));
    }
    if (!c.log.length) TS.text(g, 'Yhdistetty.', 221, bottom - 10, '#9a9488', { align: 'center', s: 0.8 });
  }

  // ---------------- Faces ----------------
  // Is the caller talking? (their text is still appearing in the box)
  function talking() {
    const it = ui.queue[0];
    return !!(it && TS.call && it.who === TS.call.tree.who && ui.reveal < it.text.length);
  }

  function face(g, o) {
    // o: skin, eyesY, mouthY, browCol, eye colour... drawn around (0,0), head about 20x25
    const t = TS.realTime;
    const blink = (t % 4.3) < 0.13;
    const open = talking() ? 0.4 + Math.abs(Math.sin(t * 13)) * 1.6 : 0.35;
    TS.ell(g, -10, 1, 2, 3, o.skinD, OL, 0.4);
    TS.ell(g, 10, 1, 2, 3, o.skinD, OL, 0.4);
    TS.ell(g, 0, 0, 10, 12.5, o.skin, OL, 0.5);
    if (o.under) o.under(g);
    // eyes
    [-4, 4].forEach((ex) => {
      if (blink) { g.lineWidth = 0.5; g.strokeStyle = '#3a2a2a'; g.beginPath(); g.moveTo(ex - 1.8, -1); g.lineTo(ex + 1.8, -1); g.stroke(); }
      else {
        TS.ell(g, ex, -1, 1.9, 1.1, '#f4efe8');
        TS.ell(g, ex + 0.2, -1, 0.85, 0.9, o.eye || '#4a3a2e');
        TS.ell(g, ex + 0.5, -1.4, 0.25, 0.25, '#fff');
      }
    });
    // brows
    g.lineWidth = 0.9; g.lineCap = 'round'; g.strokeStyle = o.brow;
    g.beginPath(); g.moveTo(-6, -4 - (o.browL || 0)); g.lineTo(-2.2, -4.4 - (o.browL || 0)); g.stroke();
    g.beginPath(); g.moveTo(2.2, -4.4 - (o.browR || 0)); g.lineTo(6, -4 - (o.browR || 0)); g.stroke();
    g.lineCap = 'butt';
    // nose
    g.lineWidth = 0.5; g.strokeStyle = o.skinD;
    g.beginPath(); g.moveTo(0.3, -0.5); g.quadraticCurveTo(1.6, 3.2, 0.2, 3.8); g.stroke();
    if (o.redNose) { g.globalAlpha = 0.45; TS.ell(g, 0.6, 3.2, 1.6, 1.1, '#d8705a'); g.globalAlpha = 1; }
    // mouth
    TS.ell(g, 0, 7, 2.8, open, '#5a2a2a');
    if (o.lips) { g.lineWidth = 0.7; g.strokeStyle = o.lips; g.beginPath(); g.ellipse(0, 7, 3, open + 0.3, 0, 0, Math.PI * 2); g.stroke(); }
    if (o.over) o.over(g);
  }

  function drawCaller(g, who) {
    const x0 = SCR.x, y0 = SCR.y, w = SCR.w, h = SCR.h, R = TS.rect;
    const cx = x0 + w / 2;
    const bob = Math.sin(TS.realTime * 1.3) * 0.8; // the caller's hand shakes a little
    if (who === 'te') {
      // office: grey wall, blinds, a sad plant. Lehtonen wears a headset.
      R(g, x0, y0, w, h, '#d8dce0');
      R(g, x0 + 56, y0 + 22, 34, 40, '#e8eef4'); for (let i = 0; i < 8; i++) R(g, x0 + 56, y0 + 24 + i * 5, 34, 1, '#b8c0c8');
      R(g, x0 + 6, y0 + 50, 10, 14, '#8a6a4a'); TS.ell(g, x0 + 11, y0 + 46, 7, 6, '#5a8a4a');
      g.save(); g.translate(cx, y0 + 76 + bob); g.scale(2.4, 2.4);
      TS.ell(g, 0, 26, 22, 13, '#3a7a7a', OL, 0.5); R(g, -3, 12, 6, 4, '#e0b898'); R(g, -5, 14, 10, 3, '#f4f4f0');
      TS.ell(g, 0, -4, 11.5, 11, '#4a3226');                 // dark bob, behind the face
      R(g, -11.5, -4, 4, 13, '#4a3226'); R(g, 7.5, -4, 4, 13, '#4a3226');
      face(g, { skin: '#ecc8a8', skinD: '#c89878', brow: '#3a2a20', lips: '#b84a5a', browR: 0.8,
        over(g) {
          TS.rect(g, -9.5, -10.5, 19, 4.5, '#4a3226'); // fringe
          g.lineWidth = 0.6; g.strokeStyle = '#2a2a2a';
          g.beginPath(); g.ellipse(-4, -1, 3, 2.4, 0, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.ellipse(4, -1, 3, 2.4, 0, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.moveTo(-1, -1); g.lineTo(1, -1); g.stroke();
          // headset
          g.lineWidth = 1.2; g.strokeStyle = '#222';
          g.beginPath(); g.arc(0, -2, 12.2, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
          TS.ell(g, -11, 0, 2.2, 3, '#222'); g.lineWidth = 0.8;
          g.beginPath(); g.moveTo(-10, 2); g.quadraticCurveTo(-8, 8, -3, 8.5); g.stroke();
          TS.ell(g, -2.6, 8.5, 1, 0.8, '#222');
        } });
      g.restore();
    } else if (who === 'mum') {
      // äiti holds the phone WAY too close: forehead, glasses and a perm.
      R(g, x0, y0, w, h, '#e8d8a0');
      TS.ell(g, x0 + 80, y0 + 30, 8, 8, '#fff', '#8a6a3a'); R(g, x0 + 79.5, y0 + 25, 1, 5, '#333'); R(g, x0 + 80, y0 + 29.5, 4, 1, '#333');
      g.save(); g.translate(cx + 4, y0 + 96 + bob * 2); g.scale(4.4, 4.4); g.rotate(0.08);
      TS.ell(g, 0, 26, 22, 13, '#d87a9a', OL, 0.4);
      for (let i = 0; i < 12; i++) TS.ell(g, -14 + (i * 7) % 28, 18 + (i * 3) % 12, 1.2, 1.2, '#f4e070');
      face(g, { skin: '#f0d0b8', skinD: '#d0a890', brow: '#b8b0a8', lips: '#c86a7a', eye: '#5a6a8a',
        over(g) {
          for (let i = 0; i < 16; i++) TS.ell(g, -11 + (i % 8) * 3.1, -12 + Math.floor(i / 8) * 3 - Math.abs(4 - (i % 8)) * 0.4, 2.6, 2.6, '#e4e0dc', '#c8c2bc', 0.3);
          g.lineWidth = 0.7; g.strokeStyle = '#8a3a5a';
          g.beginPath(); g.ellipse(-4, -1, 3.4, 2.8, 0, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.ellipse(4, -1, 3.4, 2.8, 0, 0, Math.PI * 2); g.stroke();
          g.globalAlpha = 0.25; TS.ell(g, -3, -2, 2.4, 1, '#fff'); TS.ell(g, 5, -2, 2.4, 1, '#fff'); g.globalAlpha = 1;
        } });
      g.restore();
    } else if (who === 'tarmo') {
      // his own kitchen: green wall, cans on the table. The camera points up at his chin.
      R(g, x0, y0, w, h, '#5a6a50');
      R(g, x0, y0 + 112, w, 38, '#6b4a2e');
      [8, 18, 74, 84].forEach((cxx) => TS.drawCan(g, x0 + cxx, y0 + 102, 1.5));
      TS.ell(g, x0 + 84, y0 + 30, 6, 6, '#f0e8b0'); // a bare bulb
      g.save(); g.translate(cx, y0 + 78 + bob); g.scale(2.5, 2.5);
      TS.ell(g, 0, 26, 22, 13, '#8a3a2a', OL, 0.5);
      g.lineWidth = 0.6; g.strokeStyle = '#5a2016';
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 5, 15); g.lineTo(i * 5, 38); g.stroke(); }
      g.beginPath(); g.moveTo(-20, 24); g.lineTo(20, 24); g.stroke();
      face(g, { skin: '#e8b898', skinD: '#c08868', brow: '#a8a090', redNose: true,
        under(g) {
          g.globalAlpha = 0.45; TS.ell(g, 0, 7, 9, 5.5, '#9a9080'); g.globalAlpha = 1; // grey stubble
          TS.ell(g, -9.2, 2, 1.6, 3.5, '#cfc8b8'); TS.ell(g, 9.2, 2, 1.6, 3.5, '#cfc8b8');
        },
        over(g) {
          TS.ell(g, 0, -12, 11.4, 5.6, '#2a4a6a', OL, 0.5);    // cap
          TS.rbox(g, -9.5, -10.5, 19, 3, 1.5, '#2a4a6a', OL, 0.4);
          TS.rbox(g, -8, -8.6, 16, 2.4, 1.2, '#1e3a56');        // visor (seen from the front)
        } });
      g.restore();
    } else if (who === 'tarja') {
      // warm lamp light, a cat peeking in the corner
      R(g, x0, y0, w, h, '#5a3a4a');
      g.globalAlpha = 0.35; TS.ell(g, x0 + 20, y0 + 30, 40, 40, '#ffb060'); g.globalAlpha = 1;
      TS.ell(g, x0 + 80, y0 + 132, 9, 7, '#e09040'); TS.ell(g, x0 + 76, y0 + 126, 1.5, 2.5, '#e09040'); TS.ell(g, x0 + 84, y0 + 126, 1.5, 2.5, '#e09040');
      TS.ell(g, x0 + 77.5, y0 + 131, 0.8, 0.8, '#2a6a2a'); TS.ell(g, x0 + 82.5, y0 + 131, 0.8, 0.8, '#2a6a2a');
      g.save(); g.translate(cx - 4, y0 + 74 + bob); g.scale(2.4, 2.4); g.rotate(-0.06);
      TS.ell(g, 0, 26, 22, 13, '#7a4a8a', OL, 0.5);
      TS.ell(g, 11, -2, 4, 9, '#e8c870');                   // ponytail behind
      TS.ell(g, 0, -4, 11.4, 10.6, '#e8c870');
      face(g, { skin: '#f0c8a8', skinD: '#d0a080', brow: '#b89850', lips: '#c04a6a', eye: '#4a6a4a', browL: 1.2,
        under(g) { g.globalAlpha = 0.25; TS.ell(g, -5, 3, 2, 1.2, '#e07080'); TS.ell(g, 5, 3, 2, 1.2, '#e07080'); g.globalAlpha = 1; },
        over(g) { TS.ell(g, -3, -10.5, 8, 3.2, '#e8c870'); TS.ell(g, 5, -11, 6, 2.8, '#e8c870'); } });
      g.restore();
    }
  }
})();
