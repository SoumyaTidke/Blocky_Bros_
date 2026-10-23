// Input layer: keyboard aur touch dono yahin se jude hain.
// Game ka baaki code keys ke naam nahi jaanta, sirf actions ke naam jaanta hai.

// Kaunsi key kaunsi action hai (PROPOSED, badal sakte hain)
const KEY_MAP = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "jump",
  ArrowUp: "jump",
  KeyW: "jump",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyX: "run",
  KeyZ: "shoot",
  KeyP: "pause",
  Escape: "pause"
};

const ACTIONS = ["left", "right", "jump", "run", "shoot", "pause"];

// Abhi dabi hui keyboard keys
const heldKeys = new Set();

// Touch buttons yahan apni state likhte hain
const touchState = {};

window.addEventListener("keydown", (event) => {
  if (KEY_MAP[event.code]) {
    event.preventDefault(); // page scroll hone se roko
    heldKeys.add(event.code);
  }
});

window.addEventListener("keyup", (event) => {
  if (KEY_MAP[event.code]) {
    heldKeys.delete(event.code);
  }
});

// Window se focus hatne par sab keys chhod do, warna key "atak" sakti hai
window.addEventListener("blur", () => {
  heldKeys.clear();
});

export const input = {
  // Kya ye action abhi dabi hui hai? (keyboard ya touch, dono chalenge)
  isDown(action) {
    if (touchState[action]) {
      return true;
    }
    for (const code of heldKeys) {
      if (KEY_MAP[code] === action) {
        return true;
      }
    }
    return false;
  },

  // Touch buttons isse use karte hain
  setTouch(action, isPressed) {
    touchState[action] = isPressed;
  },

  // Screen par dikhane ke liye: abhi dabi hui actions ki list
  activeActions() {
    return ACTIONS.filter((action) => input.isDown(action));
  }
};