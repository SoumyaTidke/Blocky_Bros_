import { CONFIG } from "./config.js";

const W = CONFIG.gameWidth;
const H = CONFIG.gameHeight;
const T = CONFIG.tileSize;

// Zameen ki upari line (row 13). Isse upar background, isse neeche gehra khaali hissa (gaddhe).
const GROUND_TOP = 13 * T;

// Rang (PROPOSED): halke aur dhundhle, taaki tiles, cowboy aur dushman saaf alag dikhein
const COLORS = {
  skyBands: ["#78B6E3", "#8CC4EA", "#A2D0EE", "#BADDF3"],   // upar se neeche
  sun: "#FFE9A8",
  sunGlow: "#FFF4CC",
  cloud: "#FFFFFF",
  cloudShade: "#DCEAF4",
  mesaBody: "#C7A892",
  mesaShade: "#B79783",
  mesaCap: "#D2B6A2",
  hill: "#98C185",
  hillShade: "#88B375",
  pit: "#2A1D14"     // gaddhe: gehra bhoora-kaala
};

// Parallax: level 1.0x chalta hai. Chhota number = door ki cheez, dheere khiskti hai.
const PARALLAX = {
  clouds: 0.1,
  mesas: 0.2,
  hills: 0.4
};

// Har parat ek chhote hisse (period) ko baar-baar doharati hai, taaki level kitna bhi lamba ho,
// background khatam na ho. margin = sabse chaudi cheez ki chaudai ke barabar.
const CLOUDS = {
  period: 520,
  margin: 64,
  items: [
    { x: 40, y: 30, w: 44 },
    { x: 200, y: 58, w: 32 },
    { x: 330, y: 24, w: 52 },
    { x: 460, y: 48, w: 36 }
  ]
};

const MESAS = {
  period: 480,
  margin: 96,
  items: [
    { x: 30, w: 70, h: 60 },
    { x: 170, w: 50, h: 42 },
    { x: 290, w: 90, h: 72 },
    { x: 420, w: 40, h: 34 }
  ]
};

const HILLS = {
  period: 520,
  margin: 120,
  items: [
    { x: 60, w: 120, h: 36 },
    { x: 250, w: 90, h: 26 },
    { x: 400, w: 110, h: 32 }
  ]
};

// Camera ke saath khiskne ke baad x ko [-margin, period - margin) ke andar ghuma do
function wrapX(x, period, margin) {
  return Math.round((((x + margin) % period) + period) % period - margin);
}

function drawSky(ctx) {
  const bandHeight = GROUND_TOP / COLORS.skyBands.length;
  for (let i = 0; i < COLORS.skyBands.length; i++) {
    ctx.fillStyle = COLORS.skyBands[i];
    ctx.fillRect(0, Math.round(i * bandHeight), W, Math.ceil(bandHeight) + 1);
  }
}

function drawSun(ctx) {
  // Sooraj screen par ek hi jagah rehta hai (bahut door hai)
  ctx.fillStyle = COLORS.sunGlow;
  ctx.beginPath();
  ctx.arc(318, 40, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(318, 40, 15, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, w) {
  ctx.fillStyle = COLORS.cloud;
  ctx.fillRect(x, y + 6, w, 8);
  ctx.fillRect(x + 6, y + 2, w - 14, 6);
  ctx.fillRect(x + Math.round(w * 0.35), y - 2, Math.round(w * 0.35), 6);
  ctx.fillStyle = COLORS.cloudShade;
  ctx.fillRect(x, y + 12, w, 2);
}

function drawClouds(ctx, cameraX) {
  const shift = cameraX * PARALLAX.clouds;
  for (const c of CLOUDS.items) {
    drawCloud(ctx, wrapX(c.x - shift, CLOUDS.period, CLOUDS.margin), c.y, c.w);
  }
}

function drawMesas(ctx, cameraX) {
  const shift = cameraX * PARALLAX.mesas;
  for (const m of MESAS.items) {
    const x = wrapX(m.x - shift, MESAS.period, MESAS.margin);
    const top = GROUND_TOP - m.h;

    // Chaudi deewar, aur upar chhoti topi
    ctx.fillStyle = COLORS.mesaBody;
    ctx.fillRect(x, top, m.w, m.h);
    ctx.fillStyle = COLORS.mesaShade;
    ctx.fillRect(x, top + Math.round(m.h * 0.55), m.w, Math.round(m.h * 0.45));
    ctx.fillStyle = COLORS.mesaCap;
    ctx.fillRect(x + 4, top - 6, m.w - 8, 6);
  }
}

// Pahadi: gol topi, 2 pixel ki patti-patti mein (pixel-art jaisa)
function drawHill(ctx, x, w, h) {
  for (let r = 0; r < h; r += 2) {
    const t = r / h;                                  // 0 = chotti, 1 = zameen
    const half = (w / 2) * Math.sqrt(1 - (1 - t) * (1 - t));
    ctx.fillStyle = r > h * 0.6 ? COLORS.hillShade : COLORS.hill;
    ctx.fillRect(Math.round(x + w / 2 - half), GROUND_TOP - h + r, Math.round(half * 2), 2);
  }
}

function drawHills(ctx, cameraX) {
  const shift = cameraX * PARALLAX.hills;
  for (const hill of HILLS.items) {
    drawHill(ctx, wrapX(hill.x - shift, HILLS.period, HILLS.margin), hill.w, hill.h);
  }
}

// Zameen ke neeche ka hissa: gaddhe yahan dikhte hain, isliye gehra rang
function drawBelowGround(ctx) {
  ctx.fillStyle = COLORS.pit;
  ctx.fillRect(0, GROUND_TOP, W, H - GROUND_TOP);
}

// Poora background, door se paas ke order mein
export function drawBackground(ctx, cameraX) {
  drawSky(ctx);
  drawSun(ctx);
  drawClouds(ctx, cameraX);
  drawMesas(ctx, cameraX);
  drawHills(ctx, cameraX);
  drawBelowGround(ctx);
}