// Renders composition.html frame by frame and encodes it with the soundtrack.
//
//   node launch-video/render.mjs                 -> launch-video/vectorpoint-launch.mp4
//   node launch-video/render.mjs --stills 2,5,8  -> PNG stills for quick review
//
// Needs Playwright Chromium and ffmpeg. Soundtrack: python3 launch-video/soundtrack.py
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const fps = Number(flag('--fps', 60));
const out = flag('--out', path.join(dir, 'vectorpoint-launch.mp4'));
const stills = flag('--stills', null);
const audio = path.join(dir, 'soundtrack.wav');

// Fall back to a pre-installed Chromium when Playwright's own download is missing.
const launchOpts = existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'composition.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  await Promise.all(['500 40px Inter', '600 40px "Geist Mono"', '40px "Gasoek One"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
});
const duration = await page.evaluate(() => window.DURATION);

if (stills) {
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate(t => window.renderFrame(t), s);
    const file = path.join(flag('--still-dir', dir), `still-${s.toFixed(2)}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
  process.exit(0);
}

const ff = spawn('ffmpeg', [
  '-y', '-v', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  ...(existsSync(audio) ? ['-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(duration * fps);
for (let f = 0; f < total; f++) {
  await page.evaluate(t => window.renderFrame(t), f / fps);
  const buf = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % fps === 0) process.stdout.write(`\r${f}/${total}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
await browser.close();
console.log(`\nwrote ${out}`);
