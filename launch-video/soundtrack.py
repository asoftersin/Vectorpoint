"""Synthesizes the launch video soundtrack (numpy only, no samples).

120 BPM, so every scene cut in composition.html lands on a beat.
    python3 launch-video/soundtrack.py  ->  launch-video/soundtrack.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 19.5
BEAT = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(42)
mix = np.zeros((N, 2))


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    mix[i : i + len(sig), 0] += sig * np.sqrt(0.5 * (1 - pan))
    mix[i : i + len(sig), 1] += sig * np.sqrt(0.5 * (1 + pan))


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def band(noise, lo, hi):
    """Brick-wall band filter in the frequency domain."""
    spec = np.fft.rfft(noise)
    f = np.fft.rfftfreq(len(noise), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(noise))


def kick(length=0.4, punch=1.0):
    t = t_axis(length)
    freq = 45 + 110 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7)
    click = band(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 200) * 0.3
    return np.tanh((body + click) * 1.6 * punch)


def hat(length=0.05):
    t = t_axis(length)
    n = band(rng.standard_normal(len(t)), 7000, 16000)
    return n / (np.abs(n).max() + 1e-9) * np.exp(-t * 90)


def whoosh(length=0.45, up=True):
    t = t_axis(length)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    steps = 12
    seg = len(n) // steps
    for k in range(steps):
        frac = k / (steps - 1) if up else 1 - k / (steps - 1)
        c = 400 * (20 ** frac)
        out[k * seg : (k + 1) * seg] = band(n, c * 0.6, c * 1.6)[k * seg : (k + 1) * seg]
    env = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 2
    return out / (np.abs(out).max() + 1e-9) * env


def tone(freq, length, attack=0.01, decay=4.0, harmonics=(1.0,)):
    t = t_axis(length)
    sig = sum(a * np.sin(2 * np.pi * freq * (h + 1) * t) for h, a in enumerate(harmonics))
    env = np.minimum(1, t / attack) * np.exp(-t * decay)
    return sig * env


# Am - F - C - G, one chord per bar (2 s)
CHORDS = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 261.6, 329.6), (196.0, 246.9, 293.7)]
BASS = [55.0, 43.65, 65.41, 49.0]

# --- intro riser into the hook (0 - 1.5 s)
add(whoosh(1.5, up=True), 0.0, 0.35)
add(tone(880, 0.5, decay=6, harmonics=(1, 0.3)), 0.05, 0.12, -0.3)  # dot ignites
add(tone(1318.5, 0.5, decay=6, harmonics=(1, 0.3)), 0.6, 0.08, 0.3)  # wordmark

# --- groove (1.5 - 17 s)
start, end = 1.5, 17.0
beat_times = np.arange(start, end, BEAT)
for b in beat_times:
    add(kick(), b, 0.9)
for b in np.arange(4.0, end, BEAT):
    add(hat(), b + BEAT / 2, 0.16, 0.25)
    add(hat(0.03), b + BEAT * 0.75, 0.07, -0.25)

# sidechain-style duck shape, reused for bass and pad
duck = np.ones(N)
for b in beat_times:
    i = int(b * SR)
    seg = min(int(0.3 * SR), N - i)
    duck[i : i + seg] *= 0.25 + 0.75 * (np.arange(seg) / seg) ** 0.6

layer = np.zeros(N)
for bar, bt in enumerate(np.arange(start, end, 2.0)):
    root = BASS[bar % 4]
    for k in range(8):  # eighth-note bass
        s = tone(root, 0.24, attack=0.005, decay=9, harmonics=(1, 0.5, 0.25, 0.12))
        i = int((bt + k * 0.25) * SR)
        e = min(len(s), N - i)
        if e > 0:
            layer[i : i + e] += s[:e] * 0.33
    for f in CHORDS[bar % 4]:
        s = tone(f, 2.0, attack=0.08, decay=0.8, harmonics=(1, 0.2))
        i = int(bt * SR)
        e = min(len(s), N - i)
        if e > 0:
            layer[i : i + e] += s[:e] * 0.06
layer *= duck
mix[:, 0] += layer
mix[:, 1] += layer

# whooshes into every wiped cut
for c in (4.0, 6.5, 9.0, 11.5, 13.5, 15.5):
    add(whoosh(0.4), c - 0.3, 0.22, 0.4 if c % 1 else -0.4)

# UI blips: lead checks, feedback routing, pipeline nodes, method steps
for k in range(5):
    add(tone(1760, 0.08, attack=0.002, decay=40), 4.85 + k * 0.08, 0.07, 0.3)
for k in range(4):
    add(tone(1318.5, 0.1, attack=0.002, decay=35), 7.8 + k * 0.13, 0.07, -0.2)
for k, tt in enumerate((14.05, 14.35, 14.6, 14.85, 15.08)):
    add(tone(880 * 2 ** (k / 12 * 2), 0.1, attack=0.002, decay=35), tt, 0.07)
for k in range(4):
    add(tone(659.3 * 2 ** (k * 2 / 12), 0.12, attack=0.002, decay=30), 15.58 + k * 0.22, 0.09)

# --- outro: impact and a sustained A minor chord (17 s - end)
add(whoosh(0.5, up=True), 16.5, 0.3)
add(kick(0.9, punch=1.3), 17.0, 1.0)
add(band(rng.standard_normal(int(1.2 * SR)), 200, 9000) * np.exp(-t_axis(1.2) * 5), 17.0, 0.12)
for f, g in ((110.0, 0.2), (220.0, 0.08), (261.6, 0.08), (329.6, 0.07), (440.0, 0.04)):
    add(tone(f, 2.5, attack=0.02, decay=1.1, harmonics=(1, 0.3, 0.1)), 17.0, g)
add(tone(1760, 1.5, attack=0.005, decay=3.5), 18.25, 0.05, 0.4)  # CTA shimmer

# master: soft clip, normalize, fade
mix = np.tanh(mix * 1.2)
mix /= np.abs(mix).max() / 0.89
fade = int(0.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]

out = Path(__file__).with_name("soundtrack.wav")
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"wrote {out}")
