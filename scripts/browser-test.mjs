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
      permissions: ["clipboard-read", "clipboard-write"],
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
  const onFirstScreen = (p, selector) => p.locator(selector).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height > 0 && rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth;
  });
  check(await page.locator("main > section").first().getAttribute("id") === "hero", "The hero is the first thing on the page");
  for (const [selector, what] of [[".hero__title", "what we do"], ["#heroCta", "the booking button"],
    [".founder", "the founder card"], ['.founder a[href^="mailto:"]', "a direct email address"]]) {
    check(await onFirstScreen(page, selector), `Desktop first screen shows ${what}`);
  }
  check(await onFirstScreen(page, ".clients") && await page.locator(".clients img").evaluateAll((imgs) =>
    imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0)) &&
    await page.locator(".clients__list li").count() === 3, "Desktop first screen names the clients, with their logos loaded");
  check(await page.locator(".founder__photo").evaluate((img) =>
    img.complete && img.naturalWidth > 0 && getComputedStyle(img).objectFit === "cover"), "Founder portrait loads and is cropped, not stretched");
  check(await page.locator("#heroCta").getAttribute("href") === "https://cal.com/johan-studt/15min" &&
    await page.locator("#heroCta").getAttribute("target") === "_blank", "Hero button books in a new tab, keeping the page open");
  check(await page.evaluate(() => {
    const rgb = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => {
      const [hi, lo] = [lum(rgb(a)), lum(rgb(b))].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const page = getComputedStyle(document.body).backgroundColor;
    const probe = document.createElement("span");
    document.body.append(probe);
    const ok = ["--text", "--text-dim", "--muted", "--accent"].every((token) => {
      probe.style.color = `var(${token})`;
      return contrast(getComputedStyle(probe).color, page) >= 4.5;
    });
    probe.remove();
    return ok && lum(rgb(page)) > 0.8;
  }), "The page is light and every text colour keeps at least 4.5:1 contrast on it");
  check(await page.locator("#launchFilm").evaluate((video) => !video.getAttribute("src") && !video.controls) &&
    await page.locator("#filmSound").textContent() === "Spela filmen",
    "Launch film waits for a click when the visitor prefers reduced motion");
  const navCtaBackground = () => page.locator(".nav__cta").evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.waitForFunction(() => document.getElementById("siteNav").classList.contains("is-hero-cta"));
  check(await navCtaBackground() === "rgba(0, 0, 0, 0)", "Header booking button is a quiet outline while the hero button is visible");
  await page.evaluate(() => scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
  await page.waitForFunction(() => !document.getElementById("siteNav").classList.contains("is-hero-cta"));
  check(await navCtaBackground() === "rgb(21, 23, 26)", "Header booking button turns primary once the hero button scrolls away");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
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
  await page.locator('.nav__links a[href="#kontakt"]').click();
  await page.waitForFunction(() => {
    const rect = document.getElementById("kontakt").getBoundingClientRect();
    return rect.top < innerHeight / 2 && rect.bottom > innerHeight / 2;
  });
  check(true, "Header contact link lands on the contact section");
  const ways = page.locator("#kontakt .contact__ways a");
  check(await ways.count() === 3 && await ways.evaluateAll((links) => links.map((a) => a.getAttribute("href")).join(" ") ===
    "https://cal.com/johan-studt/15min mailto:johan@vectorpoint.se https://www.linkedin.com/in/johan-studt/"),
    "Contact section offers booking, email and LinkedIn");
  check(await page.locator("#kontakt .contact__person img").evaluate((img) => img.complete && img.naturalWidth > 0),
    "Contact section shows who you are writing to");
  check(await page.locator("#copyEmail").isVisible(), "Copy button appears when the clipboard is available");
  await page.locator("#copyEmail").click();
  await page.waitForFunction(() => document.getElementById("copyEmail").textContent === "Kopierad");
  check(await page.evaluate(() => navigator.clipboard.readText()) === "johan@vectorpoint.se", "Copy button puts the address on the clipboard");
  check(await page.locator("#askInput").evaluate(() => {
    const tops = [...document.querySelectorAll(".ask__chip")].map((chip) => Math.round(chip.getBoundingClientRect().top));
    return tops.length === 3 && new Set(tops).size === 1;
  }), "All three example chips share one row on desktop");
  check(await page.locator("#askMail").getAttribute("href") === "mailto:johan@vectorpoint.se", "Email button is a plain mailto link while the field is empty");
  await page.locator(".ask__chip").first().click();
  check(await page.locator("#askInput").inputValue() === "Säker AI för alla medarbetare", "Example chip fills the contact field");
  await page.locator("#askInput").fill("Test av ett manuellt moment\nmed en rad till");
  const mail = new URL(await page.locator("#askMail").getAttribute("href"));
  check(mail.protocol === "mailto:" && mail.pathname === "johan@vectorpoint.se" &&
    mail.searchParams.get("subject") === "Test av ett manuellt moment med en rad till" &&
    mail.searchParams.get("body") === "Test av ett manuellt moment\nmed en rad till", "Email button carries the visitor's text as subject and body");
  const popupPromise = page.waitForEvent("popup");
  await page.locator('#askForm button[type="submit"]').click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  const booking = new URL(popup.url());
  check(booking.origin === "https://cal.com", "Booking uses the existing provider");
  check(booking.searchParams.get("notes").replace(/\r/g, "").startsWith("Test av ett manuellt moment\nmed en rad till"), "Booking carries the visitor's text");
  check(booking.searchParams.get("title") === "Test av ett manuellt moment med en rad till", "Booking title is the text on one line");
  await popup.close();
  check(await page.locator("#askInput").inputValue() === "Test av ett manuellt moment\nmed en rad till",
    "The field keeps what the visitor wrote after the booking tab opens");
  await context.close();

  const mobile = await newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url);
  for (const [selector, what] of [[".hero__title", "what we do"], ["#heroCta", "the booking button"], [".nav__cta", "the header booking button"]]) {
    check(await onFirstScreen(mobilePage, selector), `Phone first screen shows ${what}`);
  }
  check(await mobilePage.locator(".founder").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < innerHeight && rect.top >= document.querySelector(".hero__main").getBoundingClientRect().bottom;
  }), "Phone first screen reaches the founder card below the text");
  check(await mobilePage.locator(".clients").evaluate((el) =>
    el.getBoundingClientRect().top >= document.querySelector(".founder").getBoundingClientRect().bottom) &&
    await mobilePage.locator(".clients__list li").evaluateAll((items) => {
      const rects = items.map((li) => li.getBoundingClientRect());
      const centres = rects.map((rect) => rect.top + rect.height / 2);
      return rects.every((rect) => rect.left >= 0 && rect.right <= innerWidth) &&
        Math.max(...centres) - Math.min(...centres) < 2;
    }), "On a phone the clients follow the founder card, centred on one row");
  check(await mobilePage.locator(".founder a").evaluateAll((links) =>
    links.every((a) => a.getBoundingClientRect().height >= 36)), "Founder card links are comfortable touch targets");
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
  for (const width of [320, 375, 390, 600, 768, 1024, 1100, 1180, 1280, 1400]) {
    await mobilePage.setViewportSize({ width, height: 900 });
    await mobilePage.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    check(await mobilePage.locator(".hero__line").evaluateAll((lines) => lines.every((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      const text = range.getBoundingClientRect();
      const box = line.getBoundingClientRect();
      return text.height < parseFloat(getComputedStyle(line).lineHeight) * 1.5 && text.right <= box.right + 1;
    })), `Each hero sentence stays on one line inside its column at ${width}px`);
    check(await mobilePage.locator(".founder").evaluate((card, wide) => {
      const rect = card.getBoundingClientRect();
      const main = document.querySelector(".hero__main").getBoundingClientRect();
      if (rect.height === 0 || rect.left < 0 || rect.right > innerWidth) return false;
      return wide ? rect.left >= main.right + 24 && rect.bottom <= innerHeight : rect.top >= main.bottom;
    }, width >= 1000), `Founder card is ${width >= 1000 ? "beside the text on the first screen" : "below the text"} at ${width}px`);
    check(await mobilePage.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow at ${width}px`);
  }
  for (const width of [320, 375, 390, 768, 1024]) {
    await mobilePage.setViewportSize({ width, height: 900 });
    await mobilePage.locator("#kontakt").scrollIntoViewIfNeeded();
    check(await mobilePage.locator('#kontakt .contact__ways a[href^="mailto:"]').evaluate((a) =>
      a.getClientRects().length === 1), `Email address stays on one line in the contact card at ${width}px`);
    check(await mobilePage.locator("#kontakt .ask__actions > *").evaluateAll((controls) => controls.every((el) => {
      const rect = el.getBoundingClientRect();
      return rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth;
    })), `Contact actions fit with 44px touch targets at ${width}px`);
  }
  await mobile.close();

  const noJs = await newContext({ javaScriptEnabled: false });
  const fallback = await noJs.newPage();
  await fallback.goto(url);
  check(await fallback.locator("#launchFilm").evaluate((video) => video.controls && video.getAttribute("src") === "assets/launch/film.mp4") &&
    !await fallback.locator("#filmSound").isVisible(), "Without JS the launch film keeps native controls and no dead sound button");
  check(await fallback.locator("#askMail").getAttribute("href") === "mailto:johan@vectorpoint.se" &&
    !await fallback.locator("#copyEmail").isVisible() && await fallback.locator("#kontakt .contact__ways a:visible").count() === 3,
    "Without JS every contact route still works and no dead copy button shows");
  check(await fallback.locator(".founder").isVisible() && await fallback.locator("#heroCta").isVisible(),
    "Without JS the hero still shows the founder and the booking button");
  check(await fallback.locator("[data-reveal]").evaluateAll((els) => els.length > 20 && els.every((el) => {
    const style = getComputedStyle(el);
    return style.opacity === "1" && style.transform === "none" && style.filter === "none";
  })), "Without JS nothing waits for a scroll reveal that will never come");
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
  check(await motionPage.locator(".hero [data-reveal]").evaluateAll((els) =>
    els.length >= 5 && els.every((el) => el.classList.contains("is-visible") && getComputedStyle(el).opacity === "1")),
    "With motion the first screen is shown at once, without fading in");
  // Sections further down fade out off screen first, then wait for the scroll.
  await motionPage.waitForFunction(() => {
    const el = document.querySelector("#faq [data-reveal]");
    return !el.classList.contains("is-visible") && getComputedStyle(el).opacity === "0";
  });
  check(true, "With motion later sections wait for the scroll");
  check(await motionPage.locator("#launchFilm").getAttribute("src") === null,
    "Launch film is not fetched before it scrolls into view");
  await motionPage.locator("#film .film").scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.getElementById("launchFilm").getAttribute("src") !== null);
  check(await motionPage.locator("#launchFilm").evaluate((video) =>
    video.getAttribute("src") === "assets/launch/film.mp4" && video.muted && video.loop) &&
    await motionPage.locator("#filmSound").textContent() === "Ljud på",
    "Launch film loops muted in 16:9 on a landscape screen");
  await motionPage.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const narrowMotionPage = await animated.newPage();
  await narrowMotionPage.setViewportSize({ width: 390, height: 844 });
  await narrowMotionPage.goto(url);
  await narrowMotionPage.locator("#film .film").scrollIntoViewIfNeeded();
  await narrowMotionPage.waitForFunction(() => document.getElementById("launchFilm").getAttribute("src") !== null);
  check(await narrowMotionPage.locator("#launchFilm").evaluate((video) =>
    video.getAttribute("src") === "assets/launch/film-v.mp4" && video.poster.endsWith("assets/launch/poster-v.jpg")),
    "Launch film switches to the 9:16 cut on a portrait phone");
  check(await narrowMotionPage.locator("#film .film").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.height <= innerHeight * 0.8 &&
      Math.abs(rect.width / rect.height - 9 / 16) < 0.01;
  }), "9:16 film keeps its shape and leaves room around it on a phone");
  await narrowMotionPage.close();
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
