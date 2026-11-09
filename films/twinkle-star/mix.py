"""Score + foley + voice → out/mix.wav. Reads events.json (exported from film.js) so every sound sits on its frame.
Instruments (style sound palette): nylon guitar as a ukulele-like strum, music box (lead, the tune in full once at the end),
glockenspiel-like bells for each uncovered star, a low bassoon-ish yawn; crayon, brush, felt and wink foley; room tone, crickets."""
import json, os, sys, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(f'{HERE}/../..')
sys.path.insert(0, LIB)
from core.audio import sfx as S
from core.audio import pluck as P
from scipy.signal import fftconvolve, resample_poly
SR = S.SR
E = json.load(open(f'{HERE}/events.json')); DUR = E['dur']; EV = E['ev']
META = next(e for e in EV if e['type'] == 'meta')
BPM = META['bpm']; BEAT = 60 / BPM; G0 = META['g0']; BAR = META['bar']
bar = lambda n, b=0: G0 + n * BAR + b * BEAT
N = int((DUR + 0.5) * SR)
mus, fol, amb, vox = (np.zeros((N, 2)) for _ in range(4))
rng = np.random.default_rng(5)

# ———————————————— music ————————————————
def note(name): return P.midi(name)
CH = {'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'F': ['F3', 'C4', 'F4', 'A4', 'C5'], 'G': ['G3', 'D4', 'G4', 'B4', 'D5'], 'Am': ['A3', 'E4', 'A4', 'C5', 'E5']}
def strum(t, ch, v=.45, up=False, dur=1.2, gain=1.0, pan=0.15):
    x = P.strum('nylon_guitar', [note(n) for n in CH[ch][1:]], dur, vel=v, spread=.018, up=up)
    S.add(mus, x, t, gain * 1.6, pan)
def bass(t, ch, v=.6, gain=1.0):
    S.add(mus, P.pluck('nylon_guitar', note(CH[ch][0]), 1.4, vel=v), t, gain * 1.5, -0.1)
def mbox(t, m, v=.7, gain=1.0, pan=0.25, droop=0.0):
    x = P.pluck('music_box', m, None, vel=v)
    if droop:   # the music box winds down: the last note sags in pitch
        n = len(x); k = np.linspace(1.0, 1 - droop, n); idx = np.cumsum(k); idx = idx[idx < n - 1]
        x = np.interp(idx, np.arange(n), x)
    S.add(mus, x, t, gain * 0.6, pan)
def bell(t, m, v=.8, pan=0.0, gain=1.0):   # glockenspiel-like: bright metal bar
    f = 440 * 2 ** ((m - 69) / 12); d = 1.4; tt = S.t_(d)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * S.env_exp(d, tau) for r, a, tau in [(1, 1, .5), (2.76, .35, .18), (5.4, .18, .07), (8.93, .08, .04)])
    x[:48] *= np.linspace(0, 1, 48)
    S.add(mus, x * v, t, gain * 0.06, pan)

# intro: a music-box pickup while the child is drawn (the first phrase of the tune, held back)
for i, m in enumerate(['C5', 'C5', 'G5', 'G5']): mbox(0.55 + i * BEAT * 0.5 + (1.3 if i > 1 else 0), note(m), .55 + .1 * i)
mbox(bar(1) - BEAT * 0.5, note('A5'), .5);
# verse 1 + 2 (bars 1–4) and repeat (bars 6–7): soft "ukulele" lilt, bass on 1, strum on 2 and 4 (6/8 feel by a dotted strum)
prog = {1: ['C', 'C'], 2: ['F', 'C'], 3: ['C', 'G'], 4: ['F', 'C'], 6: ['C', 'C'], 7: ['F', 'C']}
for b, chs in prog.items():
    for half, ch in enumerate(chs):
        t0 = bar(b, half * 2)
        bass(t0, ch, .55)
        strum(t0 + BEAT, ch, .4, gain=.9); strum(t0 + BEAT * 1.5, ch, .3, up=True, gain=.6)
# bar 5: a sustained C chord on the music box while the stars glitter, then silence (the breath)
for i, m in enumerate(['C5', 'E5', 'G5', 'C6']): mbox(bar(5) + i * 0.09, note(m), .45, gain=.8)
# glints: one bell per uncovered star or diamond, climbing a C-major pentatonic
pent = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]
gl = sorted([e for e in EV if e['type'] == 'glint'], key=lambda e: e['t'])
for i, e in enumerate(gl): bell(e['t'], pent[min(len(pent) - 1, int(i / len(gl) * len(pent)))], .55 + .3 * rng.random(), pan=e['pan'] * 0.7)
# the star wakes up / winks
face = next(e for e in EV if e['type'] == 'puff')['t']; wink = next(e for e in EV if e['type'] == 'wink')['t']
for i, m in enumerate([84, 88, 91]): bell(face + 0.05 + i * 0.07, m, .8, pan=.5, gain=1.3)
bell(wink + 0.1, 96, .9, pan=.5, gain=1.4); bell(wink + 0.22, 91, .7, pan=.5, gain=1.2)
# the tune, in full, once (bars 8–9): music box in eighths, slowing at the end, last note drooping; soft guitar under it
tune = ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', None, 'F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5', None]
t = bar(8); step = BEAT / 2
for i, m in enumerate(tune):
    rit = 1 + 0.5 * max(0, (i - 10) / 6) ** 1.5
    if m: mbox(t, note(m), .72, gain=1.15, droop=0.035 if i == 14 else 0)
    t += step * rit * (1 if m else 1)
for b, ch in [(bar(8), 'C'), (bar(8, 2), 'F'), (bar(9), 'G'), (bar(9, 2.4), 'C')]:
    bass(b, ch, .45, gain=.8); strum(b + BEAT, ch, .28, gain=.6)

# ———————————————— foley ————————————————
def crayon(d, speed=1.0, v=1.0):
    """wax stick-slip: band-passed noise chopped by irregular grabs; grain follows stroke speed"""
    n = S.noise(d); tt = S.t_(d)
    rate = 18 * speed; ph = np.cumsum(rate * (1 + .4 * rng.standard_normal(len(tt))) / SR)
    grab = (0.55 + 0.45 * np.abs(np.sin(np.pi * ph))) ** 3
    x = S.bp(n, 1800, 6500) * grab + 0.5 * S.bp(n, 700, 1800) * grab
    e = np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .06)
    return S.norm(x * e) * v
def scribble(d, v=1.0):   # colouring: rhythmic back-and-forth swishes
    tt = S.t_(d); sw = np.abs(np.sin(np.pi * tt * 7.5)) ** 1.5
    return S.norm(crayon(d, 1.6) * sw) * v
def brush(d, v=1.0):      # wet brush: low-passed noise with bristle grain
    n = S.noise(d); tt = S.t_(d)
    x = S.lp(n, 1400) + 0.25 * S.bp(n, 2500, 5000) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt))
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.7
    return S.norm(x * e) * v
def puff(v=1.0):          # felt puff
    d = .25; tt = S.t_(d); x = S.lp(S.noise(d), 900) * np.exp(-tt / .05); return S.norm(x) * v
def yawn():               # a low, breathy bassoon-ish glide down (the yawn)
    d = 1.3; tt = S.t_(d); f = 196 * (1 - 0.18 * tt / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .55), (3, .35), (4, .2), (5, .1)])
    x = S.lp(x, 1400) * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.8
    return S.norm(x) * .8
for e in EV:
    ty, t0 = e['type'], e['t']
    if ty == 'scratch': S.add(fol, crayon(e['dur'], 1.0, .8), t0, .32, e.get('pan', 0))
    elif ty == 'scribble': S.add(fol, scribble(e['dur'], .8), t0, .3, e.get('pan', 0))
    elif ty == 'brush':
        x = brush(e['dur'] + .15); n = len(x)
        for s in range(0, n, 2400):   # pan follows the brush across the page
            u = s / n; pan = (-0.7 + 1.4 * u) * e['dir']; seg = x[s:s + 2400]
            S.add(fol, seg, t0 + s / SR, .06, pan)
    elif ty == 'puff': S.add(fol, puff(), t0, .25, e.get('pan', 0))
    elif ty == 'ding': S.add(fol, S.ding(.5), t0, .07, e.get('pan', 0))
    elif ty == 'yawn': S.add(mus, yawn(), t0 + .05, .2, 0)

# ambience: room tone all along; crickets from dusk (fade in), the breath keeps only the crickets
room = S.lp(S.brown(DUR + .5), 400); amb[:, 0] += room[:N] * .012; amb[:, 1] += np.roll(room, 2400)[:N] * .012
ck0 = next(e for e in EV if e['type'] == 'crickets')['t']
t = ck0
while t < DUR:
    d = .09; tt = S.t_(d); f = 4300 + 300 * rng.random()
    chirp = np.sin(2 * np.pi * f * tt) * (np.sin(2 * np.pi * 45 * tt) > 0) * np.sin(np.pi * tt / d)
    for k in range(2 + int(rng.random() * 2)): S.add(amb, chirp, t + k * .12, .012 * min(1, (t - ck0) / 3), -.6 if rng.random() < .5 else .5)
    t += .7 + rng.random() * .9

# ———————————————— voice ————————————————
def chain(x):
    x = S.hp(x, 75)
    x = S.compress(x, thr=.2, ratio=2.5, att=.008, rel=.14)
    # warmth: gentle low shelf by adding a low-passed copy, soften the highs
    x = x + .18 * S.lp(x, 220) - .25 * S.hp(x, 6000)
    # de-ess: compress only the 5–10 kHz band
    s = S.bp(x, 5000, 10000); x = x - s + S.compress(s, thr=.03, ratio=4, att=.002, rel=.05)
    return x
ir_t = S.t_(.7); ir = S.lp(S.noise(.7), 3500) * np.exp(-ir_t / .16); ir[:int(.012 * SR)] = 0; ir /= np.sqrt(np.sum(ir ** 2))
for L in META['lines']:
    x, sr = sf.read(f'{HERE}/voices/{L["id"]}.wav')
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = chain(x); x = x / (np.sqrt(np.mean(x[np.abs(x) > .01] ** 2)) + 1e-9) * .1
    wet = fftconvolve(x, ir)[:len(x) + int(.5 * SR)] * 10 ** (-18 / 20)
    S.add(vox, x, L['t'], 1.0, 0); S.add(vox, wet, L['t'], 1.0, -.15); S.add(vox, wet, L['t'] + .011, 1.0, .15)

# ducking: music −9 dB and foley −4 dB under the voice (smooth envelope)
env = np.zeros(N)
for L in META['lines']:
    a, b = int((L['t'] - .12) * SR), int((L['t'] + L['d'] + .15) * SR); env[a:b] = 1
k = int(.12 * SR); env = np.convolve(env, np.ones(k) / k, 'same')
mus *= (1 - env * (1 - 10 ** (-9 / 20)))[:, None]; fol *= (1 - env * (1 - 10 ** (-4 / 20)))[:, None]
# the breath: music and foley fall silent (crickets only)
sil = next(e for e in EV if e['type'] == 'silence'); a, b = int(sil['t'] * SR), int((sil['t'] + sil['dur']) * SR)
g = np.ones(N); g[a:b] = 0; g = np.convolve(g, np.ones(int(.15 * SR)) / int(.15 * SR), 'same'); mus *= g[:, None]
# music box / bells: a gentle high lift
mix = vox + mus * 1.0 + fol + amb
fade = np.ones(N); fe = int((DUR - .1) * SR); fade[fe:] = 0; fs_ = int(1.2 * SR); fade[fe - fs_:fe] = np.linspace(1, 0, fs_) ** 2; mix *= fade[:, None]
mix = np.stack([S.limit(mix[:, c], .9) for c in range(2)], 1)
os.makedirs(f'{HERE}/out', exist_ok=True)
sf.write(f'{HERE}/out/mix.wav', mix[:int(DUR * SR)].astype(np.float32), SR, subtype='PCM_24')
for nm, x in [('voice', vox), ('music', mus), ('foley', fol), ('amb', amb)]:
    print(f'{nm:6s} rms {20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12):6.1f} dB')
print('out/mix.wav', round(DUR, 2), 's')
_r = lambda x, a, b: 20 * np.log10(np.sqrt(np.mean(x[int(a * SR):int(b * SR)] ** 2)) + 1e-12)
for L in META['lines']: print(L['id'], 'voice', round(_r(vox, L['t'], L['t'] + L['d']), 1), 'bed', round(_r(mus + fol + amb, L['t'], L['t'] + L['d']), 1))
