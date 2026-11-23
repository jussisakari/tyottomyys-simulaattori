// events.js – things that happen at set times during the day, and the
// phone (calls from TE-palvelut and mum, apps for job search and some).
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const T = () => TS.T;

  TS.EVENTS = [
    { id: 'reno', at: 9 * 60, fn(S) { TS.fx({ mood: -3 }); ui.say(T().ev.reno); } },
    { id: 'te', at: 10 * 60 + 30, fn(S) { if (S.teState === 'pending') TS.ring('te', 30); } },
    { id: 'neighbour', at: 13 * 60, fn: neighbour },
    { id: 'post', at: 15 * 60, fn(S) { S.mail = true; if (!S.sleeping && !S.outside) ui.toast(T().ev.post); } },
    { id: 'mum', at: 18 * 60, fn() { TS.ring('mum', 20); } },
    { id: 'show', at: 21 * 60, fn(S) { if (!S.outside && !S.sleeping) ui.say(T().ev.show); } },
    { id: 'warn', at: 23 * 60, fn(S) { if (S.apps < 4) ui.say(T().ev.warn); } },
    { id: 'midnight', at: 24 * 60, fn(S) { ui.say(S.apps >= 4 ? T().ev.midOk : T().ev.midBad); } },
  ];

  TS.checkEvents = function () {
    const S = TS.S;
    TS.EVENTS.forEach((e) => {
      const at = typeof e.at === 'function' ? e.at(S) : e.at;
      if (!S.fired[e.id] && S.t >= at) {
        S.fired[e.id] = true;
        e.fn(S);
      }
    });
  };

  // ---------- Neighbour at the door ----------
  function neighbour(S) {
    if (S.outside) return;
    const smelly = S.hyg < 40 || !S.trashOut;
    const N = T().neighbour;
    if (!smelly) { ui.say(N.sugar, { who: N.who }); return; }
    if (S.sleeping) { TS.fx({ mood: -3 }); ui.say(N.note); return; }
    ui.choose(N.knock, [
      { label: N.a1, fn() { TS.fx({ mood: -2 }); ui.say(N.r1, { who: N.who }); } },
      { label: N.a2, fn() { TS.fx({ mood: 8 }); S.fridge.pulla++; ui.say(N.r2); } },
      { label: N.a3, fn() { TS.fx({ mood: -4 }); ui.say(N.r3); } },
    ], { who: N.who });
  }

  // ---------- Phone calls ----------
  TS.ring = function (who, minutes) {
    const S = TS.S;
    S.phone = { who: who, until: S.t + minutes };
    if (!S.sleeping) { ui.toast(T().phone.ringing); TS.sfx.ring(); }
  };

  TS.checkPhone = function () {
    const S = TS.S, p = S.phone;
    if (!p || S.t < p.until) return;
    S.phone = null;
    if (p.who === 'te') {
      if (S.teState === 'pending') S.teState = 'missed';
      ui.say(T().te.missed);
    } else {
      S.mumMissed = true;
      ui.say(T().mum.missed);
    }
  };


  // The phone icon: answers a ringing call, otherwise opens the phone's home screen.
  TS.openPhone = function () {
    const S = TS.S;
    if (S.phone) {
      const who = S.phone.who;
      S.phone = null;
      TS.talk(TS.CALLS[who], 'start');
      return;
    }
    TS.go('phonehome', { back: TS.sceneName });
  };

  // The "Puhelin" app: who to call.
  TS.phoneContacts = function () {
    const S = TS.S;
    ui.choose('Yhteystiedot. Viimeisin puhelu: äiti, kolme viikkoa sitten. Hän soitti.', [
      S.teState !== 'ok' && { label: 'TE-palvelut', fn: teCallback },
      { label: 'Äiti' + (S.mumMissed ? ' (vastaamaton puhelu)' : ''), fn() { S.mumMissed = false; TS.talk(TS.CALLS.mum, 'start'); } },
      { label: 'Tarmo', fn: tarmoCall },
      { label: 'Kari (ei koskaan vastaa)', fn() { TS.callKari(); } },
      // Always visible, but greyed out until you have enough liquid courage (Humala 2+)
      tarjaWaiting()
        ? { label: '"Tarja? pubista.." (hän odottaa!)', fn: bootyCall }
        : S.drunk >= 2
        ? { label: '"Tarja? pubista.." (huono idea)', fn: bootyCall }
        : { label: '"Tarja? pubista.." (liian selvä)', disabled: true, fn() { ui.say(T().booty.sober); } },
      { label: 'Takaisin' },
    ]);
  };
  // Tarmo stops answering after three calls.
  function tarmoCall() {
    const S = TS.S;
    S.flags.tarmoCalls = (S.flags.tarmoCalls || 0) + 1;
    if (S.flags.tarmoCalls > 3) { ui.say(T().tarmo.tired); return; }
    TS.talk(TS.CALLS.tarmo, 'start');
  }

  function tarjaWaiting() {
    const S = TS.S;
    return !!(S.flags.tarjaWaits && S.t < S.flags.tarjaWaits);
  }

  // Tarja: you need Humala 2+ to dare. She answers once, then blocks you.
  function bootyCall() {
    const S = TS.S;
    // She said she'd stay up for a few hours: you can call back once (no courage needed now).
    if (tarjaWaiting()) { S.flags.tarjaWaits = 0; TS.talk(TS.CALLS.tarja, 'again'); return; }
    if (S.drunk < 2) { ui.say(T().booty.sober); return; }
    if (S.flags.tarja) { TS.fx({ mood: -3 }); ui.say(T().booty.blocked); return; }
    S.flags.tarja = true;
    TS.talk(TS.CALLS.tarja, 'start');
  }

  // Calling TE-palvelut yourself: first the queue, then the same conversation.
  function teCallback() {
    const E = T().te;
    ui.choose(E.callback, [
      { label: 'Jonota (2 h 40 min)', fn() {
        TS.doAction({ min: 160, label: 'JONOSSA... MUSIIKKI SOI', fx: { mood: -10 }, say: E.queueDone,
          after() { TS.talk(TS.CALLS.te, 'again'); } });
      } },
      { label: 'Luovuta' },
    ], { who: E.who });
  }
})();
