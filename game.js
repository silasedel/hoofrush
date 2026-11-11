import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

// ---------------- CONFIG ----------------
const DURATION = 150;           // seconds per race
const LANES = [3.2, 0, -3.2];   // screen left -> right
const GATE_GAP = 170;
const BASE_SPEED = 16;
const PREFIX = 'hoofrush-v1-';
const COLORS = ['#ff4d6d', '#3a86ff', '#22c06b', '#ffbe0b', '#9b5de5', '#ff8a2b', '#00bbf9', '#f15bb5'];

const QUESTIONS = [
  // Horse / equestrian (for sis)
  ['A baby horse is called a…', 'Foal', 'Calf', 'Kid'],
  ['A female horse is called a…', 'Mare', 'Stallion', 'Gelding'],
  ['Horse height is measured in…', 'Hands', 'Feet', 'Hooves'],
  ['One "hand" equals…', '4 inches', '6 inches', '10 inches'],
  ['The fastest horse gait is the…', 'Gallop', 'Trot', 'Walk'],
  ['A horse\'s slowest gait is the…', 'Walk', 'Canter', 'Trot'],
  ['Which is a 3-beat gait?', 'Canter', 'Trot', 'Walk'],
  ['Show jumping fence knocked down = ', '4 faults', '1 fault', '10 faults'],
  ['Dressage is sometimes called…', 'Horse ballet', 'Horse soccer', 'Horse tag'],
  ['What do horses mostly eat?', 'Hay & grass', 'Meat', 'Bread'],
  ['A horse\'s hair along the neck is the…', 'Mane', 'Fetlock', 'Withers'],
  ['A very small horse breed:', 'Shetland pony', 'Clydesdale', 'Thoroughbred'],
  ['Huge draft horse breed:', 'Clydesdale', 'Arabian', 'Mustang'],
  ['Wild horses in the USA are called…', 'Mustangs', 'Broncos', 'Colts'],
  ['Where do you sit on a horse?', 'Saddle', 'Bridle', 'Halter'],
  ['Metal shoes are put on by a…', 'Farrier', 'Jockey', 'Groom'],
  ['Horses can sleep…', 'Standing up', 'Upside down', 'Underwater'],
  ['A horse has how many legs?', '4', '6', '3'],
  ['Spotted horse breed:', 'Appaloosa', 'Friesian', 'Shire'],
  ['Unicorn has one…', 'Horn', 'Wing', 'Tail'],
  ['Eventing combines dressage, jumping &…', 'Cross-country', 'Swimming', 'Racing'],
  ['A horse\'s home in the barn is a…', 'Stall', 'Coop', 'Den'],
  ['Famous Kentucky horse race:', 'Kentucky Derby', 'Super Bowl', 'Indy 500'],
  // General / mom
  ['Largest planet?', 'Jupiter', 'Mars', 'Earth'],
  ['Which is a fruit?', 'Tomato', 'Carrot', 'Potato'],
  ['Main ingredient in guacamole?', 'Avocado', 'Pea', 'Cucumber'],
  ['Pizza originated in…', 'Italy', 'France', 'USA'],
  ['How many continents?', '7', '5', '9'],
  ['Color of a giraffe\'s tongue?', 'Purple', 'Pink', 'Green'],
  ['Frozen\'s snowman is…', 'Olaf', 'Sven', 'Hans'],
  ['Capital of France?', 'Paris', 'Rome', 'Madrid'],
  ['Bees make…', 'Honey', 'Milk', 'Silk'],
  ['Fastest land animal?', 'Cheetah', 'Horse', 'Lion'],
  ['Days in a leap year?', '366', '365', '364'],
  ['Which is NOT a primary color?', 'Green', 'Red', 'Blue'],
  ['Spider legs?', '8', '6', '10'],
  // Quick math
  ['7 × 8 = ?', '56', '54', '64'],
  ['12 + 19 = ?', '31', '29', '32'],
  ['9 × 6 = ?', '54', '56', '48'],
  ['100 − 37 = ?', '63', '73', '67'],
  ['15 × 4 = ?', '60', '45', '55'],
  ['144 ÷ 12 = ?', '12', '14', '11'],
  ['25% of 80 = ?', '20', '25', '40'],
  ['3² + 4² = ?', '25', '49', '14'],
];

// ---------------- UTIL ----------------
const $ = (id) => document.getElementById(id);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

// ---------------- AUDIO ----------------
let actx;
function beep(freqs, dur = 0.12, type = 'triangle', vol = 0.15) {
  try {
    actx = actx || new AudioContext();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      const t0 = actx.currentTime + i * dur;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur * 1.6);
      o.start(t0); o.stop(t0 + dur * 1.7);
    });
  } catch (e) {}
}
const sfx = {
  good: () => beep([660, 880, 1320], 0.09),
  bad: () => beep([220, 150], 0.18, 'sawtooth', 0.1),
  coin: () => beep([1200], 0.05, 'square', 0.05),
  jump: () => beep([300, 500], 0.06, 'sine', 0.12),
  knock: () => beep([120, 90], 0.12, 'square', 0.12),
  buy: () => beep([523, 659, 784], 0.07),
};
let lastHoof = 0;
function hoofbeat(t, speed) {
  const period = 0.36 * (BASE_SPEED / Math.max(8, speed));
  if (t - lastHoof > period) { lastHoof = t; beep([90 + Math.random() * 20], 0.04, 'sine', 0.06); }
}

// ---------------- RENDERER / SCENE ----------------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbcd6ea, 70, 300);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 2000);

const sky = new Sky(); sky.scale.setScalar(5000);
const su = sky.material.uniforms;
su.turbidity.value = 4; su.rayleigh.value = 1.4; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.85;
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(200));
su.sunPosition.value.copy(sunDir);
scene.add(sky);
{ // environment lighting from sky
  const pm = new THREE.PMREMGenerator(renderer); const s2 = new THREE.Scene(); const sk2 = new Sky(); sk2.scale.setScalar(5000);
  Object.assign(sk2.material.uniforms.sunPosition.value, sunDir); s2.add(sk2);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sk2.material.uniforms[k].value = su[k].value;
  scene.environment = pm.fromScene(s2).texture; scene.environmentIntensity = 0.6;
}
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.2));
const sun = new THREE.DirectionalLight(0xfff1d6, 4.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// Ground
const grassTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5b8f2e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const s = Math.random(); g.fillStyle = `hsl(${85 + s * 30},${45 + s * 20}%,${26 + Math.random() * 20}%)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 3 + Math.random() * 4); }
}, true);
grassTex.repeat.set(60, 60);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const dirtTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b08458'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { g.fillStyle = `hsla(${25 + Math.random() * 10},${30 + Math.random() * 25}%,${35 + Math.random() * 30}%,.8)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  for (const x of [w * 0.33, w * 0.66]) { g.fillStyle = 'rgba(80,50,25,.18)'; g.fillRect(x - 3, 0, 6, h); }
}, true);
dirtTex.repeat.set(1, 60);
const track = new THREE.Mesh(new THREE.PlaneGeometry(11, 600), new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1 }));
track.rotation.x = -Math.PI / 2; track.position.y = 0.02; track.receiveShadow = true; scene.add(track);

// Distant hills
const hills = new THREE.Group(); scene.add(hills);
{
  const hm = new THREE.MeshStandardMaterial({ color: 0x4f7f34, roughness: 1, flatShading: true });
  const hm2 = new THREE.MeshStandardMaterial({ color: 0x7d9bb5, roughness: 1, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const far = i < 6; const r = far ? 120 + Math.random() * 60 : 50 + Math.random() * 30;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), far ? hm2 : hm);
    const side = i % 2 ? 1 : -1;
    m.position.set(side * (far ? 180 + Math.random() * 120 : 90 + Math.random() * 60), -r * 0.6, (far ? 420 : 150) + Math.random() * 250 - 125);
    m.scale.y = far ? 0.9 : 0.5; hills.add(m);
  }
}

// Trees (instanced, recycled)
const TREE_N = 160, TREE_RANGE = 420;
const trunkM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 6), new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 1 }), TREE_N);
const leafGeo = new THREE.IcosahedronGeometry(2.4, 1);
const leafM = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), TREE_N);
trunkM.castShadow = leafM.castShadow = true;
const trees = [];
for (let i = 0; i < TREE_N; i++) {
  const side = i % 2 ? 1 : -1;
  trees.push({ x: side * (13 + Math.random() * 70), z: Math.random() * TREE_RANGE - 30, s: 0.8 + Math.random() * 0.9 });
  leafM.setColorAt(i, new THREE.Color().setHSL(0.24 + Math.random() * 0.08, 0.5, 0.25 + Math.random() * 0.12));
}
scene.add(trunkM, leafM);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function updateTrees(pz) {
  trees.forEach((t, i) => {
    if (t.z < pz - 30) t.z += TREE_RANGE;
    _s.setScalar(t.s); _p.set(t.x, 1.5 * t.s, t.z); _m.compose(_p, _q.identity(), _s); trunkM.setMatrixAt(i, _m);
    _s.set(t.s, t.s * 1.15, t.s); _p.set(t.x, 4.2 * t.s, t.z); _m.compose(_p, _q, _s); leafM.setMatrixAt(i, _m);
  });
  trunkM.instanceMatrix.needsUpdate = leafM.instanceMatrix.needsUpdate = true;
}

// Side rails (white paddock fence)
const RAIL_SEG = 4, RAIL_N = 80;
const railMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 });
const postIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 1.3, 0.18), railMat, RAIL_N * 2);
const barIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.14, RAIL_SEG), railMat, RAIL_N * 4);
postIM.castShadow = barIM.castShadow = true; scene.add(postIM, barIM);
function updateRails(pz) {
  const base = Math.floor((pz - 20) / RAIL_SEG) * RAIL_SEG;
  for (let i = 0; i < RAIL_N; i++) {
    const z = base + i * RAIL_SEG;
    [-6.1, 6.1].forEach((x, s) => {
      _m.makeTranslation(x, 0.65, z); postIM.setMatrixAt(i * 2 + s, _m);
      _m.makeTranslation(x, 1.1, z + RAIL_SEG / 2); barIM.setMatrixAt(i * 4 + s * 2, _m);
      _m.makeTranslation(x, 0.6, z + RAIL_SEG / 2); barIM.setMatrixAt(i * 4 + s * 2 + 1, _m);
    });
  }
  postIM.instanceMatrix.needsUpdate = barIM.instanceMatrix.needsUpdate = true;
}

// Dust particles
const DUST_N = 120;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_N * 3); const dustVel = []; const dustLife = new Float32Array(DUST_N);
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xc9a77c, size: 0.35, transparent: true, opacity: 0.55, depthWrite: false }));
dust.frustumCulled = false; scene.add(dust);
for (let i = 0; i < DUST_N; i++) dustVel.push(new THREE.Vector3());
let dustIdx = 0;
function emitDust(x, z) { const i = dustIdx++ % DUST_N; dustPos.set([x + (Math.random() - .5), 0.15, z - 0.8], i * 3); dustVel[i].set((Math.random() - .5) * 2, 1 + Math.random() * 1.5, -2 - Math.random() * 3); dustLife[i] = 0.8; }
function updateDust(dt) {
  for (let i = 0; i < DUST_N; i++) {
    if (dustLife[i] <= 0) { dustPos[i * 3 + 1] = -10; continue; }
    dustLife[i] -= dt; dustPos[i * 3] += dustVel[i].x * dt; dustPos[i * 3 + 1] += dustVel[i].y * dt; dustPos[i * 3 + 2] += dustVel[i].z * dt; dustVel[i].y -= 3 * dt;
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---------------- HORSE MODEL ----------------
let horseProto = null, horseClip = null, horseScale = 1, horseYOff = 0;
function makeHorse(colorHex, isMe) {
  const g = new THREE.Group();
  const mesh = horseProto.clone();
  mesh.material = horseProto.material.clone();
  if (!isMe) mesh.material.color = new THREE.Color(colorHex).lerp(new THREE.Color(0xffffff), 0.35);
  mesh.scale.setScalar(horseScale); mesh.position.y = horseYOff;
  mesh.castShadow = true;
  g.add(mesh);
  // saddle blanket in player color
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 }));
  pad.position.set(0, 1.5, 0.05); pad.castShadow = true; g.add(pad);
  const mixer = new THREE.AnimationMixer(mesh);
  const act = mixer.clipAction(horseClip); act.play(); act.time = Math.random();
  g.userData = { mixer, pad, mesh };
  scene.add(g);
  return g;
}
function nameSprite(text, color) {
  const tex = canvasTex(256, 64, (g, w, h) => {
    g.font = '700 34px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(text).width + 30; g.fillStyle = color; g.beginPath(); g.roundRect((w - tw) / 2, 6, tw, 52, 26); g.fill();
    g.fillStyle = '#fff'; g.fillText(text, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(2.6, 0.65, 1); s.position.y = 3.1; s.renderOrder = 5; return s;
}

// ---------------- COURSE ----------------
let course = [], spawnIdx = 0, active = [];
const gateMats = [0xff4d6d, 0x3a86ff, 0xffbe0b];
const poleTex = canvasTex(128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e63946'; g.fillRect(i * 16, 0, 16, h); } });
const poleTex2 = canvasTex(128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#1d4ed8'; g.fillRect(i * 16, 0, 16, h); } });

function buildCourse(seed) {
  const r = rng(seed); const qs = shuffle(QUESTIONS.map(q => q.slice()), r);
  const ev = []; let qi = 0;
  for (let z = 120; z < 15000; z += GATE_GAP) {
    const q = qs[qi++ % qs.length]; const order = shuffle([1, 2, 3], r);
    ev.push({ type: 'gate', z, q: q[0], opts: order.map(i => q[i]), correct: order.indexOf(1) });
    ev.push({ type: 'fence', z: z + 60, style: r() < 0.5 ? 0 : 1 });
    if (r() < 0.75) ev.push({ type: 'fence', z: z + 115, style: r() < 0.5 ? 0 : 1 });
    for (const [start, n] of [[18, 6], [78, 5], [130, 6]]) {
      const lane = Math.floor(r() * 3); for (let k = 0; k < n; k++) ev.push({ type: 'carrot', z: z + start + k * 3.5, lane });
    }
  }
  ev.sort((a, b) => a.z - b.z);
  return ev;
}
function answerTex(letter, text, col) {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = col; g.beginPath(); g.roundRect(0, 0, w, h, 36); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, h * 0.45);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 78; g.font = `700 ${fs}px Fredoka, sans-serif`;
    while (g.measureText(text).width > w - 50 && fs > 30) { fs -= 4; g.font = `700 ${fs}px Fredoka, sans-serif`; }
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowOffsetY = 4; g.fillText(text, w / 2, h / 2 + 4);
  });
}
const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 10);
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
function spawnEvent(e) {
  const g = new THREE.Group(); g.position.z = e.z;
  if (e.type === 'gate') {
    e.banners = [];
    LANES.forEach((x, i) => {
      const col = '#' + gateMats[i].toString(16).padStart(6, '0');
      for (const dx of [-1.45, 1.45]) { const p = new THREE.Mesh(postGeo, whiteMat); p.position.set(x + dx, 2.1, 0); p.castShadow = true; g.add(p); }
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.45), new THREE.MeshStandardMaterial({ map: answerTex('ABC'[i], e.opts[i], col), side: THREE.DoubleSide, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.0 }));
      b.position.set(x, 3.4, 0); b.rotation.y = Math.PI; b.castShadow = true; g.add(b); e.banners.push(b);
    });
  } else if (e.type === 'fence') {
    const tex = e.style ? poleTex2 : poleTex;
    const stdMat = new THREE.MeshStandardMaterial({ color: e.style ? 0x1d4ed8 : 0xe63946, roughness: 0.5 });
    for (const x of [-5.6, 5.6]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.7, 0.6), stdMat); s.position.set(x, 0.85, 0); s.castShadow = true; g.add(s);
      // flower box
      const fb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.8), new THREE.MeshStandardMaterial({ color: 0x3f7d20 })); fb.position.set(x * 0.92, 0.18, 0.6); g.add(fb);
      for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), new THREE.MeshStandardMaterial({ color: [0xff5d8f, 0xffd166, 0xffffff][k % 3] })); f.position.set(x * 0.92 + (k - 2) * 0.22, 0.42, 0.6 + (k % 2) * 0.2); g.add(f); }
    }
    e.poles = [];
    for (const y of [0.45, 0.85, 1.25]) {
      const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 11, 10), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      pm.rotation.z = Math.PI / 2; pm.position.y = y; pm.castShadow = true; g.add(pm); e.poles.push(pm);
    }
    e.poles.forEach(p => { p.material.map = tex.clone(); p.material.map.wrapS = THREE.RepeatWrapping; p.material.map.repeat.set(4, 1); });
  } else if (e.type === 'carrot') {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.5, emissive: 0xff5500, emissiveIntensity: 0.15 }));
    c.rotation.x = Math.PI; c.position.y = 0.0;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 5), new THREE.MeshStandardMaterial({ color: 0x2fae3a })); leaf.position.y = 0.6;
    const holder = new THREE.Group(); holder.add(c, leaf); holder.position.set(LANES[e.lane], 1.1, 0); holder.castShadow = true; c.castShadow = true;
    g.add(holder); e.holder = holder;
  }
  e.obj = g; scene.add(g); active.push(e);
}
function clearCourse() { active.forEach(e => scene.remove(e.obj)); active = []; spawnIdx = 0; }

// ---------------- GAME STATE ----------------
const me = { id: 'host', name: 'Rider', color: COLORS[0], z: 0, x: 0, lane: 1, y: 0, vy: 0, coins: 0, correct: 0, speedLvl: 0, boostLvl: 0, multLvl: 0 };
let horse = null;
let mode = 'menu';        // menu | lobby | count | race | results
let isHost = false, solo = false, peer = null, conn = null;
const conns = new Map();  // host: peerId -> conn
let players = {};         // id -> {name,color,z,x,y,coins,correct}
const ghosts = {};        // id -> {g, tz, tx, ty}
let raceStart = 0, raceSeed = 1, curGate = null;
let effects = { boost: 0, slow: 0, slowMult: 1, mud: 0 };
let bots = [];

const SHOP = [
  { key: 'speedLvl', name: '⚡ Speed', cost: l => 20 + l * 20, max: 5 },
  { key: 'boostLvl', name: '🚀 Boost', cost: l => 15 + l * 15, max: 5 },
  { key: 'multLvl', name: '🥕 x Carrots', cost: l => 30 + l * 30, max: 4 },
  { key: 'mud', name: '💩 Mud Leader', cost: () => 25, max: 99 },
];
function renderShop() {
  $('shop').innerHTML = SHOP.map((s, i) => {
    const lvl = s.key === 'mud' ? 0 : me[s.key]; const c = s.cost(lvl); const maxed = lvl >= s.max;
    return `<button class="sbtn ${me.coins >= c && !maxed ? 'can' : ''}" data-i="${i}" ${maxed ? 'disabled' : ''}><b>${s.name}${s.key !== 'mud' ? ' ' + lvl : ''}</b><span>${maxed ? 'MAX' : '🥕 ' + c}</span><div class="k">[${i + 1}]</div></button>`;
  }).join('');
}
$('shop').addEventListener('pointerdown', e => { const b = e.target.closest('.sbtn'); if (b) { e.preventDefault(); buy(+b.dataset.i); } });
function buy(i) {
  if (mode !== 'race') return;
  const s = SHOP[i]; const lvl = s.key === 'mud' ? 0 : me[s.key]; const c = s.cost(lvl);
  if (me.coins < c || lvl >= s.max) { sfx.bad(); return; }
  me.coins -= c; sfx.buy();
  if (s.key === 'mud') throwMud(); else { me[s.key]++; feed(`Upgraded ${s.name}!`); }
  renderShop();
}
function throwMud() {
  if (solo) { const lead = [...bots].sort((a, b) => b.z - a.z)[0]; lead.slow = 3; feed(`💩 You mudded ${lead.name}!`); return; }
  send({ t: 'mud', from: me.id });
}
function applyMud(fromName) { effects.mud = 3; sfx.bad(); toast(`💩 ${fromName} MUDDED YOU!`, '#c08a4a'); }

// ---------------- UI HELPERS ----------------
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
let toastT = 0;
function toast(text, color = '#fff') { const t = $('toast'); t.textContent = text; t.style.color = color; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 1100); }
function feed(text) { const d = document.createElement('div'); d.textContent = text; $('feed').appendChild(d); setTimeout(() => d.remove(), 4000); while ($('feed').children.length > 5) $('feed').firstChild.remove(); }
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

// ---------------- NETWORK ----------------
function send(msg) {
  if (solo) return;
  if (isHost) hostHandle(me.id, msg); else if (conn && conn.open) conn.send(msg);
}
function broadcast(msg) { for (const c of conns.values()) if (c.open) c.send(msg); }
function hostHandle(fromId, d) {
  if (d.t === 'hello') {
    if (mode !== 'lobby') { conns.get(fromId)?.send({ t: 'full' }); return; }
    const used = Object.values(players).map(p => p.color);
    players[fromId] = { name: d.name, color: COLORS.find(c => !used.includes(c)) || COLORS[0], z: 0, x: 0, y: 0, coins: 0, correct: 0 };
    broadcast({ t: 'lobby', players, you: null }); conns.get(fromId)?.send({ t: 'you', id: fromId }); renderLobby();
  } else if (d.t === 'state') {
    if (players[fromId]) Object.assign(players[fromId], d.s);
  } else if (d.t === 'mud') {
    const lead = Object.entries(players).filter(([id]) => id !== fromId).sort((a, b) => b[1].z - a[1].z)[0];
    if (!lead) return;
    const fromName = players[fromId]?.name || '?';
    const msg = { t: 'mudded', target: lead[0], from: fromName, targetName: lead[1].name };
    broadcast(msg); clientHandle(msg);
  }
}
function clientHandle(d) {
  if (d.t === 'you') { me.id = d.id; }
  else if (d.t === 'lobby') { players = d.players; renderLobby(); }
  else if (d.t === 'start') { startRace(d.seed, d.players); }
  else if (d.t === 'states') { for (const id in d.players) if (id !== me.id) players[id] = d.players[id]; }
  else if (d.t === 'mudded') { if (d.target === me.id) applyMud(d.from); else feed(`💩 ${d.from} mudded ${d.targetName}!`); }
  else if (d.t === 'full') { $('menuErr').textContent = 'That race already started. Ask host to Race Again.'; show('menu'); }
}
function newPeer(id) {
  return new Promise((res, rej) => {
    const p = id ? new Peer(id) : new Peer();
    p.on('open', () => res(p)); p.on('error', err => rej(err));
  });
}
async function createGame() {
  if (!saveName()) return;
  $('menuErr').textContent = 'Creating game…';
  for (let tries = 0; tries < 4; tries++) {
    const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
    try {
      peer = await newPeer(PREFIX + code);
      isHost = true; solo = false; me.id = 'host';
      players = { host: { name: me.name, color: COLORS[0], z: 0, x: 0, y: 0, coins: 0, correct: 0 } };
      peer.on('connection', c => {
        c.on('open', () => conns.set(c.peer, c));
        c.on('data', d => hostHandle(c.peer, d));
        c.on('close', () => { conns.delete(c.peer); delete players[c.peer]; removeGhost(c.peer); broadcast({ t: 'lobby', players }); renderLobby(); });
      });
      peer.on('error', e => console.warn(e));
      $('lobbyCode').textContent = code;
      $('lobbyLink').textContent = `Others: open this site → enter code ${code}`;
      $('menuErr').textContent = ''; mode = 'lobby'; renderLobby(); show('lobby');
      history.replaceState(null, '', '?code=' + code);
      return;
    } catch (e) { if (e.type !== 'unavailable-id') { $('menuErr').textContent = 'Could not reach game server: ' + e.type; return; } }
  }
}
async function joinGame() {
  if (!saveName()) return;
  const code = $('joinCode').value.trim().toUpperCase();
  if (code.length !== 4) { $('menuErr').textContent = 'Enter the 4-letter code'; return; }
  $('menuErr').textContent = 'Joining…';
  try {
    peer = await newPeer();
    peer.on('error', e => { if (e.type === 'peer-unavailable') { $('menuErr').textContent = 'No game with that code 🤔'; show('menu'); } });
    conn = peer.connect(PREFIX + code, { reliable: true });
    conn.on('open', () => { conn.send({ t: 'hello', name: me.name }); isHost = false; solo = false; mode = 'lobby'; $('lobbyCode').textContent = code; $('lobbyLink').textContent = ''; $('menuErr').textContent = ''; show('lobby'); });
    conn.on('data', clientHandle);
    conn.on('close', () => { $('menuErr').textContent = 'Host left the game.'; mode = 'menu'; show('menu'); $('hud').classList.remove('on'); });
  } catch (e) { $('menuErr').textContent = 'Could not connect: ' + e.type; }
}
function renderLobby() {
  $('lobbyPlayers').innerHTML = Object.values(players).map(p => `<div class="chip" style="background:${p.color}">🐎 ${esc(p.name)}</div>`).join('');
  $('startBtn').style.display = isHost ? 'block' : 'none';
  $('lobbyWait').style.display = isHost ? 'none' : 'block';
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function saveName() {
  const n = $('name').value.trim(); if (!n) { $('menuErr').textContent = 'Type your name first!'; $('name').focus(); return false; }
  me.name = n; localStorage.setItem('hr_name', n); return true;
}
function hostStart() {
  const seed = Math.floor(Math.random() * 1e9);
  for (const id in players) Object.assign(players[id], { z: 0, x: 0, y: 0, coins: 0, correct: 0 });
  broadcast({ t: 'start', seed, players }); startRace(seed, players);
}

// ---------------- RACE ----------------
function removeGhost(id) { if (ghosts[id]) { scene.remove(ghosts[id].g); delete ghosts[id]; } }
function startRace(seed, plist) {
  raceSeed = seed; players = plist || players;
  clearCourse(); course = buildCourse(seed);
  Object.keys(ghosts).forEach(removeGhost);
  Object.assign(me, { z: 0, x: 0, lane: 1, y: 0, vy: 0, coins: 0, correct: 0, speedLvl: 0, boostLvl: 0, multLvl: 0 });
  effects = { boost: 0, slow: 0, slowMult: 1, mud: 0 };
  me.color = players[me.id]?.color || COLORS[0];
  if (horse) scene.remove(horse);
  horse = makeHorse(me.color, true);
  for (const id in players) if (id !== me.id) makeGhost(id, players[id]);
  if (solo) bots.forEach(b => { Object.assign(b, { z: 0, slow: 0, boost: 0 }); makeGhost(b.id, b); });
  mode = 'count'; raceStart = performance.now() / 1000 + 3;
  show(null); $('hud').classList.add('on'); renderShop(); $('feed').innerHTML = '';
  if (matchMedia('(pointer:coarse)').matches) $('touch').style.display = 'block';
}
function makeGhost(id, p) {
  const g = makeHorse(p.color, false); g.add(nameSprite(p.name, p.color));
  ghosts[id] = { g, tz: 0, tx: 0, ty: 0 };
}
function endRace() {
  mode = 'results';
  $('hud').classList.remove('on'); $('touch').style.display = 'none';
  const all = solo ? [{ ...me, name: me.name }, ...bots] : Object.entries(players).map(([id, p]) => id === me.id ? { ...p, z: me.z, correct: me.correct, name: me.name } : p);
  all.sort((a, b) => b.z - a.z);
  const medals = ['🥇', '🥈', '🥉'];
  $('resList').innerHTML = all.map((p, i) => `<div class="row2 ${i === 0 ? 'first' : ''}"><span>${medals[i] || (i + 1) + '.'} ${esc(p.name)}</span><span>${Math.floor(p.z)} m · ✅ ${p.correct || 0}</span></div>`).join('');
  $('againBtn').style.display = isHost || solo ? 'block' : 'none';
  $('againWait').style.display = isHost || solo ? 'none' : 'block';
  show('results'); sfx.good();
}

function laneIndexOf(x) { let best = 0; LANES.forEach((lx, i) => { if (Math.abs(lx - x) < Math.abs(LANES[best] - x)) best = i; }); return best; }
function steer(dir) { if (mode === 'race' || mode === 'count') me.lane = clamp(me.lane + dir, 0, 2); }
function jump() { if (mode === 'race' && me.y <= 0.001) { me.vy = 9; sfx.jump(); } }

function triggerEvent(e) {
  if (e.type === 'gate') {
    const lane = laneIndexOf(me.x);
    if (lane === e.correct) {
      const gain = 10 * (1 + me.multLvl);
      me.coins += gain; me.correct++; effects.boost = 2.6; sfx.good();
      toast(`✅ CORRECT! +${gain}🥕`, '#7dffb0');
      e.banners[lane].material.emissive.set(0x22ff88); e.banners[lane].material.emissiveIntensity = 0.6;
    } else {
      effects.slow = 1.3; effects.slowMult = 0.45; sfx.bad();
      toast(`❌ ${e.opts[e.correct]}`, '#ff8fa3');
      e.banners[e.correct].material.emissive.set(0x22ff88); e.banners[e.correct].material.emissiveIntensity = 0.6;
    }
    e.done = true; renderShop();
  } else if (e.type === 'fence') {
    if (me.y < 1.0) { e.knocked = 0.001; effects.slow = 1.0; effects.slowMult = 0.4; sfx.knock(); toast('💥 RAIL DOWN!', '#ffd166'); shake = 0.4; }
    else { me.coins += 2; toast('Clear! +2🥕', '#fff'); renderShop(); }
  } else if (e.type === 'carrot') {
    if (laneIndexOf(me.x) === e.lane && Math.abs(LANES[e.lane] - me.x) < 1.4 && me.y < 2) {
      me.coins += 1 + me.multLvl; e.obj.visible = false; sfx.coin(); renderShop();
    }
  }
}

let shake = 0, lastNet = 0, lastShopRender = 0;
function updateQuestion() {
  const next = active.find(e => e.type === 'gate' && !e.done && e.z > me.z) || course.find(e => e.type === 'gate' && e.z > me.z);
  if (next !== curGate) {
    curGate = next;
    if (next) { $('qtext').textContent = next.q; next.opts.forEach((o, i) => $('op' + i).textContent = ['◀ ', '▲ ', '▶ '][i] + o); }
  }
  $('qbox').style.opacity = next && next.z - me.z < GATE_GAP + 10 ? 1 : 0;
}
function updateBoard() {
  let list;
  if (solo) list = [{ id: 'me', name: me.name, z: me.z, color: me.color }, ...bots];
  else list = Object.entries(players).map(([id, p]) => ({ id, name: id === me.id ? me.name : p.name, z: id === me.id ? me.z : p.z, color: p.color }));
  list.sort((a, b) => b.z - a.z);
  const myId = solo ? 'me' : me.id;
  const place = list.findIndex(p => p.id === myId) + 1;
  $('place').textContent = `#${place} / ${list.length}`;
  $('board').innerHTML = list.map((p, i) => `<div class="${p.id === myId ? 'me' : ''}"><span><span style="color:${p.color}">●</span> ${i + 1}. ${esc(p.name)}</span><span>${Math.floor(p.z)}m</span></div>`).join('');
}

const clock = new THREE.Clock();
let boardT = 0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now() / 1000;

  if (mode === 'count') {
    const left = raceStart - now;
    $('count').textContent = left > 0 ? Math.ceil(left) : 'GO!';
    if (left <= 0) { mode = 'race'; sfx.good(); setTimeout(() => { if ($('count').textContent === 'GO!') $('count').textContent = ''; }, 700); }
  }
  let speed = 0;
  if (mode === 'race') {
    const elapsed = now - raceStart; const remain = DURATION - elapsed;
    $('timer').textContent = fmtTime(remain);
    if (remain <= 0) { endRace(); }
    for (const k of ['boost', 'slow', 'mud']) effects[k] = Math.max(0, effects[k] - dt);
    speed = BASE_SPEED + me.speedLvl * 1.6;
    if (effects.boost > 0) speed *= 1.5 + me.boostLvl * 0.12;
    if (effects.slow > 0) speed *= effects.slowMult;
    if (effects.mud > 0) speed *= 0.5;
    const prevZ = me.z; me.z += speed * dt;
    // spawn / trigger / despawn
    while (spawnIdx < course.length && course[spawnIdx].z < me.z + 230) spawnEvent(course[spawnIdx++]);
    for (const e of active) if (!e.hit && e.z > prevZ && e.z <= me.z + 0.0) { e.hit = true; triggerEvent(e); }
    active = active.filter(e => { if (e.z < me.z - 25) { scene.remove(e.obj); return false; } return true; });
    // bots
    if (solo) bots.forEach(b => {
      b.slow = Math.max(0, (b.slow || 0) - dt); b.boost = Math.max(0, (b.boost || 0) - dt);
      if (Math.random() < dt * 0.12) b.boost = 2.5; if (Math.random() < dt * 0.1) b.slow = 1.2;
      b.z += (BASE_SPEED * b.skill) * (b.boost ? 1.5 : 1) * (b.slow ? 0.5 : 1) * dt;
      b.x = LANES[Math.floor(b.z / 90 + b.skill * 7) % 3];
    });
    // network
    if (!solo && now - lastNet > 0.1) {
      lastNet = now;
      const s = { z: me.z, x: me.x, y: me.y, coins: me.coins, correct: me.correct };
      if (isHost) { Object.assign(players[me.id], s); broadcast({ t: 'states', players }); } else if (conn?.open) conn.send({ t: 'state', s });
    }
    boardT -= dt; if (boardT <= 0) { boardT = 0.25; updateBoard(); }
    if (now - lastShopRender > 1) { lastShopRender = now; renderShop(); }
    updateQuestion();
    $('dist').textContent = `${Math.floor(me.z)} m`;
    $('coins').textContent = me.coins;
    $('mud').style.opacity = effects.mud > 0 ? 1 : 0;
    hoofbeat(now, speed);
  }

  // player physics
  me.x = lerp(me.x, LANES[me.lane], 1 - Math.exp(-dt * 10));
  me.vy -= 26 * dt; me.y = Math.max(0, me.y + me.vy * dt); if (me.y === 0) me.vy = Math.max(0, me.vy);

  if (horse) {
    horse.position.set(me.x, me.y, me.z);
    horse.rotation.y = (LANES[me.lane] - me.x) * 0.12;
    horse.rotation.x = me.y > 0 ? -clamp(me.vy * 0.04, -0.35, 0.35) : 0;
    horse.userData.mixer.update(dt * (mode === 'race' ? speed / BASE_SPEED : 0.25) * 1.1);
    if (mode === 'race' && me.y === 0 && Math.random() < 0.6) emitDust(me.x, me.z);
  }
  // ghosts
  const ghostSrc = solo ? Object.fromEntries(bots.map(b => [b.id, b])) : players;
  for (const id in ghosts) {
    const p = ghostSrc[id]; if (!p) continue; const gh = ghosts[id];
    const k = 1 - Math.exp(-dt * 8);
    gh.g.position.x = lerp(gh.g.position.x, p.x || 0, k);
    gh.g.position.y = lerp(gh.g.position.y, p.y || 0, k);
    gh.g.position.z = mode === 'race' ? lerp(gh.g.position.z, (p.z || 0) + (solo ? 0 : speed * 0.1), k) : (p.z || 0);
    gh.g.userData.mixer.update(dt * (mode === 'race' ? 1.1 : 0.25));
  }
  // course anim
  for (const e of active) {
    if (e.type === 'carrot' && e.holder) { e.holder.rotation.y += dt * 3; e.holder.position.y = 1.1 + Math.sin(now * 4 + e.z) * 0.15; }
    if (e.type === 'fence' && e.knocked) { e.knocked = Math.min(1, e.knocked + dt * 2.5); e.poles.forEach((p, i) => { p.position.y = lerp([0.45, 0.85, 1.25][i], 0.08 + i * 0.12, e.knocked); p.position.z = e.knocked * (0.6 + i * 0.3); p.rotation.y = e.knocked * (i - 1) * 0.15; }); }
  }
  updateDust(dt);

  // world follow
  const pz = me.z;
  ground.position.z = pz + 150; grassTex.offset.y = (pz + 150) / (800 / 60);
  track.position.z = pz + 250; dirtTex.offset.y = (pz + 250) / 10;
  hills.position.z = pz;
  updateTrees(pz); updateRails(pz);
  sun.position.set(me.x + sunDir.x * 60, sunDir.y * 60, pz + 15 + sunDir.z * 60); sun.target.position.set(me.x, 0, pz + 15);

  // camera
  const fovT = 62 + (effects.boost > 0 ? 12 : 0);
  camera.fov = lerp(camera.fov, fovT, 1 - Math.exp(-dt * 4)); camera.updateProjectionMatrix();
  shake = Math.max(0, shake - dt);
  const camX = me.x * 0.55 + (Math.random() - .5) * shake, camY = 3.7 + me.y * 0.4 + (Math.random() - .5) * shake;
  if (mode === 'menu' || mode === 'lobby') {
    const a = now * 0.25; camera.position.set(me.x + Math.sin(a) * 7, 2.6, me.z + Math.cos(a) * 7); camera.lookAt(me.x, 1.3, me.z);
  } else {
    camera.position.set(lerp(camera.position.x, camX, 1 - Math.exp(-dt * 6)), camY, pz - 7.2);
    camera.lookAt(me.x * 0.75, 1.7 + me.y * 0.3, pz + 9);
  }
  renderer.render(scene, camera);
}

// ---------------- INPUT ----------------
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') e.target.id === 'joinCode' ? joinGame() : createGame(); return; }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) steer(-1);
  if (['ArrowRight', 'd', 'D'].includes(e.key)) steer(1);
  if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); jump(); }
  if ('1234'.includes(e.key) && e.key.length === 1) buy(+e.key - 1);
});
$('tL').addEventListener('pointerdown', e => { e.preventDefault(); steer(-1); });
$('tR').addEventListener('pointerdown', e => { e.preventDefault(); steer(1); });
$('tJ').addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
let tsx = 0, tsy = 0;
canvas.addEventListener('touchstart', e => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
canvas.addEventListener('touchend', e => { const t = e.changedTouches[0]; const dx = t.clientX - tsx, dy = t.clientY - tsy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) steer(dx < 0 ? -1 : 1); else if (dy < -40) jump(); }, { passive: true });
$('createBtn').onclick = createGame;
$('joinBtn').onclick = joinGame;
$('soloBtn').onclick = () => {
  if (!saveName()) return;
  solo = true; isHost = false; me.id = 'me';
  bots = [['Thunder', '#3a86ff', 0.97], ['Daisy', '#22c06b', 1.02], ['Biscuit', '#9b5de5', 1.06]].map(([name, color, skill], i) => ({ id: 'bot' + i, name, color, skill, z: 0, x: LANES[i], y: 0 }));
  players = { me: { name: me.name, color: COLORS[0] } };
  startRace(Math.floor(Math.random() * 1e9), players);
};
$('startBtn').onclick = () => { if (isHost) hostStart(); };
$('againBtn').onclick = () => {
  if (solo) startRace(Math.floor(Math.random() * 1e9), players);
  else if (isHost) { mode = 'lobby'; hostStart(); }
};
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---------------- BOOT ----------------
$('name').value = localStorage.getItem('hr_name') || '';
const qc = new URLSearchParams(location.search).get('code'); if (qc) $('joinCode').value = qc.toUpperCase();
new GLTFLoader().load('models/Horse.glb', gltf => {
  horseProto = gltf.scene.getObjectByProperty('type', 'Mesh') || gltf.scene.children[0];
  horseClip = gltf.animations[0];
  const box = new THREE.Box3().setFromObject(horseProto);
  const size = box.getSize(new THREE.Vector3());
  horseScale = 2.3 / size.y; horseYOff = -box.min.y * horseScale;
  window.__horseInfo = { size: size.toArray(), min: box.min.toArray(), rot: horseProto.rotation.toArray() };
  horse = makeHorse(COLORS[0], true);
  $('loading').remove(); show('menu'); tick();
});
