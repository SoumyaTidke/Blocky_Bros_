// Vulture ke numbers (PROPOSED)
export const VULTURE = {
  width: 16,
  height: 12,
  speed: 20,          // hawa mein idhar-udhar udne ki speed (pixels per second)
  points: 200,
  range: 130,         // cowboy itne pixel ke andar ho tabhi jhapatta maarta hai
  interval: 2.5,      // do jhapatton ke beech ka time (seconds)
  windup: 0.5,        // jhapatte se itni der pehle ruk kar pankh uthata hai (telegraph)
  diveSpeed: 150,     // jhapatte ki speed (pixels per second)
  riseSpeed: 60,      // jhapatte ke baad wapas oopar jaane ki speed
  patrolHalf: 32      // apni jagah se kitna door tak udta hai (pixels)
};

// Kya ye dabba kisi solid tile ko chhoo raha hai?
function touchesSolid(v, level) {
  const T = level.tileSize;
  const top = Math.floor(v.y / T);
  const bottom = Math.floor((v.y + v.height - 0.001) / T);
  const left = Math.floor(v.x / T);
  const right = Math.floor((v.x + v.width - 0.001) / T);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        return true;
      }
    }
  }
  return false;
}

// Vulture ka ek step. Halatein (phase): "hover" -> "windup" -> "dive" -> "rise" -> "hover"
export function updateVulture(v, dt, target, level) {
  // Pehli baar: apni oonchai yaad rakho
  if (v.homeY === undefined) {
    v.homeY = v.y;
    v.phase = "hover";
    v.diveTimer = VULTURE.interval;
    v.diveX = 0;
    v.diveY = 0;
    v.flap = 0;
    v.facing = -1;
  }

  v.flap += dt;
  const cx = v.x + v.width / 2;

  // ---- Hover aur telegraph ----
  if (v.phase === "hover" || v.phase === "windup") {
    let inRange = false;
    if (target) {
      const dx = target.x + target.width / 2 - cx;
      inRange = Math.abs(dx) <= VULTURE.range;
      if (inRange) {
        v.facing = dx >= 0 ? 1 : -1;
      }
    }

    if (v.phase === "hover") {
      if (cx > v.homeX + VULTURE.patrolHalf) {
        v.direction = -1;
      } else if (cx < v.homeX - VULTURE.patrolHalf) {
        v.direction = 1;
      }
      v.x += v.direction * VULTURE.speed * dt;
      v.y = v.homeY;

      if (inRange) {
        v.diveTimer -= dt;
        if (v.diveTimer <= VULTURE.windup) {
          v.phase = "windup";
        }
      } else {
        // Cowboy door hai: timer wapas poora, taaki paas aane par turant jhapatta na aaye
        v.diveTimer = VULTURE.interval;
        v.facing = v.direction;
      }
    } else {
      // Telegraph: ruka hua, pankh upar
      v.diveTimer -= dt;
      if (v.diveTimer <= 0) {
        if (target) {
          v.diveX = target.x + target.width / 2 - v.width / 2;
          v.diveY = target.y + target.height / 2 - v.height / 2;
          v.phase = "dive";
        } else {
          v.phase = "hover";
          v.diveTimer = VULTURE.interval;
        }
      }
    }
    return;
  }

  // ---- Jhapatta: manzil ki taraf seedha ----
  if (v.phase === "dive") {
    const dx = v.diveX - v.x;
    const dy = v.diveY - v.y;
    const dist = Math.hypot(dx, dy);
    const step = VULTURE.diveSpeed * dt;
    if (dist <= step) {
      v.x = v.diveX;
      v.y = v.diveY;
      v.phase = "rise";
    } else {
      const prevX = v.x;
      const prevY = v.y;
      v.x += (dx / dist) * step;
      v.y += (dy / dist) * step;
      if (touchesSolid(v, level)) {
        v.x = prevX;
        v.y = prevY;
        v.phase = "rise";
      }
    }
    return;
  }

  // ---- Wapas apni oonchai par ----
  const homeLeft = v.homeX - v.width / 2;
  const dx = homeLeft - v.x;
  const dy = v.homeY - v.y;
  const dist = Math.hypot(dx, dy);
  const step = VULTURE.riseSpeed * dt;
  if (dist <= step) {
    v.x = homeLeft;
    v.y = v.homeY;
    v.phase = "hover";
    v.diveTimer = VULTURE.interval;
  } else {
    v.x += (dx / dist) * step;
    v.y += (dy / dist) * step;
  }
}