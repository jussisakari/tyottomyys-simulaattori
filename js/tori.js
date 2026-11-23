// tori.js – selling your stuff on Tori.fi. First you find things at home,
// then list them on the laptop or phone. A buyer writes some time later,
// always with a lower offer.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const X = () => TS.T.tori;

  // Things that can be sold. found = Keijo knows about it (wall things are found from the start).
  TS.toriState = function (S) {
    if (!S.tori) S.tori = { found: { poster: true, painting: true, abs: false, phone: false }, listed: {}, sold: {} };
    return S.tori;
  };

  TS.toriSellable = function () {
    const st = TS.toriState(TS.S);
    return Object.keys(X().items).filter((id) => st.found[id] && !st.sold[id]);
  };

  // Put an item on sale. A buyer writes in 20-70 minutes.
  TS.toriList = function (id, minutes) {
    const S = TS.S, st = TS.toriState(S);
    TS.doAction({ min: minutes || 15, label: 'OTAT KUVIA...', say: X().listed, after() {
      st.listed[id] = S.t + TS.rand(20, 70);
    } });
  };

  // Called every game minute (from state.js).
  TS.toriTick = function () {
    const S = TS.S;
    if (!S.tori) return;
    const st = S.tori;
    Object.keys(st.listed).forEach((id) => {
      if (st.listed[id] !== null && S.t >= st.listed[id]) {
        st.listed[id] = null; // the buyer is writing now
        if (!S.sleeping) ui.toast(X().newMsg);
        offer(id);
      }
    });
  };

  function offer(id) {
    const S = TS.S, st = S.tori, it = X().items[id];
    const fill = (s) => s.replace('{low}', TS.euro(it.low).replace(' €', '')).replace('{price}', TS.euro(it.price).replace(' €', ''));
    const wantsMobile = TS.chance(0.45); // some buyers only want to pay with MobilePay
    const agree = (amount) => (wantsMobile ? askPayment(id, amount) : sell(id, amount, 'cash'));
    ui.choose(fill(X().offer), [
      { label: fill(X().accept), fn() { agree(it.low); } },
      { label: fill(X().askFull), fn() {
        if (TS.chance(0.5)) { ui.say(X().fullYes, { who: it.buyer }); agree(it.price); }
        else { TS.fx({ mood: -3 }); ui.say(X().fullNo, { who: it.buyer }); st.listed[id] = S.t + TS.rand(30, 90); }
      } },
      { label: X().ignore, fn() { st.listed[id] = S.t + TS.rand(40, 120); } },
    ], { who: 'TORI.FI: ' + it.buyer });
  }

  // MobilePay or cash? Money on the account is income in Kela's eyes. Cash is... cash.
  function askPayment(id, amount) {
    const S = TS.S, st = S.tori, it = X().items[id];
    ui.choose(X().mobileAsk, [
      { label: X().cashOnly, fn() {
        if (TS.chance(0.6)) { ui.say(X().cashYes, { who: it.buyer }); sell(id, amount, 'cash'); }
        else { TS.fx({ mood: -3 }); ui.say(X().cashNo, { who: it.buyer }); st.listed[id] = S.t + TS.rand(30, 90); }
      } },
      { label: X().mobileOk, fn() { sell(id, amount, 'mobile'); } },
    ], { who: 'TORI.FI: ' + it.buyer });
  }

  function sell(id, amount, how) {
    const S = TS.S, st = S.tori, it = X().items[id];
    st.sold[id] = true;
    delete st.listed[id];
    TS.sfx.coin();
    const lines = [it.sold, (how === 'mobile' ? X().mobilePaid : X().cashPaid).replace('{e}', TS.euro(amount))];
    if (how === 'mobile') {
      // Kela's computer notices the transfer within the hour and takes it all back
      if (!st.claw) st.claw = [];
      st.claw.push({ at: S.t + TS.rand(30, 70), amount: amount, what: it.name });
    }
    TS.doAction({ min: 10, fx: { money: amount, mood: it.mood }, say: lines });
  }

  // Kela's claw-back for MobilePay sales (called from TS.toriTick)
  function kelaClaw() {
    const S = TS.S, st = S.tori;
    if (!st || !st.claw) return;
    for (let i = 0; i < st.claw.length; i++) {
      const c = st.claw[i];
      if (c.at > S.t) continue;
      st.claw.splice(i--, 1);
      // Kela takes what is on the account (never below 0 €); the rest is cut from the next benefit
      TS.fx({ money: -Math.min(c.amount, Math.max(0, S.money)), mood: -6 });
      S.kelaCut = Math.round(((S.kelaCut || 0) + c.amount) * 100) / 100;
      const body = X().kelaMail.replace('{e}', TS.euro(c.amount)).replace('{x}', c.what);
      S.emails.push({ from: 'Kela', subj: 'Tulojen huomioiminen', body: body, at: S.t, read: false, notified: true });
      if (!S.sleeping) ui.say(X().kelaCut.replace('{e}', TS.euro(c.amount)));
    }
  }
  const tick = TS.toriTick;
  TS.toriTick = function () { tick(); kelaClaw(); };})();
