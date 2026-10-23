import { CONFIG } from "./config.js";

// Rang (PROPOSED): hamare palette se. Cowboy sabse alag dikhna chahiye.
const C = {
  outline: CONFIG.colors.outline,
  hat: "#5B3A1E",
  hatLight: "#7A4E2D",
  hatBand: "#3A2412",
  skin: "#E8B58B",
  shirt: CONFIG.colors.cowboyShirt,
  shirtLight: "#5B8FC7",
  vest: "#7A4E2D",
  bandana: "#C7302B",
  bandanaDark: "#9C2420",
  trousers: "#4A2F1B",
  boots: "#2E1D10",
  belt: "#2E1D10",
  gold: "#F2C14E",
  gun: "#9AA0A6",
  holster: "#3A2412",
  dust: "#E8D9C0"
};

// Cowboy ko rectangles se banata hai. Hitbox (cowboy.x, y, width, height) wahi rehta hai,
// sirf dikhne wala hissa thoda bahar tak jata hai (topi ka kinara, bandana ki poonchh).
// partsOut: sirf jaanch ke liye, game mein nahi chahiye.
export function drawCowboySprite(ctx, cowboy, partsOut) {
  const x0 = Math.round(cowboy.x);
  const y0 = Math.round(cowboy.y);
  const W = cowboy.width;
  const H = cowboy.height;
  const big = cowboy.big;
  const sharp = cowboy.sharp;
  const dir = cowboy.facing === -1 ? -1 : 1;

  const parts = [];
  // P: x, y hitbox ke left-upar se naape jaate hain, aur facing ke hisaab se ulte (mirror) ho jaate hain
  function P(x, y, w, h, color, detail) {
    const px = dir === 1 ? x : W - x - w;
    parts.push({ x: x0 + px, y: y0 + y, w: w, h: h, color: color, detail: !!detail });
  }

  const moving = Math.abs(cowboy.vx) > 8;
  const inAir = !cowboy.onGround;
  const rising = inAir && cowboy.vy < 0;
  const frame = !inAir && moving ? Math.floor(Math.abs(cowboy.x) / 4) % 2 : 0;

  // Naap
  const faceH = big ? 4 : 3;
  const torsoTop = 5 + faceH;               // chhota: 8, bada: 9
  const legH = big ? 7 : 3;
  const legTop = H - legH;
  const torsoH = legTop - torsoTop;
  const bootH = big ? 3 : 2;

  // Skid ki dhool (sabse peeche, pehle banti hai)
  if (cowboy.skidding) {
    const back = cowboy.vx > 0 ? -1 : 1;
    const dx = back < 0 ? -5 : W + 1;
    parts.push({ x: x0 + dx, y: y0 + H - 3, w: 4, h: 2, color: C.dust, detail: true });
    parts.push({ x: x0 + dx + (back < 0 ? -3 : 3), y: y0 + H - 5, w: 3, h: 2, color: C.dust, detail: true });
  }

  // Bandana ki poonchh (peeche ki taraf)
  P(-1, 4 + faceH, sharp ? 4 : 3, sharp ? 3 : 2, C.bandanaDark);

  // Paer
  let legL;
  let legR;
  if (inAir) {
    legL = { x: 2, y: legTop, h: rising ? legH - 1 : legH };
    legR = { x: 7, y: legTop, h: rising ? legH - 1 : legH };
  } else if (moving && frame === 0) {
    legL = { x: 2, y: legTop, h: legH };
    legR = { x: 7, y: legTop + 1, h: legH - 1 };
  } else if (moving) {
    legL = { x: 3, y: legTop + 1, h: legH - 1 };
    legR = { x: 6, y: legTop, h: legH };
  } else {
    legL = { x: 3, y: legTop, h: legH };
    legR = { x: 7, y: legTop, h: legH };
  }
  for (const leg of [legL, legR]) {
    P(leg.x, leg.y, 3, leg.h, C.trousers);
    P(leg.x, leg.y + leg.h - bootH, 3, bootH, C.boots, true);
  }

  // Dhad (kameez), vest, belt
  P(2, torsoTop, 8, torsoH, C.shirt);
  P(4, torsoTop, 4, 1, C.shirtLight, true);
  P(2, torsoTop, 2, torsoH, C.vest, true);
  P(8, torsoTop, 2, torsoH, C.vest, true);
  P(2, legTop - 1, 8, 1, C.belt, true);
  if (big) {
    // Bade cowboy ka vest zyada detail wala: buttons aur belt ka buckle
    P(5, torsoTop + 2, 2, 1, C.gold, true);
    P(5, torsoTop + 5, 2, 1, C.gold, true);
    P(5, legTop - 1, 2, 1, C.gold, true);
  }

  // Baahein: chalte waqt jhoolti hain, hawa mein upar
  let armLY = torsoTop;
  let armRY = torsoTop;
  if (rising) {
    armLY = torsoTop - 2;
    armRY = torsoTop - 2;
  } else if (!inAir && moving) {
    armLY = torsoTop + (frame === 0 ? 1 : 0);
    armRY = torsoTop + (frame === 0 ? 0 : 1);
  }
  P(0, armLY, 2, 3, C.shirt);
  P(10, armRY, 2, 3, C.shirt);
  if (rising) {
    P(0, armLY - 1, 2, 1, C.skin, true);
    P(10, armRY - 1, 2, 1, C.skin, true);
  } else {
    P(0, armLY + 3, 2, 1, C.skin, true);
    P(10, armRY + 3, 2, 1, C.skin, true);
  }

  // Sharpshooter: seene par sone ka sitara, kamar par holster aur revolver
  if (sharp) {
    P(5, torsoTop + 1, 2, 2, C.gold, true);
    P(8, legTop - 2, 4, 4, C.holster);
    P(9, legTop - 3, 2, 1, C.gun, true);
  }

  // Chehra, bandana, aankh
  P(3, 3, 6, faceH, C.skin);
  P(2, 3 + faceH, 8, 2, C.bandana);
  P(7, 4, 1, 1, C.outline, true);

  // Topi: bhoora crown, chaudi kinari, gehri patti
  P(2, -3, 8, 4, C.hat);
  P(-2, 1, 16, 2, C.hat);
  P(3, -3, 3, 1, C.hatLight, true);
  P(2, 0, 8, 1, C.hatBand, true);

  // Pehle outline, phir rang
  ctx.fillStyle = C.outline;
  for (const p of parts) {
    if (!p.detail) {
      ctx.fillRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
    }
  }
  for (const p of parts) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  if (partsOut) {
    partsOut.push(...parts);
  }
}