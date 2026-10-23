import { PHYSICS } from "./config.js";

// Ye panel sirf ?debug=1 wale address par dikhta hai.
// Sliders PHYSICS ki values seedhe badalte hain, aur cowboy ka code unhe har step mein padhta hai.
const params = new URLSearchParams(window.location.search);

if (params.get("debug") === "1") {
  // [naam, label, min, max, step]
  const FIELDS = [
    ["walkAcceleration", "Walk acceleration", 100, 1000, 10],
    ["runAcceleration", "Run acceleration", 100, 1200, 10],
    ["maxWalkSpeed", "Max walk speed", 40, 200, 1],
    ["maxRunSpeed", "Max run speed", 80, 300, 1],
    ["groundFriction", "Ground friction (slide)", 100, 1200, 10],
    ["turnAcceleration", "Turn / skid brake", 200, 1800, 10],
    ["airAcceleration", "Air acceleration", 100, 1000, 10],
    ["airTurnAcceleration", "Air turn", 100, 1400, 10],
    ["airDrag", "Air drag", 0, 600, 10],
    ["jumpVelocity", "Jump power (minus = up)", -450, -200, 5],
    ["risingGravity", "Gravity rising (button held)", 400, 1500, 10],
    ["fallingGravity", "Gravity falling", 800, 2500, 10],
    ["jumpCutGravity", "Gravity jump-cut (button released)", 1000, 4000, 50],
    ["maxFallSpeed", "Max fall speed", 200, 600, 10],
    ["coyoteTime", "Coyote time (s)", 0, 0.2, 0.01],
    ["jumpBuffer", "Jump buffer (s)", 0, 0.2, 0.01]
  ];

  const defaults = Object.assign({}, PHYSICS);

  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;top:8px;right:8px;width:290px;max-height:calc(100vh - 16px);" +
    "overflow-y:auto;padding:8px 10px;background:rgba(0,0,0,0.78);color:#fff;" +
    "font:12px/1.35 Consolas,'Courier New',monospace;border-radius:6px;z-index:20;";

  const title = document.createElement("div");
  title.textContent = "MOVEMENT TUNING (press T to hide/show)";
  title.style.cssText = "font-weight:bold;margin-bottom:6px;";
  panel.appendChild(title);

  const valueLabels = {};
  const sliders = {};

  const output = document.createElement("pre");
  output.style.cssText =
    "margin:4px 0 0;padding:6px;background:rgba(255,255,255,0.1);" +
    "user-select:text;white-space:pre;";

  function refreshOutput() {
    output.textContent = FIELDS.map(
      (f) => f[0] + ": " + PHYSICS[f[0]]
    ).join("\n");
  }

  FIELDS.forEach((field) => {
    const key = field[0];

    const row = document.createElement("div");
    row.style.cssText = "margin-bottom:4px;";

    const label = document.createElement("div");
    const valueSpan = document.createElement("span");
    valueSpan.style.cssText = "color:#F2C14E;float:right;";
    label.textContent = field[1];
    label.appendChild(valueSpan);
    valueLabels[key] = valueSpan;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = field[2];
    slider.max = field[3];
    slider.step = field[4];
    slider.value = PHYSICS[key];
    slider.style.cssText = "width:100%;margin:0;";
    sliders[key] = slider;

    valueSpan.textContent = PHYSICS[key];

    slider.addEventListener("input", () => {
      PHYSICS[key] = parseFloat(slider.value);
      valueSpan.textContent = PHYSICS[key];
      refreshOutput();
    });
    // Slider chhodte hi focus hata do, taaki Space/arrow keys game ko milen
    slider.addEventListener("change", () => slider.blur());

    row.appendChild(label);
    row.appendChild(slider);
    panel.appendChild(row);
  });

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset to original values";
  resetButton.style.cssText = "width:100%;margin:6px 0;padding:4px;";
  resetButton.addEventListener("click", () => {
    FIELDS.forEach((field) => {
      const key = field[0];
      PHYSICS[key] = defaults[key];
      sliders[key].value = defaults[key];
      valueLabels[key].textContent = defaults[key];
    });
    refreshOutput();
    resetButton.blur();
  });
  panel.appendChild(resetButton);

  const outTitle = document.createElement("div");
  outTitle.textContent = "Current values (copy these and send to me):";
  outTitle.style.cssText = "margin-top:4px;";
  panel.appendChild(outTitle);

  panel.appendChild(output);

  document.body.appendChild(panel);
  refreshOutput();

  // T dabane par panel chhupao / dikhao
  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyT") {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
  });
}