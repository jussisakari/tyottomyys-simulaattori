// tv.js – sitting on the sofa watching the old tube TV. Three channels:
// OSTOS-TV (bogus happiness products you can order), UUTISET (unemployment
// going up), and LUONTO (in the evening: the show UNELMADUUNI).
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const TV = () => TS.T.tvScreen;

  const SCR = { x: 26, y: 30, w: 180, h: 122 };
  let ch = 0;
  let staticT = 0;
  let btns = [];

  const prodIndex = () => Math.floor(TS.realTime / 9) % TV().products.length;
  const isShowTime = () => { const m = TS.S.t % 1440; return m >= 21 * 60 && m < 22 * 60 + 30; };

  function switchChannel() {
    ch = (ch + 1) % 3;
    staticT = 0.35;
    TS.beep(200 + Math.random() * 300, 0.12, 'sawtooth', 0.02);
  }

  function order() {
    const S = TS.S;
    const p = TV().products[prodIndex()];
    const key = 'bought_' + p.id;
    if (S.flags[key]) { ui.say(TV().already, { who: 'ONNI-LINJA' }); return; }
    const text = TV().order.replace('{x}', p.name).replace('{p}', TS.euro(p.price));
    ui.choose(text, [
      { label: 'Klarnalla: 0 € nyt, maksa myöhemmin', fn() {
        S.flags[key] = true;
        S.flags.orders = (S.flags.orders || 0) + 1;
        S.debt = Math.round(((S.debt || 0) + p.price) * 100) / 100;
        TS.fx({ mood: 14 });
        TS.sfx.coin();
        ui.say(TV().klarna.replace('{p}', TS.euro(p.price)).replace('{d}', TS.euro(S.debt)));
        if (!S.flags.klarnaMail) {
          S.flags.klarnaMail = true;
          S.emails.push({ from: 'Klarna', subj: 'Kiitos ostoksestasi!', body: TV().klarnaMail, at: S.t + 45, read: false, notified: false });
        }
      } },
      { label: 'Maksa kortilla (' + TS.euro(p.price) + ')', fn() {
        if (!TS.canPay(p.price)) { TS.sfx.fail(); TS.fx({ mood: -5 }); ui.say(TV().declined, { who: 'ONNI-LINJA' }); return; }
        S.flags[key] = true;
        S.flags.orders = (S.flags.orders || 0) + 1;
        TS.fx({ money: -p.price, mood: 12 });
        TS.sfx.coin();
        ui.say(TV().bought);
      } },
      { label: 'Lopeta puhelu' },
    ], { who: 'ONNI-LINJA' });
  }

  function watch(min, label, line, fx) {
    TS.doAction({ min: min, label: label, fx: fx, say: line });
  }

  function watchHour() {
    const T = TS.T.tv, S = TS.S;
    let line;
    if (ch === 0) line = TS.pick(T.ostos).replace('{e}', TS.euro(S.money));
    else if (ch === 1) line = TS.pick(T.news);
    else line = isShowTime() ? T.evening : TS.pick(T.shows);
    watch(60, 'TELKKARI: ' + TV().channels[ch], line, { mood: -2, energy: 2 });
  }

  function watchAllDay() {
    const S = TS.S, T = TS.T.tv;
    const say = [T.allDay, TS.pick(T.ostos).replace('{e}', TS.euro(S.money)), TS.pick(T.news)];
    watch(21 * 60 - S.t, 'OSTOS-TV... UUTISET... OSTOS-TV', say, { mood: -12, energy: 6, hyg: -3 });
  }

  TS.scenes.tv = {
    hud: true,
    enter(arg) { ch = (arg && arg.kanava) || 0; staticT = 0; },
    click(x, y) {
      for (const b of btns) if (TS.hit(b.r, x, y)) { TS.sfx.click(); b.fn(); return; }
      if (TS.hit(SCR, x, y)) switchChannel();
    },
    update(dt) {
      staticT -= dt;
      TS.idleTick(dt);
    },
    draw(g) {
      const R = TS.rect, s = TS.S;
      btns = [];
      // the dark room, lit by the TV
      R(g, 0, 17, 320, 163, '#1a1820');
      R(g, 0, 150, 320, 30, '#14121a');
      // the TV set
      TS.rbox(g, 14, 22, 216, 146, 8, '#3a3a3c', '#111', 1);
      TS.rbox(g, 20, 26, 192, 132, 10, '#141414');
      TS.ell(g, 221, 40, 4, 4, '#555', '#222'); TS.ell(g, 221, 52, 4, 4, '#555', '#222');
      for (let i = 0; i < 6; i++) R(g, 215, 66 + i * 4, 12, 1.5, '#222');
      TS.ell(g, 221, 150, 1.6, 1.6, '#d03a3a');
      R(g, 60, 168, 120, 6, '#2a2a2c'); // stand

      // screen content (clipped to the rounded screen)
      g.save();
      g.beginPath();
      g.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 9);
      g.clip();
      if (staticT > 0) drawStatic(g);
      else if (ch === 0) drawOstos(g);
      else if (ch === 1) drawNews(g);
      else if (isShowTime()) drawShow(g);
      else drawNature(g);
      // scanlines and glass glare
      g.globalAlpha = 0.08;
      for (let y = SCR.y; y < SCR.y + SCR.h; y += 1.5) R(g, SCR.x, y, SCR.w, 0.5, '#000');
      g.globalAlpha = 0.07;
      TS.ell(g, SCR.x + 50, SCR.y + 25, 50, 22, '#ffffff');
      g.globalAlpha = 1;
      g.restore();

      // side panel buttons
      const bx = 238, bw = 78;
      let y = 26;
      const add = (label, fn, opts) => { const r = { x: bx, y: y, w: bw, h: 15 }; btns.push({ r: r, fn: fn }); TS.button(g, r, label, opts); y += 19; };
      add('KANAVA: ' + (ch === 2 && isShowTime() ? 'VIIHDE' : TV().channels[ch]), switchChannel);
      if (ch === 0) add('TILAA (' + TS.euro(TV().products[prodIndex()].price) + ')', order, { fill: '#6a1a3a', hoverFill: '#9a2a5a', line: '#f8d870', col: '#f8d870' });
      add('KATSO 1 H', watchHour);
      if (s.t < 21 * 60) add('KOKO PÄIVÄ (→21)', watchAllDay);
      add('SAMMUTA', () => TS.go('apartment'), { fill: '#3a2020', hoverFill: '#5a3030' });
      TS.wrap('Klikkaa ruutua vaihtaaksesi kanavaa.', 19).forEach((ln, i) => TS.text(g, ln, bx + bw / 2, y + 2 + i * 8, '#6a6474', { align: 'center' }));

      // the room glows in the TV colour
      g.globalAlpha = 0.06 + Math.sin(TS.realTime * 7) * 0.02;
      R(g, 0, 17, 320, 163, ch === 0 ? '#f070b0' : ch === 1 ? '#4a6ad0' : '#d0e0f0');
      g.globalAlpha = 1;
      ui.drawHUD(g);
    },
  };

  // ---------------- Channels ----------------
  function drawStatic(g) {
    TS.rect(g, SCR.x, SCR.y, SCR.w, SCR.h, '#777');
    for (let i = 0; i < 400; i++) {
      const v = Math.floor(Math.random() * 255);
      TS.rect(g, SCR.x + Math.random() * SCR.w, SCR.y + Math.random() * SCR.h, 2 + Math.random() * 3, 1, 'rgb(' + v + ',' + v + ',' + v + ')');
    }
  }

  function drawOstos(g) {
    const R = TS.rect, x0 = SCR.x, y0 = SCR.y;
    const p = TV().products[prodIndex()];
    const t = TS.realTime;
    // loud studio
    R(g, x0, y0, SCR.w, SCR.h, '#f4a6c8');
    for (let i = 0; i < 12; i++) R(g, x0 + i * 16, y0, 8, SCR.h, '#f8b8d4');
    R(g, x0, y0 + 84, SCR.w, 40, '#f8d870');
    // banner
    R(g, x0, y0, SCR.w, 12, '#c0206a');
    TS.text(g, 'OSTOS-TV', x0 + 12, y0 + 3.5, '#fff', { bold: true });
    if (Math.floor(t * 2) % 2) { TS.ell(g, x0 + SCR.w - 32, y0 + 6, 2, 2, '#ff3030'); }
    TS.text(g, 'SUORA', x0 + SCR.w - 28, y0 + 3.5, '#fff');

    // the host: big perm, bigger smile, waving
    const hx = x0 + 32, hy = y0 + 104;
    TS.rbox(g, hx - 11, hy - 30, 22, 32, 6, '#3a4ab0', '#1a1a3a');
    TS.rect(g, hx - 2, hy - 30, 4, 12, '#f0f0f0'); TS.rect(g, hx - 1, hy - 28, 2, 9, '#d03a3a'); // shirt + tie
    g.save(); g.translate(hx + 10, hy - 26); g.rotate(-1.9 + Math.sin(t * 6) * 0.4);
    TS.rbox(g, -2.5, 0, 5, 16, 2.5, '#3a4ab0', '#1a1a3a'); TS.ell(g, 0, 17, 3, 3, '#f0c8a0', '#2a2320');
    g.restore();
    TS.ell(g, hx, hy - 40, 11, 10, '#f8d040');         // perm
    TS.ell(g, hx, hy - 37, 8, 9, '#f0c8a0', '#2a2320'); // face
    TS.ell(g, hx - 3, hy - 40, 1, 1.3, '#222'); TS.ell(g, hx + 3, hy - 40, 1, 1.3, '#222');
    g.beginPath(); g.arc(hx, hy - 35, 4.5, 0.15, Math.PI - 0.15); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 0.6; g.strokeStyle = '#2a2320'; g.stroke();
    // speech bubble
    const line = TV().hosts[Math.floor(t / 2.2) % TV().hosts.length];
    const bw = TS.textW(line) + 8;
    TS.rbox(g, hx - 4, y0 + 16, bw, 11, 4, '#fff', '#2a2320');
    TS.text(g, line, hx, y0 + 19, '#c0206a', { bold: true });

    // product name and picture
    TS.text(g, p.name, x0 + 128, y0 + 30, '#2a1040', { align: 'center', s: 1.4, bold: true, shadow: '#fff' });
    drawProduct(g, p.id, x0 + 112, y0 + 62, t);
    // price star
    starburst(g, x0 + 156, y0 + 70, 18, 12, '#ffe020', '#d02020', t);
    TS.text(g, 'VAIN', x0 + 156, y0 + 64, '#d02020', { align: 'center', bold: true });
    TS.text(g, TS.euro(p.price), x0 + 156, y0 + 72, '#d02020', { align: 'center', bold: true });
    // pitch
    R(g, x0 + 60, y0 + 88, SCR.w - 60, 22, 'rgba(40,10,40,0.75)');
    TS.wrap(p.pitch, 29).slice(0, 2).forEach((ln, i) => TS.text(g, ln, x0 + 64, y0 + 91 + i * 8, '#fff'));
    // flashing phone number
    R(g, x0, y0 + SCR.h - 11, SCR.w, 11, Math.floor(t * 3) % 2 ? '#d02020' : '#a01010');
    TS.text(g, TV().phoneNo, x0 + SCR.w / 2, y0 + SCR.h - 8, '#ffe020', { align: 'center', bold: true });
  }

  function starburst(g, cx, cy, r1, r2, fill, line, t) {
    g.beginPath();
    const n = 12, rot = t * 0.5;
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1;
      const a = rot + (i / (n * 2)) * Math.PI * 2;
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8);
    }
    g.closePath();
    g.fillStyle = fill; g.fill();
    g.lineWidth = 0.8; g.strokeStyle = line; g.stroke();
  }

  function drawProduct(g, id, cx, cy, t) {
    const OL = '#2a2320';
    if (id === 'panta') {
      g.lineWidth = 4; g.strokeStyle = '#e04a9a';
      g.beginPath(); g.arc(cx, cy + 8, 14, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      TS.ell(g, cx, cy - 12, 6, 6, Math.floor(t * 4) % 2 ? '#fff8a0' : '#ffe040', OL);
      TS.rect(g, cx - 3, cy - 7, 6, 4, '#aaa');
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + t; TS.rect(g, cx + Math.cos(a) * 10 - 0.5, cy - 12 + Math.sin(a) * 10 - 0.5, 1.5, 1.5, '#ffe040'); }
    } else if (id === 'magneetti') {
      g.lineWidth = 6; g.strokeStyle = '#d02a2a';
      g.beginPath(); g.arc(cx, cy, 11, Math.PI, 0, true); g.stroke();
      TS.rect(g, cx - 14, cy - 3, 6, 5, '#ccc'); TS.rect(g, cx + 8, cy - 3, 6, 5, '#ccc');
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.6 + i / 3) % 1;
        const bx = cx - 4 + (1 - k) * 30, by = cy - 22 + i * 6;
        TS.rbox(g, bx, by, 8, 5, 1, '#6b4a2e', OL); TS.rect(g, bx + 3, by - 1.5, 2, 1.5, '#6b4a2e');
      }
    } else if (id === 'spray') {
      TS.rbox(g, cx - 6, cy - 14, 12, 26, 3, '#d8dce0', OL);
      TS.rect(g, cx - 6, cy - 6, 12, 10, '#e04a9a');
      TS.text(g, 'EGO', cx, cy - 3, '#fff', { align: 'center', bold: true });
      TS.rbox(g, cx - 3, cy - 19, 6, 5, 1, '#333');
      for (let i = 0; i < 5; i++) { const k = (t + i * 0.2) % 1; TS.ell(g, cx + 6 + k * 18, cy - 18 - k * 6 + i, 1 + k, 1 + k, 'rgba(255,255,255,' + (1 - k) + ')'); }
    } else if (id === 'vatsa') {
      g.save(); g.translate(cx, cy + 2); g.rotate(t * 2);
      TS.ell(g, 0, 0, 9, 9, '#3a3a3a', OL); TS.ell(g, 0, 0, 3, 3, '#ccc');
      for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); TS.rect(g, 3, -0.7, 5, 1.4, '#888'); }
      g.restore();
      TS.rect(g, cx - 20, cy + 1, 40, 2, '#c03a3a'); TS.rbox(g, cx - 24, cy - 1, 6, 6, 2, '#222'); TS.rbox(g, cx + 18, cy - 1, 6, 6, 2, '#222');
      TS.text(g, '3000', cx, cy - 16, '#c03a3a', { align: 'center', bold: true, s: 1.2 });
    } else if (id === 'tyyny') {
      TS.rbox(g, cx - 16, cy - 6, 32, 18, 7, '#e8e0f8', OL);
      TS.ell(g, cx - 4, cy + 3, 1, 1, '#888'); TS.ell(g, cx + 4, cy + 3, 1, 1, '#888');
      if (Math.floor(t * 1.5) % 2) { TS.rbox(g, cx - 12, cy - 22, 46, 11, 4, '#fff', OL); TS.text(g, 'Sä pystyt siihen', cx + 11, cy - 19, '#6a3aa0', { align: 'center' }); }
    } else if (id === 'lamppu') {
      TS.rect(g, cx - 1, cy, 2, 14, '#555'); TS.rbox(g, cx - 8, cy + 13, 16, 3, 1, '#333');
      for (let i = 0; i < 12; i++) {
        const a = i * 0.5236 + t * 0.8;
        g.lineWidth = 1.2; g.strokeStyle = '#ffd030';
        g.beginPath(); g.moveTo(cx + Math.cos(a) * 12, cy - 6 + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * 17, cy - 6 + Math.sin(a) * 17); g.stroke();
      }
      TS.ell(g, cx, cy - 6, 10, 10, '#ffe040', '#e0a020');
      TS.ell(g, cx - 3, cy - 8, 1, 1, '#a06010'); TS.ell(g, cx + 3, cy - 8, 1, 1, '#a06010');
      g.beginPath(); g.arc(cx, cy - 5, 4, 0.2, Math.PI - 0.2); g.lineWidth = 0.8; g.strokeStyle = '#a06010'; g.stroke();
    }
  }

  function drawNews(g) {
    const R = TS.rect, x0 = SCR.x, y0 = SCR.y, t = TS.realTime;
    R(g, x0, y0, SCR.w, SCR.h, '#1c2c5c');
    for (let i = 0; i < 6; i++) R(g, x0, y0 + i * 14, SCR.w, 0.5, '#2a3c74');
    // anchor behind the desk
    const ax = x0 + 36, ay = y0 + 82;
    TS.rbox(g, ax - 13, ay - 22, 26, 26, 6, '#a03a3a', '#2a1a1a');
    TS.ell(g, ax, ay - 32, 9, 9.5, '#4a2a1a');            // bob hair
    TS.ell(g, ax, ay - 31, 7, 8, '#f0c8a0', '#2a2320');
    TS.rect(g, ax - 7, ay - 39, 14, 3, '#4a2a1a');         // fringe
    TS.ell(g, ax - 2.5, ay - 32, 0.9, 0.9, '#222'); TS.ell(g, ax + 2.5, ay - 32, 0.9, 0.9, '#222');
    TS.ell(g, ax, ay - 27, 2, Math.floor(t * 8) % 3 ? 0.6 : 1.4, '#8a2a2a'); // talking
    R(g, x0, ay + 2, 90, 30, '#8a95b0'); R(g, x0, ay + 2, 90, 2, '#c0c8d8');
    // chart
    const cx = x0 + 92, cy = y0 + 18, cw = 80, chh = 58;
    TS.rbox(g, cx, cy, cw, chh, 2, '#eef0f4');
    TS.text(g, 'TYÖTTÖMYYSASTE %', cx + 4, cy + 3, '#1c2c5c', { bold: true });
    R(g, cx + 8, cy + 14, 0.8, 38, '#1c2c5c'); R(g, cx + 8, cy + 52, 66, 0.8, '#1c2c5c');
    const data = [7.6, 7.9, 8.4, 8.8, 9.5, 10.2, 10.9];
    const prog = Math.min(1, (t % 6) / 3.5);
    const n = 1 + Math.floor(prog * (data.length - 1));
    g.beginPath();
    for (let i = 0; i <= n && i < data.length; i++) {
      const px = cx + 10 + i * 10, py = cy + 52 - (data[i] - 7) * 9;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.lineWidth = 1.6; g.strokeStyle = '#d02a2a'; g.stroke();
    if (n >= data.length - 1) {
      TS.text(g, '10,9 %', cx + cw - 4, cy + 12, '#d02a2a', { align: 'right', bold: true });
      g.beginPath(); g.moveTo(cx + 74, cy + 22); g.lineTo(cx + 70, cy + 28); g.lineTo(cx + 78, cy + 28); g.closePath(); g.fillStyle = '#d02a2a'; g.fill();
    }
    // lower third
    R(g, x0, y0 + 88, 36, 12, '#d02a2a');
    TS.text(g, 'UUTISET', x0 + 18, y0 + 91.5, '#fff', { align: 'center', bold: true });
    R(g, x0 + 36, y0 + 88, SCR.w - 36, 12, '#f0f0f0');
    TS.text(g, TV().newsHead, x0 + 40, y0 + 91.5, '#1c2c5c', { bold: true });
    R(g, x0 + 36, y0 + 100, SCR.w - 36, 9, '#c8ccd8');
    TS.text(g, TV().newsSub, x0 + 40, y0 + 102, '#1c2c5c', { s: 0.85 });
    // ticker
    R(g, x0, y0 + SCR.h - 12, SCR.w, 12, '#0c1430');
    const tk = TV().ticker;
    const tw = TS.textW(tk);
    const off = (t * 28) % tw;
    TS.text(g, tk, x0 - off, y0 + SCR.h - 8.5, '#ffe020');
    TS.text(g, tk, x0 - off + tw, y0 + SCR.h - 8.5, '#ffe020');
  }

  function drawNature(g) {
    const R = TS.rect, x0 = SCR.x, y0 = SCR.y, t = TS.realTime;
    R(g, x0, y0, SCR.w, SCR.h, '#8aa0b8');
    R(g, x0, y0 + 70, SCR.w, 60, '#eef2f6');
    [[20, 60], [44, 52], [140, 58], [162, 50]].forEach(([tx, ty]) => {
      g.beginPath(); g.moveTo(x0 + tx, y0 + ty - 34); g.lineTo(x0 + tx - 12, y0 + ty + 12); g.lineTo(x0 + tx + 12, y0 + ty + 12); g.closePath();
      g.fillStyle = '#2a4a3a'; g.fill();
      R(g, x0 + tx - 1.5, y0 + ty + 12, 3, 6, '#4a3a2a');
    });
    // the den and the sleeping bear
    TS.ell(g, x0 + 92, y0 + 84, 34, 18, '#6a5a4a', '#3a2a1a');
    TS.ell(g, x0 + 92, y0 + 88, 24, 11, '#2a1e14');
    const br = 1 + Math.sin(t * 1.5) * 0.04;
    TS.ell(g, x0 + 92, y0 + 90, 18 * br, 8 * br, '#6b4226');
    TS.ell(g, x0 + 78, y0 + 89, 6, 5, '#6b4226');
    TS.ell(g, x0 + 75, y0 + 85, 1.8, 1.8, '#6b4226');
    TS.ell(g, x0 + 73, y0 + 90, 1, 0.8, '#111');
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.5 + i / 3) % 1;
      TS.text(g, 'z', x0 + 80 + k * 14 + i * 3, y0 + 74 - k * 22, 'rgba(255,255,255,' + (1 - k) + ')', { s: 0.8 + k });
    }
    // snow
    for (let i = 0; i < 30; i++) TS.ell(g, x0 + (i * 37 + t * 8) % SCR.w, y0 + (i * 23 + t * 14) % 70, 0.7, 0.7, '#fff');
    R(g, x0, y0 + SCR.h - 20, SCR.w, 20, 'rgba(0,0,0,0.6)');
    TS.wrap(TV().nature, 43).slice(0, 2).forEach((ln, i) => TS.text(g, ln, x0 + SCR.w / 2, y0 + SCR.h - 17 + i * 8, '#fff', { align: 'center' }));
  }

  function drawShow(g) {
    const R = TS.rect, x0 = SCR.x, y0 = SCR.y, t = TS.realTime;
    R(g, x0, y0, SCR.w, SCR.h, '#14102a');
    // spotlights
    g.globalAlpha = 0.18;
    [[40, 0.4], [90, -0.2], [140, 0.6]].forEach(([sx, ph]) => {
      const to = x0 + sx + Math.sin(t + ph) * 20;
      g.beginPath(); g.moveTo(x0 + sx, y0); g.lineTo(to - 16, y0 + 100); g.lineTo(to + 16, y0 + 100); g.closePath();
      g.fillStyle = '#fff6c0'; g.fill();
    });
    g.globalAlpha = 1;
    R(g, x0, y0 + 96, SCR.w, 30, '#3a2a5a');
    TS.text(g, 'UNELMADUUNI', x0 + SCR.w / 2, y0 + 8, '#ffd030', { align: 'center', s: 1.6, bold: true, shadow: '#a02060' });
    // three hopeful contestants on podiums
    [[40, '#4a8a4a'], [90, '#c03a3a'], [140, '#3a6ac0']].forEach(([px, c], i) => {
      R(g, x0 + px - 10, y0 + 76, 20, 20, '#6a4a9a');
      TS.text(g, String(i + 1), x0 + px, y0 + 83, '#fff', { align: 'center', bold: true });
      TS.rbox(g, x0 + px - 6, y0 + 56, 12, 20, 4, c);
      TS.ell(g, x0 + px, y0 + 51, 5, 5.5, '#f0c8a0');
      const jump = Math.max(0, Math.sin(t * 4 + i * 2)) * 3;
      TS.rect(g, x0 + px - 9, y0 + 58 - jump, 3, 9, '#f0c8a0'); // raised hand
    });
    R(g, x0, y0 + SCR.h - 20, SCR.w, 20, 'rgba(0,0,0,0.6)');
    TS.wrap(TV().show, 43).slice(0, 2).forEach((ln, i) => TS.text(g, ln, x0 + SCR.w / 2, y0 + SCR.h - 17 + i * 8, '#fff', { align: 'center' }));
  }
})();
