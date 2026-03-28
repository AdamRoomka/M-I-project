class Generator {
  constructor(seed) {
    const n =
      typeof seed === "string"
        ? [...seed].reduce(
            (a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0,
            0,
          ) / 2147483647
        : seed;
    this.tn = new PerlinNoise(n);
    this.bn = new PerlinNoise(n * 3.14159);
  }
  biome(nx, nz) {
    if (CFG.biomeMode !== "auto") return CFG.biomeMode;
    const b = this.bn.fbm(nx * CFG.biomeScale, nz * CFG.biomeScale, 2);
    if (b > 0.3) return "snow";
    if (b > 0.1) return "mountain";
    if (b < -0.3) return "desert";
    return "plains";
  }
  column(wx, wz) {
    const nx = wx * CFG.noiseScale,
      nz = wz * CFG.noiseScale;
    const bio = this.biome(nx, nz);
    const mult =
      { mountain: 1.8, desert: 0.6, snow: 1.3, plains: 1.0 }[bio] ?? 1.0;
    const raw = this.tn.fbm(nx, nz, CFG.octaves);

    const h = Math.max(
      1,
      Math.min(
        CFG.maxHeight - 6, // Rezerwujemy miejsce na korony drzew
        Math.floor((raw * 0.5 + 0.5) * CFG.maxHeight * 0.6 * mult) + 3,
      ),
    );

    const col = new Array(CFG.maxHeight).fill(B.AIR);

    // Generowanie warstw ziemi/kamienia
    for (let y = 0; y < h; y++) {
      if (y === 0) col[y] = CFG.bedrock ? B.BEDROCK : B.STONE;
      else if (y < h - 4) col[y] = B.STONE;
      else if (y < h - 1) col[y] = bio === "desert" ? B.SAND : B.DIRT;
      else {
        if (bio === "snow" && h > 18) col[y] = B.SNOW;
        else if (bio === "desert") col[y] = B.SAND;
        else if (h <= CFG.seaLevel + 1) col[y] = B.SAND;
        else col[y] = B.GRASS;
      }
    }

    // Woda (Sea Level)
    if (CFG.water) {
      for (let y = h; y < CFG.seaLevel; y++) col[y] = B.WATER;
    }

    return col;
  }
  chunk(cx, cz) {
    const chunkSize = CFG.chunkSize;
    const cols = {};

    // najpierw generujemy podstawowy teren
    for (let lx = 0; lx < chunkSize; lx++) {
      for (let lz = 0; lz < chunkSize; lz++) {
        cols[`${lx},${lz}`] = this.column(
          cx * chunkSize + lx,
          cz * chunkSize + lz,
        );
      }
    }

    // teraz "sadzimy" drzewa na tym terenie
    if (CFG.trees) {
      for (let lx = 0; lx < chunkSize; lx++) {
        for (let lz = 0; lz < chunkSize; lz++) {
          const wx = cx * chunkSize + lx;
          const wz = cz * chunkSize + lz;
          const col = cols[`${lx},${lz}`];

          // szukamy wysokości trawy
          let h = 0;
          while (h < CFG.maxHeight && col[h] !== B.AIR && col[h] !== B.WATER)
            h++;

          // Sadzimy drzewo tylko na trawie powyżej poziomu morza
          if (col[h - 1] === B.GRASS && h > CFG.seaLevel + 1) {
            const treeNoise = this.tn.noise(wx * 0.8, wz * 0.8);
            if (treeNoise > 1 - CFG.treeThresh / 100) {
              const treeH = 4 + Math.floor(Math.random() * 3); // Wysokość pnia 4-6 bloków

              // 1. Pień
              for (let y = 0; y < treeH; y++) {
                if (h + y < CFG.maxHeight) cols[`${lx},${lz}`][h + y] = B.WOOD;
              }

              // 2. Korona liści (prosta struktura 3x3x2 na czubku)
              for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                  for (let dy = treeH - 3; dy <= treeH; dy++) {
                    const targetX = lx + dx;
                    const targetZ = lz + dz;

                    // Sprawdzamy czy liście mieszczą się w tym samym chunku
                    if (
                      targetX >= 0 &&
                      targetX < chunkSize &&
                      targetZ >= 0 &&
                      targetZ < chunkSize
                    ) {
                      const currentBlock =
                        cols[`${targetX},${targetZ}`][h + dy];
                      // Nie zastępujemy pnia liśćmi
                      if (currentBlock === B.AIR) {
                        // Zaokrąglamy rogi korony (odległość manhattan)
                        if (
                          Math.abs(dx) +
                            Math.abs(dz) +
                            Math.abs(dy - (treeH - 1)) <
                          4
                        ) {
                          cols[`${targetX},${targetZ}`][h + dy] = B.LEAVES;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return { cx, cz, cols };
  }
}

// ============================================================
//  ŚWIAT
// ============================================================
const world = { chunks: new Map(), gen: null, seed: null };

function worldKey(cx, cz) {
  return `${cx},${cz}`;
}

function worldInit(seed) {
  world.seed = seed;
  world.gen = new Generator(seed);
  world.chunks.clear();
}

async function loadRegion(onProgress) {
  const R = CFG.viewRadius;
  const toLoad = [];
  for (let dx = -R; dx <= R; dx++)
    for (let dz = -R; dz <= R; dz++)
      if (!world.chunks.has(worldKey(dx, dz))) toLoad.push([dx, dz]);
  toLoad.sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2));

  for (let i = 0; i < toLoad.length; i++) {
    if (!running) break;
    const [cx, cz] = toLoad[i];
    world.chunks.set(worldKey(cx, cz), world.gen.chunk(cx, cz));
    onProgress((i + 1) / toLoad.length, i + 1, toLoad.length);
    if (CFG.animLoad && i % 3 === 0) {
      renderWorld();
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}
