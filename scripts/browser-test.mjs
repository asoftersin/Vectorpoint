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
  check(await page.locator(".nav__cta").evaluate((el) => getComputedStyle(el).columnGap === "0px"),
    "Booking label keeps normal word spacing when the long label is shown");
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
  check(!await page.locator("#demoReport .demo__pause").isVisible(), "Reduced motion has no unnecessary pause control");
  await page.locator("#demoReport .demo__replay").click();
  await page.waitForFunction(() => document.querySelector("#demoReport").classList.contains("is-done"));
  check(true, "Replay still completes");
  await page.evaluate(() => {
    document.querySelector("#tab-feedback").click();
    document.querySelector("#tab-report").click();
  });
  await page.waitForFunction(() => document.querySelector("#demoReport").classList.contains("is-done"));
  check(true, "Rapid hide and restore between observer frames restarts the demo");

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

  check(await page.locator("#tools .tools__item:visible").count() === 6, "Six familiar systems are shown initially");
  await page.locator("#moreTools summary").focus();
  await page.keyboard.press("Enter");
  check(await page.locator("#tools .tools__item:visible").count() === 15, "Keyboard reveals all fifteen tools");
  check(await page.locator("#moreTools summary").innerText() === "Visa färre verktyg", "Expanded label offers collapse");
  await page.keyboard.press("Space");
  check(await page.locator("#tools .tools__item:visible").count() === 6, "Keyboard collapses the secondary tools");

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
  for (const width of [320, 375, 390]) {
    await mobilePage.setViewportSize({ width, height: 812 });
    check(await mobilePage.locator(".nav__inner").evaluate((nav) => {
      const controls = [".nav__logo", ".nav__cta", ".nav__burger"]
        .map((selector) => nav.querySelector(selector).getBoundingClientRect());
      return controls.every((rect, i) => rect.left >= 0 && rect.right <= innerWidth &&
        (i === 0 || rect.left >= controls[i - 1].right));
    }), `Header controls fit without overlap at ${width}px`);
    check(await mobilePage.locator("#navBurger").evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }), `Menu keeps a 44px touch target at ${width}px`);
    await mobilePage.locator("#navBurger").click();
    check(await mobilePage.locator("#navBurger").getAttribute("aria-expanded") === "true",
      `Menu opens at ${width}px`);
    await mobilePage.locator("#mobileNav a[href='#work']").click();
    check(await mobilePage.locator("#navBurger").getAttribute("aria-expanded") === "false",
      `Menu closes after navigation at ${width}px`);
  }
  await mobile.close();

  const noJs = await newContext({ javaScriptEnabled: false });
  const fallback = await noJs.newPage();
  await fallback.goto(url);
  check(!await fallback.locator("#exampleTabs").isVisible(), "No dead tab controls without JS");
  check(await fallback.locator(".demo__controls:visible").count() === 0, "No dead playback controls without JS");
  for (const id of ["leads", "feedback", "report"]) {
    check(await fallback.locator(`#work-${id}`).isVisible(), `No-JS ${id} content remains readable`);
  }
  await fallback.locator("#pipeline summary").click();
  check(await fallback.locator("#flowSvg4").isVisible(), "Native disclosure works without JS");
  await fallback.locator("#moreTools summary").click();
  check(await fallback.locator("#tools .tools__item:visible").count() === 15, "All tools are accessible without JS");
  await fallback.setViewportSize({ width: 375, height: 812 });
  check(await fallback.locator("#work-leads .demo-steps__item p").first().isVisible(),
    "Mobile no-JS fallback exposes the step descriptions");
  await noJs.close();

  const animated = await newContext({ reducedMotion: "no-preference" });
  const motionPage = await animated.newPage();
  await motionPage.goto(url);
  check(await motionPage.locator(".hero").evaluate((el) =>
    el.getBoundingClientRect().height <= innerHeight && getComputedStyle(el).position !== "sticky"),
    "Desktop hero fits one viewport without pinning");
  const heroTop = await motionPage.locator(".hero").evaluate((el) => el.getBoundingClientRect().top);
  await motionPage.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
  check(await motionPage.locator(".hero").evaluate((el) => el.getBoundingClientRect().top) <= heroTop - 199,
    "Hero scrolls away immediately with the document");
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
  for (const [tab, id] of [["leads", "demoLeads"], ["feedback", "demoFeedback"], ["report", "demoReport"]]) {
    await motionPage.locator(`#tab-${tab}`).click();
    const demo = motionPage.locator(`#${id}`);
    await demo.scrollIntoViewIfNeeded();
    await motionPage.waitForFunction(({ id, tab }) => {
      const body = document.querySelector(`#${id} .demo__body`);
      return tab === "leads" ? body.querySelector(".lead.is-in") : body.querySelector(".is-typing");
    }, { id, tab });
    const toggle = demo.locator(".demo__pause");
    await toggle.focus();
    await toggle.press("Space");
    check(await toggle.textContent() === "Fortsätt", `${tab}: keyboard pauses with a clear resume action`);
    await motionPage.evaluate(() => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const pausedState = await demo.evaluate((el) => ({
      body: el.querySelector(".demo__body").innerHTML,
      status: el.querySelector("[data-status]").textContent,
      steps: [...el.closest(".demo-block").querySelectorAll(".demo-steps__item")].map((step) => step.className),
      animations: el.querySelector(".demo__body").getAnimations({ subtree: true }).map((animation) => animation.currentTime),
    }));
    await motionPage.waitForTimeout(1000);
    const stillPaused = await demo.evaluate((el) => ({
      body: el.querySelector(".demo__body").innerHTML,
      status: el.querySelector("[data-status]").textContent,
      steps: [...el.closest(".demo-block").querySelectorAll(".demo-steps__item")].map((step) => step.className),
      animations: el.querySelector(".demo__body").getAnimations({ subtree: true }).map((animation) => animation.currentTime),
    }));
    check(JSON.stringify(stillPaused) === JSON.stringify(pausedState),
      `${tab}: pause freezes DOM, status, steps and visual animations`);
    const originalNode = await demo.locator(".demo__body > *").first().elementHandle();
    await toggle.press("Enter");
    check(await originalNode.evaluate((el) => el.isConnected), `${tab}: resume preserves the existing demo`);
    await motionPage.waitForFunction(({ id, html }) =>
      document.querySelector(`#${id} .demo__body`).innerHTML !== html, { id, html: pausedState.body });
    check(await toggle.textContent() === "Pausa", `${tab}: progress continues after resume`);
    await toggle.click();
    await demo.locator(".demo__replay").click();
    check(!await originalNode.evaluate((el) => el.isConnected), `${tab}: replay deliberately starts fresh`);
    check(!await demo.evaluate((el) => el.classList.contains("is-paused")), `${tab}: replay clears pause`);
  }
  const report = motionPage.locator("#demoReport");
  await report.locator(".demo__pause").click();
  await motionPage.evaluate(() => {
    document.querySelector("#tab-feedback").click();
    document.querySelector("#tab-report").click();
  });
  await report.scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() =>
    document.querySelector("#work-report .demo-steps__item.is-active") !== null);
  check(!await report.evaluate((el) => el.classList.contains("is-paused")),
    "Rapid tab switches cancel a paused timer and restart unpaused");
  await motionPage.waitForFunction(() => document.querySelector("#demoReport").classList.contains("is-done"),
    null, { timeout: 60000 });
  await report.locator(".demo__pause").click();
  const completedReport = await report.locator(".demo__body").innerHTML();
  await motionPage.waitForTimeout(12500);
  check(await report.locator(".demo__body").innerHTML() === completedReport,
    "Pausing a completed demo also freezes the automatic replay delay");
  await report.locator(".demo__pause").click();
  await motionPage.waitForTimeout(500);
  check(await report.evaluate((el) => el.classList.contains("is-done")),
    "Resuming keeps the remaining delay instead of immediately replaying");
  await motionPage.waitForFunction(() => !document.querySelector("#demoReport").classList.contains("is-done"),
    null, { timeout: 14000 });
  check(true, "Automatic replay resumes after its remaining delay");
  await motionPage.setViewportSize({ width: 320, height: 812 });
  await report.scrollIntoViewIfNeeded();
  check(await report.locator(".demo__controls").evaluate((el) => {
    const controls = [...el.querySelectorAll("button")].map((button) => button.getBoundingClientRect());
    return controls.every((rect, i) => rect.left >= 0 && rect.right <= innerWidth && rect.height >= 44 &&
      (i === 0 || rect.left >= controls[i - 1].right));
  }), "Both playback controls fit at 320px with 44px touch targets");
  await motionPage.setViewportSize({ width: 1400, height: 900 });
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
