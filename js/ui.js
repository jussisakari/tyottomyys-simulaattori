// ui.js – the top bar (HUD), dialog boxes, choice menus, small pop-up notes
// and the "time flies" animation when an action takes a while.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui = { queue: [], anim: null, toasts: [], reveal: 0, cur: null, front: false, frontIdx: 0 };

  const COL = {
    box: '#141320', line: '#e8e0c8', text: '#e8e0c8', who: '#f0c850', hover: '#3a3550',
    dim: '#8a8494', hud: '#1b1a24', bad: '#d0544a',
  };
  ui.COL = COL;
  const CHARS = 74; // letters per line in the dialog box

  // Adds an item to the queue. While a choice is being handled, new items go
  // to the front, so the answer is shown before older waiting messages.
  function push(item) {
    if (ui.front) ui.queue.splice(ui.frontIdx++, 0, item);
    else ui.queue.push(item);
  }
  function runFront(fn) {
    ui.front = true;
    ui.frontIdx = 0;
    try { fn(); } finally { ui.front = false; }
  }

  // A message. Click to continue.
  ui.say = function (text, opts) {
    opts = opts || {};
    push({ type: 'say', text: text, who: opts.who, then: opts.then });
  };
  // A question with answers: options = [{ label, fn }]. Empty items are skipped.
  ui.choose = function (text, options, opts) {
    opts = opts || {};
    push({ type: 'choose', text: text, options: options.filter(Boolean), who: opts.who });
  };
  // A small note at the top that goes away by itself.
  ui.toast = function (text) { ui.toasts.push({ text: text, time: 2.5 }); };
  ui.busy = () => ui.queue.length > 0 || !!ui.anim;
  ui.clear = function () { ui.queue = []; ui.anim = null; ui.toasts = []; };

  // Does an action that takes game time.
  // o = { min, mode: 'sleep', label, fx: {...}, say: text or [texts], after() }
  TS.doAction = function (o) {
    const S = TS.S;
    const finish = function () {
      if (o.fx) TS.fx(o.fx);
      if (o.say) [].concat(o.say).forEach((t) => ui.say(t, { who: o.who }));
      if (o.min) TS.advance(o.min, o.mode);
      if (o.after && !S.ended) o.after();
      TS.save();
    };
    if (!o.min || o.min < 10) { finish(); return; }
    if (o.mode === 'sleep') TS.sfx.snore();
    ui.anim = {
      from: S.t, to: S.t + o.min, time: 0,
      dur: Math.min(2.4, 0.7 + o.min / 120),
      label: o.label || '', mode: o.mode, done: finish,
    };
  };

  // Clock shown in the HUD (moves smoothly during the animation).
  ui.shownTime = function () {
    const a = ui.anim;
    if (!a) return TS.S.t;
    return a.from + (a.to - a.from) * Math.min(1, a.time / a.dur);
  };

  ui.update = function (dt) {
    if (ui.anim) {
      ui.anim.time += dt;
      if (ui.anim.time >= ui.anim.dur) {
        const a = ui.anim;
        ui.anim = null;
        a.done();
      }
    }
    if (ui.queue[0] !== ui.cur) { ui.cur = ui.queue[0]; ui.reveal = 0; }
    if (ui.cur) ui.reveal += dt * 90;
    if (ui.toasts.length) {
      ui.toasts[0].time -= dt;
      if (ui.toasts[0].time <= 0) ui.toasts.shift();
    }
  };

  // ---------- Dialog box layout ----------
  // A scene can move the box: boxArea = { x, w } (the phone call screen keeps the phone visible).
  function layout(item) {
    const A = (TS.scene && TS.scene.boxArea) || { x: 4, w: 312 };
    const chars = A.w === 312 ? CHARS : Math.floor((A.w - 12) / 4);
    const lines = TS.wrap(item.text, chars);
    let h = 8 + lines.length * 8 + (item.who ? 9 : 0);
    const opts = [];
    if (item.type === 'choose') {
      h += 3;
      item.options.forEach((o) => {
        const ol = TS.wrap((o.disabled ? '× ' : '> ') + o.label, chars - 2);
        opts.push({ o: o, lines: ol, h: ol.length * 8 + 3 });
        h += ol.length * 8 + 3;
      });
    }
    const y = 176 - h;
    let oy = y + 6 + (item.who ? 9 : 0) + lines.length * 8 + 3;
    opts.forEach((p) => { p.r = { x: A.x + 6, y: oy - 2, w: A.w - 12, h: p.h }; oy += p.h; });
    return { lines: lines, opts: opts, x: A.x, y: y, w: A.w, h: h };
  }

  // Top of the current dialog box (or the screen bottom when there is none).
  ui.boxTop = function () {
    const item = ui.queue[0];
    return item && !ui.anim ? layout(item).y : 176;
  };

  ui.click = function (x, y) {
    if (ui.anim) return true;
    const item = ui.queue[0];
    if (!item) return false;
    const total = item.text.length;
    if (ui.reveal < total) { ui.reveal = 9999; return true; }
    if (item.type === 'say') {
      ui.queue.shift();
      TS.sfx.click();
      if (item.then) runFront(item.then);
      return true;
    }
    const L = layout(item);
    for (const p of L.opts) {
      if (TS.hit(p.r, x, y)) {
        ui.queue.shift();
        TS.sfx.click();
        if (p.o.fn) runFront(p.o.fn);
        return true;
      }
    }
    return true; // clicks outside the answers do nothing while a question is open
  };

  function drawBox(g, item) {
    const L = layout(item);
    TS.rect(g, L.x - 1, L.y - 1, L.w + 2, L.h + 2, '#000');
    TS.box(g, L.x, L.y, L.w, L.h, COL.box, COL.line);
    let ty = L.y + 6;
    if (item.who) { TS.text(g, item.who, L.x + 6, ty, COL.who); ty += 9; }
    let budget = Math.floor(ui.reveal);
    L.lines.forEach((ln) => {
      if (budget <= 0) return;
      TS.text(g, ln.slice(0, budget), L.x + 6, ty, COL.text);
      budget -= ln.length + 1;
      ty += 8;
    });
    const done = ui.reveal >= item.text.length;
    if (item.type === 'say') {
      if (done && Math.floor(TS.realTime * 3) % 2) {
        const ax = L.x + L.w - 9, ay = L.y + L.h - 7;
        TS.rect(g, ax, ay, 5, 1, COL.who); TS.rect(g, ax + 1, ay + 1, 3, 1, COL.who); TS.rect(g, ax + 2, ay + 2, 1, 1, COL.who);
      }
    } else if (done) {
      L.opts.forEach((p) => {
        const hov = TS.hit(p.r, TS.mouse.x, TS.mouse.y);
        const off = p.o.disabled; // shown, but greyed out (clicking only tells why)
        if (hov && !off) TS.rect(g, p.r.x, p.r.y, p.r.w, p.r.h, COL.hover);
        p.lines.forEach((ln, i) => TS.text(g, ln, p.r.x + 2, p.r.y + 2 + i * 8, off ? '#5e5868' : hov ? COL.who : COL.text));
      });
    }
  }

  function drawAnim(g) {
    const a = ui.anim;
    const k = Math.min(1, a.time / 0.25, (a.dur - a.time) / 0.25);
    g.globalAlpha = 0.75 * Math.max(0, k);
    TS.rect(g, 0, 17, 320, 163, '#05040a');
    g.globalAlpha = 1;
    const t = ui.shownTime();
    TS.text(g, TS.clockStr(t), 160, 70, '#f0c850', { s: 4, align: 'center', shadow: '#000' });
    if (a.label) TS.text(g, a.label, 160, 96, COL.text, { align: 'center', shadow: '#000' });
    if (a.mode === 'sleep') {
      for (let i = 0; i < 3; i++) {
        const zt = (TS.realTime * 0.8 + i / 3) % 1;
        TS.text(g, 'Z', 200 + zt * 20 + i * 4, 66 - zt * 30, '#9fb0d0', { s: 1 + (i % 2) });
      }
    }
    // progress bar
    TS.rect(g, 110, 108, 100, 3, '#3a3550');
    TS.rect(g, 110, 108, 100 * Math.min(1, a.time / a.dur), 3, '#f0c850');
  }

  ui.draw = function (g) {
    if (ui.anim) drawAnim(g);
    else if (ui.queue[0]) drawBox(g, ui.queue[0]);
    if (ui.toasts.length) {
      const t = ui.toasts[0].text;
      const w = TS.textW(t) + 10;
      TS.box(g, 160 - w / 2, 20, w, 11, '#3a2a1a', COL.who);
      TS.text(g, t, 160, 23, COL.who, { align: 'center' });
    }
  };

  // ---------- HUD (top bar + phone icon in the bottom-right corner) ----------
  const PHONE_BTN = { x: 293, y: 143, w: 25, h: 35 };

  function bar(g, x, y, label, val, col, warn) {
    TS.text(g, label, x, y, warn ? COL.bad : COL.dim);
    TS.rect(g, x + 13, y, 26, 5, '#34313f');
    TS.rect(g, x + 13, y, Math.round(26 * val / 100), 5, col);
  }

  ui.drawHUD = function (g) {
    const S = TS.S;
    TS.rect(g, 0, 0, 320, 17, COL.hud);
    TS.rect(g, 0, 16, 320, 1, '#000');
    TS.text(g, TS.clockStr(ui.shownTime()), 4, 3, S.t >= TS.DEADLINE ? COL.bad : '#f0c850', { s: 2 });
    bar(g, 48, 3, 'ENE', S.energy, '#e0c040', S.energy < 15);
    bar(g, 92, 3, 'NÄL', S.hunger, '#d07a3a', S.hunger > 80);
    bar(g, 136, 3, 'HYG', S.hyg, '#7aa850', S.hyg < 20);
    bar(g, 180, 3, 'MIE', S.mood, '#5a8ad0', S.mood < 15);
    // drunk pips
    TS.text(g, 'HUMALA', 48, 10, COL.dim);
    const d = Math.round(S.drunk);
    for (let i = 0; i < 7; i++) TS.rect(g, 74 + i * 4, 10, 3, 5, i < d ? '#c07ad0' : '#34313f');
    TS.text(g, 'TILI ' + TS.euro(S.money), 108, 10, S.money < 2 ? COL.bad : COL.text);
    // applications
    const done = S.apps >= 4;
    TS.text(g, 'HAKEMUKSET ' + S.apps + '/4', 226, 3, done ? '#7ad07a' : COL.text);
    if (!ui.busy()) drawPhoneIcon(g, S);
  };

  // The phone in the corner. It shakes, glows and gets a red badge when someone calls.
  function drawPhoneIcon(g, S) {
    const ringing = !!S.phone;
    const hov = TS.hit(PHONE_BTN, TS.mouse.x, TS.mouse.y);
    const shake = ringing ? Math.sin(TS.realTime * 40) * 1.2 : 0;
    const cx = 305, cy = 161;
    g.save();
    g.translate(cx + shake, cy);
    g.rotate(ringing ? Math.sin(TS.realTime * 30) * 0.08 : -0.08);
    if (hov || ringing) { g.globalAlpha = 0.35; TS.ell(g, 0, 0, 16, 20, ringing ? '#ff6050' : '#f0c850'); g.globalAlpha = 1; }
    TS.rbox(g, -9, -15, 18, 30, 3.5, '#1a1a1e', '#000', 0.8);
    TS.rbox(g, -7.5, -12, 15, 22, 1.5, ringing ? '#5a9ae0' : '#2a3a5a');
    g.globalAlpha = 0.5; g.lineWidth = 0.4; g.strokeStyle = '#ccc'; // the crack
    g.beginPath(); g.moveTo(-4, -11); g.lineTo(1, -4); g.lineTo(-1, 1); g.lineTo(5, 8); g.stroke();
    g.globalAlpha = 1;
    TS.ell(g, 0, 12.5, 1.4, 1.4, '#444');
    if (ringing) {
      TS.text(g, '☎', 0, -6, '#fff', { align: 'center', s: 1.4 });
      TS.ell(g, 8, -14, 4, 4, '#e03030', '#fff', 0.6);
      TS.text(g, '!', 8, -16.5, '#fff', { align: 'center', bold: true });
    }
    g.restore();
    if (ringing && Math.floor(TS.realTime * 3) % 2) {
      TS.rbox(g, 266, 135, 30, 10, 3, '#e03030');
      TS.text(g, 'VASTAA!', 281, 137.5, '#fff', { align: 'center', bold: true, s: 0.85 });
    }
  }

  // Clicks for the HUD scenes: the phone icon (anywhere), and the top bar does nothing.
  ui.hudClick = function (x, y) {
    if (ui.busy()) return false;
    if (TS.hit(PHONE_BTN, x, y)) { TS.sfx.click(); TS.openPhone(); return true; }
    return y < 17;
  };

  // Gentle night tint for scenes (November: dark until 9, dark again at 16).
  ui.drawTint = function (g, strength) {
    const m = TS.S.t % 1440;
    let a = 0, c = '#0a0c28';
    if (m < 8 * 60 + 30 || m >= 16 * 60) a = 0.38;
    else if (m < 9 * 60 + 30 || m >= 15 * 60) { a = 0.2; c = '#28183c'; }
    else { a = 0.08; c = '#3c4658'; }
    g.globalAlpha = a * (strength == null ? 1 : strength);
    TS.rect(g, 0, 17, 320, 163, c);
    g.globalAlpha = 1;
  };

  ui.isDark = function () {
    const m = TS.S.t % 1440;
    return m < 8 * 60 + 30 || m >= 16 * 60;
  };
})();
