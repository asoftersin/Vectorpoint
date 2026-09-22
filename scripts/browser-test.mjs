import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const server = spawn(process.execPath, ["scripts/preview-server.mjs", "0"], {
  stdio: ["ignore", "pipe", "pipe"],
});
let browser;
let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};

try {
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Preview did not start")), 10000);
    let output = "";
    let errors = "";
    server.stderr.on("data", (data) => { errors += data; });
    server.on("error", (error) => { clearTimeout(timeout); reject(error); });
    server.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Preview exited (${code}): ${errors}`));
    });
    server.stdout.on("data", (data) => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    });
  });
  browser = await chromium.launch();
  const errors = [];
  const newContext = async (options = {}) => {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      reducedMotion: "reduce",
      ...options,
    });
    // Exercise only local content, never send test bookings or analytics.
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
      return route.fulfill({ status: 200, body: "" });
    });
    context.on("page", (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
    });
    return context;
  };
  const context = await newContext();
  const page = await context.newPage();
  await page.goto(url);
  const tabs = page.getByRole("tab");
  const panels = page.getByRole("tabpanel");
  check(await tabs.count() === 3, "Three named example tabs");
  check(await panels.count() === 1, "Only one panel is exposed to assistive technology");
  check(await page.locator("#work-leads").isVisible(), "Sales is selected by default");
  check(await page.locator("#prototype").isVisible(), "Offer is outside hidden examples");
  check(await page.locator(".builder-proof").isVisible(), "Early founder proof is present");
  for (const selector of [".builder-proof img", ".about__avatar img"]) {
    check(await page.locator(selector).evaluate((img) => {
      const style = getComputedStyle(img);
      const rect = img.getBoundingClientRect();
      return style.objectFit === "cover" && style.objectPosition === "50% 0%" &&
        Math.abs(rect.width - rect.height) < 1;
    }), `${selector} uses a square, top-aligned portrait crop with headroom`);
  }
  await tabs.nth(1).click();
  check(await page.locator("#work-feedback").isVisible(), "Click opens support");
  check(!await page.locator("#work-leads").isVisible(), "Previous example is hidden");
  check(await tabs.nth(1).getAttribute("aria-selected") === "true", "Selection is announced");
  await tabs.nth(1).press("ArrowRight");
  check(await page.locator("#work-report").isVisible(), "Right arrow selects reporting");
  check(await tabs.nth(2).evaluate((el) => el === document.activeElement), "Focus follows selection");
  await tabs.nth(2).press("ArrowRight");
  check(await page.locator("#work-leads").isVisible(), "Right arrow wraps");
  await tabs.nth(0).press("ArrowLeft");
  check(await page.locator("#work-report").isVisible(), "Left arrow wraps");
  await tabs.nth(2).press("Home");
  check(await tabs.nth(0).getAttribute("tabindex") === "0", "Home selects the first tab");
  await tabs.nth(0).press("End");
  check(await tabs.nth(2).getAttribute("tabindex") === "0", "End selects the last tab");
  check(await page.locator('[role="tab"][tabindex="0"]').count() === 1, "One tab stop");
  await tabs.nth(2).press("Tab");
  check(await page.locator("#work-report").evaluate((el) => el === document.activeElement), "Tab enters the active panel");
  await page.locator("#demoReport").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#demoReport").classList.contains("is-done"));
  check(await page.locator("#demoReport .demo__body").innerText() !== "", "Selected demo completes in reduced motion");
  await page.locator("#demoReport .demo__replay").click();
  await page.waitForFunction(() => document.querySelector("#demoReport").classList.contains("is-done"));
  check(true, "Replay still completes");

  await page.goto(`${url}#work-feedback`);
  check(await page.locator("#work-feedback").isVisible(), "Initial direct link opens support");
  await page.evaluate(() => { window.location.hash = "work-report"; });
  await page.waitForFunction(() => !document.querySelector("#work-report").hidden);
  check(await tabs.nth(2).getAttribute("aria-selected") === "true", "Hash changes select the matching tab");
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector("#work-feedback").hidden);
  check(true, "Browser back restores the linked example");

  const disclosure = page.locator("#pipeline");
  check(!await disclosure.evaluate((el) => el.open), "Technical detail starts closed");
  check(!await page.locator("#flowSvg4").isVisible(), "Diagram is inside the disclosure");
  await disclosure.locator("summary").focus();
  await page.keyboard.press("Enter");
  check(await page.locator("#flowSvg4").isVisible(), "Keyboard opens the diagram");
  await page.keyboard.press("Space");
  check(!await page.locator("#flowSvg4").isVisible(), "Keyboard closes the diagram");
  const faqMatches = await page.evaluate(() => {
    const schema = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((el) => JSON.parse(el.textContent)).find((data) => data["@type"] === "FAQPage");
    return [...document.querySelectorAll(".faq__item")].every((el, i) =>
      el.querySelector("p").textContent.trim() === schema.mainEntity[i].acceptedAnswer.text);
  });
  check(faqMatches, "FAQ copy and structured data agree");

  await page.goto(url);
  await page.locator("#askInput").fill("Test av ett manuellt moment");
  const popupPromise = page.waitForEvent("popup");
  await page.locator('#askForm button[type="submit"]').click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  const booking = new URL(popup.url());
  check(booking.origin === "https://cal.com", "Booking uses the existing provider");
  check(booking.searchParams.get("notes").startsWith("Test av ett manuellt moment"), "Booking carries the visitor's text");
  await popup.close();
  await context.close();

  const mobile = await newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url);
  for (const id of ["leads", "feedback", "report"]) {
    await mobilePage.locator(`#tab-${id}`).click();
    check(await mobilePage.locator(`#work-${id}`).isVisible(), `Mobile ${id} panel opens`);
    check(await mobilePage.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth), `Mobile ${id} has no horizontal overflow`);
    check(await mobilePage.locator("#prototype").isVisible(), "Mobile offer stays available");
  }
  await mobilePage.locator("#pipeline summary").click();
  check(await mobilePage.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth), "Mobile diagram scroll stays inside its container");
  await mobilePage.setViewportSize({ width: 320, height: 812 });
  await mobilePage.locator("#exampleTabs").scrollIntoViewIfNeeded();
  check(await mobilePage.locator("#exampleTabs").evaluate((el) =>
    el.scrollWidth <= el.clientWidth), "Tabs fit a 320px viewport");
  await mobile.close();

  const noJs = await newContext({ javaScriptEnabled: false });
  const fallback = await noJs.newPage();
  await fallback.goto(url);
  check(!await fallback.locator("#exampleTabs").isVisible(), "No dead tab controls without JS");
  for (const id of ["leads", "feedback", "report"]) {
    check(await fallback.locator(`#work-${id}`).isVisible(), `No-JS ${id} content remains readable`);
  }
  await fallback.locator("#pipeline summary").click();
  check(await fallback.locator("#flowSvg4").isVisible(), "Native disclosure works without JS");
  await fallback.setViewportSize({ width: 375, height: 812 });
  check(await fallback.locator("#work-leads .demo-steps__item p").first().isVisible(),
    "Mobile no-JS fallback exposes the step descriptions");
  await noJs.close();

  const animated = await newContext({ reducedMotion: "no-preference" });
  const motionPage = await animated.newPage();
  await motionPage.goto(url);
  await motionPage.locator("#demoLeads").scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector("#demoLeads .demo__body").children.length > 0);
  await motionPage.locator("#tab-feedback").click();
  const stoppedDemo = await motionPage.locator("#demoLeads .demo__body").innerText();
  await motionPage.waitForTimeout(800);
  check(await motionPage.locator("#demoLeads .demo__body").innerText() === stoppedDemo, "Hidden demo stops changing");
  await motionPage.locator("#tab-leads").click();
  await motionPage.locator("#demoLeads").scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector("#work-leads .demo-steps__item.is-active") !== null);
  check(true, "Returning to a cancelled example restarts it");
  await motionPage.locator("#pipeline summary").click();
  await motionPage.locator("#flowSvg4").scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector("#flowSvg4 .node.is-active") !== null);
  await motionPage.locator("#pipeline summary").click();
  await motionPage.waitForFunction(() => [...document.querySelectorAll("#flowSvg4 .pulse")]
    .every((el) => el.style.opacity === "0"));
  const intro = await motionPage.locator("#flowCaption4").textContent();
  await motionPage.waitForTimeout(900);
  check(await motionPage.locator("#flowCaption4").textContent() === intro, "Closed diagram stops animating");
  check(intro.startsWith("Följ en ändring"), "Closed diagram restores its intro");
  await motionPage.locator("#pipeline summary").click();
  await motionPage.locator("#flowSvg4").scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => !document.querySelector("#flowCaption4").textContent.startsWith("Följ en ändring"));
  check(true, "Reopening restarts the diagram");
  await animated.close();
  check(errors.length === 0, `No browser errors: ${errors.join("; ")}`);
  console.log(`Browser tests passed (${checks} checks).`);
} finally {
  if (browser) await browser.close();
  server.kill();
}
