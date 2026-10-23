import { BULLET } from "./config.js";

// Nayi goli. dir: 1 = right, -1 = left
export function createBullet(x, y, dir) {
  return {
    x: x,
    y: y,
    width: BULLET.width,
    height: BULLET.height,
    vx: dir * BULLET.speed,
    dir: dir,
    age: 0,
    state: "flying"   // "flying" ya "gone"
  };
}

// Goli ka ek physics step
export function updateBullet(bullet, dt, level) {
  if (bullet.state === "gone") {
    return;
  }

  // Zindagi khatam
  bullet.age += dt;
  if (bullet.age >= BULLET.lifetime) {
    bullet.state = "gone";
    return;
  }

  bullet.x += bullet.vx * dt;

  const T = level.tileSize;

  // Level se bahar gayi
  if (bullet.x < 0 || bullet.x + bullet.width > level.width * T) {
    bullet.state = "gone";
    return;
  }

  // Deewar, zameen ya crate se takrayi
  const top = Math.floor(bullet.y / T);
  const bottom = Math.floor((bullet.y + bullet.height - 0.001) / T);
  const left = Math.floor(bullet.x / T);
  const right = Math.floor((bullet.x + bullet.width - 0.001) / T);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        bullet.state = "gone";
        return;
      }
    }
  }
}