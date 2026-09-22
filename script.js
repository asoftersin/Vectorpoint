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

  // ---------- frågefältet i hero: chips fyller fältet, titeln förifylls vid bokning ----------
  const askForm = document.getElementById("askForm");
  if (askForm) {
    const askInput = document.getElementById("askInput");
    const askTitle = document.getElementById("askTitle");
    askForm.querySelectorAll(".ask__chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        askInput.value = chip.textContent.trim();
        askInput.focus();
      });
    });
    askForm.addEventListener("submit", () => {
      const text = askInput.value.trim();
      // cal.com-eventet kräver en mötesrubrik; en kort version av texten duger, annars ett standardvärde
      askTitle.value = text ? text.slice(0, 60) : "Samtal om ett flöde att automatisera";
      if (text) askInput.value = text + " (skrivet på vectorpoint.se)";
    });
  }

  // Enhance the existing sections; without JS every example remains readable.
  const exampleTabs = document.getElementById("exampleTabs");
  if (exampleTabs) {
    const tabs = Array.from(exampleTabs.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
    const selectExample = (index) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      document.dispatchEvent(new CustomEvent("examplechange"));
    };
    const selectHashExample = () => {
      const index = panels.findIndex((panel) => `#${panel.id}` === window.location.hash);
      if (index < 0) return false;
      selectExample(index);
      panels[index].scrollIntoView({ behavior: "instant", block: "start" });
      return true;
    };
    panels.forEach((panel, i) => {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabs[i].id);
      panel.tabIndex = 0;
    });
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectExample(index));
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectExample(next);
        tabs[next].focus();
      });
    });
    exampleTabs.hidden = false;
    if (!selectHashExample()) selectExample(0);
    window.addEventListener("hashchange", selectHashExample);
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
        caption: "En pull request öppnas med ny kod, allt oftare skriven av en AI-agent. Att den bygger bevisar inte att den fungerar.",
        mode: "sequence",
        duration: 600,
        travels: [
          { wire: "wire4-a", pulse: "pulse4-a", node: "node4-in1", next: "node4-c1" },
        ],
      },
      {
        caption: "Tjänsten och testerna deployas i ett isolerat Kubernetes-namespace, en riktig och körande miljö som inte påverkar någon annan.",
        mode: "parallel",
        stagger: 200,
        duration: 800,
        travels: [
          { wire: "wire4-b1", pulse: "pulse4-b1", node: "node4-c1", next: "node4-k1" },
          { wire: "wire4-b2", pulse: "pulse4-b2", node: "node4-c1", next: "node4-k2" },
        ],
      },
      {
        caption: "Testpodden anropar den levande tjänsten med riktiga HTTP-anrop. Svarar den rätt på riktigt, inte bara i teorin?",
        mode: "sequence",
        duration: 800,
        travels: [
          { wire: "wire4-t", pulse: "pulse4-t", node: "node4-k2", next: "node4-k1" },
        ],
      },
      {
        caption: "När de skriptade testerna är gröna startar en andra pod: en AI-agent med samma adress till tjänsten, en stegbudget och kunskap om produkten.",
        mode: "sequence",
        duration: 600,
        travels: [
          { wire: "wire4-s", pulse: "pulse4-s", node: "node4-k2", next: "node4-k3" },
        ],
      },
      {
        caption: "Agenten öppnar en riktig webbläsare och utforskar tjänsten som en användare. Den hittar det ingen skrev ett test för och skriver en läsbar rapport direkt i pull requesten.",
        mode: "sequence",
        duration: 900,
        travels: [
          { wire: "wire4-t2", pulse: "pulse4-t2", node: "node4-k3", next: "node4-k1" },
        ],
      },
      {
        caption: "Resultatet avgör. Grönt mergas vidare mot dev och E2E, rött stannar i pull requesten och når aldrig kund.",
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

  const travel = ({ path, pulse, node, next }, duration = 650, isCurrent = () => true) =>
    new Promise((resolve) => {
      const length = path.getTotalLength();
      path.classList.add("is-active");
      node.classList.add("is-active");
      pulse.style.opacity = "1";
      const start = performance.now();
      const step = (now) => {
        if (!isCurrent()) {
          pulse.style.opacity = "0";
          resolve();
          return;
        }
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
    const introCaption = caption ? caption.textContent : "";
    const resolveTravel = (t) => ({
      path: document.getElementById(t.wire),
      pulse: document.getElementById(t.pulse),
      node: document.getElementById(t.node),
      next: document.getElementById(t.next),
      duration: t.duration,
    });

    const runPhase = async (phase, isCurrent) => {
      if (phase.caption && caption) caption.textContent = phase.caption;
      const travels = phase.travels.map(resolveTravel);
      if (phase.mode === "parallel") {
        await Promise.all(
          travels.map((t, i) =>
            new Promise((r) => setTimeout(() => {
              if (!isCurrent()) return r();
              travel(t, t.duration || phase.duration, isCurrent).then(r);
            }, i * (phase.stagger || 0)))
          )
        );
      } else {
        for (const t of travels) {
          if (!isCurrent()) return;
          await travel(t, t.duration || phase.duration, isCurrent);
        }
      }
    };

    const disclosure = svg.closest("details");
    let running = false;
    let inView = false;
    let generation = 0;
    let introTimer;
    let loopTimer;
    const stop = () => {
      generation++;
      running = false;
      clearTimeout(introTimer);
      clearTimeout(loopTimer);
      svg.querySelectorAll(".pulse").forEach((pulse) => { pulse.style.opacity = "0"; });
      if (caption) caption.textContent = introCaption;
    };
    const run = async () => {
      if (running || !inView || (disclosure && !disclosure.open)) return;
      running = true;
      const current = ++generation;
      const isCurrent = () => current === generation;
      svg.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
      for (const phase of cfg.phases) {
        if (!isCurrent()) return;
        await runPhase(phase, isCurrent);
      }
      if (!isCurrent()) return;
      // paus med introtexten, sedan loop
      introTimer = setTimeout(() => {
        if (caption && introCaption) caption.textContent = introCaption;
      }, 2500);
      loopTimer = setTimeout(() => {
        running = false;
        run();
      }, 6000);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) run();
          else stop();
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(svg);
    if (disclosure) {
      disclosure.addEventListener("toggle", () => {
        if (disclosure.open) run();
        else stop();
      });
    }
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
    const pause = root.querySelector(".demo__pause");
    root.querySelector(".demo__controls").hidden = false;
    pause.hidden = prefersReducedMotion;
    let token = 0;
    let inView = false;
    let started = false;
    let finished = false;
    let loopPending = false;
    let paused = false;
    let pendingWait = null;
    let pausedAnimations = [];

    const scheduleWait = () => {
      const waiting = pendingWait;
      if (!waiting || paused) return;
      waiting.startedAt = performance.now();
      waiting.timer = setTimeout(() => {
        pendingWait = null;
        if (waiting.token === token) waiting.resolve();
        else waiting.reject(CANCEL);
      }, waiting.remaining);
    };

    const wait = (my, ms) => new Promise((resolve, reject) => {
      if (my !== token) {
        reject(CANCEL);
        return;
      }
      pendingWait = {
        token: my, remaining: prefersReducedMotion ? 0 : ms,
        resolve, reject, timer: null, startedAt: 0,
      };
      scheduleWait();
    });

    const cancelWait = () => {
      if (!pendingWait) return;
      clearTimeout(pendingWait.timer);
      pendingWait.reject(CANCEL);
      pendingWait = null;
    };

    const setPaused = (value) => {
      if (paused === value) return;
      paused = value;
      root.classList.toggle("is-paused", paused);
      pause.textContent = paused ? "Fortsätt" : "Pausa";
      if (paused) {
        if (pendingWait && pendingWait.timer !== null) {
          clearTimeout(pendingWait.timer);
          pendingWait.remaining = Math.max(0, pendingWait.remaining - (performance.now() - pendingWait.startedAt));
          pendingWait.timer = null;
        }
        pausedAnimations = body.getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running");
        pausedAnimations.forEach((animation) => animation.pause());
        [body, ...body.children].forEach((pane) =>
          pane.scrollTo({ top: pane.scrollTop, left: pane.scrollLeft, behavior: "instant" }));
      } else {
        pausedAnimations.forEach((animation) => {
          if (animation.playState === "paused") animation.play();
        });
        pausedAnimations = [];
        scheduleWait();
      }
    };

    const makeCtx = (my) => {
      const delay = (ms) => wait(my, ms);
      const scrollDown = (pane) => {
        const target = pane || body;
        target.scrollTo({ top: target.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
      };
      const setStatus = (text) => {
        if (status && text) status.textContent = text;
      };
      return {
        body,
        wait: delay,
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
          await delay(ms);
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
            await delay(speed);
          }
          node.textContent = text;
          node.classList.remove("is-typing");
        },
        // FLIP: flytta om barn i DOM:en och låt dem glida till sin nya plats
        flip: async (container, ordered) => {
          const before = new Map(ordered.map((n) => [n, n.getBoundingClientRect().top]));
          ordered.forEach((n) => container.appendChild(n));
          if (prefersReducedMotion) return;
          ordered.forEach((n) => {
            const dy = before.get(n) - n.getBoundingClientRect().top;
            if (!dy) return;
            n.style.transition = "none";
            n.style.transform = `translateY(${dy}px)`;
          });
          // Keep the inverse transform for a frame, using the same pausable clock.
          await delay(32);
          ordered.forEach((n) => {
            n.style.transition = "";
            n.style.transform = "";
          });
        },
      };
    };

    const run = async () => {
      cancelWait();
      loopPending = false;
      finished = false;
      started = true;
      const my = ++token;
      root.classList.remove("is-done");
      body.innerHTML = "";
      body.scrollTop = 0;
      steps.forEach((item) => item.classList.remove("is-active", "is-done"));
      try {
        await script(makeCtx(my));
        if (my !== token) return;
        finished = true;
        if (prefersReducedMotion) return;
        loopPending = true;
        await wait(my, 12000);
        loopPending = false;
        if (my === token && inView) run();
      } catch (err) {
        if (err !== CANCEL) console.error(err);
        return;
      }
    };

    replay.addEventListener("click", () => {
      setPaused(false);
      run();
    });
    pause.addEventListener("click", () => setPaused(!paused));

    document.addEventListener("examplechange", () => {
      if (root.closest("[hidden]")) {
        token++;
        cancelWait();
        setPaused(false);
        inView = false;
        started = false;
        finished = false;
        loopPending = false;
      }
      // Rapid tab switches can hide and restore a panel between observer frames.
      observer.unobserve(root);
      observer.observe(root);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting && !root.closest("[hidden]");
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

  // 01 — leadgenerering: hitta kontakter, researcha bolaget, poängsätt, utkast och export
  // Speglar mönstret i ett verkligt flöde på generisk nivå. Namn, bolag och belägg är påhittade.
  const LEADS = [
    { company: "Almbro Redovisning", domain: "almbro.se", person: "E. Sandvall", title: "Ekonomichef", src: "Apollo", claim: "Öppnar ett andra kontor under hösten", source: "hemsida", checks: ["ok", "ok", "svag", "ok", "ok"], prio: "medel" },
    { company: "Nordkant Systems AB", domain: "nordkant.se", person: "J. Åkerlind", title: "IT-chef", src: "People Data Labs", claim: "Rekryterar utvecklare till ett nytt team", source: "platsannons", checks: ["ok", "ok", "ok", "ok", "ok"], prio: "hog" },
    { company: "Talentbryggan", domain: "talentbryggan.se", person: "M. Hedenmark", title: "Driftchef", src: "Apollo", claim: null, source: null, checks: ["ok", "svag", "svag", "saknas", "svag"], prio: "lag" },
    { company: "Tunbro AB", domain: "tunbro.io", person: "S. Brolund", title: "COO", src: "People Data Labs", claim: "Lanserar en ny plattform till kund", source: "pressmeddelande", checks: ["ok", "ok", "ok", "ok", "svag"], prio: "hog" },
    { company: "Torneby Logistik", domain: "torneby.se", person: "K. Wennergren", title: "Logistikchef", src: "Apollo", claim: "Bygger ett nytt centrallager", source: "lokalpress", checks: ["svag", "ok", "ok", "ok", "ok"], prio: "medel" },
  ];
  // samma kontakt en gång till från en annan källa, slås ihop i steg 1
  const LEAD_DUPLICATE = { company: "Nordkant Systems AB", domain: "nordkant.se", person: "J. Åkerlind", title: "IT-chef", src: "Apollo" };
  const CHECK_LABELS = ["Roll", "Senioritet", "Storlek", "Signal", "Data"];
  const CHECK_MARK = { ok: "✓", svag: "~", saknas: "✗" };
  const PRIO_LABEL = { hog: "Hög prio", medel: "Medel", lag: "Låg" };
  const PRIO_ORDER = { hog: 0, medel: 1, lag: 2 };

  const leadRow = (lead) => {
    const row = el("article", "lead");
    row.dataset.prio = lead.prio || "lag";
    row.innerHTML =
      `<div class="lead__head"><strong>${lead.person}</strong><span class="lead__title">${lead.title}</span><span class="lead__src">${lead.src}</span></div>` +
      `<div class="lead__company">${lead.company}<span class="lead__domain">${lead.domain}</span></div>` +
      `<div class="lead__state"><span class="lead__status">Hämtad</span></div>` +
      `<div class="lead__reason"></div>`;
    return row;
  };

  setupDemo("demoLeads", async (c) => {
    c.body.append(el("div", "lead-crit", "<span>KRITERIER</span>Sverige · 30–500 anställda · roller: ekonomichef, driftchef, IT-chef"));
    const list = el("div", "lead-list");
    c.body.append(list);
    const rows = LEADS.map(leadRow);

    c.step(1, "Steg 1 av 4 · Hämtar kontakter i rätt roll");
    for (const row of rows) {
      list.append(row);
      await c.show(row, 380);
      c.scrollDown();
    }
    // dubbletten dyker upp, känns igen och slås ihop
    const dup = leadRow(LEAD_DUPLICATE);
    list.append(dup);
    await c.show(dup, 380);
    c.scrollDown();
    await c.wait(500);
    c.setStatus("Steg 1 av 4 · Slår ihop dubbletter");
    dup.querySelector(".lead__state").innerHTML = "";
    dup.querySelector(".lead__state").append(el("span", "tag tag--arch", "Dubblett, slås ihop"));
    dup.classList.add("is-archived");
    await c.wait(900);
    dup.classList.remove("is-in");
    await c.wait(400);
    dup.remove();
    rows[1].querySelector(".lead__src").textContent = "People Data Labs + Apollo";
    await c.wait(600);

    c.step(2, "Steg 2 av 4 · Söker belägg om bolagen");
    for (const [i, row] of rows.entries()) {
      const state = row.querySelector(".lead__state");
      const st = row.querySelector(".lead__status");
      st.textContent = "Söker belägg på webben";
      st.classList.add("is-busy");
      await c.wait(600);
      state.innerHTML = "";
      const lead = LEADS[i];
      if (lead.claim) {
        const line = el("span", "lead__claim", `<span class="lead__k">Belagt</span>${lead.claim}`);
        line.append(srcTag(lead.source));
        state.append(line);
      } else {
        state.append(el("span", "lead__claim lead__claim--none", "Underlaget räcker inte. Ingen research, inget gissat."));
      }
      await c.wait(250);
    }
    await c.wait(600);

    c.step(3, "Steg 3 av 4 · Poängsätter efter fasta regler");
    for (const [i, row] of rows.entries()) {
      await c.wait(460);
      const lead = LEADS[i];
      const checks = el("div", "lead__checks");
      lead.checks.forEach((v, k) => {
        checks.append(el("span", `lead__check lead__check--${v}`, `${CHECK_LABELS[k]} ${CHECK_MARK[v]}`));
      });
      checks.append(el("span", `tag tag--prio tag--${lead.prio}`, PRIO_LABEL[lead.prio]));
      row.querySelector(".lead__reason").replaceWith(checks);
      row.classList.add(`lead--${lead.prio}`);
    }
    await c.wait(800);
    c.setStatus("Steg 3 av 4 · Sorterar listan efter poäng");
    const sorted = rows.slice().sort((a, b) => PRIO_ORDER[a.dataset.prio] - PRIO_ORDER[b.dataset.prio]);
    await c.flip(list, sorted);
    await c.wait(1000);

    c.step(4, "Steg 4 av 4 · Skriver utkast och exporterar till CRM");
    for (const row of sorted) {
      await c.wait(380);
      const state = row.querySelector(".lead__state");
      if (row.dataset.prio === "lag") {
        state.append(el("span", "tag tag--arch", "Kvar i listan, inget utkast"));
        continue;
      }
      const draft = el("span", "tag is-busy", "Skriver utkast");
      state.append(draft);
      await c.wait(700);
      draft.classList.remove("is-busy");
      draft.textContent = "Utkast klart";
      await c.wait(250);
      state.append(el("span", "tag tag--out", "→ CRM: bolag matchat, kontakt skapad"));
    }
    await c.wait(400);
    const note = el("p", "demo__note", "Fyra kontakter i CRM med utkast och belägg. En kvar i listan. Varje poäng går att spåra till en regel.");
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
  setupFlow(PIPELINE_FLOW);

  if (!prefersReducedMotion) {
    const progressFill = document.getElementById("scrollProgressFill");
    const marqueeTrack = document.querySelector(".marquee__track");

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

      if (marqueeTrack && marqueeHalf > 0) {
        marqueeOffset -= 0.6 + Math.min(velocity * 0.12, 4);
        if (marqueeOffset <= -marqueeHalf) marqueeOffset += marqueeHalf;
        marqueeTrack.style.transform = `translateX(${marqueeOffset}px)`;
      }

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();
