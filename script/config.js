// Plik zgenerowany za pomocą SI
const CFG = {
  chunkSize: 12,
  viewRadius: 2,
  maxHeight: 16,
  noiseScale: 0.05,
  octaves: 5,
  seaLevel: 6,
  treeThresh: 40,
  biomeMode: "auto",
  biomeScale: 0.3,
  water: true,
  trees: true,
  bedrock: true,
  voxelSize: 32,
  rotY: Math.PI / 5,
  zoom: 0.5,
  animLoad: true,
  culling: true,
  colors: {
    grass: "#4caf50",
    dirt: "#8d6e63",
    stone: "#9e9e9e",
    sand: "#fff176",
    water: "#29b6f6",
    snow: "#ffffff",
    wood: "#795548",
    leaves: "#2e7d32",
  },
};

const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  SNOW: 6,
  BEDROCK: 7,
  WOOD: 8,
  LEAVES: 9,
};

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) * f));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) * f));
  const b = Math.max(0, Math.min(255, (n & 0xff) * f));
  return `rgb(${~~r},${~~g},${~~b})`;
}

function blockColors(key, alpha = 1) {
  const c = CFG.colors[key] || "#888";
  const a =
    alpha < 1
      ? Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0")
      : "";
  return [c + a, shade(c, 0.75) + a, shade(c, 0.55) + a];
}
