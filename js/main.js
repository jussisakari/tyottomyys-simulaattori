// main.js – starts the game.
//
// Shortcuts for testing (add to the address, e.g. index.html#t=14:50&hak=3):
//   t=HH:MM     start at this time           hak=N     applications already sent
//   hyg=N       hygiene 0-100                olut=N    drinks already drunk
//   raha=N      money on the account         ulos      start outside
//   paikka=store|alko|bar|park               loppu     go straight to the ending
//   scene=fridge|bathroom|laptop (&phone)    intro     apartment with the intro texts
//   soita=te|mum|tarmo|tarja                 start that phone conversation
//   tarmo (with paikka=park)                 Tarmo is waiting on the park bench
//   scene=tarja                              at Tarja's place
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const hash = location.hash.slice(1);
  if (!hash) { TS.start('title'); return; }

  const p = {};
  hash.split('&').forEach((kv) => { const [k, v] = kv.split('='); p[k] = v === undefined ? true : decodeURIComponent(v); });

  TS.S = TS.newState();
  const s = TS.S;
  if (p.t) {
    const [h, m] = p.t.split(':').map(Number);
    s.t = (h < 7 ? h + 24 : h) * 60 + (m || 0);
    TS.EVENTS.forEach((e) => { const at = typeof e.at === 'function' ? e.at(s) : e.at; if (at < s.t) s.fired[e.id] = true; });
    s.inBed = false;
  }
  if (p.hak) s.apps = Number(p.hak);
  if (p.hyg) s.hyg = Number(p.hyg);
  if (p.olut) { s.drinks = Number(p.olut); s.drunk = Number(p.olut); }
  if (p.raha) s.money = Number(p.raha);

  if (p.loppu) { s.ended = true; s.endReason = 'nukkumaan'; TS.start('ending'); return; }
  if (p.tarmo) s.flags.tarmoPark = { from: s.t, until: s.t + 240 };
  if (p.paikka) { TS.start('place', { id: p.paikka }); return; }
  if (p.scene) { TS.start(p.scene, { phone: !!p.phone, back: 'apartment', kanava: Number(p.kanava || 0) }); return; }
  if (p.soita) { s.inBed = false; TS.start('apartment'); TS.talk(TS.CALLS[p.soita], 'start'); return; }
  if (p.intro) { TS.start('apartment'); TS.T.intro.forEach((t) => TS.ui.say(t)); return; }
  TS.start(p.ulos ? 'street' : 'apartment', p.ulos ? { from: 'home' } : undefined);
})();
