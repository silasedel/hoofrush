// riderfix.js — rider (Michelle.glb) reshaping + riding pose for HOOF RUSH.
// reshapeRider(proto): one-time bind-pose geometry edit (hair tucked under helmet,
// tight breeches + slim riding boots, more average adult girth).
import * as THREE from 'three';

// Additive euler deltas on top of the rest rotations (same format as POSE in game.js).
export let RIDER_POSE = {};

// Rider group y in horse space (hips bone sits at rider group origin).
export const RIDER_Y = 1.66;

// Helmet placement in head-bone-normalized units (multiply by k = 1/headBoneWorldScale).
export const HELMET = { pos: [0, 0.13, -0.005], scale: [1.05, 1, 1.12] };

const tmpM = new THREE.Matrix4();

export function reshapeRider(proto) {
  proto.traverse(n => { if (n.isSkinnedMesh) reshapeMesh(n); });
}

function reshapeMesh(mesh) {
  const geo = mesh.geometry;
  if (geo.userData.reshaped) return;
  geo.userData.reshaped = true;
  const pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  const bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses;
  // bone positions in geometry (bind) space: bindMatrix^-1 * inverse(boneInverse)
  const bindInv = mesh.bindMatrix.clone().invert();
  const bp = bones.map((b, i) => new THREE.Vector3().setFromMatrixPosition(tmpM.copy(inv[i]).invert().premultiply(bindInv)));
  const idx = {}; bones.forEach((b, i) => { idx[b.name.replace(/^mixamorig:?/, '')] = i; });
  const B = nm => idx[nm];
  const child = {};
  bones.forEach((b, i) => { const c = b.children.find(ch => ch.isBone && bones.includes(ch)); if (c) child[i] = bones.indexOf(c); });
  // segment axes per bone
  const seg = i => { const a = bp[i], c = child[i] !== undefined ? bp[child[i]] : null; return c ? [a, c] : null; };

  // ---- radial profile rules per bone (segment from bone to its child) ----
  // mode 'scale': multiply radial distance by f.  mode 'tight': set to target radius profile r(t) keeping
  // a fraction of the original wrinkle amplitude.
  const rules = {};
  const set = (nm, r) => { if (B(nm) !== undefined) rules[B(nm)] = r; };
  for (const s of ['Left', 'Right']) {
    set(s + 'Arm', { mode: 'scale', f: 1.22 });
    set(s + 'ForeArm', { mode: 'scale', f: 1.15 });
    set(s + 'Shoulder', { mode: 'scale', f: 1.08 });
    // breeches: thigh 0.085 at hip -> 0.058 above knee (metres, bind space ~1.66m tall)
    set(s + 'UpLeg', { mode: 'tight', prof: t => THREE.MathUtils.lerp(0.083, 0.056, t), keep: 0.25, t0: 0.12 });
    // tall boot: knee 0.054 -> calf 0.058 -> ankle 0.042
    set(s + 'Leg', { mode: 'tight', prof: t => t < 0.35 ? THREE.MathUtils.lerp(0.054, 0.058, t / 0.35) : THREE.MathUtils.lerp(0.058, 0.041, (t - 0.35) / 0.65), keep: 0.1 });
    set(s + 'Foot', { mode: 'foot' });
    set(s + 'ToeBase', { mode: 'foot' });
  }
  set('Spine', { mode: 'torso', fx: 1.12, fz: 1.12 });
  set('Spine1', { mode: 'torso', fx: 1.14, fz: 1.1 });
  set('Spine2', { mode: 'torso', fx: 1.12, fz: 1.08 });
  set('Hips', { mode: 'torso', fx: 1.08, fz: 1.06 });
  set('Neck', { mode: 'scale', f: 1.1 });

  // first pass: mean radius per bin along tight segments
  const NB = 24, stats = {};
  const v = new THREE.Vector3(), ax = new THREE.Vector3(), d = new THREE.Vector3(), pr = new THREE.Vector3();
  const domBone = vi => { let best = 0; for (let k = 1; k < 4; k++) if (sw.getComponent(vi, k) > sw.getComponent(vi, best)) best = k; return si.getComponent(vi, best); };
  const project = (bi, p) => { const [a, c] = seg(bi); ax.subVectors(c, a); const L = ax.length(); ax.divideScalar(L); const t = d.subVectors(p, a).dot(ax) / L; pr.copy(a).addScaledVector(ax, t * L); return t; };
  for (const bi in rules) {
    if (rules[bi].mode !== 'tight') continue;
    stats[bi] = { s: new Float32Array(NB), n: new Float32Array(NB) };
  }
  for (let i = 0; i < pos.count; i++) {
    const bi = domBone(i); const st = stats[bi]; if (!st) continue;
    v.fromBufferAttribute(pos, i); const t = project(bi, v); if (t < -0.1 || t > 1.1) continue;
    const b = Math.min(NB - 1, Math.max(0, Math.floor(t * NB))); st.s[b] += v.distanceTo(pr); st.n[b]++;
  }
  for (const bi in stats) { const st = stats[bi]; st.m = new Float32Array(NB); let last = 0.06; for (let b = 0; b < NB; b++) { st.m[b] = st.n[b] ? st.s[b] / st.n[b] : last; last = st.m[b]; } }

  const out = new THREE.Vector3(), disp = new THREE.Vector3(), q = new THREE.Vector3();
  const headI = B('Head'), headTop = B('HeadTop_End');
  const skullC = bp[headI].clone().lerp(bp[headTop], 0.5); // approx skull centre
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); out.set(0, 0, 0);
    let wsum = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k); if (w <= 0) continue;
      const bi = si.getComponent(i, k); const r = rules[bi]; wsum += w;
      if (!r) continue;
      disp.set(0, 0, 0);
      if (r.mode === 'torso') {
        const a = bp[bi]; disp.set((v.x - a.x) * (r.fx - 1), 0, (v.z - a.z) * (r.fz - 1));
      } else if (seg(bi)) {
        const t = project(bi, v); q.subVectors(v, pr); const rad = q.length();
        if (r.mode === 'scale') disp.copy(q).multiplyScalar(r.f - 1);
        else if (r.mode === 'tight' && rad > 1e-5) {
          const tc = THREE.MathUtils.clamp(t, 0, 1); const st = stats[bi];
          const b = Math.min(NB - 1, Math.max(0, Math.floor(tc * NB)));
          const mean = st.m[b]; const target = r.prof(tc);
          // keep some of the shape variation around the mean, scaled to target
          const nr = target * (1 + (rad / mean - 1) * r.keep);
          let blend = 1; if (r.t0 && t < r.t0) blend = THREE.MathUtils.clamp(t / r.t0, 0, 1) * 0.7 + 0.3;
          disp.copy(q).multiplyScalar((nr / rad - 1) * blend);
        } else if (r.mode === 'foot') {
          // slim riding-boot foot: narrow sideways, lower the instep/toe box
          const a = bp[bi]; disp.set((v.x - a.x) * -0.28, 0, 0);
          if (q.y > 0) disp.y += -q.y * 0.3;
        }
      }
      out.addScaledVector(disp, w);
    }
    if (wsum > 0) out.divideScalar(wsum);
    v.add(out);
    // ---- hair: collapse everything outside the skull onto it ----
    let hw = 0; for (let k = 0; k < 4; k++) { const bi = si.getComponent(i, k); if (bi === headI || bi === headTop) hw += sw.getComponent(i, k); }
    if (hw > 0.05) {
      d.subVectors(v, skullC); const r = d.length();
      // skull ellipsoid radii (x, y, z)
      const ex = 0.083, ey = 0.105, ez = 0.098;
      const e = Math.sqrt((d.x / ex) ** 2 + (d.y / ey) ** 2 + (d.z / ez) ** 2);
      const face = d.z > 0.035 && Math.abs(d.x) < 0.075 && d.y < 0.045; // keep the face as is
      if (e > 1 && !face) {
        const k = 1 / e; // pull onto ellipsoid
        const f = THREE.MathUtils.lerp(1, k, Math.min(1, hw * 2));
        v.copy(skullC).addScaledVector(d, f);
      }
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox(); geo.computeBoundingSphere();
}
