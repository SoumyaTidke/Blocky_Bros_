import { input } from "./input.js";

// Touch mode kab chalu ho: touch screen ho, ya address mein ?touch=1 ho (PC par test ke liye)
const params = new URLSearchParams(window.location.search);
const touchDevice =
  window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

if (touchDevice || params.get("touch") === "1") {
  document.body.classList.add("touch-mode");
}

// Har button ek action se juda hai (data-action). Dabate hi action ON, chhodte hi OFF.
const buttons = document.querySelectorAll("#touch button[data-action]");

buttons.forEach((button) => {
  const action = button.dataset.action;

  function press(event) {
    event.preventDefault();
    // Ungli button se bahar jaye tab bhi release ka pata chale
    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
    input.setTouch(action, true);
    button.classList.add("down");
  }

  function release(event) {
    event.preventDefault();
    input.setTouch(action, false);
    button.classList.remove("down");
  }

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
});

// Page chhupe ya focus hate to saare touch buttons chhod do (button atakna nahi chahiye)
function releaseAll() {
  buttons.forEach((button) => {
    input.setTouch(button.dataset.action, false);
    button.classList.remove("down");
  });
}
window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", releaseAll);