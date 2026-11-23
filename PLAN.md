# Työttömyys-simulaattori – what is in the game

## Basics
- One day: wake up at 07:00 Monday 23 November; the day ends when you go to bed after 21:00,
  choose "Nuku loppupäivä", or at 07:00 the next morning.
- Actions cost game minutes (a clock animation shows the time flying). While you do nothing,
  the clock also moves: 1 minute every 2 seconds.
- Stats (top bar): Energia, Nälkä, Hygienia, Mieliala, Humala, the bank account (TILI),
  Hakemukset x/4. The phone is an icon in the bottom-right corner of every scene (it shakes,
  glows and gets a red badge + "VASTAA!" when someone calls).
- Energy at 0 → you fall asleep on the floor for 2 h. Humala 7+ → you pass out for 3 h.

## Scenes
- **Yksiö (apartment)**: a mess of cans, a pizza box and socks; the bottle mountain; a faded 1987
  Sabrina poster; calendar; moose painting; window (November light, sleet); bed (snooze 1 h,
  nap 3 h, sleep the rest of the day / go to bed); laptop; phone; sofa + tube TV (1 h, or
  all day until 21: ostos-TV and news about unemployment going up); sink (do the dishes);
  trash bag; fridge with a task note; front door (read the post, go outside, take the trash out).
- **Jääkaappi (fridge)**: 4-day-old makaronilaatikko (sniff first, 35 % chance of a bad
  stomach), half an onion, mustard (3 squeezes), the mystery jar, a fish stick from 2019,
  3x Kaljaasi III beer. Things bought outside appear here too.
- **Kylpyhuone (bathroom)**: shower (+hygiene, +15 energy), toilet (+5 energy, cures a bad
  stomach), mirror monologues, toothbrush, razor, the mold artwork.
- **Telkkari** (`tv.js`): you see the actual TV screen. Click the screen or the button to change channel.
  - OSTOS-TV: a waving host sells a new bogus happiness product every 9 seconds (ONNI-PANTA,
    TYÖPAIKKA-MAGNEETTI, ITSETUNTO-SPRAY, VATSA-PRO 3000, MOTIVAATIOTYYNY, KAAMOS-AURINKO).
    TILAA orders it by phone if the account allows: money down, mood +12, delivery "6-8 viikossa".
  - UUTISET: a news anchor, a chart of the unemployment rate climbing to 10,9 %, and a news ticker.
  - LUONTO (a sleeping bear), and 21:00-22:30 UNELMADUUNI instead.
  - Watch 1 h, or the whole day until 21:00.
- **Puhelin (everything happens here)**: the phone icon (bottom-right corner) works everywhere. Työkkäri.fi job
  portal (12 absurd ads), a cover letter built from 3 phrase slots (45 min per application),
  rejection e-mails, some (Hehku), Tori.fi and the bank. With Humala 2+, the letter text gets
  scrambled. After midnight the portal is closed.
- **Läppäri (Win 95)**: only an endless 90s installation ("Aseta levyke 14/47"). "Odota (30 min)"
  moves it one disk forward and changes nothing else. "Sulje kansi" → "Kaikki hoituu puhelimella.
  Kaikki paitsi elämä."
- **Ulkona (street)**: home door, Ass-market (the corner shop, a parody of S-market, yellow brush-stroke sign, open 24/7) with a trash bin in front (dig out
  bottles, 3 times), Alko (09–21), Istuva Härkä (bar, 11–03), Puisto (always open).
- **Kauppa**: return bottles (0,15 € each), Kaljaasi III 0,99 €, lonkero 1,98 € (double the
  beer price), makkara, ruisleipä, nuudelit, scratch card.
- **Alko**: tetra wine, a small bottle of vodka.
- **Baari**: two taps on the counter: Karhu 5 € and Guinness 10 €, chat with the regulars, look around → a wallet with 85 €:
  return it (8,50 € finder's fee, mood up) or keep the money (mood down every hour).
- **Puisto**: drink what's in the shopping bag, sit on the bench, watch the duck.

## Phone home screen (`phonehome.js`)
The phone icon (bottom-right) answers a ringing call, otherwise opens the home screen: clock,
date, sunset wallpaper and app icons with names: Puhelin (contacts: TE, äiti, Tarmo, Kari,
Tarja), WazzupApp, Hehku, Työkkäri.fi, Sähköposti, Tori.fi, Pankki, Muistio (to-do list), Herätys.
Red badges for unread mail and Kari's messages. Apps open directly and "< ALOITUSNÄKYMÄ" /
"PUHELIN POIS" go back to the home screen.

## Phone screens
- **Calls** (`call.js`) look like a video call: Keijo's hand holds the phone, the caller's face
  talks (mouth moves while their text appears, blinks), a small self-view of Keijo's face, the
  call timer, and the conversation builds up as chat bubbles (them left, Keijo right, narration
  grey in the middle). The answers are in the box next to the phone. Faces: Lehtonen (glasses,
  headset, office), äiti (holds the phone far too close: perm, glasses, floral blouse), Tarmo (cap,
  red flannel, cans on the table), Tarja (lamp light, ponytail, the cat). After the last line you
  are back where you were.
- **Apps** (Työkkäri.fi, Tori.fi, mail, bank): the phone held sideways in both hands, thumbs on the edges.
- **Hehku** (some): one hand holds the phone over the belly.

## Bottles, cleaning, Klarna, comments
- **Bottles:** the pile at home stays home until you click it → "Kerää pullot Alepan kassiin
  (15 min)". The bag waits by the door and goes out with you. Only bottles in the bag can be
  returned at the store; bottles from the bin and drinks finished outside go straight into the bag.
- **Cleaning:** click the cans on the floor → "Siivoa asunto (1 h)": the mess disappears (a few
  stubborn things stay), +12 mood, and 18 deposit cans go to the bottle pile.
- **Klarna:** Ostos-TV orders can be paid "Klarnalla: 0 € nyt, maksa myöhemmin": no money needed,
  the debt grows, a cheerful Klarna e-mail arrives, and the end screen shows KLARNA-VELKA.
- **Hehku comments:** the speech bubble under a post opens its comments (all positive). Keijo
  can post one comment per post: bitter ones everywhere, except on Tarmo's post, where he
  can only write something nice. Each gets a reply and a thought from Keijo.

## Kari and WazzupApp (`wazzup.js`)
- Kari, 45, 128 kg, a friend from vocational school. He never answers the phone ("Soita Karille"
  → no answer, then a stupid WazzupApp message, sometimes with a video).
- From 07:00 he sends all-caps messages ("HERÄÄ TÖRÄTAMPERO", "WOMBOAMPINA HERÄTYYYS!") and AI
  "TikTok" videos (click to watch). Ignoring him makes him angrier step by step
  (HALOOOO → MIKS ET VASTAA??? → HERÄTYYYYYYYS NYT MENEE HERMOT → … → "HYVÄSTI." → "HERÄÄÄÄÄÄ").
  Reading without replying: "SINISET RASTIT EI VALEHTELE!!!!". Replying calms him down.
- The phone icon gets a green badge for unread messages. The desk phone is gone.

## Tori.fi payments
Some buyers want to pay with MobilePay. Cash is safe; MobilePay money lands on the account, but
Kela notices it within the hour and deducts it from the benefit (an e-mail, money taken back
down to 0 €, and "KELA VEI MOBILEPAYT" on the end screen).

## Look of the characters
People (Keijo, Tarmo, Tarja, the faces on video calls, the mirror) are drawn with smooth shapes
into a small canvas and scaled up with hard pixels (`TS.pixelDraw` in `pixel.js`), snapping
to a fixed character palette. Everything else (rooms, text, TV, phone) stays smooth.

## Music
A slow, melancholic 8-bit loop in A minor (`engine.js` → `TS.music`): triangle bass, a quiet
square-wave arpeggio, and a square-wave melody (Am–F–C–G–Am–Dm–E–Am, 66 bpm). Every second
round the melody gets sparser and lower. Starts with the first click; `M` mutes everything.

## Phone calls (interactive, `js/calls.js`)
Every call is a small dialogue tree: the caller says something, you pick what Keijo answers,
2–3 levels deep. Answers change mood, money and flags.
- **TE-palvelut** (rings at 10:30, or call back after a 2 h 40 min queue): lie ("kymmeniä!"),
  be honest (you get offered a 6-week course with a 340-person queue), or pretend to be an
  answering machine (= not reached).
- **Äiti** (rings at 18:00, call back if missed): "hyvin menee" (she can tell if you didn't shower),
  "huonosti" (borrow 20 € once / 30 min chat / "mä pärjään"), or lie about an interview.
- **Tarmo**, the friend: beer plans, the 5 € loan (once, 50 %), 40 min of back pain, job tips
  (Kerava warehouse, 04:00, age limit 25). After 3 calls he stops answering.
  - "Lähetäänkö kaljalle?" → "Ei mullakaan oo rahaa" → "Sovittu. Nähdään puistossa." sets a meeting:
    Tarmo sits on the park bench from +30 min to +4 h. In the park: share a drink from your bag,
    take a swig from his bottle, talk about how things really are, or about his "busy day".
    Come too late → his note on the bench ("Odotin 3 h. Missä sä olit? -T").
  - Offering to pay at the bar → he never comes (as always).
- **Tarja (huono idea)**: always in the menu, but greyed out ("liian selvä") until Humala 2+.
  One call, then she blocks you. Several branches lead to an invitation. With less than 10 €:
  "Mä keksin jotain!" → she stays up for 3 hours and you can call back once, even sober
  ("hän odottaa!"), after getting the money (e.g. from Tori.fi).
  - **Taksi Tarjalle (10 €)** → Tarja's apartment (`tarja.js`, the cat on the windowsill):
    a conversation at the door, a hot shower if you need one, then either an honest
    "mä oon ollu tosi yksin" → candle, a night on her sofa (+30 mood, ending YKSI HYVÄ HETKI),
    or "onks sulla kaljaa?" / a wrong joke → she pays a taxi to get you home.

## Some: the Hehku feed (`some.js`)
Opened from the laptop/phone "SOME (HEHKU)" button or the phone menu "Selaa somea". Keijo's hand
holds the cracked phone over his belly; scroll with the mouse wheel, by dragging, or YLÖS/ALAS.
9 posts of other people's fabulous lives (texts in `texts.js` → `feed`): Mikko's sailboat,
Sanna's marathon, the ex-boss's record quarter, Raimon poika's doctorate, Petra working from Bali,
Tarmo's blurry pigeon (2 likes), Kimmo's lake house, Tiina's 72-hour sourdough, a Kela ad.
Each new post: 4 minutes and -2 mood (Tarmo +3, Kela -3), and Keijo's bitter thought
in a bubble. The heart likes a post (-1 mood; liking Tarmo's gives +4).

## Tori.fi (`tori.js`, in the laptop and phone)
- Things to sell: the Sabrina poster and the moose painting (on the wall from the start), the
  ab machine (bed → "Kurkista sängyn alle"), an old brick phone with the snake game (desk drawer).
- "MYY" takes 15 min. A buyer writes 20–70 min later with a lowball offer: accept, ask full
  price (50 %: yes, or the buyer disappears and the ad stays up), or ignore.
- Selling the poster or the painting leaves a lighter spot on the wall (and costs mood).

## Timed events
09:00 neighbour's renovation · 10:30 TE-palvelut calls (30 min to answer; you can also call
back and queue for 2 h 40 min) · 13:00 the neighbour knocks about the smell · 15:00 post:
Kela letter (form TT-2b) + pizza flyer · random afternoon router failure · 18:00 mum calls
(say it goes badly → +20 €) · 21:00 UNELMADUUNI on TV · 23:00 warning · 00:00 deadline.

## Endings
A Kela decision (paid / clarification needed / waiting period / denied) plus a title:
IHME (hidden interview invite in spam), YKSI HYVÄ HETKI (the night at Tarja's), TORKKUJEN KUNINGAS, LÖYTÄJÄ PITÄÄ, KALJAASI-FILOSOFI,
BYROKRATIAN SANKARI, MELKEIN, PUHDAS MUTTA KÖYHÄ, KARENSSI, PÄIVÄ MENI.

## Ideas for later
More random events, more sounds (a sad 8-bit melody), more job ads, GitHub Pages release.
