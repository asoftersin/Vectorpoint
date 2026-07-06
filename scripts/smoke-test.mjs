import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "assets/hero-bg.mp4",
  "assets/hero-bg-poster.jpg",
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
  ["hero headline", html.includes("Från manuellt arbete till självkörande processer.")],
  ["LinkedIn CTA", html.includes("https://www.linkedin.com/in/johan-studt/")],
  ["nav links", html.includes('href="#services"') && html.includes('href="#faq"')],
  ["mobile menu", html.includes('id="navBurger"') && js.includes("navBurger")],
  ["services section", html.includes('id="services"') && html.includes("AI-strategi")],
  ["stats section", html.includes("stat__count") && js.includes("runCounter")],
  ["workflow svg", html.includes('id="flowSvg"') && html.includes("wire-s6") && html.includes("wire-c4")],
  ["pipeline example", html.includes("Gruppera per PO") && html.includes("FREDAG 09:00")],
  ["leadgen flow", html.includes('id="flowSvg2"') && html.includes("HubSpot CRM") && html.includes("People Data Labs")],
  ["backlog-qa flow", html.includes('id="flowSvg3"') && html.includes("Kunskapsbas") && html.includes("PLAYWRIGHT")],
  ["learning loop", html.includes("wire3-loop") && html.includes("LÄRDOMAR")],
  ["multi-flow engine", js.includes("FLOWS") && js.includes("setupFlow")],
  ["work anchor", html.includes('id="work"') && html.includes('href="#work"')],
  ["flow animation", js.includes("getPointAtLength") && js.includes("runPhase")],
  ["approach section", html.includes('id="approach"') && html.includes("Kartlägg")],
  ["principles section", html.includes('id="principles"') && html.includes("Säkerhet först")],
  ["faq accordion", html.includes('class="faq__item"') && html.includes("<details")],
  ["marquee", html.includes("marquee__track") && css.includes("@keyframes marquee")],
  ["hero video", html.includes("assets/hero-bg.mp4") && html.includes("playsinline") && js.includes("heroVideo")],
  ["no external js deps", !html.includes("cdn.jsdelivr.net")],
  ["design tokens", css.includes("--accent: #0099ff") && css.includes("Gasoek One")],
  ["load hook", js.includes("vectorpoint-loaded")],
  ["reveal on scroll", css.includes("[data-reveal]") && js.includes("IntersectionObserver")],
  ["reduced motion support", css.includes("prefers-reduced-motion") && js.includes("prefers-reduced-motion")],
  ["responsive layout", css.includes("@media")],
  ["booking cta", html.includes("https://cal.com/") && html.includes('data-goatcounter-click="cta-hero"')],
  ["analytics snippet", html.includes("data-goatcounter=") && html.includes("gc.zgo.at/count.js")],
  ["no placeholders left", !html.includes("PLACEHOLDER")],
  ["favicon link", html.includes('rel="icon"') && html.includes("favicon.svg")],
  ["og image", html.includes('property="og:image"') && html.includes("assets/og-image.png")],
  ["twitter card", html.includes('name="twitter:card"')],
  ["canonical", html.includes('rel="canonical"') && html.includes("https://vectorpoint.se/")],
  ["json-ld", html.includes("application/ld+json") && html.includes("ProfessionalService")],
  ["faq schema", html.includes('"FAQPage"') && html.includes("Hur snabbt kan vi se resultat?")],
  ["difference section", html.includes('id="difference"') && html.includes("Integrationstester") && html.includes("Uppföljningsbart")],
  ["about section", html.includes('id="about"') && html.includes("Johan Studt") && css.includes(".about__inner")],
  ["game removed", !html.includes("hitta-felet") && !sitemap.includes("hitta-felet") && !existsSync("hitta-felet")],
  ["pipeline flow", html.includes('id="flowSvg4"') && html.includes("ISOLERAT PR-NAMESPACE") && html.includes("INT_TEST_URL")],
  ["pipeline flow config", js.includes("flowSvg4") && js.includes("wire4-o2") && css.includes(".flow__boundary")],
  ["scroll progress", html.includes('id="scrollProgressFill"') && css.includes(".scroll-progress__fill")],
  ["pipeline scrub", js.includes("buildScrubber") && js.includes("is-scrub") && css.includes("#pipeline.is-scrub") && html.includes('id="pipelineSticky"')],
  ["hero scroll cue", html.includes('id="heroCue"') && css.includes("cueTick")],
  ["reveal stagger", css.includes("transition-delay: 0.12s")],
  ["scroll reduced motion", css.includes(".scroll-progress { display: none; }") && js.includes("scrubEnabled = !prefersReducedMotion")],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  throw new Error(`Smoke test failed: ${failed.map(([name]) => name).join(", ")}`);
}

console.log(`Smoke test passed (${checks.length} checks).`);
