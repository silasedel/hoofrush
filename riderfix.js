// riderfix.js — rider (Michelle.glb) reshaping + riding pose for HOOF RUSH.
// reshapeRider(proto): one-time bind-pose geometry edit (hair tucked under helmet,
// tight breeches + slim riding boots, more average adult girth).
import * as THREE from 'three';

// Additive euler deltas on top of the rest rotations (same format as POSE in game.js).
// Solved with IK at RIDER_Y=1.725 for flaps flat on the barrel (ellipse cy=1.255 rx=0.218 ry=0.262, flap +0.008):
// hands ~(+-0.09, 1.78, 0.42); knees (+-0.285, 1.396, 0.158); ankles (+-0.289, 0.960, 0.070); lower legs vertical
// against the barrel, heels down, fists closed thumbs up. Right side = exact mirror of left (x same, y/z negated).
// Clearance: leg surfaces at |x| >= 0.233 below y=1.45 (resting on the flaps); inner thigh <= ~1 cm into pad top.
export const RIDER_POSE = {
  'mixamorigSpine': [0.12,  0,  0],
  'mixamorigSpine1': [0.05,  0,  0],
  'mixamorigNeck': [-0.05,  0,  0],
  'mixamorigHead': [-0.12,  0,  0],
  'mixamorigLeftArm': [1.079,  0.245,  0.853],
  'mixamorigLeftForeArm': [-0.222,  0.017,  0.907],
  'mixamorigLeftHand': [0.218,  -0.743,  -0.349],
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
  'mixamorigRightArm': [1.078,  -0.239,  -0.858],
  'mixamorigRightForeArm': [-0.224,  -0.014,  -0.907],
  'mixamorigRightHand': [0.228,  0.718,  0.349],
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
  'mixamorigLeftUpLeg': [-0.919,  0.517,  0.743],
  'mixamorigLeftLeg': [-0.907,  0.316,  0.05],
  'mixamorigLeftFoot': [1.136,  -0.254,  -0.318],
  'mixamorigRightUpLeg': [-0.918,  -0.524,  -0.738],
  'mixamorigRightLeg': [-0.89,  -0.309,  -0.049],
  'mixamorigRightFoot': [1.1,  0.247,  0.324],
};

// Rider group y in horse space (hips bone sits at rider group origin).
export const RIDER_Y = 1.725;

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
    // breeches: thigh 0.074 at hip -> 0.054 above knee (metres, bind space ~1.66m tall)
    set(s + 'UpLeg', { mode: 'tight', prof: t => THREE.MathUtils.lerp(0.074, 0.054, t), keep: 0.2, t0: 0.12 });
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
