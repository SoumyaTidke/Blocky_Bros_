// Bottle Bandit ki phenki hui bottle, aur Vulture ka girta hua patthar.
// Numbers PROPOSED hain (physics spec se, ek badlav ke saath).
export const BOTTLE = {
  size: 8,            // bottle/patthar ka dabba (pixels)
  maxSpeed: 150,      // aage ki speed ki seema (pixels per second), spec se
  minSpeed: 40,       // bahut paas ke cowboy par bhi bottle thodi aage jaye
  throwVy: -200,      // phenkte waqt upar ki speed. Spec mein -80 tha, jisse bottle sirf ~3.5 tile jati thi.
  gravity: 700,       // spec se
  flightTime: 0.65,   // bottle lagbhag itni der hawa mein rehti hai, isse nishana tay hota hai
  life: 4             // itni der baad gayab (seconds), spec se
};

// Nayi bottle. dir: 1 = right, -1 = left. distance: cowboy kitne pixel door hai.
// Bottle wahan girne ke liye phenki jati hai jahan cowboy abhi khada hai.
export function createBottle(x, y, dir, distance) {
  const aimedSpeed = distance / BOTTLE.flightTime;
  const speed = Math.min(BOTTLE.maxSpeed, Math.max(BOTTLE.minSpeed, aimedSpeed));
  return {
    kind: "bottle",
    x: x,
    y: y,
    width: BOTTLE.size,
    height: BOTTLE.size,
    vx: dir * speed,
    vy: BOTTLE.throwVy,
    age: 0,
    angle: 0,
    state: "flying",   // "flying" ya "gone"
    broke: false       // true = kisi cheez se takrakar tooti
  };
}

// Vulture ka patthar: seedha neeche girta hai (aage ki speed 0)
export function createRock(x, y) {
  return {
    kind: "rock",
    x: x,
    y: y,
    width: BOTTLE.size,
    height: BOTTLE.size,
    vx: 0,
    vy: 0,
    age: 0,
    angle: 0,
    state: "flying",
    broke: false
  };
}

// Bottle ya patthar ka ek physics step
export function updateBottle(bottle, dt, level) {
  if (bottle.state === "gone") {
    return;
  }

  bottle.age += dt;
  if (bottle.age >= BOTTLE.life) {
    bottle.state = "gone";
    return;
  }

  bottle.vy += BOTTLE.gravity * dt;
  bottle.x += bottle.vx * dt;
  bottle.y += bottle.vy * dt;
  bottle.angle += (bottle.vx >= 0 ? 12 : -12) * dt;

  const T = level.tileSize;

  // Level se bahar gaya
  if (bottle.x < 0 || bottle.x + bottle.width > level.width * T || bottle.y > level.height * T) {
    bottle.state = "gone";
    return;
  }

  // Deewar, zameen ya crate se takraya
  const top = Math.floor(bottle.y / T);
  const bottom = Math.floor((bottle.y + bottle.height - 0.001) / T);
  const left = Math.floor(bottle.x / T);
  const right = Math.floor((bottle.x + bottle.width - 0.001) / T);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        bottle.state = "gone";
        bottle.broke = true;
        return;
      }
    }
  }
}