// Vectorpoint landing — vanilla JS, no dependencies
(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("vectorpoint-loaded");

  // ---------- hero video: respect reduced motion ----------
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo && prefersReducedMotion) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
  }

  // ---------- nav: scrolled state ----------
  const nav = document.getElementById("siteNav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- nav: mobile menu ----------
  const burger = document.getElementById("navBurger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav__mobile a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- reveal on scroll ----------
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  // ---------- stats count-up ----------
  const counters = document.querySelectorAll(".stat__count");
  const runCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => counterObserver.observe(el));

  // ---------- flows: traveling pulses (config-driven, one per work case) ----------
  // Each phase: caption (or null to keep), mode "parallel" | "sequence",
  // travels: [{ wire, pulse, node (lit at start), next (lit at end), duration? }]
  // ---------- leveranspipelinen: vandrande pulser i SVG:n ----------
  // phase: caption (eller null för att behålla), mode "parallel" | "sequence",
  // travels: [{ wire, pulse, node (tänds vid start), next (tänds vid mål), duration? }]
  const PIPELINE_FLOW = {
    // 04 — delivery pipeline: PR → build → isolated k8s namespace → gate → merge/stop
    svg: "flowSvg4",
    caption: "flowCaption4",
    phases: [
      {
        caption: "En pull request öppnas — ny kod, allt oftare skriven av en AI-agent. Att den bygger bevisar inte att den fungerar.",
        mode: "sequence",
        duration: 600,
        travels: [
          { wire: "wire4-a", pulse: "pulse4-a", node: "node4-in1", next: "node4-c1" },
        ],
      },
      {
        caption: "Tjänsten och testerna deployas i ett isolerat Kubernetes-namespace — en riktig, körande miljö som inte påverkar någon annan.",
        mode: "parallel",
        stagger: 200,
        duration: 800,
        travels: [
          { wire: "wire4-b1", pulse: "pulse4-b1", node: "node4-c1", next: "node4-k1" },
          { wire: "wire4-b2", pulse: "pulse4-b2", node: "node4-c1", next: "node4-k2" },
        ],
      },
      {
        caption: "Testpodden anropar den levande tjänsten med riktiga HTTP-anrop. Svarar den rätt — på riktigt, inte i teorin?",
        mode: "sequence",
        duration: 800,
        travels: [
          { wire: "wire4-t", pulse: "pulse4-t", node: "node4-k2", next: "node4-k1" },
        ],
      },
      {
        caption: "Resultatet avgör: grönt mergas vidare mot dev och E2E — rött stannar i pull requesten och når aldrig kund.",
        mode: "sequence",
        duration: 700,
        travels: [
          { wire: "wire4-g", pulse: "pulse4-g", node: "node4-k1", next: "node4-gate" },
        ],
      },
      {
        caption: null,
        mode: "parallel",
        stagger: 220,
        duration: 700,
        travels: [
          { wire: "wire4-o1", pulse: "pulse4-o1", node: "node4-gate", next: "node4-o1" },
          { wire: "wire4-o2", pulse: "pulse4-o2", node: "node4-gate", next: "node4-o2" },
        ],
      },
    ],
  };

  const travel = ({ path, pulse, node, next }, duration = 650) =>
    new Promise((resolve) => {
      const length = path.getTotalLength();
      path.classList.add("is-active");
      node.classList.add("is-active");
      pulse.style.opacity = "1";
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const point = path.getPointAtLength(length * t);
        pulse.setAttribute("cx", point.x);
        pulse.setAttribute("cy", point.y);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          pulse.style.opacity = "0";
          next.classList.add("is-active");
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

  const setupFlow = (cfg) => {
    const svg = document.getElementById(cfg.svg);
    if (!svg) return;

    if (prefersReducedMotion) {
      svg.querySelectorAll(".wire, .node").forEach((el) => el.classList.add("is-active"));
      return;
    }

    const caption = document.getElementById(cfg.caption);
    const resolveTravel = (t) => ({
      path: document.getElementById(t.wire),
      pulse: document.getElementById(t.pulse),
      node: document.getElementById(t.node),
      next: document.getElementById(t.next),
      duration: t.duration,
    });

    const runPhase = async (phase) => {
      if (phase.caption && caption) caption.textContent = phase.caption;
      const travels = phase.travels.map(resolveTravel);
      if (phase.mode === "parallel") {
        await Promise.all(
          travels.map((t, i) =>
            new Promise((r) => setTimeout(() => travel(t, t.duration || phase.duration).then(r), i * (phase.stagger || 0)))
          )
        );
      } else {
        for (const t of travels) {
          await travel(t, t.duration || phase.duration);
        }
      }
    };

    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      svg.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
      for (const phase of cfg.phases) {
        await runPhase(phase);
      }
      // idle, then loop
      setTimeout(() => {
        running = false;
        run();
      }, 4000);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(svg);
  };

  // ---------- exempel: skriptade UI-uppspelningar ----------
  // Varje exempel bygger sin egen DOM i .demo__body och stegar fram med väntetider.
  // Ett token per körning gör att "Spela upp igen" avbryter en pågående körning rent.
  // Ingen siffra i rutorna är ett kundresultat; allt innehåll är märkt som påhittat.
  const CANCEL = Symbol("cancel");
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  const setupDemo = (id, script) => {
    const root = document.getElementById(id);
    if (!root) return;
    const body = root.querySelector(".demo__body");
    const status = root.querySelector("[data-status]");
    const block = root.closest(".demo-block");
    const steps = block ? Array.from(block.querySelectorAll(".demo-steps__item")) : [];
    const replay = root.querySelector(".demo__replay");
    let token = 0;
    let inView = false;
    let started = false;
    let finished = false;
    let loopPending = false;
    let loopTimer = null;

    const makeCtx = (my) => {
      const wait = (ms) =>
        new Promise((resolve, reject) => {
          setTimeout(() => (my === token ? resolve() : reject(CANCEL)), prefersReducedMotion ? 0 : ms);
        });
      const scrollDown = (pane) => {
        const target = pane || body;
        target.scrollTo({ top: target.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
      };
      const setStatus = (text) => {
        if (status && text) status.textContent = text;
      };
      return {
        body,
        wait,
        scrollDown,
        setStatus,
        step: (n, text) => {
          steps.forEach((item, i) => {
            item.classList.toggle("is-active", i + 1 === n);
            item.classList.toggle("is-done", i + 1 < n);
          });
          setStatus(text);
        },
        done: (text) => {
          steps.forEach((item) => {
            item.classList.remove("is-active");
            item.classList.add("is-done");
          });
          setStatus(text);
          root.classList.add("is-done");
        },
        // elementet måste ligga i DOM:en innan show anropas, annars hoppar transitionen
        show: async (node, ms = 40) => {
          await wait(ms);
          node.classList.add("is-in");
        },
        type: async (node, text, speed = 14) => {
          if (prefersReducedMotion) {
            node.textContent = text;
            return;
          }
          node.classList.add("is-typing");
          node.textContent = "";
          for (let i = 0; i < text.length; i += 3) {
            node.textContent = text.slice(0, i + 3);
            await wait(speed);
          }
          node.textContent = text;
          node.classList.remove("is-typing");
        },
        // FLIP: flytta om barn i DOM:en och låt dem glida till sin nya plats
        flip: (container, ordered) => {
          const before = new Map(ordered.map((n) => [n, n.getBoundingClientRect().top]));
          ordered.forEach((n) => container.appendChild(n));
          if (prefersReducedMotion) return;
          ordered.forEach((n) => {
            const dy = before.get(n) - n.getBoundingClientRect().top;
            if (!dy) return;
            n.style.transition = "none";
            n.style.transform = `translateY(${dy}px)`;
          });
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              ordered.forEach((n) => {
                n.style.transition = "";
                n.style.transform = "";
              });
            })
          );
        },
      };
    };

    const run = async () => {
      clearTimeout(loopTimer);
      loopPending = false;
      finished = false;
      const my = ++token;
      root.classList.remove("is-done");
      body.innerHTML = "";
      body.scrollTop = 0;
      steps.forEach((item) => item.classList.remove("is-active", "is-done"));
      try {
        await script(makeCtx(my));
      } catch (err) {
        if (err !== CANCEL) console.error(err);
        return;
      }
      if (my !== token) return;
      finished = true;
      if (prefersReducedMotion) return;
      loopPending = true;
      loopTimer = setTimeout(() => {
        loopPending = false;
        if (my === token && inView) run();
      }, 12000);
    };

    if (replay) replay.addEventListener("click", run);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          const restart = finished && !loopPending && !prefersReducedMotion;
          if (inView && (!started || restart)) {
            started = true;
            run();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(root);
  };

  const srcTag = (name) => el("span", "tag tag--src", name);

  // 01 — leadgenerering: hämta, klassificera, prioritera, leverera
  const LEADS = [
    { name: "Ekelund &amp; Partner", domain: "ekelundpartner.se", src: "Apollo", kind: "Redovisningsbyrå · ca 35 anställda", prio: "medel", reason: "Mycket manuellt arbete, men oklart vem som beslutar" },
    { name: "Nordkant Systems AB", domain: "nordkant.se", src: "People Data Labs", kind: "IT-konsult · ca 120 anställda", prio: "hog", reason: "Rekryterar tre utvecklare, ingen AI-roll i teamet" },
    { name: "Talentbryggan", domain: "talentbryggan.se", src: "Webb", kind: "Rekryteringsbyrå", prio: "bort", reason: "Förmedlar utvecklare, matchar inte kriterierna" },
    { name: "Vindla AB", domain: "vindla.io", src: "People Data Labs", kind: "SaaS · B2B · ca 60 anställda", prio: "hog", reason: "Beskriver manuell onboarding av kunder på hemsidan" },
    { name: "Brivo Logistik", domain: "brivo.se", src: "Apollo", kind: "Logistik · ca 400 anställda", prio: "medel", reason: "Rekryterar, men inom lager, inte IT" },
  ];
  const PRIO_LABEL = { hog: "Hög prio", medel: "Medel", bort: "Bort" };
  const PRIO_ORDER = { hog: 0, medel: 1, bort: 2 };

  setupDemo("demoLeads", async (c) => {
    c.body.append(el("div", "lead-crit", "<span>KRITERIER</span>Sverige · 30–500 anställda · rekryterar utvecklare"));
    const list = el("div", "lead-list");
    c.body.append(list);
    const rows = LEADS.map((lead) => {
      const row = el("article", "lead");
      row.dataset.prio = lead.prio;
      row.innerHTML =
        `<div class="lead__head"><strong>${lead.name}</strong><span class="lead__domain">${lead.domain}</span><span class="lead__src">${lead.src}</span></div>` +
        `<div class="lead__state"><span class="lead__status">Hämtad</span></div>` +
        `<div class="lead__reason"></div>`;
      return row;
    });

    c.step(1, "Steg 1 av 4 · Hämtar bolag som matchar kriterierna");
    for (const row of rows) {
      list.append(row);
      await c.show(row, 420);
      c.scrollDown();
    }
    await c.wait(700);

    c.step(2, "Steg 2 av 4 · Läser hemsidor och klassificerar");
    for (const [i, row] of rows.entries()) {
      const state = row.querySelector(".lead__state");
      const st = row.querySelector(".lead__status");
      st.textContent = "Läser hemsidan";
      st.classList.add("is-busy");
      await c.wait(650);
      state.innerHTML = "";
      state.append(el("span", "tag tag--kind", LEADS[i].kind));
      await c.wait(250);
    }
    await c.wait(600);

    c.step(3, "Steg 3 av 4 · Prioriterar med skäl");
    for (const [i, row] of rows.entries()) {
      await c.wait(480);
      const prio = LEADS[i].prio;
      row.querySelector(".lead__state").append(el("span", `tag tag--prio tag--${prio}`, PRIO_LABEL[prio]));
      const reason = row.querySelector(".lead__reason");
      reason.textContent = LEADS[i].reason;
      reason.classList.add("is-in");
      row.classList.add(`lead--${prio}`);
    }
    await c.wait(800);
    c.setStatus("Steg 3 av 4 · Sorterar listan efter prioritet");
    const sorted = rows.slice().sort((a, b) => PRIO_ORDER[a.dataset.prio] - PRIO_ORDER[b.dataset.prio]);
    c.flip(list, sorted);
    await c.wait(1000);

    c.step(4, "Steg 4 av 4 · Levererar till CRM");
    for (const row of sorted) {
      await c.wait(350);
      const state = row.querySelector(".lead__state");
      if (row.dataset.prio === "bort") {
        row.classList.add("is-archived");
        state.append(el("span", "tag tag--arch", "Arkiverad med skäl"));
      } else {
        state.append(el("span", "tag tag--out", "→ HubSpot"));
      }
    }
    await c.wait(400);
    const note = el("p", "demo__note", "Fyra bolag i CRM med prioritet och skäl. Ett bortsorterat med motivering. Säljaren börjar överst.");
    c.body.append(note);
    await c.show(note, 60);
    c.scrollDown();
    c.done("Klart. Spelas upp igen om en stund.");
  });

  // 02 — feedback och ärenden: samla in, sammanfatta, klassificera, skicka
  const LANES = ["PO Rapportering", "PO Behörigheter", "PO Mobilapp", "Manuell granskning"];
  const FEEDBACK = [
    { channel: "Teams", meta: "#kundfeedback", text: "Kund hos Nordkant säger att exporten till Excel tappar formateringen på datumkolumnen varje gång. De har börjat göra det för hand igen.", summary: "Excelexport tappar datumformat, kunden gör jobbet manuellt igen", area: "Rapportering", type: "Bugg", lane: 0 },
    { channel: "E-post", meta: "support@", text: "Hej! Vi skulle vilja ge en extern revisor läsbehörighet till ett enda projekt utan att skapa ett fullt konto. Går det? Mvh Lena", summary: "Önskar läsbehörighet per projekt för externa användare", area: "Behörigheter", type: "Önskemål", lane: 1 },
    { channel: "Enkät", meta: "NPS 4 av 10", text: "Appen loggar ut mig hela tiden när jag byter mellan wifi och mobilnät. Störigt när man är ute hos kund.", summary: "Appen loggar ut vid byte av nätverk", area: "Mobilapp", type: "Bugg", lane: 2 },
    { channel: "Chatt", meta: "prospekt", text: "Kan vi visa rapporterna i mobilen med samma behörigheter som på webben? Vår säljchef vill kunna göra det från bilen.", summary: "Rapporter i mobilen med samma behörighet som på webben", area: "Rapportering + Mobilapp", type: "Önskemål", lane: 3, manual: true },
  ];

  setupDemo("demoFeedback", async (c) => {
    const inbox = el("div", "fb__in");
    const out = el("div", "fb__out");
    inbox.append(el("p", "demo__label", "Inkommande"));
    out.append(el("p", "demo__label", "Skickat till"));
    const lanes = LANES.map((name) => {
      const lane = el("div", "lane");
      lane.append(el("p", "lane__name", name));
      out.append(lane);
      return lane;
    });
    lanes[3].classList.add("lane--manual");
    c.body.append(inbox, out);

    const total = FEEDBACK.length;
    for (const [i, item] of FEEDBACK.entries()) {
      const n = i + 1;
      c.step(1, `Inlägg ${n} av ${total} · Samlar in`);
      const msg = el("article", "msg");
      msg.innerHTML =
        `<div class="msg__head"><span class="tag tag--ch">${item.channel}</span><span class="msg__meta">${item.meta}</span></div>` +
        `<p class="msg__text">${item.text}</p><div class="msg__proc"></div>`;
      inbox.append(msg);
      await c.show(msg, 60);
      c.scrollDown(inbox);
      await c.wait(900);

      c.step(2, `Inlägg ${n} av ${total} · Sammanfattar`);
      const proc = msg.querySelector(".msg__proc");
      const line1 = el("p", "msg__line is-busy", "Sammanfattar");
      proc.append(line1);
      c.scrollDown(inbox);
      await c.wait(800);
      line1.classList.remove("is-busy");
      line1.innerHTML = "";
      const sumText = el("span", "msg__v");
      line1.append(el("span", "msg__k", "Sammanfattning"), sumText);
      await c.type(sumText, item.summary);
      await c.wait(300);

      c.step(3, `Inlägg ${n} av ${total} · Klassificerar`);
      const line2 = el("p", "msg__line is-busy", "Klassificerar");
      proc.append(line2);
      c.scrollDown(inbox);
      await c.wait(700);
      line2.classList.remove("is-busy");
      line2.innerHTML = `<span class="msg__k">Område</span><span class="tag tag--kind">${item.area}</span><span class="tag">${item.type}</span>`;
      await c.wait(500);

      c.step(4, `Inlägg ${n} av ${total} · Skickar`);
      const line3 = el(
        "p",
        "msg__line",
        item.manual
          ? `<span class="msg__k">Två områden</span><span class="msg__v">går till manuell granskning</span>`
          : `<span class="msg__k">Skickas till</span><span class="msg__v">${LANES[item.lane]}</span>`
      );
      proc.append(line3);
      c.scrollDown(inbox);
      await c.wait(500);
      const card = el("div", "lane__card", `<p>${item.summary}</p><span class="lane__src">${item.type} · via ${item.channel}</span>`);
      lanes[item.lane].append(card);
      await c.show(card, 40);
      c.scrollDown(out);
      msg.classList.add("is-sent");
      await c.wait(700);
    }
    c.done("Klart. Tre inlägg hos rätt Product Owner, ett till manuell granskning.");
  });

  // 03 — rapportsammanställning: hämta, sammanställ, markera avvikelser, leverera
  const SOURCES = [
    { name: "CRM", detail: "Pipeline och aktiviteter", log: "Läser affärer i alla faser", time: "06:52" },
    { name: "BI-rapport", detail: "Försäljning per vecka och region", log: "Läser utfall mot plan", time: "06:53" },
    { name: "Teams", detail: "#sälj, veckans inlägg", log: "Läser trådar och beslut", time: "06:54" },
  ];
  const REPORT = {
    title: "Veckounderlag sälj · måndag 07:00",
    brief: "Pipelinen växte under veckan, men tillväxten ligger i tidiga affärer. Slutfasen stod still.",
    briefSrc: ["CRM", "BI"],
    deviations: [
      ["Två affärer i slutförhandling har inte haft någon aktivitet på över tre veckor.", "CRM"],
      ["Region Väst ligger under plan för andra veckan i rad.", "BI"],
      ["Tre av veckans nya affärer saknar registrerad beslutsfattare.", "CRM"],
    ],
    decisions: [
      ["Prisfråga från kund lyftes i #sälj i onsdags och är obesvarad.", "Teams"],
      ["Offert till Nordkant väntar på godkännande sedan fredag.", "Teams"],
    ],
  };

  setupDemo("demoReport", async (c) => {
    const srcPane = el("div", "rp__src");
    const docPane = el("div", "rp__doc");
    srcPane.append(el("p", "demo__label", "Källor"));
    const cards = SOURCES.map((s) => {
      const card = el("div", "src", `<div class="src__head"><strong>${s.name}</strong><span>${s.detail}</span></div><p class="src__log">Väntar</p>`);
      srcPane.append(card);
      return card;
    });
    c.body.append(srcPane, docPane);

    c.step(1, "Steg 1 av 4 · Hämtar ur tre system");
    for (const [i, card] of cards.entries()) {
      const log = card.querySelector(".src__log");
      log.textContent = SOURCES[i].log;
      log.classList.add("is-busy");
      await c.wait(900);
      log.classList.remove("is-busy");
      card.classList.add("is-ok");
      log.textContent = `Klart ${SOURCES[i].time}`;
      await c.wait(200);
    }
    await c.wait(500);

    c.step(2, "Steg 2 av 4 · Skriver ihop läget");
    const doc = el("article", "doc");
    docPane.append(doc);
    const title = el("h4", "doc__title");
    doc.append(title);
    await c.type(title, REPORT.title, 18);
    const h1 = el("p", "doc__h", "Läget i korthet");
    doc.append(h1);
    await c.show(h1, 300);
    const p1 = el("p", "doc__p");
    doc.append(p1);
    await c.type(p1, REPORT.brief, 12);
    REPORT.briefSrc.forEach((s) => p1.append(srcTag(s)));
    await c.wait(500);

    c.step(3, "Steg 3 av 4 · Markerar avvikelser");
    const h2 = el("p", "doc__h doc__h--warn", "Avvikelser att ta först");
    doc.append(h2);
    await c.show(h2, 300);
    c.scrollDown(docPane);
    const addList = async (items) => {
      const ul = el("ul", "doc__list");
      doc.append(ul);
      for (const [text, src] of items) {
        const li = el("li");
        li.append(document.createTextNode(`${text} `), srcTag(src));
        ul.append(li);
        await c.show(li, 500);
        c.scrollDown(docPane);
      }
    };
    await addList(REPORT.deviations);
    const h3 = el("p", "doc__h", "Beslut som väntar");
    doc.append(h3);
    await c.show(h3, 400);
    c.scrollDown(docPane);
    await addList(REPORT.decisions);
    await c.wait(600);

    c.step(4, "Steg 4 av 4 · Levererar");
    const foot = el("p", "doc__foot is-busy", "Skickar till Teams #ledning");
    doc.append(foot);
    await c.show(foot, 100);
    c.scrollDown(docPane);
    await c.wait(900);
    foot.classList.remove("is-busy");
    foot.textContent = "Skickat till Teams #ledning 07:00. Varje påstående pekar på sin källa.";
    c.done("Klart. Ett underlag, tre källor, en person som läser en sida.");
  });

  // ---------- scroll experience: one rAF-driven engine ----------
  // Scrub-läget (pinnad pipeline) körs bara på desktop utan reduced motion.
  const scrubEnabled = !prefersReducedMotion && window.matchMedia("(min-width: 861px)").matches;

  // Pipelinen scrubbas när det går, annars autoplayar den.
  if (!scrubEnabled) setupFlow(PIPELINE_FLOW);

  // Bygger en scrubber: global progress 0–1 mappas på faserna, helt reversibelt —
  // varje frame räknas allt om från p, så bakåtscroll släcker det som inte hänt än.
  const buildScrubber = (cfg) => {
    const svg = document.getElementById(cfg.svg);
    const captionEl = document.getElementById(cfg.caption);
    if (!svg) return null;

    const phases = cfg.phases.map((phase) => ({
      caption: phase.caption,
      travels: phase.travels.map((t) => {
        const path = document.getElementById(t.wire);
        return {
          path,
          length: path.getTotalLength(),
          pulse: document.getElementById(t.pulse),
          node: document.getElementById(t.node),
          next: document.getElementById(t.next),
        };
      }),
    }));

    let lastCaption = null;
    return (p) => {
      const pos = Math.min(Math.max(p, 0), 1) * phases.length;
      let currentCaption = phases[0].caption;
      phases.forEach((phase, i) => {
        const t = Math.min(Math.max(pos - i, 0), 1);
        phase.travels.forEach((tr) => {
          tr.node.classList.toggle("is-active", t > 0);
          tr.path.classList.toggle("is-active", t > 0);
          tr.next.classList.toggle("is-active", t >= 1);
          if (t > 0 && t < 1) {
            const point = tr.path.getPointAtLength(tr.length * t);
            tr.pulse.setAttribute("cx", point.x);
            tr.pulse.setAttribute("cy", point.y);
            tr.pulse.style.opacity = "1";
          } else {
            tr.pulse.style.opacity = "0";
          }
        });
        // senast startade fas med text vinner; null ärver föregående
        if (t > 0 && phase.caption) currentCaption = phase.caption;
      });
      if (captionEl && currentCaption && lastCaption !== currentCaption) {
        captionEl.textContent = currentCaption;
        lastCaption = currentCaption;
      }
    };
  };

  if (!prefersReducedMotion) {
    const progressFill = document.getElementById("scrollProgressFill");
    const heroFrame = document.querySelector(".hero__frame");
    const heroVideoEl = document.querySelector(".hero__video");
    const heroCue = document.getElementById("heroCue");
    const marqueeTrack = document.querySelector(".marquee__track");
    const pipelineSection = document.getElementById("pipeline");
    const scrub = scrubEnabled ? buildScrubber(PIPELINE_FLOW) : null;
    if (scrub && pipelineSection) {
      pipelineSection.classList.add("is-scrub");
      scrub(0);
    }

    // Pinnad hero: första scrollgesten berättar — video zoomar, sidoinnehåll
    // viker undan, rubriken krymper och en tråd lämnar över pulsen till sidan.
    const heroScrubWrap = document.getElementById("heroScrub");
    const heroScrubOn = scrubEnabled && !!heroScrubWrap;
    const heroTitle = document.querySelector(".hero__title");
    const heroLead = document.querySelector(".hero__lead");
    const heroActions = document.querySelector(".hero__actions");
    const heroMeta = document.querySelector(".hero__meta");
    const heroServices = document.querySelector(".hero__services");
    const heroWire = document.getElementById("heroWire");
    if (heroScrubOn) heroScrubWrap.classList.add("is-scrub");

    // andel av h inom [a, b], mjukad
    const seg = (h, a, b) => {
      const t = Math.min(Math.max((h - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };

    // Marqueen tar över från CSS-animationen och drivs per frame,
    // så scrollfarten kan addera tillfällig hastighet.
    let marqueeHalf = 0;
    if (marqueeTrack) {
      marqueeTrack.style.animation = "none";
      marqueeHalf = marqueeTrack.scrollWidth / 2;
    }

    let lastY = window.scrollY;
    let velocity = 0;
    let marqueeOffset = 0;

    const frame = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;

      velocity += (Math.abs(y - lastY) - velocity) * 0.1; // lerp-dämpad scrollfart
      lastY = y;

      if (progressFill) {
        const p = maxScroll > 0 ? y / maxScroll : 0;
        progressFill.style.transform = `translateX(${(p - 1) * 100}%)`;
      }

      if (heroScrubOn) {
        const rect = heroScrubWrap.getBoundingClientRect();
        const range = rect.height - window.innerHeight;
        const h = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 0;
        if (heroVideoEl) {
          heroVideoEl.style.transform = `scale(${1 + h * 0.15})`;
          heroVideoEl.style.filter = `brightness(${1 - h * 0.45})`;
        }
        if (heroServices) heroServices.style.opacity = String(1 - seg(h, 0.05, 0.3));
        if (heroLead) {
          const t = seg(h, 0.1, 0.4);
          heroLead.style.opacity = String(1 - t);
          heroLead.style.transform = `translateY(${-26 * t}px)`;
        }
        if (heroActions) {
          const t = seg(h, 0.18, 0.48);
          heroActions.style.opacity = String(1 - t);
          heroActions.style.transform = `translateY(${-26 * t}px)`;
        }
        if (heroMeta) heroMeta.style.opacity = String(1 - seg(h, 0.24, 0.5));
        if (heroTitle) {
          const t = seg(h, 0.15, 0.8);
          heroTitle.style.transform = `translateY(${-48 * t}px) scale(${1 - 0.12 * t})`;
        }
        if (heroWire) heroWire.style.transform = `scaleY(${seg(h, 0.4, 1)})`;
      } else if (heroFrame) {
        const heroH = heroFrame.offsetHeight || window.innerHeight;
        const exit = Math.min(y / (heroH * 0.9), 1);
        heroFrame.style.transform = `translateY(${y * 0.35}px)`;
        heroFrame.style.opacity = String(1 - exit * 0.9);
        if (heroVideoEl) heroVideoEl.style.transform = `translateY(${y * 0.15}px)`;
      }

      if (heroCue) heroCue.classList.toggle("is-hidden", y > 40);

      if (marqueeTrack && marqueeHalf > 0) {
        marqueeOffset -= 0.6 + Math.min(velocity * 0.12, 4);
        if (marqueeOffset <= -marqueeHalf) marqueeOffset += marqueeHalf;
        marqueeTrack.style.transform = `translateX(${marqueeOffset}px)`;
      }

      if (scrub && pipelineSection) {
        const rect = pipelineSection.getBoundingClientRect();
        const range = rect.height - window.innerHeight;
        if (range > 0) scrub(-rect.top / range);
      }

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();
