// Saari tuning aur settings ek hi jagah.
// Ye sab PROPOSED starting values hain, baad mein test karke badlenge.

export const CONFIG = {
  // Game ki andar ki screen ka size (pixels mein)
  gameWidth: 384,
  gameHeight: 224,

  // Ek tile ka size
  tileSize: 16,

  // Physics hamesha 1/60 second ke fixed steps mein chalti hai
  fixedStep: 1 / 60,

  // Tab switch ke baad bahut bada time-jump rokne ke liye
  maxFrameTime: 0.25,

  // Camera
  camera: {
    // Cowboy screen ke left se kitne hisse par rahe (0.4 = 40%)
    playerScreenFraction: 0.4,
    // true = test ke liye peeche bhi ja sakte hain. Asli level mein false karenge.
    allowBackwardScroll: true
  },

  // Colors (hamare palette se)
  colors: {
    sky: "#8EC5E8",
    grass: "#5FA052",
    dirt: "#8B5A2B",
    outline: "#1A1A1A",
    cowboyShirt: "#3A6EA5"
  }
};

// Cowboy ki movement values (pixels per second, aur pixels per second^2)
export const PHYSICS = {
  // Zameen par left-right
  walkAcceleration: 420,
  runAcceleration: 620,
  maxWalkSpeed: 95,
  maxRunSpeed: 165,
  groundFriction: 520,
  turnAcceleration: 900,
  skidThreshold: 90,
  minMoveSpeed: 10,
  stopThreshold: 5,

  // Hawa mein left-right
  airAcceleration: 420,
  airTurnAcceleration: 700,
  airDrag: 160,

  // Jump
  jumpVelocity: -315,
  risingGravity: 820,
  fallingGravity: 1450,
  jumpCutGravity: 2600,
  maxFallSpeed: 390,
  coyoteTime: 0.08,
  jumpBuffer: 0.10
};

// Dushman ki values (PROPOSED starting values, physics spec se)
export const ENEMY = {
  walker: {
    width: 14,
    height: 14,
    speed: 35,             // pixels per second
    gravity: 1450,
    maxFallSpeed: 390,
    squashTime: 0.3,       // kuchalne ke baad kitni der dikhe (seconds)
    points: 100
  },
  stompBounce: -200,       // dushman ko kuchalne ke baad cowboy ki upar ki speed
  stompTolerance: 4        // pixels: cowboy ka pichhla "paer" dushman ke sir se itna neeche tak bhi chalega
};

// Game ke rules (PROPOSED starting values, gameplay spec se)
export const GAMEPLAY = {
  startLives: 3,
  gameOverLockTime: 1   // Game Over ke baad itni der retry nahi hota (seconds)
};

// Cowboy ka size aur damage (PROPOSED starting values, physics spec se)
export const PLAYER = {
  width: 12,
  smallHeight: 14,
  bigHeight: 24,
  invincibleTime: 1.2,   // damage ke baad kitni der dushman nahi chhoo sakta (seconds)
  blinkFrames: 4         // itne frames par blink badalta hai
};

// Items (PROPOSED starting values)
export const ITEM = {
  growth: {
    width: 14,
    height: 14,
    riseDistance: 16,    // crate se kitna upar uthta hai (pixels)
    riseTime: 0.4,       // kitni der mein (seconds)
    speed: 55,           // phir right chalta hai (pixels per second)
    gravity: 1450,
    maxFallSpeed: 390,
    points: 1000
  }
};

// Chili pepper power-up (PROPOSED starting values, physics spec se)
export const CHILI = {
  width: 14,
  height: 14,
  riseDistance: 16,   // crate se kitna upar uthta hai (pixels)
  riseTime: 0.4,      // kitni der mein (seconds)
  points: 1000
};

// Revolver goli (PROPOSED starting values, physics spec se)
export const BULLET = {
  speed: 300,        // pixels per second
  width: 6,
  height: 4,
  lifetime: 1.2,     // seconds
  maxActive: 2,      // ek saath kitni goliyan udti reh sakti hain
  cooldown: 0.25     // do goliyon ke beech kam se kam kitna time (seconds)
};

// Teen checkpoints (PROPOSED): har ek dabba, left-upar tile aur size tiles mein.
export const CHECKPOINTS = [
  { col: 58, row: 11, widthTiles: 1, heightTiles: 2 },
  { col: 116, row: 11, widthTiles: 1, heightTiles: 2 },
  { col: 144, row: 11, widthTiles: 1, heightTiles: 2 }
];

// Coins (PROPOSED starting values): drawing aur game dono yahin se padhte hain
export const COIN = {
  size: 10,         // coin ka dabba (pixels)
  points: 100,      // ek coin ke points
  crateRise: 32,    // crate se nikla coin kitna upar uthta hai (pixels)
  crateTime: 0.5    // ye kitni der dikhta hai (seconds)
};