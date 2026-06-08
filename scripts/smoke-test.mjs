import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "assets/vectorpoint-horizon.png",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const html = await readFile("index.html", "utf8");
const css = await readFile("styles.css", "utf8");
const js = await readFile("script.js", "utf8");

const checks = [
  ["hero headline", html.includes("Från manuellt arbete till självkörande processer.")],
  ["LinkedIn CTA", html.includes("https://www.linkedin.com/in/johan-studt/")],
  ["single hero CTA", !html.includes("Se upplägget") && !html.includes("secondary-action") && !css.includes("secondary-action")],
  ["header nav removed", !html.includes("nav-links") && !html.includes('href="#offer"') && !html.includes('href="#contact"')],
  ["business-known process CTA", html.includes("Har ni redan en arbetsprocess som borde gå snabbare?")],
  ["white page shell", html.includes("preview-stage") && html.includes("browser-frame") && !html.includes("Live preview")],
  ["outer preview chrome removed", css.includes("box-shadow: none") && css.includes("width: 100%")],
  ["offer section renamed", html.includes(">Fokus<") && !html.includes(">Erbjudande<")],
  ["horizon asset", html.includes("assets/vectorpoint-horizon.png") || css.includes("assets/vectorpoint-horizon.png")],
  ["workflow nodes", html.includes("data-node") && html.includes("agent-node")],
  ["edge connector paths", html.includes("path-input-agent") && js.includes("positionConnectors")],
  ["polished agent card", html.includes("agent-status") && html.includes("flow-arrow") && css.includes("marker-end: url(#flow-arrow)")],
  ["method section removed", !html.includes('id="method"') && !html.includes('href="#method"') && !html.includes("Arbetssätt")],
  ["load animation hook", js.includes("vectorpoint-loaded")],
  ["reduced motion support", css.includes("prefers-reduced-motion")],
  ["responsive layout", css.includes("@media")],
];

const failed = checks.filter(([, passed]) => !passed);

if (failed.length) {
  throw new Error(`Smoke test failed: ${failed.map(([name]) => name).join(", ")}`);
}

console.log(`Smoke test passed (${checks.length} checks).`);
