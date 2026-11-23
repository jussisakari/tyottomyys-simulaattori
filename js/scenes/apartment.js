// apartment.js – the studio apartment (yksiö). Click things: Keijo shuffles
// there and you get a menu of what to do.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;
  const T = () => TS.T;
  const S = () => TS.S;

  const FOOT_Y = 172;
  const man = TS.man = { x: 100, target: null, dir: 1, onArrive: null };
  let ringTimer = 0;

  const C = {
    wall: '#b3a37c', stripe: '#a89770', stain: '#9c8a60', base: '#5e4630',
    floor: '#6e5e4a', floorLine: '#615240', floorStain: '#5c4c38',
    door: '#6b4a2e', doorDark: '#4f3520', knob: '#c9a640',
    bathDoor: '#c8c2b0', bathDark: '#a39d8c',
    wood: '#6b4a2e', woodDark: '#4f3520', mattress: '#d6cdb8', mStain: '#bfae84',
    pillow: '#e2dccb', blanket: '#5d6e3b', blanketDark: '#4a5a2e',
    desk: '#7a5a3a', laptop: '#2a2a30',
    sofa: '#7a4f30', sofaDark: '#5e3a22', stuffing: '#e8e0c8',
    tv: '#3a3a3a', tvScreen: '#1c2620',
    counter: '#8a8070', counterTop: '#a8a090', steel: '#b8bcc0', dish: '#e0e0d8',
    fridge: '#d8d3bc', fridgeDark: '#b8b29a', note: '#f0e060',
    frame: '#d9d4c2',
  };

  // ---------------- Hotspots ----------------
  const HOT = [
    { id: 'note', name: 'Muistilappu', r: { x: 299, y: 80, w: 10, h: 10 }, stand: 296, use: showNote },
    { id: 'phone', name: 'Puhelin', r: { x: 166, y: 103, w: 10, h: 10 }, stand: 168, use: () => TS.openPhone() },
    { id: 'drawer', name: 'Pöytälaatikko', r: { x: 142, y: 114, w: 32, h: 11 }, stand: 156, use: drawer },
    { id: 'laptop', name: 'Läppäri (Win 95)', r: { x: 144, y: 95, w: 24, h: 18 }, stand: 156, use: () => TS.go('laptop', { phone: false, back: 'apartment' }) },
    { id: 'calendar', name: 'Kalenteri', r: { x: 112, y: 50, w: 16, h: 18 }, stand: 118, use: () => ui.say(T().calendar) },
    { id: 'poster', name: 'Sabrina-juliste', r: { x: 69, y: 34, w: 32, h: 34 }, stand: 85, use: () => wallThing('poster') },
    { id: 'cans', name: 'Tölkkejä (siivoa?)', r: { x: 138, y: 156, w: 40, h: 16 }, stand: 158, use: cleanRoom },
    { id: 'painting', name: 'Hirvitaulu', r: { x: 194, y: 48, w: 28, h: 24 }, stand: 208, use: () => wallThing('painting') },
    { id: 'bottles', name: 'Pullovuori', r: { x: 192, y: 142, w: 38, h: 20 }, stand: 210, use: bottles },
    { id: 'trash', name: 'Roskapussi', r: { x: 262, y: 140, w: 20, h: 22 }, stand: 272, use: trash },
    { id: 'bag', name: 'Alepan kassi (pullot)', r: { x: 33, y: 150, w: 14, h: 16 }, stand: 40, use: bagAtDoor, show: (s) => s.bottleBag > 0 },
    { id: 'frontDoor', name: 'Ulko-ovi', r: { x: 4, y: 60, w: 30, h: 102 }, stand: 22, use: frontDoor },
    { id: 'bathDoor', name: 'Kylpyhuone', r: { x: 37, y: 62, w: 27, h: 80 }, stand: 50, use: () => TS.go('bathroom') },
    { id: 'bed', name: 'Sänky', r: { x: 64, y: 94, w: 70, h: 48 }, stand: 100, use: bedMenu },
    { id: 'window', name: 'Ikkuna', r: { x: 134, y: 34, w: 48, h: 54 }, stand: 158, use: lookWindow },
    { id: 'tv', name: 'Telkkari ja sohva', r: { x: 182, y: 96, w: 80, h: 44 }, stand: 230, use: tvMenu },
    { id: 'sink', name: 'Tiskivuori', r: { x: 262, y: 94, w: 30, h: 46 }, stand: 276, use: dishes },
    { id: 'fridge', name: 'Jääkaappi', r: { x: 293, y: 66, w: 24, h: 76 }, stand: 296, use: () => TS.go('fridge') },
  ];
  const hotAt = (x, y) => HOT.find((h) => (!h.show || h.show(S())) && TS.hit(h.r, x, y));

  // ---------------- Actions ----------------
  function getUp() {
    const s = S();
    s.inBed = false;
    man.x = 100;
    if (!s.firstUp) { s.firstUp = true; ui.say(T().getUp); }
  }

  // Poster and painting: a comment, or the empty spot after selling on Tori.fi
  function wallThing(id) {
    const X = T().tori;
    if (TS.toriState(S()).sold[id]) { ui.say(id === 'poster' ? X.gonePoster : X.gonePainting); return; }
    const line = id === 'poster' ? TS.pick(T().poster) : T().painting;
    ui.say(line + ' ' + X.wallHint);
  }

  function drawer() {
    const st = TS.toriState(S());
    if (st.found.phone) { ui.say(T().tori.drawerEmpty); return; }
    st.found.phone = true;
    TS.doAction({ min: 5, say: T().tori.drawer });
  }

  function bedMenu() {
    const s = S();
    const night = s.t >= 21 * 60;
    ui.choose(T().bed.ask, [
      !TS.toriState(s).found.abs && { label: 'Kurkista sängyn alle (5 min)', fn() {
        TS.toriState(s).found.abs = true;
        s.inBed = false;
        TS.doAction({ min: 5, say: T().tori.underBed });
      } },
      { label: 'Torkuta (1 h)', fn() {
        s.inBed = true; s.snoozes++;
        TS.doAction({ min: 60, mode: 'sleep', label: 'TORKKU', say: TS.pick(T().snooze) });
      } },
      !night && { label: 'Pitkät päikkärit (3 h)', fn() {
        s.inBed = true; s.snoozes += 2;
        TS.doAction({ min: 180, mode: 'sleep', label: 'PÄIKKÄRIT', say: T().nap });
      } },
      night
        ? { label: 'Mene nukkumaan (päivä päättyy)', fn: sleepNight }
        : { label: 'Nuku loppupäivä', fn: sleepAll },
      { label: 'Peruuta' },
    ]);
  }

  function sleepAll() {
    ui.choose(T().bed.allAsk, [
      { label: 'Kyllä. Peitto korviin.', fn() { S().sleptAllDay = true; S().inBed = true; TS.endDay('nukkui'); } },
      { label: 'Ei sittenkään.' },
    ]);
  }

  function sleepNight() {
    const s = S();
    if (s.apps < 4 && s.t < TS.DEADLINE) {
      ui.choose(T().bed.nightWarn.replace('{n}', s.apps), [
        { label: 'Nukkumaan.', fn() { s.inBed = true; TS.endDay('nukkumaan'); } },
        { label: 'Ei vielä.' },
      ]);
    } else { s.inBed = true; TS.endDay('nukkumaan'); }
  }

  function lookWindow() {
    const m = S().t % 1440;
    const W = T().window;
    let list = W.day;
    if (m < 8 * 60 + 30 || m >= 16 * 60 + 30) list = W.dark;
    else if (m >= 15 * 60) list = W.dusk;
    TS.doAction({ min: 5, say: TS.pick(list) });
  }

  function tvMenu() {
    const opts = [
      { label: 'Laita telkkari päälle', fn() { TS.go('tv'); } },
    ];
    opts.push({ label: 'Makoile sohvalla (30 min)', fn() {
      TS.doAction({ min: 30, label: 'MAKOILU', fx: { energy: 4, mood: 1 }, say: T().sofa });
    } });
    opts.push({ label: 'Peruuta' });
    ui.choose(T().tv.ask, opts);
  }

  function bottles() {
    const s = S();
    if (s.bottles <= 0) { ui.say(T().bottlesNone); return; }
    ui.choose(T().bottles.replace('{n}', s.bottles).replace('{e}', TS.euro(s.bottles * 0.15)), [
      { label: 'Kerää pullot Alepan kassiin (15 min)', fn() {
        const n = s.bottles;
        s.bottleBag += n;
        s.bottles = 0;
        TS.doAction({ min: 15, label: 'KILINÄÄ', fx: { mood: 2, energy: -2 }, say: T().bottlesCollect.replace('{n}', s.bottleBag) });
      } },
      { label: 'Anna olla' },
    ]);
  }

  function cleanRoom() {
    const s = S(), C = T().clean;
    if (s.cleaned) { ui.say(C.already); return; }
    ui.choose(C.ask, [
      { label: 'Siivoa asunto (1 h)', fn() {
        s.cleaned = true;
        s.bottles += 18; // the cans have a deposit too
        TS.doAction({ min: 60, label: 'SIIVOUS... HUH', fx: { mood: 12, energy: -10, hyg: -5 }, say: C.done.replace('{n}', 18) });
      } },
      { label: 'Ei tänään. Ei huomennakaan.' },
    ]);
  }

  function bagAtDoor() {
    ui.say(T().bagAtDoor.replace('{n}', S().bottleBag));
  }

  function dishes() {
    const s = S();
    if (s.dishesDone) { ui.say(T().dishes[1]); return; }
    ui.choose('Tiskivuori. Se on ollut siinä niin kauan, että sillä on oma ilmasto.', [
      { label: 'Tiskaa (30 min)', fn() { s.dishesDone = true; TS.doAction({ min: 30, label: 'TISKAUS', fx: { mood: 6, energy: -3 }, say: T().dishes[0] }); } },
      { label: 'Anna olla' },
    ]);
  }

  function trash() {
    const s = S();
    if (s.trashOut) { ui.say('Roskapussi on viety. Uusi alkaa jo täyttyä. Elämän kiertokulku.'); return; }
    ui.choose('Roskapussi. Se haisee. Tai sitten se olet sinä. Vaikea sanoa.', [
      { label: 'Vie roskat (10 min)', fn() { s.trashOut = true; TS.doAction({ min: 10, label: 'ROSKIKSELLE', fx: { mood: 3 }, say: T().trash }); } },
      { label: 'Anna olla' },
    ]);
  }

  function frontDoor() {
    const s = S();
    const D = T().door;
    const opts = [];
    if (s.mail && !s.mailRead) {
      opts.push({ label: 'Lue posti', fn() {
        s.mailRead = true;
        ui.say(D.mail);
        ui.say(D.flyer.replace('{e}', TS.euro(s.money)));
        ui.choose('Mitä teet kirjeelle?', [
          { label: 'Täytä selvitys (30 min)', fn() { s.kelaForm = true; TS.doAction({ min: 30, label: 'BYROKRATIAA', fx: { mood: -5, energy: -4 }, say: D.form }); } },
          { label: 'Laita kirje pinoon', fn() { ui.say(D.pile); } },
        ]);
      } });
    }
    opts.push({ label: 'Mene ulos (10 min)', fn: goOut });
    if (!s.trashOut) opts.push({ label: 'Vie roskat (10 min)', fn: () => { s.trashOut = true; TS.doAction({ min: 10, label: 'ROSKIKSELLE', fx: { mood: 3 }, say: T().trash }); } });
    opts.push({ label: 'Peruuta' });
    ui.choose(D.ask, opts);
  }

  function goOut() {
    const s = S();
    const say = [];
    if (!s.wentOut) { s.wentOut = true; say.push(T().door.firstOut); }
    if (s.bottleBag > 0) say.push(T().door.bottlesTaken.replace('{n}', s.bottleBag));
    TS.doAction({ min: 10, label: 'PORTAAT ALAS', fx: { energy: -2 }, say: say, after() { TS.go('street', { from: 'home' }); } });
  }

  function showNote() {
    const s = S();
    const x = (b) => (b ? '[X] ' : '[ ] ');
    const lines = [
      T().noteTitle,
      x(s.apps >= 4) + '4 työhakemusta ennen keskiyötä (' + s.apps + '/4) - KELA!',
      x(s.teState === 'ok') + 'Vastaa TE-palveluiden puheluun (n. klo 10.30)',
      x(s.showered) + 'Käy suihkussa',
      x(s.flags.ate) + 'Syö jotain',
      x(s.trashOut) + 'Vie roskat',
    ];
    ui.say(lines.join('\n'));
  }

  // ---------------- Scene ----------------
  TS.scenes.apartment = {
    hud: true,
    enter() {
      man.target = null;
      man.onArrive = null;
      S().outside = false;
      // Things bought outside go into the fridge.
      const bag = S().bag;
      Object.keys(bag).forEach((k) => { S().fridge[k] = (S().fridge[k] || 0) + bag[k]; });
      S().bag = {};
    },

    click(x, y) {
      if (y < 17) return;
      const s = S();
      const h = hotAt(x, y);
      if (h && h.id === 'bed' && s.inBed) { bedMenu(); return; }
      if (h && h.id === 'phone') { TS.openPhone(); return; }
      if (s.inBed) getUp();
      if (h) { man.target = TS.clamp(h.stand, 14, 306); man.onArrive = h.use; }
      else if (y > 138) { man.target = TS.clamp(x, 14, 306); man.onArrive = null; }
    },

    update(dt) {
      const s = S();
      if (man.target != null && !ui.busy()) {
        const d = man.target - man.x;
        const step = 42 * dt;
        if (Math.abs(d) <= step) {
          man.x = man.target;
          man.target = null;
          const cb = man.onArrive;
          man.onArrive = null;
          if (cb) cb();
        } else {
          man.x += Math.sign(d) * step;
          man.dir = Math.sign(d);
        }
      }
      TS.idleTick(dt);
      // Phone rings now and then while it's ringing
      if (s.phone) {
        ringTimer -= dt;
        if (ringTimer <= 0) { TS.sfx.ring(); ringTimer = 1.6; }
      }
      // Narrator comments if you do nothing for a while
      if (!ui.busy() && TS.realTime - TS.lastInput > 45) {
        TS.lastInput = TS.realTime;
        ui.say(TS.pick(T().idle));
      }
    },

    draw(g) {
      const s = S();
      drawRoom(g, s);
      drawBed(g, s);
      ui.drawTint(g);
      // the lamp glows a bit at night
      if (ui.isDark()) {
        g.globalAlpha = 0.12;
        TS.rect(g, 120, 17, 80, 120, '#f4e8a0');
        g.globalAlpha = 1;
      }
      // Keijo is drawn after the room light, so he stays solid and clear
      if (!s.inBed) {
        const walking = man.target != null && !ui.busy();
        TS.drawMan(g, man.x, FOOT_Y, man.dir, walking, false);
      }
      drawFliesAndStink(g, s);
      ui.drawHUD(g);
      drawPhoneRing(g, s);
      // name of the thing under the mouse
      if (!ui.busy()) {
        const h = hotAt(TS.mouse.x, TS.mouse.y);
        if (h) {
          const w = TS.textW(h.name) + 6;
          const lx = TS.clamp(TS.mouse.x - w / 2, 1, 319 - w);
          const ly = Math.max(19, TS.mouse.y - 12);
          TS.rect(g, lx, ly, w, 9, '#141320');
          TS.text(g, h.name, lx + 3, ly + 2, '#f0c850');
        }
      }
    },
  };

  // ---------------- Drawing ----------------
  function drawRoom(g, s) {
    const R = TS.rect;
    // wall with old wallpaper stripes
    R(g, 0, 17, 320, 122, C.wall);
    for (let x = 6; x < 320; x += 12) R(g, x, 17, 1, 122, C.stripe);
    R(g, 230, 30, 14, 9, C.stain); R(g, 233, 39, 6, 6, C.stain); // a damp patch
    R(g, 0, 136, 320, 4, C.base);
    // floor
    R(g, 0, 140, 320, 40, C.floor);
    [146, 155, 166].forEach((y) => R(g, 0, y, 320, 1, C.floorLine));
    for (let x = 0; x < 320; x += 24) R(g, x + ((x / 24) % 2) * 12, 140, 1, 40, C.floorLine);
    R(g, 120, 160, 12, 4, C.floorStain); R(g, 240, 170, 8, 3, C.floorStain);

    // ceiling lamp (bare bulb)
    R(g, 160, 17, 1, 12, '#222');
    R(g, 158, 29, 5, 5, ui.isDark() ? '#fff4b0' : '#d8d0a0');

    // front door + mail slot
    R(g, 6, 62, 26, 78, C.doorDark);
    R(g, 8, 64, 22, 76, C.door);
    R(g, 11, 68, 16, 30, C.doorDark); R(g, 12, 69, 14, 28, C.door);
    R(g, 11, 104, 16, 3, '#2a2018');
    R(g, 26, 112, 3, 3, C.knob);
    if (s.mail && !s.mailRead) {
      R(g, 10, 150, 10, 6, '#f0f0e8'); R(g, 10, 150, 10, 1, '#c0c0b8');
      R(g, 18, 153, 10, 5, '#d04a3a'); R(g, 20, 154, 6, 1, '#f0d060');
    }
    // the pile of old letters by the door
    R(g, 4, 165, 14, 6, '#e8e4d8'); R(g, 5, 163, 12, 2, '#d8d4c8'); R(g, 6, 161, 10, 2, '#f0ece0');

    // bathroom door
    R(g, 38, 64, 25, 76, C.bathDark);
    R(g, 40, 66, 21, 74, C.bathDoor);
    TS.text(g, 'WC', 46, 76, '#5a5a6a');
    R(g, 56, 104, 3, 2, C.knob);

    // calendar
    R(g, 113, 51, 14, 16, '#f0ece0'); R(g, 113, 51, 14, 4, '#c03a3a');
    for (let i = 0; i < 12; i++) R(g, 115 + (i % 4) * 3, 57 + Math.floor(i / 4) * 3, 1, 1, '#c03a3a');

    // faded 80s pop poster above the bed (or the lighter spot where it was)
    const sold = TS.toriState(s).sold;
    if (sold.poster) R(g, 70, 36, 30, 33, '#c2b28a');
    else drawPoster(g);

    // window
    drawWindow(g, s);

    // moose painting (crooked), or just the nail after it was sold
    if (sold.painting) { R(g, 196, 50, 25, 20, '#c2b28a'); R(g, 207, 48, 2, 2, '#555'); }
    else drawPainting(g);

    // desk drawer
    R(g, 144, 115, 28, 8, '#6a4a2e'); R(g, 156, 118, 4, 1.5, '#c9a640');


    // desk + laptop + phone
    R(g, 138, 112, 40, 3, C.desk);
    R(g, 140, 115, 2, 25, C.woodDark); R(g, 174, 115, 2, 25, C.woodDark);
    R(g, 146, 110, 20, 2, C.laptop);
    R(g, 148, 97, 16, 13, C.laptop);
    // forever installing: teal screen with a little grey box
    R(g, 149, 98, 14, 11, '#008080');
    R(g, 151, 101, 10, 5, '#c0c0c0'); R(g, 151, 101, 10, 1.2, '#000080');
    R(g, 168, 107, 6, 5, '#202024'); R(g, 169, 108, 4, 2, '#3a4a5a');
    // cable to the wall
    R(g, 174, 112, 1, 1, '#111'); R(g, 175, 113, 1, 23, '#111');

    // sofa
    R(g, 184, 100, 48, 20, C.sofaDark);
    R(g, 186, 102, 44, 16, C.sofa);
    R(g, 182, 112, 6, 22, C.sofaDark); R(g, 228, 112, 6, 22, C.sofaDark);
    R(g, 186, 118, 44, 10, C.sofa); R(g, 186, 127, 44, 2, C.sofaDark);
    R(g, 200, 120, 6, 4, C.stuffing); R(g, 201, 119, 3, 1, C.stuffing); // hole
    R(g, 186, 134, 3, 6, C.woodDark); R(g, 227, 134, 3, 6, C.woodDark);

    // old tube TV on a stand
    R(g, 238, 124, 22, 16, '#4a3a2a');
    R(g, 237, 101, 24, 23, C.tv);
    let screen = C.tvScreen;
    if (ui.anim && /TELKKARI|OSTOS/.test(ui.anim.label)) screen = Math.floor(TS.realTime * 8) % 2 ? '#5a7ab0' : '#7a9ad0';
    R(g, 240, 104, 18, 15, screen);
    R(g, 254, 120, 2, 2, '#c03a3a');
    R(g, 245, 97, 1, 4, '#888'); R(g, 252, 96, 1, 5, '#888'); // antenna

    // bottle mountain
    drawBottles(g, s);
    // the general mess on the floor
    drawMess(g, s);

    // kitchenette: counter, sink, dishes
    R(g, 262, 108, 30, 32, C.counter);
    R(g, 261, 106, 32, 3, C.counterTop);
    R(g, 266, 114, 10, 22, '#7a7062'); R(g, 278, 114, 10, 22, '#7a7062');
    R(g, 273, 124, 2, 2, '#444'); R(g, 279, 124, 2, 2, '#444');
    if (!s.dishesDone) {
      R(g, 264, 100, 12, 6, C.dish); R(g, 266, 96, 10, 4, '#d8d0c0'); R(g, 268, 92, 6, 4, C.dish);
      R(g, 278, 98, 9, 8, '#c8c0b0'); R(g, 270, 94, 2, 2, '#a08040'); R(g, 280, 100, 3, 2, '#a08040');
      R(g, 283, 90, 1, 10, '#aaa'); // a fork sticking out
    } else {
      R(g, 278, 101, 10, 5, C.dish);
    }
    R(g, 283, 102, 1, 4, C.steel); R(g, 283, 102, 4, 1, C.steel);

    // trash bag
    if (!s.trashOut) {
      R(g, 264, 146, 16, 14, '#1e1e22'); R(g, 266, 143, 12, 4, '#1e1e22'); R(g, 270, 140, 4, 3, '#1e1e22');
      R(g, 267, 148, 3, 6, '#3a3a40');
    }

    // fridge + note
    R(g, 293, 68, 24, 72, C.fridgeDark);
    R(g, 294, 69, 22, 70, C.fridge);
    R(g, 294, 92, 22, 1, C.fridgeDark);
    R(g, 296, 74, 2, 12, '#888'); R(g, 296, 98, 2, 16, '#888');
    R(g, 300, 81, 8, 8, C.note); R(g, 301, 83, 6, 1, '#888'); R(g, 301, 85, 5, 1, '#888'); R(g, 301, 87, 6, 1, '#888');
    R(g, 310, 72, 3, 3, '#c03a3a'); R(g, 304, 104, 4, 3, '#3a6ac0'); // magnets
  }

  function drawWindow(g, s) {
    const R = TS.rect;
    const m = s.t % 1440;
    let sky = '#10162a', bld = '#1a1c26', lit = true;
    if (m >= 8 * 60 + 30 && m < 9 * 60 + 30) { sky = '#3a4256'; bld = '#2e323c'; }
    else if (m >= 9 * 60 + 30 && m < 15 * 60) { sky = '#8a919a'; bld = '#5a5f68'; lit = false; }
    else if (m >= 15 * 60 && m < 16 * 60) { sky = '#4a4258'; bld = '#2e2a36'; }
    R(g, 136, 36, 44, 50, C.frame);
    R(g, 139, 39, 38, 44, sky);
    R(g, 139, 58, 38, 25, bld);
    for (let i = 0; i < 12; i++) {
      const wx = 141 + (i % 6) * 6, wy = 61 + Math.floor(i / 6) * 8;
      const on = lit ? (i * 7 + 3) % 5 < 2 : false;
      R(g, wx, wy, 3, 4, on ? '#f0d070' : '#3a3e48');
    }
    // sleet
    if (!lit || m < 16 * 60 + 30) {
      for (let i = 0; i < 10; i++) {
        const px = 139 + ((i * 13 + Math.floor(TS.realTime * 30) + i * i) % 38);
        const py = 39 + ((i * 17 + Math.floor(TS.realTime * 50)) % 44);
        R(g, px, py, 1, 2, '#c8d0d8');
      }
    }
    R(g, 157, 39, 2, 44, C.frame);
    R(g, 139, 60, 38, 2, C.frame);
    R(g, 134, 86, 48, 3, C.frame); // window sill
    R(g, 140, 82, 4, 4, '#6a4a2a'); R(g, 141, 78, 2, 4, '#5a6a3a'); // dead plant
  }

  function drawBed(g, s) {
    const R = TS.rect;
    R(g, 64, 96, 5, 44, C.woodDark); // headboard
    R(g, 66, 124, 68, 12, C.wood);
    R(g, 68, 136, 3, 4, C.woodDark); R(g, 130, 136, 3, 4, C.woodDark);
    R(g, 68, 116, 66, 9, C.mattress);
    R(g, 100, 120, 10, 4, C.mStain);
    R(g, 69, 108, 16, 9, C.pillow); R(g, 72, 112, 6, 3, '#c9b98a');
    if (s.inBed) {
      TS.drawLyingMan(g, 70, 92);
      R(g, 86, 101, 48, 19, C.blanket);
      R(g, 96, 97, 20, 5, C.blanket); // the belly makes a hill
      R(g, 86, 101, 10, 1, C.blanketDark); R(g, 116, 101, 18, 1, C.blanketDark);
      R(g, 96, 112, 30, 1, C.blanketDark);
      // Z z z
      const zt = (TS.realTime * 0.5) % 1;
      if (!ui.busy()) TS.text(g, 'Z', 84 + zt * 10, 92 - zt * 14, '#e8e0c8');
    } else {
      R(g, 96, 110, 36, 8, C.blanket); R(g, 104, 107, 18, 4, C.blanket);
      R(g, 100, 112, 20, 1, C.blanketDark);
    }
  }

  function drawBottles(g, s) {
    // rows of bottles, back row first; every fifth one has fallen over
    const n = Math.min(s.bottles, 40);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 8), col = i % 8;
      const bx = 194 + col * 5 + (row % 2) * 2;
      const by = 142 + row * 4;
      if (i % 5 === 4) { TS.rect(g, bx, by + 9, 8, 3, TS.PAL.t); TS.rect(g, bx + 8, by + 10, 2, 1, TS.PAL.t); }
      else TS.drawBottle(g, bx, by, 1);
    }
  }

  function drawPainting(g) {
    const R = TS.rect;
    R(g, 196, 50, 25, 20, '#c9a640'); R(g, 198, 52, 21, 16, '#4a6a3a');
    R(g, 203, 58, 9, 5, '#5a3a20'); R(g, 211, 56, 3, 4, '#5a3a20'); R(g, 205, 63, 1, 3, '#5a3a20'); R(g, 210, 63, 1, 3, '#5a3a20');
    R(g, 212, 54, 1, 2, '#e0d0a0'); R(g, 214, 54, 1, 2, '#e0d0a0');
    R(g, 220, 70, 2, 1, '#c9a640'); // crooked corner
  }

  function drawPoster(g) {
    const R = TS.rect;
    R(g, 70, 36, 30, 33, '#d8c8b0');            // faded paper
    R(g, 71, 37, 28, 22, '#c890a8');            // pink 80s background (sun-bleached)
    R(g, 76, 40, 3, 2, '#e0b0c0'); R(g, 89, 52, 3, 2, '#e0b0c0'); // neon sparkles
    // shoulders + top, big 80s permed hair, face
    TS.ell(g, 85, 59, 9, 5, '#e8c0a0');
    TS.rbox(g, 79.5, 55, 11, 5, 2, '#3a3a6a');
    TS.ell(g, 85, 46, 8, 8.5, '#a8783a');
    TS.ell(g, 80, 50, 3.5, 5, '#a8783a'); TS.ell(g, 90, 50, 3.5, 5, '#a8783a');
    TS.ell(g, 85, 47.5, 3.6, 4.4, '#e8c0a0');
    TS.ell(g, 83.6, 46.8, 0.5, 0.5, '#3a2a2a'); TS.ell(g, 86.4, 46.8, 0.5, 0.5, '#3a2a2a');
    TS.ell(g, 85, 49.8, 1.1, 0.5, '#c04050');
    TS.rect(g, 84, 51.5, 2, 2.5, '#e8c0a0');
    // title
    TS.text(g, 'SABRINA', 85, 61, '#c03a6a', { align: 'center' });
    // tape: three corners still hold, the fourth curls
    R(g, 69, 35, 3, 2, '#e8e0a0'); R(g, 98, 35, 3, 2, '#e8e0a0'); R(g, 69, 67, 3, 2, '#e8e0a0');
    R(g, 97, 67, 3, 2, '#b8a890');
  }

  // Empty cans, pizza box, socks... fixed places so the mess stays the same.
  const MESS = [
    [44, 160, 'can'], [58, 168, 'canLying'], [70, 150, 'can'], [112, 170, 'canLying'], [126, 158, 'can'],
    [142, 160, 'can'], [150, 166, 'canLying'], [160, 158, 'can'], [170, 168, 'can'], [178, 150, 'canLying'],
    [236, 166, 'can'], [250, 150, 'canLying'], [286, 166, 'can'], [300, 152, 'canLying'], [212, 172, 'can'],
    [88, 142, 'can'], [120, 143, 'canLying'], [232, 143, 'can'],
    [74, 156, 'pizza'], [100, 164, 'sock'], [244, 158, 'sock'], [190, 120, 'shirt'], [140, 108, 'can'],
    [262, 103, 'can'],
  ];
  function drawMess(g, s) {
    const R = TS.rect;
    if (s.bottleBag > 0) TS.drawAlepaBag(g, 40, 147, { bottles: true }); // the bag full of bottles by the door
    MESS.forEach(([x, y, k], i) => {
      if (s.cleaned && i % 6 !== 0) return; // cleaned: just a few stubborn things remain
      if (k === 'can') { R(g, x, y, 3, 5, '#c8ccd2'); R(g, x, y + 1, 3, 2, '#3c5aa8'); }
      else if (k === 'canLying') { R(g, x, y, 5, 3, '#c8ccd2'); R(g, x + 1, y, 2, 3, '#e8869a'); R(g, x + 2, y + 1, 1, 1, '#888'); }
      else if (k === 'pizza') { R(g, x, y, 18, 4, '#c8a070'); R(g, x + 2, y + 1, 14, 1, '#a07848'); R(g, x + 6, y - 1, 5, 1, '#d04a3a'); }
      else if (k === 'sock') { R(g, x, y, 6, 2, '#d9d2bd'); R(g, x + 4, y + 2, 2, 2, '#d9d2bd'); }
      else if (k === 'shirt') { R(g, x, y, 14, 5, '#5a7a5a'); R(g, x + 2, y + 5, 4, 2, '#5a7a5a'); }
    });
  }

  function drawFliesAndStink(g, s) {
    const hx = s.inBed ? 76 : man.x + 2;
    const hy = s.inBed ? 104 : FOOT_Y - 60;
    const n = s.hyg < 8 ? 5 : s.hyg < 15 ? 4 : s.hyg < 25 ? 3 : s.hyg < 40 ? 2 : s.hyg < 60 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const a = TS.realTime * (3 + i * 0.7) + i * 2.1;
      const fx = hx + Math.cos(a) * (9 + i * 2);
      const fy = hy + Math.sin(a * 1.3) * 6 - 2;
      TS.rect(g, fx, fy, 1, 1, '#111');
      if (Math.floor(TS.realTime * 20 + i) % 2) TS.rect(g, fx - 1, fy - 1, 1, 1, '#c8d0d8');
    }
    if (s.hyg < 25 && !s.inBed) {
      for (let k = 0; k < 3; k++) {
        for (let j = 0; j < 4; j++) {
          const rise = (TS.realTime * 10 + j * 5 + k * 7) % 22;
          const px = man.x + [-13, 13, 18][k] + Math.sin((rise + k) * 0.5) * 2; // beside him
          const py = FOOT_Y - 50 - rise; // rises from the shoulders, not over the body
          g.globalAlpha = 1 - rise / 22;
          TS.rect(g, px, py, 1, 2, '#8fbf5a');
          g.globalAlpha = 1;
        }
      }
    }
  }

  function drawPhoneRing(g, s) {
    if (!s.phone || ui.busy()) return;
    if (Math.floor(TS.realTime * 4) % 2) TS.text(g, 'RIIING!', 171, 92, '#d0544a', { align: 'center', shadow: '#000' });
  }
})();
