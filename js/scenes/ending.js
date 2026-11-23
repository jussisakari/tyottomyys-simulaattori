// ending.js – the end of the day: a title, Kela's decision letter, a dry
// comment and a summary of the day.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const AGAIN = { x: 100, y: 164, w: 120, h: 13 };
  let end = null;

  TS.scenes.ending = {
    enter() {
      end = TS.computeEnding(TS.S);
      TS.sfx.sad();
    },
    click(x, y) {
      if (TS.hit(AGAIN, x, y)) { TS.sfx.click(); TS.newGame(); }
    },
    draw(g) {
      const R = TS.rect, s = TS.S;
      const E = TS.T.endings[end.id];
      R(g, 0, 0, 320, 180, '#14121c');
      const why = s.endReason === 'aamu' ? TS.T.ev.morning : 'Päivä päättyi klo ' + TS.clockStr(s.t) + '.';
      TS.wrap(why, 76).slice(0, 2).forEach((ln, i) => TS.text(g, ln, 160, 4 + i * 7, '#8a8494', { align: 'center' }));
      TS.text(g, E.title, 160, 20, '#f0c850', { s: 2, align: 'center', shadow: '#5a3a10' });

      // Kela's letter
      R(g, 30, 36, 260, 66, '#ece6d4');
      R(g, 30, 36, 260, 9, '#3c5a8a');
      TS.text(g, 'PÄÄTÖS TYÖTTÖMYYSETUUDESTA', 36, 38, '#ffffff');
      TS.text(g, 'KELA', 282, 38, '#ffffff', { align: 'right' });
      let y = 50;
      TS.wrap(end.decision, 62).forEach((ln) => { TS.text(g, ln, 36, y, '#2a2a2a'); y += 8; });
      TS.text(g, 'TÄMÄ PÄÄTÖS ON TEHTY AUTOMAATTISESTI. VALITTAA VOI.', 36, 92, '#8a8478');

      // narrator
      y = 108;
      TS.wrap(E.line.replace('{n}', s.drinks), 74).forEach((ln) => { TS.text(g, ln, 160, y, '#e8e0c8', { align: 'center' }); y += 8; });

      // summary
      const yes = (b) => (b ? 'KYLLÄ' : 'EI');
      const sum = [
        'HAKEMUKSET ' + s.apps + '/4   TE-PUHELU ' + (s.teState === 'ok' ? 'HOIDETTU' : 'EI') + '   SUIHKU ' + yes(s.showered),
        'JUOMIA ' + s.drinks + '   TORKKUJA ' + s.snoozes + '   TILILLÄ ' + TS.euro(s.money) + '   SIIVOTTU ' + yes(s.cleaned),
        [(s.wallet === 'kept' ? 'OMATUNTO -85 €' : ''),
          (s.flags.orders ? 'OSTOS-TV-TILAUKSIA ' + s.flags.orders : ''),
          (s.debt ? 'KLARNA-VELKA ' + TS.euro(s.debt) : '')].filter(Boolean).join('   '),
      ].filter(Boolean);
      sum.forEach((ln, i) => TS.text(g, ln, 160, 134 + i * 7.5, '#8a8494', { align: 'center' }));
      TS.text(g, TS.T.endFooter, 160, 157, '#c8c0b0', { align: 'center' });
      TS.button(g, AGAIN, 'HERÄÄ UUDELLEEN');
    },
  };
})();
