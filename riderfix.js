// riderfix.js — rider (Michelle.glb) reshaping + riding pose for HOOF RUSH.
// reshapeRider(proto): one-time bind-pose geometry edit (hair tucked under helmet,
// tight breeches + slim riding boots, more average adult girth).
import * as THREE from 'three';

// Additive euler deltas on top of the rest rotations (same format as POSE in game.js).
// Solved with IK for horse space: hands ~(+-0.09, 1.78, 0.42), knees ~(+-0.245, 1.32, 0.20),
// ankles ~(+-0.26, 0.89, 0.11) (legs hug the narrow saddle / barrel), heels down, thumbs up, fists closed.
// Right side is the exact mirror of the left (x same, y/z negated).
export const RIDER_POSE = {
  'mixamorigSpine': [0.12,  0,  0],
  'mixamorigSpine1': [0.05,  0,  0],
  'mixamorigNeck': [-0.05,  0,  0],
  'mixamorigHead': [-0.12,  0,  0],
  'mixamorigLeftArm': [0.995,  0.193,  0.898],
  'mixamorigLeftForeArm': [-0.329,  -0.006,  1.122],
  'mixamorigLeftHand': [0.125,  -0.949,  -0.644],
  'mixamorigLeftHandThumb1': [0.225,  0.201,  -0.01],
  'mixamorigLeftHandThumb2': [0.467,  0.033,  0.17],
  'mixamorigLeftHandThumb3': [0.334,  -0.012,  0.222],
  'mixamorigLeftHandIndex1': [1.224,  0.3,  0.204],
  'mixamorigLeftHandIndex2': [1.316,  0.24,  0.309],
  'mixamorigLeftHandIndex3': [-0.85,  0.109,  -0.239],
  'mixamorigLeftHandMiddle1': [1.232,  0.218,  0.263],
  'mixamorigLeftHandMiddle2': [1.24,  0.314,  0.44],
  'mixamorigLeftHandMiddle3': [-0.793,  0.148,  -0.354],
  'mixamorigLeftHandRing1': [1.237,  0.15,  0.304],
  'mixamorigLeftHandRing2': [1.288,  0.272,  0.362],
  'mixamorigLeftHandRing3': [-0.838,  0.121,  -0.268],
  'mixamorigLeftHandPinky1': [1.24,  0.123,  0.324],
  'mixamorigLeftHandPinky2': [1.319,  0.235,  0.303],
  'mixamorigLeftHandPinky3': [-0.848,  0.11,  -0.246],
  'mixamorigRightArm': [0.993,  -0.187,  -0.903],
  'mixamorigRightForeArm': [-0.331,  0.01,  -1.121],
  'mixamorigRightHand': [0.141,  0.925,  0.639],
  'mixamorigRightHandThumb1': [0.228,  -0.2,  0.013],
  'mixamorigRightHandThumb2': [0.469,  -0.031,  -0.166],
  'mixamorigRightHandThumb3': [0.331,  0.011,  -0.227],
  'mixamorigRightHandIndex1': [1.228,  -0.31,  -0.182],
  'mixamorigRightHandIndex2': [1.299,  -0.258,  -0.343],
  'mixamorigRightHandIndex3': [-0.833,  -0.122,  0.279],
  'mixamorigRightHandMiddle1': [1.236,  -0.226,  -0.242],
  'mixamorigRightHandMiddle2': [1.284,  -0.276,  -0.368],
  'mixamorigRightHandMiddle3': [-0.836,  -0.124,  0.27],
  'mixamorigRightHandRing1': [1.24,  -0.173,  -0.277],
  'mixamorigRightHandRing2': [1.328,  -0.224,  -0.285],
  'mixamorigRightHandRing3': [-0.858,  -0.101,  0.219],
  'mixamorigRightHandPinky1': [1.245,  -0.111,  -0.314],
  'mixamorigRightHandPinky2': [1.299,  -0.258,  -0.345],
  'mixamorigRightHandPinky3': [-0.826,  -0.126,  0.296],
  'mixamorigLeftUpLeg': [-0.804, 0.407, 0.527],
  'mixamorigLeftLeg': [-0.886, 0.241, 0.05],
  'mixamorigLeftFoot': [1.163, -0.165, -0.173],
  'mixamorigRightUpLeg': [-0.802, -0.413, -0.523],
  'mixamorigRightLeg': [-0.869, -0.236, -0.049],
  'mixamorigRightFoot': [1.126, 0.16, 0.179],
};

// Rider group y in horse space (hips bone sits at rider group origin).
export const RIDER_Y = 1.66;

// Helmet placement in head-bone-normalized units (multiply by k = 1/headBoneWorldScale).
export const HELMET = { pos: [0, 0.112, -0.012], scale: [0.93, 0.9, 1.0] };

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
  // fuller adult waist: lower spine / waist / hips get the most extra girth (no wasp waist)
  set('Spine', { mode: 'torso', fx: 1.26, fz: 1.2 });
  set('Spine1', { mode: 'torso', fx: 1.2, fz: 1.14 });
  set('Spine2', { mode: 'torso', fx: 1.1, fz: 1.07 });
  set('Hips', { mode: 'torso', fx: 1.14, fz: 1.12 });
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
          const a = bp[B(bones[bi].name.includes('Left') ? 'LeftFoot' : 'RightFoot')]; disp.set((v.x - a.x) * -0.3, 0, 0);
          const top = v.y - 0.035; if (top > 0) disp.y -= top * 0.35; // lower the chunky sneaker instep
          if (v.y < 0.02) disp.y += (0.02 - v.y) * 0.5; // thinner sole
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
      const ex = 0.08, ey = 0.1, ez = 0.094;
      const e = Math.sqrt((d.x / ex) ** 2 + (d.y / ey) ** 2 + (d.z / ez) ** 2);
      const face = d.z > 0.035 && Math.abs(d.x) < 0.075 && d.y < 0.045; // keep the face as is
      if (e > 1 && !face) {
        const k = 1 / e; // pull onto ellipsoid
        const f = THREE.MathUtils.lerp(1, k, Math.min(1, hw * 2));
        v.copy(skullC).addScaledVector(d, f);
      }
      // flatten headphone cups / side hair against the head
      if (!face && Math.abs(v.x - skullC.x) > 0.08) v.x = skullC.x + Math.sign(v.x - skullC.x) * (0.08 + (Math.abs(v.x - skullC.x) - 0.08) * 0.25);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox(); geo.computeBoundingSphere();
}
