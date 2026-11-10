// Model sheet: poses × expressions × mouth shapes, drawn with the real engine
import { layer, clear, text, CAM, BOIL } from './crayon.js';
import { group, clearGroup } from './rig.js';
import { child, bigStar } from './child.js';
import { PAL } from './pal.js';
const G = group(), T = layer();
export function sheet(comp, t, Q) {
  clearGroup(G); clear(T);
  [CAM.x, CAM.y, CAM.s] = [540, 960, 1];
  const page = Q.get('page') || 'poses';
  if (page === 'poses') {
    const poses = ['down', 'wave0', 'point', 'chin', 'up', 'hug', 'yawn', 'clasp'];
    const ex = ['open', 'happy', 'open', 'open', 'wide', 'happy', 'yawn', 'open'];
    poses.forEach((p, i) => { const cx = 150 + (i % 4) * 260, cy = 860 + Math.floor(i / 4) * 760; child(G, { x: cx, y: cy, s: 0.95, arms: p, expr: ex[i], seed: 500 }); text(T, p, cx, cy + 70, { size: 40, col: PAL.crayon.ink }); });
  } else if (page === 'mouth') {
    [0, 0.3, 0.6, 1.0].forEach((m, i) => { const cx = 270 + (i % 2) * 540, cy = 980 + Math.floor(i / 2) * 900; child(G, { x: cx, y: cy, s: 2.0, mouth: m, expr: i === 3 ? 'wide' : 'open', seed: 500 }); text(T, 'mouth ' + m, cx, cy + 70, { size: 44, col: PAL.crayon.ink }); });
  } else {
    bigStar(G, { x: 300, y: 400, r: 160, face: 0 });
    bigStar(G, { x: 760, y: 400, r: 160, face: 1 });
    bigStar(G, { x: 540, y: 1000, r: 220, face: 1, wink: true });
    child(G, { x: 540, y: 1850, s: 1.4, arms: 'point', expr: 'open', mouth: 0.5, look: 1, lookY: -1, tilt: 0.12, seed: 500 });
  }
  comp.paperCam(0, 0, 1);
  comp.begin(); comp.group(G); comp.crayon(T.c); comp.finish({ vig: 0.25 });
}
