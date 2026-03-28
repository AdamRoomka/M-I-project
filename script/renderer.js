//  Plik zgenerowany za pomocą SI nie licząc w połowa drawVoxel i renderWorld
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const wrap = document.getElementById("canvas-wrap");

function resizeCanvas() {
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}
resizeCanvas();

function iso(x, y, z) {
  const ox = wrap.clientWidth / 2 + camX;
  const oy = wrap.clientHeight / 3 + camY;
  const cosR = Math.cos(CFG.rotY),
    sinR = Math.sin(CFG.rotY);
  const rx = x * cosR - z * sinR;
  const rz = x * sinR + z * cosR;
  const VS = CFG.voxelSize * CFG.zoom;
  return {
    sx: rx * VS + ox,
    sy: -y * VS * 0.6 + rz * VS * 0.5 + oy,
  };
}

function drawVoxel(x, y, z, type) {
  const key = [
    null,
    "grass",
    "dirt",
    "stone",
    "sand",
    "water",
    "snow",
    "bedrock",
    "wood",
    "leaves",
  ][type];

  if (!key) return;

  const alpha = type === B.WATER ? 0.6 : 1;
  const colors = blockColors(key, alpha);

  // Punkty siatki
  const pT = iso(x, y + 1, z);
  const pRT = iso(x + 1, y + 1, z);
  const pFT = iso(x, y + 1, z + 1);
  const pRFT = iso(x + 1, y + 1, z + 1);

  const pB = iso(x, y, z);
  const pRB = iso(x + 1, y, z);
  const pFB = iso(x, y, z + 1);
  const pRFB = iso(x + 1, y, z + 1);

  const drawSide = (pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  };

  const cosR = Math.cos(CFG.rotY);
  const sinR = Math.sin(CFG.rotY);


  if (sinR > 0) {
    drawSide([pRT, pRFT, pRFB, pRB], colors[2]); // prawa
  } else {
    drawSide([pT, pFT, pFB, pB], colors[2]); // lewa
  }

  if (cosR > 0) {
    drawSide([pFT, pRFT, pRFB, pFB], colors[1]); // przod
  } else {
    drawSide([pT, pRT, pRB, pB], colors[1]); // tyl
  }

  // gora
  drawSide([pT, pRT, pRFT, pFT], colors[0]);
}

function renderWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Tlo 
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#0d1117");
  sky.addColorStop(1, "#161b22");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const voxels = [];

  // 2. Zbieranie bloków - pełne kolumny od 0 do topY
  for (const ch of world.chunks.values()) {
    const ox = ch.cx * CFG.chunkSize;
    const oz = ch.cz * CFG.chunkSize;

    for (let lx = 0; lx < CFG.chunkSize; lx++) {
      for (let lz = 0; lz < CFG.chunkSize; lz++) {
        const col = ch.cols[`${lx},${lz}`];

        // Szukamy najwyższego bloku w kolumnie
        let topY = -1;
        for (let y = col.length - 1; y >= 0; y--) {
          if (col[y] !== B.AIR) {
            topY = y;
            break;
          }
        }

        // Jeśli znaleźliśmy blok, rysujemy całą kolumnę od poziomu 0
        if (topY !== -1) {
          for (let y = 0; y <= topY; y++) {
            if (col[y] === B.AIR) continue;

            voxels.push({
              x: ox + lx,
              y: y,
              z: oz + lz,
              t: col[y],
            });
          }
        }
      }
    }
  }

  // 3. sortowanie glab i wysokosc
  const cosR = Math.cos(CFG.rotY);
  const sinR = Math.sin(CFG.rotY);

  voxels.sort((a, b) => {
    const depthA = a.x * sinR + a.z * cosR;
    const depthB = b.x * sinR + b.z * cosR;

    // rysujemy spoczatku glebiej a potem wysokosc
    if (Math.abs(depthA - depthB) < 0.001) {
      return a.y - b.y;
    }
    return depthA - depthB;
  });

  // 4. Rysowanie
  for (const v of voxels) {
    drawVoxel(v.x, v.y, v.z, v.t);
  }
}
