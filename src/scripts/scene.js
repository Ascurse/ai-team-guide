import { AmbientLight, BoxGeometry, Clock, Color, DirectionalLight, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { COMPACT_WARN, FRESH_SESSION_WARN, MAX_SCALE } from '../lib/sim.js';

const TOWER = 7;
const WIDTH = 3.4;
const VIEW = 5.7;
const CAM_RADIUS = 12.7;
const CAM_HEIGHT = 8.2;
const SWEEP_SECONDS = 0.7;
const SETTLE_MS = 1500;
const BASE_MARGIN = 1.6;
const heightOf = (size) => (size / MAX_SCALE) * TOWER;

function readToken(name) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

export function createScene(stage, { spots = [0], names = [], width = WIDTH, margin = BASE_MARGIN } = {}) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = { sys: readToken('--color-ink'), tools: readToken('--signal-blue'), hist: readToken('--signal-yellow'), fresh: readToken('--signal-red'), out: readToken('--signal-red') };
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.prepend(renderer.domElement);

  const scene = new Scene();
  const camera = new OrthographicCamera(-VIEW, VIEW, VIEW, -VIEW, 0.1, 100);
  let yaw = Math.PI / 4;
  const lookY = TOWER / 2 - 0.3;
  const placeCamera = () => {
    camera.position.set(Math.sin(yaw) * CAM_RADIUS, CAM_HEIGHT, Math.cos(yaw) * CAM_RADIUS);
    camera.lookAt(0, lookY, 0);
    camera.updateMatrixWorld();
  };
  placeCamera();

  scene.add(new AmbientLight(0xffffff, 1.9));
  const sun = new DirectionalLight(0xffffff, 1.9);
  sun.position.set(3, 9, 6);
  scene.add(sun);

  // Башни стоят поперёк взгляда стартовой камеры
  const towers = spots.map((spot) => ({ x: spot * Math.SQRT1_2, z: -spot * Math.SQRT1_2 }));
  const baseGeometry = new BoxGeometry(width + margin, 0.12, width + margin);
  const baseMaterial = new MeshBasicMaterial({ color: colors.sys });
  towers.forEach(({ x, z }) => {
    const base = new Mesh(baseGeometry, baseMaterial);
    base.position.set(x, -0.08, z);
    scene.add(base);
  });

  const unit = new BoxGeometry(1, 1, 1);
  const edges = new EdgesGeometry(unit);
  const edgeMaterial = new LineBasicMaterial({ color: colors.sys });

  const levels = [[COMPACT_WARN, '200K', ': пора /compact'], [FRESH_SESSION_WARN, '250K', ': лучше новая сессия']].map(([size, mark, hint]) => {
    const y = heightOf(size);
    const frame = new EdgesGeometry(new BoxGeometry(width + margin * 0.625, 0.001, width + margin * 0.625));
    towers.forEach((tower) => {
      const line = new LineSegments(frame, edgeMaterial);
      line.position.set(tower.x, y, tower.z);
      scene.add(line);
    });
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = mark;
    const detail = document.createElement('span');
    detail.textContent = hint;
    tag.append(detail);
    stage.append(tag);
    return { y, tag };
  });

  const nameTags = names.map((name) => {
    const tag = document.createElement('div');
    tag.className = 'tag tower-tag';
    tag.textContent = name;
    stage.append(tag);
    return tag;
  });

  const slabs = new Map();
  const point = new Vector3();
  let fresh = new Set();
  let sweep = 9;
  let top = 0;
  let aliveUntil = 0;
  let running = false;
  const clock = new Clock();

  function slabFor(layer) {
    let slab = slabs.get(layer.id);
    if (slab) return slab;
    slab = new Mesh(unit, new MeshLambertMaterial({ color: colors[layer.kind].clone() }));
    slab.add(new LineSegments(edges, edgeMaterial));
    const tower = towers[layer.spot ?? 0];
    slab.position.set(tower.x, 0, tower.z);
    slab.scale.set(width, 0.001, width);
    slab.userData = { y: 0, height: 0, bottom: 0, kind: layer.kind, gone: false };
    scene.add(slab);
    slabs.set(layer.id, slab);
    return slab;
  }

  function placeTags() {
    const { width: stageWidth, height } = stage.getBoundingClientRect();
    levels.forEach(({ y, tag }) => {
      point.set(0, y, 0).project(camera);
      tag.style.top = `${((1 - point.y) / 2) * height}px`;
    });
    nameTags.forEach((tag, i) => {
      point.set(towers[i].x, 0, towers[i].z).project(camera);
      tag.style.left = `${((1 + point.x) / 2) * stageWidth}px`;
      tag.style.top = `${((1 - point.y) / 2) * height}px`;
    });
  }

  function fit() {
    const { width, height } = stage.getBoundingClientRect();
    const aspect = width / height;
    camera.left = -VIEW * aspect;
    camera.right = VIEW * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    placeTags();
    wake();
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const ease = calm ? 1 : 1 - Math.pow(0.0005, dt);
    sweep += dt / SWEEP_SECONDS;
    const sweepY = sweep * top;
    for (const [id, slab] of slabs) {
      const u = slab.userData;
      slab.scale.y += (Math.max(u.height, 0.0001) - slab.scale.y) * ease;
      slab.position.y += (u.y - slab.position.y) * ease;
      // Волна снизу вверх: модель перечитывает весь контекст на каждом ходу
      const isRead = !calm && sweep < 1.25 && Math.abs(u.bottom - sweepY) < 0.35;
      slab.material.color.lerp(fresh.has(id) ? colors.fresh : colors[u.kind], ease);
      slab.material.emissive.setScalar(isRead ? 0.28 : 0);
      if (u.gone && slab.scale.y < 0.002) {
        scene.remove(slab);
        slab.material.dispose();
        slabs.delete(id);
      }
    }
    renderer.render(scene, camera);
    if (performance.now() < aliveUntil) requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    aliveUntil = performance.now() + SETTLE_MS;
    if (!running) {
      running = true;
      clock.getDelta();
      requestAnimationFrame(frame);
    }
  }

  let dragX = null;
  stage.addEventListener('pointerdown', (e) => { dragX = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    yaw -= (e.clientX - dragX) * 0.008;
    dragX = e.clientX;
    placeCamera();
    placeTags();
    wake();
  });
  const endDrag = () => { dragX = null; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  new ResizeObserver(fit).observe(stage);
  fit();

  return {
    show(layers, freshIds) {
      const heights = towers.map(() => 0);
      const keep = new Set();
      layers.forEach((layer) => {
        const slab = slabFor(layer);
        const height = heightOf(layer.size);
        const spot = layer.spot ?? 0;
        const y = heights[spot];
        Object.assign(slab.userData, { y: y + height / 2, height, bottom: y, gone: false });
        heights[spot] = y + height;
        keep.add(layer.id);
      });
      for (const [id, slab] of slabs) {
        if (!keep.has(id)) Object.assign(slab.userData, { height: 0, gone: true });
      }
      const y = Math.max(...heights);
      fresh = freshIds;
      top = y;
      sweep = 0;
      stage.dataset.slabs = String(keep.size);
      stage.dataset.top = String(Math.round((y / TOWER) * MAX_SCALE));
      wake();
    },
  };
}
