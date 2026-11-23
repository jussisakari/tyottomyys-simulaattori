// some.js – Keijo holds his phone and scrolls the "Hehku" photo feed full of
// other people's fabulous lives. Scroll with the mouse wheel, by dragging,
// or with the buttons. Every new post costs a few minutes and some mood.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const F = () => TS.T.feed;

  const PHONE = { x: 108, y: 22, w: 104, h: 180 };
  const SCR = { x: 113, y: 30, w: 94, h: 150 };
  const TOP = SCR.y + 12;          // feed starts under the app header
  const POST_H = 134;
  const VIEW_H = 180 - TOP;
  const UP = { x: 228, y: 70, w: 40, h: 16 };
  const DOWN = { x: 228, y: 92, w: 40, h: 16 };
  const EXIT = { x: 220, y: 150, w: 68, h: 16 }; // the phone icon is in the corner

  let off = 0, target = 0, back = 'apartment', backArg = null;
  let seen = [], current = -1, note = null, noteT = 0;
  let open = -1; // index of the post whose comments are open, -1 = feed
  const CBACK = { x: SCR.x, y: TOP, w: 40, h: 10 };
  const CWRITE = { x: SCR.x + 4, y: SCR.y + 118, w: SCR.w - 8, h: 11 };

  const maxOff = () => Math.max(0, F().posts.length * POST_H + 40 - VIEW_H);
  const scrollBy = (d) => { if (!ui.busy() && open < 0) target = TS.clamp(target + d, 0, maxOff()); };

  TS.scenes.some = {
    hud: true,
    enter(arg) {
      arg = arg || {};
      back = arg.back || 'apartment';
      backArg = arg.backArg || null;
      off = target = 0;
      seen = [];
      current = -1;
      open = -1;
      note = F().first;
      noteT = 3;
      if (!TS.S.flags.likes) TS.S.flags.likes = {};
      if (!TS.S.flags.posted) TS.S.flags.posted = {};
    },
    wheel(dir) { scrollBy(dir * 45); },
    drag(dy) { scrollBy(-dy * 1.4); },
    click(x, y) {
      if (TS.hit(EXIT, x, y)) { TS.sfx.click(); TS.go(back, backArg); return; }
      if (TS.hit(UP, x, y)) { scrollBy(-POST_H); return; }
      if (TS.hit(DOWN, x, y)) { scrollBy(POST_H); return; }
      if (open >= 0) {
        if (TS.hit(CBACK, x, y)) { TS.sfx.click(); open = -1; }
        else if (TS.hit(CWRITE, x, y)) writeComment(open);
        return;
      }
      // heart and comment buttons
      F().posts.forEach((p, i) => {
        const r = heartRect(i);
        if (r.y > TOP && r.y < 178 && TS.hit(r, x, y)) like(i);
        const c = { x: r.x + 13, y: r.y, w: 10, h: 10 };
        if (c.y > TOP && c.y < 178 && TS.hit(c, x, y)) { TS.sfx.click(); open = i; }
      });
    },
    update(dt) {
      off += (target - off) * Math.min(1, dt * 10);
      noteT -= dt;
      if (noteT <= 0) note = null;
      // Which post is in the middle of the screen? New ones cost time and mood.
      const mid = off + VIEW_H / 2 - 30;
      const i = TS.clamp(Math.floor(mid / POST_H), 0, F().posts.length - 1);
      current = off >= maxOff() - 2 && maxOff() > 0 ? 'end' : i;
      if (typeof current === 'number' && !seen[current] && !ui.busy()) {
        seen[current] = true;
        const p = F().posts[current];
        TS.fx({ mood: p.mood != null ? p.mood : -2 });
        TS.advance(4);
      }
      TS.idleTick(dt);
    },
    draw(g) {
      const R = TS.rect;
      drawBackground(g);
      // the phone
      TS.rbox(g, PHONE.x, PHONE.y, PHONE.w, PHONE.h, 10, '#1a1a1e', '#000', 1);
      R(g, SCR.x, SCR.y, SCR.w, SCR.h, '#ffffff');
      g.save();
      g.beginPath();
      g.rect(SCR.x, SCR.y, SCR.w, SCR.h);
      g.clip();
      if (open >= 0) drawComments(g, open); else drawFeed(g);
      // app header (stays on top)
      R(g, SCR.x, SCR.y, SCR.w, 12, '#ffffff');
      R(g, SCR.x, SCR.y + 11.6, SCR.w, 0.4, '#dddddd');
      TS.text(g, F().app, SCR.x + 4, SCR.y + 3.5, '#d04080', { bold: true, s: 1.1 });
      TS.ell(g, SCR.x + SCR.w - 8, SCR.y + 6, 3, 3, null, '#333', 0.6);
      g.restore();
      // screen crack
      g.globalAlpha = 0.5; g.lineWidth = 0.4; g.strokeStyle = '#888';
      g.beginPath(); g.moveTo(SCR.x + 60, SCR.y + 14); g.lineTo(SCR.x + 70, SCR.y + 30); g.lineTo(SCR.x + 66, SCR.y + 44); g.lineTo(SCR.x + 80, SCR.y + 60); g.stroke();
      g.globalAlpha = 1;
      drawHand(g);

      // Keijo's thoughts on the left
      const text = note || (current === 'end' ? F().end : typeof current === 'number' && seen[current] ? F().posts[current].think : null);
      if (text) {
        const lines = TS.wrap(text, 22);
        const h = lines.length * 8 + 8;
        TS.rbox(g, 6, 34, 96, h, 6, '#f4f0e6', '#2a2320');
        TS.ell(g, 100, 40 + h, 3, 2.5, '#f4f0e6', '#2a2320');
        TS.ell(g, 106, 46 + h, 1.8, 1.5, '#f4f0e6', '#2a2320');
        lines.forEach((ln, i) => TS.text(g, ln, 11, 39 + i * 8, '#2a2320'));
      }
      // buttons
      TS.button(g, UP, 'YLÖS');
      TS.button(g, DOWN, 'ALAS');
      TS.text(g, 'Rullaa hiirellä', 248, 114, '#8a8494', { align: 'center' });
      TS.text(g, 'tai vetämällä', 248, 122, '#8a8494', { align: 'center' });
      TS.button(g, EXIT, 'LAITA PUHELIN POIS');
      ui.drawHUD(g);
    },
  };

  // ---------------- Comments ----------------
  function writeComment(i) {
    const S = TS.S, p = F().posts[i];
    if (S.flags.posted[p.user]) return;
    const tarmo = p.user === 'tarmo_69';
    ui.choose(tarmo ? F().writeAskTarmo : F().writeAsk, p.mean.map((m) => ({
      label: '"' + m.say + '"',
      fn() {
        S.flags.posted[p.user] = { say: m.say, reply: m.reply, at: TS.realTime };
        TS.sfx.send();
        TS.fx({ mood: m.mood });
        TS.advance(5);
        note = m.narr;
        noteT = 9;
      },
    })).concat([{ label: 'Peruuta' }]));
  }

  function drawComments(g, i) {
    const S = TS.S, p = F().posts[i], x = SCR.x, R = TS.rect;
    R(g, x, TOP, SCR.w, 180 - TOP, '#ffffff');
    TS.text(g, '< ' + F().commentsTitle, x + 3, TOP + 2, '#d04080', { bold: true, s: 0.85 });
    R(g, x, TOP + 10, SCR.w, 0.4, '#dddddd');
    // the post's own caption first, then the comments (the oldest drop out if they don't fit)
    const list = [[p.user, p.text, '#555', 0]];
    p.comments.forEach(([u, c]) => list.push([u, c, '#333', 0]));
    const mine = S.flags.posted[p.user];
    const typing = mine && TS.realTime - mine.at < 1.8;
    if (mine) {
      list.push([F().me, mine.say, '#b03030', 0]);
      if (!typing) list.push([mine.reply[0], mine.reply[1], '#333', 5]);
    }
    const S7 = 0.68;
    const lines = list.map((e) => TS.wrap(e[1], 21 - e[3] / 4, S7));
    const hOf = (k) => 6 + lines[k].length * 5.4;
    const room = CWRITE.y - 4 - (TOP + 13) - (typing ? 7 : 0);
    let total = 0;
    for (let k = 0; k < list.length; k++) total += hOf(k);
    const skip = new Set();
    for (let k = 1; k < list.length - 2 && total > room; k++) { skip.add(k); total -= hOf(k); }
    let y = TOP + 13;
    list.forEach((e, k) => {
      if (skip.has(k)) return;
      const [user, , col, indent] = e;
      TS.ell(g, x + 4 + indent, y + 2.4, 2, 2, 'hsl(' + ((user.length * 47) % 360) + ',50%,60%)');
      TS.text(g, user, x + 8 + indent, y, '#222', { s: 0.66, bold: true });
      lines[k].forEach((ln, j) => TS.text(g, ln, x + 8 + indent, y + 5.2 + j * 5.4, col, { s: S7 }));
      y += hOf(k);
      if (k === 0) { R(g, x + 3, y - 1, SCR.w - 6, 0.3, '#eeeeee'); y += 1; }
    });
    if (typing) TS.text(g, mine.reply[0] + ' ' + F().typing, x + 13, y, '#999', { s: 0.62 });    // write button
    const done = !!mine;
    TS.rbox(g, CWRITE.x, CWRITE.y, CWRITE.w, CWRITE.h, 5, done ? '#eeeeee' : '#f4e0ea', done ? '#cccccc' : '#d04080', 0.5);
    TS.text(g, done ? F().already : F().write, CWRITE.x + CWRITE.w / 2, CWRITE.y + 3, done ? '#999' : '#d04080', { align: 'center', s: 0.75 });
  }

  function heartRect(i) {    const y = TOP + i * POST_H - off + 12 + 78;
    return { x: SCR.x + 2, y: y, w: 12, h: 10 };
  }

  function like(i) {
    const S = TS.S, p = F().posts[i];
    if (S.flags.likes[p.user]) return;
    S.flags.likes[p.user] = true;
    TS.sfx.click();
    const tarmo = p.user === 'tarmo_69';
    TS.fx({ mood: tarmo ? 4 : -1 });
    note = tarmo ? F().likedTarmo : F().liked;
    noteT = 4;
  }

  // ---------------- Drawing ----------------
  function drawBackground(g) {
    const R = TS.rect;
    // dim room, Keijo's belly and lap below
    R(g, 0, 17, 320, 163, '#2a2620');
    R(g, 0, 17, 320, 60, '#3a3428');
    for (let x = 6; x < 320; x += 12) R(g, x, 17, 1, 60, '#332e24');
    TS.ell(g, 160, 230, 175, 95, TS.PAL.w, '#2a2320', 1);
    TS.ell(g, 70, 170, 8, 5, TS.PAL.y); TS.ell(g, 250, 165, 6, 4, TS.PAL.y); // stains
    TS.drawCan(g, 270, 150, 2);
    // the phone lights up his belly
    g.globalAlpha = 0.12; TS.ell(g, 160, 120, 90, 70, '#cfe0ff'); g.globalAlpha = 1;
  }

  function drawHand(g) {
    const S = TS.PAL.s, OL = '#2a2320';
    // palm under the phone, fingers wrapped around the left edge, thumb on the right
    TS.ell(g, 116, 176, 22, 14, S, OL);
    [[106, 118], [105, 132], [105, 146], [106, 159]].forEach(([fx, fy]) => TS.rbox(g, fx - 4, fy - 4.5, 9, 9, 4.2, S, OL));
    g.save();
    g.translate(214, 150);
    g.rotate(-0.5);
    TS.rbox(g, -5, -16, 10, 26, 5, S, OL);
    TS.rbox(g, -3.5, -15, 7, 6, 3, '#f0d0b8'); // thumbnail
    g.restore();
  }

  function drawFeed(g) {
    const posts = F().posts;
    posts.forEach((p, i) => {
      const y = TOP + i * POST_H - off;
      if (y > 182 || y + POST_H < TOP - 4) return;
      drawPost(g, p, i, y);
    });
    const ey = TOP + posts.length * POST_H - off;
    if (ey < 180) {
      TS.text(g, 'Olet nähnyt kaiken', SCR.x + SCR.w / 2, ey + 10, '#888', { align: 'center' });
      TS.text(g, 'uuden.', SCR.x + SCR.w / 2, ey + 18, '#888', { align: 'center' });
    }
  }

  function drawPost(g, p, i, y) {
    const x = SCR.x, w = SCR.w;
    // header: avatar, name, place
    const hue = (p.user.length * 47) % 360;
    TS.ell(g, x + 7, y + 6, 4.4, 4.4, null, '#d04080', 0.8);
    TS.ell(g, x + 7, y + 6, 3.4, 3.4, 'hsl(' + hue + ',50%,60%)');
    TS.text(g, p.user, x + 14, y + 1.8, '#222', { s: 0.75, bold: true });
    TS.text(g, p.place, x + 14, y + 7.2, '#777', { s: 0.65 });
    // picture
    g.save();
    g.beginPath(); g.rect(x, y + 12, w, 76); g.clip();
    drawPic(g, p.pic, x, y + 12, w, 76);
    g.restore();
    // actions
    const S = TS.S, liked = S.flags.likes && S.flags.likes[p.user];
    heart(g, x + 8, y + 95, liked);
    TS.ell(g, x + 20, y + 95, 3, 2.6, null, '#333', 0.7); // comment bubble
    TS.text(g, (p.likes + (liked ? 1 : 0)) + ' tykkäystä', x + 3, y + 101, '#222', { s: 0.72, bold: true });
    // caption
    const lines = TS.wrap(p.text, 31, 0.72);
    lines.slice(0, 3).forEach((ln, k) => TS.text(g, ln, x + 3, y + 108 + k * 6.6, '#333', { s: 0.72 }));
    TS.rect(g, x, y + POST_H - 4, w, 0.4, '#e4e4e4');
  }

  function heart(g, cx, cy, full) {
    g.beginPath();
    g.moveTo(cx, cy + 3);
    g.bezierCurveTo(cx - 6, cy - 1, cx - 3, cy - 5, cx, cy - 2);
    g.bezierCurveTo(cx + 3, cy - 5, cx + 6, cy - 1, cx, cy + 3);
    if (full) { g.fillStyle = '#e03050'; g.fill(); }
    g.lineWidth = 0.7; g.strokeStyle = full ? '#e03050' : '#333'; g.stroke();
  }

  // Simple pictures for each post (x, y = top-left, w x h).
  function drawPic(g, pic, x, y, w, h) {
    const R = TS.rect, OL = '#2a2320';
    const person = (px, py, shirt, s) => {
      s = s || 1;
      TS.rbox(g, px - 4 * s, py, 8 * s, 12 * s, 3 * s, shirt);
      TS.ell(g, px, py - 3.5 * s, 3.5 * s, 3.8 * s, '#f0c8a0');
    };
    if (pic === 'boat') {
      R(g, x, y, w, h, '#8ac8f0'); R(g, x, y + 46, w, 30, '#2a6ab0');
      TS.ell(g, x + 76, y + 14, 7, 7, '#ffe070');
      g.beginPath(); g.moveTo(x + 20, y + 48); g.lineTo(x + 74, y + 48); g.lineTo(x + 66, y + 56); g.lineTo(x + 28, y + 56); g.closePath(); g.fillStyle = '#fff'; g.fill();
      R(g, x + 47, y + 10, 1.2, 38, '#555');
      g.beginPath(); g.moveTo(x + 48.5, y + 12); g.lineTo(x + 70, y + 46); g.lineTo(x + 48.5, y + 46); g.closePath(); g.fillStyle = '#f8f8f0'; g.fill();
      g.beginPath(); g.moveTo(x + 46, y + 16); g.lineTo(x + 30, y + 46); g.lineTo(x + 46, y + 46); g.closePath(); g.fillStyle = '#e8e8e0'; g.fill();
      person(x + 36, y + 39, '#1a3a6a', 0.7); R(g, x + 33.5, y + 35.5, 5, 1.2, '#111'); // sunglasses
      for (let i = 0; i < 6; i++) R(g, x + 6 + i * 15, y + 62 + (i % 2) * 5, 8, 0.8, '#8ab8e8');
    } else if (pic === 'medal') {
      R(g, x, y, w, h, '#b8c0cc'); R(g, x, y + 56, w, 20, '#6a6a6a');
      R(g, x + 8, y + 10, 78, 10, '#e03030'); TS.text(g, 'MAALI 42,2 KM', x + 47, y + 12, '#fff', { align: 'center', s: 0.8, bold: true });
      person(x + 46, y + 34, '#e05090', 1.6);
      g.lineWidth = 1.4; g.strokeStyle = '#3060c0'; g.beginPath(); g.moveTo(x + 40, y + 34); g.lineTo(x + 46, y + 44); g.lineTo(x + 52, y + 34); g.stroke();
      TS.ell(g, x + 46, y + 47, 5, 5, '#f0c030', '#a07010');
      R(g, x + 36, y + 30, 3, 10, '#f0c8a0'); R(g, x + 53, y + 30, 3, 10, '#f0c8a0'); // arms up
    } else if (pic === 'office') {
      R(g, x, y, w, h, '#eef0f4'); R(g, x, y + 58, w, 18, '#9aa4b4');
      R(g, x + 54, y + 8, 34, 18, '#2a6a3a'); TS.text(g, 'Q3 +34 %', x + 71, y + 13, '#fff', { align: 'center', s: 0.9, bold: true });
      ['#3a4a7a', '#7a3a4a', '#4a7a4a', '#7a6a3a', '#5a3a7a'].forEach((c, k) => {
        const px = x + 12 + k * 17;
        person(px, y + 44, c, 1.2);
        R(g, px - 6, y + 36 - (k % 2) * 3, 2, 8, '#f0c8a0'); R(g, px + 4, y + 36 - ((k + 1) % 2) * 3, 2, 8, '#f0c8a0');
      });
    } else if (pic === 'diploma') {
      R(g, x, y, w, h, '#c8d4e8'); R(g, x, y + 60, w, 16, '#8a98b0');
      person(x + 40, y + 34, '#1a1a2a', 1.8);
      R(g, x + 31, y + 18.5, 18, 2.5, '#111'); R(g, x + 47, y + 21, 1, 6, '#e8c040'); // doctor's hat + tassel
      g.save(); g.translate(x + 64, y + 44); g.rotate(-0.3);
      TS.rbox(g, -10, -4, 20, 8, 3, '#f4ecd8', OL); R(g, -1.5, -4, 3, 8, '#c03030');
      g.restore();
    } else if (pic === 'beach') {
      R(g, x, y, w, h, '#90e0f8'); R(g, x, y + 40, w, 12, '#30c0c8'); R(g, x, y + 52, w, 24, '#f4dca0');
      TS.ell(g, x + 14, y + 12, 6, 6, '#fff0a0');
      g.lineWidth = 2.5; g.strokeStyle = '#8a5a2a';
      g.beginPath(); g.moveTo(x + 76, y + 62); g.quadraticCurveTo(x + 70, y + 36, x + 78, y + 14); g.stroke();
      [[-12, 4], [10, 6], [-6, -6], [8, -4]].forEach(([dx, dy]) => TS.ell(g, x + 78 + dx, y + 14 + dy, 9, 3, '#3a9a3a'));
      // yoga
      person(x + 36, y + 50, '#e05090', 1);
      R(g, x + 30, y + 42, 1.5, 8, '#f0c8a0'); R(g, x + 41, y + 42, 1.5, 8, '#f0c8a0');
      TS.rbox(g, x + 46, y + 62, 18, 2, 0.5, '#555'); TS.rbox(g, x + 48, y + 56, 14, 7, 1, '#c8ccd2'); // laptop
    } else if (pic === 'pigeon') {
      R(g, x, y, w, h, '#5a5e58'); R(g, x, y + 50, w, 26, '#4a4e48');
      g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(0.12); g.translate(-x - w / 2, -y - h / 2);
      R(g, x + 6, y + 40, 80, 4, '#6b4a2e'); R(g, x + 6, y + 30, 80, 3, '#6b4a2e');
      R(g, x + 12, y + 44, 3, 14, '#333'); R(g, x + 76, y + 44, 3, 14, '#333');
      TS.ell(g, x + 52, y + 36, 8, 5, '#8a8e98'); TS.ell(g, x + 59, y + 31, 3.2, 3, '#7a7e88'); TS.ell(g, x + 60.5, y + 30.5, 0.6, 0.6, '#e04020');
      TS.drawCan(g, x + 22, y + 32, 1);
      g.restore();
      g.globalAlpha = 0.25; R(g, x, y, w, h, '#888'); g.globalAlpha = 1; // blurry photo
      R(g, x, y, 10, h, 'rgba(240,200,170,0.5)'); // a finger in the picture
    } else if (pic === 'house') {
      R(g, x, y, w, h, '#a8d0f0'); R(g, x, y + 30, w, 16, '#2a5a3a');
      for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(x + k * 10, y + 30); g.lineTo(x + k * 10 + 5, y + 16 + (k % 3) * 3); g.lineTo(x + k * 10 + 10, y + 30); g.fillStyle = '#1e4a2e'; g.fill(); }
      R(g, x, y + 46, w, 30, '#3a7ab8');
      R(g, x + 20, y + 30, 30, 16, '#a83030'); R(g, x + 20, y + 30, 2, 16, '#fff'); R(g, x + 48, y + 30, 2, 16, '#fff');
      g.beginPath(); g.moveTo(x + 17, y + 31); g.lineTo(x + 35, y + 20); g.lineTo(x + 53, y + 31); g.closePath(); g.fillStyle = '#3a3a3a'; g.fill();
      R(g, x + 26, y + 34, 6, 5, '#f0e0a0'); R(g, x + 38, y + 34, 6, 5, '#f0e0a0');
      R(g, x + 62, y + 38, 12, 8, '#8a3030'); R(g, x + 70, y + 32, 1.5, 6, '#555'); // sauna
      R(g, x + 64, y + 46, 3, 14, '#8a6a4a'); R(g, x + 60, y + 52, 26, 2, '#8a6a4a'); // pier
    } else if (pic === 'bread') {
      R(g, x, y, w, h, '#c89a68');
      for (let k = 0; k < 6; k++) R(g, x, y + 8 + k * 12, w, 0.6, '#b08050');
      TS.rbox(g, x + 14, y + 52, 66, 10, 3, '#e8e0d0');
      TS.ell(g, x + 47, y + 44, 26, 16, '#a8642a', '#6a3a1a');
      g.lineWidth = 1; g.strokeStyle = '#e8c890';
      [-10, 0, 10].forEach((d) => { g.beginPath(); g.moveTo(x + 40 + d, y + 34); g.lineTo(x + 50 + d, y + 52); g.stroke(); });
      for (let k = 0; k < 14; k++) TS.ell(g, x + 10 + (k * 37) % 76, y + 14 + (k * 23) % 50, 0.7, 0.7, '#fff');
      R(g, x + 76, y + 16, 3, 22, '#8a8a8a'); // a fancy knife
    } else if (pic === 'ad') {
      R(g, x, y, w, h, '#2a5a8a');
      TS.text(g, 'MUISTATHAN', x + w / 2, y + 10, '#fff', { align: 'center', bold: true, s: 0.9 });
      TS.text(g, '4', x + w / 2, y + 18, '#ffe040', { align: 'center', bold: true, s: 3 });
      TS.text(g, 'HAKEMUSTA', x + w / 2, y + 42, '#fff', { align: 'center', bold: true });
      TS.ell(g, x + w / 2, y + 60, 9, 5, '#fff'); TS.ell(g, x + w / 2, y + 60, 3.6, 3.6, '#2a5a8a'); TS.ell(g, x + w / 2, y + 60, 1.6, 1.6, '#111');
      TS.text(g, 'Me muistamme.', x + w / 2, y + 68, '#c8d8f0', { align: 'center', s: 0.75 });
    }
  }
})();
