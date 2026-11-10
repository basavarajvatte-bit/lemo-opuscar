// The child (front view only) and the big star with a face. Fully parametric: pose × expression × mouth opening.
// Local coords: origin between the feet, head centre (0,-252), head radius ~64. o.s scales to world units.
import { line, fill, dab, ellipse, handCircle, xf, smooth } from './crayon.js';
import { part, tube, curve } from './rig.js';
import { PAL } from './pal.js';
import { hash, clamp } from '/core/lib.js';
const K = PAL.crayon;
const LW = 9;

// arm skeletons (shoulder → elbow → wrist), right arm (screen right = child's left, but we just say R)
const ARMS = {
  down: { R: [[40, -184], [54, -150], [60, -112]] },
  wave0: { R: [[40, -184], [84, -204], [98, -258]] },
  wave1: { R: [[40, -184], [92, -198], [122, -244]] },
  point: { R: [[40, -184], [90, -214], [134, -254]] },
  up: { R: [[40, -184], [82, -232], [108, -298]], L: [[-40, -184], [-82, -232], [-108, -298]] },
  up2: { R: [[40, -184], [86, -228], [120, -290]], L: [[-40, -184], [-86, -228], [-120, -290]] },
  clasp: { R: [[40, -184], [50, -146], [10, -150]], L: [[-40, -184], [-50, -146], [-10, -150]] },
  hug: { R: [[40, -184], [36, -146], [-30, -170]], L: [[-40, -184], [-36, -142], [30, -160]] },
  chin: { R: [[40, -184], [84, -166], [66, -214]], front: 'R' },
  yawn: { L: [[-40, -184], [-56, -166], [-8, -206]], R: [[40, -184], [72, -246], [84, -316]], front: 'L' },
};

export function child(C, o) {
  const s = o.s || 1, sd = o.seed || 500;
  const T = pts => xf(pts, { x: o.x, y: o.y + (o.bob || 0), s });
  // head: rotate around the neck
  const nk = [0, -196], hr = o.tilt || 0;
  const TH = pts => T(pts.map(([x, y]) => { const dx = x - nk[0], dy = y - nk[1]; const c = Math.cos(hr), sn = Math.sin(hr); return [nk[0] + dx * c - dy * sn, nk[1] + dx * sn + dy * c]; }));
  // drawing-on progress: parts get their line and colour in order k (0..N)
  const ld = o.ld ?? 1, fd = o.fd ?? 1;
  let k = 0; const N = 14;
  const stage = (v) => clamp(v * N - (k++) * 0.55);
  const lo = (seed, extra = {}) => ({ w: LW, seed, col: K.ink, ...extra });
  const P = (poly, f, l, opt) => { const a = stage(ld), b = clamp(fd * 1.25 - k / N * 0.25); if (a <= 0) return; part(C, poly, f ? { ...f, draw: b } : null, l ? { ...l, draw: a } : null, opt); };

  const pyF = { col: K.teal, p: 0.8, gap: 10, w: 12, ang: 0.5, seed: sd + 1, over: 5, cross: true, crossP: 0.5 };
  const skinF = { col: K.skin, p: 0.62, gap: 9, w: 11, ang: 0.7, seed: sd + 2, over: 3 };
  const hairF = { col: K.hair, p: 0.9, gap: 8, w: 11, ang: 1.1, seed: sd + 3, over: 3, cross: true, crossP: 0.6 };
  const A = { ...ARMS.down, ...(ARMS[o.arms] || {}) };
  if (o.arms && ARMS[o.arms] && !ARMS[o.arms].L) A.L = ARMS.down.R.map(([x, y]) => [-x, y]);
  if (!A.L) A.L = ARMS.down.R.map(([x, y]) => [-x, y]);

  // 1) back hair puff (behind the head), bumpy cloud of curls
  const puff = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; const r = 86 + 9 * Math.abs(Math.sin(a * 6.5)) + 3 * Math.sin(a * 3 + 1); puff.push([Math.cos(a) * r, -262 + Math.sin(a) * r * 0.92]); }
  P(TH(puff), hairF, null);
  const k0 = k; k = k0;
  // outline only the outer upper edge of the hair mass
  if (ld > 0) line(C.l, TH(puff.slice(37, 72).concat([puff[0]])), lo(sd + 4, { draw: stage(ld) }));

  // 2) legs (pyjama trousers) + feet
  const legL = [[-20, -118], [-22, -64], [-24, -16]], legR = legL.map(([x, y]) => [-x, y]);
  const legs = o.legs || [legL, legR];
  legs.forEach((lg, i) => {
    P(T(tube(curve(lg, 5), 34, 30)), { ...pyF, seed: sd + 10 + i }, lo(sd + 12 + i));
    const f = lg[lg.length - 1];
    P(T(ellipse(f[0] + (i ? 8 : -8), f[1] + 8, 24, 12, 22)), { ...skinF, seed: sd + 14 + i }, lo(sd + 16 + i, { w: 7 }));
  });
  // 3) pyjama top
  const top = smooth([[-36, -198], [36, -198], [52, -160], [60, -104], [30, -96], [0, -100], [-30, -96], [-60, -104], [-52, -160]], 5);
  P(T(top), pyF, lo(sd + 20));
  // star print (small lemon stars, no outline)
  if (fd > 0.7) [[-24, -150], [26, -128], [-6, -116], [20, -176], [-30, -64], [24, -40]].forEach(([x, y], i) => smallStar(C.f, T([[x, y]])[0], 8 * s, sd + 30 + i, 0.3 * i, clamp((fd - 0.7) / 0.3)));
  // 4) arms (behind-head ones first)
  const arm = (pts, side) => {
    P(T(tube(curve(pts, 5), 26, 22)), { ...pyF, seed: sd + 40 + side }, lo(sd + 42 + side));
    const w = pts[pts.length - 1], e = pts[pts.length - 2]; const dx = w[0] - e[0], dy = w[1] - e[1], d = Math.hypot(dx, dy);
    const hc = [w[0] + dx / d * 12, w[1] + dy / d * 12];
    P(T(handCircle(hc[0], hc[1], 15, sd + 44 + side, 0, 20)), { ...skinF, seed: sd + 46 + side }, lo(sd + 48 + side, { w: 7 }));
  };
  if (A.front !== 'L') arm(A.L, 0);
  if (A.front !== 'R') arm(A.R, 1);
  // 5) head
  [[-66, -248], [66, -248]].forEach(([x, y], i) => P(TH(handCircle(x, y, 14, sd + 50 + i, 0, 18)), { ...skinF, seed: sd + 52 + i }, lo(sd + 54 + i, { w: 7 })));
  const face = ellipse(0, -250, 66, 62, 48);
  P(TH(face), skinF, null);
  if (ld > 0) line(C.l, TH(ellipse(0, -250, 66, 62, 36, -0.15, Math.PI + 0.15)), lo(sd + 56, { draw: stage(ld) }));
  // fringe: a cap of curls with a scalloped lower edge
  const fr = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; fr.push([Math.cos(a) * 72, -262 + Math.sin(a) * 66]); }
  for (let i = 0; i <= 30; i++) { const u = i / 30; const x = 70 - u * 140; fr.push([x, -268 + Math.cos(u * Math.PI * 6) * 8 - Math.sin(u * Math.PI) * 18 + 8]); }
  P(TH(fr), { ...hairF, seed: sd + 60 }, null);
  if (ld > 0) line(C.l, TH(fr.slice(25)), lo(sd + 61, { w: 6, draw: stage(ld) }));
  // a curl on top
  if (ld > 0) line(C.l, TH(curve([[-10, -340], [-2, -362], [18, -362], [16, -346], [4, -350]])), lo(sd + 62, { w: 8, col: K.hair, draw: stage(ld) }));
  // face features appear only once the face is coloured
  if (fd > 0.55 || o.featuresEarly) {
    const ex = o.expr || 'open';
    // eyes
    [-24, 24].forEach((x, i) => {
      const y = -246;
      const shut = ex === 'blink' || ex === 'sleepy' || (ex === 'wink' && i === 0);
      if (shut || ex === 'happy') {
        const yy = ex === 'happy' ? 4 : 0;
        line(C.l, TH(ex === 'happy' ? [[x - 11, y + 4], [x - 4, y - 5], [x + 4, y - 5], [x + 11, y + 4]] : [[x - 11, y - 1 + yy], [x - 4, y + 5], [x + 4, y + 5], [x + 11, y - 1]]), lo(sd + 70 + i, { w: 6, taper: 0.3 }));
        return;
      }
      const ry = ex === 'wide' ? 12 : 10.5;
      part(C, TH(ellipse(x + (o.look || 0) * 3, y + (o.lookY || 0) * 3, 8, ry, 18)), { col: K.ink, p: 1, gap: 3.2, w: 5, over: 0.5, seed: sd + 72 + i, ang: 1.3 }, lo(sd + 74 + i, { w: 5 }), { occ: false });
      dab(C.l, ...TH([[x + 3 + (o.look || 0) * 3, y - 4 + (o.lookY || 0) * 3]])[0], 3 * s, { col: K.white, p: 1, seed: sd + 76 + i, gap: 2, w: 3 });
    });
    // eyebrows (small, curious)
    [-24, 24].forEach((x, i) => { const up = o.brow || 0; line(C.l, TH([[x - 10, -270 - up * 4 + (i ? 0 : 0)], [x, -273 - up * 6], [x + 10, -270 - up * 4]]), lo(sd + 78 + i, { w: 5, col: K.hair })); });
    // cheeks
    [[-42, -226], [42, -226]].forEach(([x, y], i) => dab(C.f, ...TH([[x, y]])[0], 11 * s, { col: K.rose, p: 0.8, seed: sd + 80 + i, sq: 0.7 }));
    // nose
    line(C.l, TH([[-5, -234], [0, -230], [5, -234]]), lo(sd + 82, { w: 5 }));
    mouth(C, TH, o.mouth || 0, ex, sd + 84, s);
  }
  // front arms (hand at the chin / mouth)
  if (A.front === 'L') arm(A.L, 0);
  if (A.front === 'R') arm(A.R, 1);
}

function mouth(C, TH, m, ex, sd, s) {
  const lo = (seed, extra = {}) => ({ w: 6, seed, col: K.ink, ...extra });
  const y = -212;
  if (ex === 'yawn') m = 1.15;
  if (m < 0.12) {   // closed smile
    line(C.l, TH([[-15, y - 4], [-7, y + 4], [7, y + 4], [15, y - 4]]), lo(sd));
    return;
  }
  const rx = 9 + 7 * Math.min(m, 1), ry = 3 + 12 * m;
  const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; const yy = Math.sin(a) > 0 ? Math.sin(a) * ry : Math.sin(a) * ry * 0.45; pts.push([Math.cos(a) * rx, y + 2 + yy]); }
  part(C, TH(pts), { col: K.red, p: 0.95, gap: 3, w: 4.5, over: 0.5, seed: sd }, lo(sd + 1), { occ: false });
  if (m > 0.45) dab(C.f, ...TH([[0, y + 2 + ry * 0.6]])[0], rx * 0.45 * s, { col: K.rose, p: 0.9, seed: sd + 2, sq: 0.6 });
}

export function smallStar(L, c, r, seed, rot = 0, p = 1, col = K.lemon) {
  const pts = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + rot + k * Math.PI / 5; const rr = k % 2 ? r * 0.48 : r; pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  fill(L, pts, { col, p: 0.95 * p, gap: 3, w: 4, over: 1, seed });
}

// The big star: lemon, plum outline, optional face (eyes, smile, wink), gold glow strokes
export function bigStar(C, o) {
  const { x, y, r } = o, sd = o.seed || 900, rot = o.rot || 0;
  const pts = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + rot + k * Math.PI / 5; const rr = k % 2 ? r * 0.5 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  const sm = [];   // slightly rounded corners
  for (let i = 0; i < 10; i++) { const a = pts[i], b = pts[i + 1]; sm.push(a, [a[0] * 0.85 + b[0] * 0.15, a[1] * 0.85 + b[1] * 0.15], [a[0] * 0.15 + b[0] * 0.85, a[1] * 0.15 + b[1] * 0.85]); }
  sm.push(sm[0]);
  part(C, sm, { col: K.lemon, p: 1.0, gap: 8, w: 11, ang: 0.4, seed: sd, over: 5, draw: o.fd ?? 1, cross: true, crossP: 0.6, crossAng: 1.1 }, { w: 9, col: K.ink, seed: sd + 1, draw: o.ld ?? 1 });
  if (o.face > 0) {
    const fx = (pts) => pts.map(([a, b]) => [x + a * r / 100, y + b * r / 100]);
    const dr = o.face;
    // eyes
    [-24, 24].forEach((ex, i) => {
      if (o.wink && i === 1) { line(C.l, fx([[ex - 11, 0], [ex - 3, 7], [ex + 5, 7], [ex + 12, 0]]), { w: 7, col: K.ink, seed: sd + 10 + i, draw: dr }); return; }
      part(C, fx(ellipse(ex, 0, 8, 11, 16)), { col: K.ink, p: 1, gap: 3, w: 5, over: 0.5, seed: sd + 12 + i, draw: dr }, { w: 5, col: K.ink, seed: sd + 14 + i, draw: dr }, { occ: false });
      if (dr >= 1) dab(C.l, ...fx([[ex + 3, -4]])[0], 3, { col: K.white, p: 1, seed: sd + 16 + i, gap: 2, w: 3 });
    });
    line(C.l, fx([[-18, 22], [-8, 32], [8, 32], [18, 22]]), { w: 7, col: K.ink, seed: sd + 20, draw: dr });
    [[-44, 20], [44, 20]].forEach(([a, b], i) => dab(C.f, ...fx([[a, b]])[0], 10, { col: K.rose, p: 0.8 * dr, seed: sd + 22 + i, sq: 0.7 }));
  }
}
