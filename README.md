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
and background sit directly under the lead. The 20-second launch film sits
beside the text on wide screens (1100px and up) and under the form on narrower
ones. It loops muted from `assets/launch/teaser.mp4` (720p, no audio) under the
same conditions as the background video, and otherwise shows its poster.
Clicking it opens the full film with sound in a dialog; without JavaScript the
link opens the MP4 directly. Its caption links to `#work-leads`. While the
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

GoatCounter tracks booking-link clicks (`cta-*`), example clicks
(`example-sales`, `example-support`, `example-reporting`) and launch film plays
(`launch-film`). These are intent
events, **not confirmed bookings**. Count completed meetings separately in
Cal.com; the site does not receive booking confirmations. Form text is handed
to Cal.com, not included in custom analytics event names.

## Launch film

`launch-video/` holds the source for the launch film: one HTML composition
rendered frame by frame (16:9 and a 9:16 reel via `--vertical`) plus a
synthesized soundtrack. See the header of `launch-video/render.mjs`. After
re-rendering, refresh the site copies with `launch-video/web-encode.sh`.
