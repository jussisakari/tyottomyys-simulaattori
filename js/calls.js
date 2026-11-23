// calls.js – phone conversations as small dialogue trees. Each node is what
// the other person says, and its options are what Keijo can answer.
//
// Node:   { text, options: [...] }              - a line + answers
//         { end: text, fx, min, mode, after(S) } - last line (min = minutes it takes,
//                                                  mode 'sleep', after = what happens next)
// Option: { label, next: 'node' or (S) => 'node', fx: {...}, run(S), if(S) }
// Tree:   { who, nodes, onEnd(S) } - onEnd runs when the conversation is over.
// TS.talk(tree, 'start', { after() {...} }) - after runs too (e.g. to show a menu again).
// In texts: {n} = applications sent, {t} = clock, {e} = money on the account.
window.TS = window.TS || {};

(function () {
  const TS = window.TS;
  const ui = TS.ui;

  function fill(str) {
    const S = TS.S;
    return String(str).replace(/\{n\}/g, S.apps).replace(/\{t\}/g, TS.clockStr(S.t)).replace(/\{e\}/g, TS.euro(S.money));
  }

  function finish(tree, ctx, S) {
    if (tree.face && TS.callEnd) TS.callEnd(); // hang up: back to where you were
    if (tree.onEnd) tree.onEnd(S);
    if (ctx && ctx.after) ctx.after();
  }

  // Shows one node of a conversation.
  TS.talk = function (tree, id, ctx) {
    const S = TS.S;
    const node = tree.nodes[id];
    // Phone calls (trees with a face) are shown on the call screen with chat bubbles.
    if (tree.face && TS.callBegin) TS.callBegin(tree);
    if (node.run) node.run(S);
    if (node.end !== undefined) {
      TS.doAction({
        min: node.min != null ? node.min : 5, mode: node.mode, label: node.label,
        fx: node.fx, say: node.end ? fill(node.end) : null,
        who: node.who === undefined ? tree.who : node.who,
        after() {
          if (node.after) { // the node decides what comes next (e.g. the taxi)
            if (tree.face && TS.callEnd) TS.callEnd(true);
            node.after(S);
            return;
          }
          finish(tree, ctx, S);
        },
      });
      return;
    }
    if (node.fx) TS.fx(node.fx);
    const opts = node.options
      .filter((o) => !o.if || o.if(S))
      .map((o) => ({
        label: fill(o.label),
        fn() {
          // the chat history: what they said, then what Keijo answered
          if (tree.face && TS.callLog) {
            TS.callLog(node.who === null ? 'narrator' : 'them', fill(node.text));
            TS.callLog('me', fill(o.label));
          }
          if (o.fx) TS.fx(o.fx);
          if (o.run) o.run(S);
          const next = typeof o.next === 'function' ? o.next(S) : o.next;
          if (next) TS.talk(tree, next, ctx);
          else finish(tree, ctx, S);
        },
      }));
    ui.choose(fill(node.text), opts, { who: node.who === undefined ? tree.who : node.who });
  };

  const ok = (S) => { S.teState = 'ok'; S.fired.te = true; };

  TS.CALLS = {
    // ---------------- TE-palvelut ----------------
    te: {
      who: 'TE-PALVELUT', face: 'te', name: 'TE-palvelut (Lehtonen)',
      nodes: {
        start: {
          text: '"Huomenta, täällä TE-palveluista, virkailija Lehtonen. Soitan työnhaun tilanteesta. Miten se edistyy?"',
          options: [
            { label: '"Tosi hyvin! Olen lähettänyt kymmeniä!"', next: 'lie' },
            { label: '"Rehellisesti sanottuna huonosti."', next: 'honest' },
            { label: '"Kuka? Täällä ei ole mitään Keijoa."', next: 'who' },
          ],
        },
        who: {
          text: '"Numero on rekisterissä sinun nimelläsi. Ja kuulen taustalla saman jääkaapin huminan kuin viime kerralla."',
          options: [
            { label: '"...Okei. Täällä Keijo."', next: 'again' },
            { label: '"Piip. Jätä viesti äänimerkin jälkeen."', next: 'machine' },
          ],
        },
        machine: { end: '"...Hyvä on. Kirjaan: asiakasta ei tavoitettu." Klik. Voitit. Tai hävisit. Vaikea sanoa.', run(S) { S.teState = 'missed'; }, fx: { mood: -2 } },
        again: {
          text: '"No niin. Miten työnhaku edistyy?"',
          options: [
            { label: '"Tosi hyvin!"', next: 'lie' },
            { label: '"Huonosti."', next: 'honest' },
          ],
        },
        lie: {
          text: '"Hienoa! Järjestelmän mukaan olet lähettänyt tänään {n}. Kymmeniä?"',
          options: [
            { label: '"Ne on... luonnoksina."', next: 'drafts' },
            { label: '"Järjestelmä on väärässä."', next: 'system' },
          ],
        },
        drafts: {
          text: '"Luonnoksia ei lasketa. Tarvitaan neljä lähetettyä hakemusta. Tänään."',
          options: [
            { label: '"Selvä. Teen ne heti."', next: 'endGood' },
            { label: '"Entä jos en ehdi?"', next: 'endKela' },
          ],
        },
        system: { end: '"Järjestelmä ei ole koskaan väärässä. Paitsi kun se on. Silloinkin se on oikeassa. Muistathan neljä hakemusta. Hei hei."', run: ok, fx: { mood: -2 } },
        endGood: { end: '"Hyvä. Kirjaan: asiakas on motivoitunut. Hei hei." Olet motivoitunut. Se lukee nyt järjestelmässä.', run: ok, fx: { mood: 2 } },
        endKela: { end: '"Sitten Kela ei maksa. Ei se ole henkilökohtaista. Mikään ei ole henkilökohtaista. Hei hei."', run: ok, fx: { mood: -4 } },
        honest: {
          text: '"Kiitos rehellisyydestä. Haluaisitko osallistua kurssille \'Löydä sisäinen työnhakijasi\'? Kesto kuusi viikkoa."',
          options: [
            { label: '"Joo, ilmoita mut."', next: 'course' },
            { label: '"Onko siellä kahvia?"', next: 'coffee' },
            { label: '"Ei kiitos."', next: 'noCourse' },
          ],
        },
        course: { end: '"Kurssi on täynnä. Laitan sinut jonoon. Jonossa on 340 henkeä. Muistathan neljä hakemusta."', run: ok, fx: { mood: -2 } },
        coffee: {
          text: '"On. Se on maksullista. 2,50 €."',
          options: [
            { label: '"Sitten ei kiitos."', next: 'noCourse' },
            { label: '"Onko pullaa?"', next: 'bun' },
          ],
        },
        bun: { end: '"...Kirjaan: asiakas on kiinnostunut koulutuksesta." Sinä olet nyt virallisesti kiinnostunut pullasta.', run: ok, fx: { mood: 3 } },
        noCourse: { end: '"Kirjaan: asiakas harkitsee. Muistathan neljä hakemusta. Hei hei."', run: ok },
      },
    },

    // ---------------- Äiti ----------------
    mum: {
      who: 'ÄITI', face: 'mum', name: 'Äiti',
      nodes: {
        start: {
          text: '"No mites se työnhaku? Isäs sanoo, että kaupan kassalle voi aina mennä. Ja Raimon poika on kuulemma insinööri."',
          options: [
            { label: '"Hyvin menee, äiti."', next: 'fine' },
            { label: '"Huonosti, äiti."', next: 'bad' },
            { label: '"Äiti, mun pitää mennä. Mulla on haastattelu."', next: 'interview' },
          ],
        },
        fine: {
          text: '"No hyvä! Syöthän kunnolla? Ja käythän suihkussa?"',
          options: [
            { label: '"Joo, joka päivä."', next: (S) => (S.showered ? 'fineTrue' : 'fineLie') },
            { label: '"Suihkussa... käyn kohta."', next: 'fineSoon' },
          ],
        },
        fineTrue: { end: '"Kuulostat ihan omalta itseltäs." Hän on oikeassa. Tänään se on kohteliaisuus.', fx: { mood: 4 } },
        fineLie: { end: '"Keijo. Mä kuulen sen äänestä." Miten? Miten äidit tekevät sen?', fx: { mood: -3 } },
        fineSoon: { end: '"No käy nyt. Ja syö jotain lämmintä." Lämmintä. Sinulla on sinappia.', fx: { mood: 1 } },
        bad: {
          text: '"Voi kulta. Mitä mä voisin tehdä?"',
          options: [
            { label: '"Voisitko lainata vähän rahaa?"', if: (S) => !S.mumMoney, next: 'money' },
            { label: '"Puhutaan vaan hetki." (30 min)', next: 'chat' },
            { label: '"Ei mitään. Mä pärjään."', next: 'cope' },
          ],
        },
        money: {
          text: '"Lähetän sulle 20 euroa. Älä kerro isälle. Mihin sä sen käytät?"',
          run(S) { S.mumMoney = true; TS.fx({ money: 20 }); TS.sfx.coin(); },
          options: [
            { label: '"Ruokaan, äiti."', next: 'moneyFood' },
            { label: '"Lonkeroon."', next: 'moneyBooze' },
          ],
        },
        moneyFood: { end: '"Hyvä poika." Tilillä on nyt {e}. Hyvä poika katsoo kohti Alkoa.', fx: { mood: 6 } },
        moneyBooze: { end: '"...Mä en kuullut tota." Rahat ovat silti tilillä. Äidin rakkaus on ehdoton. Isän ei.', fx: { mood: 3 } },
        chat: { end: 'Äiti puhuu naapurin koirasta, tädin lonkasta ja hintojen noususta. Se on lohdullista. Maailmassa on muitakin ongelmia.', min: 30, fx: { mood: 8 } },
        cope: { end: '"Sä olet aina sanonu noin. Myös silloin kun sä jäit jumiin liukumäkeen vuonna 1987."', fx: { mood: -2 } },
        interview: {
          text: '"Ihanko totta?! Missä? Millainen firma? Mitä sä laitat päälle?"',
          options: [
            { label: '"Iso firma. Johtotehtävä."', next: 'bigLie' },
            { label: '"Kerron myöhemmin."', next: 'later' },
            { label: '"...Ei mulla oikeesti oo. Anteeks."', next: 'bad' },
          ],
        },
        bigLie: { end: '"Mä soitan heti Raimolle!" Klik. Valhe kasvaa. Huomenna koko suku tietää. Ensi viikolla Raimon poikakin.', fx: { mood: -6 } },
        later: { end: '"Lupaa että soitat heti kun tiedät!" Lupaat. Lupauksia on helppo antaa. Niitä on tilillä enemmän kuin rahaa.', fx: { mood: -3 } },
      },
    },

    // ---------------- Tarmo, the friend ----------------
    tarmo: {
      who: 'TARMO', face: 'tarmo', name: 'Tarmo',
      nodes: {
        start: {
          text: '"No terve! Mitäs äijä? Mä olin just kolme tuntia työkkärin jonossa. Ei mitään. Eli ihan hyvä päivä."',
          options: [
            { label: '"Lähetäänkö kaljalle?"', next: 'beer' },
            { label: '"Lainaisitko kympin?"', if: (S) => !S.flags.tarmoLoan, next: 'loan' },
            { label: '"Miten sulla menee?"', next: 'how' },
            { label: '"Onko sulla vinkkejä työpaikoista?"', next: 'tips' },
            { label: '"Ei mitään. Soitin vaan." (lopeta)', next: 'bye' },
          ],
        },
        beer: {
          text: '"Kaljalle? Mulla on 3,20 ja bussikortti. Sä tarjoot?"',
          options: [
            { label: '"Joo, mä tarjoon."', next: 'beerYes' },
            { label: '"Ei mullakaan oo rahaa."', next: 'beerNo' },
          ],
        },
        beerYes: { end: '"Sovittu! Härässä tunnin päästä!" Tarmo lupaa tulla baariin. Hän ei tule. Hän ei ole koskaan tullut baariin, kun sinä maksat. Mutta lupaus lämmittää.', fx: { mood: 3 } },
        beerNo: {
          text: '"No sit juodaan puistossa! Niinku oikeet miehet. Mä oon siellä puolen tunnin päästä. Penkillä."',
          options: [
            { label: '"Sovittu. Nähdään puistossa."', next: 'parkYes' },
            { label: '"Ehkä joku toinen päivä."', next: 'parkNo' },
          ],
        },
        parkYes: {
          end: '"Hyvä! Tuo jotain juotavaa, jos löydät." Sinulla on tapaaminen. Ensimmäinen kalenterimerkintä kuukausiin, joka ei ole Kela.',
          fx: { mood: 5 },
          run(S) { S.flags.tarmoPark = { from: S.t + 30, until: S.t + 240 }; S.flags.tarmoMet = false; },
          min: 2,
        },
        parkNo: { end: '"Joo joo. Sä sanot aina noin." Hän on oikeassa. Sinä sanot aina noin.', fx: { mood: -1 } },
        loan: {
          text: '"Kympin? Mä lainasin sulta viime kuussa vitosen. Muistatko?"',
          run(S) { S.flags.tarmoLoan = true; },
          options: [
            { label: '"Muistan. Maksa se takasin."', next: () => (TS.chance(0.5) ? 'loanYes' : 'loanNo') },
            { label: '"Unohda koko juttu."', next: 'loanForget' },
          ],
        },
        loanYes: { end: '"No ok. Siirrän nyt. Ollaan tasoissa." Tilille tulee 5 €. Ystävyys on kallisarvoista. Tarkalleen 5 €.', run() { TS.fx({ money: 5, mood: 4 }); TS.sfx.coin(); } },
        loanNo: { end: '"Ai SE vitonen? Se oli lahja!" Tarmo nauraa niin kovaa, että puhelu katkeaa. Hän ei soita takaisin.', fx: { mood: -3 } },
        loanForget: { end: '"Hyvä. Mäkin unohdin." Hän unohti sen jo ennen kuin soitit.' },
        how: {
          text: '"No selkä on taas ihan jumissa. Haluutko kuulla?"',
          options: [
            { label: '"Kerro vaan." (40 min)', next: 'back' },
            { label: '"Ei oikeestaan."', next: 'backAnyway' },
          ],
        },
        back: { end: 'Tarmo kertoo 40 minuuttia selkävaivoistaan. Sinä kuuntelet. Se on päivän ainoa työsuoritus.', min: 40, fx: { mood: 6 } },
        backAnyway: { end: '"No mä kerron silti." Hän kertoo silti. 40 minuuttia. Alaselästä lähtien.', min: 40, fx: { mood: 3 } },
        tips: {
          text: '"Joo! Mun serkku sano, että Keravalle varastolle haetaan. Vuoro alkaa neljältä."',
          options: [
            { label: '"Neljältä aamulla?"', next: 'tips4' },
            { label: '"Kiitti, katon sen."', next: 'tipsOk' },
          ],
        },
        tips4: { end: '"No ei kai iltapäivällä. Ja ikäraja on 25." Tarmo on yhtä hyödyllinen kuin TE-palvelut, mutta ystävällisempi.', fx: { mood: 2 } },
        tipsOk: { end: 'Et katso sitä. Molemmat tiedätte sen. Se on miesten välinen sopimus.', fx: { mood: 1 } },
        bye: { end: '"Okei. Kiva kun soitit." Hän tarkoittaa sitä. Se on yllättävän hyvä tunne.', fx: { mood: 4 }, min: 2 },
      },
    },

    // ---------------- Tarja (only when drunk) ----------------
    tarja: {
      who: 'TARJA? PUBISTA..', face: 'tarja', name: 'Tarja? pubista..', // Keijo doesn't quite remember who she is
      nodes: {
        start: {
          who: null,
          text: 'Humalan rohkeudella selaat yhteystietoihin: "Tarja? pubista..". Kuka Tarja? Mistä pubista? Soitat silti. Tuut... tuut... "Keijo?! Kello on {t}. Ootko sä kännissä?"',
          options: [
            { label: '"En oo! ...Vähän."', next: 'little' },
            { label: '"...Mistä me taas tunnettiin?"', next: 'summer' },
            { label: 'Sulje puhelin paniikissa', next: 'panic' },
          ],
        },
        little: {
          text: '"Sä soitit mulle viimeksi jouluna. Ja silloinkin sä olit vähän." Hän muistaa sinut. Sinä et häntä. Tämä on epätasapainoa.',
          options: [
            { label: '"Mä oon miettiny sua."', next: 'thinking' },
            { label: '"Tuutko käymään?"', next: 'visit' },
          ],
        },
        thinking: {
          text: '"Sä oot miettiny kaljaa. Mä oon vaan siinä vieressä."',
          options: [
            { label: '"Se ei oo totta!"', next: 'goodnight' },
            { label: '"...No, ehkä vähän totta."', next: 'laugh' },
          ],
        },
        goodnight: { end: '"Hyvää yötä, Keijo." Klik. Hän sanoi hyvää yötä kello {t}.', fx: { mood: -6 } },
        laugh: {
          text: 'Tarja nauraa. Ensimmäistä kertaa vuosiin joku nauraa sinun kanssasi eikä sinulle. "Voi Keijo. Mitä sä teet nyt?"',
          options: [
            { label: '"En mitään. Kuten aina."', next: 'invite' },
            { label: '"Mun pitää mennä."', next: 'goodnight2' },
          ],
        },
        goodnight2: { end: '"Soita joskus selvinpäin." Klik. Se oli melkein lämmin.', fx: { mood: 6 } },
        visit: {
          text: '"Sinne sun yksiöön? Sä kerroit siitä pubissa. Ei todellakaan." Pitkä hiljaisuus. "...Mut sä voisit tulla tänne."',
          options: [
            { label: '"Oikeesti?"', next: 'invite' },
            { label: '"Ei, ei. Unohda koko juttu."', next: 'shy' },
          ],
        },
        summer: {
          text: '"Et sä muista?! Härässä, pikkujouluna. Sä lauloit karaokea "Boys Boys Boys" ja oksensit mun kenkiin. Sit sä tallensit mun numeron."',
          options: [
            { label: '"Se oli romanttista."', next: 'roses' },
            { label: '"Mä oon muuttunu."', next: 'changed' },
          ],
        },
        roses: { end: '"Ei ollu." Klik. Kengät eivät myöskään toipuneet.', fx: { mood: -4 } },
        changed: {
          text: '"Ootko?"',
          options: [
            { label: '"Joo!"', next: 'changedYes' },
            { label: '"En."', next: 'changedNo' },
          ],
        },
        changedYes: { end: '"Sä soitat mulle kännissä maanantaina kello {t}." Klik. Hyvä pointti.', fx: { mood: -5 } },
        changedNo: {
          text: '"Rehellisyys sopii sulle." Tauko. "...Haluutko tulla käymään?"',
          options: [
            { label: '"Haluun."', next: 'invite' },
            { label: '"En mä kehtaa."', next: 'shy' },
          ],
        },
        shy: { end: '"No ei sitten." Klik. Se oli melkein kutsu. Melkein.', fx: { mood: -2 } },
        invite: {
          text: '"Mä asun toisella puolella kaupunkia. Taksi on noin kymppi. Ja Keijo... käy ensin suihkussa."',
          options: [
            { label: 'Tilaa taksi (10,00 €)', if: (S) => TS.canPay(10), next: 'taxi' },
            { label: '"Mulla ei oo rahaa taksiin."', next: 'noTaxi' },
            { label: '"Ehkä joku toinen kerta."', next: 'shy' },
          ],
        },
        taxi: {
          who: null,
          end: 'Tilaat taksin. Kuski haistaa sinut ja avaa kaikki ikkunat. Mittari raksuttaa. Sinäkin raksutat vähän.',
          min: 30, label: 'TAKSI TARJALLE', fx: { money: -10, mood: 5 },
          after() { TS.go('tarja'); },
        },
        noTaxi: {
          text: '"Tietysti ei oo." Huokaus. "No, mä valvon vielä pari tuntia. Jos sä keksit jotain."',
          options: [
            { label: '"Mä keksin jotain! Älä nuku!"', next: 'noTaxiLater' },
            { label: '"Ei mitään. Hyvää yötä."', next: 'noTaxiBye' },
          ],
        },
        // The invitation stays open for 3 hours: get 10 € (e.g. sell stuff on Tori.fi) and call again.
        noTaxiLater: {
          end: 'Klik. Sinulla on kolme tuntia aikaa löytää kymppi. Ehkä kotoa löytyisi jotain, minkä voisi myydä Tori.fi:ssä.',
          fx: { mood: 3 }, min: 1,
          run(S) { S.flags.tarjaWaits = S.t + 180; },
        },
        noTaxiBye: { end: 'Klik. Kävellen matka on 11 kilometriä. Et kävele.', fx: { mood: -6 } },
        // Calling back with money while she still waits
        again: {
          text: '"No? Keksitkö?"',
          options: [
            { label: 'Tilaa taksi (10,00 €)', if: (S) => TS.canPay(10), next: 'taxi' },
            { label: '"En vielä..."', next: 'noTaxiBye' },
          ],
        },
        panic: { who: null, end: 'Suljet puhelimen. Hän näkee silti vastaamattoman puhelun. Huomenna se tuntuu pahemmalta.', fx: { mood: -3 }, min: 1 },
      },
    },

    // ---------------- At Tarja's place ----------------
    tarjaVisit: {
      who: 'TARJA',
      nodes: {
        start: {
          text: 'Tarja avaa oven. Hän katsoo sinua, farkkuja, collegepaitaa ja kärpästä, joka tuli mukana taksissa. "Sä tulit ihan oikeesti."',
          options: [
            { label: '"Sä näytät hyvältä."', next: 'compliment' },
            { label: '"Mä toin kukkia."', next: 'flowers' },
            { label: '"Saanko tulla sisään?"', next: 'inside' },
          ],
        },
        compliment: {
          text: '"Ja sä näytät... sulta." Hän melkein hymyilee. "Tuu sisään. Varo kissaa."',
          options: [{ label: 'Mene sisään', next: 'inside' }],
        },
        flowers: {
          text: '"Sulla on kädessä tyhjä lonkerotölkki."',
          options: [{ label: '"Se on maljakko. Kukat tulee myöhemmin."', next: 'vase' }],
        },
        vase: {
          text: '"...Voi luoja, Keijo." Hän nauraa ja avaa oven kokonaan. "Tuu nyt sisään."',
          options: [{ label: 'Mene sisään', next: 'inside' }],
        },
        inside: {
          text: 'Istut sohvalle. Kissa tuijottaa sinua kuin TE-virkailija. "No? Mitä sä oikeesti halusit, Keijo?"',
          options: [
            { label: '"Käydä suihkussa. Ihan oikeesti."', if: (S) => S.hyg < 50, next: 'shower' },
            { label: '"Seuraa. Mä oon ollu tosi yksin."', next: 'honest' },
            { label: '"Onks sulla kaljaa?"', next: 'beer' },
          ],
        },
        shower: {
          who: null,
          end: 'Tarjan suihkussa on kuumaa vettä. LOPUTTOMASTI. Seisot siinä 25 minuuttia ja itket vähän. Kukaan ei laske.',
          min: 25, label: 'KUUMA SUIHKU', fx: { hyg: 70, energy: 10, mood: 10 },
          run(S) { S.showered = true; },
          after() { TS.talk(TS.CALLS.tarjaVisit, 'inside2', TS.tarjaCtx); },
        },
        inside2: {
          text: '"No niin. Nyt sä haiset melkein ihmiseltä." Hän istuu viereen. "Mitä sä halusit?"',
          options: [
            { label: '"Seuraa. Mä oon ollu tosi yksin."', next: 'honest' },
            { label: '"Onks sulla kaljaa?"', next: 'beer' },
          ],
        },
        honest: {
          text: 'Tarja on hetken hiljaa. "Niin mäkin." Hän sammuttaa kattovalon ja sytyttää kynttilän. Kissa poistuu huoneesta hienotunteisesti.',
          run(S) { S.flags.candle = true; },
          options: [
            { label: 'Ole hiljaa ja anna hetken olla', next: 'night' },
            { label: '"Onks toi kynttilä huoltoasemalta?"', next: 'ruin' },
          ],
        },
        night: {
          who: null,
          end: 'Myöhemmin heräät Tarjan sohvalta. Joku on peitellyt sinut. Kissa nukkuu vatsasi päällä kuin se olisi aina kuulunut siihen. Elämä on hetken melkein hyvä.',
          min: 180, mode: 'sleep', label: '...', fx: { mood: 30 },
          run(S) { S.flags.tarjaNight = true; },
          after() { TS.talk(TS.CALLS.tarjaVisit, 'morning', TS.tarjaCtx); },
        },
        morning: {
          end: '"Sun pitää lähteä, mä meen huomenna töihin. Mä tilasin sulle taksin ja maksoin sen." Hän seisoo ovella. "Soita. Selvinpäin."',
          min: 30, label: 'TAKSI KOTIIN', fx: { mood: 5 },
        },
        ruin: {
          end: '"Se on mummon hautajaisista, Keijo." Valot syttyvät. Taksi tilataan. Tarja maksaa sen, jotta lähdet nopeammin.',
          min: 30, label: 'TAKSI KOTIIN', fx: { mood: -10 },
        },
        beer: {
          end: '"Tietysti sä kysyt." Hän antaa oluen ja katsoo sinua pitkään. Juot sen. Hän tilaa sinulle taksin kotiin ja maksaa sen. Nöyryyttävää, mutta ilmaista.',
          min: 40, label: 'TAKSI KOTIIN', fx: { drunk: 1, mood: 2 },
          run(S) { S.drinks++; },
        },
      },
    },

    // ---------------- Tarmo in the park (after agreeing on the phone) ----------------
    tarmoPark: {
      who: 'TARMO',
      nodes: {
        start: {
          text: '"No kato, se tuli! Istu alas. Penkki on märkä, mutta niin on kaikki muukin."',
          options: [
            { label: '"Mä toin juotavaa." (anna Tarmolle yksi)', if: (S) => ['beer', 'lonkero', 'viini', 'viina'].some((k) => S.bag[k] > 0), next: 'share' },
            { label: '"Mitä sulla on tossa pussissa?"', next: 'bag' },
            { label: '"Miten sulla menee? Oikeesti?"', next: 'real' },
            { label: '"Mitä sä oot tehny tänään?"', next: 'day' },
          ],
        },
        share: {
          text: 'Annat Tarmolle juoman. Hän katsoo sitä kuin kultamitalia. "Kippis, äijä! Tää on parempi ku mikään työpaikka. Paitsi ehkä palkka."',
          run(S) {
            const k = ['beer', 'lonkero', 'viini', 'viina'].find((d) => S.bag[d] > 0);
            S.bag[k]--;
            S.flags.tarmoShared = true;
          },
          fx: { mood: 8 },
          options: [
            { label: '"Kippis."', next: 'cheers' },
            { label: '"Onks sulla vinkkejä töistä?"', next: 'tip' },
          ],
        },
        cheers: { end: 'Juotte. Varis istuu penkin selkänojalle. Kukaan ei sano mitään. Se on päivän paras hetki.', min: 30, fx: { mood: 10 } },
        tip: {
          end: '"Mun serkun kaveri sano, että tehtaalle haetaan. Liukuhihnaa. Mut ikäraja on 25." Tarmo miettii. "Tai 52. Se oli joko tai."',
          min: 20, fx: { mood: 4 },
        },
        bag: {
          text: '"Pullo kirkasta. Löysin sen. Älä kysy mistä." Hän tarjoaa pulloa.',
          options: [
            { label: 'Ota huikka', next: 'sip' },
            { label: '"Ei kiitos."', next: 'noSip' },
          ],
        },
        sip: {
          end: 'Huikka polttaa kurkkua. Tarmo nyökkää hyväksyvästi. Olette nyt veljiä. Tai ainakin serkkuja.',
          min: 20, fx: { drunk: 2, mood: 8, energy: -3 },
          run(S) { S.drinks++; },
        },
        noSip: { end: '"Lisää mulle." Tarmo juo. Te istutte. Aika kuluu, mutta tällä kertaa se ei haittaa.', min: 20, fx: { mood: 4 } },
        real: {
          text: 'Tarmo on hetken hiljaa. "Ihan paskasti, jos totta puhutaan. Mut kiva ku sä tulit."',
          options: [
            { label: '"Samat sanat."', next: 'same' },
            { label: '"Lopeta toi."', next: 'stop' },
          ],
        },
        same: { end: 'Istutte hiljaa. Kaksi miestä, yksi penkki, nolla työpaikkaa. Silti olo on kevyempi kuin aamulla.', min: 30, fx: { mood: 14 } },
        stop: { end: 'Tarmo nauraa. "Okei okei." Hetki meni ohi, mutta se oli siinä. Molemmat huomasivat sen.', min: 15, fx: { mood: 5 } },
        day: {
          text: '"Kävin työkkärissä, kaupassa ja nyt täällä. Kolme paikkaa! Mulla on kiireinen päivä." Hän näyttää ylpeältä.',
          options: [
            { label: '"Mä kävin vessassa ja jääkaapilla."', next: 'dayMe' },
            { label: '"Hienoa, Tarmo."', next: 'dayOk' },
          ],
        },
        dayMe: { end: '"Kaks paikkaa! Ei paha!" Tarmo taputtaa olkapäätä. Hän tarkoittaa sitä. Tänään se riittää.', min: 15, fx: { mood: 8 } },
        dayOk: { end: '"Eiks ookin." Tarmo kertoo kaupan tarjouksista 20 minuuttia. Kuuntelet. Siinä on jotain lohdullista.', min: 20, fx: { mood: 5 } },
      },
    },
  };

  // When the visit to Tarja is over, Keijo is back home.
  TS.tarjaCtx = { after() { TS.man.x = 22; TS.go('apartment'); } };
})();