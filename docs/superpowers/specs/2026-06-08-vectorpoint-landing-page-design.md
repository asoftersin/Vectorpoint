# Vectorpoint Landing Page Design

Date: 2026-06-08

## Brief

Build a static GitHub Pages landing page for `vectorpoint.se`. The site positions Vectorpoint as an AI and automation consultant for workflows.

## Direction

Use the revised visual direction from the user's reference screenshot: a blue-gray presentation stage with a centered live-preview label, a large white rounded browser frame, a warm minimal inner hero, and a compact premium layout. Use the hero copy from direction B:

> Från manuellt arbete till självkörande processer.

The workflow visual should animate after the page has landed. Nodes and connecting lines build horizontally around the central LLM agent inside a soft white agent card. A generated warm horizon image is the visual anchor for the inner hero.

## Call To Action

The primary CTA links to Johan Studt on LinkedIn:

https://www.linkedin.com/in/johan-studt/

## Structure

- Outer live-preview stage for `vectorpoint.se`.
- Large rounded browser frame with Vectorpoint brand and LinkedIn CTA.
- First viewport with hero copy, primary CTA, generated horizon art, and animated workflow agent card.
- Offer section describing identification, design, and implementation of AI workflows.
- Method section explaining Discover, Prototype, and Operate.
- Final CTA linking to LinkedIn.

## Implementation

Use plain HTML, CSS, and JavaScript so the site can be deployed directly through GitHub Pages. Include `CNAME` for `vectorpoint.se`. Support reduced motion and responsive mobile layout.

## Verification

Run `node scripts/smoke-test.mjs`, preview in browser, and check desktop and mobile screenshots.
