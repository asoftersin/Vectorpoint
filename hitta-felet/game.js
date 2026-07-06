(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- kortpool ----------
  // Varje kort: sourceKind/source (underlaget), outputKind/output (automationens leverans),
  // error (true = felaktig output), explain (visas som feedback efter val).
  var POOL = [
    // ---- FELAKTIGA (10) ----
    {
      error: true,
      sourceKind: "ORDER #4711",
      source: "Lagerhylla Modul B<br>3 st &agrave; 1 450 kr",
      outputKind: "FAKTURARAD",
      output: "Lagerhylla Modul B, 3 st<br><strong>Totalt: 5 350 kr</strong>",
      explain: "3 × 1 450 kr är 4 350 kr — inte 5 350 kr."
    },
    {
      error: true,
      sourceKind: "INKOMMANDE MEJL",
      source: "Fr&aring;n: <strong>Anna Lindqvist</strong>, Nordvik AB<br>&rdquo;Hej! N&auml;r kan vi v&auml;nta leverans av best&auml;llningen?&rdquo;",
      outputKind: "AUTOSVAR",
      output: "&rdquo;Hej <strong>Karin</strong>! Er leverans skickas inom 3–5 arbetsdagar.&rdquo;",
      explain: "Kunden heter Anna — svaret hälsar på Karin."
    },
    {
      error: true,
      sourceKind: "MÄTDATA NPS",
      source: "Q1: <strong>71</strong><br>Q2: <strong>62</strong>",
      outputKind: "RAPPORTRAD",
      output: "&rdquo;NPS steg under kvartalet till 62 — en tydlig <strong>förbättring</strong>.&rdquo;",
      explain: "71 → 62 är en försämring, inte en förbättring."
    },
    {
      error: true,
      sourceKind: "ORDER (EXPORT)",
      source: "Konsultpaket Bas<br>Pris: <strong>1 200 EUR</strong>",
      outputKind: "FAKTURARAD",
      output: "Konsultpaket Bas<br><strong>Totalt: 1 200 kr</strong>",
      explain: "Underlaget är i EUR — fakturan säger kr. Fel valuta, ~13 000 kr billigare."
    },
    {
      error: true,
      sourceKind: "BESTÄLLNING",
      source: "Programlicenser, standard<br>Antal: <strong>25 st</strong>",
      outputKind: "ORDERBEKRÄFTELSE",
      output: "&rdquo;Vi bekräftar er beställning om <strong>52 licenser</strong>.&rdquo;",
      explain: "25 blev 52 — siffrorna har kastats om."
    },
    {
      error: true,
      sourceKind: "INTERN NOTERING",
      source: "&rdquo;Styrgruppsm&ouml;tet flyttas fr&aring;n 12 maj till <strong>19 maj</strong>.&rdquo;",
      outputKind: "UTSKICK TILL DELTAGARE",
      output: "&rdquo;Notera att styrgruppsm&ouml;tet &auml;r flyttat till <strong>12 maj</strong>.&rdquo;",
      explain: "Utskicket bjuder in till det gamla datumet — mötet är 19 maj."
    },
    {
      error: true,
      sourceKind: "PRISPOLICY",
      source: "&rdquo;Inga rabatter p&aring; p&aring;g&aring;ende kampanjpriser.&rdquo;<br>Kundfr&aring;ga: &rdquo;Kan vi f&aring; rabatt p&aring; kampanjen?&rdquo;",
      outputKind: "AUTOSVAR",
      output: "&rdquo;Sj&auml;lvklart! Vi ger er <strong>15 % rabatt</strong> p&aring; kampanjpriset.&rdquo;",
      explain: "Policyn säger uttryckligen nej — automationen hittade på en rabatt."
    },
    {
      error: true,
      sourceKind: "INKOMMANDE ÄRENDE",
      source: "Avs&auml;ndare: <strong>Bergstr&ouml;m Bygg AB</strong><br>&rdquo;Fakturafr&aring;ga p&aring; senaste leveransen&rdquo;",
      outputKind: "ÄRENDEKORT (CRM)",
      output: "Kund: <strong>Bergstr&ouml;m M&aring;leri AB</strong><br>Kategori: Fakturafr&aring;ga",
      explain: "Fel bolag i CRM — Bygg blev Måleri. Ärendet hamnar hos fel kund."
    },
    {
      error: true,
      sourceKind: "ÄRENDESTATUS",
      source: "#312 L&ouml;st &nbsp;&middot;&nbsp; #313 L&ouml;st &nbsp;&middot;&nbsp; #314 <strong>&Ouml;ppet</strong>",
      outputKind: "VECKORAPPORT",
      output: "&rdquo;Samtliga supportärenden är <strong>lösta</strong>. Inga öppna ärenden kvarstår.&rdquo;",
      explain: "#314 är fortfarande öppet — rapporten städade bort det."
    },
    {
      error: true,
      sourceKind: "ENKÄTDATA",
      source: "Utskickade: <strong>200</strong><br>Svar: <strong>40</strong>",
      outputKind: "RAPPORTRAD",
      output: "&rdquo;Svarsfrekvens: <strong>40 %</strong>.&rdquo;",
      explain: "40 av 200 är 20 % — automationen tog antalet som procent."
    },

    // ---- KORREKTA (14) ----
    {
      error: false,
      sourceKind: "ORDER #4720",
      source: "Skrivbord h&ouml;j- och s&auml;nkbart<br>2 st &agrave; 3 200 kr",
      outputKind: "FAKTURARAD",
      output: "Skrivbord h&ouml;j- och s&auml;nkbart, 2 st<br><strong>Totalt: 6 400 kr</strong>",
      explain: "2 × 3 200 kr = 6 400 kr. Korrekt."
    },
    {
      error: false,
      sourceKind: "INKOMMANDE MEJL",
      source: "Fr&aring;n: <strong>Peter Sj&ouml;gren</strong>, Malte &amp; Co<br>&rdquo;Vilken leveranstid g&auml;ller just nu?&rdquo;<br>Lagerstatus: 3–5 arbetsdagar",
      outputKind: "AUTOSVAR",
      output: "&rdquo;Hej Peter! Aktuell leveranstid &auml;r 3–5 arbetsdagar.&rdquo;",
      explain: "Rätt namn, rätt uppgift enligt lagerstatus. Korrekt."
    },
    {
      error: false,
      sourceKind: "MÄTDATA NPS",
      source: "Q1: <strong>58</strong><br>Q2: <strong>66</strong>",
      outputKind: "RAPPORTRAD",
      output: "&rdquo;NPS steg under kvartalet fr&aring;n 58 till 66.&rdquo;",
      explain: "58 → 66 är mycket riktigt en ökning. Korrekt."
    },
    {
      error: false,
      sourceKind: "ORDER (EXPORT)",
      source: "Supportavtal Premium<br>Pris: <strong>800 EUR</strong>",
      outputKind: "FAKTURARAD",
      output: "Supportavtal Premium<br><strong>Totalt: 800 EUR</strong>",
      explain: "Valutan följer underlaget. Korrekt."
    },
    {
      error: false,
      sourceKind: "BESTÄLLNING",
      source: "M&ouml;tesskärm 27&quot;<br>Antal: <strong>12 st</strong>",
      outputKind: "ORDERBEKRÄFTELSE",
      output: "&rdquo;Vi bekr&auml;ftar er best&auml;llning om 12 st m&ouml;tessk&auml;rmar 27&quot;.&rdquo;",
      explain: "Antal och artikel stämmer. Korrekt."
    },
    {
      error: false,
      sourceKind: "INTERN NOTERING",
      source: "&rdquo;Kundtr&auml;ffen flyttas fr&aring;n 3 juni till <strong>10 juni</strong>.&rdquo;",
      outputKind: "UTSKICK TILL DELTAGARE",
      output: "&rdquo;Kundtr&auml;ffen &auml;r flyttad till 10 juni. V&auml;lkomna!&rdquo;",
      explain: "Nya datumet är rätt återgivet. Korrekt."
    },
    {
      error: false,
      sourceKind: "PRISPOLICY",
      source: "&rdquo;10 % rabatt vid tecknande av &aring;rsavtal.&rdquo;<br>Kundfr&aring;ga: &rdquo;F&aring;r vi rabatt om vi binder oss p&aring; ett &aring;r?&rdquo;",
      outputKind: "AUTOSVAR",
      output: "&rdquo;Ja — vid &aring;rsavtal f&aring;r ni 10 % rabatt.&rdquo;",
      explain: "Svaret följer policyn exakt. Korrekt."
    },
    {
      error: false,
      sourceKind: "INKOMMANDE ÄRENDE",
      source: "Avs&auml;ndare: <strong>Wikström Logistik AB</strong><br>&rdquo;Beh&ouml;ver uppdatera leveransadress&rdquo;",
      outputKind: "ÄRENDEKORT (CRM)",
      output: "Kund: <strong>Wikström Logistik AB</strong><br>Kategori: Adress&auml;ndring",
      explain: "Rätt kund, rimlig kategori. Korrekt."
    },
    {
      error: false,
      sourceKind: "ÄRENDESTATUS",
      source: "#207 L&ouml;st &nbsp;&middot;&nbsp; #208 L&ouml;st &nbsp;&middot;&nbsp; #209 <strong>&Ouml;ppet</strong>",
      outputKind: "VECKORAPPORT",
      output: "&rdquo;2 av 3 &auml;renden l&ouml;sta. #209 kvarst&aring;r &ouml;ppet.&rdquo;",
      explain: "Rapporten speglar statusen ärligt. Korrekt."
    },
    {
      error: false,
      sourceKind: "ENKÄTDATA",
      source: "Utskickade: <strong>120</strong><br>Svar: <strong>30</strong>",
      outputKind: "RAPPORTRAD",
      output: "&rdquo;Svarsfrekvens: 25 %.&rdquo;",
      explain: "30 av 120 = 25 %. Korrekt."
    },
    {
      error: false,
      sourceKind: "ORDERUNDERLAG",
      source: "Nettobelopp: <strong>10 000 kr</strong><br>Moms: 25 %",
      outputKind: "FAKTURASUMMERING",
      output: "Netto: 10 000 kr<br>Moms: 2 500 kr<br><strong>Totalt: 12 500 kr</strong>",
      explain: "25 % moms på 10 000 kr = 2 500 kr. Korrekt."
    },
    {
      error: false,
      sourceKind: "BOKNINGSFÖRFRÅGAN",
      source: "&rdquo;Kan vi ses torsdag kl 14:00 f&ouml;r avst&auml;mning?&rdquo;<br>Kalender: torsdag 14:00 &auml;r ledig",
      outputKind: "KALENDERBOKNING",
      output: "Avst&auml;mning<br>Torsdag kl 14:00–14:30",
      explain: "Bokningen matchar förfrågan och kalendern. Korrekt."
    },
    {
      error: false,
      sourceKind: "KUNDMEJL",
      source: "&rdquo;Vi vill s&auml;ga upp <strong>en</strong> av v&aring;ra tre tj&auml;nster — beh&aring;ller &ouml;vriga tv&aring;.&rdquo;",
      outputKind: "ÄRENDESAMMANFATTNING",
      output: "&rdquo;Kunden avslutar 1 av 3 tj&auml;nster och beh&aring;ller 2.&rdquo;",
      explain: "Sammanfattningen återger mejlet rätt. Korrekt."
    },
    {
      error: false,
      sourceKind: "AVTALSVILLKOR",
      source: "Betalningsvillkor: <strong>30 dagar netto</strong>",
      outputKind: "FAKTURAFOT",
      output: "&rdquo;Betalningsvillkor: 30 dagar netto.&rdquo;",
      explain: "Villkoret följer avtalet. Korrekt."
    }
  ];

  var CARDS_PER_ROUND = 12;
  var ERRORS_PER_ROUND = 5;
  var SECONDS_PER_CARD = 10;
  var FEEDBACK_MS = prefersReducedMotion ? 2200 : 1800;

  // ---------- state ----------
  var deck = [];
  var index = 0;
  var caught = 0;
  var missed = 0;
  var falseAlarms = 0;
  var timerId = null;
  var timeLeft = 0;
  var locked = false;

  // ---------- element ----------
  var $ = function (id) { return document.getElementById(id); };
  var screens = { intro: $("screenIntro"), game: $("screenGame"), result: $("screenResult") };

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle("is-active", k === name);
    });
    window.scrollTo(0, 0);
  }

  function track(name) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: name, title: name, event: true });
    }
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildDeck() {
    var errors = shuffle(POOL.filter(function (c) { return c.error; })).slice(0, ERRORS_PER_ROUND);
    var correct = shuffle(POOL.filter(function (c) { return !c.error; })).slice(0, CARDS_PER_ROUND - ERRORS_PER_ROUND);
    return shuffle(errors.concat(correct));
  }

  // ---------- timer ----------
  function startTimer() {
    stopTimer();
    timeLeft = SECONDS_PER_CARD * 10; // tiondelar
    updateTimerBar();
    timerId = setInterval(function () {
      timeLeft--;
      updateTimerBar();
      if (timeLeft <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function updateTimerBar() {
    var pct = (timeLeft / (SECONDS_PER_CARD * 10)) * 100;
    var bar = $("timerBar");
    bar.style.width = pct + "%";
    bar.classList.toggle("is-low", pct < 30);
  }

  // ---------- spelflöde ----------
  function renderCard() {
    var card = deck[index];
    $("hudProgress").textContent = "KORT " + (index + 1) + "/" + deck.length;
    $("cardSourceKind").textContent = card.sourceKind;
    $("cardSource").innerHTML = card.source;
    $("cardOutputKind").textContent = card.outputKind;
    $("cardOutput").innerHTML = card.output;
    $("feedback").textContent = "";
    $("feedback").className = "game-feedback";
    var el = $("gameCard");
    el.classList.remove("card-enter");
    if (!prefersReducedMotion) {
      void el.offsetWidth; // starta om animationen
      el.classList.add("card-enter");
    }
    locked = false;
    startTimer();
  }

  function updateScoreHud() {
    $("hudScore").textContent = "FÅNGADE: " + caught + " · MISSADE: " + missed;
  }

  function answer(flagged) {
    if (locked) return;
    locked = true;
    stopTimer();
    var card = deck[index];
    var fb = $("feedback");
    if (card.error && flagged) {
      caught++;
      fb.textContent = "✔ Fångat! " + card.explain;
      fb.classList.add("is-good");
    } else if (card.error && !flagged) {
      missed++;
      fb.textContent = "✘ Felet nådde kund. " + card.explain;
      fb.classList.add("is-bad");
    } else if (!card.error && flagged) {
      falseAlarms++;
      fb.textContent = "△ Falskt alarm. " + card.explain;
      fb.classList.add("is-warn");
    } else {
      fb.textContent = "✔ Rätt godkänt. " + card.explain;
      fb.classList.add("is-good");
    }
    updateScoreHud();
    setTimeout(nextCard, FEEDBACK_MS);
  }

  function onTimeout() {
    if (locked) return;
    locked = true;
    var card = deck[index];
    var fb = $("feedback");
    if (card.error) {
      missed++;
      fb.textContent = "⏱ Tiden gick ut — felet nådde kund. " + card.explain;
      fb.classList.add("is-bad");
    } else {
      fb.textContent = "⏱ Tiden gick ut — kortet skickades ogranskat. Den här gången gick det bra.";
      fb.classList.add("is-warn");
    }
    updateScoreHud();
    setTimeout(nextCard, FEEDBACK_MS);
  }

  function nextCard() {
    index++;
    if (index >= deck.length) {
      finish();
    } else {
      renderCard();
    }
  }

  function finish() {
    var totalErrors = caught + missed;
    $("resCaught").textContent = caught;
    $("resMissed").textContent = missed;
    $("resFalse").textContent = falseAlarms;

    var headline;
    if (missed === 0 && falseAlarms <= 1) {
      headline = "Skarpt öga. Men orkar du 400 kort till?";
    } else if (missed <= 2) {
      headline = "Nästan alla. I fakturaflöden är ”nästan” dyrt.";
    } else {
      headline = "Felen vann. Det gör de ofta, mot slutet av dagen.";
    }
    $("resultHeadline").textContent = headline;

    show("result");
    track("spel-klar-" + caught + "av" + totalErrors);
  }

  function start() {
    deck = buildDeck();
    index = 0; caught = 0; missed = 0; falseAlarms = 0;
    updateScoreHud();
    show("game");
    renderCard();
    track("spel-start");
  }

  // ---------- events ----------
  $("btnStart").addEventListener("click", start);
  $("btnAgain").addEventListener("click", start);
  $("btnApprove").addEventListener("click", function () { answer(false); });
  $("btnFlag").addEventListener("click", function () { answer(true); });
  $("btnShare").addEventListener("click", function () {
    var btn = $("btnShare");
    navigator.clipboard.writeText("https://vectorpoint.se/hitta-felet/").then(function () {
      btn.textContent = "Länk kopierad ✔";
      setTimeout(function () { btn.textContent = "Kopiera länk"; }, 2000);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!screens.game.classList.contains("is-active") || locked) return;
    if (e.key === "ArrowLeft" || e.key === "g") answer(false);
    if (e.key === "ArrowRight" || e.key === "f") answer(true);
  });

  document.documentElement.classList.add("vectorpoint-game-loaded");
})();
