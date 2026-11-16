# Vectorpoint

Static GitHub Pages site for `vectorpoint.se`. Publish by pushing the checked
source to `main`; the existing Pages build and deployment publishes the root.

## Local development

```sh
npm ci
npm run preview
npm test
npm run test:browser
```

The browser suite starts its own preview server and blocks external requests,
so it never sends test bookings or analytics. It normally uses Playwright's
Chromium. To use a browser already installed in the environment:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

## The experience

The page has one primary next step: a first conversation with Johan. Seven
main sections carry the story: offer, services, examples, method, about, FAQ,
and contact. The founder and direct contact details sit beside the offer.
The hero has a booking button and a quiet link to examples.

The page deliberately avoids parallel conversion journeys: no hero prompt,
pilot selector, AI questionnaire, cost calculator, demo-or-drift switch,
floating document dock, or generated PM. The launch film assets and sources
remain in the repository but are not loaded on the page.

Safety commitments, tools and the QA pipeline live in the closed native
“Säkerhet, teknik och kvalitetssäkring” disclosure within the method section.
The pipeline has its own optional disclosure. Visitors can reach this detail
with a keyboard or without JavaScript. The contact section offers direct
booking first; writing a problem is optional behind a native disclosure.
Email and LinkedIn remain alternative contact routes.

## Content and claims

Use only claims Johan has supplied. The hero labels Stratsys, Prevas and
Chalmers as “Tidigare arbeten”, not clients; use the supplied local logo assets.
Do not invent testimonials, results, delivery times, response-time promises,
prices, a phone number, or free-service claims.

The first prototype has an agreed fixed price and scope before work begins.
The visitor owns code and documentation. Data handling, permissions and
external AI services must be agreed, without absolute residency claims.

Examples are marked as fictional wherever invented names or figures appear.
Their tabs are progressive enhancement: without JavaScript all examples are
readable. Keyboard arrows, Home and End select tabs; direct hashes select the
matching example. Hidden examples stop, and pause/replay controls work only
when scripting is available. Reduced motion shows the completed example.

## Booking and measurement

Booking links use `https://cal.com/johan-studt/15min`. With dialog support they
open the on-page calendar, loaded only on demand. A plain external link is
always available if embedding fails. Without JavaScript the links go directly
to Cal.com. The optional contact form carries the visitor's text into booking
or their mail program; no AI processes it.

GoatCounter counts CTA clicks and contact intent. `bokning-klar` means the
embedded calendar emitted `bookingSuccessful`; other CTA events do not mean
confirmed bookings or sent emails. Cal.com remains the source of truth for
meetings. Never include visitor text in analytics event names.

## Design and assets

The opening and main page share a warm paper canvas, dark ink and one brand-blue
booking action. The founder portrait is unboxed and the previous-work strip uses
a quiet dividing rule. Services are editorial rows with direct links to the
relevant example or method; those links work without JavaScript. Demos, contact and footer use
dark panels. Navigation stays opaque and readable. Preserve responsive layout,
visible focus, native disclosures and reduced-motion support.

`assets/johan.jpg` is the full portrait; `assets/johan-portrait.jpg` is the crop
used on the site. `assets/brand/` holds the supplied logo variants. Keep the
local tool logos and prior-work logos rather than fetching them at runtime.

`launch-video/` contains the archived HTML launch-film source and rendering
scripts; `assets/launch/` contains its web encodes.
