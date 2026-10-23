import { ENEMY } from "./config.js";
import { sound } from "./sound.js";
import { VULTURE, updateVulture } from "./vulture.js";

// Red Bandit ke numbers (PROPOSED, physics spec se). Baad mein config.js mein jayenge.
const PATROL = {
  width: 14,
  height: 14,
  speed: 40,          // pixels per second
  points: 100,
  ledgeLookAhead: 2   // kinare ke aage kitne pixel dekhta hai
};

// Armadillo ke numbers (PROPOSED, physics spec se). Baad mein config.js mein jayenge.
const ARMADILLO = {
  width: 14,
  height: 14,
  speed: 30,          // chalne ki speed (pixels per second)
  points: 100,
  rollSpeed: 220,     // laat ke baad ludhakne ki speed
  friction: 40,       // zameen par ludhakte hue speed kitni ghatti hai (pixels per second^2)
  freeBounces: 3,     // itni deewar-takkar mein speed kam nahi hoti
  bounceLoss: 0.75,   // uske baad har takkar par speed itni reh jati hai (25% kam)
  minRollSpeed: 10,   // isse dheemi ho to shell ruk jata hai
  kickGrace: 0.25     // laat/kuchalne ke baad itni der cowboy ko nahi chhoota (seconds)
};

// Bottle Bandit ke numbers (PROPOSED, physics spec se). Baad mein config.js mein jayenge.
const THROWER = {
  width: 14,
  height: 22,
  speed: 25,          // chalne ki speed (pixels per second)
  points: 200,
  range: 180,         // cowboy itne pixel ke andar ho tabhi bottle phenkta hai
  interval: 1.8,      // do bottle ke beech ka time (seconds)
  windup: 0.4,        // phenkne se itni der pehle ruk kar haath uthata hai (telegraph)
  patrolHalf: 24      // apni jagah se kitna door tak chalta hai (pixels)
};

// Boss ke numbers (PROPOSED, mere hain). Baad mein config.js mein jayenge.
const BOSS = {
  width: 28,
  height: 28,
  speed: 30,
  points: 500,
  hp: 3,
  hitTime: 1,         // hit ke baad itni der boss aur cowboy ek-doosre ko nahi chhoote (seconds)
  chargeTime: 1.2,    // charge zyada se zyada itni der
  // Index = bacha hua hp - 1
  phases: [
    { walkSpeed: 45, charge: true, walkTime: 0.8, windup: 0.4, chargeSpeed: 200, tired: 0.6 },   // 1 hit baaki
    { walkSpeed: 35, charge: true, walkTime: 1.5, windup: 0.6, chargeSpeed: 150, tired: 1 },     // 2 hit baaki
    { walkSpeed: 30, charge: false, walkTime: 0 }                                                // 3 hit baaki
  ]
};

// Naya dushman banao. col/row us tile ka number hai jis par wo khada hoga.
// type: "walker" (Tumbleweed Bandit), "patrol" (Red Bandit), "armadillo",
//       "thrower" (Bottle Bandit), "vulture" ya "boss"
export function createEnemy(col, row, tileSize, type) {
  let kind = "walker";
  let d = ENEMY.walker;
  if (type === "patrol") {
    kind = "patrol";
    d = PATROL;
  } else if (type === "armadillo") {
    kind = "armadillo";
    d = ARMADILLO;
  } else if (type === "thrower") {
    kind = "thrower";
    d = THROWER;
  } else if (type === "vulture") {
    kind = "vulture";
    d = VULTURE;
  } else if (type === "boss") {
    kind = "boss";
    d = BOSS;
  }
  const x = col * tileSize + (tileSize - d.width) / 2;
  return {
    type: kind,
    x: x,
    y: row * tileSize + tileSize - d.height,
    width: d.width,
    height: d.height,
    speed: d.speed,
    points: d.points,
    vy: 0,
    onGround: false,
    direction: -1,      // -1 = left (cowboy ki taraf), 1 = right
    active: false,      // jab tak screen ke paas na aaye, khada rehta hai
    state: "walking",   // "walking", "shell", "rolling", "squashed" ya "gone"
    squashTimer: 0,
    rollSpeed: 0,       // ludhakte shell ki abhi ki speed
    bounces: 0,         // ludhakte shell ne kitni deewar-takkar maari
    contactGrace: 0,    // 0 se zyada = cowboy ko chhoone ka asar abhi band hai
    homeX: x + d.width / 2,        // Bottle Bandit ki apni jagah (beech ka x)
    facing: -1,                    // Bottle Bandit / Boss kis taraf dekh raha hai
    throwTimer: THROWER.interval,  // agli bottle tak bacha hua time
    winding: false,                // haath uthakar taiyari kar raha hai?
    wantsThrow: false,             // main.js ko batata hai: abhi bottle phenko
    hp: BOSS.hp,                   // Boss ke bache hue hit
    hitTimer: 0,                   // Boss: hit ke baad ka safe time
    mode: "walk",                  // Boss: "walk", "windup", "charge" ya "tired"
    modeTimer: 0,
    chargeDir: -1
  };
}

// Shell ko laat maaro: wo dir ki taraf ludhakna shuru karta hai (1 = right, -1 = left)
export function kickShell(enemy, dir) {
  enemy.state = "rolling";
  enemy.direction = dir;
  enemy.rollSpeed = ARMADILLO.rollSpeed;
  enemy.bounces = 0;
  enemy.contactGrace = ARMADILLO.kickGrace;
}

// Armadillo ko ruke hue shell mein badlo (kuchalne par ya ludhakna band hone par)
export function shellToIdle(enemy, grace) {
  enemy.state = "shell";
  enemy.rollSpeed = 0;
  enemy.contactGrace = grace === undefined ? ARMADILLO.kickGrace : grace;
}

// Boss ko ek hit lagao. Return true agar hit gina gaya. hp 0 hone par state "gone".
export function hitBoss(enemy) {
  if (enemy.hitTimer > 0 || enemy.state !== "walking") {
    return false;
  }
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    enemy.state = "gone";
    sound.play("bossDown");
    return true;
  }
  sound.play("bossHit");
  enemy.hitTimer = BOSS.hitTime;
  enemy.contactGrace = BOSS.hitTime;
  enemy.mode = "walk";
  enemy.modeTimer = BOSS.phases[enemy.hp - 1].walkTime;
  return true;
}

// Boss ka dimaag: kya karna hai (chalna, telegraph, charge, thakna)
function updateBossBrain(enemy, dt, target) {
  if (enemy.hitTimer > 0) {
    enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
  }
  const phase = BOSS.phases[enemy.hp - 1];
  const mid = enemy.x + enemy.width / 2;
  const aim = target
    ? (target.x + target.width / 2 >= mid ? 1 : -1)
    : enemy.direction;
  enemy.facing = aim;
  enemy.modeTimer -= dt;

  if (enemy.mode === "walk") {
    enemy.direction = aim;
    enemy.speed = phase.walkSpeed;
    if (phase.charge && enemy.modeTimer <= 0) {
      enemy.mode = "windup";
      enemy.modeTimer = phase.windup;
    }
  } else if (enemy.mode === "windup") {
    enemy.direction = aim;
    enemy.speed = 0;
    enemy.winding = true;
    if (enemy.modeTimer <= 0) {
      enemy.mode = "charge";
      sound.play("bossCharge");
      enemy.modeTimer = BOSS.chargeTime;
      enemy.chargeDir = aim;
      enemy.direction = aim;
    }
  } else if (enemy.mode === "charge") {
    enemy.speed = phase.chargeSpeed;
    // Deewar se takrane par direction palat jati hai: charge khatam
    if (enemy.direction !== enemy.chargeDir || enemy.modeTimer <= 0) {
      enemy.mode = "tired";
      enemy.modeTimer = phase.tired;
    }
  } else {
    // tired
    enemy.speed = 0;
    enemy.winding = true;
    if (enemy.modeTimer <= 0) {
      enemy.mode = "walk";
      enemy.modeTimer = phase.walkTime;
    }
  }
}

// Dushman ka ek physics step. target = cowboy (Bottle Bandit, Vulture aur Boss ko nishana lagane ke liye)
export function updateEnemy(enemy, dt, level, target) {
  const d = ENEMY.walker;   // gravity aur fall speed sab type ke ek jaise hain

  if (enemy.state === "gone") {
    return;
  }

  if (enemy.contactGrace > 0) {
    enemy.contactGrace = Math.max(0, enemy.contactGrace - dt);
  }

  // Kuchla hua dushman: thodi der dikhta hai, phir gayab
  if (enemy.state === "squashed") {
    enemy.squashTimer -= dt;
    if (enemy.squashTimer <= 0) {
      enemy.state = "gone";
    }
    return;
  }

  if (!enemy.active) {
    return;
  }

  const T = level.tileSize;

  // ---- Vulture: udta hai, gravity ya zameen ki parwah nahi ----
  if (enemy.type === "vulture") {
    updateVulture(enemy, dt, target, level);
    return;
  }

  // ---- Boss: dimaag tay karta hai ki kya karna hai ----
  enemy.winding = false;
  if (enemy.type === "boss" && enemy.state === "walking") {
    updateBossBrain(enemy, dt, target);
  }

  // ---- Bottle Bandit: apni seema mein ghoomo, cowboy paas ho to bottle ki taiyari ----
  if (enemy.type === "thrower" && enemy.state === "walking") {
    const mid = enemy.x + enemy.width / 2;

    // Apni seema se bahar na jaye
    if (mid > enemy.homeX + THROWER.patrolHalf) {
      enemy.direction = -1;
    } else if (mid < enemy.homeX - THROWER.patrolHalf) {
      enemy.direction = 1;
    }

    let inRange = false;
    if (target) {
      const dx = target.x + target.width / 2 - mid;
      inRange = Math.abs(dx) <= THROWER.range;
      if (inRange) {
        enemy.facing = dx >= 0 ? 1 : -1;
      }
    }

    if (inRange) {
      enemy.throwTimer -= dt;
      if (enemy.throwTimer <= THROWER.windup) {
        enemy.winding = true;
      }
      if (enemy.throwTimer <= 0) {
        enemy.wantsThrow = true;
        enemy.throwTimer = THROWER.interval;
        enemy.winding = false;
      }
    } else {
      // Cowboy door hai: timer wapas poora, taaki paas aane par turant bottle na aaye
      enemy.throwTimer = THROWER.interval;
      enemy.facing = enemy.direction;
    }
  }

  // ---- Red Bandit aur Bottle Bandit: kinare par ruko aur palat jao ----
  let canMove = true;
  const ledgeSafe = enemy.type === "patrol" || enemy.type === "thrower";
  if (ledgeSafe && enemy.state === "walking" && enemy.onGround && !enemy.winding) {
    const nextX = enemy.x + enemy.direction * enemy.speed * dt;
    const frontX = enemy.direction > 0
      ? nextX + enemy.width + PATROL.ledgeLookAhead
      : nextX - PATROL.ledgeLookAhead;
    const frontCol = Math.floor(frontX / T);
    const belowRow = Math.floor((enemy.y + enemy.height + 2) / T);
    if (!level.isSolid(frontCol, belowRow)) {
      enemy.direction = -enemy.direction;
      canMove = false;
    }
  }

  // ---- Is step mein kitni speed se chalna hai ----
  let moveSpeed = 0;
  if (enemy.state === "walking") {
    // Bottle Bandit haath uthate waqt ruka rehta hai
    moveSpeed = enemy.winding && enemy.type === "thrower" ? 0 : enemy.speed;
  } else if (enemy.state === "rolling") {
    // Zameen par friction se ludhakna dheema hota hai
    if (enemy.onGround) {
      enemy.rollSpeed = Math.max(0, enemy.rollSpeed - ARMADILLO.friction * dt);
    }
    if (enemy.rollSpeed < ARMADILLO.minRollSpeed) {
      shellToIdle(enemy, 0);
    } else {
      moveSpeed = enemy.rollSpeed;
    }
  }

  // ---- Left-right: seedha chalo, deewar mile to palat jao ----
  if (canMove && moveSpeed > 0) {
    enemy.x += enemy.direction * moveSpeed * dt;

    const top = Math.floor(enemy.y / T);
    const bottom = Math.floor((enemy.y + enemy.height - 0.001) / T);
    const left = Math.floor(enemy.x / T);
    const right = Math.floor((enemy.x + enemy.width - 0.001) / T);

    let hitWall = false;
    for (let row = top; row <= bottom && !hitWall; row++) {
      for (let col = left; col <= right && !hitWall; col++) {
        if (level.isSolid(col, row)) {
          if (enemy.direction > 0) {
            enemy.x = col * T - enemy.width;
          } else {
            enemy.x = (col + 1) * T;
          }

          // Ludhakta shell: pehli 3 takkar mein speed wahi, phir har takkar par 25% kam
          if (enemy.state === "rolling") {
            enemy.bounces += 1;
            if (enemy.bounces > ARMADILLO.freeBounces) {
              enemy.rollSpeed *= ARMADILLO.bounceLoss;
            }
          }

          enemy.direction = -enemy.direction;
          hitWall = true;
        }
      }
    }
  }

  // ---- Upar-neeche: gravity, zameen par utro, kinare se gir jao ----
  enemy.vy += d.gravity * dt;
  if (enemy.vy > d.maxFallSpeed) {
    enemy.vy = d.maxFallSpeed;
  }
  enemy.y += enemy.vy * dt;

  enemy.onGround = false;
  const colLeft = Math.floor(enemy.x / T);
  const colRight = Math.floor((enemy.x + enemy.width - 0.001) / T);
  const rowBelow = Math.floor((enemy.y + enemy.height) / T);

  for (let col = colLeft; col <= colRight; col++) {
    if (level.isSolid(col, rowBelow)) {
      enemy.y = rowBelow * T - enemy.height;
      enemy.vy = 0;
      enemy.onGround = true;
      break;
    }
  }

  // Gaddhe mein gir gaya to hata do
  if (enemy.y > level.height * T) {
    enemy.state = "gone";
  }
}