import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "assets/johan-portrait.jpg",
  "assets/brand/vectorpoint-logo.svg",
  "assets/brand/vectorpoint-logo-white.svg",
  "assets/og-image.png",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",
  "404.html",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const html = await readFile("index.html", "utf8");
const css = await readFile("styles.css", "utf8");
const js = await readFile("script.js", "utf8");
const sitemap = await readFile("sitemap.xml", "utf8");

const checks = [
  // The first screen has to do three things: say what we do, show who you would
  // be dealing with, and offer a way to get in touch.
  ["hero is the first thing on the page", (() => {
    const main = html.indexOf('<main id="top">');
    const firstSection = html.indexOf("<section", main);
    return firstSection === html.indexOf('<section class="hero" id="hero">') && html.indexOf('id="film"') > html.indexOf('id="services"');
  })()],
  // The headline sells the difference (it works in daily operation); the brand
  // tagline from the film stays in the title, the social cards and the footer.
  ["hero headline sells the difference, tagline stays in the title", html.includes('class="hero__title" data-reveal><span class="hero__line">AI som fungerar i drift.</span> <span class="hero__line">Inte bara i en demo.</span></h1>') &&
    html.includes("<title>Vectorpoint — Från AI-idé till mätbar effekt</title>") && html.includes("från idé till mätbar effekt.</p>")],
  ["examples are progressively enhanced tabs", html.includes('id="exampleTabs" role="tablist"') && html.includes('aria-controls="work-report"') && js.includes('panel.setAttribute("role", "tabpanel")') && css.includes("[hidden] { display: none !important; }")],
  ["prototype offer outside every panel", html.indexOf('id="prototype"') > html.indexOf('id="demoReport"') && html.includes("Fast pris och omfattning bestäms före start.")],
  ["founder and direct contact details in hero", (() => {
    const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf("</section>", html.indexOf('<section class="hero"')));
    return hero.includes('class="founder"') && hero.includes('src="assets/johan-portrait.jpg" alt="Johan Studt"') &&
      hero.includes('href="mailto:johan@vectorpoint.se"') && hero.includes("https://www.linkedin.com/in/johan-studt/") &&
      hero.includes("Vector Point AB") && hero.indexOf('id="heroCta"') < hero.indexOf('class="founder"');
  })()],
  // Only organisations Johan has said may be shown, under the label he chose: "previous work",
  // not "clients". Adding a name or changing that claim is his call, not a design decision.
  ["previous work sits in the hero with local assets", (() => {
    const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf("</section>", html.indexOf('<section class="hero"')));
    const strip = hero.slice(hero.indexOf('class="clients"'));
    const shown = [...strip.matchAll(/src="assets\/clients\/([a-z]+)\.png" alt="([^"]+)"/g)];
    return hero.includes('class="clients"') && strip.includes(">Tidigare arbeten</h2>") && !/kunder/i.test(strip.slice(0, strip.indexOf("</ul>"))) && shown.map((m) => m[2]).join(",") === "Stratsys,Prevas,Chalmers" &&
      shown.every((m) => existsSync(`assets/clients/${m[1]}.png`)) && readdirSync("assets/clients").length === shown.length;
  })()],
  ["hero commitments repeat promises made in full further down", ["Fast pris på första prototypen", "Ni äger kod och dokumentation", "Testat innan det når er"].every((t) => html.includes(`<li>${t}</li>`)) &&
    html.includes("Fast pris och omfattning bestäms före start.") && html.includes("Ni äger lösningen") && html.includes("Testat som programvara")],
  ["launch film is a framed section that loads on demand", (() => {
    const film = html.indexOf('id="film"');
    return film > html.indexOf('id="services"') && film < html.indexOf('id="work"') &&
      ["film.mp4", "film-v.mp4", "poster.jpg", "poster-v.jpg"].every((f) => html.includes(`assets/launch/${f}`) && existsSync(`assets/launch/${f}`)) &&
      html.includes('preload="none"') && js.includes('matchMedia("(orientation: portrait)")') && js.includes("if (!film.getAttribute(\"src\")) pickSource();") &&
      css.includes(".vectorpoint-loaded .film {") && css.includes("aspect-ratio: 9 / 16;");
  })()],
  ["light page with dark panels from one token set", css.includes("--bg: #f6f4ef") && css.includes("--accent: #0a66d1") && css.includes("--accent: #0099ff") &&
    /\.film,\n\.demo,\n\.flow__stage,\n\.contact,\n\.footer \{/.test(css) && html.includes('<meta name="theme-color" content="#f6f4ef">') &&
    html.includes('<img src="assets/brand/vectorpoint-logo.svg" alt="Vectorpoint"')],
  ["optional technical deep dive", html.includes('<details class="pipeline" id="pipeline">') && html.includes("<summary>Se hur vi kvalitetssäkrar")],
  ["data processing described without absolute residency promise", !html.includes("Den stannar i era system.") && html.split("även externa AI-tjänster").length === 3],
  ["LinkedIn CTA", html.includes("https://www.linkedin.com/in/johan-studt/")],
  ["nav links", html.includes('href="#services"') && html.includes('href="#faq"') && html.includes('<a href="#work">Exempel</a>') && html.split('<a href="#kontakt">Kontakt</a>').length === 4 && html.split('<a href="#about">Om</a>').length === 4],
  ["mobile menu", html.includes('id="navBurger"') && js.includes("navBurger")],
  ["services section names the problems we solve", html.includes('id="services"') && html.includes("Säker AI för hela organisationen") && html.split('class="grid grid--3"').length === 2],
  ["stats filler removed", !html.includes('class="stats"') && !html.includes('class="stat__value"')],
  ["no count-up metrics in stats", !html.includes("stat__count") && !html.includes("data-count") && !js.includes("runCounter")],
  ["work anchor", html.includes('id="work"') && html.includes('href="#work"')],
  ["tools section", html.includes('id="tools"') && html.includes("VERKTYG OCH INTEGRATIONER") && css.includes(".tools__plate")],
  ["tool logos are local svg files", (() => { const refs = [...new Set(html.match(new RegExp("assets/logos/[a-z]+[.]svg", "g")) || [])]; return refs.length >= 12 && refs.every((p) => existsSync(p)); })()],
  ["no orphan logo files", readdirSync("assets/logos").every((f) => html.includes(`assets/logos/${f}`))],
  ["two copilots are told apart", html.includes("githubcopilot.svg") && html.includes("microsoftcopilot.svg") && html.includes(">GitHub Copilot<") && html.includes(">Microsoft Copilot<")],
  ["no runtime logo fetch from foreign hosts", !/<img[^>]+src="https?:/.test(html) && !html.includes("cdn.simpleicons.org")],
  ["example demos", ["demoLeads", "demoFeedback", "demoReport"].every((id) => html.includes(`id="${id}"`) && js.includes(`"${id}"`))],
  ["demo engine", js.includes("setupDemo") && js.includes("CANCEL") && js.includes("flip:") && css.includes(".demo__body")],
  ["demo step rail", html.includes('class="demo-steps__item" data-step="4"') && css.includes(".demo-steps__item.is-active")],
  ["demo replay", html.includes('class="demo__replay"') && js.includes('replay.addEventListener("click"')],
  ["demo pause", (html.match(/class="demo__pause"/g) || []).length === 3 && js.includes("pendingWait.remaining") && js.includes('pause.addEventListener("click"')],
  ["demo reduced motion", css.includes(".demo *,") && js.includes("prefersReducedMotion ? 0 : ms")],
  ["examples marked as fictional", html.includes("EXEMPEL · PÅHITTADE BOLAG") && html.includes("EXEMPEL · PÅHITTADE INLÄGG") && html.includes("EXEMPEL · PÅHITTAD DATA")],
  ["no invented result metrics in demos", !/(konverteringsgrad|träffsäkerhet|d+s?% (snabbare|färre|fler))/i.test(js)],
  ["old svg flows removed", !html.includes('id="flowSvg"') && !html.includes('id="flowSvg2"') && !html.includes('id="flowSvg3"') && !js.includes("FLOWS")],
  ["pipeline svg self-contained defs", html.includes('id="wireGrad"') && html.includes('id="glow"') && !html.includes("wireGrad4")],
  ["example cta", html.includes('data-goatcounter-click="cta-exempel"')],
  // Navraden är fixed. Blir hero-paddingen på mobil mindre än navradens höjd
  // hamnar rubriken under headern, vilket hände i praktiken på iOS Safari.
  // Navraden är 11 + 44 + 11 + 1 = 67 px där, så paddingen behöver marginal.
  ["hero clears fixed nav on mobile", (() => {
    const m = css.match(/@media \(max-width: 560px\)[^}]*\{[\s\S]*?\.hero \{ padding-top: (\d+)px/);
    return m ? Number(m[1]) >= 90 : false;
  })()],
  ["no em dash in prose", !html.split("\n").some((l) => l.includes("\u2014") && !l.includes("<title>") && !l.includes('property="og:title"') && !l.includes('name="twitter:title"'))],
  ["flow animation", js.includes("getPointAtLength") && js.includes("runPhase")],
  ["approach section", html.includes('id="approach"') && html.includes("Problem och mål") && html.indexOf('id="approach"') < html.indexOf('id="prototype"')],
  ["trust points cover control and ownership", !html.includes('id="principles"') && html.includes("Säkerhet och kontroll") && html.includes("Ni äger lösningen")],
  ["faq accordion", html.includes('class="faq__item"') && html.includes("<details")],
  ["no background video left behind", !html.includes("heroVideo") && !js.includes("heroVideo") && !css.includes(".hero__video") && !existsSync("assets/hero-bg.mp4") &&
    html.includes('<link rel="preload" as="image" href="assets/johan-portrait.jpg"')],
  ["header CTA yields to the hero booking button", js.includes('nav.classList.toggle("is-hero-cta"') && js.includes('document.getElementById("heroCta")') && css.includes(".nav.is-hero-cta .nav__cta {") && !html.includes("is-hero-cta")],
  ["no external js deps", !html.includes("cdn.jsdelivr.net")],
  ["fonts", html.includes("family=Geist+Mono") && html.includes("family=Inter") && !html.includes("Gasoek") && !css.includes("Gasoek")],
  ["load hook", js.includes("vectorpoint-loaded")],
  ["reveal on scroll", css.includes("[data-reveal]") && js.includes("IntersectionObserver")],
  ["reduced motion support", css.includes("prefers-reduced-motion") && js.includes("prefers-reduced-motion")],
  ["responsive layout", css.includes("@media")],
  ["booking cta", html.includes("https://cal.com/") && html.includes('data-goatcounter-click="cta-hero"')],
  ["contact section offers booking, email and LinkedIn", (() => {
    const contact = html.slice(html.indexOf('<section class="contact" id="kontakt"'), html.indexOf("</main>"));
    return contact.includes('data-goatcounter-click="cta-kontakt"') && contact.includes('data-goatcounter-click="cta-kontakt-direkt"') &&
      contact.includes('href="mailto:johan@vectorpoint.se" data-goatcounter-click="contact-email"') &&
      contact.includes('data-goatcounter-click="contact-linkedin"') && contact.includes("Det här händer sedan") &&
      html.indexOf('id="kontakt"') > html.indexOf('id="faq"');
  })()],
  ["contact form hands the text to cal.com", html.includes('id="askForm"') && html.includes('action="https://cal.com/johan-studt/15min"') && html.includes('name="notes"') && html.includes('name="title"') && js.includes("askForm")],
  ["contact form is honest about no AI", html.includes("Ingen AI läser den") && !html.includes("Fråga vår AI")],
  ["contact controls degrade without script", html.includes('id="askMail" href="mailto:johan@vectorpoint.se"') && /id="copyEmail"[^>]* hidden>/.test(html) &&
    js.includes("copyEmail.hidden = false") && js.includes("navigator.clipboard.writeText")],
  ["no contact detail or promise we were not given", !/tel:|\+46/.test(html) && !/kostnadsfri|gratis|svar inom/i.test(html)],
  // Instagram shows Johan explaining AI to companies: proof of the person, not a way to reach him.
  ["instagram supports the about section without becoming a contact route", (() => {
    const about = html.slice(html.indexOf('id="about"'), html.indexOf('id="faq"'));
    const contact = html.slice(html.indexOf('id="kontakt"'), html.indexOf("</main>"));
    const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('id="services"'));
    return about.includes('href="https://www.instagram.com/johanstudt/"') && !contact.includes("instagram") && !hero.includes("instagram") &&
      html.split('"https://www.instagram.com/johanstudt/"]').length === 3;
  })()],
  ["structured data carries the contact address", html.includes('"email": "johan@vectorpoint.se"')],
  ["analytics snippet", html.includes("data-goatcounter=") && html.includes("gc.zgo.at/count.js")],
  ["no placeholders left", !html.includes("PLACEHOLDER")],
  ["favicon link", html.includes('rel="icon"') && html.includes("favicon.svg")],
  ["og image", html.includes('property="og:image"') && html.includes("assets/og-image.png")],
  ["twitter card", html.includes('name="twitter:card"')],
  ["canonical", html.includes('rel="canonical"') && html.includes("https://vectorpoint.se/")],
  ["json-ld", html.includes("application/ld+json") && html.includes("ProfessionalService")],
  ["faq schema", html.includes('"FAQPage"') && html.includes("Hur vet vi att det ger effekt?")],
  ["difference section", html.includes('id="difference"') && html.includes("Integrationstester") && html.includes("Testat som programvara")],
  ["about section", html.includes('id="about"') && html.includes("Johan Studt") && css.includes(".about__inner") && html.includes('data-goatcounter-click="cta-om"')],
  ["game removed", !html.includes("hitta-felet") && !sitemap.includes("hitta-felet") && !existsSync("hitta-felet")],
  ["pipeline flow", html.includes('id="flowSvg4"') && html.includes("ISOLERAT PR-NAMESPACE") && html.includes("INT_TEST_URL")],
  ["pipeline flow config", js.includes("PIPELINE_FLOW") && js.includes("flowSvg4") && js.includes("wire4-o2") && css.includes(".flow__boundary")],
  ["scroll progress", html.includes('id="scrollProgressFill"') && css.includes(".scroll-progress__fill")],
  ["pipeline autoplays inside difference", js.includes("setupFlow(PIPELINE_FLOW)") && !js.includes("buildScrubber") && !css.includes("#pipeline.is-scrub") && html.indexOf('id="difference"') < html.indexOf('id="pipeline"') && html.indexOf('id="pipeline"') < html.indexOf('id="about"')],
  ["pipeline caption sits under the diagram", html.indexOf('id="flowSvg4"') < html.indexOf('id="flowCaption4"') && html.includes("Följ en ändring från pull request till grind")],
  ["pipeline diagram cropped to content", html.includes('viewBox="20 95 1305 415"') && html.includes('class="flow__scroll"') && css.includes(".flow__scroll svg { min-width: 720px; }")],
  ["pipeline includes agentic QA pod", html.includes('id="node4-k3"') && html.includes('id="wire4-t2"') && js.includes('wire: "wire4-t2"') && html.includes("AGENTISK QA")],
  ["pipeline caption returns to intro between loops", js.includes("introCaption") && js.includes("caption.textContent = introCaption")],
  ["step rail collapses on stacked layout", css.includes(".demo-steps__item.is-active p { display: block; }") && css.includes(".demo-steps__item p { display: block; }")],
  ["difference points list", html.split('class="point"').length === 5 && css.includes(".points {")],
  ["tighter page rhythm", css.includes("padding: clamp(56px, 7vw, 96px) var(--pad-x)") && css.includes("min-height: min(780px, 100svh)")],
  ["mobile nav keeps booking cta", !css.includes(".nav__links, .nav__cta { display: none; }") && css.includes(".nav__cta { margin-left: auto;")],
  ["hero drops redundant meta, scroll cue and fictional preview", !html.includes("hero__meta") && !html.includes("heroCue") && !css.includes("cueTick") && !js.includes("heroCue") && !html.includes("hero-peek") && !css.includes("hero-peek")],
  ["reveal stagger", css.includes("transition-delay: 0.12s")],
  ["scroll reduced motion", css.includes(".scroll-progress { display: none; }") && js.includes("if (!prefersReducedMotion && progressFill)")],
  ["hero stays in document flow", !html.includes('id="heroScrub"') && !js.includes("heroScrubOn") && !css.includes(".hero-scrub.is-scrub")],
  ["reveal variants", html.includes('data-reveal="blur"') && html.includes('data-reveal="scale"') && html.includes('data-reveal="left"') && css.includes('[data-reveal="blur"]') && css.includes(".grid--2 > [data-reveal]:nth-child(odd)")],
  ["faq cascade", html.includes('<details class="faq__item" data-reveal>') && css.includes(".faq__list > [data-reveal]:nth-child(7)")],
  ["faq covers effect, data and procurement", ["Hur vet vi att det ger effekt?", "Vad händer med vår data?", "Kan ni avropas via ramavtal?"].every((q) => html.split(q).length === 3)],
  ["no untested delivery-time promises", !/inom (två veckor|dagar|[0-9]+ (dagar|veckor))/i.test(html)],
  ["no 'produktion' cliché", !/produktion/i.test(html) && !/produktion/i.test(js)],
  ["no 'tränade på' claim", !html.includes("tränade på")],
  ["hero tools line removed", !html.includes("hero__tools") && !css.includes(".hero__tools")],
  ["meta speaks to large organisations", html.includes('<meta name="description" content="Vectorpoint hjälper stora organisationer') && html.includes('"legalName": "Vector Point AB"')],
  ["skip link and focus styles", html.includes('class="skip-link"') && css.includes(":focus-visible")],
  ["footer heading level", html.includes("<h3>Kontakt</h3>") && !html.includes("<h4>")],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  throw new Error(`Smoke test failed: ${failed.map(([name]) => name).join(", ")}`);
}

console.log(`Smoke test passed (${checks.length} checks).`);
