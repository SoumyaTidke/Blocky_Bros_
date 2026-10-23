import { PHYSICS, PLAYER } from "./config.js";

// Naya cowboy banao (hamesha chhota)
export function createPlayer(x, y) {
  return {
    x: x,
    y: y,
    width: PLAYER.width,
    height: PLAYER.smallHeight,
    vx: 0,              // left-right speed (pixels per second)
    vy: 0,              // upar-neeche speed (negative = upar)
    facing: 1,          // 1 = right, -1 = left
    skidding: false,
    onGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpWasDown: false,
    jumpStartY: y,
    lastJumpHeight: 0,  // TEST: pichhli jump kitni oonchi gayi (pixels)
    big: false, 
    sharp: false,        // bada cowboy?
    invincibleTimer: 0, // damage ke baad bacha hua safe time (seconds)
    bumpedTile: null    // is step mein sir kis tile se takraya
  };
}

// ---------- Bada / chhota hona ----------

// Ye dabba kisi solid tile ko chhoota hai?
function boxHitsSolid(level, x, y, w, h) {
  const T = level.tileSize;
  const top = Math.floor(y / T);
  const bottom = Math.floor((y + h - 0.001) / T);
  const left = Math.floor(x / T);
  const right = Math.floor((x + w - 0.001) / T);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        return true;
      }
    }
  }
  return false;
}

// Cowboy ko bada karo (paer wahin rehte hain, sir upar badhta hai).
// Return true agar bada ho gaya. Upar chhat ho to false (item baad mein phir milega).
export function growPlayer(player, level) {
  if (player.big) {
    return true;
  }
  const extra = PLAYER.bigHeight - PLAYER.smallHeight;
  if (boxHitsSolid(level, player.x, player.y - extra, player.width, PLAYER.bigHeight)) {
    return false;
  }
  player.y -= extra;
  player.height = PLAYER.bigHeight;
  player.big = true;
  return true;
}

// Cowboy ko chhota karo (paer wahin rehte hain)
export function shrinkPlayer(player) {
  if (!player.big) {
    return;
  }
  const extra = PLAYER.bigHeight - PLAYER.smallHeight;
  player.y += extra;
  player.height = PLAYER.smallHeight;
  player.big = false;
  player.sharp = false;
}

// ---------- Collision ----------

// Left-right: cowboy ko solid tile se bahar dhakelo
function resolveX(player, level) {
  const T = level.tileSize;
  const top = Math.floor(player.y / T);
  const bottom = Math.floor((player.y + player.height - 0.001) / T);
  const left = Math.floor(player.x / T);
  const right = Math.floor((player.x + player.width - 0.001) / T);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        if (player.vx > 0) {
          player.x = col * T - player.width;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = (col + 1) * T;
          player.vx = 0;
        }
        return;
      }
    }
  }
}

// Upar-neeche: zameen par utaro, ya chhat se takrao
function resolveY(player, level) {
  const T = level.tileSize;
  const left = Math.floor(player.x / T);
  const right = Math.floor((player.x + player.width - 0.001) / T);

  player.onGround = false;
  player.bumpedTile = null;

  if (player.vy > 0) {
    // Neeche aa raha hai
    const row = Math.floor((player.y + player.height) / T);
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        player.y = row * T - player.height;
        player.vy = 0;
        player.onGround = true;
        return;
      }
    }
  } else if (player.vy < 0) {
    // Upar ja raha hai
    const row = Math.floor(player.y / T);
    for (let col = left; col <= right; col++) {
      if (level.isSolid(col, row)) {
        player.y = (row + 1) * T;
        player.vy = 0;
        player.bumpedTile = { col: col, row: row };
        return;
      }
    }
  }
}

// ---------- Movement ----------

// Left-right movement ka hissa
function updateHorizontal(player, dt, input, level) {
  const dir = (input.isDown("right") ? 1 : 0) - (input.isDown("left") ? 1 : 0);
  const running = input.isDown("run");
  const grounded = player.onGround;

  const maxSpeed = running ? PHYSICS.maxRunSpeed : PHYSICS.maxWalkSpeed;
  let accel = running ? PHYSICS.runAcceleration : PHYSICS.walkAcceleration;
  let turnAccel = PHYSICS.turnAcceleration;
  let slowDown = PHYSICS.groundFriction;

  if (!grounded) {
    accel = PHYSICS.airAcceleration;
    turnAccel = PHYSICS.airTurnAcceleration;
    slowDown = PHYSICS.airDrag;
  }

  player.skidding = false;

  if (dir !== 0) {
    player.facing = dir;

    const movingOpposite = player.vx !== 0 && Math.sign(player.vx) !== dir;

    if (movingOpposite) {
      if (grounded && Math.abs(player.vx) > PHYSICS.skidThreshold) {
        player.skidding = true;
      }
      player.vx += dir * turnAccel * dt;
    } else {
      let speed = Math.abs(player.vx);

      if (speed < PHYSICS.minMoveSpeed) {
        speed = PHYSICS.minMoveSpeed;
      }

      if (speed < maxSpeed) {
        speed = Math.min(maxSpeed, speed + accel * dt);
      } else {
        speed = Math.max(maxSpeed, speed - slowDown * dt);
      }

      player.vx = dir * speed;
    }
  } else {
    const speed = Math.abs(player.vx);
    const newSpeed = speed - slowDown * dt;

    if (newSpeed < PHYSICS.stopThreshold) {
      player.vx = 0;
    } else {
      player.vx = Math.sign(player.vx) * newSpeed;
    }
  }

  // Pehle hilao, phir deewar se bahar nikalo
  player.x += player.vx * dt;
  resolveX(player, level);
}

// Upar-neeche movement aur jump ka hissa
function updateVertical(player, dt, input, level) {
  const jumpDown = input.isDown("jump");

  if (jumpDown && !player.jumpWasDown) {
    player.jumpBufferTimer = PHYSICS.jumpBuffer;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }
  player.jumpWasDown = jumpDown;

  if (player.onGround) {
    player.coyoteTimer = PHYSICS.coyoteTime;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = PHYSICS.jumpVelocity;
    player.onGround = false;
    player.jumpBufferTimer = 0;
    player.coyoteTimer = 0;
    player.jumpStartY = player.y;
    player.lastJumpHeight = 0;
  }

  let gravity;
  if (player.vy < 0) {
    gravity = jumpDown ? PHYSICS.risingGravity : PHYSICS.jumpCutGravity;
  } else {
    gravity = PHYSICS.fallingGravity;
  }

  player.vy += gravity * dt;
  if (player.vy > PHYSICS.maxFallSpeed) {
    player.vy = PHYSICS.maxFallSpeed;
  }

  // Pehle hilao, phir zameen/chhat se resolve karo
  player.y += player.vy * dt;
  resolveY(player, level);

  // TEST: jump kitni oonchi gayi
  if (!player.onGround) {
    player.lastJumpHeight = Math.max(player.lastJumpHeight, player.jumpStartY - player.y);
  }
}

// Cowboy ka ek poora physics step: pehle X, phir Y
export function updatePlayer(player, dt, input, level) {
  updateHorizontal(player, dt, input, level);
  updateVertical(player, dt, input, level);
}