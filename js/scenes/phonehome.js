// phonehome.js – the phone's home screen: clock, date and a grid of app icons
// with their names under them. Red badges show unread mail and Kari's messages.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;

  const PHONE = { x: 108, y: 22, w: 104, h: 182 };
  const SCR = { x: 113, y: 30, w: 94, h: 150 };
  const EXIT = { x: 222, y: 150, w: 68, h: 16 };
  const PHONE_SCENES = ['phonehome', 'some', 'wazzup', 'laptop', 'call'];
  let back = 'apartment';
  let icons = [];

  // The apps: id, name under the icon, what happens on a tap.
  const APPS = [
    { id: 'phone', name: 'Puhelin', open: () => TS.phoneContacts() },
    { id: 'wazzup', name: 'WazzupApp', open: () => TS.go('wazzup', { back: 'phonehome' }), badge: () => TS.wazUnread() },
    { id: 'hehku', name: 'Hehku', open: () => TS.go('some', { back: 'phonehome' }) },
    { id: 'toivo', name: 'Työkkäri.fi', open: () => TS.go('laptop', { phone: true, back: 'phonehome', view: 'ads' }) },
    { id: 'mail', name: 'Sähköposti', open: () => TS.go('laptop', { phone: true, back: 'phonehome', view: 'mail' }),
      badge: () => TS.S.emails.filter((m) => !m.hidden && !m.read && m.at <= TS.S.t).length },
    { id: 'tori', name: 'Tori.fi', open: () => TS.go('laptop', { phone: true, back: 'phonehome', view: 'tori' }) },
    { id: 'bank', name: 'Pankki', open: () => ui.say(TS.T.phone.bank.replace('{e}', TS.euro(TS.S.money))) },
    { id: 'casino', name: 'Rosvo', open: () => TS.go('slot', { back: 'phonehome' }) },
    { id: 'alarm', name: 'Herätys', open: () => ui.say('Herätys 07.00. Toistuu joka päivä. Syy: tapa. Muuta syytä ei ole ollut vuoteen 2023.') },
  ];

  TS.scenes.phonehome = {
    hud: true,
    enter(arg) {
      if (arg && arg.back && PHONE_SCENES.indexOf(arg.back) < 0) back = arg.back;
    },
    click(x, y) {
      if (TS.hit(EXIT, x, y)) { TS.sfx.click(); TS.go(back); return; }
      for (const ic of icons) {
        if (TS.hit(ic.r, x, y)) { TS.sfx.click(); ic.app.open(); return; }
      }
    },
    update(dt) { TS.idleTick(dt); },
    draw(g) {
      const R = TS.rect, S = TS.S;
      R(g, 0, 17, 320, 163, '#2a2620');
      R(g, 0, 17, 320, 60, '#3a3428');
      TS.ell(g, 160, 230, 175, 95, TS.PAL.w, '#2a2320', 1);
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      // wallpaper: a sad November sunset (the only one he has seen in weeks)
      const wg = g.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h);
      wg.addColorStop(0, '#1d2a5a'); wg.addColorStop(0.55, '#5a3a6a'); wg.addColorStop(1, '#b8604a');
      g.fillStyle = wg; g.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
      // status bar, clock and date
      TS.text(g, '4G', SCR.x + 3, SCR.y + 2, '#fff', { s: 0.55 });
      TS.text(g, '12 %', SCR.x + SCR.w - 3, SCR.y + 2, '#ff8a7a', { s: 0.55, align: 'right' });
      TS.text(g, TS.clockStr(ui.shownTime()), SCR.x + SCR.w / 2, SCR.y + 8, '#ffffff', { align: 'center', s: 2.2 });
      TS.text(g, 'Maanantai 23.11.', SCR.x + SCR.w / 2, SCR.y + 24, '#e0d8f0', { align: 'center', s: 0.7 });
      // the crack
      g.globalAlpha = 0.5; g.lineWidth = 0.4; g.strokeStyle = '#ddd';
      g.beginPath(); g.moveTo(SCR.x + 60, SCR.y + 4); g.lineTo(SCR.x + 70, SCR.y + 24); g.lineTo(SCR.x + 66, SCR.y + 40); g.lineTo(SCR.x + 80, SCR.y + 60); g.stroke();
      g.globalAlpha = 1;
      // icon grid: 3 columns, names under the icons
      icons = [];
      APPS.forEach((app, i) => {
        const cx = SCR.x + 16 + (i % 3) * 31, top = SCR.y + 36 + Math.floor(i / 3) * 33;
        const r = { x: cx - 12, y: top - 1, w: 24, h: 30 };
        icons.push({ r: r, app: app });
        const hov = TS.hit(r, TS.mouse.x, TS.mouse.y) && !ui.busy();
        drawIcon(g, app.id, cx, top + 9.5, hov);
        TS.text(g, app.name, cx, top + 21.5, '#ffffff', { align: 'center', s: 0.55, shadow: '#000' });
        const n = app.badge ? app.badge() : 0;
        if (n) {
          TS.ell(g, cx + 9, top + 1, 3.6, 3.6, '#e03030', '#fff', 0.5);
          TS.text(g, n > 9 ? '9+' : String(n), cx + 9, top - 1.2, '#fff', { align: 'center', bold: true, s: 0.6 });
        }
      });
      // the hand
      const SK = TS.PAL.s, OL = 'rgba(42,32,28,0.8)';
      TS.ell(g, 116, 178, 22, 13, SK, OL, 0.6);
      [[106, 120], [105, 134], [105, 148], [106, 161]].forEach(([fx, fy]) => TS.rbox(g, fx - 4, fy - 4.5, 9, 9, 4.2, SK, OL, 0.5));
      g.save(); g.translate(214, 152); g.rotate(-0.5); TS.rbox(g, -5, -16, 10, 26, 5, SK, OL, 0.5); g.restore();
      TS.text(g, 'Valitse sovellus.', 269, 120, '#8a8494', { align: 'center' });
      TS.button(g, EXIT, 'PUHELIN POIS');
      ui.drawHUD(g);
    },
  };

  // Rounded app icon (18 x 18) with a simple white symbol. cx, cy = centre.
  function drawIcon(g, id, cx, cy, hov) {
    const x = cx - 9, y = cy - 9, W = '#ffffff';
    const COL = { phone: '#34c759', wazzup: '#25b860', hehku: '#d04080', toivo: '#2f7a4a', mail: '#2a7ae0',
      tori: '#f08a24', bank: '#1e2a5a', casino: '#b01a1a', alarm: '#2a2a32' };
    if (id === 'hehku') {
      const gr = g.createLinearGradient(x, y + 18, x + 18, y);
      gr.addColorStop(0, '#f8b030'); gr.addColorStop(0.5, '#e03a7a'); gr.addColorStop(1, '#7a3ad0');
      TS.rbox(g, x, y, 18, 18, 4.5, gr);
    } else TS.rbox(g, x, y, 18, 18, 4.5, COL[id]);
    if (hov) TS.rbox(g, x - 0.8, y - 0.8, 19.6, 19.6, 5, null, '#ffffff', 0.7);
    g.lineCap = 'round';
    if (id === 'phone') { // handset
      g.lineWidth = 2.6; g.strokeStyle = W;
      g.beginPath(); g.arc(cx + 1.5, cy - 1.5, 5.5, Math.PI * 0.6, Math.PI * 1.15); g.stroke();
      TS.rbox(g, cx - 6, cy + 0.5, 4, 3, 1.2, W); TS.rbox(g, cx - 2.5, cy - 7, 3, 4, 1.2, W);
    } else if (id === 'wazzup') { // speech bubble with a handset
      TS.ell(g, cx, cy - 0.5, 6.5, 6, null, W, 1.3);
      g.beginPath(); g.moveTo(cx - 5, cy + 3); g.lineTo(cx - 6.5, cy + 6.5); g.lineTo(cx - 2, cy + 5); g.closePath(); g.fillStyle = W; g.fill();
      g.lineWidth = 1.4; g.strokeStyle = W; g.beginPath(); g.arc(cx + 0.5, cy - 1.2, 2.6, Math.PI * 0.6, Math.PI * 1.25); g.stroke();
    } else if (id === 'hehku') { // camera
      TS.rbox(g, cx - 5.5, cy - 5.5, 11, 11, 3, null, W, 1.4);
      TS.ell(g, cx, cy, 2.6, 2.6, null, W, 1.4);
      TS.ell(g, cx + 3.4, cy - 3.4, 0.8, 0.8, W);
    } else if (id === 'toivo') { // a rising sun over a briefcase
      TS.rbox(g, cx - 5.5, cy - 0.5, 11, 6.5, 1.2, W);
      TS.rbox(g, cx - 2, cy - 2.5, 4, 2.4, 0.8, null, W, 0.9);
      g.lineWidth = 0.9; g.strokeStyle = '#ffe070';
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 5; g.beginPath(); g.moveTo(cx + Math.cos(a) * 4, cy - 3.5 + Math.sin(a) * 4); g.lineTo(cx + Math.cos(a) * 6.5, cy - 3.5 + Math.sin(a) * 6.5); g.stroke(); }
    } else if (id === 'mail') { // envelope
      TS.rbox(g, cx - 6, cy - 4, 12, 8.5, 1, W);
      g.lineWidth = 1; g.strokeStyle = COL.mail;
      g.beginPath(); g.moveTo(cx - 6, cy - 3.5); g.lineTo(cx, cy + 1); g.lineTo(cx + 6, cy - 3.5); g.stroke();
    } else if (id === 'tori') { // a price tag
      g.beginPath(); g.moveTo(cx - 6, cy - 2); g.lineTo(cx - 2, cy - 6); g.lineTo(cx + 6, cy - 6); g.lineTo(cx + 6, cy + 2); g.lineTo(cx + 2, cy + 6); g.lineTo(cx - 6, cy - 2); g.closePath();
      g.fillStyle = W; g.fill();
      TS.ell(g, cx + 3, cy - 3, 1.2, 1.2, COL.tori);
      TS.text(g, '€', cx - 0.5, cy - 2, COL.tori, { align: 'center', bold: true, s: 0.75 });
    } else if (id === 'bank') { // a coin with €
      TS.ell(g, cx, cy, 6.5, 6.5, '#f0c040', '#c89020', 0.8);
      TS.text(g, '€', cx, cy - 3.6, '#1e2a5a', { align: 'center', bold: true, s: 1.15 });
    } else if (id === 'casino') { // a little slot machine with a lever
      TS.rbox(g, cx - 6, cy - 5.5, 10, 12, 1.5, '#f0c040');
      TS.rect(g, cx - 5, cy - 3, 8, 4.5, '#fff');
      ['7', '7', '7'].forEach((s, i) => TS.text(g, s, cx - 3.6 + i * 2.7, cy - 2.8, '#c01a1a', { bold: true, s: 0.55 }));
      TS.rect(g, cx + 4.6, cy - 4, 0.9, 6, '#ddd');
      TS.ell(g, cx + 5, cy - 4.8, 1.4, 1.4, W);
    } else if (id === 'alarm') { // alarm clock
      TS.ell(g, cx, cy + 0.5, 5.8, 5.8, W);
      TS.ell(g, cx - 4.5, cy - 5, 1.8, 1.8, W); TS.ell(g, cx + 4.5, cy - 5, 1.8, 1.8, W);
      g.lineWidth = 1; g.strokeStyle = COL.alarm;
      g.beginPath(); g.moveTo(cx, cy + 0.5); g.lineTo(cx, cy - 3); g.moveTo(cx, cy + 0.5); g.lineTo(cx + 2.5, cy + 1.5); g.stroke();
    }
    g.lineCap = 'butt';
  }
})();
