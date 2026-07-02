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
  const FLOWS = [
    {
      // 01 — feedback pipeline: 6 sources fan in, 5-step chain
      svg: "flowSvg",
      caption: "flowCaption",
      phases: [
        {
          caption: "Feedback strömmar in från Teams, HubSpot, e-post och enkäter.",
          mode: "parallel",
          stagger: 160,
          duration: 900,
          travels: [1, 2, 3, 4, 5, 6].map((i) => ({
            wire: `wire-s${i}`, pulse: `pulse-s${i}`, node: `node-s${i}`, next: "node-c1",
          })),
        },
        {
          caption: "Allt normaliseras och klassificeras med AI — tusentals inlägg blir strukturerad data.",
          mode: "sequence",
          duration: 600,
          travels: [1, 2].map((i) => ({
            wire: `wire-c${i}`, pulse: `pulse-c${i}`, node: `node-c${i}`, next: `node-c${i + 1}`,
          })),
        },
        {
          caption: "Insikterna grupperas per produktområde, analyseras och blir en färdig rapport — varje fredag 09:00.",
          mode: "sequence",
          duration: 600,
          travels: [3, 4].map((i) => ({
            wire: `wire-c${i}`, pulse: `pulse-c${i}`, node: `node-c${i}`, next: `node-c${i + 1}`,
          })),
        },
      ],
    },
    {
      // 02 — lead generation: 3 sources fan in, 4-step chain, fan out to CRM + archive
      svg: "flowSvg2",
      caption: "flowCaption2",
      phases: [
        {
          caption: "Prospekt hämtas från persondatabaser och webben utifrån era kriterier.",
          mode: "parallel",
          stagger: 200,
          duration: 900,
          travels: [1, 2, 3].map((i) => ({
            wire: `wire2-s${i}`, pulse: `pulse2-s${i}`, node: `node2-s${i}`, next: "node2-c1",
          })),
        },
        {
          caption: "AI:n researchar varje bolag — utmaningar, signaler och rätt ingång.",
          mode: "sequence",
          duration: 650,
          travels: [1, 2].map((i) => ({
            wire: `wire2-c${i}`, pulse: `pulse2-c${i}`, node: `node2-c${i}`, next: `node2-c${i + 1}`,
          })),
        },
        {
          caption: "Varje lead poängsätts, får ett personligt utkast och landar direkt i CRM.",
          mode: "sequence",
          duration: 650,
          travels: [
            { wire: "wire2-c3", pulse: "pulse2-c3", node: "node2-c3", next: "node2-c4" },
          ],
        },
        {
          caption: null,
          mode: "parallel",
          stagger: 220,
          duration: 800,
          travels: [1, 2].map((i) => ({
            wire: `wire2-o${i}`, pulse: `pulse2-o${i}`, node: "node2-c4", next: `node2-o${i}`,
          })),
        },
      ],
    },
    {
      // 03 — self-learning QA agent: 2 inputs, 4-step chain, learning loop back
      svg: "flowSvg3",
      caption: "flowCaption3",
      phases: [
        {
          caption: "Ett Jira-ärende med acceptanskriterier triggar en AI-testare.",
          mode: "parallel",
          stagger: 220,
          duration: 900,
          travels: [1, 2].map((i) => ({
            wire: `wire3-in${i}`, pulse: `pulse3-in${i}`, node: `node3-in${i}`, next: "node3-c1",
          })),
        },
        {
          caption: "Agenten klickar igenom flödet i en riktig webbläsare och samlar bevis — skärmdump för skärmdump.",
          mode: "sequence",
          duration: 650,
          travels: [1, 2].map((i) => ({
            wire: `wire3-c${i}`, pulse: `pulse3-c${i}`, node: `node3-c${i}`, next: `node3-c${i + 1}`,
          })),
        },
        {
          caption: "Resultatet rapporteras i Jira — och lärdomarna sparas i kunskapsbasen till nästa körning.",
          mode: "sequence",
          duration: 650,
          travels: [
            { wire: "wire3-c3", pulse: "pulse3-c3", node: "node3-c3", next: "node3-c4" },
            { wire: "wire3-loop", pulse: "pulse3-loop", node: "node3-c4", next: "node3-in2", duration: 1600 },
          ],
        },
      ],
    },
  ];

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

  FLOWS.forEach(setupFlow);
})();
