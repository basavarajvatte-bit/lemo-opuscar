"""Voice → timing.json: per-line mouth envelope (24 fps) and word timings (energy-based alignment).
Whisper (asr_check.py) could not be downloaded in the build machine, so words are placed by syllable weight
and snapped to the quietest dips of the voice between them."""
import json, re, os, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(f'{HERE}/lines.json'))

def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()); v = re.findall(r'[aeiouy]+', w)
    n = len(v) - (1 if w.endswith('e') and len(v) > 1 and not w.endswith('le') else 0)
    return max(1, n)

out = {}
for L in lines:
    x, sr = sf.read(f'{HERE}/voices/{L["id"]}.wav')
    if x.ndim > 1: x = x.mean(1)
    hop = int(sr * 0.01); n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    sm = np.convolve(rms, np.ones(3) / 3, 'same')
    thr = sm.max() * 0.08
    voiced = np.where(sm > thr)[0]; a, b = voiced[0], voiced[-1]
    words = L['text'].split()
    wts = np.array([syl(w) + 0.35 for w in words]); cum = np.concatenate([[0], np.cumsum(wts) / wts.sum()])
    bounds = [a]
    for k in range(1, len(words)):
        guess = a + (b - a) * cum[k]; lo, hi = int(guess - 12), int(guess + 12)
        lo = max(lo, bounds[-1] + 5); hi = min(hi, b - 5)
        j = lo + int(np.argmin(sm[lo:hi])) if hi > lo else int(guess)
        bounds.append(j)
    bounds.append(b)
    W = [{'w': w, 't0': round(bounds[i] * 0.01, 3), 't1': round(bounds[i + 1] * 0.01, 3)} for i, w in enumerate(words)]
    # mouth: rms per 1/24 s, normalised, gently compressed
    f = int(sr / 24); m = np.array([np.sqrt(np.mean(x[i * f:(i + 1) * f] ** 2)) for i in range(len(x) // f + 1)])
    m = np.clip((m / (np.percentile(m, 95) + 1e-9)) ** 0.7, 0, 1.1)
    out[L['id']] = {'d': round(len(x) / sr, 3), 'words': W, 'env': [round(float(v), 3) for v in m]}
json.dump(out, open(f'{HERE}/timing.json', 'w'))
for k, v in out.items(): print(k, v['d'], ' '.join(f"{w['w']}@{w['t0']}" for w in v['words']))
