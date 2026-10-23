import { CONFIG, PLAYER, COIN, CHECKPOINTS } from "./config.js";
import { level } from "./level.js";
import { drawBackground } from "./background.js";
import { drawGroundTile } from "./tiles.js";
import { drawCowboySprite } from "./cowboyArt.js";

const T = CONFIG.tileSize;

// Saari drawing yahan hai. main.js sirf state deta hai, aur ye use screen par banata hai.
export function createRenderer(ctx) {

  // Sone ka reward crate: star ke saath
  function drawRewardCrate(px, py) {
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = "#F2C14E";
    ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
    ctx.fillStyle = "#C99A2E";
    ctx.fillRect(px + 1, py + T - 3, T - 2, 2);

    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(px + 7, py + 3, 2, 10);
    ctx.fillRect(px + 3, py + 7, 10, 2);
    ctx.fillRect(px + 5, py + 5, 6, 6);
    ctx.fillStyle = "#FFF1B8";
    ctx.fillRect(px + 7, py + 6, 2, 4);
    ctx.fillRect(px + 6, py + 7, 4, 2);
  }

  // Khali (use hua) crate: fika bhoora
  function drawUsedCrate(px, py) {
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = "#6B5A4A";
    ctx.fillRect(px + 1, py + 1, T - 2, T - 2);
    ctx.fillStyle = "#54463A";
    ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
  }

  // Sirf wahi tiles draw karo jo camera ko dikhte hain
  function drawTiles(camera) {
    const firstCol = Math.max(0, Math.floor(camera.x / T));
    const lastCol = Math.min(level.width - 1, firstCol + Math.ceil(CONFIG.gameWidth / T) + 1);

    for (let row = 0; row < level.height; row++) {
      for (let col = firstCol; col <= lastCol; col++) {
        const ch = level.rows[row][col];
        const px = col * T;
        const py = row * T;

        if (ch === "?") {
          drawRewardCrate(px, py);
          continue;
        }
        if (ch === "U") {
          drawUsedCrate(px, py);
          continue;
        }
        if (ch !== "#") {
          continue;
        }

        // Zameen / platform: look tiles.js mein hai
        drawGroundTile(ctx, col, row);
      }
    }
  }

  // Laal cactus fruit
  function drawGrowthItem(item) {
    const x = Math.round(item.x);
    const y = Math.round(item.y);

    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x - 1, y - 1, item.width + 2, item.height + 2);
    ctx.fillStyle = "#D64545";
    ctx.fillRect(x, y, item.width, item.height);
    ctx.fillStyle = "#5FA052";
    ctx.fillRect(x + 3, y, 8, 3);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 3, y + 6, 2, 2);
    ctx.fillRect(x + 9, y + 9, 2, 2);
  }

  // Chili pepper: orange-laal, hara dandi, halki chamak
  function drawChiliItem(item) {
    const x = Math.round(item.x);
    const y = Math.round(item.y);

    // Dhadakti chamak
    const glow = 0.25 + 0.2 * Math.sin(performance.now() / 150);
    ctx.globalAlpha = glow;
    ctx.fillStyle = "#FFD27A";
    ctx.fillRect(x - 2, y - 2, item.width + 4, item.height + 4);
    ctx.globalAlpha = 1;

    // Pepper ka sharir
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x + 2, y + 3, 10, 11);
    ctx.fillStyle = "#F28C28";
    ctx.fillRect(x + 3, y + 4, 8, 9);
    ctx.fillStyle = "#D64545";
    ctx.fillRect(x + 3, y + 4, 8, 4);
    ctx.fillStyle = "#FFE0A0";
    ctx.fillRect(x + 4, y + 9, 2, 2);

    // Hara dandi
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x + 5, y, 4, 4);
    ctx.fillStyle = "#5FA052";
    ctx.fillRect(x + 6, y + 1, 2, 3);
  }

  // Items tiles se PEHLE draw hote hain, taaki crate se nikalte waqt crate ke peeche se upar aayein.
  function drawItems(items) {
    for (const item of items) {
      if (item.type === "chili") {
        drawChiliItem(item);
      } else {
        drawGrowthItem(item);
      }
    }
  }

  // Coins: sone ka gol, thoda ghoomta hua dikhta hai
  function drawCoins(coinsTaken) {
    const spin = Math.abs(Math.sin(performance.now() / 200));
    const halfWidth = Math.max(1, Math.round((COIN.size / 2) * spin));

    for (let i = 0; i < level.coins.length; i++) {
      if (coinsTaken[i]) {
        continue;
      }
      const coin = level.coins[i];
      const centerX = coin.col * T + T / 2;
      const centerY = coin.row * T + T / 2;

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(centerX - halfWidth - 1, centerY - COIN.size / 2 - 1, halfWidth * 2 + 2, COIN.size + 2);
      ctx.fillStyle = "#F2C14E";
      ctx.fillRect(centerX - halfWidth, centerY - COIN.size / 2, halfWidth * 2, COIN.size);
    }
  }

  // Crate se nikle coins: upar uthte hue
  function drawCoinPops(coinPops) {
    for (const pop of coinPops) {
      const progress = pop.t / COIN.crateTime;
      const rise = Math.sin(progress * Math.PI) * COIN.crateRise;
      const cy = pop.y - 6 - rise;
      const spin = Math.abs(Math.cos(pop.t * 30));
      const halfWidth = Math.max(1, Math.round((COIN.size / 2) * spin));

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(Math.round(pop.x - halfWidth - 1), Math.round(cy - COIN.size / 2 - 1), halfWidth * 2 + 2, COIN.size + 2);
      ctx.fillStyle = "#F2C14E";
      ctx.fillRect(Math.round(pop.x - halfWidth), Math.round(cy - COIN.size / 2), halfWidth * 2, COIN.size);
    }
  }

  // Goal: lakdi ka pole aur laal jhanda
  function drawGoal() {
    const g = level.goal;
    const poleX = g.col * T + 6;
    const poleTop = g.row * T;
    const poleHeight = g.heightTiles * T;

    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(poleX - 1, poleTop - 1, 6, poleHeight + 1);
    ctx.fillStyle = "#7A4E2D";
    ctx.fillRect(poleX, poleTop, 4, poleHeight);

    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(poleX - 13, poleTop + 3, 14, 12);
    ctx.fillStyle = "#C7302B";
    ctx.fillRect(poleX - 12, poleTop + 4, 12, 10);
  }

  // Checkpoints: patla pole aur chhota jhanda. Chhue hue hare, baaki gray.
  function drawCheckpoints(checkpointIndex) {
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const c = CHECKPOINTS[i];
      const poleX = c.col * T + 4;
      const top = c.row * T;
      const height = c.heightTiles * T;

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(poleX - 1, top - 1, 4, height + 1);
      ctx.fillStyle = "#7A4E2D";
      ctx.fillRect(poleX, top, 2, height);

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(poleX + 2, top, 10, 8);
      ctx.fillStyle = i <= checkpointIndex ? "#5FA052" : "#9AA0A6";
      ctx.fillRect(poleX + 2, top + 1, 9, 6);
    }
  }

  // Vulture: baingani sharir, laal-narangi chonch, pankh phadphadate hain.
  // Patthar girane se pehle ruk jata hai aur neeche chamakta patthar dikhta hai (warning).
  function drawVulture(enemy, x, y) {
    const w = enemy.width;

    if (enemy.state === "squashed") {
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y + 5, w + 2, 8);
      ctx.fillStyle = "#5A3F5A";
      ctx.fillRect(x, y + 6, w, 6);
      return;
    }

    const face = enemy.facing === 1 ? 1 : -1;
    const flapUp = Math.floor((enemy.flap || 0) * 8) % 2 === 0;
    const winding = enemy.phase === "windup";

    // Pankh
    const wingY = flapUp ? y - 5 : y + 3;
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x - 6, wingY - 1, 9, 7);
    ctx.fillRect(x + w - 3, wingY - 1, 9, 7);
    ctx.fillStyle = "#6B4F6B";
    ctx.fillRect(x - 5, wingY, 7, 5);
    ctx.fillRect(x + w - 2, wingY, 7, 5);

    // Sharir
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x - 1, y + 1, w + 2, 14);
    ctx.fillStyle = "#5A3F5A";
    ctx.fillRect(x, y + 2, w, 12);
    ctx.fillStyle = "#8D6E8D";
    ctx.fillRect(x + 3, y + 8, w - 6, 5);

    // Chonch (jis taraf dekh raha hai)
    const beakX = face === 1 ? x + w - 1 : x - 4;
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(beakX, y + 4, 5, 6);
    ctx.fillStyle = "#F28C28";
    ctx.fillRect(beakX + (face === 1 ? 0 : 1), y + 5, 4, 4);

    // Aankh
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(face === 1 ? x + w - 6 : x + 4, y + 4, 3, 3);
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(face === 1 ? x + w - 4 : x + 4, y + 5, 1, 2);

    // Warning: pakda hua patthar chamakta hai
    if (winding) {
      const flash = Math.floor(performance.now() / 80) % 2 === 0;
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x + 4, y + 14, 8, 8);
      ctx.fillStyle = flash ? "#FFD27A" : "#8A8A8A";
      ctx.fillRect(x + 5, y + 15, 6, 6);
    }
  }

  // Bottle Bandit: hara vest, kaala hat. Phenkne se pehle haath upar uthta hai aur bottle chamakti hai.
  function drawThrower(enemy, x, y) {
    const w = enemy.width;
    const h = enemy.height;

    if (enemy.state === "squashed") {
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y + h - 7, w + 2, 8);
      ctx.fillStyle = "#5F7F3F";
      ctx.fillRect(x, y + h - 6, w, 6);
      return;
    }

    const face = enemy.facing === 1 ? 1 : -1;

    // Sharir
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = "#4A2F1B";
    ctx.fillRect(x, y, w, h);

    // Hara vest
    ctx.fillStyle = "#5F7F3F";
    ctx.fillRect(x, y + 9, w, 7);

    // Chehra
    ctx.fillStyle = "#E8B58B";
    ctx.fillRect(x + 2, y + 4, w - 4, 5);

    // Aankh (jis taraf dekh raha hai)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(face === 1 ? x + 7 : x + 3, y + 5, 3, 2);
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(face === 1 ? x + 9 : x + 3, y + 5, 1, 2);

    // Hat
    ctx.fillStyle = "#2B2B2B";
    ctx.fillRect(x - 2, y + 2, w + 4, 2);
    ctx.fillRect(x + 2, y - 3, w - 4, 5);

    // Haath aur bottle
    const armX = face === 1 ? x + w - 3 : x;
    if (enemy.winding) {
      // Haath upar, bottle chamakti hui: abhi phenkne wala hai
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(armX - 1, y - 6, 5, 16);
      ctx.fillStyle = "#E8B58B";
      ctx.fillRect(armX, y - 5, 3, 14);

      const flash = Math.floor(performance.now() / 80) % 2 === 0;
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(armX - 2, y - 15, 7, 10);
      ctx.fillStyle = flash ? "#B8F0C8" : "#4FA36B";
      ctx.fillRect(armX - 1, y - 14, 5, 8);
      ctx.fillRect(armX, y - 17, 3, 3);
    } else {
      // Haath neeche, bottle kamar ke paas
      ctx.fillStyle = "#E8B58B";
      ctx.fillRect(armX, y + 10, 3, 5);
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(armX - 1, y + 13, 5, 8);
      ctx.fillStyle = "#4FA36B";
      ctx.fillRect(armX, y + 14, 3, 6);
    }
  }

  // Bottles aur patthar: ghoomte hue
  function drawBottles(bottles) {
    for (const b of bottles) {
      const cx = Math.round(b.x + b.width / 2);
      const cy = Math.round(b.y + b.height / 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(b.angle);
      if (b.kind === "rock") {
        ctx.fillStyle = CONFIG.colors.outline;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = "#8A8A8A";
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = "#B8B8B8";
        ctx.fillRect(-2, -3, 2, 2);
        ctx.restore();
        continue;
      }
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(-3, -5, 6, 10);
      ctx.fillStyle = "#4FA36B";
      ctx.fillRect(-2, -4, 4, 8);
      ctx.fillStyle = "#B8F0C8";
      ctx.fillRect(-1, -3, 1, 3);
      ctx.restore();
    }
  }

  // Armadillo: chalta hua (sharir + naak), ruka shell (gol gend), ludhakta shell (ghoomti patti)
  function drawArmadillo(enemy, x, y) {
    if (enemy.state === "walking") {
      const facingRight = enemy.direction === 1;

      // Sharir
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y + 1, enemy.width + 2, enemy.height);
      ctx.fillStyle = "#A89B8C";
      ctx.fillRect(x, y + 2, enemy.width, enemy.height - 3);

      // Kavach ki patti
      ctx.fillStyle = "#7D7266";
      ctx.fillRect(x + 3, y + 2, 2, enemy.height - 3);
      ctx.fillRect(x + 7, y + 2, 2, enemy.height - 3);

      // Naak aur aankh (jis taraf chal raha hai)
      const noseX = facingRight ? x + enemy.width - 1 : x - 3;
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(noseX, y + 5, 4, 5);
      ctx.fillStyle = "#C9BBA8";
      ctx.fillRect(noseX + (facingRight ? 0 : 1), y + 6, 3, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(facingRight ? x + enemy.width - 4 : x + 2, y + 4, 2, 2);

      // Paer
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x + 2, y + enemy.height - 1, 3, 2);
      ctx.fillRect(x + enemy.width - 5, y + enemy.height - 1, 3, 2);
      return;
    }

    // Shell: gol gend. Ludhakte waqt patti ghoomti hai.
    const cx = x + enemy.width / 2;
    const cy = y + enemy.height / 2 + 0.5;
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.beginPath();
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#A89B8C";
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#7D7266";
    let phase = 0;
    if (enemy.state === "rolling") {
      phase = (performance.now() / 40) * enemy.direction;
    }
    for (let k = -1; k < 4; k++) {
      const stripeX = x + ((((phase + k * 5) % 15) + 15) % 15) - 1;
      ctx.fillRect(stripeX, y, 2, enemy.height + 1);
    }
    ctx.restore();
  }

  // Red Bandit: kaala hat, laal bandana, gusse wali aankhein (abhi sirf rectangles)
  function drawPatrolBandit(enemy, x, y) {
    if (enemy.state === "squashed") {
      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y + 7, enemy.width + 2, 8);
      ctx.fillStyle = "#C7302B";
      ctx.fillRect(x, y + 8, enemy.width, 6);
      return;
    }

    // Sharir
    ctx.fillStyle = CONFIG.colors.outline;
    ctx.fillRect(x - 1, y - 1, enemy.width + 2, enemy.height + 2);
    ctx.fillStyle = "#4A2F1B";
    ctx.fillRect(x, y, enemy.width, enemy.height);

    // Hat ka kinara
    ctx.fillStyle = "#2B2B2B";
    ctx.fillRect(x - 1, y + 2, enemy.width + 2, 2);
    ctx.fillRect(x + 2, y - 2, enemy.width - 4, 4);

    // Chehra
    ctx.fillStyle = "#E8B58B";
    ctx.fillRect(x + 2, y + 4, enemy.width - 4, 4);

    // Gusse wali aankhein
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 3, y + 5, 3, 2);
    ctx.fillRect(x + 8, y + 5, 3, 2);
    ctx.fillStyle = CONFIG.colors.outline;
    const pupil = enemy.direction === 1 ? 2 : 0;
    ctx.fillRect(x + 3 + pupil, y + 5, 1, 2);
    ctx.fillRect(x + 8 + pupil, y + 5, 1, 2);

    // Laal bandana (ledge-safe ki pehchaan)
    ctx.fillStyle = "#C7302B";
    ctx.fillRect(x + 1, y + 8, enemy.width - 2, 3);
    ctx.fillRect(x + (enemy.direction === 1 ? 0 : enemy.width - 3), y + 10, 3, 3);
  }

  // Dushman: type ke hisaab se alag look. Tumbleweed Bandit (bhoora gol) default hai.
  function drawEnemies(enemies) {
    for (const enemy of enemies) {
      if (enemy.state === "gone") {
        continue;
      }
      const x = Math.round(enemy.x);
      const y = Math.round(enemy.y);

      if (enemy.type === "patrol") {
        drawPatrolBandit(enemy, x, y);
        continue;
      }

      if (enemy.type === "armadillo") {
        drawArmadillo(enemy, x, y);
        continue;
      }

      if (enemy.type === "thrower") {
        drawThrower(enemy, x, y);
        continue;
      }

      if (enemy.type === "vulture") {
        drawVulture(enemy, x, y);
        continue;
      }

      if (enemy.state === "squashed") {
        ctx.fillStyle = CONFIG.colors.outline;
        ctx.fillRect(x - 1, y + 7, enemy.width + 2, 8);
        ctx.fillStyle = "#B08A5A";
        ctx.fillRect(x, y + 8, enemy.width, 6);
        continue;
      }

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y - 1, enemy.width + 2, enemy.height + 2);
      ctx.fillStyle = "#B08A5A";
      ctx.fillRect(x, y, enemy.width, enemy.height);

      ctx.fillStyle = "#8A6A40";
      ctx.fillRect(x + 2, y + 9, 10, 1);
      ctx.fillRect(x + 4, y + 11, 6, 1);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + 3, y + 4, 3, 3);
      ctx.fillRect(x + 8, y + 4, 3, 3);
      ctx.fillStyle = CONFIG.colors.outline;
      const pupil = enemy.direction === 1 ? 2 : 0;
      ctx.fillRect(x + 3 + pupil, y + 5, 1, 2);
      ctx.fillRect(x + 8 + pupil, y + 5, 1, 2);
      ctx.fillRect(x + 2, y + 3, 4, 1);
      ctx.fillRect(x + 8, y + 3, 4, 1);
    }
  }

  // Goliyan: chhota peela dabba, peeche halki lakeer (trail)
  function drawBullets(bullets) {
    for (const bullet of bullets) {
      const x = Math.round(bullet.x);
      const y = Math.round(bullet.y);

      // Trail goli ke peeche
      const trailX = bullet.dir === 1 ? x - 6 : x + bullet.width;
      ctx.fillStyle = "rgba(255, 241, 184, 0.6)";
      ctx.fillRect(trailX, y + 1, 6, 2);

      ctx.fillStyle = CONFIG.colors.outline;
      ctx.fillRect(x - 1, y - 1, bullet.width + 2, bullet.height + 2);
      ctx.fillStyle = "#FFE066";
      ctx.fillRect(x, y, bullet.width, bullet.height);
    }
  }

  // Cowboy: naya look cowboyArt.js mein hai. Blink yahin rehta hai.
  function drawCowboy(cowboy) {
    // Damage ke baad blink: kuch frames gayab, kuch frames dikhta
    if (cowboy.invincibleTimer > 0) {
      const blinkStep = Math.floor((cowboy.invincibleTimer * 60) / PLAYER.blinkFrames);
      if (blinkStep % 2 === 0) {
        return;
      }
    }

    drawCowboySprite(ctx, cowboy);
  }

  // Poora game-world ek frame mein banao. s = main.js ki di hui state.
  return function drawWorld(s) {
    // Parallax background (aasmaan, sooraj, badal, mesa, pahadiyan)
    drawBackground(ctx, s.camera.x);

    ctx.save();
    ctx.translate(-s.camera.x, -s.camera.y);
    drawItems(s.items);
    drawTiles(s.camera);
    drawCheckpoints(s.checkpointIndex);
    drawGoal();
    drawCoins(s.coinsTaken);
    drawCoinPops(s.coinPops);
    drawEnemies(s.enemies);
    drawBullets(s.bullets);
    drawBottles(s.bottles);
    if (s.showCowboy) {
      drawCowboy(s.cowboy);
    }
    ctx.restore();
  };
}