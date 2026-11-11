import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RIDER_POSE, reshapeRider, RIDER_Y, HELMET } from './riderfix.js?v=1794366193';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { CATEGORIES } from './questions.js?v=1794366193';

// ---------------- CONFIG ----------------
const DURATION = 150;           // seconds per race
const LANES = [4.5, 1.5, -1.5, -4.5];   // screen left -> right
const GATE_GAP = 170;
const FINISH = 420, ROUNDS = 4;
const PW_A = ['Dragon', 'Unicorn', 'Taco', 'Pony', 'Skibidi', 'Sigma', 'Glitter', 'Nugget', 'Pickle', 'Banana', 'Rizzy', 'Cowboy', 'Waffle', 'Noodle', 'Turbo', 'Sparkle', 'Goblin', 'Potato', 'Mango', 'Carrot'];
const PW_B = ['Lover', 'Fart', 'Ninja', 'Queen', 'King', 'Slayer', 'Toes', 'Blaster', 'Goat', 'Muncher', 'Boss', 'Gremlin', 'Rider', 'Wizard', 'Bandit', 'Sauce', 'Hooves', 'Gang'];
function genPw() { const a = PW_A[Math.floor(Math.random() * PW_A.length)], b = PW_B[Math.floor(Math.random() * PW_B.length)], n = Math.floor(Math.random() * 999); return Math.random() < 0.3 ? `${a}${n % 10}${b}` : `${a}${b}${n}`; }
const BASE_SPEED = 16;
const PREFIX = 'hoofrush-v1-';
const COLORS = ['#ff4d6d', '#3a86ff', '#22c06b', '#ffbe0b', '#9b5de5', '#ff8a2b', '#00bbf9', '#f15bb5'];

const QUESTIONS = [
  // SURVEY SAYS (popularity) — marked with *
  ['*Most popular pet in America?', 'Dog', 'Fish', 'Hamster'],
  ['*Most popular pizza topping?', 'Pepperoni', 'Pineapple', 'Mushroom'],
  ['*Most popular ice cream flavor?', 'Vanilla', 'Mint chip', 'Strawberry'],
  ['*Most popular horse color?', 'Bay (brown)', 'Palomino', 'Pinto'],
  ['*Most popular breakfast?', 'Cereal', 'Pancakes', 'Waffles'],
  ['*Most common favorite color?', 'Blue', 'Orange', 'Yellow'],
  ['*Most popular US horse breed?', 'Quarter Horse', 'Friesian', 'Shetland'],
  ['*Most popular holiday?', 'Christmas', 'Easter', 'Labor Day'],
  ['*Most-played arcade game ever?', 'Pac-Man', 'Frogger', 'Galaga'],
  ['*Most popular fast food item?', 'Fries', 'Salad', 'Tacos'],
  ['*Most popular girl\'s horse name?', 'Bella', 'Gertrude', 'Pam'],
  ['*Most popular sport in the world?', 'Soccer', 'Golf', 'Polo'],
  ['*Most popular drink worldwide?', 'Water', 'Soda', 'Juice'],
  ['*Most popular fruit in the US?', 'Banana', 'Kiwi', 'Mango'],
  ['*What do horses LOVE most as a treat?', 'Apples & carrots', 'Pickles', 'Chips'],
  // Pac-Man (for mom)
  ['Pac-Man\'s ghosts: Blinky, Pinky, Inky &…', 'Clyde', 'Steve', 'Sparky'],
  ['What color is Pac-Man?', 'Yellow', 'Purple', 'Red'],
  ['Pac-Man came out in…', '1980', '1995', '1972'],
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

// ---------------- AUDIO (arcade synth + filtered-noise foley) ----------------
let masterGain, muted = localStorage.getItem('hr_muted') === '1', actx, master, NB, musicOn = localStorage.getItem('hr_music') !== '0', musicTimer = null;
function ac() {
  if (!actx) {
    actx = new AudioContext(); master = actx.createDynamicsCompressor(); masterGain = actx.createGain(); masterGain.gain.value = muted ? 0 : 1; master.connect(masterGain); masterGain.connect(actx.destination);
    NB = actx.createBuffer(1, actx.sampleRate, actx.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
addEventListener('pointerdown', () => ac(), { once: false });
addEventListener('keydown', () => ac());
function tone(f0, f1, dur, type = 'square', vol = 0.12, delay = 0) {
  const a = ac(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, freq, q, vol, type = 'bandpass', delay = 0) {
  const a = ac(), t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = NB; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function clop(delay, accent) { // hoof on packed dirt: woody click + low thud
  noise(0.05, 900 + Math.random() * 500, 4, accent ? 0.5 : 0.3, 'bandpass', delay);
  tone(140, 55, 0.09, 'sine', accent ? 0.35 : 0.2, delay);
}
const sfxSynth = {
  good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.08, 'square', 0.09, i * 0.06)),
  bad: () => { tone(440, 110, 0.5, 'square', 0.08); tone(445, 112, 0.5, 'sawtooth', 0.04); },
  coin: (() => { let w = 0; return () => { w ^= 1; tone(w ? 260 : 520, w ? 520 : 260, 0.09, 'triangle', 0.16); }; })(), // waka
  jump: () => { tone(220, 880, 0.18, 'square', 0.06); noise(0.25, 1800, 0.7, 0.12, 'highpass'); },
  land: () => { clop(0, true); clop(0.04, true); },
  knock: () => { noise(0.25, 400, 1, 0.5, 'lowpass'); [0, 0.07, 0.15].forEach(d => tone(320 - d * 600, 200 - d * 400, 0.08, 'triangle', 0.25, d)); },
  buy: () => [784, 988, 1319].forEach((f, i) => tone(f, f, 0.07, 'square', 0.07, i * 0.05)),
  hack: () => { for (let i = 0; i < 8; i++) tone(200 + Math.random() * 1800, 100 + Math.random() * 900, 0.05, 'square', 0.06, i * 0.04); },
  mud: () => { noise(0.4, 250, 2, 0.6, 'lowpass'); tone(120, 50, 0.3, 'sine', 0.3); },
  count: (hi) => tone(hi ? 988 : 494, hi ? 988 : 494, hi ? 0.4 : 0.15, 'square', 0.1),
};
const sfx = {
  good: () => play('correct', 0.8) || sfxSynth.good(),
  bad: () => play('wrong', 0.7) || sfxSynth.bad(),
  coin: () => play('chomp', 0.9, 0.95 + Math.random() * 0.15) || sfxSynth.coin(),
  jump: () => play('jump', 0.6) || sfxSynth.jump(),
  land: () => play('hoof', 1, 0.85) || sfxSynth.land(),
  knock: () => play('rail', 1) || sfxSynth.knock(),
  buy: () => sfxSynth.buy(),
  hack: () => play('hack', 0.8) || sfxSynth.hack(),
  mud: () => sfxSynth.mud(),
  spook: () => play('neigh', 0.9) || sfxSynth.bad(),
  count: (hi) => sfxSynth.count(hi),
};
// real recorded samples (Mixkit free SFX) with synth fallback
const SFX = {};
async function loadSfx() {
  for (const n of ['hoof', 'hoof1', 'hoof2', 'hoof3', 'hoof4', 'hoof5', 'hoof6', 'gallop', 'rail', 'chomp', 'correct', 'wrong', 'hack', 'jump', 'neigh']) {
    try { const r = await fetch(`sfx/${n}.mp3`); if (!r.ok) continue; SFX[n] = await ac().decodeAudioData(await r.arrayBuffer()); } catch (e) {}
  }
}
function play(n, vol = 1, rate = 1) {
  if (!SFX[n]) return false; const a = ac(); const s = a.createBufferSource(), g = a.createGain();
  s.buffer = SFX[n]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(master); s.start(); return true;
}
let lastHoof = 0, hoofStep = 0;
function hoofbeat(t, speed) { // 3-beat canter/gallop rhythm
  const period = 0.42 * (BASE_SPEED / Math.max(8, speed));
  const gaps = [0, 0.12, 0.24];
  if (t - lastHoof > period) { lastHoof = t;
    if (SFX.hoof) gaps.forEach((g, i) => setTimeout(() => play('hoof', i === 2 ? 0.9 : 0.6, 0.9 + Math.random() * 0.2), g * period / 0.42 * 1000));
    else gaps.forEach((g, i) => clop(g * period / 0.42, i === 2)); }
}
// chiptune loop
const MEL = [76, 79, 83, 81, 79, 76, 74, 76, 0, 79, 81, 83, 86, 83, 81, 79, 76, 79, 83, 88, 86, 83, 81, 79, 81, 79, 76, 74, 76, 0, 0, 0];
const BAS = [52, 52, 59, 59, 57, 57, 55, 55];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function startMusic() {
  stopMusic(); if (!musicOn) return; let step = 0;
  musicTimer = setInterval(() => {
    if (!actx) return;
    const n = MEL[step % MEL.length]; if (n) tone(mtof(n), mtof(n), 0.13, 'square', 0.025);
    if (step % 4 === 0) tone(mtof(BAS[(step / 4) % BAS.length]), mtof(BAS[(step / 4) % BAS.length]), 0.3, 'triangle', 0.07);
    if (step % 2 === 1) noise(0.03, 7000, 1, 0.03, 'highpass');
    step++;
  }, 140);
}
function stopMusic() { clearInterval(musicTimer); musicTimer = null; }

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
grassTex.repeat.set(100, 100);
const TL = new THREE.TextureLoader();
function realTex(url, base, rx, ry) { TL.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.repeat.set(rx, ry); base.material.map = t; base.material.needsUpdate = true; }); }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const dirtTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b08458'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { g.fillStyle = `hsla(${25 + Math.random() * 10},${30 + Math.random() * 25}%,${35 + Math.random() * 30}%,.8)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  for (const x of [w * 0.33, w * 0.66]) { g.fillStyle = 'rgba(80,50,25,.18)'; g.fillRect(x - 3, 0, 6, h); }
}, true);
dirtTex.repeat.set(2, 110);
const track = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 600), new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1, color: 0xf0c890 }));
track.rotation.x = -Math.PI / 2; track.position.y = 0.02; track.receiveShadow = true; scene.add(track);
realTex('tex/leafy_grass.jpg', ground, 100, 100); realTex('tex/dirt.jpg', track, 2, 110);

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
trunkM.castShadow = leafM.castShadow = true; trunkM.frustumCulled = leafM.frustumCulled = false;
const trees = [];
for (let i = 0; i < TREE_N; i++) {
  const side = i % 2 ? 1 : -1;
  trees.push({ x: side * (15 + Math.random() * 70), z: Math.random() * TREE_RANGE - 30, s: 0.8 + Math.random() * 0.9 });
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
postIM.castShadow = barIM.castShadow = true; postIM.frustumCulled = barIM.frustumCulled = false; scene.add(postIM, barIM);
function updateRails(pz) {
  const base = Math.floor((pz - 20) / RAIL_SEG) * RAIL_SEG;
  for (let i = 0; i < RAIL_N; i++) {
    const z = base + i * RAIL_SEG;
    [-6.9, 6.9].forEach((x, s) => {
      _m.makeTranslation(x, 0.65, z); postIM.setMatrixAt(i * 2 + s, _m);
      _m.makeTranslation(x, 1.1, z + RAIL_SEG / 2); barIM.setMatrixAt(i * 4 + s * 2, _m);
      _m.makeTranslation(x, 0.6, z + RAIL_SEG / 2); barIM.setMatrixAt(i * 4 + s * 2 + 1, _m);
    });
  }
  postIM.instanceMatrix.needsUpdate = barIM.instanceMatrix.needsUpdate = true;
}

// Dirt specks: small clods with gravity, bounce, ground friction; kicked back by speed and sideways by steering
const DUST_N = 900;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_N * 3).fill(-50); const dustCol = new Float32Array(DUST_N * 3); const dustVel = new Float32Array(DUST_N * 3); const dustLife = new Float32Array(DUST_N);
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3)); dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.055, vertexColors: true, sizeAttenuation: true }));
dust.frustumCulled = false; scene.add(dust);
let dustIdx = 0;
function emitDust(x, z, speed = 16, lat = 0) {
  const n = 3 + Math.floor(speed / 6);
  for (let c = 0; c < n; c++) {
    const i = dustIdx++ % DUST_N, o = i * 3; const side = Math.random() < 0.5 ? -1 : 1;
    dustPos[o] = x + side * 0.25 + (Math.random() - .5) * 0.2; dustPos[o + 1] = 0.05; dustPos[o + 2] = z - 0.9 - Math.random() * 0.5;
    dustVel[o] = (Math.random() - .5) * 1.6 - lat * 0.35 + side * 0.4;
    dustVel[o + 1] = 1.2 + Math.random() * 2.6;
    dustVel[o + 2] = speed * (0.55 + Math.random() * 0.35); // world-forward speed less than horse -> flies backward relative to rider
    const l = 0.18 + Math.random() * 0.2; dustCol[o] = l * 1.25; dustCol[o + 1] = l * 0.95; dustCol[o + 2] = l * 0.7;
    dustLife[i] = 1.4 + Math.random() * 0.8;
  }
}
function updateDust(dt) {
  for (let i = 0; i < DUST_N; i++) {
    const o = i * 3;
    if (dustLife[i] <= 0) { dustPos[o + 1] = -50; continue; }
    dustLife[i] -= dt;
    dustVel[o + 1] -= 9.8 * dt;
    dustPos[o] += dustVel[o] * dt; dustPos[o + 1] += dustVel[o + 1] * dt; dustPos[o + 2] += dustVel[o + 2] * dt;
    if (dustPos[o + 1] < 0.03) { dustPos[o + 1] = 0.03; dustVel[o + 1] = Math.abs(dustVel[o + 1]) * 0.25; dustVel[o] *= 0.5; dustVel[o + 2] *= 0.5; if (Math.abs(dustVel[o + 1]) < 0.2) { dustVel[o] = dustVel[o + 1] = dustVel[o + 2] = 0; } }
  }
  dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.color.needsUpdate = true;
}

// ---------------- HORSE MODEL ----------------
let horseProto = null, horseClip = null, horseScale = 1, horseYOff = 0;
const WARD = {
  helmet: ['#1a1a2e', '#9b5de5', '#ff5fd2', '#ffe12b', '#3df5ff', '#ffffff', '#e0306a'],
  jacket: ['#1b2440', '#111114', '#6a2fd6', '#7a1630', '#1f4d2e', '#2d3e8a', '#5a5f6b'],
  pants: ['#f4f1ea', '#e9dcc0', '#d8d8dc', '#c9b48f'],
  coat: ['#a8582c', '#6b3a1e', '#1f1a18', '#dcae62', '#9c9ca4', '#efebe4'],
  pad: ['#9b5de5', '#ff5fd2', '#ffe12b', '#3df5ff', '#e0306a', '#ffffff', '#1a1a2e'],
};
const COATS = { '#a8582c': null, '#6b3a1e': ['#6b3a1e', '#141010'], '#1f1a18': ['#211b19', '#0c0a0a'], '#dcae62': ['#dcae62', '#f4ead2'], '#9c9ca4': ['#a3a3ab', '#3c3c42'], '#efebe4': ['#f1eee8', '#d9d4cc'] };
const COAT_TINT = { '#ffffff': [1, 1, 1], '#8a5a3a': [0.62, 0.55, 0.5], '#3a2a24': [0.22, 0.2, 0.2], '#f2c46d': [1.6, 1.25, 0.6], '#c9c9d4': [1.5, 1.5, 1.6], '#b06a3a': [1.25, 0.8, 0.55] };
const defaultOutfit = () => ({ helmet: WARD.helmet[0], jacket: WARD.jacket[0], pants: WARD.pants[0], coat: WARD.coat[0], pad: WARD.pad[3] });
let outfit = Object.assign(defaultOutfit(), JSON.parse(localStorage.getItem('hr_outfit') || '{}'));
if (!WARD.coat.includes(outfit.coat)) outfit.coat = WARD.coat[0];
function std(c, r = 0.7) { return new THREE.MeshStandardMaterial({ color: c, roughness: r }); }
let humanProto = null, humanScale = 1, hipsY = 0;
const POSE = {
  'mixamorigSpine': [0.2, 0, 0],
  'mixamorigLeftUpLeg': [-0.97, 0.02, 0.34], 'mixamorigRightUpLeg': [-0.97, -0.02, -0.34],
  'mixamorigLeftLeg': [-1.12, 0, 0], 'mixamorigRightLeg': [-1.12, 0, 0],
  'mixamorigLeftArm': [0.95, 0.15, 1.09], 'mixamorigRightArm': [0.95, -0.15, -1.09],
  'mixamorigLeftForeArm': [0, 0, 0.64], 'mixamorigRightForeArm': [0, 0, -0.64],
  'mixamorigHead': [-0.1, 0, 0] };
function lightenSkinTexture(tex) {
  const img = tex.image; const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height); const a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
    if (dd < 0.06 || mx !== r) continue; // skin tones are red-dominant
    let h = ((gg - b) / dd) * 60; if (h < 0) h += 360; const sat = dd / (1 - Math.abs(2 * l - 1) + 1e-6);
    if (h > 8 && h < 38 && sat > 0.18 && l > 0.08 && l < 0.62) { const t = Math.min(1, l / 0.45); a[i] = 236 * (0.62 + 0.38 * t); a[i + 1] = 196 * (0.62 + 0.38 * t); a[i + 2] = 170 * (0.62 + 0.38 * t); }
  }
  g.putImageData(d, 0, 0); const t2 = new THREE.CanvasTexture(c); t2.flipY = tex.flipY; t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 8; return t2;
}
let lightSkinTex = null;
function prepRiderGeometry(proto) {
  proto.traverse(n => {
    if (!n.isSkinnedMesh || n.geometry.attributes.region) return;
    const si = n.geometry.attributes.skinIndex, sw = n.geometry.attributes.skinWeight, bones = n.skeleton.bones, reg = new Float32Array(si.count);
    for (let v = 0; v < si.count; v++) {
      let best = 0; for (let k = 1; k < 4; k++) if (sw.getComponent(v, k) > sw.getComponent(v, best)) best = k;
      const nm = bones[si.getComponent(v, best)].name;
      reg[v] = /Head|Neck|Eye/.test(nm) ? 0 : /Hand|Thumb|Index|Middle|Ring|Pinky/.test(nm) ? 3 : /Foot|Toe|(Left|Right)Leg$/.test(nm) ? 3 : /UpLeg|Hips/.test(nm) ? 2 : 1;
    }
    n.geometry.setAttribute('region', new THREE.BufferAttribute(reg, 1));
    if (!lightSkinTex && n.material.map) lightSkinTex = lightenSkinTexture(n.material.map);
  });
}
function riderMaterial(base, o) {
  const m = base.clone(); if (lightSkinTex) m.map = lightSkinTex; m.roughness = 0.75; m.color.set(0xffffff);
  const jacket = new THREE.Color(o.jacket), pants = new THREE.Color(o.pants);
  m.onBeforeCompile = sh => {
    sh.uniforms.uJacket = { value: jacket }; sh.uniforms.uPants = { value: pants };
    sh.vertexShader = 'attribute float region;\nvarying float vRegion;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRegion = region;');
    sh.fragmentShader = 'varying float vRegion;\nuniform vec3 uJacket;\nuniform vec3 uPants;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (vRegion > 0.5 && vRegion < 1.5) diffuseColor.rgb = uJacket * (0.85 + 0.15 * diffuseColor.r);
      else if (vRegion > 1.5 && vRegion < 2.5) diffuseColor.rgb = uPants;
      else if (vRegion > 2.5) diffuseColor.rgb = vec3(0.025, 0.022, 0.02);`);
  };
  m.customProgramCacheKey = () => 'rider-eq';
  return m;
}
function makeHuman(o) {
  const r = new THREE.Group(); const m = SkeletonUtils.clone(humanProto); m.scale.setScalar(humanScale);
  let head = null;
  m.traverse(n => { if (n.isMesh) { n.castShadow = true; n.frustumCulled = false; n.material = riderMaterial(n.material, o); } if (n.isBone && RIDER_POSE[n.name]) { const [x, y, z] = RIDER_POSE[n.name]; n.rotation.x += x; n.rotation.y += y; n.rotation.z += z; } if (n.name === 'mixamorigHeadTop_End') head = n; if (n.name === 'mixamorigHead' && !head) head = n; });
  m.position.y = -hipsY; r.add(m);
  // riding helmet on head bone
  const hb = m.getObjectByName('mixamorigHead');
  if (hb) {
    m.updateMatrixWorld(true); const ws = new THREE.Vector3(); hb.getWorldScale(ws); const k = 1 / ws.x;
    const hel = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 16, 0, Math.PI * 2, 0, Math.PI / 1.85), new THREE.MeshPhysicalMaterial({ color: o.helmet, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 }));
    shell.scale.set(...HELMET.scale); shell.castShadow = true; hel.add(shell);
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.014, 20, 1, false, -Math.PI / 2, Math.PI), std('#111', 0.4)); peak.position.set(0, -0.005, 0.07); peak.rotation.x = 0.15; hel.add(peak);
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.22), new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: 0.9, roughness: 0.25 })); vent.position.set(0, 0.128, 0); hel.add(vent);
    const harness = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 20, Math.PI), std('#111')); harness.rotation.set(0, Math.PI / 2, Math.PI); harness.position.set(0, -0.02, 0.0); hel.add(harness);
    hel.scale.setScalar(k); hel.position.set(HELMET.pos[0] * k, HELMET.pos[1] * k, HELMET.pos[2] * k); hb.add(hel);
  }
  r.userData = {}; return r;
}
function makeRider(o) {
  if (humanProto) return makeHuman(o);
  const r = new THREE.Group(); const skin = std('#f1c7a5');
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; r.add(m); return m; };
  const jacket = std(o.jacket), pants = std(o.pants), boots = std('#141018', 0.4);
  // torso (leaning forward), hips
  const torso = add(new THREE.CapsuleGeometry(0.17, 0.38, 4, 10), jacket, 0, 0.42, 0.04, 0.35);
  add(new THREE.BoxGeometry(0.36, 0.18, 0.28), pants, 0, 0.12, -0.05);
  // legs: thigh forward/down, shin down, boot
  for (const s of [-1, 1]) {
    add(new THREE.CapsuleGeometry(0.075, 0.3, 4, 8), pants, s * 0.24, 0.02, 0.08, 1.1, s * 0.25);
    add(new THREE.CapsuleGeometry(0.065, 0.3, 4, 8), boots, s * 0.33, -0.28, 0.12, -0.15, s * 0.12);
    // arms reaching to reins
    add(new THREE.CapsuleGeometry(0.055, 0.32, 4, 8), jacket, s * 0.2, 0.5, 0.25, 1.15, 0);
    add(new THREE.SphereGeometry(0.06, 8, 6), std('#222'), s * 0.12, 0.42, 0.45);
  }
  // head + riding helmet with brim
  const head = add(new THREE.SphereGeometry(0.13, 14, 10), skin, 0, 0.83, 0.16);
  const helm = add(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), std(o.helmet, 0.3), 0, 0.86, 0.16);
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 3), std(o.helmet), 0, 0.86, 0.16);
  const brim = add(new THREE.BoxGeometry(0.2, 0.025, 0.1), std(o.helmet, 0.3), 0, 0.86, 0.32, 0.25);
  r.userData = { torso, head, helm };
  return r;
}
// ---------- horse coat, fur shader, saddle ----------
const BARREL = { cy: 1.255, rx: 0.218, ry: 0.262 }; // horse-group space ellipse of the barrel under the saddle
const SADDLE_Z = -0.04;
let backVerts = null; // vertex indices used to follow the back while galloping
function coatGeometry(o) {
  const src = horseProto.geometry; const coat = COATS[o.coat];
  if (!coat) return src;
  const g = new THREE.BufferGeometry(); for (const k in src.attributes) if (k !== 'color') g.setAttribute(k, src.attributes[k]);
  g.morphAttributes = src.morphAttributes; g.morphTargetsRelative = src.morphTargetsRelative; if (src.index) g.setIndex(src.index);
  g.boundingSphere = src.boundingSphere; g.boundingBox = src.boundingBox;
  const base = src.attributes.color, n = base.count, out = new Float32Array(n * 3), med = src.userData.medLum;
  const body = new THREE.Color(coat[0]), mane = new THREE.Color(coat[1]);
  for (let v = 0; v < n; v++) {
    const r = base.getX(v), gg = base.getY(v), b = base.getZ(v), L = 0.3 * r + 0.59 * gg + 0.11 * b;
    const dark = L < med * 0.5; const c = dark ? mane : body; const k = dark ? Math.min(1.3, 0.6 + L / (med * 0.5) * 0.5) : Math.min(1.25, L / med);
    out[v * 3] = c.r * k; out[v * 3 + 1] = c.g * k; out[v * 3 + 2] = c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3)); return g;
}
function furMaterial(base) {
  const m = base.clone(); m.flatShading = false; m.roughness = 0.62; m.metalness = 0;
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vFurP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFurP = position;');
    sh.fragmentShader = `varying vec3 vFurP;
      float fh(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float fn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
        return mix(mix(mix(fh(i), fh(i+vec3(1,0,0)), f.x), mix(fh(i+vec3(0,1,0)), fh(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(fh(i+vec3(0,0,1)), fh(i+vec3(1,0,1)), f.x), mix(fh(i+vec3(0,1,1)), fh(i+vec3(1,1,1)), f.x), f.y), f.z); }
      ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      { float lum = dot(diffuseColor.rgb, vec3(.3,.59,.11));
        float fur = fn(vec3(vFurP.x * 0.9, vFurP.y * 0.25, vFurP.z * 0.9)) * 0.6 + fn(vFurP * 2.3) * 0.4;
        float hair = fn(vec3(vFurP.x * 2.2, vFurP.y * 0.12, vFurP.z * 2.2));
        float isMane = smoothstep(0.22, 0.12, lum);
        diffuseColor.rgb *= mix(0.88 + 0.22 * fur, 0.7 + 0.6 * hair, isMane); }`);
  };
  m.customProgramCacheKey = () => 'horse-fur';
  return m;
}
const _sp = (fn) => new ParametricGeometry(fn, 28, 20);
function barrelPt(theta, z, off, t) { // theta 0 = top of back, + = toward +x
  t.set(Math.sin(theta) * (BARREL.rx + off), BARREL.cy + Math.cos(theta) * (BARREL.ry + off), z); return t;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let saddleGeos = null;
function buildSaddleGeos() {
  // saddle cloth (pad): drapes further down the sides, rounded lower corners
  const pad = _sp((u, v, t) => {
    const z = SADDLE_Z - 0.42 + u * 0.8; const th = (v - 0.5) * 2 * 1.22;
    const edge = Math.abs(v - 0.5) * 2; const corner = Math.pow(Math.abs(u - 0.5) * 2, 3) * Math.pow(edge, 4) * 0.35;
    return barrelPt(th * (1 - corner), z, 0.012, t);
  });
  // seat: twist narrow at front, deep in the middle, raised cantle (back) and pommel (front)
  const seat = _sp((u, v, t) => {
    const z = SADDLE_Z - 0.33 + u * 0.6; const halfW = 0.55 + 0.25 * (1 - u); const th = (v - 0.5) * 2 * halfW;
    const cantle = 0.115 * smooth(0.22, 0.0, u) * Math.cos(th * 1.6); const pommel = 0.06 * smooth(0.82, 1.0, u) * Math.cos(th * 2.2);
    const roll = 0.012 * (1 - Math.pow(Math.abs(v - 0.5) * 2, 2));
    return barrelPt(th, z, 0.035 + cantle + pommel + roll, t);
  });
  // flaps: hang down each side, slightly forward-cut like a jumping saddle
  const flap = (side) => _sp((u, v, t) => {
    const zc = SADDLE_Z + 0.06 + (1 - v) * 0.05; const z = zc - 0.17 + u * 0.32 + v * 0.06;
    const th = side * (0.62 + v * 0.95); const round = Math.pow(Math.abs(u - 0.5) * 2, 4) * v * 0.25;
    return barrelPt(th * (1 - round * 0.4), z, 0.03 + v * 0.01, t);
  });
  saddleGeos = { pad, seat, flapL: flap(1), flapR: flap(-1) };
}
let padTexCache = {};
function padTexture(col) {
  if (padTexCache[col]) return padTexCache[col];
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
    for (let i = -w; i < w * 2; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = 14; g.strokeRect(8, 8, w - 16, h - 16);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; padTexCache[col] = t; return t;
}
function makeSaddle(o) {
  if (!saddleGeos) buildSaddleGeos();
  const s = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x3b2316, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.45, side: THREE.DoubleSide });
  const suede = new THREE.MeshStandardMaterial({ color: 0x2c1a11, roughness: 0.9, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9dbe0, metalness: 1, roughness: 0.22 });
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; s.add(m); return m; };
  add(saddleGeos.pad, new THREE.MeshStandardMaterial({ map: padTexture(o.pad), roughness: 0.95, side: THREE.DoubleSide }));
  add(saddleGeos.flapL, leather); add(saddleGeos.flapR, leather);
  add(saddleGeos.seat, suede);
  const _t = new THREE.Vector3();
  for (const side of [-1, 1]) {
    // knee roll
    const kr = add(new THREE.CapsuleGeometry(0.03, 0.22, 4, 10), leather); barrelPt(side * 1.05, SADDLE_Z + 0.2, 0.05, _t); kr.position.copy(_t); kr.rotation.set(-0.35, 0, side * 0.95);
    // stirrup leather + iron
    barrelPt(side * 0.78, SADDLE_Z + 0.05, 0.05, _t); const top = _t.clone(); const bot = new THREE.Vector3(side * 0.37, 0.98, SADDLE_Z + 0.1);
    const len = top.distanceTo(bot); const strap = add(new THREE.BoxGeometry(0.03, len, 0.006), leather);
    strap.position.copy(top).add(bot).multiplyScalar(0.5); strap.lookAt(bot); strap.rotateX(Math.PI / 2);
    const iron = add(new THREE.TorusGeometry(0.055, 0.008, 8, 20), metal); iron.position.copy(bot).add(new THREE.Vector3(0, -0.05, 0)); iron.rotation.y = Math.PI / 2;
    const tread = add(new THREE.BoxGeometry(0.02, 0.012, 0.1), metal); tread.position.copy(iron.position).add(new THREE.Vector3(0, -0.05, 0));
  }
  // girth under the belly
  const girthCurve = new THREE.EllipseCurve(0, 0, BARREL.rx + 0.035, BARREL.ry + 0.03, Math.PI * 0.08, Math.PI * 0.92, true);
  const pts = girthCurve.getPoints(30).map(p => new THREE.Vector3(p.x, BARREL.cy + p.y, SADDLE_Z + 0.16));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.02, 6, false), new THREE.MeshStandardMaterial({ color: 0x1b1410, roughness: 0.7 }));
  return s;
}
function makeHorse(colorHex, isMe, o = outfit) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(coatGeometry(o), horseProto.material);
  mesh.morphTargetInfluences = horseProto.morphTargetInfluences.slice(); mesh.morphTargetDictionary = horseProto.morphTargetDictionary;
  mesh.material = furMaterial(horseProto.material);
  mesh.scale.setScalar(horseScale); mesh.position.y = horseYOff - 0.07;
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  const tack = new THREE.Group(); tack.add(makeSaddle(o)); g.add(tack);
  const rider = makeRider(o); tack.add(rider);
  const rY = humanProto ? (window.__riderY || 1.66) : 1.62; rider.position.set(0, rY, 0.05);
  const mixer = new THREE.AnimationMixer(mesh);
  const act = mixer.clipAction(horseClip); act.play(); act.time = Math.random();
  g.userData = { mixer, pad: tack, tack, mesh, rider, phase: Math.random() * 6, riderY: rY };
  scene.add(g);
  return g;
}
// make the saddle + rider ride the horse's back: sample morphed back vertices each frame
const _bv = new THREE.Vector3();
function backPoint(mesh, idx, out) {
  const pos = mesh.geometry.attributes.position, morph = mesh.geometry.morphAttributes.position, inf = mesh.morphTargetInfluences;
  out.set(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
  if (morph) for (let k = 0; k < morph.length; k++) if (inf[k]) { out.x += morph[k].getX(idx) * inf[k]; out.y += morph[k].getY(idx) * inf[k]; out.z += morph[k].getZ(idx) * inf[k]; }
  return out.multiplyScalar(horseScale).add(mesh.position);
}
// fire a callback on each footfall of the gallop clip (4 beats per stride)
const FOOTFALLS = [0.06, 0.2, 0.33, 0.47];
function footfalls(g, grounded, cb) {
  const act = g.userData.mixer._actions[0]; if (!act) return; const D = horseClip.duration; const ph = (act.time % D) / D;
  const prev = g.userData.lastPh ?? ph; g.userData.lastPh = ph;
  for (const f of FOOTFALLS) { const crossed = prev <= ph ? (prev < f && ph >= f) : (prev < f || ph >= f); if (crossed && grounded) cb(); }
}
function followBack(g) {
  if (!backVerts) return; const ud = g.userData;
  const f = backPoint(ud.mesh, backVerts.front, _bv).y - backVerts.fy, fz = backVerts.fz;
  const b = backPoint(ud.mesh, backVerts.back, _bv).y - backVerts.by, bz = backVerts.bz;
  ud.tack.position.y = (f + b) * 0.5; ud.tack.rotation.x = -Math.atan2(f - b, fz - bz) * 0.9;
}
function rebuildMyHorse() { if (!horseProto) return; if (horse) scene.remove(horse); horse = makeHorse(me.color, true, outfit); }
function nameSprite(text, color) {
  const tex = canvasTex(256, 64, (g, w, h) => {
    g.font = '40px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(text).width + 30; g.fillStyle = color; g.fillRect((w - tw) / 2, 8, tw, 50); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect((w - tw) / 2, 52, tw, 6);
    g.fillStyle = '#fff'; g.fillText(text, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.material.opacity = 0.6; s.scale.set(1.7, 0.42, 1); s.position.y = 3.25; s.renderOrder = 20; return s;
}

// ---------------- COURSE ----------------
let course = [], spawnIdx = 0, active = [];
const gateMats = [0xe0306a, 0x2d6cff, 0xe8b400, 0x1fae5b];
const poleTex = canvasTex(128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e63946'; g.fillRect(i * 16, 0, 16, h); } });
const poleTex2 = canvasTex(128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#1d4ed8'; g.fillRect(i * 16, 0, 16, h); } });

let QORDER = QUESTIONS, qOffset = 0;
function buildCourse(seed, gateQs) {
  const r = rng(seed); const qs = gateQs && gateQs.length ? gateQs : [CATEGORIES.random.q[0], CATEGORIES.random.q[1]];
  const ev = []; let qi = 0;
  for (let z = 120; z < FINISH - 100; z += GATE_GAP) {
    const q = qs[qi++ % qs.length]; const order = shuffle([1, 2, 3, 4], r);
    ev.push({ type: 'gate', z, q: q[0], opts: order.map(i => q[i]), correct: order.indexOf(1) });
    ev.push({ type: 'spook', z: z + 92, lane: Math.floor(r() * 4), kind: r() < 0.5 ? 0 : 1 });
    ev.push({ type: 'fence', z: z + 60, style: r() < 0.5 ? 0 : 1 });
    if (r() < 0.75) ev.push({ type: 'fence', z: z + 115, style: r() < 0.5 ? 0 : 1 });
    for (const [start, n] of [[18, 6], [78, 5], [130, 6]]) {
      const lane = Math.floor(r() * 4); for (let k = 0; k < n; k++) ev.push({ type: 'carrot', z: z + start + k * 3.5, lane });
    }
  }
  ev.push({ type: 'finish', z: FINISH });
  ev.sort((a, b) => a.z - b.z);
  return ev;
}
function answerTex(letter, text, col) {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#12062a'; g.fillRect(0, 0, w, h); g.fillStyle = col; g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, h * 0.45);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 110; g.font = `${fs}px VT323, monospace`;
    while (g.measureText(text).width > w - 50 && fs > 30) { fs -= 4; g.font = `${fs}px VT323, monospace`; }
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowOffsetY = 6; g.shadowOffsetX = 6; g.fillText(text, w / 2, h / 2 + 4);
  });
}
const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 10);
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
let carrotProto = null;
function makeCarrot() {
  if (!carrotProto) {
    const prof = []; for (let k = 0; k <= 20; k++) { const t = k / 20; prof.push(new THREE.Vector2(0.15 * Math.pow(Math.sin(Math.min(1, t * 1.15) * Math.PI / 2), 0.6) * (1 - 0.85 * t) + 0.012, -0.5 + t * 1.0)); }
    prof.reverse();
    const ringTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#ff7a12'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 9 + Math.random() * 12) { g.fillStyle = `rgba(150,50,0,${0.25 + Math.random() * 0.25})`; g.fillRect(0, y, w, 2); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,190,90,.25)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 6); } });
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.55, emissive: 0x401000, emissiveIntensity: 0.25 }));
    body.rotation.x = Math.PI; body.castShadow = true;
    const g = new THREE.Group(); g.add(body);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f9a35, roughness: 0.6, side: THREE.DoubleSide });
    for (let k = 0; k < 7; k++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.42, 5), leafMat); const a = k / 7 * Math.PI * 2;
      stem.position.set(Math.cos(a) * 0.04, 0.68, Math.sin(a) * 0.04); stem.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(stem);
      for (let f = 0; f < 3; f++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), leafMat); leaf.position.set(0, -0.05 + f * 0.1, 0); leaf.scale.z = 0.3; leaf.rotation.z = f % 2 ? 0.7 : -0.7; stem.add(leaf); }
    }
    carrotProto = g;
  }
  return carrotProto.clone();
}
function spawnEvent(e) {
  const g = new THREE.Group(); g.position.z = e.z;
  if (e.type === 'gate') {
    e.banners = [];
    LANES.forEach((x, i) => {
      const col = '#' + gateMats[i].toString(16).padStart(6, '0');
      for (const dx of [-1.38, 1.38]) { const p = new THREE.Mesh(postGeo, whiteMat); p.position.set(x + dx, 2.1, 0); p.castShadow = true; g.add(p); }
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 1.4), new THREE.MeshStandardMaterial({ map: answerTex('ABC'[i], e.opts[i], col), side: THREE.DoubleSide, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.0 }));
      b.position.set(x, 3.4, 0); b.rotation.y = Math.PI; b.castShadow = true; g.add(b); e.banners.push(b);
    });
  } else if (e.type === 'fence') {
    const tex = e.style ? poleTex2 : poleTex;
    const stdMat = new THREE.MeshStandardMaterial({ color: e.style ? 0x1d4ed8 : 0xe63946, roughness: 0.5 });
    for (const x of [-6.5, 6.5]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.7, 0.6), stdMat); s.position.set(x, 0.85, 0); s.castShadow = true; g.add(s);
      // flower box
      const fb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.8), new THREE.MeshStandardMaterial({ color: 0x3f7d20 })); fb.position.set(x * 0.92, 0.18, 0.6); g.add(fb);
      for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), new THREE.MeshStandardMaterial({ color: [0xff5d8f, 0xffd166, 0xffffff][k % 3] })); f.position.set(x * 0.92 + (k - 2) * 0.22, 0.42, 0.6 + (k % 2) * 0.2); g.add(f); }
    }
    e.poles = [];
    for (const y of [0.45, 0.85, 1.25]) {
      const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 13, 10), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      pm.rotation.z = Math.PI / 2; pm.position.y = y; pm.castShadow = true; g.add(pm); e.poles.push(pm);
    }
    e.poles.forEach(p => { p.material.map = tex.clone(); p.material.map.wrapS = THREE.RepeatWrapping; p.material.map.repeat.set(4, 1); });
  } else if (e.type === 'finish') {
    const chk = canvasTex(512, 128, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 32, y * 32, 32, 32); } });
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 1.6), new THREE.MeshStandardMaterial({ map: chk, side: THREE.DoubleSide })); ban.position.y = 4.6; g.add(ban);
    for (const x of [-6.9, 6.9]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.4, 10), new THREE.MeshStandardMaterial({ color: 0x9b5de5 })); p.position.set(x, 2.7, 0); p.castShadow = true; g.add(p); }
    const line = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 1), new THREE.MeshStandardMaterial({ map: chk })); line.rotation.x = -Math.PI / 2; line.position.y = 0.04; g.add(line);
  } else if (e.type === 'spook') {
    const x = LANES[e.lane];
    if (e.kind === 0) { // big open golf umbrella planted in the lane, canopy facing the riders
      const ut = canvasTex(512, 64, (g, w, h) => { const c = ['#e0303a', '#ffffff']; for (let i = 0; i < 8; i++) { g.fillStyle = c[i % 2]; g.fillRect(i * 64, 0, 64, h); } });
      const um = new THREE.Group();
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), new THREE.MeshStandardMaterial({ map: ut, side: THREE.DoubleSide, roughness: 0.55 }));
      canopy.castShadow = true; um.add(canopy);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const rib = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), std('#222')); rib.position.set(Math.cos(a) * 0.98, 0.6, Math.sin(a) * 0.98); um.add(rib); }
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 })); shaft.position.y = 0.2; um.add(shaft);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 16, Math.PI), std('#3a2414')); hook.position.y = -0.75; hook.rotation.z = Math.PI; um.add(hook);
      um.position.set(x, 1.4, 0); um.rotation.set(-1.05, 0, 0); g.add(um); e.wobble = um;
    } else { // bunch of party balloons tied to a post
      const cols = [0xff3b5c, 0xffd23f, 0x3df5ff, 0x9b5de5, 0x4dff8a, 0xff8a2b];
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 10), std('#6b4a2b')); post.position.set(x, 0.55, 0); post.castShadow = true; g.add(post);
      const bunch = new THREE.Group(); bunch.position.set(x, 1.1, 0);
      for (let k = 0; k < 6; k++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshPhysicalMaterial({ color: cols[k], roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 }));
        b.scale.y = 1.2; const a = k / 6 * Math.PI * 2; b.position.set(Math.cos(a) * 0.45, 1.3 + (k % 2) * 0.35, Math.sin(a) * 0.3); b.castShadow = true; bunch.add(b);
        const knot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 8), b.material); knot.position.copy(b.position).add(new THREE.Vector3(0, -0.38, 0)); knot.rotation.x = Math.PI; bunch.add(knot);
        const len = b.position.length(); const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, len, 4), std('#eeeeee')); str.position.copy(b.position).multiplyScalar(0.5); str.lookAt(b.position.clone().add(bunch.position)); str.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.position.clone().normalize()); bunch.add(str);
      }
      g.add(bunch); e.flap = bunch;
    }
    const warn = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe12b })); warn.rotation.x = -Math.PI / 2; warn.position.set(x, 0.05, 1.6); g.add(warn);
  } else if (e.type === 'carrot') {
    const holder = makeCarrot(); holder.position.set(LANES[e.lane], 1.1, 0);
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
  { key: 'speedLvl', name: 'FASTER', desc: 'horse runs faster', cost: l => 20 + l * 20, max: 5 },
  { key: 'boostLvl', name: 'BOOST+', desc: 'bigger answer boost', cost: l => 15 + l * 15, max: 5 },
  { key: 'hack', name: 'HACK', desc: 'steal 30% from richest', cost: () => 20, max: 99 },
  { key: 'mud', name: 'MUD', desc: 'slow down 1st place', cost: () => 25, max: 99 },
];
const ONE_SHOT = k => k === 'mud' || k === 'hack';
function renderShop() {
  $('shop').innerHTML = SHOP.map((s, i) => {
    const lvl = ONE_SHOT(s.key) ? 0 : me[s.key]; const c = s.cost(lvl); const maxed = lvl >= s.max;
    return `<button class="sbtn ${me.coins >= c && !maxed ? 'can' : ''}" data-i="${i}" ${maxed ? 'disabled' : ''}><b>[${i + 1}] ${s.name}${ONE_SHOT(s.key) ? '' : ' LV' + lvl}</b><i>${s.desc}</i><span>${maxed ? 'MAX' : '🥕' + c}</span></button>`;
  }).join('');
}
$('shop').addEventListener('pointerdown', e => { const b = e.target.closest('.sbtn'); if (b) { e.preventDefault(); buy(+b.dataset.i); } });
function buy(i) {
  if (mode !== 'race') return;
  const s = SHOP[i]; const lvl = ONE_SHOT(s.key) ? 0 : me[s.key]; const c = s.cost(lvl);
  if (me.coins < c || lvl >= s.max) { sfx.bad(); return; }
  me.coins -= c; sfx.buy();
  if (s.key === 'mud') throwMud(); else if (s.key === 'hack') doHack(); else { me[s.key]++; feed(`Upgraded ${s.name}!`); }
  renderShop();
}
function throwMud() {
  if (solo) { const lead = [...bots].sort((a, b) => b.z - a.z)[0]; lead.slow = 3; feed(`💩 You mudded ${lead.name}!`); return; }
  send({ t: 'mud', from: me.id });
}
function doHack() {
  sfx.hack();
  if (solo) { const rich = [...bots].sort((a, b) => (b.coins || 0) - (a.coins || 0))[0]; const amt = Math.max(5, Math.floor((rich.coins || 30) * 0.3)); rich.coins = Math.max(0, (rich.coins || 30) - amt); me.coins += amt; toast(`HACKED ${rich.name} +${amt}`, '#4dff8a'); renderShop(); return; }
  send({ t: 'hack', from: me.id });
}
function applyHack(d) {
  const amt = Math.floor(me.coins * 0.3); me.coins -= amt; sfx.hack(); renderShop();
  toast(`${d.from} HACKED YOU -${amt}`, '#4dff8a'); glitch = 1.2;
  send({ t: 'loot', to: d.fromId, amount: amt, victim: me.name });
}
function applyMud(fromName) { effects.mud = 3; sfx.mud(); toast(`💩 ${fromName} MUDDED YOU!`, '#c08a4a'); }

// ---------------- UI HELPERS ----------------
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
let toastT = 0;
function toast(text, color = '#fff') { const t = $('toast'); t.textContent = text; t.style.color = color; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 1100); }
function feed(text) { const d = document.createElement('div'); d.textContent = text; $('feed').appendChild(d); setTimeout(() => d.remove(), 4000); while ($('feed').children.length > 5) $('feed').firstChild.remove(); }
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

// ---------------- NETWORK ----------------
function send(msg) {
  if (isHost) hostHandle(me.id, msg); else if (conn && conn.open) conn.send(msg);
}
function broadcast(msg) { for (const c of conns.values()) if (c.open) c.send(msg); }
function hostHandle(fromId, d) {
  if (d.t === 'hello') {
    if (mode !== 'lobby') { conns.get(fromId)?.send({ t: 'full' }); return; }
    const used = Object.values(players).map(p => p.color);
    players[fromId] = { password: d.password, score: 0, outfit: d.outfit, name: d.name, color: COLORS.find(c => !used.includes(c)) || COLORS[0], z: 0, x: 0, y: 0, coins: 0, correct: 0 };
    broadcast({ t: 'lobby', players, you: null }); conns.get(fromId)?.send({ t: 'settings', settings }); conns.get(fromId)?.send({ t: 'you', id: fromId }); renderLobby();
  } else if (d.t === 'state') {
    if (players[fromId]) Object.assign(players[fromId], d.s);
  } else if (d.t === 'fin') {
    const p = players[fromId]; if (!p || p.fin) return;
    p.fin = ++finCount; const bonus = [50, 30, 15][p.fin - 1] || 0; p.gain = (d.carrots || 0) + bonus; p.score = (p.score || 0) + p.gain;
    const m = { t: 'feed', text: `🏁 ${p.name} #${p.fin}: +${d.carrots || 0} carrots +${bonus} bonus` }; broadcast(m); clientHandle(m);
    if (Object.values(players).every(q => q.fin)) { clearTimeout(raceTimer); raceTimer = setTimeout(hostEndRace, 1500); }
  } else if (d.t === 'hackDone') {
    hostHackDone(fromId);
  } else if (d.t === 'bonus') {
    if (players[fromId]) players[fromId].score += 10;
  } else if (d.t === 'hackTry') {
    const t = players[d.target], a = players[fromId]; if (!t || !a) return;
    const ok = d.guess === t.password; let amt = 0;
    if (ok) { amt = Math.floor((t.score || 0) * 0.25); t.score -= amt; a.score += amt; const m = { t: 'feed', text: `💾 ${a.name} HACKED ${t.name} (-${amt})` }; broadcast(m); clientHandle(m); }
    toPlayer(fromId, { t: 'hackRes', ok, amt, targetName: t.name }); if (players[fromId] && !players[fromId].bot) hostHackDone(fromId);
  } else if (d.t === 'hack') {
    const rich = Object.entries(players).filter(([id]) => id !== fromId).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0))[0];
    if (!rich) return;
    const msg = { t: 'hacked', target: rich[0], from: players[fromId]?.name || '?', fromId, targetName: rich[1].name };
    broadcast(msg); clientHandle(msg);
  } else if (d.t === 'loot') {
    const msg = { t: 'loot', to: d.to, amount: d.amount, victim: d.victim, thief: players[d.to]?.name };
    broadcast(msg); clientHandle(msg);
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
  else if (d.t === 'start') { settings = d.settings || settings; matchEnd = Date.now() + d.remain; startRace(d.seed, d.players, d.gateQs, d.round); }
  else if (d.t === 'settings') { settings = d.settings; renderLobby(); }
  else if (d.t === 'feed') { feed(d.text); }
  else if (d.t === 'hack') { startHackPhase(d); }
  else if (d.t === 'hackRes') { hkBody(d.ok ? H('ACCESS GRANTED', '#4dff8a') + `<div class="small">Stole ${d.amt} from ${esc(d.targetName)}!</div>` : H('ACCESS DENIED', '#ff4060') + `<div class="small">Wrong password.</div>`); clearInterval(hkInt); $('hkTimer').textContent = ''; hkSent = true; d.ok ? sfx.good() : sfx.bad(); }
  else if (d.t === 'board') { showBoard(d); }
  else if (d.t === 'states') { for (const id in d.players) if (id !== me.id) players[id] = d.players[id]; }
  else if (d.t === 'mudded') { if (d.target === me.id) applyMud(d.from); else feed(`💩 ${d.from} mudded ${d.targetName}!`); }
  else if (d.t === 'hacked') { if (d.target === me.id) applyHack(d); }
  else if (d.t === 'loot') { if (d.to === me.id) { me.coins += d.amount; toast(`STOLE ${d.amount} FROM ${d.victim}!`, '#4dff8a'); renderShop(); } else feed(`💾 ${d.thief} hacked ${d.victim} (-${d.amount})`); }
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
      players = { host: { password: myPw, score: 0, outfit, name: me.name, color: COLORS[0], z: 0, x: 0, y: 0, coins: 0, correct: 0 } };
      peer.on('connection', c => {
        c.on('open', () => conns.set(c.peer, c));
        c.on('data', d => hostHandle(c.peer, d));
        c.on('close', () => { conns.delete(c.peer); delete players[c.peer]; removeGhost(c.peer); broadcast({ t: 'lobby', players }); renderLobby(); });
      });
      peer.on('error', e => console.warn(e));
      $('lobbyCode').textContent = code;
      $('lobbyLink').textContent = `Others: open this site → enter code ${code}`;
      $('menuErr').textContent = ''; mode = 'lobby'; renderLobby(); show('lobby');
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
    conn.on('open', () => { conn.send({ t: 'hello', name: me.name, outfit, password: myPw }); isHost = false; solo = false; mode = 'lobby'; $('lobbyCode').textContent = code; $('lobbyLink').textContent = ''; $('menuErr').textContent = ''; show('lobby'); });
    conn.on('data', clientHandle);
    conn.on('close', () => { $('menuErr').textContent = 'Host left the game.'; mode = 'menu'; show('menu'); $('hud').classList.remove('on'); });
  } catch (e) { $('menuErr').textContent = 'Could not connect: ' + e.type; }
}
function renderLobby() {
  $('lobbyPlayers').innerHTML = Object.values(players).map(p => `<div class="chip" style="background:${p.color}">🐎 ${esc(p.name)}</div>`).join('');
  $('startBtn').style.display = isHost ? 'block' : 'none';
  $('lobbyWait').style.display = isHost ? 'none' : 'block';
  $('hostSet').style.display = isHost ? 'block' : 'none';
  $('setCat').innerHTML = Object.entries(CATEGORIES).map(([k, c]) => `<button data-v="${k}" class="${settings.cat === k ? 'sel' : ''}">${c.name}</button>`).join('');
  $('setTime').innerHTML = [3, 5, 10].map(m => `<button data-v="${m}" class="${settings.mins === m ? 'sel' : ''}">${m} MIN</button>`).join('');
  $('lobbySettings').textContent = `${(CATEGORIES[settings.cat] || {}).name} · ${settings.mins} MIN`;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function saveName() {
  const n = $('name').value.trim(); if (!n) { $('menuErr').textContent = 'Type your name first!'; $('name').focus(); return false; }
  me.name = n; localStorage.setItem('hr_name', n); return true;
}
let round = 0, finCount = 0, raceTimer = null, myPw = '', pwChoices = [genPw(), genPw(), genPw(), genPw()]; myPw = pwChoices[0];
function setQ(qs, rd) { QORDER = shuffle(QUESTIONS.slice(), rng(qs)); qOffset = ((rd - 1) * 4) % QORDER.length; }
function toPlayer(id, msg) { if (id === me.id) clientHandle(msg); else conns.get(id)?.send(msg); }
let settings = { cat: localStorage.getItem('hr_cat') || 'horse', mins: +(localStorage.getItem('hr_mins') || 5) }, matchEnd = 0;
function takeQuestions(n) {
  const cat = CATEGORIES[settings.cat] || CATEGORIES.horse; const key = 'hr_used_' + settings.cat;
  let used = JSON.parse(localStorage.getItem(key) || '[]'); const out = [];
  for (let k = 0; k < n; k++) {
    let free = cat.q.map((_, i) => i).filter(i => !used.includes(i));
    if (!free.length) { used = []; free = cat.q.map((_, i) => i); }
    const i = free[Math.floor(Math.random() * free.length)]; used.push(i); out.push(cat.q[i]);
  }
  localStorage.setItem(key, JSON.stringify(used)); return out;
}
function hostStart() { for (const id in players) if (players[id].bot) players[id].mult = 1; round = 0; matchEnd = Date.now() + settings.mins * 60000; for (const id in players) players[id].score = 0; nextRound(); }
function nextRound() {
  round++; finCount = 0; const seed = Math.floor(Math.random() * 1e9);
  for (const id in players) Object.assign(players[id], { z: 0, x: 0, y: 0, coins: 0, correct: 0, fin: 0, gain: 0 });
  const gateQs = takeQuestions(2); const m = { t: 'start', seed, players, round, gateQs, settings, remain: matchEnd - Date.now() }; broadcast(m); clientHandle(m);
  clearTimeout(raceTimer); raceTimer = setTimeout(hostEndRace, 36000);
}
function hostEndRace() {
  clearTimeout(raceTimer);
  const opts = {}; for (const id in players) opts[id] = shuffle([players[id].password, genPw(), genPw(), genPw()], Math.random);
  const q = takeQuestions(1)[0];
  hackDone = new Set(); hackOpen = true;
  const m = { t: 'hack', players, opts, q }; broadcast(m); clientHandle(m);
  // bots occasionally hack too
  for (const id in players) if (players[id].bot) { hackDone.add(id); if (Math.random() < 0.5) setTimeout(() => { if (!hackOpen) return; const others = Object.keys(players).filter(k => k !== id); const tg = others[Math.floor(Math.random() * others.length)]; hostHandle(id, { t: 'hackTry', target: tg, guess: opts[tg][Math.floor(Math.random() * 4)] }); }, 2000 + Math.random() * 4000); }
  raceTimer = setTimeout(endHackPhase, 31000);
}
let hackDone = new Set(), hackOpen = false;
function endHackPhase() {
  if (!hackOpen) return; hackOpen = false; clearTimeout(raceTimer);
  const last = matchEnd - Date.now() < 15000; const b = { t: 'board', players, round, last, remain: matchEnd - Date.now() }; broadcast(b); clientHandle(b);
  if (!last) raceTimer = setTimeout(nextRound, 4000);
}
function hostHackDone(id) { if (!hackOpen) return; hackDone.add(id); if (Object.keys(players).every(k => hackDone.has(k))) setTimeout(endHackPhase, 1200); }
// ----- client: cyber hack phase -----
let hkInt = null, hkSent = false;
function hkBody(html) { $('hkBody').innerHTML = html; }
function hkFinish() { clearInterval(hkInt); $('hkTimer').textContent = ''; if (!hkSent) { hkSent = true; send({ t: 'hackDone' }); } }
function hkCountdown(sec, onEnd) {
  clearInterval(hkInt); let left = sec; $('hkTimer').textContent = left + 's';
  hkInt = setInterval(() => { left--; $('hkTimer').textContent = Math.max(0, left) + 's'; if (left <= 0) { clearInterval(hkInt); onEnd(); } }, 1000);
}
const H = (txt, col) => `<div class="hkHead" style="color:${col}">${txt}</div>`;
function startHackPhase(d) {
  document.exitPointerLock?.(); hkSent = false;
  mode = 'hack'; $('hud').classList.remove('on'); $('touch').style.display = 'none'; show('hackS'); sfx.hack();
  const q = d.q; const answers = shuffle([q[1], q[2], q[3], q[4]], Math.random);
  hkBody(`<div class="small" style="margin:8px 0 14px">Answer right for +10 and a chance to HACK</div><div class="pbox" style="padding:14px;font-size:32px;color:#fff;margin-bottom:6px">${esc(q[0])}</div><div class="hkGrid">` + answers.map(a => `<button class="btn yel hkA">${esc(a)}</button>`).join('') + '</div>');
  hkCountdown(15, () => { hkBody(H("TIME'S UP!", '#ff4060')); hkFinish(); });
  $('hkBody').querySelectorAll('.hkA').forEach(b => b.onclick = () => {
    if (b.textContent !== q[1]) { sfx.bad(); hkBody(H('WRONG', '#ff4060') + `<div class="small">Answer: ${esc(q[1])}</div>`); hkFinish(); return; }
    sfx.good(); send({ t: 'bonus' });
    const targets = Object.entries(d.players).filter(([id]) => id !== me.id);
    hkBody(H('+10! PICK A TARGET', '#4dff8a') + '<div class="hkGrid">' + targets.map(([id, p]) => `<button class="btn cyn hkT" data-id="${id}">${esc(p.name)} · ${p.score || 0}</button>`).join('') + '</div>');
    hkCountdown(5, () => { hkBody(H('TOO SLOW!', '#ff4060')); hkFinish(); });
    $('hkBody').querySelectorAll('.hkT').forEach(t => t.onclick = () => {
      const id = t.dataset.id;
      hkBody(H(`GUESS ${esc(d.players[id].name).toUpperCase()}'S PASSWORD`, '#ff5fd2') + '<div class="hkGrid">' + d.opts[id].map(w => `<button class="btn pnk hkP">${w}</button>`).join('') + '</div>');
      hkCountdown(10, () => { hkBody(H('TOO SLOW!', '#ff4060')); hkFinish(); });
      $('hkBody').querySelectorAll('.hkP').forEach(pb => pb.onclick = () => { clearInterval(hkInt); hkBody(H('HACKING…', '#3df5ff')); send({ t: 'hackTry', target: id, guess: pb.textContent }); });
    });
  });
}
function showBoard(d) {
  document.exitPointerLock?.();
  clearInterval(hkInt); mode = 'results'; $('hud').classList.remove('on');
  const all = Object.entries(d.players).map(([id, p]) => ({ ...p, id })).sort((a, b) => (b.score || 0) - (a.score || 0));
  const medals = ['🥇', '🥈', '🥉'];
  $('resTitle').textContent = d.last ? 'FINAL!' : `AFTER RACE ${d.round}`; if (d.remain != null) matchEnd = Date.now() + d.remain; if (d.last) matchEnd = 0;
  $('resList').innerHTML = all.map((p, i) => `<div class="row2 ${i === 0 ? 'first' : ''}"><span>${medals[i] || (i + 1) + '.'} ${esc(p.name)}${p.id === me.id ? ' (you)' : ''}</span><span>${p.score || 0} pts</span></div>`).join('');
  $('againBtn').style.display = d.last && isHost ? 'block' : 'none';
  $('againWait').textContent = d.last ? (isHost ? '' : 'Waiting for host…') : 'Next race in a few seconds…';
  show('results');
}

// ---------------- RACE ----------------
function removeGhost(id) { if (ghosts[id]) { scene.remove(ghosts[id].g); delete ghosts[id]; } }
function startRace(seed, plist, gateQs, rd) {
  if (rd === 1 || me.speedMult == null) me.speedMult = 1;
  raceSeed = seed; players = plist || players;
  clearCourse(); course = buildCourse(seed, gateQs); clearPrints();
  Object.keys(ghosts).forEach(removeGhost);
  const myLane = Math.max(0, Object.keys(players).indexOf(me.id)) % 4; aimX = LANES[myLane]; xVel = 0; setTimeout(() => { try { canvas.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} }, 0);
  Object.assign(me, { finished: false, z: 0, x: LANES[myLane], lane: myLane, y: 0, vy: 0, coins: 0, correct: 0, speedLvl: 0, boostLvl: 0, multLvl: 0 });
  effects = { boost: 0, slow: 0, slowMult: 1, mud: 0 };
  me.color = players[me.id]?.color || COLORS[0];
  rebuildMyHorse();
  for (const id in players) if (id !== me.id) makeGhost(id, players[id]);
  mode = 'count'; raceStart = performance.now() / 1000 + 3;
  show(null); $('hud').classList.add('on'); renderShop(); $('feed').innerHTML = '';
  if (matchMedia('(pointer:coarse)').matches) $('touch').style.display = 'block';
}
const ghostDepthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
function makeGhost(id, p) {
  const g = makeHorse(p.color, false, p.outfit || { ...defaultOutfit(), coat: WARD.coat[Math.floor(Math.random() * 6)], jacket: p.color, pad: p.color }); const meshes = []; g.traverse(n => { if (n.isMesh) meshes.push(n); });
  for (const n of meshes) {
    n.material = n.material.clone(); n.material.transparent = true; n.material.opacity = 0.45; n.material.depthWrite = false; n.renderOrder = 11; n.castShadow = false;
    const d = n.isSkinnedMesh ? new THREE.SkinnedMesh(n.geometry, ghostDepthMat) : new THREE.Mesh(n.geometry, ghostDepthMat);
    if (n.isSkinnedMesh) d.bind(n.skeleton, n.bindMatrix);
    if (n.morphTargetInfluences) { d.morphTargetInfluences = n.morphTargetInfluences; d.morphTargetDictionary = n.morphTargetDictionary; }
    d.position.copy(n.position); d.quaternion.copy(n.quaternion); d.scale.copy(n.scale); d.renderOrder = 10; d.frustumCulled = false; n.parent.add(d);
  } g.add(nameSprite(p.name, p.color));
  ghosts[id] = { g, tz: 0, tx: 0, ty: 0 };
}
function endRace() {
  mode = 'results'; stopMusic();
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
function steer(dir) { if (mode === 'race' || mode === 'count') { me.lane = clamp(me.lane + dir, 0, 3); aimX = LANES[me.lane]; } }
let aimX = 0, xVel = 0;
addEventListener('mousemove', e => { if (document.pointerLockElement !== canvas || !(mode === 'race' || mode === 'count')) return; aimX = clamp(aimX - e.movementX * 0.02, -5.6, 5.6); me.lane = laneIndexOf(aimX); });
canvas.addEventListener('mousedown', () => { if (mode === 'race') jump(); if ((mode === 'race' || mode === 'count') && document.pointerLockElement !== canvas) canvas.requestPointerLock?.()?.catch?.(() => {}); });
function jump() { if (mode === 'race' && me.y <= 0.001) { me.vy = 9; sfx.jump(); airborne = true; } }
let airborne = false;

function triggerEvent(e) {
  if (e.type === 'gate') {
    const lane = laneIndexOf(me.x);
    if (lane === e.correct) {
      const gain = 10 * (1 + me.multLvl);
      me.coins += gain; me.correct++; me.speedMult *= 1.1; effects.boost = 0.6; sfx.good();
      toast('CORRECT!', '#4dff8a');
      e.banners[lane].material.emissive.set(0x22ff88); e.banners[lane].material.emissiveIntensity = 0.6;
    } else {
      me.speedMult *= 0.9; sfx.bad();
      toast('WRONG!', '#ff4060');
      e.banners[e.correct].material.emissive.set(0x22ff88); e.banners[e.correct].material.emissiveIntensity = 0.6;
    }
    e.done = true; renderShop();
  } else if (e.type === 'fence') {
    if (me.y < 1.0) { e.knocked = 0.001; effects.slow = 1.1; effects.slowMult = 0.35; stumbleT = 0.8; sfx.knock(); toast('RAIL DOWN!', '#ffe12b'); shake = 0.4; }
  } else if (e.type === 'spook') {
    if (laneIndexOf(me.x) === e.lane && me.y < 1.3) { effects.slow = 1.6; effects.slowMult = 0.2; spookT = 0.9; sfx.spook(); toast('SPOOKED!', '#ff5fd2'); shake = 0.5; }
  } else if (e.type === 'finish') {
    if (!me.finished) { me.finished = true; send({ t: 'fin', carrots: me.coins }); toast('FINISHED!', '#ffe12b'); sfx.good(); }
  } else if (e.type === 'carrot') {
    if (laneIndexOf(me.x) === e.lane && Math.abs(LANES[e.lane] - me.x) < 1.4 && me.y < 2) {
      me.coins += 1 + me.multLvl; e.obj.visible = false; sfx.coin(); renderShop();
    }
  }
}

let stumbleT = 0, spookT = 0, lastCount = 0, glitch = 0, shake = 0, lastNet = 0, lastShopRender = 0;
function updateQuestion() {
  const next = active.find(e => e.type === 'gate' && !e.done && e.z > me.z) || course.find(e => e.type === 'gate' && e.z > me.z);
  if (next !== curGate) {
    curGate = next;
    if (next) { const c = CATEGORIES[settings.cat]; $('qkind').textContent = c ? c.name : 'QUIZ'; $('qkind').className = settings.cat === 'survey' ? 'survey' : ''; $('qtext').textContent = next.q; }
  }
  $('qbox').classList.toggle('down', !!(next && next.z - me.z < 150 && next.z - me.z > -2));
}
function updateBoard() {
  let list;
  list = Object.entries(players).map(([id, p]) => ({ id, name: id === me.id ? me.name : p.name, z: id === me.id ? me.z : p.z, color: p.color }));
  list.sort((a, b) => b.z - a.z);
  const myId = me.id;
  const place = list.findIndex(p => p.id === myId) + 1;
  $('place').textContent = `#${place} / ${list.length}`;
  $('board').innerHTML = list.map((p, i) => `<div class="${p.id === myId ? 'me' : ''}"><span><span style="color:${p.color}">●</span> ${i + 1}. ${esc(p.name)}</span><span>${Math.floor(p.z)}m</span></div>`).join('');
}

let horseSpeed = 0, printT = 0, printSide = 1;
const PRINT_N = 220; const printGeo = new THREE.CircleGeometry(0.11, 10); printGeo.scale(1, 1.25, 1);
const printMat = new THREE.MeshBasicMaterial({ color: 0x3a2412, transparent: true, opacity: 0.45, depthWrite: false });
const printsIM = new THREE.InstancedMesh(printGeo, printMat, PRINT_N); printsIM.frustumCulled = false; scene.add(printsIM); let printIdx = 0;
const _pq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
function addPrint(x, z) { _m.compose(_p.set(x, 0.035, z), _pq, _s.set(1, 1, 1)); printsIM.setMatrixAt(printIdx++ % PRINT_N, _m); printsIM.instanceMatrix.needsUpdate = true; }
function clearPrints() { _m.makeTranslation(0, -50, 0); for (let i = 0; i < PRINT_N; i++) printsIM.setMatrixAt(i, _m); printsIM.instanceMatrix.needsUpdate = true; }
clearPrints();
const clock = new THREE.Clock();
let boardT = 0;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now() / 1000;

  if (mode === 'count') {
    const left = raceStart - now;
    $('count').textContent = left > 0 ? Math.ceil(left) : 'GO!';
    if (Math.ceil(left) !== lastCount && left > 0) { lastCount = Math.ceil(left); sfx.count(false); }
    if (left <= 0) { mode = 'race'; sfx.count(true); lastCount = 0; setTimeout(() => { if ($('count').textContent === 'GO!') $('count').textContent = ''; }, 700); }
  }
  let speed = 0;
  if (mode === 'race') {
    const elapsed = now - raceStart; const remain = 45 - elapsed;
    $('timer').textContent = fmtTime(remain);
    for (const k of ['boost', 'slow', 'mud']) effects[k] = Math.max(0, effects[k] - dt);
    speed = BASE_SPEED * me.speedMult;
    
    if (effects.slow > 0) speed *= effects.slowMult;
    if (effects.mud > 0) speed *= 0.5;
    horseSpeed = speed; const prevZ = me.z; me.z += speed * dt;
    // spawn / trigger / despawn
    while (spawnIdx < course.length && course[spawnIdx].z < me.z + 230) spawnEvent(course[spawnIdx++]);
    for (const e of active) if (!e.hit && e.z > prevZ && e.z <= me.z + 0.0) { e.hit = true; triggerEvent(e); }
    active = active.filter(e => { if (e.z < me.z - 25) { scene.remove(e.obj); return false; } return true; });
    // bots
    if (isHost) for (const id in players) { const b = players[id]; if (!b.bot) continue;
      b.slow = Math.max(0, (b.slow || 0) - dt); if (b.mult == null || round === 1 && b.z === 0) b.mult = b.mult ?? 1;
      const pz0 = b.z; b.z += BASE_SPEED * b.mult * (b.slow ? 0.35 : 1) * dt;
      for (const ev of course) { if (ev.z > pz0 && ev.z <= b.z) { if (ev.type === 'gate') b.mult *= Math.random() < 0.6 ? 1.1 : 0.9; else if (ev.type === 'fence' && Math.random() < 0.25) b.slow = 1.1; else if (ev.type === 'spook' && Math.random() < 0.15) b.slow = 1.6; } }
      b.x = LANES[Math.floor(b.z / 110 + b.lane0) % 4];
      if (b.z >= FINISH && !b.fin) hostHandle(id, { t: 'fin', carrots: 4 + Math.floor(Math.random() * 12) });
    }
    // network
    if (now - lastNet > 0.1) {
      lastNet = now;
      const s = { z: me.z, x: me.x, y: me.y, coins: me.coins, correct: me.correct };
      if (isHost) { Object.assign(players[me.id], s); if (!solo) broadcast({ t: 'states', players }); } else if (conn?.open) conn.send({ t: 'state', s });
    }
    boardT -= dt; if (boardT <= 0) { boardT = 0.25; updateBoard(); }
    if (now - lastShopRender > 1) { lastShopRender = now; renderShop(); }
    updateQuestion();
    $('dist').textContent = `${Math.floor(me.z)} m`;
    $('coins').textContent = me.coins;
    $('mud').style.opacity = effects.mud > 0 ? 1 : 0; glitch = Math.max(0, glitch - dt); canvas.style.filter = glitch > 0 ? `hue-rotate(${Math.random() * 360}deg) contrast(1.4)` : '';
  }

  // player physics
  { const tgt = LANES[me.lane] * 0.85 + aimX * 0.15; xVel += (tgt - me.x) * 140 * dt; xVel *= Math.exp(-dt * 11); me.x += xVel * dt; }
  me.vy -= 26 * dt; me.y = Math.max(0, me.y + me.vy * dt); if (me.y === 0) { me.vy = Math.max(0, me.vy); if (airborne) { airborne = false; sfx.land(); } }

  if (horse) {
    horse.position.set(me.x, me.y - (stumbleT > 0 ? Math.sin((0.8 - stumbleT) / 0.8 * Math.PI) * 0.25 : 0), me.z);
    horse.rotation.y = clamp(xVel * 0.05, -0.4, 0.4); horse.rotation.z = clamp(-xVel * 0.02, -0.15, 0.15);
    spookT = Math.max(0, spookT - dt); stumbleT = Math.max(0, stumbleT - dt); horse.rotation.x = stumbleT > 0 ? Math.sin((0.8 - stumbleT) / 0.8 * Math.PI) * 0.32 : spookT > 0 ? -Math.sin((0.9 - spookT) / 0.9 * Math.PI) * 0.55 : (me.y > 0 ? -clamp(me.vy * 0.04, -0.35, 0.35) : 0);
    { const ud = horse.userData; ud.phase += dt * (mode === 'race' ? speed / BASE_SPEED : 0.3) * 9; ud.rider.position.y = ud.riderY + Math.abs(Math.sin(ud.phase)) * 0.07; ud.rider.rotation.x = me.y > 0 ? 0.25 : Math.sin(ud.phase) * 0.04; }
    followBack(horse);
    const legRate = mode === 'race' ? (speed / BASE_SPEED) * 1.55 : (mode === 'menu' || mode === 'wardrobe' || mode === 'lobby') ? 0.35 : 0;
    horse.userData.mixer.update(dt * legRate);
    if (mode === 'race') footfalls(horse, me.y === 0, () => { if (me.y === 0) { emitDust(me.x, me.z, speed, xVel); play('hoof' + (1 + Math.floor(Math.random() * 6)), 0.8, 0.9 + speed / BASE_SPEED * 0.12 + Math.random() * 0.08) || play('hoof', 0.75) || clop(0, true); } });
  }
  // ghosts
  const ghostSrc = players;
  for (const id in ghosts) {
    const p = ghostSrc[id]; if (!p) continue; const gh = ghosts[id];
    const k = 1 - Math.exp(-dt * 8);
    gh.g.position.x = lerp(gh.g.position.x, p.x || 0, k);
    gh.g.position.y = lerp(gh.g.position.y, p.y || 0, k);
    gh.g.position.z = mode === 'race' ? lerp(gh.g.position.z, (p.z || 0) + (solo ? 0 : speed * 0.1), k) : (p.z || 0);
    { const ud = gh.g.userData; ud.phase += dt * 9; ud.rider.position.y = ud.riderY + Math.abs(Math.sin(ud.phase)) * 0.07; }
    followBack(gh.g);
    gh.g.userData.mixer.update(dt * (mode === 'race' ? 1.55 * (p.mult || 1) : 0));
  }
  // course anim
  for (const e of active) {
    if (e.wobble) e.wobble.rotation.z = Math.sin(now * 2.2 + e.z) * 0.12;
    if (e.flap) { e.flap.rotation.z = Math.sin(now * 1.7 + e.z) * 0.12; e.flap.rotation.x = Math.sin(now * 1.3) * 0.08; }
    if (e.type === 'carrot' && e.holder) { e.holder.rotation.y += dt * 3; e.holder.position.y = 1.1 + Math.sin(now * 4 + e.z) * 0.15; }
    if (e.type === 'fence' && e.knocked) { e.knocked = Math.min(1, e.knocked + dt * 2.5); e.poles.forEach((p, i) => { p.position.y = lerp([0.45, 0.85, 1.25][i], 0.08 + i * 0.12, e.knocked); p.position.z = e.knocked * (0.6 + i * 0.3); p.rotation.y = e.knocked * (i - 1) * 0.15; }); }
  }
  updateDust(dt);
  if (matchEnd) { const ms = Math.max(0, matchEnd - Date.now()); $('matchT').style.display = 'block'; $('matchT').textContent = '⏱ ' + fmtTime(ms / 1000); } else $('matchT').style.display = 'none';
  if (mode === 'race' && horse && me.y === 0) { printT -= dt; if (printT <= 0) { printT = 0.11; printSide = -printSide; addPrint(me.x + printSide * 0.22, me.z - 1.2); } }

  // world follow
  const pz = me.z;
  ground.position.z = Math.floor((pz + 150) / 8) * 8;
  track.position.z = Math.floor((pz + 250) / (600 / 110)) * (600 / 110);
  hills.position.z = pz;
  updateTrees(pz); updateRails(pz);
  sun.position.set(me.x + sunDir.x * 60, sunDir.y * 60, pz + 15 + sunDir.z * 60); sun.target.position.set(me.x, 0, pz + 15);

  // camera
  const fovT = 62 + (effects.boost > 0 ? 12 : 0);
  camera.fov = lerp(camera.fov, fovT, 1 - Math.exp(-dt * 4)); camera.updateProjectionMatrix();
  shake = Math.max(0, shake - dt);
  const camX = me.x * 0.8 + (Math.random() - .5) * shake, camY = 2.95 + me.y * 0.45 + (Math.random() - .5) * shake;
  if (mode === 'menu' || mode === 'lobby' || mode === 'wardrobe') {
    const a = now * 0.25; const wd = mode === 'wardrobe'; camera.position.set(me.x + Math.sin(a) * (wd ? 5 : 7), wd ? 2.4 : 2.6, me.z + Math.cos(a) * (wd ? 5 : 7)); camera.lookAt(me.x + (wd ? -1.6 : 0), wd ? 1.6 : 1.3, me.z);
  } else {
    camera.position.set(lerp(camera.position.x, camX, 1 - Math.exp(-dt * 6)), camY, pz - 4.5);
    camera.lookAt(me.x * 0.95, 1.9 + me.y * 0.35, pz + 9);
  }
  renderer.render(scene, camera);
}

// ---------------- INPUT ----------------
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') e.target.id === 'joinCode' ? joinGame() : createGame(); return; }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) steer(-1);
  if (['ArrowRight', 'd', 'D'].includes(e.key)) steer(1);
  if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); jump(); }
  if (e.key === 'm' || e.key === 'M') toggleMute();
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
  solo = true; isHost = true; me.id = 'host';
  players = { host: { name: me.name, color: COLORS[0], password: myPw, score: 0, outfit } };
  [['Thunder', '#3a86ff', 0.97], ['Daisy', '#22c06b', 1.02], ['Biscuit', '#ffbe0b', 1.06]].forEach(([name, color, skill], i) => players['bot' + i] = { bot: true, lane0: i + 1, name, color, skill, z: 0, x: LANES[i + 1], y: 0, score: 0, password: genPw() });
  settings.mins = Math.min(settings.mins, 3); hostStart();
};
function buildPw() { $('pwPick').innerHTML = pwChoices.map(w => `<button class="${w === myPw ? 'sel' : ''}">${w}</button>`).join(''); }
$('pwPick').onclick = e => { const b = e.target.closest('button'); if (!b) return; myPw = b.textContent; buildPw(); };
buildPw();
$('startBtn').onclick = () => { if (isHost) hostStart(); };
$('setCat').onclick = e => { const b = e.target.closest('button'); if (!b || !isHost) return; settings.cat = b.dataset.v; localStorage.setItem('hr_cat', settings.cat); broadcast({ t: 'settings', settings }); renderLobby(); };
$('setTime').onclick = e => { const b = e.target.closest('button'); if (!b || !isHost) return; settings.mins = +b.dataset.v; localStorage.setItem('hr_mins', settings.mins); broadcast({ t: 'settings', settings }); renderLobby(); };
$('againBtn').onclick = () => {
  if (isHost) hostStart();
};
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---------------- BOOT ----------------
$('name').value = localStorage.getItem('hr_name') || '';
$('joinCode').value = ''; if (location.search) history.replaceState(null, '', location.pathname);
function buildWardrobe() {
  for (const k of Object.keys(WARD)) {
    const el = $('sw-' + k);
    el.innerHTML = WARD[k].map(c => `<button style="background:${c}" data-c="${c}" class="${outfit[k] === c ? 'sel' : ''}"></button>`).join('');
    el.onclick = e => { const b = e.target.closest('button'); if (!b) return; outfit[k] = b.dataset.c; localStorage.setItem('hr_outfit', JSON.stringify(outfit)); sfx.buy(); buildWardrobe(); rebuildMyHorse(); };
  }
}
$('wardBtn').onclick = () => { mode = 'wardrobe'; buildWardrobe(); show('wardrobe'); };
$('wardDone').onclick = () => { mode = 'menu'; show('menu'); };
const setMuteLabel = () => $('muteBtn').textContent = muted ? '🔇 MUTED [M]' : '🔊 SOUND [M]';
setMuteLabel();
function toggleMute() { muted = !muted; localStorage.setItem('hr_muted', muted ? '1' : '0'); setMuteLabel(); if (masterGain) masterGain.gain.value = muted ? 0 : 1; }
$('muteBtn').onclick = e => { e.stopPropagation(); toggleMute(); };
loadSfx();
await Promise.all([document.fonts.load('40px VT323'), document.fonts.load('20px "Press Start 2P"')]).catch(() => {});
new GLTFLoader().load('models/Horse.glb', gltf => {
  horseProto = gltf.scene.getObjectByProperty('type', 'Mesh') || gltf.scene.children[0];
  horseClip = gltf.animations[0];
  { // smooth normals by welding positions
    const g = horseProto.geometry; const pos = g.attributes.position; const idx = g.index; const n = new Float32Array(pos.count * 3); const map = new Map(); const keys = new Array(pos.count);
    for (let v = 0; v < pos.count; v++) { const k = `${Math.round(pos.getX(v))}_${Math.round(pos.getY(v))}_${Math.round(pos.getZ(v))}`; keys[v] = k; }
    const acc = new Map(); const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), cb = new THREE.Vector3(), ab = new THREE.Vector3();
    const tri = idx ? idx.count / 3 : pos.count / 3;
    for (let t = 0; t < tri; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2); cb.subVectors(c, b); ab.subVectors(a, b); cb.cross(ab);
      for (const i of [i0, i1, i2]) { const k = keys[i]; const s0 = acc.get(k) || new THREE.Vector3(); s0.add(cb); acc.set(k, s0); }
    }
    for (let v = 0; v < pos.count; v++) { const s0 = acc.get(keys[v]).clone().normalize(); n[v * 3] = s0.x; n[v * 3 + 1] = s0.y; n[v * 3 + 2] = s0.z; }
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    const col = g.attributes.color; const L = []; for (let v = 0; v < col.count; v++) L.push(0.3 * col.getX(v) + 0.59 * col.getY(v) + 0.11 * col.getZ(v)); L.sort((x, y) => x - y); g.userData.medLum = L[Math.floor(L.length * 0.6)];
  }
  const box = new THREE.Box3().setFromObject(horseProto);
  const size = box.getSize(new THREE.Vector3());
  horseScale = 2.3 / size.y; horseYOff = -box.min.y * horseScale;
  { // back reference vertices (top of back just in front of / behind the saddle)
    const pos = horseProto.geometry.attributes.position; let fb = null, bb = null;
    for (let v = 0; v < pos.count; v++) { const x = pos.getX(v) * horseScale, y = pos.getY(v) * horseScale + horseYOff, z = pos.getZ(v) * horseScale;
      if (Math.abs(x) > 0.06) continue;
      if (Math.abs(z - (SADDLE_Z + 0.22)) < 0.08 && (!fb || y > fb.y)) fb = { v, y, z };
      if (Math.abs(z - (SADDLE_Z - 0.25)) < 0.08 && (!bb || y > bb.y)) bb = { v, y, z }; }
    if (fb && bb) backVerts = { front: fb.v, fy: fb.y, fz: fb.z, back: bb.v, by: bb.y, bz: bb.z };
  }
  window.__horseInfo = { size: size.toArray(), min: box.min.toArray(), rot: horseProto.rotation.toArray() };
  new GLTFLoader().load('models/Michelle.glb', h => { try {
    humanProto = h.scene; humanProto.updateMatrixWorld(true); prepRiderGeometry(humanProto);
    const hb = new THREE.Box3().setFromObject(humanProto); humanScale = 1.6 / hb.getSize(new THREE.Vector3()).y;
    const hips = humanProto.getObjectByName('mixamorigHips'); const hp = new THREE.Vector3(); hips.getWorldPosition(hp); hipsY = (hp.y - hb.min.y) * humanScale; reshapeRider(humanProto); window.__riderY = RIDER_Y;
    rebuildMyHorse(); console.log('human ok', humanScale, hipsY); } catch (e) { console.error('human err', e.message, e.stack); }
  }, undefined, e => console.error('human fail', e));
  rebuildMyHorse();
  $('loading').remove(); show('menu'); tick(); window.__tick = tick; window.__pose = POSE; window.__rebuild = rebuildMyHorse; window.__h = () => horse;
});
