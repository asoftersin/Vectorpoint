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
layout, reduced motion, the optional QA diagram, booking handoff and the no-JS
fallback. Install Playwright Chromium with `npx playwright install chromium` if
the browser executable is missing.

## Page behaviour and measurement

The hero scrolls with the document rather than pinning visitors through an
animation. On narrow screens the header shortens its booking label while
keeping the booking link and a 44px menu button visible.

The examples start as readable sections. JavaScript enhances them into tabs;
`#work-leads`, `#work-feedback` and `#work-report` still open the relevant example.
Hidden examples stop replaying. The QA diagram lives in a native disclosure and
only animates while it is open and in view.

GoatCounter tracks booking-link clicks (`cta-*`) and example clicks
(`example-sales`, `example-support`, `example-reporting`). These are intent
events, **not confirmed bookings**. Count completed meetings separately in
Cal.com; the site does not receive booking confirmations. Form text is handed
to Cal.com, not included in custom analytics event names.
