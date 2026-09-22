# Vectorpoint

Static GitHub Pages landing page for `vectorpoint.se`.

## Local Preview

Open `index.html` directly in a browser, or serve the folder locally:

```bash
npm run preview
```

## Verify

```bash
node scripts/smoke-test.mjs
```

For browser regression coverage (starts its own local preview server):

```sh
npm run test:browser
```

The browser checks cover example tabs (mouse, keyboard and direct links), mobile
layout, demo pause/resume, reduced motion, optional disclosures, booking handoff and the no-JS
fallback. Install Playwright Chromium with `npx playwright install chromium` if
the browser executable is missing.

## Page behaviour and measurement

The hero scrolls with the document rather than pinning visitors through an
animation. Its headline keeps each sentence on one line, the founder's portrait
and background sit directly under the lead, and wide screens (1100px and up)
show a small, clearly fictional lead card that links to `#work-leads`. While the
hero form is visible the header booking button is an outline, so the form is the
single primary action; it turns primary once the form scrolls away. The 1.9 MB
background video is only attached on screens 861px and wider, without reduced
motion or data saving; everyone else sees the preloaded poster image.
On narrow screens the header shortens its booking label while
keeping the booking link and a 44px menu button visible.
Six familiar systems appear first; a native "Visa alla" disclosure exposes the
remaining tools, including without JavaScript.

The examples start as readable sections. JavaScript enhances them into tabs;
`#work-leads`, `#work-feedback` and `#work-report` still open the relevant example.
Hidden examples stop replaying. The QA diagram lives in a native disclosure and
only animates while it is open and in view.
Each demo has pause/resume and replay controls. Pausing preserves the current
step, typing progress, visual animations and remaining replay delay. Replay
starts afresh; switching tabs cancels the hidden demo and resets its pause state.
Reduced motion shows the completed example without looping or a pause button.
Playback controls stay hidden when JavaScript is unavailable.

GoatCounter tracks booking-link clicks (`cta-*`) and example clicks
(`example-sales`, `example-support`, `example-reporting`). These are intent
events, **not confirmed bookings**. Count completed meetings separately in
Cal.com; the site does not receive booking confirmations. Form text is handed
to Cal.com, not included in custom analytics event names.
