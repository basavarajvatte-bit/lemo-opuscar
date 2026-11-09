// Twinkle Star — the film. One page, one camera; the timeline below is the single source of truth (picture, events, subtitles).
import { layer, clear, line, fill, dab, text, handCircle, ellipse, smooth, CAM, BOIL, W, H, sx, sy } from './crayon.js';
import { group, clearGroup, part } from './rig.js';
import { child, bigStar, smallStar } from './child.js';
import { PAL } from './pal.js';
import { clamp, lerp, hash, mulberry, track, ss } from '/core/lib.js';
const K = PAL.crayon;
const TIM = await (await fetch('timing.json')).json();

// —— music grid: 96 bpm, 4/4, bar = 2.5 s, bar 1 at 3.0 s ——
export const BPM = 96, BEAT = 60 / BPM, BAR = 4 * BEAT, G0 = 0.5;
const bar = (n, b = 0) => G0 + n * BAR + b * BEAT;
export const DUR = 26.0;
const pr = (t, a, b) => clamp((t - a) / (b - a));

// —— the verse (Jane Taylor, 1806): each line starts on the grid ——
const TXT = { l1: 'Twinkle, twinkle, little star,', l2: 'How I wonder what you are!', l3: 'Up above the world so high,', l4: 'Like a diamond in the sky.', l5: 'Twinkle, twinkle, little star,', l6: 'How I wonder what you are!' };
export const LINES = [['l1', bar(1)], ['l2', bar(2, 0.5)], ['l3', bar(3)], ['l4', bar(4)], ['l5', bar(6)], ['l6', bar(7, 0.5)]]
  .map(([id, t]) => ({ id, t, d: TIM[id].d, text: TXT[id], words: TIM[id].words.map(w => ({ ...w, t0: t + w.t0, t1: t + w.t1 })) }));
const L = Object.fromEntries(LINES.map(l => [l.id, l]));
const wordT = (id, i) => L[id].words[i].t0;
export const COUPLETS = [
  { a: 'l1', b: 'l2', t0: L.l1.t - 0.15, t1: L.l3.t - 0.1 },
  { a: 'l3', b: 'l4', t0: L.l3.t - 0.08, t1: L.l4.t + L.l4.d + 0.9 },
  { a: 'l5', b: 'l6', t0: L.l5.t - 0.15, t1: L.l6.t + L.l6.d + 0.8 },
];
export const SUBS = COUPLETS.map(c => ({ t0: +c.t0.toFixed(3), t1: +c.t1.toFixed(3), text: L[c.a].text + '\n' + L[c.b].text }));

// mouth opening at time t (from the voice envelope, stepped at 12 fps like the drawing)
function mouthAt(t) {
  const tq = Math.floor(t * 12) / 12;
  for (const l of LINES) { const u = tq - l.t; if (u >= 0 && u < l.d) { const e = TIM[l.id].env; const i = Math.floor(u * 24); return Math.max(e[i] || 0, e[i + 1] || 0); } }
  return 0;
}

// —— the page (world coords) ——
const KID = { x: 600, y: 1540, s: 1.9 };
const STAR = { x: 880, y: 560, r: 95 };
const hillY = x => 1478 + 0.00034 * (x - 600) * (x - 600) + 6 * Math.sin(x * 0.011);
const HILL = (() => { const p = []; for (let x = -420; x <= 1620; x += 30) p.push([x, hillY(x)]); p.push([1620, 2600], [-420, 2600]); return p; })();
// hidden white-wax stars and diamonds in the sky (on the page from the first frame)
const WAX = (() => {
  const R = mulberry(77), out = [];
  let tries = 0;
  while (out.length < 150 && tries++ < 5000) {
    const x = -260 + R() * 1720, y = -300 + R() * 1700;
    if (y > hillY(x) - 40) continue;
    if (Math.hypot(x - STAR.x, y - STAR.y) < STAR.r + 50) continue;
    if (x > 380 && x < 820 && y > 820) continue;                    // keep the child's silhouette clear
    if (out.some(s => Math.hypot(s.x - x, s.y - y) < 62)) continue;
    const kind = R() < 0.16 ? 'star' : R() < 0.3 ? 'diamond' : 'dot';
    out.push({ x, y, kind, r: kind === 'dot' ? 4 + R() * 5 : 13 + R() * 11, rot: R() * 1.2, seed: 2000 + out.length });
  }
  return out;
})();
// three wash bands sweep down the sky during "Up above… / Like a diamond…"
export const BANDS = [
  { y0: -420, y1: 420, t0: bar(3, 3), t1: bar(4, 1), dir: 1, seed: 1 },
  { y0: 340, y1: 1000, t0: bar(4, 1), t1: bar(4, 2.6), dir: -1, seed: 2 },
  { y0: 920, y1: 1640, t0: bar(4, 2.6), t1: bar(5, 0.4), dir: 1, seed: 3 },
];
const X0 = -480, X1 = 1680;
const bandFront = (b, t) => { const u = pr(t, b.t0, b.t1); const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; const v = 0.15 * u + 0.85 * e; return b.dir > 0 ? lerp(X0, X1, v) : lerp(X1, X0, v); };
const revealT = s => { const b = BANDS.find(b => s.y >= b.y0 - 10 && s.y <= b.y1 - 60) || BANDS[2]; const u = b.dir > 0 ? (s.x - X0) / (X1 - X0) : (X1 - s.x) / (X1 - X0); return b.t0 + (b.t1 - b.t0) * clamp(u * 0.92 + 0.04); };

// —— camera: centre (world) + zoom ——
const camT = track([
  [0, [602, 1040, 3.1]], [0.6, [602, 1040, 3.1]], [2.8, [625, 1110, 1.45]], [3.1, [628, 1105, 1.48]],
  [5.2, [650, 1045, 1.6]], [bar(2, 3.2), [650, 1045, 1.6]], [bar(3, 2.4), [600, 1000, 0.92]], [bar(5, 3), [600, 1000, 0.92]],
  [bar(6, 1.5), [640, 1085, 1.4]], [bar(7, 3.5), [652, 1060, 1.44]], [bar(9, 1), [720, 880, 1.24]], [DUR, [722, 875, 1.24]],
]);

// —— the child's acting (substitution poses on the beat) ——
const T_STAR = wordT('l1', 3);        // "star," → the star is drawn on
const T_FACE = bar(6) - 0.6;            // the star wakes up (face drawn on) in the breath before the repeat
const T_WINK = bar(8, 0.5), T_YAWN = bar(8, 2.5), T_BYE = bar(9, 0.5);
function kidState(t) {
  const o = { ...KID, seed: 500, expr: 'open', arms: 'down', tilt: 0, look: 0, lookY: 0, brow: 0 };
  o.ld = pr(t, 0.15, 1.9); o.fd = pr(t, 1.2, 2.5); o.featuresEarly = t > 0.55;
  if (t < 0.55) { o.featuresEarly = false; }
  const step = Math.floor(t * 6) % 2;                         // two key drawings alternate at 6 per second
  if (t > 2.35 && t < L.l1.t) { o.arms = step ? 'wave0' : 'wave1'; o.expr = 'happy'; }
  else if (t >= L.l1.t && t < T_STAR - 0.15) { o.arms = 'clasp'; o.tilt = Math.floor(t / BEAT) % 2 ? 0.06 : -0.06; }
  else if (t >= T_STAR - 0.15 && t < L.l2.t - 0.1) { o.arms = 'point'; o.look = 1; o.lookY = -1; o.tilt = 0.08; }
  else if (t >= L.l2.t - 0.1 && t < L.l3.t - 0.15) { o.arms = 'chin'; o.tilt = 0.12; o.brow = 1; o.look = 0.7; o.lookY = -0.7; }
  else if (t >= L.l3.t - 0.15 && t < L.l4.t - 0.1) { o.arms = Math.floor((t - L.l3.t) / BEAT) % 2 ? 'up2' : 'up'; o.lookY = -1; o.brow = 1; }
  else if (t >= L.l4.t - 0.1 && t < bar(5)) { o.arms = 'clasp'; o.expr = 'wide'; o.lookY = -1; o.look = Math.floor((t - L.l4.t) / (BEAT * 2)) % 2 ? 0.8 : -0.8; o.brow = 1; }
  else if (t >= bar(5) && t < L.l5.t - 0.1) { o.arms = 'hug'; o.expr = t < bar(5, 2) ? 'wide' : 'happy'; o.lookY = -1; o.look = 0.8; o.tilt = 0.1; }
  else if (t >= L.l5.t - 0.1 && t < L.l6.t - 0.1) { o.arms = wordT('l5', 3) - 0.1 < t ? 'point' : (step ? 'wave0' : 'wave1'); o.look = 1; o.lookY = -1; o.tilt = 0.08; }
  else if (t >= L.l6.t - 0.1 && t < T_YAWN) { o.arms = 'hug'; o.tilt = Math.floor(t / (BEAT * 2)) % 2 ? 0.1 : -0.1; o.expr = t > L.l6.t + L.l6.d + 0.2 ? 'happy' : 'open'; }
  else if (t >= T_YAWN && t < T_YAWN + 1.3) { o.arms = 'yawn'; o.expr = 'yawn'; o.tilt = -0.06; }
  else if (t >= T_YAWN + 1.3) { o.arms = t > T_BYE && t < T_BYE + 1.6 ? (step ? 'wave0' : 'wave1') : 'hug'; o.expr = 'sleepy'; o.tilt = 0.12; }
  // blinks
  if (o.expr === 'open' && [4.0, 7.6, 12.8, 17.3, 19.9].some(b => t > b && t < b + 0.12)) o.expr = 'blink';
  o.mouth = mouthAt(t);
  o.bob = o.mouth > 0.2 ? -4 : 0;
  return o;
}

// —— events (foley and music cues, exported to mix.py) ——
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
LINES.forEach(l => ev(l.t, 'voice', { id: l.id }));
[[0.15, 0.55, -0.2], [0.75, 0.5, 0.2], [1.3, 0.6, -0.3]].forEach(([t, d, pan]) => ev(t, 'scratch', { dur: d, pan }));
[[1.25, 0.45, -0.2], [1.75, 0.5, 0.3], [2.1, 0.45, 0]].forEach(([t, d, pan]) => ev(t, 'scribble', { dur: d, pan }));
ev(T_STAR - 0.1, 'scratch', { dur: 0.55, pan: 0.5 }); ev(T_STAR + 0.4, 'scribble', { dur: 0.6, pan: 0.5 }); ev(T_STAR + 0.5, 'ding', { pan: 0.5 });
BANDS.forEach(b => ev(b.t0, 'brush', { dur: b.t1 - b.t0, dir: b.dir }));
WAX.filter(s => s.kind !== 'dot').forEach(s => ev(revealT(s), 'glint', { pan: clamp((s.x - 600) / 700, -1, 1) }));
ev(bar(5, 1.6), 'silence', { dur: T_FACE - bar(5, 1.6) });
ev(T_FACE, 'puff', { pan: 0.5 }); ev(T_WINK, 'wink', { pan: 0.5 }); ev(T_YAWN, 'yawn');
ev(0, 'room'); ev(bar(3, 2), 'crickets');
[['intro', 0], ['A', bar(1)], ['wash', bar(3, 3)], ['breath', bar(5, 1.6)], ['A2', bar(6)], ['tune', bar(8)], ['end', DUR]].forEach(([id, t]) => ev(t, 'cue', { id }));
export const META = { bpm: BPM, g0: G0, bar: BAR, lines: LINES.map(l => ({ id: l.id, t: l.t, d: l.d })), subs: SUBS };
ev(0, 'meta', META);

// —— layers ——
const BG = { f: layer(), l: layer() }, WAXL = group(), ST = group(), KD = group(), WASH = layer(), FX = layer(), SUBK = layer(), SUBT = layer();

export function frame(comp, t) {
  [CAM.x, CAM.y, CAM.s] = camT(t);
  BOIL.amp = t > T_YAWN + 1.3 ? 0.55 : (t > bar(5, 1.6) && t < L.l5.t ? 0.6 : 1);
  [BG.f, BG.l, WASH, FX, SUBK, SUBT].forEach(clear); clearGroup(WAXL); clearGroup(ST); clearGroup(KD);
  // hill: line, then colour, then grass tufts and two little flowers
  const hl = pr(t, 1.1, 1.8), hf = pr(t, 1.6, 2.6);
  if (hl > 0) line(BG.l, HILL.slice(0, -2), { w: 9, col: K.ink, seed: 31, draw: hl, boil: 0.6 });
  if (hf > 0) fill(BG.f, HILL, { col: K.mint, p: 0.9, gap: 11, w: 13, ang: 0.25, seed: 32, draw: hf, boil: 0, cross: true, crossP: 0.55 });
  if (hf >= 1) {
    [[120, 1], [300, -1], [880, 1], [1050, -1], [460, 1], [760, -1], [-80, 1], [1250, 1]].forEach(([x, d], i) => { const y = hillY(x) + 60 + (i % 3) * 70; line(BG.l, [[x - 14, y], [x - 6 * d, y - 30], [x, y]], { w: 6, col: K.olive, seed: 40 + i, boil: 0.6 }); line(BG.l, [[x, y], [x + 8 * d, y - 36], [x + 14, y]], { w: 6, col: K.olive, seed: 50 + i, boil: 0.6 }); });
    [[230, 1620], [990, 1640]].forEach(([x, y], i) => { line(BG.l, [[x, y], [x + 4, y + 70]], { w: 6, col: K.olive, seed: 60 + i, boil: 0.6 }); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; dab(BG.f, x + Math.cos(a) * 16, y + Math.sin(a) * 16, 10, { col: K.gold, p: 0.9, seed: 70 + i * 9 + k, boil: 0 }); } dab(BG.f, x, y, 8, { col: K.rose, p: 0.95, seed: 69 + i, boil: 0 }); });
  }
  // hidden white wax (drawn from frame one, invisible until the wash)
  for (const s of WAX) {
    if (s.kind === 'dot') dab(WAXL.f, s.x, s.y, s.r, { col: K.white, p: 1, seed: s.seed, gap: 3, w: 4, over: 0.5, boil: 0.2 });
    else if (s.kind === 'star') smallStar(WAXL.f, [s.x, s.y], s.r, s.seed, s.rot, 1.05, K.white);
    else { const r = s.r; fill(WAXL.f, [[s.x, s.y - r * 1.2], [s.x + r * 0.8, s.y], [s.x, s.y + r * 1.2], [s.x - r * 0.8, s.y]], { col: K.white, p: 1.05, gap: 3, w: 4, over: 1, seed: s.seed, boil: 0.2 }); }
  }
  // the big star
  if (t > T_STAR - 0.15) bigStar(ST, { ...STAR, ld: pr(t, T_STAR - 0.15, T_STAR + 0.4), fd: pr(t, T_STAR + 0.35, T_STAR + 1.0), face: pr(t, T_FACE, T_FACE + 0.5), wink: t > T_WINK && t < T_WINK + 0.55, rot: 0.04 * Math.sin(Math.floor(t * 12) / 12 * 2.2) * (t > T_FACE ? 1 : 0.3) });
  // twinkle: gold rays on "twinkle, twinkle" + a pulse each beat after the star wakes
  const rays = (amt, seedOff) => { if (amt <= 0) return; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; const r0 = STAR.r * 1.25, r1 = STAR.r * (1.45 + 0.35 * amt); line(FX, [[STAR.x + Math.cos(a) * r0, STAR.y + Math.sin(a) * r0], [STAR.x + Math.cos(a) * r1, STAR.y + Math.sin(a) * r1]], { w: 7, col: K.gold, p: 0.9 * amt, seed: 300 + k + seedOff }); } };
  const beatPh = ((t - G0) / BEAT) % 1;
  if (t > T_STAR + 1.0) rays(Math.max(0, 1 - beatPh * 2.2) * (t > L.l5.t - 0.2 && t < L.l5.t + 1.4 ? 1 : (t > T_FACE ? 0.7 : 0.45)), Math.floor((t - G0) / BEAT) * 3);
  // child
  if (t > 0.1) child(KD, kidState(t));
  // after the wash: some uncovered stars twinkle with white crayon crosses
  if (t > BANDS[0].t0) for (let k = 0; k < 18; k++) {
    const s = WAX.filter(s => s.kind !== 'dot')[(k * 7) % WAX.filter(s => s.kind !== 'dot').length]; if (!s) continue;
    if (t < revealT(s) + 0.2) continue;
    const ph = (t * 0.8 + hash(k) * 3) % 2.6; if (ph > 0.6) continue;
    const a = Math.sin(ph / 0.6 * Math.PI), r = s.r * (1.4 + 1.1 * a);
    line(FX, [[s.x - r, s.y], [s.x + r, s.y]], { w: 4, col: K.white, p: a, seed: 800 + k, wob: 0.2 });
    line(FX, [[s.x, s.y - r], [s.x, s.y + r]], { w: 4, col: K.white, p: a, seed: 820 + k, wob: 0.2 });
  }
  // sleepy "z" after the yawn
  if (t > T_YAWN + 1.4) for (let j = 0; j < 3; j++) { const t0 = T_YAWN + 1.4 + j * 0.9; const u = (t - t0) / 2.0; if (u < 0 || u > 1) continue; text(FX, 'z', sx(KID.x + 150 + 50 * u), sy(KID.y - 560 - 120 * u), { size: (46 + 30 * u) * CAM.s, font: 'Gaegu', weight: 700, p: 1 - pr(u, 0.6, 1), seed: 60 + j, col: K.white }); }
  // wash
  if (t > BANDS[0].t0) drawWash(WASH, t);
  subTo(SUBK, SUBT, t);
  // composite (paper tooth anchored to the page; moves with the camera)
  comp.paperCam(CAM.x * 0.92, CAM.y * 0.92, CAM.s / 0.92);
  comp.begin();
  comp.group(WAXL);
  comp.crayon(BG.f.c); comp.crayon(BG.l.c);
  if (t > BANDS[0].t0) comp.wash(WASH.c, { color: PAL.wash });
  const go = [hash(BOIL.step) * 300, hash(BOIL.step + 7) * 300];
  comp.group(ST, { goff: go });
  comp.group(KD, { goff: go });       // the child and the star after the wash: they stay readable at night
  comp.crayon(FX.c, { goff: go });
  comp.knock(SUBK.c); comp.crayon(SUBT.c);
  comp.finish({ vig: 0.22 });
}

function drawWash(LW, t) {
  const g = LW.g; g.save();
  g.setTransform(CAM.s, 0, 0, CAM.s, W / 2 - CAM.x * CAM.s, H / 2 - CAM.y * CAM.s);
  for (const b of BANDS) {
    if (t < b.t0) continue;
    const f = bandFront(b, t), moving = t < b.t1;
    const top = [], bot = [];
    for (let x = X0; x <= X1; x += 40) {
      top.push([x, b.y0 + 10 * (Math.sin(x * 0.006 + b.seed) + 0.6 * Math.sin(x * 0.017 + b.seed * 3)) + 10 * hash(x * 0.37 + b.seed)]);
      const yb = b.seed === 3 ? hillY(x) + 26 : b.y1;
      bot.push([x, yb + 12 * (Math.sin(x * 0.005 + b.seed * 2) + 0.5 * Math.sin(x * 0.019 + b.seed)) + 10 * hash(x * 0.71 + b.seed)]);
    }
    const frontX = y => f + b.dir * 70 * Math.sin(clamp((y - b.y0) / (b.y1 - b.y0)) * Math.PI) + 12 * Math.sin(y * 0.05);
    g.save(); g.beginPath();
    if (b.dir > 0) { g.moveTo(X0 - 50, b.y0 - 200); for (let y = b.y0 - 200; y <= b.y1 + 200; y += 20) g.lineTo(frontX(y), y); g.lineTo(X0 - 50, b.y1 + 200); }
    else { g.moveTo(X1 + 50, b.y0 - 200); for (let y = b.y0 - 200; y <= b.y1 + 200; y += 20) g.lineTo(frontX(y), y); g.lineTo(X1 + 50, b.y1 + 200); }
    g.closePath(); g.clip();
    const shape = new Path2D(); top.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); for (let i = bot.length - 1; i >= 0; i--) shape.lineTo(bot[i][0], bot[i][1]); shape.closePath();
    g.fillStyle = '#000'; g.globalAlpha = 0.82; g.fill(shape);
    g.save(); g.clip(shape);
    const R = mulberry(b.seed * 97);
    for (let i = 0; i < 22; i++) {
      const yy = lerp(b.y0, b.y1, R()), wdt = 5 + R() * 22, dark = R() < 0.55;
      g.beginPath(); for (let x = X0; x <= X1; x += 60) { const y = yy + 6 * Math.sin(x * 0.004 + i) + 3 * Math.sin(x * 0.02 + i * 2); x === X0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.lineWidth = dark ? wdt : wdt * 0.5; g.globalCompositeOperation = dark ? 'source-over' : 'destination-out'; g.globalAlpha = dark ? 0.1 + R() * 0.08 : 0.04 + R() * 0.06; g.strokeStyle = '#000'; g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); for (let y = b.y0 - 80; y <= b.y1 + 80; y += 16) { const x = frontX(y) - b.dir * 14; y === b.y0 - 80 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.lineWidth = moving ? 34 : 22; g.globalAlpha = moving ? 0.3 : 0.14; g.stroke();
    g.restore(); g.restore();
  }
  g.restore();
}

// —— the printed words: a couplet on a ragged patch of paper; each word writes itself on as it is spoken ——
const SUBSIZE = 74;
function subTo(K_, T_, t) {
  const C = COUPLETS.find(c => t >= c.t0 && t < c.t1); if (!C) return;
  const g = K_.g; g.save(); g.font = `400 ${SUBSIZE}px "Patrick Hand"`;
  const wA = g.measureText(L[C.a].text).width, wB = g.measureText(L[C.b].text).width; g.restore();
  const cx = W / 2, y1 = H - 250, y2 = H - 150, hw = Math.max(wA, wB) / 2 + 50, hh = 112, cy = (y1 + y2) / 2 - 22;
  const open = pr(t, C.t0, C.t0 + 0.2);
  g.save(); g.fillStyle = '#000'; g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; const px = Math.cos(a), py = Math.sin(a); const sq = Math.pow(Math.abs(px), 0.25) * Math.sign(px); const n = 1 + 0.05 * Math.sin(a * 7 + 1.3) + 0.025 * Math.sin(a * 17); const X = cx + sq * hw * n * (0.6 + 0.4 * open), Y = cy + Math.pow(Math.abs(py), 0.5) * Math.sign(py) * hh * n; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
  g.closePath(); g.fill(); g.restore();
  [[C.a, y1], [C.b, y2]].forEach(([id, y], row) => {
    const l = L[id]; const ws = l.text.split(' ');
    // write word by word: a word starts 0.08 s before it is spoken and is written in ~0.3 s
    const g2 = T_.g; g2.save(); g2.font = `400 ${SUBSIZE}px "Patrick Hand"`; const full = g2.measureText(l.text).width; const sp = g2.measureText(' ').width; g2.restore();
    let x = cx - full / 2;
    ws.forEach((w, i) => {
      const g3 = T_.g; g3.save(); g3.font = `400 ${SUBSIZE}px "Patrick Hand"`; const ww = g3.measureText(w).width; g3.restore();
      const wt = l.words[i]; const rv = pr(t, wt.t0 - 0.08, wt.t0 - 0.08 + clamp(wt.t1 - wt.t0, 0.18, 0.34));
      if (rv > 0) text(T_, w, x, y, { size: SUBSIZE, col: K.ink, reveal: rv, seed: 11 + row * 50 + i * 7, p: 1, stroke: 1.4, align: 'left' });
      x += ww + sp;
    });
  });
}
export const TEXTS = () => [];
