// wazzup.js – Kari and the WazzupApp. Kari never answers the phone. He only
// sends messages in capitals and stupid AI videos, and gets angrier and
// angrier if you don't reply right away. The chat screen is the 'wazzup' scene.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const K = () => TS.T.kari;

  // Kari's state, kept in the save: messages, when he writes next, how angry he is.
  TS.wazState = function () {
    const S = TS.S;
    if (!S.waz) {
      S.waz = { msgs: [], queue: [], next: S.t + 70, anger: 0, unread: 0, lastKari: 0, lastReply: 0, readAt: 0, readNagged: true, sent: 0 };
      // the first two messages come right away
      K().first.forEach((txt, i) => S.waz.queue.push({ at: S.t + i, text: txt }));
    }
    return S.waz;
  };

  function videoMsg(intro) {
    return { text: intro || TS.pick(K().videoIntro), video: TS.rand(0, K().videos.length - 1) };
  }

  // Kari is awake 07:00–02:30. The rest of the time he "sleeps" (= watches videos silently).
  const awake = (t) => { const m = t % 1440; return m >= 7 * 60 || m < 2 * 60 + 30; };

  // Called every game minute (from state.js).
  TS.wazTick = function () {
    const S = TS.S, w = TS.wazState();
    // deliver queued messages
    for (let i = 0; i < w.queue.length; i++) {
      const q = w.queue[i];
      if (q.at > S.t) continue;
      w.queue.splice(i--, 1);
      w.msgs.push({ from: 'kari', text: q.text, video: q.video, t: S.t });
      w.lastKari = S.t;
      w.sent++;
      if (TS.sceneName === 'wazzup') w.readAt = S.t;
      else {
        w.unread++;
        if (!S.sleeping) { ui.toast(K().notify); TS.beep(1500, 0.05, 'square', 0.03); TS.beep(1500, 0.05, 'square', 0.03, 0.09); }
      }
    }
    // read but not answered: he sees the blue ticks
    if (!w.readNagged && w.readAt && w.lastReply < w.readAt && S.t - w.readAt >= 10) {
      w.readNagged = true;
      w.queue.push({ at: S.t + 1, text: K().readNoReply });
      w.anger = Math.min(4, w.anger + 1);
    }
    // a new message when it's time
    if (S.t >= w.next && awake(S.t)) {
      const unanswered = w.lastKari > w.lastReply;
      if (unanswered && w.anger < 5) {
        w.anger++;
        w.queue.push({ at: S.t, text: K().angry[w.anger] });
        if (w.anger === 5) { // "goodbye" ... and three minutes later he's back
          w.queue.push({ at: S.t + 3, text: K().afterBye });
          w.anger = 2;
        }
        w.next = S.t + TS.rand(15, 35);
      } else {
        w.queue.push(Object.assign({ at: S.t }, TS.chance(0.4) ? videoMsg() : { text: TS.pick(K().normal) }));
        w.next = S.t + TS.rand(40, 110);
      }
    }
  };

  // Calling Kari: he never answers, and then writes something stupid.
  TS.callKari = function () {
    const S = TS.S, w = TS.wazState();
    TS.sfx.ring();
    TS.doAction({ min: 2, say: K().calling, after() {
      const txt = TS.pick(K().callBack);
      w.queue.push(Object.assign({ at: S.t + 1 }, /KATO/.test(txt) ? videoMsg(txt) : { text: txt }));
      if (TS.chance(0.5)) w.queue.push(Object.assign({ at: S.t + 3 }, TS.chance(0.5) ? videoMsg() : { text: TS.pick(K().normal) }));
    } });
  };

  // ---------------- The chat screen ----------------
  const PHONE = { x: 108, y: 22, w: 104, h: 180 };
  const SCR = { x: 113, y: 30, w: 94, h: 150 };
  const TOP = SCR.y + 15, BOTTOM = SCR.y + SCR.h - 26;
  const INPUT = { x: SCR.x + 3, y: BOTTOM + 3, w: SCR.w - 6, h: 10 };
  const CALL = { x: 222, y: 56, w: 94, h: 16 };
  const EXIT = { x: 222, y: 150, w: 68, h: 16 };
  let back = 'apartment', scroll = 0, note = null, noteT = 0, items = [];

  TS.scenes.wazzup = {
    hud: true,
    enter(arg) {
      arg = arg || {};
      if (arg.back) back = arg.back;
      const w = TS.wazState();
      if (w.unread > 0) { w.readAt = TS.S.t; w.readNagged = false; }
      if (w.unread >= 8) { note = K().bigPile.replace('{n}', w.unread); noteT = 6; } else { note = null; noteT = 0; }
      w.unread = 0;
      scroll = 0;
    },
    wheel(dir) { if (!ui.busy()) scroll = Math.max(0, scroll - dir * 20); },
    drag(dy) { if (!ui.busy()) scroll = Math.max(0, scroll + dy * 1.4); },
    click(x, y) {
      if (TS.hit(EXIT, x, y)) { TS.sfx.click(); TS.go(back); return; }
      if (TS.hit(CALL, x, y)) { TS.sfx.click(); TS.callKari(); return; }
      if (TS.hit(INPUT, x, y)) { reply(); return; }
      for (const it of items) {
        if (it.video != null && TS.hit(it.r, x, y)) { watch(it.video); return; }
      }
    },
    update(dt) {
      noteT -= dt;
      if (noteT <= 0) note = null;
      TS.idleTick(dt);
    },
    draw(g) {
      const R = TS.rect, w = TS.wazState(), S = TS.S;
      // dim room and belly behind the phone
      R(g, 0, 17, 320, 163, '#2a2620');
      R(g, 0, 17, 320, 60, '#3a3428');
      TS.ell(g, 160, 230, 175, 95, TS.PAL.w, '#2a2320', 1);
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      // chat background with a faint pattern
      R(g, SCR.x, SCR.y, SCR.w, SCR.h, '#e8e0d4');
      g.save();
      g.beginPath(); g.rect(SCR.x, TOP, SCR.w, BOTTOM - TOP); g.clip();
      for (let i = 0; i < 30; i++) TS.ell(g, SCR.x + (i * 37) % SCR.w, TOP + (i * 23) % 140, 1.5, 1.5, '#ddd4c6');
      drawMessages(g, w);
      g.restore();
      // header
      R(g, SCR.x, SCR.y, SCR.w, 15, '#1f7a5c');
      TS.text(g, '<', SCR.x + 3, SCR.y + 4.5, '#fff', { bold: true });
      TS.ell(g, SCR.x + 15, SCR.y + 7.5, 5, 5, '#d8a07a', '#fff', 0.5);
      TS.ell(g, SCR.x + 15, SCR.y + 6, 4.4, 2.4, '#3a3a3a'); // tiny cap on his profile picture
      TS.text(g, K().name, SCR.x + 23, SCR.y + 2.5, '#fff', { bold: true, s: 0.85 });
      const typing = w.queue.some((q) => q.at - S.t <= 3);
      TS.text(g, typing ? K().typing : K().status, SCR.x + 23, SCR.y + 9, '#c8f0e0', { s: 0.65 });
      // input bar
      R(g, SCR.x, BOTTOM, SCR.w, SCR.y + SCR.h - BOTTOM, '#f0ece4');
      const hov = TS.hit(INPUT, TS.mouse.x, TS.mouse.y) && !ui.busy();
      TS.rbox(g, INPUT.x, INPUT.y, INPUT.w, INPUT.h, 5, hov ? '#ffffff' : '#fbfaf8', '#c8c0b4', 0.4);
      TS.text(g, 'Kirjoita viesti...', INPUT.x + 5, INPUT.y + 2.6, '#9a948a', { s: 0.7 });
      // the hand
      const SK = TS.PAL.s, OL = 'rgba(42,32,28,0.8)';
      TS.ell(g, 116, 176, 22, 14, SK, OL, 0.6);
      [[106, 118], [105, 132], [105, 146], [106, 159]].forEach(([fx, fy]) => TS.rbox(g, fx - 4, fy - 4.5, 9, 9, 4.2, SK, OL, 0.5));
      g.save(); g.translate(214, 150); g.rotate(-0.5); TS.rbox(g, -5, -16, 10, 26, 5, SK, OL, 0.5); g.restore();
      // thoughts on the left
      const text = note || K().about;
      const lines = TS.wrap(text, 22);
      TS.rbox(g, 6, 34, 96, lines.length * 8 + 8, 6, '#f4f0e6', '#2a2320');
      lines.forEach((ln, i) => TS.text(g, ln, 11, 39 + i * 8, '#2a2320'));
      TS.button(g, CALL, 'SOITA KARILLE');
      TS.text(g, '(Hän ei vastaa.)', 269, 76, '#8a8494', { align: 'center' });
      TS.text(g, 'Rullaa hiirellä', 269, 110, '#8a8494', { align: 'center' });
      TS.button(g, EXIT, 'PUHELIN POIS');
      ui.drawHUD(g);
    },
  };

  // Messages from the bottom up (newest at the bottom). Videos can be clicked.
  function drawMessages(g, w) {
    items = [];
    const S7 = 0.68, LH = 6;
    let y = BOTTOM - 3 + scroll;
    for (let i = w.msgs.length - 1; i >= 0 && y > TOP - 200; i--) {
      const m = w.msgs[i];
      const me = m.from === 'me';
      const lines = TS.wrap(m.text, 18, S7);
      const tw = Math.max.apply(null, lines.map((ln) => TS.textW(ln, S7)));
      const vh = m.video != null ? 34 : 0;
      const bw = Math.max(tw + 8, m.video != null ? 66 : 0, 22);
      const bh = lines.length * LH + 9 + vh;
      y -= bh + 3;
      if (y > BOTTOM || y + bh < TOP) continue;
      const x = me ? SCR.x + SCR.w - 3 - bw : SCR.x + 3;
      TS.rbox(g, x, y, bw, bh, 3, me ? '#d4f5c4' : '#ffffff', '#cfc8bc', 0.3);
      let ty = y + 3;
      if (m.video != null) {
        const vr = { x: x + 3, y: y + 3, w: bw - 6, h: 30 };
        drawVideoThumb(g, vr, m.video);
        items.push({ r: vr, video: m.video });
        ty += vh;
      }
      lines.forEach((ln, k) => TS.text(g, ln, x + 4, ty + k * LH, '#1a1a1a', { s: S7, bold: !me }));
      // time and ticks
      TS.text(g, TS.clockStr(m.t) + (me ? ' ✓✓' : ''), x + bw - 2, y + bh - 5.6, me ? '#4aa0e0' : '#9a948a', { s: 0.5, align: 'right' });
    }
  }

  function drawVideoThumb(g, r, n) {
    const t = TS.realTime;
    const cols = [['#ff4fa0', '#3cf0ff'], ['#ffd23c', '#7a3cff'], ['#3cff8a', '#ff5a3c'], ['#5ac8ff', '#ffe03c']][n % 4];
    TS.rect(g, r.x, r.y, r.w, r.h, '#111');
    // wobbly AI blobs
    for (let i = 0; i < 4; i++) {
      TS.ell(g, r.x + r.w * (0.2 + 0.2 * i) + Math.sin(t * 2 + i + n) * 3, r.y + r.h * 0.5 + Math.cos(t * 1.6 + i * 2) * 5, 6 - i, 5 + (i % 2) * 3, cols[i % 2]);
    }
    TS.ell(g, r.x + r.w / 2, r.y + r.h / 2, 6, 6, 'rgba(0,0,0,0.5)');
    g.beginPath(); g.moveTo(r.x + r.w / 2 - 2, r.y + r.h / 2 - 3.5); g.lineTo(r.x + r.w / 2 + 3.5, r.y + r.h / 2); g.lineTo(r.x + r.w / 2 - 2, r.y + r.h / 2 + 3.5); g.closePath();
    g.fillStyle = '#fff'; g.fill();
    TS.text(g, 'TikTok · 0:07', r.x + 2, r.y + r.h - 5, '#fff', { s: 0.5 });
  }

  function watch(n) {
    TS.sfx.click();
    TS.doAction({ min: 2, fx: { mood: 1 }, say: [K().videos[n], K().watched] });
  }

  function reply() {
    const S = TS.S, w = TS.wazState();
    ui.choose(K().replyAsk, K().replies.map((r) => ({
      label: r.say,
      fn() {
        w.msgs.push({ from: 'me', text: r.say, t: S.t });
        w.lastReply = S.t;
        w.anger = 0;
        w.readNagged = true;
        TS.sfx.send();
        TS.fx({ mood: 2 });
        w.queue.push(Object.assign({ at: S.t + TS.rand(1, 2) }, r.video ? videoMsg(r.answer) : { text: r.answer }));
        w.next = Math.max(w.next, S.t + TS.rand(30, 70));
        scroll = 0;
      },
    })).concat([{ label: 'Älä vastaa' }]));
  }
})();
