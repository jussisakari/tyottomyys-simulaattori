// places.js – inside the corner shop, Alko, the bar, and the park.
// One scene ('place') with a background and a menu for each place.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const T = () => TS.T;

  // Tuoppi at the bar: like beer, just 7 times the price.
  // Draught beer at the bar, from the two taps on the counter.
  TS.DRINKS.karhu = { name: 'Karhu (hanasta)', short: 'karhu', drunk: 1.2, mood: 12, price: 5, bottle: false };
  TS.DRINKS.guinness = { name: 'Guinness (hanasta)', short: 'guinness', drunk: 1.4, mood: 18, price: 10, bottle: false };

  let place = 'store';

  function leave() {
    TS.go('street', { from: place });
  }

  function buy(kind, price, name) {
    const s = TS.S;
    if (!TS.canPay(price)) { TS.sfx.fail(); ui.say(T().store.noMoney, { then: menu }); return; }
    TS.fx({ money: -price });
    s.bag[kind] = (s.bag[kind] || 0) + 1;
    TS.sfx.coin();
    // the first purchase: the cashier wishes a happy payday, as the hoodie demands
    if (place === 'store' && !s.flags.payday) { s.flags.payday = true; ui.say(T().store.payday, { who: 'ESIMIES' }); }
    ui.say(T().store.bought.replace('{x}', name).replace('{e}', TS.euro(s.money)), { then: menu });
  }

  const P = (n) => ' (' + TS.euro(n) + ')';

  function storeMenu() {
    const s = TS.S, D = TS.DRINKS, F = TS.FOODS;
    ui.choose('Ass-market. Mitä ostetaan? Tilillä ' + TS.euro(s.money) + '.', [
      s.bottleBag > 0 && { label: 'Palauta pullot Alepan kassista: ' + s.bottleBag + ' kpl (+' + TS.euro(s.bottleBag * 0.15) + ')', fn() {
        const n = s.bottleBag, e = n * 0.15;
        s.bottleBag = 0;
        TS.sfx.coin();
        TS.doAction({ min: 5, fx: { money: e, mood: 3 }, say: T().store.ret.replace('{n}', n).replace('{e}', TS.euro(e)), after: menu });
      } },
      { label: D.beer.name + ' 0,33 l' + P(D.beer.price), fn: () => buy('beer', D.beer.price, D.beer.name) },
      { label: 'Lonkero 0,33 l' + P(D.lonkero.price), fn: () => buy('lonkero', D.lonkero.price, 'Lonkero') },
      { label: F.makkara.name + P(F.makkara.price), fn: () => buy('makkara', F.makkara.price, F.makkara.name) },
      { label: F.leipa.name + P(F.leipa.price), fn: () => buy('leipa', F.leipa.price, F.leipa.name) },
      { label: F.nuudeli.name + P(F.nuudeli.price), fn: () => buy('nuudeli', F.nuudeli.price, F.nuudeli.name) },
      { label: 'Raaputusarpa' + P(2), fn() {
        if (!TS.canPay(2)) { TS.sfx.fail(); ui.say(T().store.noMoney, { then: menu }); return; }
        TS.fx({ money: -2 });
        if (TS.chance(0.08)) { TS.fx({ money: 10, mood: 15 }); TS.sfx.coin(); ui.say(T().store.lottoWin, { then: menu }); }
        else { TS.fx({ mood: -4 }); TS.sfx.fail(); ui.say(T().store.lottoLose, { then: menu }); }
      } },
      { label: 'Lähde kaupasta', fn: leave },
    ]);
  }

  // Alko does not sell to a drunk customer (Humala 3 or more).
  const tooDrunk = () => TS.S.drunk >= 3;
  function alkoBuy(kind, price, name) {
    const s = TS.S;
    if (tooDrunk()) {
      s.flags.alkoRefused = (s.flags.alkoRefused || 0) + 1;
      TS.sfx.fail();
      TS.fx({ mood: -4 });
      const A = T().alko;
      ui.say(s.flags.alkoRefused > 1 ? A.refusedAgain : A.refused, { who: 'MYYJÄ', then: menu });
      return;
    }
    buy(kind, price, name);
  }

  function alkoMenu() {
    const s = TS.S, D = TS.DRINKS;
    ui.choose((tooDrunk() ? T().alko.drunkLook + ' ' : '') + 'Alko. Hyllyt ovat suorassa rivissä. Toisin kuin elämäsi. Tilillä ' + TS.euro(s.money) + '.', [
      { label: D.viini.name + P(D.viini.price), fn: () => alkoBuy('viini', D.viini.price, D.viini.name) },
      { label: D.viina.name + ' 0,2 l' + P(D.viina.price), fn: () => alkoBuy('viina', D.viina.price, D.viina.name) },
      { label: 'Katsele kalliita viskejä (10 min)', fn() {
        TS.doAction({ min: 10, fx: { mood: -2 }, say: 'Viski, 89 €. Kypsytetty 18 vuotta. Kuin sinä, mutta sitä arvostetaan.', after: menu });
      } },
      { label: 'Lähde Alkosta', fn: leave },
    ]);
  }

  function barMenu() {
    const s = TS.S, B = T().bar;
    ui.choose('Istuva Härkä. Tilillä ' + TS.euro(s.money) + '.', [
      ...['karhu', 'guinness'].map((k) => ({ label: 'Tuoppi ' + (k === 'karhu' ? 'Karhua' : 'Guinnessia') + P(TS.DRINKS[k].price), fn() {
        if (!TS.canPay(TS.DRINKS[k].price)) { TS.sfx.fail(); ui.say(T().store.noMoney, { then: menu }); return; }
        TS.fx({ money: -TS.DRINKS[k].price });
        s.flags.lastTap = k;
        TS.drink(k, 30, { say: B[k], after: menu });
      } })),
      { label: 'Juttele kanta-asiakkaiden kanssa (30 min)', fn() {
        TS.doAction({ min: 30, label: 'JUTUSTELUA', fx: { mood: 4 }, say: TS.pick(B.talk), after: menu });
      } },
      { label: 'Katsele ympärillesi', fn: lookAround },
      { label: 'Lähde baarista', fn: leave },
    ]);
  }

  function lookAround() {
    const s = TS.S, B = T().bar;
    if (s.wallet !== 'none') { ui.say(B.walletGone, { then: menu }); return; }
    if (TS.S.flags.barLooks === undefined) TS.S.flags.barLooks = 0;
    // The wallet is found on the second look (or the first, after 14:00).
    TS.S.flags.barLooks++;
    if (TS.S.flags.barLooks < 2 && s.t < 14 * 60) { ui.say(B.noLook, { then: menu }); return; }
    ui.choose(B.wallet, [
      { label: 'Vie lompakko baarimikolle', fn() {
        s.wallet = 'returned';
        TS.fx({ money: 8.5, mood: 15 });
        TS.sfx.coin();
        ui.say(B.walletReturn, { then: menu });
      } },
      { label: 'Ota rahat (85 €)', fn() {
        s.wallet = 'kept';
        TS.fx({ money: 85, mood: -20 });
        TS.sfx.sad();
        ui.say(B.walletKeep, { then: menu });
      } },
    ]);
  }

  // Tarmo is in the park if you agreed on it on the phone, and you come in time.
  const TARMO_LOOK = { w: '#8a3a2a', W: '#6a2a1e', h: '#cfc8b8', b: '#a8a090', s: '#e8b898', S: '#c89070', j: '#4a4a3a', cap: '#2a4a6a' };
  TS.tarmoHere = function () {
    const S = TS.S, j = S.flags.tarmoPark;
    return !!(j && !S.flags.tarmoMet && S.t >= j.from && S.t < j.until);
  };

  function parkMenu() {
    const s = TS.S, K = T().park;
    const opts = [];
    const j = s.flags.tarmoPark;
    if (j && !s.flags.tarmoMet && s.t >= j.until) {
      s.flags.tarmoMet = true; // too late: he waited and left
      TS.fx({ mood: -5 });
      ui.say(T().tarmoPark.missed, { then: menu });
      return;
    }
    if (TS.tarmoHere()) {
      opts.push({ label: 'Juttele Tarmon kanssa', fn() {
        TS.talk(TS.CALLS.tarmoPark, 'start', { after() {
          s.flags.tarmoMet = true;
          ui.say(T().tarmoPark.gone, { then: menu });
        } });
      } });
    }
    ['beer', 'lonkero', 'viini', 'viina'].forEach((k) => {
      if (s.bag[k] > 0) {
        opts.push({ label: 'Juo kassista: ' + TS.DRINKS[k].name + ' (' + s.bag[k] + ' kpl)', fn() {
          s.bag[k]--;
          const first = !s.flags.parkDrink;
          s.flags.parkDrink = true;
          TS.drink(k, 15, { say: first ? K.drink : 'Varis katsoo. Nostat sille maljan. ' + TS.pick(T().drinks[k]), after: menu });
        } });
      }
    });
    opts.push({ label: 'Istu penkillä (30 min)', fn() {
      TS.doAction({ min: 30, label: 'PENKILLÄ', fx: { mood: 4, energy: 3 }, say: K.sit, after: menu });
    } });
    opts.push({ label: 'Katsele sorsaa', fn() { ui.say(K.ducks, { then: menu }); } });
    opts.push({ label: 'Lähde puistosta', fn: leave });
    const hasDrinks = ['beer', 'lonkero', 'viini', 'viina'].some((k) => s.bag[k] > 0);
    let text = hasDrinks ? 'Puisto. Kassissa kilisee.' : K.nothing;
    if (TS.tarmoHere()) text = 'Tarmo istuu penkillä ja heiluttaa. Hänellä on muovipussi, joka kilisee lupaavasti.';
    else if (j && !s.flags.tarmoMet && s.t < j.from) text += ' Tarmoa ei näy vielä. Hän sanoi puoli tuntia. Tarmon puoli tuntia on pitkä.';
    ui.choose(text, opts);
  }

  function menu() {
    if (TS.S.ended || TS.sceneName !== 'place' || ui.queue.some((q) => q.type === 'choose')) return;
    if (TS.S.phone) { TS.openPhone(); return; } // answer first, menu comes back with the next click
    if (place !== 'park' && !TS.isOpen(place, TS.S.t)) {
      ui.say('Valot sammuvat. "Suljetaan!" Sinut ohjataan ulos.', { then: leave });
      return;
    }
    ({ store: storeMenu, alko: alkoMenu, bar: barMenu, park: parkMenu })[place]();
  }

  TS.scenes.place = {
    hud: true,
    enter(arg) {
      const s = TS.S;
      if (!arg || !arg.id) { menu(); return; } // back from the phone
      place = arg.id;
      const intro = { store: T().store.enter, alko: T().alko.enter, bar: T().bar.enter, park: T().park.enter }[place];
      const lines = [intro];
      if (place === 'store' && !s.flags.sawShirt) { s.flags.sawShirt = true; lines.push(T().store.shirt); }
      if (s.hyg < 25 && place === 'store') lines.push(T().store.stink);
      if (s.hyg < 25 && place === 'alko') lines.push(T().alko.stink);
      // the menu opens after the last intro line
      lines.forEach((t, i) => ui.say(t, i === lines.length - 1 ? { then: menu } : {}));
    },
    click() {
      if (!ui.busy()) menu();
    },
    update(dt) {
      if (!ui.busy()) TS.idleTick(dt);
    },
    draw(g) {
      ({ store: drawStore, alko: drawAlko, bar: drawBar, park: drawPark })[place](g);
      ui.drawHUD(g);
      if (!ui.busy()) TS.text(g, 'KLIKKAA JATKAAKSESI', 160, 168, '#e8e0c8', { align: 'center', shadow: '#000' });
    },
  };

  // ---------- Salespeople: upper body behind the counter ----------
  // Pixel style, but finer than the other characters: drawn bigger inside the
  // pixel canvas, and the colours are kept (no palette snapping).
  const CLERKS = {
    store: { skin: '#f2cdb0', skinD: '#d4a88a', hair: '#c8642a', shirt: '#2fb34a', shirtD: '#1f8a36', eye: '#3a5a3a' }, // the green TILIPÄIVÄ hoodie
    alko: { skin: '#ecc4a0', skinD: '#c89c7c', hair: '#4a3a34', shirt: '#22303e', shirtD: '#18222e', eye: '#4a3a2e' },
    bar: { skin: '#d8a07a', skinD: '#b07a58', hair: '#3a2618', shirt: '#1e1e22', shirtD: '#121214', eye: '#2a2018' },
  };

  function drawClerk(g, kind, cx, counterY) {
    TS.pixelDraw(g, cx - 34, counterY - 84, 68, 86, TS.CHAR_RES, (p) => {
      p.translate(cx, counterY);
      p.scale(1.7, 1.7);
      clerkBody(p, kind);
    }, 'noSnap');
  }

  function clerkBody(p, kind) {
    const L = CLERKS[kind], OL = 'rgba(40,30,26,0.85)', t = TS.realTime;
    const blink = (t % 3.7) < 0.14;
    // torso and shoulders (the counter hides the rest)
    const grad = p.createLinearGradient(-14, 0, 14, 0);
    grad.addColorStop(0, L.shirtD); grad.addColorStop(0.5, L.shirt); grad.addColorStop(1, L.shirtD);
    TS.rbox(p, -14, -25, 28, 30, 8, grad, OL, 0.5);
    // arms resting on the counter
    TS.rbox(p, -16, -22, 6, 20, 3, L.shirtD, OL, 0.4);
    TS.rbox(p, 10, -22, 6, 20, 3, L.shirtD, OL, 0.4);
    if (kind === 'bar') { // short sleeves, hairy forearms, a tattoo
      TS.rbox(p, -16, -12, 6, 11, 3, L.skin, OL, 0.4);
      TS.rbox(p, 10, -12, 6, 11, 3, L.skin, OL, 0.4);
      TS.ell(p, -13, -7, 1.6, 2.2, '#3a5a8a');
    }
    TS.ell(p, -12, -0.8, 3.2, 2, L.skin, OL, 0.4);
    if (kind !== 'bar') TS.ell(p, 12, -0.8, 3.2, 2, L.skin, OL, 0.4);
    // neck and head
    TS.rbox(p, -3.2, -30, 6.4, 7, 2, L.skinD);
    TS.ell(p, -7, -37, 1.5, 2.2, L.skinD, OL, 0.35);
    TS.ell(p, 7, -37, 1.5, 2.2, L.skinD, OL, 0.35);
    TS.ell(p, 0, -37.5, 7, 8.6, L.skin, OL, 0.5);
    // cheeks
    p.globalAlpha = 0.25; TS.ell(p, -4, -34.5, 1.8, 1.1, '#e07a6a'); TS.ell(p, 4, -34.5, 1.8, 1.1, '#e07a6a'); p.globalAlpha = 1;
    // eyes
    [-2.8, 2.8].forEach((ex) => {
      if (blink) { p.lineWidth = 0.4; p.strokeStyle = '#3a2a2a'; p.beginPath(); p.moveTo(ex - 1.3, -37.6); p.lineTo(ex + 1.3, -37.6); p.stroke(); }
      else { TS.ell(p, ex, -37.6, 1.35, 0.85, '#f4efe8'); TS.ell(p, ex, -37.6, 0.62, 0.66, L.eye); TS.ell(p, ex + 0.25, -37.9, 0.18, 0.18, '#fff'); }
    });
    // nose and mouth
    p.lineWidth = 0.45; p.strokeStyle = L.skinD;
    p.beginPath(); p.moveTo(0.2, -37); p.quadraticCurveTo(1.1, -34.6, 0, -34.2); p.stroke();
    p.lineWidth = 0.5; p.strokeStyle = '#8a4a44';

    if (kind === 'store') {
      // 19 years old, already the manager. Bored. Gum.
      TS.ell(p, 0, -43, 7.6, 4.4, L.hair); TS.ell(p, -6.2, -38.5, 1.8, 4.4, L.hair); TS.ell(p, 6.2, -38.5, 1.8, 4.4, L.hair);
      TS.ell(p, 0, -47.6, 3.4, 2.8, L.hair, OL, 0.35); // the bun
      p.lineWidth = 0.6; p.strokeStyle = '#7a4a2a';
      p.beginPath(); p.moveTo(-4.2, -40); p.lineTo(-1.6, -39.8); p.stroke();
      p.beginPath(); p.moveTo(1.6, -39.8); p.lineTo(4.2, -40); p.stroke();
      p.strokeStyle = '#8a4a44'; p.beginPath(); p.moveTo(-1.6, -31.6); p.lineTo(1.6, -31.6); p.stroke();
      const bub = (t % 6) < 1.6 ? (t % 6) / 1.6 : 0; // a gum bubble now and then
      if (bub > 0) TS.ell(p, 0.6, -30.8, 1 + bub * 2.6, 1 + bub * 2.4, '#f29ab8', '#c86a8a', 0.3);
      // the hood behind the neck, and the hoodie strings
      TS.ell(p, 0, -25.5, 8, 3.2, L.shirtD, OL, 0.4);
      p.lineWidth = 0.5; p.strokeStyle = '#f0f0ec';
      p.beginPath(); p.moveTo(-2, -24); p.lineTo(-2.4, -19.5); p.stroke();
      p.beginPath(); p.moveTo(2, -24); p.lineTo(2.4, -19.5); p.stroke();
      // the campaign text across the chest (she will never get it either: 9,63 € an hour)
      TS.text(p, 'TILIPÄIVÄ', 0, -16.8, '#ffffff', { align: 'center', bold: true, s: 0.56 });
      // name tag
      TS.rbox(p, 3.5, -11, 8, 4, 0.8, '#ffe500', OL, 0.3);
      TS.text(p, 'ESIMIES', 7.5, -10, '#1e2a5a', { align: 'center', s: 0.3, bold: true });
    } else if (kind === 'alko') {
      // stern, glasses, one eyebrow up: "Papereita?"
      TS.ell(p, 0, -42.6, 7.8, 5, L.hair); TS.ell(p, -6.4, -37, 2.2, 6, L.hair); TS.ell(p, 6.4, -37, 2.2, 6, L.hair);
      p.globalAlpha = 0.6; TS.ell(p, -2.5, -45.5, 1, 2.5, '#b8b0a8'); p.globalAlpha = 1; // grey streak
      p.lineWidth = 0.45; p.strokeStyle = '#2a2a2a';
      p.beginPath(); p.ellipse(-2.8, -37.6, 2.1, 1.7, 0, 0, Math.PI * 2); p.stroke();
      p.beginPath(); p.ellipse(2.8, -37.6, 2.1, 1.7, 0, 0, Math.PI * 2); p.stroke();
      p.beginPath(); p.moveTo(-0.7, -37.6); p.lineTo(0.7, -37.6); p.stroke();
      p.lineWidth = 0.6; p.strokeStyle = '#3a2a24';
      p.beginPath(); p.moveTo(-4.4, -40.2); p.lineTo(-1.4, -40.2); p.stroke();
      p.beginPath(); p.moveTo(1.4, -40.6); p.quadraticCurveTo(3, -42, 4.4, -41); p.stroke(); // raised brow
      p.strokeStyle = '#9a4a50'; p.beginPath(); p.moveTo(-1.8, -31.5); p.lineTo(1.8, -31.5); p.stroke();
      // white collar
      p.fillStyle = '#f0f0ec';
      p.beginPath(); p.moveTo(-4, -25); p.lineTo(0, -21); p.lineTo(4, -25); p.lineTo(2, -25.5); p.lineTo(0, -23.5); p.lineTo(-2, -25.5); p.closePath(); p.fill();
      TS.rbox(p, -10, -19, 6, 3, 0.6, '#e8e4dc', OL, 0.3); // name badge
    } else {
      // the bartender: bald, beard, a towel on the shoulder, polishing the same glass since 2009
      p.globalAlpha = 0.3; TS.ell(p, -2, -43, 3, 1.6, '#fff'); p.globalAlpha = 1; // shiny head
      TS.ell(p, 0, -31.8, 6.2, 4.6, L.hair);           // beard
      TS.ell(p, 0, -33.2, 2.2, 0.9, '#7a3a34');        // mouth in the beard
      p.lineWidth = 0.9; p.strokeStyle = '#2a1a10';
      p.beginPath(); p.moveTo(-4.4, -40); p.lineTo(-1.3, -39.3); p.stroke();
      p.beginPath(); p.moveTo(1.3, -39.3); p.lineTo(4.4, -40); p.stroke();
      TS.rbox(p, 6, -26, 6, 14, 2, '#f0ece0', OL, 0.3);  // towel on the shoulder
      // polishing a glass in front of the chest
      const k = Math.sin(t * 6) * 1.2;
      TS.rbox(p, -5, -16, 7, 10, 1.5, 'rgba(220,236,244,0.95)', '#8aa0aa', 0.4);
      TS.ell(p, -1.5 + k, -11, 4, 3, '#f0ece0', OL, 0.3); // the rag
      TS.ell(p, -1.5 + k, -8, 3, 2, L.skin, OL, 0.35);
    }
  }


  // Two beer taps on the bar counter: Karhu and Guinness.
  function drawTaps(g, x, top) {
    const R = TS.rect;
    TS.rbox(g, x - 4, top - 16, 38, 6, 2, '#b8bcc0', '#6a6e72', 0.5);         // the tap tower
    R(g, x + 1, top - 10, 3, 10, '#9a9ea2'); R(g, x + 25, top - 10, 3, 10, '#9a9ea2');
    R(g, x - 6, top - 1.5, 42, 1.5, '#3a3a3a');                                // drip tray
    [[x + 2.5, '#c8781e', '#f0c040', 'KARHU'], [x + 26.5, '#141414', '#e8dcc0', 'GUINNESS']].forEach(([hx, handle, plate, name]) => {
      TS.rbox(g, hx - 2, top - 32, 4, 17, 1.5, handle, '#000', 0.4);           // handle
      TS.rbox(g, hx - 6.5, top - 29, 13, 6, 1, plate, '#000', 0.4);             // name plate
      TS.text(g, name, hx, top - 27.4, handle === '#141414' ? '#141414' : '#7a3a10', { align: 'center', bold: true, s: name.length > 5 ? 0.36 : 0.5 });
      R(g, hx - 0.8, top - 10, 1.6, 4, '#6a6e72');                               // spout
    });
    // a glass under the Guinness tap, settling
    TS.rect(g, x + 24, top - 8, 5, 7, '#1a1008'); TS.rect(g, x + 24, top - 8, 5, 1.6, '#e8dcc0');
  }

  // ---------- Backgrounds ----------
  function drawStore(g) {
    const R = TS.rect;
    R(g, 0, 17, 320, 163, '#d8d4c8');
    R(g, 0, 17, 320, 6, '#f0f0e8'); // fluorescent light
    TS.brushSign(g, 104, 22, 112, 13, 'ASS-MARKET', 1.3); // the shop's sign above the shelves
    for (let i = 0; i < 4; i++) {
      const x = 10 + i * 78;
      R(g, x, 34, 64, 100, '#8a8a90');
      for (let sh = 0; sh < 4; sh++) {
        R(g, x + 2, 52 + sh * 22, 60, 2, '#5a5a60');
        for (let p = 0; p < 9; p++) {
          const c = ['#c03a3a', '#e8c040', '#3c5aa8', '#4a8a4a', '#e8869a', '#f0f0e8'][(p + sh + i) % 6];
          R(g, x + 4 + p * 6, 40 + sh * 22, 5, 12, c);
        }
      }
    }
    R(g, 0, 134, 320, 46, '#b8b4a8');
    // bottle return machine
    R(g, 280, 90, 30, 50, '#3a6a3a'); R(g, 286, 100, 18, 12, '#1e1e1e'); TS.text(g, 'PANTTI', 295, 94, '#fff', { align: 'center' });
    // the cashier behind the checkout counter, seen from the customer's side (no floor)
    drawClerk(g, 'store', 168, 118);
    R(g, 0, 118, 320, 62, '#6a6a72'); R(g, 0, 114, 320, 5, '#2a2a2e'); R(g, 0, 118, 320, 1.5, '#8a8a92'); // counter + belt
    for (let x = 6; x < 320; x += 14) R(g, x, 114.5, 6, 0.6, '#3a3a40'); // belt ridges
    R(g, 0, 140, 320, 2, '#5a5a62');
    TS.rbox(g, 96, 100, 24, 18, 2, '#3a3a40'); TS.rect(g, 99, 103, 18, 7, '#7ac0a0'); // register
    TS.text(g, '0,00', 108, 104.5, '#1a3a2a', { align: 'center', s: 0.8 });
    // impulse shelf: gum, lottery tickets, chocolate
    R(g, 214, 98, 52, 16, '#4a4a52');
    ['#c03a3a', '#e8c040', '#3c5aa8', '#4a8a4a', '#e8869a', '#8a4a2a'].forEach((c, i) => R(g, 217 + i * 8, 101, 6, 11, c));
    TS.text(g, 'ARVAT', 240, 92, '#c03a3a', { align: 'center', bold: true, s: 0.8 });
    TS.rbox(g, 40, 104, 30, 10, 2, '#5a3a20'); TS.text(g, 'KASSA 1', 55, 106.5, '#e8e0c8', { align: 'center', s: 0.7 });
  }

  function drawAlko(g) {
    const R = TS.rect;
    R(g, 0, 17, 320, 163, '#e8e6e0');
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 62;
      R(g, x, 30, 54, 104, '#c8c4b8');
      for (let sh = 0; sh < 5; sh++) {
        R(g, x + 2, 48 + sh * 18, 50, 1, '#9a968a');
        for (let p = 0; p < 7; p++) {
          const c = ['#6a1f2e', '#cfe3ea', '#5c3b17', '#3a6a3a', '#d8c060'][(p * 3 + sh + i) % 5];
          R(g, x + 4 + p * 7, 36 + sh * 18, 4, 12, c);
          R(g, x + 5 + p * 7, 33 + sh * 18, 2, 3, c);
        }
      }
    }
    TS.alkoLogo(g, 290, 32, 12); // the sign on the wall
    // the clerk behind the counter, seen from the customer's side (no floor)
    drawClerk(g, 'alko', 160, 118);
    R(g, 0, 118, 320, 62, '#5a6a70'); R(g, 0, 114, 320, 5, '#d8d4cc'); R(g, 0, 118, 320, 1.5, '#7a8a90');
    R(g, 0, 145, 320, 2, '#4a5a60');
    TS.rbox(g, 104, 100, 18, 14, 2, '#2a2a2e'); TS.rect(g, 106, 102, 14, 6, '#9ad0e0'); // card reader
    TS.drawFlask(g, 210, 101, 1.2); TS.drawTetra(g, 222, 100, 1.1); // someone else's shopping
    TS.rbox(g, 248, 100, 40, 14, 2, '#f0f0ec', '#9a9a96', 0.5);
    TS.text(g, 'IKÄRAJA 18/20', 268, 104.5, '#c03a3a', { align: 'center', bold: true, s: 0.62 });
  }

  function drawBar(g) {
    const R = TS.rect;
    R(g, 0, 17, 320, 163, '#2a1e18');
    R(g, 0, 17, 320, 60, '#3a2a20');
    // shelves of bottles behind the bar
    for (let i = 0; i < 24; i++) R(g, 40 + i * 10, 40 + (i % 2) * 2, 5, 14, ['#5c3b17', '#cfe3ea', '#3a6a3a', '#c8803a'][i % 4]);
    R(g, 30, 56, 260, 2, '#6b4a2e');
    // small TV showing sports
    R(g, 250, 22, 40, 26, '#1e1e1e'); R(g, 253, 25, 34, 20, '#3a8a4a'); R(g, 268, 30, 3, 3, '#fff');
    // the bartender behind the bar
    drawClerk(g, 'bar', 165, 110);
    // bar counter
    R(g, 0, 110, 320, 14, '#6b4a2e'); R(g, 0, 124, 320, 40, '#4a3220'); R(g, 0, 110, 320, 1.5, '#8a6a4a');
    TS.rect(g, 196, 101, 5, 9, '#e8c040'); TS.rect(g, 196, 100, 5, 2, '#fff8e0'); // a pint on the counter
    drawTaps(g, 104, 110);
    // regulars on stools
    [[50, '#6a3a3a'], [240, '#3a4a6a'], [282, '#5a5a3a']].forEach(([x, c]) => {
      R(g, x, 86, 14, 24, c); R(g, x + 3, 76, 9, 10, '#d8a888'); R(g, x + 2, 74, 11, 3, '#8a8a8a');
      R(g, x + 16, 100, 5, 10, '#e8c040'); // pint
    });
    for (let i = 0; i < 6; i++) R(g, 10 + i * 52, 164, 10, 16, '#2a1a10'); // stools
    g.globalAlpha = 0.15; R(g, 0, 17, 320, 163, '#f070b0'); g.globalAlpha = 1;
  }

  function drawPark(g) {
    const R = TS.rect;
    const dark = ui.isDark();
    R(g, 0, 17, 320, 163, dark ? '#0e1226' : '#8a919a');
    R(g, 0, 110, 320, 70, dark ? '#1e2a1e' : '#4a6a3a');
    R(g, 200, 130, 100, 24, dark ? '#1a2238' : '#5a7a9a'); // pond
    R(g, 240, 136, 8, 5, '#6a5a3a'); R(g, 246, 134, 3, 3, '#2a6a3a'); // duck
    [[30, 60], [90, 50], [170, 66]].forEach(([x, y]) => {
      R(g, x + 10, y + 30, 5, 50, '#4a3a2a');
      R(g, x, y, 26, 34, dark ? '#1a2a1a' : '#3a5a2a');
    });
    R(g, 300, 40, 3, 90, '#2a2a2a'); R(g, 296, 38, 11, 4, dark ? '#fff0a0' : '#555');
    // crows
    R(g, 40, 58, 4, 3, '#111'); R(g, 102, 52, 4, 3, '#111');
    // bench
    R(g, 100, 140, 60, 4, '#6b4a2e'); R(g, 100, 130, 60, 3, '#6b4a2e'); R(g, 104, 144, 3, 10, '#333'); R(g, 152, 144, 3, 10, '#333');
    for (let i = 0; i < 22; i++) {
      const px = (i * 47 + Math.floor(TS.realTime * 25)) % 320;
      const py = 17 + ((i * 29 + Math.floor(TS.realTime * 60)) % 160);
      R(g, px, py, 1, 2, '#c8d0d8');
    }
    ui.drawTint(g, 0.6);
    // the people come after the evening light, so they stay solid
    if (TS.tarmoHere()) {
      TS.drawMan(g, 112, 176, 1, false, true, TARMO_LOOK);
      TS.rbox(g, 96, 160, 9, 9, 2, '#e8e8e0', '#888'); // his clinking plastic bag
      TS.drawMan(g, 152, 176, -1, false, true);
    } else {
      TS.drawMan(g, 130, 176, 1, false, true);
    }
  }
})();
