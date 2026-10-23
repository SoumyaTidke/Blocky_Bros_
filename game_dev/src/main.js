import { CONFIG, ENEMY, GAMEPLAY, ITEM, PLAYER, CHILI, BULLET, CHECKPOINTS, COIN } from "./config.js";
import "./touch.js";
import "./tuning.js";
import { sound } from "./sound.js";
import { input } from "./input.js";
import { level } from "./level.js";
import { drawBackground } from "./background.js";
import { createPlayer, updatePlayer, growPlayer, shrinkPlayer } from "./player.js";
import { createCamera, updateCamera } from "./camera.js";
import { createEnemy, updateEnemy, kickShell, shellToIdle, hitBoss } from "./enemy.js";
import { createGrowthItem, createChiliItem, updateItem } from "./item.js";
import { createBullet, updateBullet } from "./bullet.js";
import { BOTTLE, createBottle, updateBottle } from "./bottle.js";
import { createRenderer } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const miniHud = document.getElementById("mini");
const bannerEl = document.getElementById("banner");

canvas.width = CONFIG.gameWidth;
canvas.height = CONFIG.gameHeight;

// Saari drawing render.js mein hai
const drawWorld = createRenderer(ctx);

const T = CONFIG.tileSize;

// Cowboy kahan se shuru hota hai
const SPAWN_X = 16;
const SPAWN_Y = 12 * T - 14;

// Level ke neeche ki line: cowboy ka sir isse neeche chala jaye to maut (PROPOSED)
const DEATH_LINE = level.height * T;

// Ye PROPOSED starting values hain (baad mein config.js mein le jayenge)
const RESPAWN_DELAY = 0.8;   // maut ke baad kitni der ruk kar respawn (seconds)
const CLEAR_DELAY = 3;       // stage clear ke baad level dobara shuru hone mein kitni der (seconds)

// Aakhri chhua hua checkpoint (0, 1, 2...). -1 matlab abhi koi nahi chhua.
let checkpointIndex = -1;

// Cowboy kahan respawn hoga (x)
function respawnX() {
  if (checkpointIndex >= 0) {
    return CHECKPOINTS[checkpointIndex].col * T + (T - PLAYER.width) / 2;
  }
  return SPAWN_X;
}

// Dushman banao. Checkpoint chhua ho to sirf uske aage wale dushman wapas aate hain.
function spawnEnemies() {
  const fromCol = checkpointIndex >= 0 ? CHECKPOINTS[checkpointIndex].col : 0;
  return level.enemies
    .filter((e) => e.col >= fromCol)
    .map((e) => createEnemy(e.col, e.row, T, e.type));
}

// Dushman zinda hai? (chalta hua, ruka shell ya ludhakta shell)
function isAlive(enemy) {
  return enemy.state === "walking" || enemy.state === "shell" || enemy.state === "rolling";
}

let cowboy = createPlayer(SPAWN_X, SPAWN_Y);
const camera = createCamera();
let enemies = spawnEnemies();
let items = [];          // crates se nikle items (growth fruit, chili)
let bullets = [];        // udti hui goliyan (cowboy ki)
let bottles = [];        // udti hui bottles (Bottle Bandit ki)
let shootCooldown = 0;   // agli goli chalne mein bacha hua time (seconds)
let shootWasDown = false;

let deadTimer = 0;       // 0 se zyada = cowboy abhi mara hua hai
let deathReason = "";    // "pit" ya "enemy"
let clearTimer = 0;      // 0 se zyada = stage clear ho chuka hai
let pitDeaths = 0;
let score = 0;
let coinsTaken = level.coins.map(() => false);
let coinCount = 0;
let coinPops = [];       // crate se nikle coins ka animation: { x, y, t }

let lives = GAMEPLAY.startLives;
let gameOver = false;
let gameOverTimer = 0;       // Game Over ke baad retry lock
let retryWasDown = false;    // pichhle step mein jump key dabi thi ya nahi
let paused = false;          // game ruka hua hai?
let pauseWasDown = false;    // pichhle step mein pause dabi thi ya nahi
let onTitle = true;          // title screen chal rahi hai?
let titleWasDown = false;    // pichhle step mein jump dabi thi ya nahi

function respawn() {
  cowboy = createPlayer(respawnX(), SPAWN_Y);
  // Agar jump key dabi hui hai, to naya cowboy turant na koode
  cowboy.jumpWasDown = input.isDown("jump");
  camera.x = 0;
  updateCamera(camera, cowboy, level);   // camera cowboy ke paas aa jaye
  enemies = spawnEnemies();   // dushman wapas apni jagah par
  items = [];
  bullets = [];
  bottles = [];
  shootCooldown = 0;
  shootWasDown = input.isDown("shoot");
  coinPops = [];
  level.resetGrowthCrates();  // growth aur power crates dobara bhare hue
  sound.musicStart();
  deadTimer = 0;
}

// Poora game naye sire se: lives, score, coins, crates, checkpoints sab reset
function fullRestart() {
  coinsTaken = level.coins.map(() => false);
  coinCount = 0;
  level.resetCrates();
  score = 0;
  clearTimer = 0;
  lives = GAMEPLAY.startLives;
  gameOver = false;
  checkpointIndex = -1;
  respawn();
}

// Cowboy ki maut: ek life jati hai. Lives khatam to Game Over.
function killCowboy(reason) {
  deathReason = reason;
  sound.musicStop();
  sound.play("death");
  lives -= 1;
  if (lives <= 0) {
    lives = 0;
    gameOver = true;
    gameOverTimer = GAMEPLAY.gameOverLockTime;
  } else {
    deadTimer = RESPAWN_DELAY;
  }
}

// Do dabbe ek-doosre ko chhoote hain ya nahi
function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function collectCoins() {
  for (let i = 0; i < level.coins.length; i++) {
    if (coinsTaken[i]) {
      continue;
    }
    const coin = level.coins[i];
    const cx = coin.col * T + (T - COIN.size) / 2;
    const cy = coin.row * T + (T - COIN.size) / 2;
    if (overlaps(cowboy.x, cowboy.y, cowboy.width, cowboy.height, cx, cy, COIN.size, COIN.size)) {
      coinsTaken[i] = true;
      coinCount += 1;
      score += COIN.points;
    }
  }
}

// Cowboy ne naya checkpoint chhua? Sirf aage wale checkpoint activate hote hain.
function handleCheckpoint() {
  for (let i = checkpointIndex + 1; i < CHECKPOINTS.length; i++) {
    const c = CHECKPOINTS[i];
    if (overlaps(cowboy.x, cowboy.y, cowboy.width, cowboy.height,
                 c.col * T, c.row * T, c.widthTiles * T, c.heightTiles * T)) {
      checkpointIndex = i;
      sound.play("checkpoint");
    }
  }
}

// Cowboy ne neeche se kisi tile par sir maara? Agar wo "?" crate hai to uska item nikalo.
function handleCrateHit() {
  const bump = cowboy.bumpedTile;
  if (!bump) {
    return;
  }
  if (level.rows[bump.row][bump.col] !== "?") {
    return;
  }
  level.rows[bump.row][bump.col] = "U";
  sound.play("crate");

  const crate = level.crateAt(bump.col, bump.row);
  if (crate && crate.item === "growth") {
    items.push(createGrowthItem(bump.col, bump.row, T));
  } else if (crate && crate.item === "power") {
    // Chhota cowboy: growth fruit. Bada cowboy: chili pepper. (PROPOSED rule)
    if (cowboy.big) {
      items.push(createChiliItem(bump.col, bump.row, T));
    } else {
      items.push(createGrowthItem(bump.col, bump.row, T));
    }
  } else {
    coinCount += 1;
    score += COIN.points;
    coinPops.push({ x: bump.col * T + T / 2, y: bump.row * T, t: 0 });
  }
}

function updateCoinPops(dt) {
  for (const pop of coinPops) {
    pop.t += dt;
  }
  coinPops = coinPops.filter((pop) => pop.t < COIN.crateTime);
}

// Items ko chalao, aur cowboy unhe utha sake to utha le
function updateItems(dt) {
  for (const item of items) {
    updateItem(item, dt, level);
    if (item.state !== "moving" && item.state !== "waiting") {
      continue;
    }
    if (!overlaps(cowboy.x, cowboy.y, cowboy.width, cowboy.height,
                  item.x, item.y, item.width, item.height)) {
      continue;
    }

    if (item.type === "chili") {
      if (cowboy.sharp) {
        // Pehle se Sharpshooter hai: sirf points
        score += CHILI.points;
        item.state = "gone";
      } else if (cowboy.big) {
        cowboy.sharp = true;
        score += CHILI.points;
        item.state = "gone";
      } else if (growPlayer(cowboy, level)) {
        // Chhota cowboy: sirf bada hota hai (PROPOSED rule)
        score += CHILI.points;
        item.state = "gone";
      }
    } else {
      if (cowboy.big) {
        // Pehle se bada hai: sirf points
        score += ITEM.growth.points;
        item.state = "gone";
      } else if (growPlayer(cowboy, level)) {
        score += ITEM.growth.points;
        item.state = "gone";
      }
      // Upar chhat ki wajah se bada nahi ho paya to item wahin rehta hai
    }
  }
  items = items.filter((item) => item.state !== "gone");
}

// Z dabane par Sharpshooter goli chalata hai (key dabaye rakhne par ek hi goli)
function handleShooting(dt) {
  shootCooldown = Math.max(0, shootCooldown - dt);

  const shootNow = input.isDown("shoot");
  const justPressed = shootNow && !shootWasDown;
  shootWasDown = shootNow;

  if (!justPressed || !cowboy.sharp) {
    return;
  }
  if (shootCooldown > 0 || bullets.length >= BULLET.maxActive) {
    return;
  }

  const bx = cowboy.facing === 1 ? cowboy.x + cowboy.width : cowboy.x - BULLET.width;
  const by = cowboy.y + 12;
  bullets.push(createBullet(bx, by, cowboy.facing));
  sound.play("shoot");
  shootCooldown = BULLET.cooldown;
}

// Goliyan chalao aur dushman ko lage to hata do (kisi bhi roop mein)
function updateBullets(dt) {
  for (const bullet of bullets) {
    updateBullet(bullet, dt, level);
    if (bullet.state === "gone") {
      continue;
    }
    for (const enemy of enemies) {
      if (!isAlive(enemy) || !enemy.active) {
        continue;
      }
      if (overlaps(bullet.x, bullet.y, bullet.width, bullet.height,
                   enemy.x, enemy.y, enemy.width, enemy.height)) {
        if (enemy.type === "boss") {
          hitBoss(enemy);
          if (enemy.state === "gone") {
            score += enemy.points;
          }
        } else {
          enemy.state = "gone";
          score += enemy.points;
        }
        sound.play("stomp");
        bullet.state = "gone";
        break;
      }
    }
  }
  bullets = bullets.filter((b) => b.state !== "gone");
}

function touchedGoal() {
  const g = level.goal;
  return overlaps(
    cowboy.x, cowboy.y, cowboy.width, cowboy.height,
    g.col * T, g.row * T, g.widthTiles * T, g.heightTiles * T
  );
}

// Dushman screen ke paas aate hi chalna shuru karta hai
function activateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.active && enemy.x < camera.x + CONFIG.gameWidth) {
      enemy.active = true;
    }
  }
}

// Ludhakta shell raaste ke har dushman ko maar deta hai
function handleShellHits() {
  for (const shell of enemies) {
    if (shell.state !== "rolling") {
      continue;
    }
    for (const other of enemies) {
      if (other === shell || !isAlive(other) || !other.active) {
        continue;
      }
      if (overlaps(shell.x, shell.y, shell.width, shell.height,
                   other.x, other.y, other.width, other.height)) {
        if (other.type === "boss") {
          hitBoss(other);
          if (other.state === "gone") {
            score += other.points;
          }
        } else {
          other.state = "gone";
          score += other.points;
        }
        sound.play("stomp");
      }
    }
  }
}

// Bottle Bandit ne "phenko" ka sanket diya? To cowboy ki taraf bottle banao.
function handleThrows() {
  for (const enemy of enemies) {
    if (!enemy.wantsThrow) {
      continue;
    }
    enemy.wantsThrow = false;
    if (enemy.state !== "walking") {
      continue;
    }
    const dx = (cowboy.x + cowboy.width / 2) - (enemy.x + enemy.width / 2);
    const dir = dx >= 0 ? 1 : -1;
    const bx = dir === 1 ? enemy.x + enemy.width : enemy.x - BOTTLE.size;
    const by = enemy.y + 4;
    bottles.push(createBottle(bx, by, dir, Math.abs(dx)));
    sound.play("throw");
  }
}

// Bottles chalao. Cowboy ko lage to damage. Return true agar cowboy mar gaya.
function updateBottles(dt) {
  for (const bottle of bottles) {
    updateBottle(bottle, dt, level);
    if (bottle.state === "gone") {
      if (bottle.broke) {
        sound.play("bottleBreak");
      }
      continue;
    }
    if (!overlaps(cowboy.x, cowboy.y, cowboy.width, cowboy.height,
                  bottle.x, bottle.y, bottle.width, bottle.height)) {
      continue;
    }
    if (cowboy.invincibleTimer > 0) {
      // Safe time chal raha hai: bottle cowboy ke andar se guzar jati hai
      continue;
    }
    bottle.state = "gone";
    if (cowboy.big) {
      // Bada ya Sharpshooter cowboy: chhota ho jata hai, marta nahi
      shrinkPlayer(cowboy);
      cowboy.invincibleTimer = PLAYER.invincibleTime;
    } else {
      killCowboy("enemy");
      return true;
    }
  }
  bottles = bottles.filter((b) => b.state !== "gone");
  return false;
}

// Cowboy kuchalne ke baad thoda upar uchhalta hai
function bounceCowboy() {
  cowboy.vy = ENEMY.stompBounce;
  cowboy.onGround = false;
  cowboy.coyoteTimer = 0;
  cowboy.jumpBufferTimer = 0;
}

// Cowboy aur dushman ka takraav. Return true agar cowboy mar gaya.
// prevBottom = cowboy ke paer ki pichhle step ki jagah.
function handleEnemyContact(prevBottom) {
  for (const enemy of enemies) {
    if (!isAlive(enemy) || !enemy.active) {
      continue;
    }
    // Laat ya kuchalne ke turant baad thodi der koi asar nahi
    if (enemy.contactGrace > 0) {
      continue;
    }
    if (!overlaps(cowboy.x, cowboy.y, cowboy.width, cowboy.height,
                  enemy.x, enemy.y, enemy.width, enemy.height)) {
      continue;
    }

    // Kuchalna: cowboy neeche aa raha ho, aur pichhle step mein uska paer dushman ke sir ke upar ho
    const stomping = cowboy.vy > 0 && prevBottom <= enemy.y + ENEMY.stompTolerance;

    // Ruka hua shell: chhune ya kuchalne par laat, cowboy ko kuch nahi hota
    if (enemy.state === "shell") {
      const cowboyMid = cowboy.x + cowboy.width / 2;
      const shellMid = enemy.x + enemy.width / 2;
      kickShell(enemy, cowboyMid < shellMid ? 1 : -1);
      sound.play("crate");
      if (stomping) {
        bounceCowboy();
      }
      continue;
    }

    if (stomping) {
      if (enemy.type === "boss") {
        // Boss: ek hit. Aakhri hit par gayab aur points.
        hitBoss(enemy);
        if (enemy.state === "gone") {
          score += enemy.points;
        }
        sound.play("stomp");
      } else if (enemy.type === "armadillo") {
        // Chalta Armadillo: shell ban jata hai. Ludhakta shell: ruk jata hai.
        if (enemy.state === "walking") {
          score += enemy.points;
        }
        shellToIdle(enemy);
        sound.play("stomp");
      } else {
        enemy.state = "squashed";
        enemy.squashTimer = ENEMY.walker.squashTime;
        score += enemy.points;
      }
      bounceCowboy();
    } else if (cowboy.invincibleTimer > 0) {
      // Safe time chal raha hai: dushman cowboy ko nahi chhoota
      continue;
    } else if (cowboy.big) {
      // Bada ya Sharpshooter cowboy: chhota ho jata hai, marta nahi
      shrinkPlayer(cowboy);
      cowboy.invincibleTimer = PLAYER.invincibleTime;
    } else {
      // Chhota cowboy: ek life jati hai
      killCowboy("enemy");
      return true;
    }
  }
  return false;
}

// Physics update: hamesha ek fixed 1/60 second ka step
function update(dt) {
  // Title screen: Space (ya JUMP button) dabane par game shuru
  if (onTitle) {
    const startNow = input.isDown("jump");
    if (startNow && !titleWasDown) {
      onTitle = false;
      // Isi dabav se cowboy turant na koode
      cowboy.jumpWasDown = true;
      sound.musicStart();
    }
    titleWasDown = startNow;
    return;
  }

  // Pause: P, Esc ya touch button (dabane ke pal par ek baar badalta hai)
  const pauseNow = input.isDown("pause");
  if (pauseNow && !pauseWasDown && !gameOver) {
    paused = !paused;
    if (paused) {
      sound.musicStop();
    } else if (deadTimer <= 0 && clearTimer <= 0) {
      sound.musicStart();
    }
  }
  pauseWasDown = pauseNow;
  if (paused) {
    return;
  }

  // Game Over: Space dabane par naye sire se shuru
  if (gameOver) {
    gameOverTimer = Math.max(0, gameOverTimer - dt);
    const jumpNow = input.isDown("jump");
    if (gameOverTimer <= 0 && jumpNow && !retryWasDown) {
      fullRestart();
    }
    retryWasDown = jumpNow;
    return;
  }

  if (deadTimer > 0) {
    deadTimer -= dt;
    if (deadTimer <= 0) {
      respawn();
    }
    return;
  }

  if (clearTimer > 0) {
    clearTimer -= dt;
    if (clearTimer <= 0) {
      fullRestart();
    }
    return;
  }

  if (cowboy.invincibleTimer > 0) {
    cowboy.invincibleTimer = Math.max(0, cowboy.invincibleTimer - dt);
  }

  const prevBottom = cowboy.y + cowboy.height;

  // Awaaz ke liye: badlav pehchanne ke liye purani values yaad rakho
  const prevVy = cowboy.vy;
  const prevCoins = coinCount;
  const prevBig = cowboy.big;
  const prevSharp = cowboy.sharp;
  const prevSquashed = enemies.filter((e) => e.state === "squashed").length;

  updatePlayer(cowboy, dt, input, level);
  updateCamera(camera, cowboy, level);

  handleCheckpoint();
  handleCrateHit();
  updateCoinPops(dt);
  updateItems(dt);

  activateEnemies();
  for (const enemy of enemies) {
    updateEnemy(enemy, dt, level, cowboy);
  }
  handleShellHits();
  handleThrows();

  handleShooting(dt);
  updateBullets(dt);

  collectCoins();

  let died = handleEnemyContact(prevBottom);
  if (!died) {
    died = updateBottles(dt);
  }

  // Awaazein: kya badla, dekhkar bajao
  if (cowboy.vy < -250 && prevVy >= -250) {
    sound.play("jump");
  }
  if (coinCount > prevCoins) {
    sound.play("coin");
  }
  if (enemies.filter((e) => e.state === "squashed").length > prevSquashed) {
    sound.play("stomp");
  }
  if ((cowboy.big && !prevBig) || (cowboy.sharp && !prevSharp)) {
    sound.play("powerup");
  }
  if (prevBig && !cowboy.big) {
    sound.play("hurt");
  }

  if (died) {
    return;
  }

  if (touchedGoal()) {
    clearTimer = CLEAR_DELAY;
    sound.musicStop();
    sound.play("clear");
    return;
  }

  // Gaddhe mein gira? (bada ho ya chhota, seedha maut)
  if (cowboy.y > DEATH_LINE) {
    pitDeaths += 1;
    killCowboy("pit");
  }
}

// Upar-left ka saaf text (normal web text, canvas par nahi)
function updateHud() {
  const keys = input.activeActions();
  let status = cowboy.onGround ? "on the ground" : "in the air";
  if (deadTimer > 0) {
    status = deathReason === "enemy"
      ? "HIT BY AN ENEMY - respawning..."
      : "FELL IN A PIT - respawning...";
  }
  if (clearTimer > 0) {
    status = "STAGE CLEAR! Restarting soon...";
  }
  if (gameOver) {
    status = gameOverTimer > 0
      ? "GAME OVER"
      : "GAME OVER - press Space to play again";
  }
  if (paused) {
    status = "PAUSED";
  }

  let form = "small";
  if (cowboy.big) {
    form = "BIG";
  }
  if (cowboy.sharp) {
    form = "SHARPSHOOTER";
  }

  const enemiesAlive = enemies.filter(isAlive).length;
  const cratesHit = level.crates.filter((c) => level.rows[c.row][c.col] === "U").length;

  const lines = [
    "Lives: " + lives,
    "Score: " + score,
    "Coins: " + coinCount,
    "Cowboy form: " + form,
    "Checkpoints reached: " + (checkpointIndex + 1) + " of " + CHECKPOINTS.length,
    "Bullets in flight: " + bullets.length + " of " + BULLET.maxActive,
    "Bottles in flight: " + bottles.length,
    "Safe time left: " + cowboy.invincibleTimer.toFixed(1) + " s",
    "Crates hit: " + cratesHit + " of " + level.crates.length,
    "Enemies alive: " + enemiesAlive + " of " + enemies.length,
    "Boss hits left: " + (enemies.find((e) => e.type === "boss" && isAlive(e))?.hp ?? "-"),
    "",
    "Keys pressed: " + (keys.length > 0 ? keys.join(", ") : "none"),
    "Speed: " + Math.round(cowboy.vx) + " px/s" + (cowboy.skidding ? "  (SKIDDING)" : ""),
    "Last jump height: " + Math.round(cowboy.lastJumpHeight) + " px",
    "Cowboy is: " + status,
    "Cowboy position: " + Math.round(cowboy.x) + " of " + level.width * T + " px",
    "Pit falls so far: " + pitDeaths,
    "",
    "Move: Arrow keys or A / D",
    "Jump: Space, Up or W",
    "Run: Shift or X (hold)",
    "Shoot: Z (Sharpshooter only)",
    "Pause: P or Esc",
    "Mute: M"
  ];
  hud.textContent = lines.join("\n");

  // Phone ka chhota HUD
  miniHud.textContent =
    "Lives " + lives + "   Score " + score + "   Coins " + coinCount + "   " + form;

  let banner = "";
  if (onTitle) {
    banner = "COWBOY GAME - press Space (or tap JUMP)";
  } else if (paused) {
    banner = "PAUSED - press P or Esc";
  } else if (gameOver) {
    banner = gameOverTimer > 0 ? "GAME OVER" : "GAME OVER - tap JUMP (or press Space)";
  } else if (clearTimer > 0) {
    banner = "STAGE CLEAR!";
  } else if (deadTimer > 0) {
    banner = deathReason === "enemy" ? "OUCH!" : "FELL IN A PIT";
  }
  bannerEl.textContent = banner;
  bannerEl.style.display = banner ? "block" : "";
}

function draw() {
  drawWorld({
    camera: camera,
    cowboy: cowboy,
    enemies: enemies,
    items: items,
    bullets: bullets,
    bottles: bottles,
    coinsTaken: coinsTaken,
    coinPops: coinPops,
    checkpointIndex: checkpointIndex,
    showCowboy: deadTimer <= 0 && !gameOver
  });

  // Game Over, Pause ya Title par poori screen thodi kaali ho jati hai
  if (gameOver || paused || onTitle) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, CONFIG.gameWidth, CONFIG.gameHeight);
  }

  updateHud();
}

// Fixed-step loop
let lastTime = performance.now();
let accumulator = 0;

function frame(now) {
  let frameTime = (now - lastTime) / 1000;
  lastTime = now;

  if (frameTime > CONFIG.maxFrameTime) {
    frameTime = CONFIG.maxFrameTime;
  }

  accumulator += frameTime;
  while (accumulator >= CONFIG.fixedStep) {
    update(CONFIG.fixedStep);
    accumulator -= CONFIG.fixedStep;
  }

  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);