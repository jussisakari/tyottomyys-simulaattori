// pixel.js – drawing helpers: boxes, rounded shapes, text and buttons.
// (The name stays from the first pixel version; now the art is smooth.)
window.TS = window.TS || {};

(function () {
  const TS = window.TS;

  TS.rect = function (g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };

  // Box with a 1-unit border.
  TS.box = function (g, x, y, w, h, fill, line) {
    TS.rect(g, x, y, w, h, line);
    TS.rect(g, x + 1, y + 1, w - 2, h - 2, fill);
  };

  // Ellipse and rounded box, with an optional outline.
  TS.ell = function (g, x, y, rx, ry, fill, line, lw) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (line) { g.lineWidth = lw || 0.6; g.strokeStyle = line; g.stroke(); }
  };
  TS.rbox = function (g, x, y, w, h, r, fill, line, lw) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (line) { g.lineWidth = lw || 0.6; g.strokeStyle = line; g.stroke(); }
  };

  // Sprites from text grids (one letter = one dot). Kept for small icons.
  TS.makeSprite = function (rows, pal) {
    const w = Math.max.apply(null, rows.map((r) => r.length));
    const h = rows.length;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (ch === '.' || ch === ' ') continue;
        const col = (pal && pal[ch]) || TS.PAL[ch];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  };

  // ---------------------------------------------------------------------
  // Pixel look for characters: fn draws (in the same units as g) into a small
  // canvas with `res` pixels per unit, edges are made hard, and the result is
  // scaled up without smoothing. Box (bx, by, bw, bh) = the area the drawing fits in.
  // ---------------------------------------------------------------------
  const pc = document.createElement('canvas');
  const pg = pc.getContext('2d', { willReadFrequently: true });
  // Optional palette: every pixel snaps to the nearest of these colours, so soft
  // edges become clean pixel-art colours (results are remembered, so it stays fast).
  let palRGB = null;
  const snapCache = new Map();
  TS.setCharPalette = function (hexes) {
    palRGB = hexes.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    snapCache.clear();
  };
  function snap(d, i) {
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let c = snapCache.get(key);
    if (!c) {
      let best = 1e9;
      for (const p of palRGB) {
        const dr = d[i] - p[0], dg = d[i + 1] - p[1], db = d[i + 2] - p[2];
        const dist = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (dist < best) { best = dist; c = p; }
      }
      snapCache.set(key, c);
    }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }

  TS.pixelDraw = function (g, bx, by, bw, bh, res, fn, usePalette) {
    res = res || 1;
    bx = Math.floor(bx);
    by = Math.floor(by);
    const W = Math.ceil((bw + 1) * res), H = Math.ceil((bh + 1) * res);
    if (pc.width < W || pc.height < H) { pc.width = Math.max(pc.width, W); pc.height = Math.max(pc.height, H); }
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.clearRect(0, 0, W, H);
    pg.setTransform(res, 0, 0, res, -bx * res, -by * res);
    pg.imageSmoothingEnabled = false;
    fn(pg);
    // hard edges: every pixel is either solid or see-through
    pg.setTransform(1, 0, 0, 1, 0, 0);
    const img = pg.getImageData(0, 0, W, H);
    const d = img.data;
    // usePalette: undefined/true = snap colours + outline, 'noSnap' = outline only, false = neither
    const doSnap = usePalette !== false && usePalette !== 'noSnap' && palRGB;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 60) { d[i + 3] = 255; if (doSnap) snap(d, i); }
      else d[i + 3] = 0;
    }
    if (usePalette !== false) {
      // A solid 1-pixel dark outline around the whole figure (classic pixel art):
      // the character looks solid and never blends into the background.
      const solid = new Uint8Array(W * H);
      for (let p = 0; p < W * H; p++) solid[p] = d[p * 4 + 3] ? 1 : 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (solid[p]) continue;
          if ((x > 0 && solid[p - 1]) || (x < W - 1 && solid[p + 1]) || (y > 0 && solid[p - W]) || (y < H - 1 && solid[p + W])) {
            d[p * 4] = 30; d[p * 4 + 1] = 22; d[p * 4 + 2] = 18; d[p * 4 + 3] = 255;
          }
        }
      }
    }
    pg.putImageData(img, 0, 0);
    const smooth = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(pc, 0, 0, W, H, bx, by, W / res, H / res);
    g.imageSmoothingEnabled = smooth;
  };

  // ---------------------------------------------------------------------
  // Text. Sizes are in game units: s = 1 is the normal size (6.5 units high).
  // y is the top of the letters, like before.
  // ---------------------------------------------------------------------
  const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
  const SIZE = 6.5;

  function setFont(g, s, bold) {
    g.font = (bold ? 'bold ' : '') + (SIZE * s).toFixed(2) + 'px ' + FONT;
    g.textBaseline = 'top';
  }

  // Draws text. Returns its width. opts: { s: size, shadow: colour, align: 'center'|'right', bold }
  TS.text = function (g, str, x, y, col, opts) {
    opts = opts || {};
    const s = opts.s || 1;
    const t = String(str);
    setFont(g, s, opts.bold || s >= 2);
    const w = g.measureText(t).width;
    if (opts.align === 'center') x -= w / 2;
    if (opts.align === 'right') x -= w;
    y -= 0.8 * s;
    if (opts.shadow) {
      g.fillStyle = opts.shadow;
      g.fillText(t, x + 0.5 * s, y + 0.5 * s);
    }
    g.fillStyle = col;
    g.fillText(t, x, y);
    return w;
  };

  TS.textW = function (str, s, bold) {
    s = s || 1;
    setFont(TS.g, s, bold || s >= 2);
    return TS.g.measureText(String(str)).width;
  };

  // Splits a text into lines that fit. maxChars is the old letter count:
  // one old letter was 4 units wide, so the line may be maxChars * 4 units.
  TS.wrap = function (str, maxChars, s) {
    const maxW = maxChars * 4;
    const out = [];
    String(str).split('\n').forEach((para) => {
      let line = '';
      para.split(' ').forEach((word) => {
        const tryLine = line.length ? line + ' ' + word : word;
        if (!line.length || TS.textW(tryLine, s) <= maxW) line = tryLine;
        else { out.push(line); line = word; }
      });
      out.push(line);
    });
    return out;
  };

  // Drunk typing: swaps letters inside words. Same seed = same mistakes.
  TS.scramble = function (str, seed, amount) {
    let r = seed || 1;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    return str.split(' ').map((w) => {
      if (w.length < 4 || rnd() > amount) return w;
      const a = w.split('');
      const i = 1 + Math.floor(rnd() * (a.length - 2));
      const tmp = a[i]; a[i] = a[i + 1] || a[i]; a[i + 1 < a.length ? i + 1 : i] = tmp;
      if (rnd() < 0.3) a.splice(1 + Math.floor(rnd() * (a.length - 1)), 0, 'ö');
      return a.join('');
    }).join(' ');
  };

  // A shop sign painted as a yellow brush stroke with slanted dark-blue capitals
  // (the Ass-market look). (x, y, w, h) = the stroke, s = text size.
  TS.brushSign = function (g, x, y, w, h, text, s) {
    g.save();
    g.beginPath();
    // ragged brush ends on both sides, slightly uneven top and bottom
    g.moveTo(x + 4, y + 1);
    g.quadraticCurveTo(x + w * 0.5, y - 1.2, x + w - 3, y + 0.6);
    for (let i = 0; i <= 6; i++) g.lineTo(x + w - 3 + ((i % 2) ? 3.5 : -0.5) - i * 0.4, y + 0.6 + (h - 0.6) * i / 6);
    g.quadraticCurveTo(x + w * 0.5, y + h + 1.4, x + 2, y + h - 0.4);
    for (let i = 6; i >= 0; i--) g.lineTo(x + ((i % 2) ? -2.5 : 2) + i * 0.3, y + 1 + (h - 1.4) * i / 6);
    g.closePath();
    g.fillStyle = '#ffe500';
    g.fill();
    // bristle streaks
    g.globalAlpha = 0.25; g.lineWidth = 0.35; g.strokeStyle = '#d8b800';
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + 2, y + h * i / 4); g.lineTo(x + w * 0.35, y + h * i / 4 + 0.3); g.stroke(); }
    g.globalAlpha = 1;
    // slanted, bold, dark blue text
    const cx = x + w / 2, cy = y + h / 2;
    g.translate(cx, cy);
    g.transform(1, 0, -0.18, 1, 0, 0);
    TS.text(g, text, 0, -3.1 * s, '#16214e', { align: 'center', bold: true, s: s });
    g.restore();
  };

  // The Alko sign: a red ring with slanted red "Alko" on white. (cx, cy) = centre, r = radius.
  TS.alkoLogo = function (g, cx, cy, r) {
    g.save();
    TS.ell(g, cx, cy, r, r, '#ffffff');
    g.lineWidth = r * 0.13; g.strokeStyle = '#e1251b';
    g.beginPath(); g.arc(cx, cy, r * 0.92, 0, Math.PI * 2); g.stroke();
    g.translate(cx, cy);
    g.transform(1, 0, -0.32, 1, 0, 0); // slanted like handwriting
    const s = r / 8.6;
    TS.text(g, 'Alko', 1, -3.6 * s, '#e1251b', { align: 'center', bold: true, s: s });
    // the long swash under the A
    g.lineWidth = r * 0.08; g.strokeStyle = '#e1251b'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.6, r * 0.18); g.lineTo(-r * 0.1, r * 0.06); g.stroke();
    g.lineCap = 'butt';
    g.restore();
  };

  // A clickable button. It lights up when the mouse is on it.
  TS.button = function (g, r, label, opts) {
    opts = opts || {};
    const hover = TS.hit(r, TS.mouse.x, TS.mouse.y);
    const fill = opts.fill || '#2b2838';
    TS.rbox(g, r.x, r.y, r.w, r.h, 2, hover ? (opts.hoverFill || '#4a4560') : fill, opts.line || '#e8e0c8', 0.7);
    TS.text(g, label, r.x + r.w / 2, r.y + (r.h - 5) / 2, opts.col || '#e8e0c8', { align: 'center' });
  };
})();
