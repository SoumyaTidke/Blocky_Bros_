import { CONFIG } from "./config.js";

// Camera ek chhoti si cheez hai: x batata hai level ka kaunsa hissa screen ke left par hai.
export function createCamera() {
  return { x: 0, y: 0 };
}

// Camera cowboy ke peeche chalta hai, level ke kinaron se bahar nahi jata.
export function updateCamera(camera, player, level) {
  const levelPixelWidth = level.width * level.tileSize;
  const maxX = Math.max(0, levelPixelWidth - CONFIG.gameWidth);

  // Cowboy ko screen ke left se 40% par rakhne ki koshish (aage ka level zyada dikhe)
  const target = player.x + player.width / 2 - CONFIG.gameWidth * CONFIG.camera.playerScreenFraction;

  let newX = Math.min(maxX, Math.max(0, target));

  // Agar peeche scroll mana ho, to camera sirf aage ja sakta hai
  if (!CONFIG.camera.allowBackwardScroll && newX < camera.x) {
    newX = camera.x;
  }

  // Pixel saaf dikhe, isliye poora number
  camera.x = Math.round(newX);
}