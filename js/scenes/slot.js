// slot.js – the "Rosvo" casino app: a pirate slot machine "Yksikätinen Rosvo".
// A spin costs 2 €. 5 % chance of the jackpot (three treasure chests) = 1 000 000 €
// and the game ends with the jackpot animation. Small wins now and then, mostly losses.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const X = () => TS.T.slot;

  const PHONE = { x: 108, y: 22, w: 104, h: 182 };
  const SCR = { x: 113, y: 30, w: 94, h: 150 };
  const SPIN = { x: SCR.x + 10, y: SCR.y + 104, w: SCR.w - 20, h: 14 };
  const EXIT = { x: 222, y: 150, w: 68, h: 16 };
  const SYMS = ['skull', 'parrot', 'anchor', 'rum', 'coin', 'chest'];
  const CELL = 22;

  let back = 'phonehome';
  let reels = [0, 1, 2];          // symbol index shown in each reel
  let spin = null;                // { t, result: [a,b,c], stops: [..], kind, win }
  let line = null, lineT = 0, jackpotT = 0, lever = 0;

  // Decide the result before the reels stop: 5 % jackpot, 15 % small win, else a loss.
  function decide() {
    const r = Math.random();
    if (r < 0.05) return { kind: 'jackpot', result: [5, 5, 5] };
    if (r < 0.2) {
      const s = TS.rand(0, 4);
      return { kind: 'small', result: [s, s, s], win: [2, 3, 4, 6, 10][s] };
    }
    let res;
    do { res = [TS.rand(0, 5), TS.rand(0, 5), TS.rand(0, 5)]; } while (res[0] === res[1] && res[1] === res[2]);
    if (res[0] === 5 && res[1] === 5) res[2] = TS.rand(0, 4); // two chests and so close
    return { kind: 'lose', result: res };
  }

  function doSpin() {
    const S = TS.S;
    if (spin || jackpotT) return;
    if (!TS.canPay(X().bet)) { TS.sfx.fail(); say(X().broke); return; }
    TS.fx({ money: -X().bet });
    S.flags.slotSpins = (S.flags.slotSpins || 0) + 1;
    const d = decide();
    spin = Object.assign({ t: 0, stops: [0.9, 1.3, 1.8] }, d);
    lever = 1;
    TS.beep(180, 0.08, 'square', 0.04);
    TS.advance(1);
  }

  function say(text) { line = text; lineT = 5; }

  function finish() {
    const S = TS.S, d = spin;
    spin = null;
    if (d.kind === 'jackpot') {
      say(X().jackpot);
      jackpotT = 3.2;
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => TS.beep(f, 0.18, 'square', 0.05, i * 0.16));
    } else if (d.kind === 'small') {
      const e = X().bet * d.win;
      TS.fx({ money: e, mood: 6 });
      TS.sfx.coin();
      say(X().small.replace('{e}', TS.euro(e)));
    } else {
      TS.fx({ mood: -3 });
      TS.beep(140, 0.25, 'triangle', 0.05);
      say(TS.pick(X().lose));
    }
  }

  TS.scenes.slot = {
    hud: true,
    enter(arg) {
      if (arg && arg.back) back = arg.back;
      spin = null; jackpotT = 0;
      say(X().hello);
    },
    click(x, y) {
      if (jackpotT) return;
      if (TS.hit(EXIT, x, y) && !spin) { TS.sfx.click(); TS.go(back); return; }
      if (TS.hit(SPIN, x, y)) doSpin();
    },
    update(dt) {
      lineT -= dt;
      lever = Math.max(0, lever - dt * 1.5);
      if (spin) {
        spin.t += dt;
        for (let i = 0; i < 3; i++) {
          if (spin.t < spin.stops[i]) reels[i] = (reels[i] + dt * (14 + i * 3)) % SYMS.length;
          else reels[i] = spin.result[i];
        }
        if (spin.t >= spin.stops[2] + 0.15) finish();
      }
      if (jackpotT) {
        jackpotT -= dt;
        if (jackpotT <= 0) { jackpotT = 0; TS.go('jackpot'); }
      }
    },
    draw(g) {
      const R = TS.rect;
      R(g, 0, 17, 320, 163, '#2a2620');
      R(g, 0, 17, 320, 60, '#3a3428');
      TS.ell(g, 160, 230, 175, 95, TS.PAL.w, '#2a2320', 1);
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      // the sea and the pirate ship's deck
      const sea = g.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h);
      sea.addColorStop(0, '#0e2a4a'); sea.addColorStop(1, '#1a5a7a');
      g.fillStyle = sea; g.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
      g.save(); g.beginPath(); g.rect(SCR.x, SCR.y, SCR.w, SCR.h); g.clip();
      for (let i = 0; i < 6; i++) TS.ell(g, SCR.x + ((i * 29 + TS.realTime * 6) % 110) - 8, SCR.y + 56 + (i % 3) * 3, 8, 1.2, 'rgba(255,255,255,0.15)');
      R(g, SCR.x, SCR.y + 66, SCR.w, SCR.h - 66, '#6b4626');
      for (let i = 0; i < 6; i++) R(g, SCR.x, SCR.y + 72 + i * 14, SCR.w, 0.5, '#4f3420');
      // banner
      R(g, SCR.x, SCR.y, SCR.w, 13, '#7a1414');
      TS.text(g, X().title, SCR.x + SCR.w / 2, SCR.y + 3.6, '#ffd23c', { align: 'center', bold: true, s: 0.78 });
      drawPirate(g, SCR.x + 30, SCR.y + 64);
      // the machine: reels window
      const wx = SCR.x + 8, wy = SCR.y + 70, ww = SCR.w - 22, wh = 26;
      TS.rbox(g, wx - 3, wy - 3, ww + 6, wh + 6, 3, '#d4a020', '#7a5a10', 0.6);
      R(g, wx, wy, ww, wh, '#f8f0dc');
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
      for (let i = 0; i < 3; i++) {
        const cx = wx + ww / 6 + i * ww / 3;
        const pos = reels[i];
        const base = Math.floor(pos), frac = pos - base;
        for (let k = -1; k <= 1; k++) {
          const sym = SYMS[((base + k) % SYMS.length + SYMS.length) % SYMS.length];
          drawSymbol(g, sym, cx, wy + wh / 2 + (k - frac) * CELL);
        }
        if (i < 2) R(g, wx + (i + 1) * ww / 3 - 0.3, wy, 0.6, wh, '#c8b890');
      }
      g.restore();
      R(g, wx, wy + wh / 2 - 0.3, ww, 0.6, 'rgba(200,30,30,0.5)'); // the win line
      // the lever on the side (the hook pulls it)
      const lx = wx + ww + 7, ly = wy + 2 + lever * 16;
      R(g, lx - 0.8, wy, 1.6, wh, '#888');
      g.lineWidth = 1.4; g.strokeStyle = '#aaa'; g.beginPath(); g.moveTo(lx, wy + wh / 2); g.lineTo(lx, ly); g.stroke();
      TS.ell(g, lx, ly, 2.6, 2.6, '#d02a2a', '#7a1010', 0.5);
      // jackpot flash
      if (jackpotT && Math.floor(TS.realTime * 6) % 2) {
        TS.text(g, 'JACKPOT!!!', SCR.x + SCR.w / 2, SCR.y + 15, '#ffd23c', { align: 'center', bold: true, s: 1.5, shadow: '#7a1414' });
      }
      TS.text(g, X().odds, SCR.x + SCR.w / 2, SCR.y + 99, '#e8d8b0', { align: 'center', s: 0.5 });
      const hov = TS.hit(SPIN, TS.mouse.x, TS.mouse.y) && !spin && !ui.busy();
      TS.rbox(g, SPIN.x, SPIN.y, SPIN.w, SPIN.h, 5, spin ? '#8a7020' : hov ? '#ffe070' : '#ffd23c', '#7a5a10', 0.7);
      TS.text(g, spin ? 'PYÖRII...' : 'PYÖRÄYTÄ ' + TS.euro(X().bet), SPIN.x + SPIN.w / 2, SPIN.y + 4, '#5a1010', { align: 'center', bold: true, s: 0.85 });
      g.restore();
      // the hand
      const SK = TS.PAL.s, OL = 'rgba(42,32,28,0.8)';
      TS.ell(g, 116, 178, 22, 13, SK, OL, 0.6);
      [[106, 120], [105, 134], [105, 148], [106, 161]].forEach(([fx, fy]) => TS.rbox(g, fx - 4, fy - 4.5, 9, 9, 4.2, SK, OL, 0.5));
      g.save(); g.translate(214, 152); g.rotate(-0.5); TS.rbox(g, -5, -16, 10, 26, 5, SK, OL, 0.5); g.restore();
      // the pirate's words on the left
      if (line && lineT > 0) {
        const lines = TS.wrap(line, 22);
        TS.rbox(g, 6, 34, 96, lines.length * 8 + 15, 6, '#f8f0dc', '#7a1414');
        TS.text(g, 'KAPTEENI KOUKKU:', 11, 38, '#7a1414', { bold: true, s: 0.75 });
        lines.forEach((ln, i) => TS.text(g, ln, 11, 46 + i * 8, '#2a2320'));
      }
      TS.text(g, (TS.S.flags.slotSpins || 0) + ' pyöräytystä', 255, 120, '#8a8494', { align: 'center' });
      TS.button(g, EXIT, 'PUHELIN POIS');
      ui.drawHUD(g);
    },
  };

  // Kapteeni Koukku: tricorn hat, eye patch, beard, a hook for a hand, and a parrot.
  function drawPirate(g, cx, by) {
    const OL = 'rgba(30,20,16,0.85)', t = TS.realTime;
    TS.pixelDraw(g, cx - 26, by - 52, 60, 54, TS.CHAR_RES, (p) => {
      TS.rbox(p, cx - 12, by - 18, 24, 20, 6, '#8a1a1a', OL, 0.5);       // red coat
      TS.rect(p, cx - 2, by - 18, 4, 18, '#e8dcc0');                       // shirt
      TS.ell(p, cx, by - 27, 7.5, 8.5, '#d8a07a', OL, 0.5);                // head
      TS.ell(p, cx, by - 22, 7, 5, '#3a2416');                             // big beard
      TS.ell(p, cx + 0.5, by - 23.4, 2.2, 0.8, '#7a3a34');                 // mouth (laughing)
      TS.ell(p, cx + 3, by - 29.5, 1, 1, '#1a1a1a');                       // the good eye
      TS.rbox(p, cx - 5, by - 31, 4.4, 3.6, 1.2, '#111');                  // eye patch
      p.lineWidth = 0.5; p.strokeStyle = '#111';
      p.beginPath(); p.moveTo(cx - 7, by - 31); p.lineTo(cx + 6.5, by - 33.5); p.stroke();
      // tricorn hat with a skull
      p.beginPath(); p.moveTo(cx - 12, by - 33); p.quadraticCurveTo(cx, by - 46, cx + 12, by - 33); p.quadraticCurveTo(cx, by - 37, cx - 12, by - 33); p.closePath();
      p.fillStyle = '#1a1a1a'; p.fill();
      TS.ell(p, cx, by - 38, 1.6, 1.4, '#f0f0e8');
      // the arm with the hook, waving
      const a = Math.sin(t * 3) * 0.3 - 0.6;
      p.save(); p.translate(cx + 11, by - 14); p.rotate(a);
      TS.rbox(p, -2.4, -12, 4.8, 13, 2.2, '#8a1a1a', OL, 0.4);
      p.lineWidth = 1.3; p.strokeStyle = '#c8ccd2';
      p.beginPath(); p.arc(0, -15, 2.4, Math.PI * 0.2, Math.PI * 1.4); p.stroke();
      p.restore();
      // the parrot on the shoulder
      const bob = Math.sin(t * 5) * 0.6;
      TS.ell(p, cx - 11, by - 19 + bob, 3.2, 4.4, '#2fae4a', OL, 0.4);
      TS.ell(p, cx - 11, by - 24 + bob, 2.4, 2.4, '#e03a2a', OL, 0.4);
      TS.ell(p, cx - 12.5, by - 23.4 + bob, 1.2, 0.9, '#f0c040');
      TS.ell(p, cx - 10.4, by - 24.6 + bob, 0.5, 0.5, '#111');
    }, 'noSnap');
  }

  // The reel symbols, about 16 x 16 around (cx, cy)
  function drawSymbol(g, sym, cx, cy) {
    const OL = '#3a2a1a';
    if (sym === 'skull') {
      g.lineWidth = 1.6; g.strokeStyle = '#d8d0c0';
      g.beginPath(); g.moveTo(cx - 6, cy + 3); g.lineTo(cx + 6, cy + 7); g.moveTo(cx + 6, cy + 3); g.lineTo(cx - 6, cy + 7); g.stroke();
      TS.ell(g, cx, cy - 1.5, 5, 5, '#f4f0e6', OL, 0.5);
      TS.ell(g, cx - 2, cy - 1.5, 1.3, 1.5, '#222'); TS.ell(g, cx + 2, cy - 1.5, 1.3, 1.5, '#222');
    } else if (sym === 'parrot') {
      TS.ell(g, cx, cy + 1.5, 4, 5.5, '#2fae4a', OL, 0.5);
      TS.ell(g, cx + 0.5, cy - 4, 3.4, 3.2, '#e03a2a', OL, 0.5);
      TS.ell(g, cx + 3.6, cy - 3.4, 1.6, 1, '#f0c040');
      TS.ell(g, cx + 1.2, cy - 4.6, 0.6, 0.6, '#111');
    } else if (sym === 'anchor') {
      g.lineWidth = 1.8; g.strokeStyle = '#3a4a6a'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy - 6); g.lineTo(cx, cy + 6); g.moveTo(cx - 3.5, cy - 3); g.lineTo(cx + 3.5, cy - 3); g.stroke();
      g.beginPath(); g.arc(cx, cy + 1, 5.5, 0.3, Math.PI - 0.3); g.stroke();
      TS.ell(g, cx, cy - 7, 1.6, 1.6, null, '#3a4a6a', 1.2);
      g.lineCap = 'butt';
    } else if (sym === 'rum') {
      TS.rbox(g, cx - 1.4, cy - 7, 2.8, 4, 0.6, '#5c3b17');
      TS.rbox(g, cx - 4, cy - 3.5, 8, 10.5, 2, '#5c3b17', OL, 0.4);
      TS.rect(g, cx - 4, cy - 0.5, 8, 4, '#e8d8a0');
      TS.text(g, 'XXX', cx, cy - 0.2, '#7a1414', { align: 'center', bold: true, s: 0.45 });
    } else if (sym === 'coin') {
      TS.ell(g, cx, cy, 6, 6, '#f0c040', '#a07010', 0.7);
      TS.text(g, '€', cx, cy - 3.4, '#a07010', { align: 'center', bold: true, s: 1.05 });
    } else if (sym === 'chest') {
      TS.rbox(g, cx - 7, cy - 2, 14, 8, 1.2, '#8a5a2a', OL, 0.5);
      g.beginPath(); g.moveTo(cx - 7, cy - 2); g.quadraticCurveTo(cx, cy - 9, cx + 7, cy - 2); g.closePath();
      g.fillStyle = '#a06a32'; g.fill(); g.lineWidth = 0.5; g.strokeStyle = OL; g.stroke();
      TS.rect(g, cx - 7, cy - 0.5, 14, 1.2, '#f0c040');
      TS.rbox(g, cx - 1.5, cy - 1.5, 3, 3.5, 0.6, '#f0c040');
      TS.ell(g, cx - 4, cy - 4, 1, 1, '#ffe880'); TS.ell(g, cx + 3, cy - 5, 0.8, 0.8, '#ffe880');
    }
  }
})();
