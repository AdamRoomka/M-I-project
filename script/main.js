let running = false;
let genPromise = null;
let camX = 0,
  camY = 0;

function updateStats() {
  let blocks = 0;
  for (const ch of world.chunks.values())
    for (const c of Object.values(ch.cols))
      blocks += c.filter((b) => b !== B.AIR).length;
  document.getElementById("s-chunks").textContent = world.chunks.size;
  document.getElementById("s-blocks").textContent = blocks.toLocaleString("pl");
  document.getElementById("s-seed").textContent =
    typeof world.seed === "string"
      ? world.seed.slice(0, 6)
      : (world.seed?.toFixed(3) ?? "-");
}

function setProgress(p, label) {
  document.getElementById("progress-fill").style.width =
    (p * 100).toFixed(1) + "%";
  document.getElementById("prog-pct").textContent = Math.round(p * 100) + "%";
  document.getElementById("prog-text").textContent = label;
}

function setBtns(state) {
  document.getElementById("btn-start").disabled = state === "running";
  document.getElementById("btn-stop").disabled = state === "idle";
  document.getElementById("btn-regen").disabled = state === "running";
  document.getElementById("btn-reset").disabled = state === "running";
}

//  AKCJE PRZYCISKÓW
async function doStart() {
  running = true;
  setBtns("running");
  setProgress(0, "Inicjalizacja…");

  const rawSeed = document.getElementById("seed-input").value.trim();
  const useRandom = document.getElementById("random-seed").checked;
  const seed =
    useRandom || !rawSeed
      ? Math.random()
      : isNaN(rawSeed)
        ? rawSeed
        : parseFloat(rawSeed);

  document.getElementById("seed-input").value =
    typeof seed === "string" ? seed : seed.toFixed(6);
  worldInit(seed);
  updateStats();

  await loadRegion((p, done, total) => {
    setProgress(p, `Chunk ${done}/${total}`);
    updateStats();
  });

  renderWorld();
  setProgress(1, "Gotowy ✓");
  setBtns("idle");
  running = false;
}

function doStop() {
  running = false;
  setProgress(0, "Zatrzymano");
  setBtns("idle");
}

function doReset() {
  running = false;
  world.chunks.clear();
  worldInit(world.seed ?? Math.random());
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setProgress(0, "Zresetowano");
  updateStats();
  setBtns("idle");
}

function doClear() {
  running = false;
  world.chunks.clear();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#0d1117");
  sky.addColorStop(1, "#161b22");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setProgress(0, "Wyczyszczono");
  updateStats();
  setBtns("idle");
}

document.getElementById("btn-start").addEventListener("click", doStart);
document.getElementById("btn-stop").addEventListener("click", doStop);
document.getElementById("btn-reset").addEventListener("click", doReset);
document.getElementById("btn-clear").addEventListener("click", doClear);
document.getElementById("btn-regen").addEventListener("click", () => {
  document.getElementById("random-seed").checked = true;
  doStart();
});

//  SUWAKI – live binding
function bindSlider(id, valId, cfgKey, parse, fmt) {
  const el = document.getElementById(id);
  const out = document.getElementById(valId);
  el.addEventListener("input", () => {
    const v = parse(el.value);
    CFG[cfgKey] = v;
    out.textContent = fmt ? fmt(v) : v;
    renderWorld();
  });
}

bindSlider("sl-chunk", "val-chunk", "chunkSize", parseInt, null);
bindSlider("sl-radius", "val-radius", "viewRadius", parseInt, null);
bindSlider("sl-height", "val-height", "maxHeight", parseInt, null);
bindSlider("sl-nscale", "val-scale", "noiseScale", parseFloat, (v) =>
  v.toFixed(3),
);
bindSlider("sl-oct", "val-oct", "octaves", parseInt, null);
bindSlider("sl-sea", "val-sea", "seaLevel", parseInt, null);
bindSlider("sl-trees", "val-trees", "treeThresh", parseFloat, (v) => ~~v);
bindSlider("sl-bscale", "val-bscale", "biomeScale", parseFloat, (v) =>
  v.toFixed(2),
);
bindSlider("sl-vs", "val-vs", "voxelSize", parseInt, null);
bindSlider(
  "sl-rot",
  "val-rot",
  "rotY",
  (v) => (parseFloat(v) * Math.PI) / 180,
  (v) => ~~((v * 180) / Math.PI),
);
bindSlider("sl-zoom", "val-zoom", "zoom", parseFloat, (v) => v.toFixed(2));

// Biom mode select
document.getElementById("biome-mode").addEventListener("change", (e) => {
  CFG.biomeMode = e.target.value;
});

// Toggles
[
  ["tog-water", "water"],
  ["tog-trees", "trees"],
  ["tog-bedrock", "bedrock"],
  ["tog-anim", "animLoad"],
  ["tog-cull", "culling"],
].forEach(([id, key]) => {
  document.getElementById(id).addEventListener("change", (e) => {
    CFG[key] = e.target.checked;
    renderWorld();
  });
});

// Color pickers
Object.keys(CFG.colors).forEach((key) => {
  document.getElementById("c-" + key)?.addEventListener("input", (e) => {
    CFG.colors[key] = e.target.value;
    renderWorld();
  });
});

//  STEROWANIE MYSZĄ
let drag = false,
  lastMX = 0,
  lastMY = 0;
canvas.addEventListener("mousedown", (e) => {
  drag = true;
  lastMX = e.clientX;
  lastMY = e.clientY;
});
window.addEventListener("mouseup", () => {
  drag = false;
});
window.addEventListener("mousemove", (e) => {
  if (!drag) return;
  CFG.rotY += (e.clientX - lastMX) * 0.008;
  camY += (e.clientY - lastMY) * 0.5;
  lastMX = e.clientX;
  lastMY = e.clientY;
  // Sync slider rotacji
  document.getElementById("sl-rot").value =
    ((CFG.rotY * 180) / Math.PI + 3600) % 360;
  document.getElementById("val-rot").textContent = ~~(
    ((CFG.rotY * 180) / Math.PI + 3600) %
    360
  );
  renderWorld();
});
canvas.addEventListener("wheel", (e) => {
  CFG.zoom *= e.deltaY > 0 ? 0.93 : 1.07;
  CFG.zoom = Math.max(0.1, Math.min(5, CFG.zoom));
  document.getElementById("sl-zoom").value = CFG.zoom.toFixed(2);
  document.getElementById("val-zoom").textContent = CFG.zoom.toFixed(2);
  renderWorld();
});

//  FPS
let fpsCnt = 0,
  fpsT = performance.now();
function fpsLoop() {
  fpsCnt++;
  const now = performance.now();
  if (now - fpsT >= 1000) {
    document.getElementById("s-fps").textContent = fpsCnt;
    fpsCnt = 0;
    fpsT = now;
  }
  requestAnimationFrame(fpsLoop);
}
fpsLoop();

window.addEventListener("resize", () => {
  resizeCanvas();
  renderWorld();
});

doStart();
