// jackpot.js – the 1 000 000 € ending: Keijo drives a red sports convertible along
// a sunset coast, a lady next to him, palm trees rushing by, euro notes flying.
// After a while the ending text and "HERÄÄ UUDELLEEN" appear. The game ends here.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const AGAIN = { x: 100, y: 164, w: 120, h: 13 };
  let t = 0, notes = [];

  TS.scenes.jackpot = {
    enter() {
      const S = TS.S;
      t = 0;
      notes = [];
      S.money += 1000000;
      S.jackpot = true;
      S.ended = true;
      S.endReason = 'jackpot';
      TS.save();
      ui.clear();
      // a happy little tune (for once)
      [523, 659, 784, 659, 784, 1047, 988, 1047].forEach((f, i) => TS.beep(f, 0.22, 'square', 0.05, i * 0.22));
    },
    click(x, y) {
      if (t > 5 && TS.hit(AGAIN, x, y)) { TS.sfx.click(); TS.newGame(); }
    },
    update(dt) {
      t += dt;
      // euro notes flying out of the car
      if (Math.random() < dt * 6) notes.push({ x: 130, y: 112, vx: -40 - Math.random() * 40, vy: -20 - Math.random() * 25, r: Math.random() * 6, vr: (Math.random() - 0.5) * 6 });
      notes.forEach((n) => { n.x += n.vx * dt; n.y += n.vy * dt; n.vy += 20 * dt; n.r += n.vr * dt; });
      notes = notes.filter((n) => n.x > -20 && n.y < 190);
    },
    draw(g) {
      const R = TS.rect;
      // sunset sky, sun, sea
      const sky = g.createLinearGradient(0, 0, 0, 120);
      sky.addColorStop(0, '#2a1a5a'); sky.addColorStop(0.5, '#e0607a'); sky.addColorStop(1, '#ffc070');
      g.fillStyle = sky; g.fillRect(0, 0, 320, 120);
      TS.ell(g, 230, 96, 22, 22, '#ffe890');
      R(g, 0, 98, 320, 30, '#3a5aa0');
      for (let i = 0; i < 12; i++) R(g, (i * 37 + t * 20) % 340 - 20, 102 + (i % 4) * 5, 14, 0.8, 'rgba(255,230,170,0.5)');
      // far hills, then palm trees rushing by (parallax)
      for (let i = 0; i < 6; i++) TS.ell(g, ((i * 70 - t * 15) % 420 + 420) % 420 - 50, 100, 40, 10, '#4a2a4a');
      R(g, 0, 128, 320, 52, '#3a3a40');                         // the road
      R(g, 0, 128, 320, 3, '#c8c0a8');
      for (let i = 0; i < 8; i++) R(g, ((i * 50 - t * 220) % 400 + 400) % 400 - 40, 152, 24, 2, '#f0e8c8');
      for (let i = 0; i < 4; i++) {
        const px = ((i * 110 - t * 160) % 440 + 440) % 440 - 60;
        R(g, px, 70, 4, 60, '#5a3a20');
        [[-14, 0], [12, 2], [-8, -6], [8, -7], [0, -9]].forEach(([dx, dy]) => TS.ell(g, px + 2 + dx, 70 + dy, 12, 3.5, '#1e5a2a'));
      }
      drawCar(g, 150, 150 + Math.sin(t * 9) * 0.6);
      // flying euro notes
      notes.forEach((n) => {
        g.save(); g.translate(n.x, n.y); g.rotate(n.r);
        TS.rect(g, -4, -2, 8, 4, '#8ac080'); TS.rect(g, -1, -1, 2, 2, '#4a8a4a');
        g.restore();
      });
      // titles
      const pop = Math.min(1, t / 0.6);
      TS.text(g, '1 000 000 €', 160, 6 + (1 - pop) * -20, '#ffe070', { align: 'center', s: 2.6, bold: true, shadow: '#7a1414' });
      if (t > 1.2) TS.text(g, TS.T.slot.end.title, 160, 30, '#ffffff', { align: 'center', s: 1.6, bold: true, shadow: '#3a1a3a' });
      if (t > 5) {
        const E = TS.T.slot.end;
        const dec = TS.wrap('KELA: ' + E.decision, 66, 0.8), story = TS.wrap(E.line, 66, 0.8);
        g.globalAlpha = Math.min(1, (t - 5) / 0.6) * 0.85;
        TS.rbox(g, 20, 42, 280, 10 + (dec.length + story.length) * 7.5, 4, '#14121c');
        g.globalAlpha = 1;
        let y = 46;
        dec.forEach((ln) => { TS.text(g, ln, 160, y, '#f0c850', { align: 'center', s: 0.8 }); y += 7.5; });
        y += 2;
        story.forEach((ln) => { TS.text(g, ln, 160, y, '#e8e0c8', { align: 'center', s: 0.8 }); y += 7.5; });
        TS.button(g, AGAIN, 'HERÄÄ UUDELLEEN');
      }
    },
  };

  // The red sports convertible, facing right, with Keijo driving and the lady next to him.
  function drawCar(g, cx, by) {
    const OL = '#2a1010';
    // people first (they sit inside the car)
    // the lady (front seat, nearer the windshield): big blonde hair blowing back, sunglasses, scarf
    TS.pixelDraw(g, cx - 4, by - 58, 46, 34, TS.CHAR_RES, (p) => {
      const fl = Math.sin(TS.realTime * 14);
      p.beginPath(); p.moveTo(cx + 16, by - 37); p.quadraticCurveTo(cx + 4, by - 44 + fl, cx - 2, by - 40 + fl * 2); p.lineTo(cx + 2, by - 36); p.closePath();
      p.fillStyle = '#e83a6a'; p.fill(); // the scarf flying back
      TS.ell(p, cx + 18, by - 44, 6.5, 6, '#f0d070');                       // hair
      TS.ell(p, cx + 12, by - 43, 6, 4, '#f0d070');                         // hair blowing back
      TS.ell(p, cx + 20, by - 42, 4.5, 5.2, '#f0c8a8', OL, 0.4);            // face
      TS.rbox(p, cx + 19, by - 44, 5.5, 1.8, 0.8, '#111');                  // sunglasses
      TS.ell(p, cx + 23, by - 39.6, 1, 0.6, '#d0204a');                     // lipstick
      TS.rbox(p, cx + 13, by - 37, 12, 8, 3, '#e83a6a', OL, 0.4);           // dress
      p.lineWidth = 1.6; p.strokeStyle = '#f0c8a8'; p.lineCap = 'round';    // waving arm
      p.beginPath(); p.moveTo(cx + 15, by - 34); p.lineTo(cx + 8, by - 46 + Math.sin(TS.realTime * 6) * 2); p.stroke();
      p.lineCap = 'butt';
    });
    // Keijo driving: Hawaiian shirt, sunglasses, a huge grin
    TS.pixelDraw(g, cx - 26, by - 58, 30, 34, TS.CHAR_RES, (p) => {
      TS.rbox(p, cx - 20, by - 36, 15, 10, 4, '#2a9ad0', OL, 0.4);          // shirt
      for (let i = 0; i < 5; i++) TS.ell(p, cx - 18 + i * 3, by - 33 + (i % 2) * 3, 1.1, 1.1, '#f0e040');
    });
    TS.drawFace(g, cx - 12 - 26.1, by - 44 - 20.9, 2.2);                     // Keijo's head (pixel)
    const k = 2.2 * 0.62;
    TS.rbox(g, cx - 12 + 2.6 * k, by - 44 - 1.6 * k, 3.4 * k, 1.5 * k, 0.6, '#111');  // sunglasses
    TS.rect(g, cx - 12 - 1.2 * k, by - 44 - 1.2 * k, 4 * k, 0.4 * k, '#111');
    g.lineWidth = 0.6; g.strokeStyle = '#7a3a34';                             // the grin
    g.beginPath(); g.arc(cx - 12 + 4.2 * k, by - 44 + 3.2 * k, 1.6 * k, 0.1, Math.PI * 0.8); g.stroke();
    // steering wheel
    g.lineWidth = 1.4; g.strokeStyle = '#222';
    g.beginPath(); g.ellipse(cx + 2, by - 32, 1.6, 4, 0.3, 0, Math.PI * 2); g.stroke();
    // the car body
    g.beginPath();
    g.moveTo(cx - 52, by - 8);
    g.quadraticCurveTo(cx - 54, by - 24, cx - 36, by - 26);
    g.lineTo(cx - 6, by - 28);
    g.lineTo(cx + 30, by - 27);
    g.quadraticCurveTo(cx + 54, by - 24, cx + 58, by - 12);
    g.lineTo(cx + 58, by - 6);
    g.lineTo(cx - 52, by - 6);
    g.closePath();
    const body = g.createLinearGradient(0, by - 28, 0, by - 6);
    body.addColorStop(0, '#ff3a2a'); body.addColorStop(1, '#a81010');
    g.fillStyle = body; g.fill();
    g.lineWidth = 0.8; g.strokeStyle = OL; g.stroke();
    TS.rect(g, cx - 40, by - 22, 80, 1, 'rgba(255,255,255,0.35)');          // shine
    g.beginPath(); g.moveTo(cx + 26, by - 28); g.lineTo(cx + 34, by - 42); g.lineTo(cx + 36, by - 42); g.lineTo(cx + 31, by - 27); g.closePath();
    g.fillStyle = 'rgba(190,230,255,0.6)'; g.fill(); g.strokeStyle = '#444'; g.stroke(); // windshield
    TS.ell(g, cx + 56, by - 16, 2.4, 1.8, '#fff8c0');                         // headlight
    TS.rect(g, cx - 52, by - 18, 3, 3, '#ff6a40');                            // tail light
    TS.rect(g, cx - 8, by - 20, 1, 12, OL);                                   // door line
    TS.text(g, 'KEIJO 1', cx - 44, by - 13, '#fff', { s: 0.5, bold: true }); // plate
    // wheels with spinning spokes
    [cx - 32, cx + 38].forEach((wx) => {
      TS.ell(g, wx, by - 5, 8, 8, '#1a1a1a');
      TS.ell(g, wx, by - 5, 4.6, 4.6, '#c8ccd2');
      g.lineWidth = 0.8; g.strokeStyle = '#7a7e84';
      for (let i = 0; i < 5; i++) {
        const a = -TS.realTime * 20 + i * 1.2566;
        g.beginPath(); g.moveTo(wx, by - 5); g.lineTo(wx + Math.cos(a) * 4.4, by - 5 + Math.sin(a) * 4.4); g.stroke();
      }
    });
  }
})();
