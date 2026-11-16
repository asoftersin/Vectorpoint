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

The browser checks cover the first screen, the demo-or-drift switch (mouse, keyboard, booking handoff, phone, reduced motion, no JS), AI-kollen (mouse, keyboard, booking handoff, phone fit, no JS) (offer, founder card and booking button
on desktop and phone), the contact routes, text contrast, example tabs (mouse,
keyboard and direct links), mobile layout, demo pause/resume, reduced motion,
optional disclosures, booking handoff and the no-JS fallback. Install Playwright
Chromium with `npx playwright install chromium` if the browser executable is
missing.

## What the page is for

Two jobs: make it easy to reach Johan, and give a buyer at a large organisation
reasons to trust the company before they do. Every design choice below follows
from those two.

- **The first screen** says what Vectorpoint does, shows who you would be
  dealing with (portrait, name, company, email, LinkedIn) and starts the
  conversation right there: a prompt-style field, "Vad ska AI lösa hos er?",
  whose button ("Boka 15 min om det här") opens the on-page calendar with the
  visitor's own words as the booking note and title. Typing one sentence is a
  smaller step than booking a stranger cold, and Johan arrives at the call
  knowing the problem. The placeholder types out real example problems (not
  with reduced motion), chips fill the field, Enter books and Shift+Enter
  adds a line. Below it, "Boka direkt utan att skriva" (`#heroCta`) and the
  AI-kollen link stay for visitors who want neither. No film or animation stands between a visitor and that.
- **Contact has three routes**, because not everyone wants to book a slot with
  a stranger: booking (Cal.com), email and LinkedIn. They appear in the hero,
  the About card, the contact section and the footer. The header keeps a
  booking button and a `Kontakt` link on every screen size.
- **Instagram is proof, not a contact route.** Johan's videos about AI and tech
  for companies are linked from the About card and the footer, where they
  support who he is. They are kept out of the hero and the contact section so
  the three contact routes stay clear.
- **Only claims the company has actually made.** The three commitments under
  the hero buttons repeat promises spelled out further down. The strip at the
  bottom of the hero is labelled "Tidigare arbeten" (previous work), Johan's
  wording, and deliberately does not call anyone a client. It shows only
  organisations he has said may be named: Stratsys, Prevas and Chalmers, using the logo files he supplied
  (`assets/clients/`, unaltered apart from trimming and resizing). There are
  no testimonials, result figures, response-time or price
  promises, and no phone number, because none have been supplied. Add them
  when they exist; do not invent them. The smoke test guards several of these.
- **Examples say they are fictional** wherever invented names and numbers
  appear.

## Design

The page is light: warm paper background, ink text, the brand blue as accent,
Inter for headings and body and Geist Mono only for small labels. Anything that
shows software at work (the film, the demos, the pipeline diagram) is a dark
panel, as are the closing contact band and the footer. `styles.css` declares one
set of colour tokens on `:root` and re-declares the same names for the dark
panels, so components never hard-code which mode they are in.

## Page behaviour and measurement

The hero scrolls with the document. Its headline ("AI som fungerar i drift.
Inte bara i en demo.") keeps each sentence on one line; the brand tagline from
the film ("Från AI-idé till mätbar effekt") stays in the page title, the social
cards and the footer. From 1000px the founder card sits beside the text with a large portrait;
below that it becomes a compact card under the text. While the hero's booking
button is visible the header booking button is an outline, so there is a single
primary action; it turns primary once the hero button scrolls away. On narrow
screens the header shortens its booking label while keeping the booking link and
a 44px menu button visible.

**Demo eller drift** (`#drift`, right under the hero) lets the visitor try the
headline's claim. One dark panel shows the same fictional internal assistant
answering the same two questions, and a switch moves it between "Demo" and "I
drift". In demo the second answer is a confident guess with no source, and six
rows (data, permissions, sources, unclear cases, tests, effect) are empty; in
drift the first answer carries its source, the second says the contract does not
cover it and goes to a person, the rows fill in one at a time and the count runs
from 0 to 6. It starts as a demo and switches itself to drift once, when it
scrolls into view; after that only the visitor moves it (a ring pulses on the
knob until they do). With reduced motion it rests in drift and never moves by
itself. On phones the switch sticks under the header while the rows scroll.
Every drift row repeats a commitment spelled out elsewhere on the page (the
smoke test checks that), and the panel is labelled as invented content. It ends
in "Har ni en pilot som fastnat i demo-läget?", whose button books with that
situation as the note: a stalled pilot is a concrete reason to call, which
"book a call" alone is not. Without JavaScript the panel shows the drift state
with the demo wording under each row, and the button still books.

**Pilot planner** (`#services`) turns the three service areas into selectable
first-project plans. Each shows a bounded scope, data → AI → human review,
and a question to measure, rather than promising a result. Support is selected
initially; all choices work with native buttons and announce changes. The CTA
passes the selected scope, review step and measurement question into the existing
booking sheet. On smaller screens a selection brings the plan into view, respecting
reduced motion. Without JavaScript the service descriptions, support plan and its
booking link remain available. GoatCounter records `pilot-val-1|2|3` and `cta-pilot`.

**AI-kollen** (`#ai-kollen`, right after the three problem cards) is four
quick questions: what the problem is, how often the work happens, where the data
lives and what happens if the AI gets it wrong. It shows one question at a time;
a click moves on, while keyboard users change answers with the arrow keys and
move on with Enter or "Nästa". It ends in an honest, rule-based verdict ("Stark
kandidat", "Värt att pröva" or "AI är troligen inte första steget"), with the
reasons and a suggested first prototype. "Boka 15 min med era svar" hands the
answers and the verdict to Cal.com as the booking note; "Skicka svaren som mejl"
does the same through `mailto:`. No AI and no backend are involved, and the page
says so. The hero's secondary button ("Passar AI er? · 4 frågor") leads here: a
small first step for visitors not ready to book yet. Without JavaScript all four
questions show at once and the button still books. The verdict is counted in
GoatCounter as `ai-kollen-besked-stark|mojlig|svag`.

**Vad kostar det manuella arbetet i dag?** (`#kostnad`, between the examples
and the method) turns the visitor's own numbers into a figure: people doing the
work, hours per person and week, and hourly cost with fees (defaults 10, 4 and
650 kr). It counts 45 working weeks a year and 1 600 hours per full-time post,
and shows the yearly cost in large type (it counts up as the sliders move,
not with reduced motion), the hours and the number of full-time posts. A
fourth slider is the visitor's guess at how much AI could take over (labelled
"Er gissning"), which gives the money and hours freed. "Boka 15 min om de här
siffrorna" opens the on-page calendar with all of it as the booking note, so
the first call starts from a baseline the visitor stated themselves. The page
promises no saving: the note under the button says the figures are theirs, not
a promise, and that the call agrees how effect will be measured. The section
exists because a buyer at a large organisation needs a number to take to
whoever signs off, and the method section right after it is about measuring
against exactly that number. Without JavaScript the sliders and the default
figure still show and the button still books.

The 20-second launch film is a framed section after the three problem cards:
the 16:9 cut on landscape screens and the 9:16 cut on portrait ones. It is not
fetched until it scrolls into view. It then loops muted; "Ljud på" restarts it
once with sound, after which it returns to the muted loop. With reduced motion
or data saving it shows a poster until "Spela filmen" is pressed, and it pauses
while out of view. Without JavaScript it keeps native controls.

Six tools appear first, led by the AI models and assistants (Claude, OpenAI,
Microsoft Copilot, GitHub Copilot, Gemini) in the order Johan chose, then Azure;
a native "Visa alla" disclosure exposes the remaining tools, including without
JavaScript.

The examples start as readable sections. JavaScript enhances them into tabs;
`#work-leads`, `#work-feedback` and `#work-report` still open the relevant example.
Hidden examples stop replaying. The QA diagram lives in a native disclosure and
only animates while it is open and in view.
Each demo has pause/resume and replay controls. Pausing preserves the current
step, typing progress, visual animations and remaining replay delay. Replay
starts afresh; switching tabs cancels the hidden demo and resets its pause state.
Reduced motion shows the completed example without looping or a pause button.
Playback controls stay hidden when JavaScript is unavailable.

**Ert underlag** (`#brief`) is a dark dock that floats at the bottom of the
screen once the hero has scrolled away, and hides again at the contact section,
the footer and while the booking sheet is open. It collects what the visitor has
already told the page, in three slots: their problem (typed in the hero or
contact field), AI-kollen's verdict and the cost figure from the sliders. Empty
slots are links to where each is filled in; a ring counts "x av 3". "Boka med
underlaget" opens the on-page calendar with everything gathered as one booking
note, so the visitor never has to choose which of the three tools to book from,
and the call starts from all of it. The answers live in `sessionStorage` for the
visit only and leave the browser only when the visitor books. On phones the
dock shows the ring, the count and the button. It needs JavaScript and stays
hidden without it.

**PM till chefen** (`#memo`) turns the same underlag into a one-page decision
memo, because the person who finds the page is rarely the one who signs off. The
dock's "PM till chefen" button (an icon on phones), and links that appear under
AI-kollen's verdict and the cost figure, open it as a sheet of paper: the
visitor's problem as the title, AI-kollen's verdict with its reasons and
suggested first prototype, the yearly cost, the method's four steps, and the
proposed decision ("ta ett första samtal på 15 minuter", which binds them to
nothing), signed with Johan's contact details. Empty parts link back to where
they are filled in. "Skriv ut / spara PDF" prints only the paper (print CSS);
"Mejla till en kollega" opens a `mailto:` with no recipient and the memo as
plain text; "Kopiera texten" copies it; "Boka 15 min med PM:et" books with the
underlag like the dock does. Every sentence in the memo is either the visitor's
own input or a commitment already made elsewhere on the page, and the fine print
says the figures are theirs, not a promise. Built in the browser; nothing is
sent until the visitor sends it. Needs JavaScript.

**Booking happens on the page.** Every booking link and both booking forms
(contact and AI-kollen) open a sheet instead of a new cal.com tab: Johan's
portrait, what happens on the call, the visitor's own text or AI-kollen answers
("Följer med bokningen") on the left, and the live Cal.com calendar on the right,
with the same text prefilled as the booking note. Cal.com's embed script is only
fetched once someone points at or focuses a booking button. A skeleton calendar
shows while it loads; if it has not loaded after 12 seconds, the sheet offers
"Öppna kalendern i en ny flik", which carries the same text (that link is always
at the bottom of the sheet). On phones the sheet is full screen with a compact
header. Ctrl/Cmd-click, middle-click, browsers without `<dialog>` and visitors
without JavaScript get the plain cal.com link as before.

The contact form has no backend. "Välj tid för ett samtal" hands the text to
Cal.com as the booking note; "Skicka som mejl" is a `mailto:` link that carries
the same text as subject and body. "Kopiera" copies the address for visitors
without a mail program, and only appears when the clipboard is available.
Without JavaScript the form, the mail link and every contact link still work.

GoatCounter tracks these clicks:

| Event | What was clicked |
| --- | --- |
| `cta-hero-prompt` | Booking from the hero's prompt field |
| `cta-nav`, `cta-mobilnav`, `cta-hero`, `cta-exempel`, `cta-om`, `cta-kontakt`, `cta-kontakt-direkt`, `cta-footer` | A booking link, by position |
| `contact-email-hero`, `contact-email`, `contact-email-form`, `contact-email-footer`, `contact-email-copy` | An email link, or the copy button |
| `contact-linkedin-hero`, `contact-linkedin-om`, `contact-linkedin` | A LinkedIn link |
| `instagram-om`, `instagram-footer` | The Instagram link |
| `example-sales`, `example-support`, `example-reporting`, `demo-replay-*` | An example tab or replay |
| `launch-film` | The film's sound/play button |
| `ai-kollen-hero`, `cta-ai-kollen`, `contact-email-ai-kollen` | The hero link to AI-kollen, and booking or emailing from its verdict |
| `cta-underlag` | Booking from the Ert underlag dock |
| `pm-oppnat-dock`, `pm-oppnat-ai-kollen`, `pm-oppnat-kostnad`, `cta-pm`, `pm-mejla`, `pm-skriv-ut` | Opening the PM (by where), and booking, mailing or printing from it |
| `cta-drift`, `drift-vaxlat` | Booking from the demo-or-drift panel, and the visitor's first own use of its switch on a visit (counted once) |
| `cta-kostnad`, `kostnad-raknad` | Booking from the cost section, and the first slider move on a visit (counted once) |
| `bokning-klar` | **A booking was completed** in the on-page calendar (Cal.com's `bookingSuccessful` event) |
| `bokning-ny-flik`, `contact-email-bokning` | Leaving the booking sheet for a cal.com tab, or for email |

Apart from `bokning-klar`, these are intent events, **not confirmed bookings or
sent emails**. `bokning-klar` counts bookings finished in the on-page calendar;
bookings made in a separate cal.com tab are not seen by the site, so Cal.com
remains the source of truth for meetings. Form text is handed to Cal.com or the visitor's mail program,
never included in analytics event names.

## Launch film

`launch-video/` holds the source for the launch film: one HTML composition
rendered frame by frame (16:9, and a 9:16 reel with `--vertical`) plus a
synthesized soundtrack. See the header of `launch-video/render.mjs`. The site
uses `--nohud` renders; after re-rendering, refresh
`assets/launch/` with `launch-video/web-encode.sh`.

## Logo

`assets/johan.jpg` is the full-size portrait; `assets/johan-portrait.jpg` is the
4:5 crop the page uses.

`assets/brand/` holds the logo as SVG (dark, white, and the mark alone), traced
from the brand file. The nav uses the dark version on the light page and the
footer the white one; `favicon.svg` and `assets/og-image.png` carry the same mark. The film reads its animated
copy from `launch-video/logo.js`.

### Midnight opening

The hero now uses a midnight blue canvas, electric blue second headline and a
light booking panel. The founder portrait stays alongside the offer; previous
work sits on a light strip so original logos retain their contrast. Navigation
has an opaque light background to stay readable over both dark and light sections.
