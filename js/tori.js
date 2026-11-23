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
    ui.choose(fill(X().offer), [
      { label: fill(X().accept), fn() { sell(id, it.low); } },
      { label: fill(X().askFull), fn() {
        if (TS.chance(0.5)) { ui.say(X().fullYes, { who: it.buyer }); sell(id, it.price); }
        else { TS.fx({ mood: -3 }); ui.say(X().fullNo, { who: it.buyer }); st.listed[id] = S.t + TS.rand(30, 90); }
      } },
      { label: X().ignore, fn() { st.listed[id] = S.t + TS.rand(40, 120); } },
    ], { who: 'TORI.FI: ' + it.buyer });
  }

  function sell(id, amount) {
    const S = TS.S, st = S.tori, it = X().items[id];
    st.sold[id] = true;
    delete st.listed[id];
    TS.sfx.coin();
    TS.doAction({ min: 10, fx: { money: amount, mood: it.mood }, say: [it.sold, X().pickup.replace('{e}', TS.euro(amount))] });
  }
})();
