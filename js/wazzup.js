// wazzup.js – the WazzupApp. Opens to the list of recent chats:
//  - Kari: never answers the phone, only wake-up shouting in capitals and stupid
//    AI videos, and he gets angrier and angrier if you don't reply right away.
//  - PikaVippi24 and Kasino Kultakala: ads. You can actually take the loan or spin.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const K = () => TS.T.kari;
  const SP = () => TS.T.wazSpam;

  // State, kept in the save. Kari's chat is msgs/unread; the ad chats are in w.other.
  TS.wazState = function () {
    const S = TS.S;
    if (!S.waz) {
      S.waz = { msgs: [], queue: [], next: S.t + 70, anger: 0, unread: 0, lastKari: 0, lastReply: 0, readAt: 0, readNagged: true, sent: 0 };
      K().first.forEach((txt, i) => S.waz.queue.push({ at: S.t + i, text: txt }));
    }
    if (!S.waz.other) {
      S.waz.other = {};
      Object.keys(SP()).forEach((id) => { S.waz.other[id] = { msgs: [], unread: 0, done: 0 }; });
    }
    return S.waz;
  };

  // All unread messages (for the badges)
  TS.wazUnread = function () {
    const w = TS.wazState();
    return w.unread + Object.keys(w.other).reduce((a, id) => a + w.other[id].unread, 0);
  };

  function videoMsg(intro) {
    return { text: intro || TS.pick(K().videoIntro), video: TS.rand(0, K().videos.length - 1) };
  }

  // Kari is awake 07:00–02:30.
  const awake = (t) => { const m = t % 1440; return m >= 7 * 60 || m < 2 * 60 + 30; };
  const viewing = (id) => TS.sceneName === 'wazzup' && view === id;

  // Called every game minute (from state.js).
  TS.wazTick = function () {
    const S = TS.S, w = TS.wazState();
    // Kari's queued messages
    for (let i = 0; i < w.queue.length; i++) {
      const q = w.queue[i];
      if (q.at > S.t) continue;
      w.queue.splice(i--, 1);
      w.msgs.push({ from: 'kari', text: q.text, video: q.video, t: S.t });
      w.lastKari = S.t;
      w.sent++;
      if (viewing('kari')) w.readAt = S.t;
      else notify(K().notify);
      if (!viewing('kari')) w.unread++;
    }
    // the ads arrive at their own times
    Object.keys(SP()).forEach((id) => {
      const c = w.other[id], list = SP()[id].msgs;
      while (c.done < list.length && list[c.done][0] <= S.t) {
        c.msgs.push({ from: 'them', text: list[c.done][1], ad: list[c.done][2], t: S.t });
        c.done++;
        if (!viewing(id)) { c.unread++; notify('WAZZUPAPP: ' + SP()[id].name.toUpperCase()); }
      }
    });
    // Kari: read but not answered, he sees the blue ticks
    if (!w.readNagged && w.readAt && w.lastReply < w.readAt && S.t - w.readAt >= 10) {
      w.readNagged = true;
      w.queue.push({ at: S.t + 1, text: K().readNoReply });
      w.anger = Math.min(4, w.anger + 1);
    }
    // Kari: a new message when it's time
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
        w.queue.push(Object.assign({ at: S.t }, TS.chance(0.35) ? videoMsg() : { text: TS.pick(K().normal) }));
        w.next = S.t + TS.rand(40, 110);
      }
    }
  };

  function notify(text) {
    if (TS.S.sleeping) return;
    ui.toast(text);
    TS.beep(1500, 0.05, 'square', 0.03);
    TS.beep(1500, 0.05, 'square', 0.03, 0.09);
  }

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

  // ---------------- The screen ----------------
  const PHONE = { x: 108, y: 22, w: 104, h: 180 };
  const SCR = { x: 113, y: 30, w: 94, h: 150 };
  const TOP = SCR.y + 15, BOTTOM = SCR.y + SCR.h - 26;
  const INPUT = { x: SCR.x + 3, y: BOTTOM + 3, w: SCR.w - 6, h: 10 };
  const BACK = { x: SCR.x, y: SCR.y, w: 12, h: 15 };
  const CALL = { x: 222, y: 56, w: 94, h: 16 };
  const EXIT = { x: 222, y: 150, w: 68, h: 16 };
  let back = 'apartment', view = 'list', scroll = 0, note = null, noteT = 0, items = [];

  function openChat(id) {
    const w = TS.wazState();
    view = id;
    scroll = 0;
    if (id === 'kari') {
      if (w.unread > 0) { w.readAt = TS.S.t; w.readNagged = false; }
      if (w.unread >= 8) { note = K().bigPile.replace('{n}', w.unread); noteT = 6; }
      w.unread = 0;
    } else {
      w.other[id].unread = 0;
    }
  }

  TS.scenes.wazzup = {
    hud: true,
    openChat: (id) => openChat(id), // also handy for tests
    enter(arg) {
      arg = arg || {};
      if (arg.back) back = arg.back;
      TS.wazState();
      view = 'list';
      note = null; noteT = 0;
    },
    wheel(dir) { if (!ui.busy() && view !== 'list') scroll = Math.max(0, scroll - dir * 20); },
    drag(dy) { if (!ui.busy() && view !== 'list') scroll = Math.max(0, scroll + dy * 1.4); },
    click(x, y) {
      if (TS.hit(EXIT, x, y)) { TS.sfx.click(); TS.go(back); return; }
      if (TS.hit(CALL, x, y)) { TS.sfx.click(); TS.callKari(); return; }
      if (view === 'list') {
        for (const it of items) if (TS.hit(it.r, x, y)) { TS.sfx.click(); openChat(it.chat); return; }
        return;
      }
      if (TS.hit(BACK, x, y)) { TS.sfx.click(); view = 'list'; return; }
      if (TS.hit(INPUT, x, y)) { if (view === 'kari') replyKari(); else replyAd(view); return; }
      for (const it of items) {
        if (it.video != null && TS.hit(it.r, x, y)) { watch(it.video); return; }
        if (it.ad != null && TS.hit(it.r, x, y)) { TS.sfx.click(); TS.go('laptop', { phone: true, back: 'wazzup', view: 'ad', ad: it.ad }); return; }
      }
    },
    update(dt) {
      noteT -= dt;
      if (noteT <= 0) note = null;
      TS.idleTick(dt);
    },
    draw(g) {
      const R = TS.rect, w = TS.wazState(), S = TS.S;
      R(g, 0, 17, 320, 163, '#2a2620');
      R(g, 0, 17, 320, 60, '#3a3428');
      TS.ell(g, 160, 230, 175, 95, TS.PAL.w, '#2a2320', 1);
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      items = [];
      if (view === 'list') drawList(g, w);
      else drawChat(g, w, S);
      drawHand(g);
      // thoughts on the left
      const text = note || (view === 'kari' ? K().about : view === 'list' ? null : null);
      if (text) {
        const lines = TS.wrap(text, 22);
        TS.rbox(g, 6, 34, 96, lines.length * 8 + 8, 6, '#f4f0e6', '#2a2320');
        lines.forEach((ln, i) => TS.text(g, ln, 11, 39 + i * 8, '#2a2320'));
      }
      TS.button(g, CALL, 'SOITA KARILLE');
      TS.text(g, '(Hän ei vastaa.)', 269, 76, '#8a8494', { align: 'center' });
      if (view !== 'list') TS.text(g, 'Rullaa hiirellä', 269, 110, '#8a8494', { align: 'center' });
      TS.button(g, EXIT, 'PUHELIN POIS');
      ui.drawHUD(g);
    },
  };

  function drawHand(g) {
    const SK = TS.PAL.s, OL = 'rgba(42,32,28,0.8)';
    TS.ell(g, 116, 176, 22, 14, SK, OL, 0.6);
    [[106, 118], [105, 132], [105, 146], [106, 159]].forEach(([fx, fy]) => TS.rbox(g, fx - 4, fy - 4.5, 9, 9, 4.2, SK, OL, 0.5));
    g.save(); g.translate(214, 150); g.rotate(-0.5); TS.rbox(g, -5, -16, 10, 26, 5, SK, OL, 0.5); g.restore();
  }

  // A round profile picture
  function avatar(g, id, cx, cy, r) {
    if (id === 'kari') {
      TS.ell(g, cx, cy, r, r, '#d8a07a', '#fff', 0.5);
      TS.ell(g, cx, cy - r * 0.3, r * 0.88, r * 0.48, '#2a4a6a'); // his cap
    } else {
      const c = SP()[id];
      TS.ell(g, cx, cy, r, r, c.color, '#fff', 0.5);
      TS.text(g, c.initials, cx, cy - r * 0.55, '#fff', { align: 'center', bold: true, s: r / 4.2 });
    }
  }

  // ---- The list of recent chats (newest first) ----
  function drawList(g, w) {
    const R = TS.rect, x = SCR.x;
    R(g, SCR.x, SCR.y, SCR.w, SCR.h, '#ffffff');
    R(g, SCR.x, SCR.y, SCR.w, 15, '#1f7a5c');
    TS.text(g, K().app, x + 4, SCR.y + 4.5, '#fff', { bold: true, s: 0.9 });
    TS.text(g, TS.T.wazList, x + 4, SCR.y + 17.5, '#1f7a5c', { s: 0.6, bold: true });
    const chats = [{ id: 'kari', name: K().name, msgs: w.msgs, unread: w.unread }];
    Object.keys(SP()).forEach((id) => chats.push({ id: id, name: SP()[id].name, msgs: w.other[id].msgs, unread: w.other[id].unread }));
    const last = (c) => (c.msgs.length ? c.msgs[c.msgs.length - 1] : null);
    chats.sort((a, b) => (last(b) ? last(b).t : -1) - (last(a) ? last(a).t : -1));
    let y = SCR.y + 24;
    chats.forEach((c) => {
      const m = last(c);
      if (!m && c.id !== 'kari') return; // ads appear once they have written
      const r = { x: x, y: y, w: SCR.w, h: 19 };
      if (TS.hit(r, TS.mouse.x, TS.mouse.y) && !ui.busy()) R(g, r.x, r.y, r.w, r.h, '#eef6f2');
      avatar(g, c.id, x + 8.5, y + 9.5, 6);
      TS.text(g, c.name, x + 18, y + 3, '#111', { bold: true, s: 0.72 });
      if (m) {
        TS.text(g, TS.clockStr(m.t), x + SCR.w - 3, y + 3.2, c.unread ? '#25b860' : '#999', { align: 'right', s: 0.55 });
        let prev = (m.from === 'me' ? '✓✓ ' : '') + (m.video != null ? '[video] ' : '') + m.text;
        while (prev.length > 3 && TS.textW(prev + '…', 0.6) > SCR.w - 32) prev = prev.slice(0, -1);
        if (prev !== ((m.from === 'me' ? '✓✓ ' : '') + (m.video != null ? '[video] ' : '') + m.text)) prev += '…';
        TS.text(g, prev, x + 18, y + 10, c.unread ? '#222' : '#777', { s: 0.6, bold: !!c.unread });
      }
      if (c.unread) {
        TS.ell(g, x + SCR.w - 7, y + 12.5, 3.4, 3.4, '#25b860');
        TS.text(g, c.unread > 9 ? '9+' : String(c.unread), x + SCR.w - 7, y + 10.4, '#fff', { align: 'center', bold: true, s: 0.55 });
      }
      R(g, x + 18, y + 18.6, SCR.w - 18, 0.3, '#e4e4e4');
      items.push({ r: r, chat: c.id });
      y += 20;
    });
  }

  // ---- One chat ----
  function drawChat(g, w, S) {
    const R = TS.rect, isKari = view === 'kari';
    const msgs = isKari ? w.msgs : w.other[view].msgs;
    R(g, SCR.x, SCR.y, SCR.w, SCR.h, '#e8e0d4');
    g.save();
    g.beginPath(); g.rect(SCR.x, TOP, SCR.w, BOTTOM - TOP); g.clip();
    for (let i = 0; i < 30; i++) TS.ell(g, SCR.x + (i * 37) % SCR.w, TOP + (i * 23) % 140, 1.5, 1.5, '#ddd4c6');
    drawMessages(g, msgs);
    g.restore();
    // header with back arrow
    R(g, SCR.x, SCR.y, SCR.w, 15, '#1f7a5c');
    TS.text(g, '<', SCR.x + 3, SCR.y + 4.5, '#fff', { bold: true });
    avatar(g, view, SCR.x + 15, SCR.y + 7.5, 5);
    const name = isKari ? K().name : SP()[view].name;
    TS.text(g, name, SCR.x + 23, SCR.y + 2.5, '#fff', { bold: true, s: 0.85 });
    const typing = isKari && w.queue.some((q) => q.at - S.t <= 3);
    TS.text(g, isKari ? (typing ? K().typing : K().status) : SP()[view].status, SCR.x + 23, SCR.y + 9, '#c8f0e0', { s: 0.65 });
    // input bar
    R(g, SCR.x, BOTTOM, SCR.w, SCR.y + SCR.h - BOTTOM, '#f0ece4');
    const hov = TS.hit(INPUT, TS.mouse.x, TS.mouse.y) && !ui.busy();
    TS.rbox(g, INPUT.x, INPUT.y, INPUT.w, INPUT.h, 5, hov ? '#ffffff' : '#fbfaf8', '#c8c0b4', 0.4);
    TS.text(g, 'Kirjoita viesti...', INPUT.x + 5, INPUT.y + 2.6, '#9a948a', { s: 0.7 });
  }

  // Messages from the bottom up (newest at the bottom). Videos can be clicked.
  function drawMessages(g, msgs) {
    const S7 = 0.68, LH = 6;
    let y = BOTTOM - 3 + scroll;
    for (let i = msgs.length - 1; i >= 0 && y > TOP - 200; i--) {
      const m = msgs[i];
      const me = m.from === 'me';
      const lines = TS.wrap(m.text, 18, S7);
      const tw = Math.max.apply(null, lines.map((ln) => TS.textW(ln, S7)));
      const vh = m.video != null ? 34 : 0;
      const lh = m.ad != null ? 15 : 0; // a job link card under the text
      const bw = Math.max(tw + 8, m.video != null ? 66 : 0, 22);
      const bh = lines.length * LH + 9 + vh + lh;
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
      const bold = !me && view === 'kari'; // Kari shouts
      lines.forEach((ln, k) => TS.text(g, ln, x + 4, ty + k * LH, '#1a1a1a', { s: S7, bold: bold }));
      if (m.ad != null) { // the job link: tap to open the ad in Työkkäri.fi
        const ad = TS.T.ads[m.ad];
        const lr = { x: x + 3, y: ty + lines.length * LH + 1, w: bw - 6, h: 13 };
        const hov = TS.hit(lr, TS.mouse.x, TS.mouse.y) && !ui.busy();
        TS.rbox(g, lr.x, lr.y, lr.w, lr.h, 2, hov ? '#e0eef8' : '#f0f4f8', '#b8c8d8', 0.3);
        TS.rect(g, lr.x, lr.y, 1.6, lr.h, '#2f7a4a');
        TS.text(g, ad.title.length > 20 ? ad.title.slice(0, 19) + '…' : ad.title, lr.x + 4, lr.y + 1.6, '#1a1a1a', { s: 0.6, bold: true });
        TS.text(g, 'tyokkari.fi/paikka/' + (4100 + m.ad * 37), lr.x + 4, lr.y + 7.4, '#2a6ac0', { s: 0.52 });
        items.push({ r: lr, ad: m.ad });
      }
      TS.text(g, TS.clockStr(m.t) + (me ? ' ✓✓' : ''), x + bw - 2, y + bh - 5.6, me ? '#4aa0e0' : '#9a948a', { s: 0.5, align: 'right' });
    }
  }

  function drawVideoThumb(g, r, n) {
    const t = TS.realTime;
    const cols = [['#ff4fa0', '#3cf0ff'], ['#ffd23c', '#7a3cff'], ['#3cff8a', '#ff5a3c'], ['#5ac8ff', '#ffe03c']][n % 4];
    TS.rect(g, r.x, r.y, r.w, r.h, '#111');
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

  function replyKari() {
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

  // Replying to the ads: the loan and the spins really happen.
  function replyAd(id) {
    const S = TS.S, w = TS.wazState(), c = w.other[id], A = SP()[id];
    const answer = (text) => c.msgs.push({ from: 'them', text: text, t: S.t });
    ui.choose(A.ask, A.replies.map((r) => ({
      label: r.say,
      fn() {
        c.msgs.push({ from: 'me', text: r.say.replace(/ \(.*\)$/, ''), t: S.t });
        TS.sfx.send();
        scroll = 0;
        if (r.loan) {
          if (S.flags.vippi) { answer(A.loanAgain); return; }
          S.flags.vippi = true;
          S.vippiDebt = 135;
          TS.fx({ money: 100, mood: 6 });
          TS.sfx.coin();
          answer(A.loanYes);
          note = A.loanThought; noteT = 7;
        } else if (r.spin) {
          if (!TS.canPay(5)) { answer(A.broke); return; }
          TS.fx({ money: -5 });
          S.flags.spins = (S.flags.spins || 0) + 1;
          if (TS.chance(0.12)) { TS.fx({ money: 40, mood: 10 }); TS.sfx.coin(); answer(A.win); }
          else { TS.fx({ mood: -5 }); TS.sfx.fail(); answer(TS.pick(A.lose)); }
          TS.advance(1);
        } else {
          answer(r.answer);
          if (r.mood) TS.fx({ mood: r.mood });
        }
      },
    })).concat([{ label: 'Älä vastaa' }]));
  }
})();
