// state.js – the game state: clock, stats, bank account, things in the fridge
// and in the shopping bag. Time only moves with TS.advance().
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const SAVE_KEY = 'tyottomyys-save-v1';

  TS.DAY_START = 7 * 60;      // 07:00
  TS.DEADLINE = 24 * 60;      // midnight: applications must be sent before this
  TS.DAY_END = 31 * 60;       // 07:00 next morning

  // Drinks: how drunk and how happy (for a moment) they make you.
  TS.DRINKS = {
    beer: { name: 'Kaljaasi III -olut', short: 'olut', drunk: 1, mood: 10, price: 0.99, bottle: true },
    lonkero: { name: 'Lonkero', short: 'lonkero', drunk: 1.2, mood: 13, price: 1.98, bottle: false },
    viini: { name: 'Tetraviini 1 l', short: 'viini', drunk: 3, mood: 18, price: 8.49, bottle: false },
    viina: { name: 'Taskumatti viinaa', short: 'viina', drunk: 3, mood: 16, price: 6.9, bottle: false },
  };
  // Food: how much hunger it removes.
  TS.FOODS = {
    maka: { name: 'Makaronilaatikko', hunger: -45, mood: 3 },
    onion: { name: 'Puolikas sipuli', hunger: -8, mood: -4 },
    mustard: { name: 'Sinappi', hunger: -3, mood: -1 },
    jar: { name: 'Mysteeripurkki', hunger: -10, mood: -8 },
    fish: { name: 'Kalapuikko', hunger: -10, mood: 0 },
    pulla: { name: 'Naapurin pulla', hunger: -20, mood: 10 },
    makkara: { name: 'Lenkkimakkara', hunger: -35, mood: 5, price: 1.89 },
    leipa: { name: 'Ruisleipä', hunger: -15, mood: 1, price: 1.29 },
    nuudeli: { name: 'Pikanuudelit', hunger: -20, mood: 0, price: 0.45 },
  };

  TS.newState = function () {
    // The job ads come in a random order each day.
    const order = TS.T.ads.map((_, i) => i).sort(() => Math.random() - 0.5);
    return {
      t: TS.DAY_START,
      energy: 40, hunger: 60, hyg: 15, mood: 30, drunk: 0,
      money: 4.37,                       // bank account
      apps: 0, appliedAds: [], adOrder: order,
      drinks: 0, snoozes: 0,
      showered: false, trashOut: false, dishesDone: false, shaved: false,
      teState: 'pending',                 // pending | ok | missed
      phone: null,                        // { who, until } while ringing
      mumMissed: false, mumMoney: false,
      mail: false, mailRead: false, kelaForm: false,
      sick: false, makaBad: Math.random() < 0.35,
      bottles: 23,                        // empty bottles in the pile at home
      bottleBag: 0,                       // bottles collected in the plastic bag (Alepan kassi), carried along
      debt: 0,                            // Klarna: pay later (= never)
      cleaned: false,
      binSearches: 0,
      wallet: 'none',                     // none | returned | kept
      inBed: true, firstUp: false, wentOut: false, outside: false,
      fridge: { maka: 1, onion: 1, mustard: 3, jar: 1, fish: 1, pulla: 0, makkara: 0, leipa: 0, nuudeli: 0,
        beer: 3, lonkero: 0, viini: 0, viina: 0 },
      bag: {},                            // things bought, carried home
      emails: TS.T.mail.first.map((m) => Object.assign({ at: 0, read: false, notified: true }, m)),
      fired: {},
      miracle: false, typos: 0,
      flags: {},
      sleptAllDay: false, ended: false, endReason: null,
    };
  };

  TS.clockStr = function (t) {
    const h = Math.floor(t / 60) % 24, m = Math.floor(t % 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  };

  const STATS = ['energy', 'hunger', 'hyg', 'mood'];
  function clampStats(S) {
    STATS.forEach((k) => { S[k] = TS.clamp(S[k], 0, 100); });
    S.drunk = TS.clamp(S.drunk, 0, 10);
    S.money = Math.round(S.money * 100) / 100;
  }

  // Changes stats: TS.fx({ hyg: +50, money: -0.99 })
  TS.fx = function (f) {
    const S = TS.S;
    Object.keys(f || {}).forEach((k) => { S[k] = (S[k] || 0) + f[k]; });
    clampStats(S);
  };

  TS.canPay = (price) => TS.S.money + 0.001 >= price;

  // Lets game time pass, minute by minute. mode 'sleep' = sleeping.
  TS.advance = function (min, mode) {
    const S = TS.S;
    const sleep = mode === 'sleep';
    S.sleeping = sleep;
    for (let i = 0; i < min; i++) {
      if (S.ended) break;
      S.t++;
      if (sleep) { S.energy += 15 / 60; S.hunger += 2 / 60; }
      else { S.energy -= 3 / 60; S.hunger += 4 / 60; S.mood -= 1 / 60; }
      S.hyg -= 1 / 60;
      if (S.hunger > 80) S.mood -= 2 / 60;
      if (S.sick) S.mood -= 5 / 60;
      if (S.wallet === 'kept') S.mood -= 2 / 60;
      S.drunk -= 1 / 90;
      clampStats(S);
      if (!sleep && S.energy <= 0) S.pendingCollapse = true;

      TS.checkEvents();
      TS.checkPhone();
      TS.toriTick();
      // New e-mails
      S.emails.forEach((m) => {
        if (!m.notified && !m.hidden && m.at <= S.t) {
          m.notified = true;
          if (!sleep) TS.ui.toast(TS.T.mail.newMail);
        }
      });
      if (S.t >= TS.DAY_END) { TS.endDay('aamu'); break; }
    }
    S.sleeping = false;
    if (S.ended) return;

    // Things you notice after time has passed
    if (S.hunger > 85 && !S.flags.hungry) { S.flags.hungry = true; TS.ui.say(TS.T.hungry); }
    if (S.hunger < 60) S.flags.hungry = false;
    if (S.mood < 10 && !S.flags.sad) { S.flags.sad = true; TS.ui.say(TS.T.sad); }
    if (S.pendingCollapse) {
      S.pendingCollapse = false;
      TS.ui.say(TS.T.collapse);
      TS.advance(120, 'sleep');
    }
    TS.save();
  };

  // While nobody clicks anything, the clock still moves: 1 game minute every 2 seconds.
  let idleAcc = 0;
  TS.idleTick = function (dt) {
    if (TS.ui.busy() || !TS.S || TS.S.ended) return;
    idleAcc += dt;
    while (idleAcc >= 2 && !TS.ui.busy()) {
      idleAcc -= 2;
      TS.advance(1);
    }
    if (idleAcc > 2) idleAcc = 0;
  };

  // Drinking. Same for the fridge, the park and the bar.
  // opts = { say: text instead of the usual line, after() }
  TS.drink = function (kind, minutes, opts) {
    opts = opts || {};
    const S = TS.S, d = TS.DRINKS[kind];
    S.drinks++;
    if (d.bottle) { if (S.outside) S.bottleBag++; else S.bottles++; } // outside the empty goes straight into the bag
    const lines = [opts.say || TS.pick(TS.T.drinks[kind] || TS.T.drinks.beer)];
    if (S.drinks === 3) lines.push(TS.T.drinks.third);
    TS.sfx.gulp();
    TS.doAction({
      min: minutes || 10, label: 'GLUK GLUK',
      fx: { mood: d.mood, drunk: d.drunk, energy: -4, hunger: -3 },
      say: lines,
      after() {
        // Too much: you pass out and lose a few hours.
        if (S.drunk >= 7 && !S.ended) {
          TS.ui.say(TS.T.passOut);
          TS.fx({ mood: -15, hyg: -10 });
          TS.advance(180, 'sleep');
        }
        if (opts.after && !S.ended) opts.after();
      },
    });
  };

  TS.endDay = function (reason) {
    const S = TS.S;
    if (S.ended) return;
    S.ended = true;
    S.endReason = reason;
    TS.save();
    TS.ui.clear();
    TS.go('ending');
  };

  TS.computeEnding = function (S) {
    let id;
    if (S.miracle) id = 'ihme';
    else if (S.flags.tarjaNight) id = 'tarja';
    else if ((S.sleptAllDay || S.snoozes >= 8) && S.apps === 0) id = 'kuningas';
    else if (S.wallet === 'kept') id = 'lompakko';
    else if (S.drinks >= 3) id = 'filosofi';
    else if (S.apps >= 4 && S.teState === 'ok') id = 'sankari';
    else if (S.apps >= 4) id = 'melkein';
    else if (S.showered && S.apps === 0) id = 'puhdas';
    else if (S.apps > 0) id = 'karenssi';
    else id = 'paiva';

    const D = TS.T.decision;
    let decision;
    if (S.apps >= 4 && S.teState === 'ok') decision = D.paid;
    else if (S.apps >= 4) decision = D.clarify;
    else if (S.apps > 0) decision = D.karenssi.replace('{n}', S.apps);
    else decision = D.denied;
    if (S.kelaForm) decision += '\n' + D.form;
    return { id, decision };
  };

  // ---------- Saving ----------
  TS.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(TS.S)); } catch (e) { /* private mode */ }
  };
  TS.loadSave = function () {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
  };

  TS.newGame = function () {
    TS.S = TS.newState();
    TS.ui.clear();
    TS.go('apartment');
    TS.sfx.alarm();
    TS.T.intro.forEach((t) => TS.ui.say(t));
    TS.save();
  };

  TS.continueGame = function (saved) {
    TS.S = saved;
    TS.ui.clear();
    TS.go(saved.outside ? 'street' : 'apartment');
  };
})();
