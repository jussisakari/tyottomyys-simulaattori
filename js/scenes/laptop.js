// laptop.js – the phone apps: job portal Työkkäri.fi, e-mail, some, Tori.fi, bank.
// Everything happens on the phone (arg.phone = true). The old laptop (arg.phone = false)
// only shows an 'WIN 95' installation that never ends.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const L = () => TS.T.lap;

  let phone = false, back = 'apartment', view = 'home';
  let sel = 0, slots = [0, 0, 0], readMail = null;
  let btns = [];
  let SC = { x: 16, y: 24, w: 288, h: 146 };

  const INK = '#202428', GREEN = '#2f7a4a', PAPER = '#f0f0ea';

  function btn(r, label, fn, opts) {
    btns.push({ r: r, fn: fn });
    TS.button(ui_g, r, label, Object.assign({ fill: '#dfe8df', hoverFill: '#b8d8b8', line: GREEN, col: INK }, opts || {}));
  }
  let ui_g = null;

  // Back to the phone's home screen (the app grid)
  function goHome() { if (phone) TS.go(back); else view = 'home'; }

  function needNet(next) {
    next();
  }

  function visibleAds() {
    const s = TS.S;
    return s.adOrder.filter((i) => s.appliedAds.indexOf(i) < 0).slice(0, 5);
  }

  function visibleMail() {
    const s = TS.S;
    return s.emails.filter((m) => !m.hidden && m.at <= s.t).slice().reverse();
  }

  function send() {
    const s = TS.S;
    const ad = TS.T.ads[sel];
    const drunk = s.drunk >= 2;
    const mins = 45;
    const chosen = slots.slice();
    s.appliedAds.push(sel);
    view = 'ads';
    TS.doAction({
      min: mins, label: 'NÄPYTTELET PEUKALOILLA',
      fx: { energy: -8, mood: -2 },
      say: drunk ? L().sentDrunk : L().sent,
      after() {
        s.apps++;
        if (drunk) s.typos++;
        TS.sfx.send();
        if (s.apps === 4) ui.say(L().fourth);
        const M = TS.T.mail;
        let body = TS.pick(M.rejections);
        if (drunk) body = M.rejDrunk;
        else if (chosen[2] === 3) body = M.rejBottles;
        else if (chosen[1] === 2) body = M.rejSabbatical;
        s.emails.push({ from: ad.firm, subj: 'RE: ' + ad.title, body: body, at: s.t + TS.rand(3, 90), read: false, notified: false });
        // Very rarely, a real interview invitation... into the spam folder.
        if (!s.miracle && TS.chance(0.06)) {
          s.miracle = true;
          s.emails.push({ hidden: true, from: ad.firm, subj: 'Haastattelukutsu', body: '', at: s.t, read: false, notified: true });
        }
      },
    });
  }

  // Two thumbs on the edges of the phone held sideways.
  const OUTL = 'rgba(42,32,28,0.8)';
  function drawThumbs(g) {
    [[46, 132, 0.5], [274, 132, -0.5]].forEach(([x, y, a]) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      TS.rbox(g, -5, -15, 10, 30, 5, TS.PAL.s, OUTL, 0.5);
      TS.rbox(g, -3.5, -14, 7, 6, 3, '#f0d0b8');
      g.restore();
    });
  }

  // ---------------- The old laptop: an installation that never ends ----------------
  function drawInstall(g, s) {
    const R = TS.rect, X = L().install;
    const n = s.flags.disk || 14;
    R(g, SC.x, SC.y, SC.w, SC.h, '#008080');
    // a grey setup window, the 90s way
    const wx = SC.x + 40, wy = SC.y + 22, ww = SC.w - 80, wh = 92;
    R(g, wx + 3, wy + 3, ww, wh, '#004040');
    R(g, wx, wy, ww, wh, '#c0c0c0');
    R(g, wx, wy, ww, 1, '#ffffff'); R(g, wx, wy, 1, wh, '#ffffff');
    R(g, wx, wy + wh - 1, ww, 1, '#404040'); R(g, wx + ww - 1, wy, 1, wh, '#404040');
    R(g, wx + 2, wy + 2, ww - 4, 10, '#000080');
    TS.text(g, X.title, wx + 5, wy + 4.5, '#ffffff', { bold: true, s: 0.85 });
    R(g, wx + ww - 11, wy + 3.5, 8, 7, '#c0c0c0'); TS.text(g, 'x', wx + ww - 7, wy + 4, '#000', { align: 'center', s: 0.8 });
    TS.text(g, X.disk.replace('{n}', n), wx + 8, wy + 18, '#000');
    TS.text(g, X.left.replace('{h}', 2 + n % 5), wx + 8, wy + 27, '#000', { s: 0.85 });
    // progress bar that never gets anywhere
    R(g, wx + 8, wy + 38, ww - 16, 10, '#ffffff'); R(g, wx + 8, wy + 38, ww - 16, 1, '#808080');
    const p = Math.min(0.97, n / 47) + Math.sin(TS.realTime * 0.7) * 0.004;
    for (let i = 0; i < Math.floor((ww - 20) * p / 5); i++) R(g, wx + 10 + i * 5, wy + 40, 4, 6, '#000080');
    TS.wrap(X.note, 46).forEach((ln, i) => TS.text(g, ln, wx + 8, wy + 54 + i * 7, '#333', { s: 0.8 }));
    // an hourglass mouse pointer
    const hx = wx + ww / 2 + Math.sin(TS.realTime) * 30, hy = wy + wh + 12;
    g.beginPath(); g.moveTo(hx - 3, hy - 4); g.lineTo(hx + 3, hy - 4); g.lineTo(hx - 3, hy + 4); g.lineTo(hx + 3, hy + 4); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.lineWidth = 0.6; g.strokeStyle = '#000'; g.stroke();

    const by = SC.y + SC.h - 18;
    btn({ x: SC.x + 30, y: by, w: 100, h: 13 }, 'ODOTA (30 MIN)', () => {
      TS.doAction({ min: 30, label: 'ASENNETAAN...', fx: { mood: -2 }, say: TS.pick(X.wait).replace('{n}', n + 1), after() { s.flags.disk = n + 1; } });
    }, { fill: '#c0c0c0', hoverFill: '#d8d8d8', line: '#000', col: '#000' });
    btn({ x: SC.x + SC.w - 130, y: by, w: 100, h: 13 }, 'SULJE KANSI', () => { ui.say(X.close); TS.go(back); }, { fill: '#c0c0c0', hoverFill: '#d8d8d8', line: '#000', col: '#000' });
  }

  TS.scenes.laptop = {
    hud: true,
    enter(arg) {
      arg = arg || {};
      phone = !!arg.phone;
      back = arg.back || 'apartment';
      SC = phone ? { x: 52, y: 28, w: 216, h: 142 } : { x: 16, y: 24, w: 288, h: 146 };
      // the phone opens straight into one app (from the home screen icons)
      view = phone ? (arg.view || 'ads') : 'install';
    },
    click(x, y) {
      for (const b of btns) if (TS.hit(b.r, x, y)) { TS.sfx.click(); b.fn(); return; }
    },
    update(dt) {
      TS.idleTick(dt);

    },
    draw(g) {
      ui_g = g;
      btns = [];
      const R = TS.rect, s = TS.S;
      R(g, 0, 17, 320, 163, '#2a2620');
      // device frame
      if (phone) {
        // Keijo's belly and both palms behind the phone (thumbs come last, on top)
        TS.ell(g, 160, 240, 190, 90, TS.PAL.w, '#2a2320', 1);
        TS.ell(g, 44, 176, 26, 16, TS.PAL.s, OUTL, 0.6);
        TS.ell(g, 276, 176, 26, 16, TS.PAL.s, OUTL, 0.6);
        TS.rbox(g, 40, 21, 240, 156, 8, '#1a1a1e'); R(g, 42, 23, 236, 152, '#2a2a30');
        R(g, 270, 96, 4, 10, '#3a3a40');
        R(g, 120, 40, 40, 1, '#8a8a90'); R(g, 150, 41, 30, 1, '#8a8a90'); R(g, 160, 42, 1, 30, '#8a8a90'); // the crack
      } else {
        R(g, 8, 19, 304, 159, '#3a3a42'); R(g, 10, 21, 300, 155, '#2a2a30');
      }
      R(g, SC.x, SC.y, SC.w, SC.h, PAPER);
      const cx = SC.x + SC.w / 2;
      const chars = Math.floor((SC.w - 12) / 4);

      if (view === 'install') {
        drawInstall(g, s);
        ui.drawHUD(g);
        return;
      }

      // browser bar
      R(g, SC.x, SC.y, SC.w, 10, '#c8ccc8');
      TS.text(g, 'TYÖKKÄRI.FI   4G  12%', SC.x + 4, SC.y + 3, '#505050');
      const top = SC.y + 14;
      const bw = SC.w - 24;
      const bx = SC.x + 12;

      if (view === 'home') {
        TS.text(g, 'TYÖKKÄRI.FI', cx, top + 2, GREEN, { align: 'center', s: 1.6 });
        TS.text(g, L().phoneSlogan, cx, top + 16, INK, { align: 'center' });
        TS.text(g, 'LÄHETETYT HAKEMUKSET TÄNÄÄN: ' + s.apps + '/4', cx, top + 33, s.apps >= 4 ? GREEN : '#a03a3a', { align: 'center' });
        const unread = visibleMail().filter((m) => !m.read).length;
        let y = top + 41;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'AVOIMET TYÖPAIKAT', () => needNet(() => { view = 'ads'; })); y += 14;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'SÄHKÖPOSTI' + (unread ? ' (' + unread + ' UUTTA)' : ''), () => needNet(() => { view = 'mail'; })); y += 14;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'SOME (HEHKU)', () => needNet(() => {
          // Keijo picks up his phone and scrolls; back here afterwards
          TS.go('some', { back: 'laptop', backArg: { phone: phone, back: back } });
        })); y += 14;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'TORI.FI - MYY TAVARAA', () => needNet(() => { view = 'tori'; }), { fill: '#f8e0c8', hoverFill: '#f0c090', line: '#c0602a' }); y += 14;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'PANKKI', () => ui.say(TS.T.phone.bank.replace('{e}', TS.euro(s.money)))); y += 14;
        btn({ x: bx, y: y, w: bw, h: 12 }, 'LAITA PUHELIN TASKUUN', () => TS.go(back), { fill: '#e8d8d8', hoverFill: '#e0b8b8', line: '#a03a3a' });
      } else if (view === 'ads') {
        TS.text(g, 'AVOIMET TYÖPAIKAT', SC.x + 8, top, GREEN);
        if (s.t >= TS.DEADLINE && s.t < 30 * 60) {
          TS.wrap(L().closed, chars).forEach((ln, i) => TS.text(g, ln, cx, top + 30 + i * 8, '#a03a3a', { align: 'center' }));
        } else {
          const ads = visibleAds();
          if (!ads.length) TS.text(g, 'EI UUSIA ILMOITUKSIA. OLET HAKENUT KAIKKEA.', cx, top + 30, INK, { align: 'center' });
          ads.forEach((i, k) => {
            const ad = TS.T.ads[i];
            const r = { x: SC.x + 6, y: top + 10 + k * 20, w: SC.w - 12, h: 18 };
            const hov = TS.hit(r, TS.mouse.x, TS.mouse.y);
            R(g, r.x, r.y, r.w, r.h, hov ? '#d8ecd8' : '#e4e4dc');
            TS.text(g, ad.title.slice(0, chars - 2), r.x + 4, r.y + 3, INK);
            TS.text(g, ad.firm, r.x + 4, r.y + 11, '#6a6a6a');
            btns.push({ r: r, fn() { sel = i; view = 'ad'; } });
          });
        }
        btn({ x: bx, y: SC.y + SC.h - 15, w: bw, h: 12 }, '< ALOITUSNÄKYMÄ', goHome);
      } else if (view === 'ad') {
        const ad = TS.T.ads[sel];
        TS.text(g, ad.title, SC.x + 8, top, GREEN);
        TS.text(g, ad.firm, SC.x + 8, top + 9, '#6a6a6a');
        let y = top + 22;
        TS.wrap(ad.text, chars).forEach((ln) => { TS.text(g, ln, SC.x + 8, y, INK); y += 8; });
        y += 4;
        TS.wrap(ad.req, chars).forEach((ln) => { TS.text(g, ln, SC.x + 8, y, '#7a3a3a'); y += 8; });
        btn({ x: bx, y: SC.y + SC.h - 31, w: bw, h: 12 }, 'HAE PAIKKAA', () => { slots = [TS.rand(0, 3), TS.rand(0, 3), TS.rand(0, 3)]; view = 'letter'; });
        btn({ x: bx, y: SC.y + SC.h - 15, w: bw, h: 12 }, 'TAKAISIN', () => { view = 'ads'; });
      } else if (view === 'letter') {
        const ad = TS.T.ads[sel];
        TS.text(g, 'HAKEMUS: ' + ad.title.slice(0, chars - 10), SC.x + 8, top, GREEN);
        TS.text(g, 'VALITSE LAUSEET NUOLILLA', SC.x + 8, top + 8, '#8a8a8a');
        const lists = [L().letterOpen, L().letterSkill, L().letterClose];
        const drunk = s.drunk >= 2;
        for (let k = 0; k < 3; k++) {
          const y = top + 20 + k * 26;
          R(g, SC.x + 6, y - 2, SC.w - 12, 22, '#ffffff');
          let txt = lists[k][slots[k]];
          if (drunk) txt = TS.scramble(txt, k * 31 + slots[k] * 7 + 3, 0.6);
          TS.wrap(txt, chars - 10).forEach((ln, i) => {
            const jx = drunk ? Math.round(Math.sin(TS.realTime * 3 + i + k) * 1) : 0;
            TS.text(g, ln, SC.x + 22 + jx, y + 2 + i * 8, INK);
          });
          const kk = k;
          btn({ x: SC.x + 8, y: y + 3, w: 11, h: 12 }, '<', () => { slots[kk] = (slots[kk] + 3) % 4; });
          btn({ x: SC.x + SC.w - 19, y: y + 3, w: 11, h: 12 }, '>', () => { slots[kk] = (slots[kk] + 1) % 4; });
        }
        if (drunk) TS.text(g, 'HUOM: SORMET EIVÄT TOTTELE', cx, top + 98, '#a03a3a', { align: 'center' });
        const half = (SC.w - 30) / 2;
        btn({ x: bx, y: SC.y + SC.h - 15, w: half, h: 12 }, 'LÄHETÄ (45 MIN)', send);
        btn({ x: bx + half + 6, y: SC.y + SC.h - 15, w: half, h: 12 }, 'PERUUTA', () => { view = 'ad'; });
      } else if (view === 'tori') {
        TS.text(g, 'TORI.FI', SC.x + 8, top, '#c0602a', { s: 1.4, bold: true });
        TS.text(g, 'Myy turhat tavarat. Tai tärkeät.', SC.x + 50, top + 2, '#8a8a8a');
        const st = TS.toriState(s);
        const items = TS.toriSellable();
        if (!items.length) TS.wrap(TS.T.tori.empty, chars).forEach((ln, i) => TS.text(g, ln, SC.x + 8, top + 20 + i * 8, INK));
        items.forEach((id, k) => {
          const it = TS.T.tori.items[id];
          const ry = top + 14 + k * 20;
          R(g, SC.x + 6, ry, SC.w - 12, 18, '#fff4e8');
          TS.text(g, it.name, SC.x + 10, ry + 3, INK);
          TS.text(g, 'Pyyntö ' + TS.euro(it.price), SC.x + 10, ry + 11, '#c0602a');
          const r = { x: SC.x + SC.w - 66, y: ry + 3, w: 56, h: 12 };
          if (id in st.listed) TS.text(g, 'ODOTTAA OSTAJAA', r.x + r.w / 2, ry + 7, '#8a8a8a', { align: 'center' });
          else btn(r, 'MYY (15 MIN)', () => TS.toriList(id, 15), { fill: '#f8e0c8', hoverFill: '#f0c090', line: '#c0602a' });
        });
        const hidden = Object.keys(st.found).filter((id) => !st.found[id]).length;
        if (hidden) TS.wrap('Vinkki: kotona voi olla lisää myytävää. Sängyn alla? Laatikoissa?', chars).forEach((ln, i) => TS.text(g, ln, SC.x + 8, SC.y + SC.h - 33 + i * 8, '#9a9a9a'));
        btn({ x: bx, y: SC.y + SC.h - 15, w: bw, h: 12 }, '< ALOITUSNÄKYMÄ', goHome);
      } else if (view === 'mail') {
        TS.text(g, 'SAAPUNEET', SC.x + 8, top, GREEN);
        const list = visibleMail().slice(0, 8);
        list.forEach((m, k) => {
          const r = { x: SC.x + 6, y: top + 9 + k * 12, w: SC.w - 12, h: 11 };
          const hov = TS.hit(r, TS.mouse.x, TS.mouse.y);
          R(g, r.x, r.y, r.w, r.h, hov ? '#d8ecd8' : m.read ? '#ececE4' : '#ffffff');
          const line = (m.read ? '  ' : '* ') + m.from + ': ' + m.subj;
          TS.text(g, line.slice(0, chars - 1), r.x + 3, r.y + 3, m.read ? '#7a7a7a' : INK);
          btns.push({ r: r, fn() { m.read = true; readMail = m; view = 'read'; } });
        });
        const spam = s.emails.filter((m) => m.hidden).length + 14;
        TS.text(g, 'ROSKAPOSTI: ' + spam + ' VIESTIÄ (ÄLÄ AVAA)', SC.x + 8, SC.y + SC.h - 26, '#9a9a9a');
        btn({ x: bx, y: SC.y + SC.h - 15, w: bw, h: 12 }, '< ALOITUSNÄKYMÄ', goHome);
      } else if (view === 'read' && readMail) {
        TS.text(g, 'LÄHETTÄJÄ: ' + readMail.from, SC.x + 8, top, GREEN);
        TS.text(g, 'AIHE: ' + readMail.subj, SC.x + 8, top + 9, '#6a6a6a');
        TS.wrap(readMail.body, chars).forEach((ln, i) => TS.text(g, ln, SC.x + 8, top + 24 + i * 8, INK));
        btn({ x: bx, y: SC.y + SC.h - 15, w: bw, h: 12 }, 'TAKAISIN', () => { view = 'mail'; });
      }
      if (phone) drawThumbs(g);
      ui.drawHUD(g);
    },
  };
})();
