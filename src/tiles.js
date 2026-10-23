import { CONFIG } from "./config.js";
import { level } from "./level.js";

const T = CONFIG.tileSize;

// Rang (PROPOSED): hamare palette ke gehre/halke versions
const C = {
  outline: CONFIG.colors.outline,
  dirt: CONFIG.colors.dirt,
  dirtDark: "#6F4521",
  dirtLight: "#A06A38",
  grass: CONFIG.colors.grass,
  grassLight: "#7DBE6B",
  grassDark: "#4A8040"
};

// Har tile ke liye ek pakka (random jaisa) number. Tile ki jagah se banta hai,
// isliye frame badalne par dane/ghaas hilte nahi.
function hash(col, row, k) {
  let h = Math.imul(col, 374761393) + Math.imul(row, 668265263) + Math.imul(k, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

// Zameen / platform ka ek tile. Outline sirf us taraf jo khuli hai (hawa ya gaddhe ki taraf).
export function drawGroundTile(ctx, col, row) {
  const px = col * T;
  const py = row * T;

  const upOpen = !level.isSolid(col, row - 1);
  const downOpen = row < level.height - 1 && !level.isSolid(col, row + 1);
  const leftOpen = !level.isSolid(col - 1, row);
  const rightOpen = !level.isSolid(col + 1, row);

  // Mitti
  ctx.fillStyle = C.dirt;
  ctx.fillRect(px, py, T, T);

  // Platform ke neeche ka hissa thoda gehra (saaya)
  if (downOpen) {
    ctx.fillStyle = C.dirtDark;
    ctx.fillRect(px, py + T - 4, T, 3);
  }

  // Mitti ke chhote dane: 4 per tile, kuch gehre kuch halke
  for (let k = 0; k < 4; k++) {
    const h = hash(col, row, k);
    const x = 2 + (h % 11);
    const y = 6 + ((h >>> 8) % 6);
    ctx.fillStyle = (h >>> 16) % 2 === 0 ? C.dirtDark : C.dirtLight;
    ctx.fillRect(px + x, py + y, 2, (h >>> 20) % 2 === 0 ? 1 : 2);
  }

  // Upar khuli ho to ghaas ki topi
  if (upOpen) {
    ctx.fillStyle = C.grass;
    ctx.fillRect(px, py + 1, T, 4);
    ctx.fillStyle = C.grassLight;
    ctx.fillRect(px, py + 1, T, 1);

    // Neeche latakti ghaas ki jhalar (2 pixel chaudi, 1 se 3 pixel lambi)
    for (let x = 0; x < T; x += 2) {
      const len = 1 + (hash(col, row, 20 + x) % 3);
      ctx.fillStyle = C.grass;
      ctx.fillRect(px + x, py + 5, 2, len);
      ctx.fillStyle = C.grassDark;
      ctx.fillRect(px + x, py + 4 + len, 2, 1);
    }
  }

  // Patla kaala outline, sirf khuli taraf
  ctx.fillStyle = C.outline;
  if (upOpen) {
    ctx.fillRect(px, py, T, 1);
  }
  if (downOpen) {
    ctx.fillRect(px, py + T - 1, T, 1);
  }
  if (leftOpen) {
    ctx.fillRect(px, py, 1, T);
  }
  if (rightOpen) {
    ctx.fillRect(px + T - 1, py, 1, T);
  }
}