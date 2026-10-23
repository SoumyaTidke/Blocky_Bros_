import { ITEM, CHILI } from "./config.js";

// Growth item (laal cactus fruit). col/row us crate ka tile hai jisse wo nikalta hai.
export function createGrowthItem(col, row, tileSize) {
  const d = ITEM.growth;
  const startY = row * tileSize + 2;   // crate ke andar se shuru
  return {
    type: "growth",
    x: col * tileSize + (tileSize - d.width) / 2,
    y: startY,
    startY: startY,
    width: d.width,
    height: d.height,
    vx: d.speed,
    vy: 0,
    state: "emerging",   // "emerging", "moving" ya "gone"
    timer: 0
  };
}

// Chili pepper (Sharpshooter power-up): crate ke upar khada rehta hai, chalta nahi.
export function createChiliItem(col, row, tileSize) {
  const startY = row * tileSize + 2;
  return {
    type: "chili",
    x: col * tileSize + (tileSize - CHILI.width) / 2,
    y: startY,
    startY: startY,
    width: CHILI.width,
    height: CHILI.height,
    vx: 0,
    vy: 0,
    state: "emerging",   // "emerging", "waiting" ya "gone"
    timer: 0
  };
}

// Chili ka ek step: upar uthta hai, phir wahin ruka rehta hai
function updateChili(item, dt) {
  if (item.state === "emerging") {
    item.timer += dt;
    const progress = Math.min(1, item.timer / CHILI.riseTime);
    item.y = item.startY - CHILI.riseDistance * progress;
    if (progress >= 1) {
      item.state = "waiting";
    }
  }
}

// Item ka ek physics step
export function updateItem(item, dt, level) {
  const d = ITEM.growth;

  if (item.state === "gone") {
    return;
  }

  if (item.type === "chili") {
    updateChili(item, dt);
    return;
  }

  // Crate se upar uthna
  if (item.state === "emerging") {
    item.timer += dt;
    const progress = Math.min(1, item.timer / d.riseTime);
    item.y = item.startY - d.riseDistance * progress;
    if (progress >= 1) {
      item.state = "moving";
    }
    return;
  }

  const T = level.tileSize;

  // ---- Left-right: chalo, deewar mile to palat jao ----
  item.x += item.vx * dt;

  const top = Math.floor(item.y / T);
  const bottom = Math.floor((item.y + item.height - 0.001) / T);
  const left = Math.floor(item.x / T);
  const right = Math.floor((item.x + item.width - 0.001) / T);

  let hitWall = false;
  for (let row = top; row <= bottom && !hitWall; row++) {
    for (let col = left; col <= right && !hitWall; col++) {
      if (level.isSolid(col, row)) {
        if (item.vx > 0) {
          item.x = col * T - item.width;
        } else {
          item.x = (col + 1) * T;
        }
        item.vx = -item.vx;
        hitWall = true;
      }
    }
  }

  // ---- Upar-neeche: gravity, zameen par utro ----
  item.vy += d.gravity * dt;
  if (item.vy > d.maxFallSpeed) {
    item.vy = d.maxFallSpeed;
  }
  item.y += item.vy * dt;

  const colLeft = Math.floor(item.x / T);
  const colRight = Math.floor((item.x + item.width - 0.001) / T);
  const rowBelow = Math.floor((item.y + item.height) / T);

  for (let col = colLeft; col <= colRight; col++) {
    if (level.isSolid(col, rowBelow)) {
      item.y = rowBelow * T - item.height;
      item.vy = 0;
      break;
    }
  }

  // Gaddhe mein gir gaya to hata do
  if (item.y > level.height * T) {
    item.state = "gone";
  }
}