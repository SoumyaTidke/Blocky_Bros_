// Awaazein Web Audio se khud banti hain (koi sound file nahi).
// Browser awaaz tabhi chalne deta hai jab pehle kisi key ya touch se page use hua ho.

let audioCtx = null;
let muted = false;
const VOLUME = 0.15;         // PROPOSED: sound effects ka volume
const MUSIC_VOLUME = 0.06;   // PROPOSED: music effects se dheema

function getContext() {
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) {
      return null;
    }
    audioCtx = new AudioClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pehli key ya touch par audio tayyar kar do
window.addEventListener("keydown", getContext);
window.addEventListener("pointerdown", getContext);

// M dabane par awaaz band/chalu
window.addEventListener("keydown", (event) => {
  if (event.code === "KeyM") {
    muted = !muted;
  }
});

// Ek chhoti "beep": startFreq se endFreq tak badalti hai
function tone(startFreq, endFreq, duration, type, delay, volume) {
  const ac = getContext();
  if (!ac || muted) {
    return;
  }
  const t0 = ac.currentTime + (delay || 0);
  const vol = volume || VOLUME;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Notes ki list ek ke baad ek bajao
function melody(freqs, step, noteLength, type) {
  freqs.forEach((f, i) => {
    tone(f, f, noteLength, type, i * step);
  });
}

// ---------- Background music ----------
// Har step ek aadha beat hai. 0 ka matlab khamoshi.
const MUSIC_BPM = 130;
const MUSIC_STEP = 60 / MUSIC_BPM / 2;
const LEAD = [
  523, 0, 659, 0, 784, 659, 523, 0,
  587, 0, 698, 0, 880, 698, 587, 0,
  523, 0, 659, 784, 1047, 784, 659, 523,
  392, 0, 494, 587, 784, 587, 494, 392
];
const BASS = [
  131, 131, 131, 131, 131, 131, 131, 131,
  175, 175, 175, 175, 175, 175, 175, 175,
  131, 131, 131, 131, 131, 131, 131, 131,
  196, 196, 196, 196, 196, 196, 196, 196
];

let musicTimer = null;
let musicStepIndex = 0;
let nextNoteTime = 0;

// Thoda aage tak ke notes pehle se schedule karte hain, taaki dhun atke nahi
function musicScheduler() {
  const ac = audioCtx;
  if (!ac || ac.state !== "running") {
    return;   // abhi audio chalu nahi hua (pehli key/touch ka intezaar)
  }
  if (nextNoteTime < ac.currentTime) {
    nextNoteTime = ac.currentTime + 0.05;
  }
  while (nextNoteTime < ac.currentTime + 0.2) {
    if (!muted) {
      const lead = LEAD[musicStepIndex];
      if (lead > 0) {
        tone(lead, lead, MUSIC_STEP * 0.9, "square", nextNoteTime - ac.currentTime, MUSIC_VOLUME);
      }
      if (musicStepIndex % 4 === 0) {
        tone(BASS[musicStepIndex], BASS[musicStepIndex], MUSIC_STEP * 3, "triangle", nextNoteTime - ac.currentTime, MUSIC_VOLUME * 1.5);
      }
    }
    nextNoteTime += MUSIC_STEP;
    musicStepIndex = (musicStepIndex + 1) % LEAD.length;
  }
}

export const sound = {
  play(name) {
    if (name === "jump") {
      tone(280, 560, 0.15, "square");
    } else if (name === "coin") {
      tone(880, 880, 0.07, "square");
      tone(1320, 1320, 0.12, "square", 0.07);
    } else if (name === "stomp") {
      tone(300, 80, 0.12, "sawtooth");
    } else if (name === "shoot") {
      tone(900, 200, 0.09, "sawtooth");
    } else if (name === "crate") {
      tone(160, 90, 0.09, "square");
    } else if (name === "powerup") {
      melody([523, 659, 784, 1047], 0.08, 0.1, "square");
    } else if (name === "hurt") {
      tone(420, 90, 0.3, "sawtooth");
    } else if (name === "death") {
      melody([392, 330, 262, 196], 0.14, 0.2, "triangle");
    } else if (name === "checkpoint") {
      melody([660, 880], 0.1, 0.14, "square");
    } else if (name === "clear") {
      melody([523, 659, 784, 1047, 784, 1047], 0.11, 0.14, "square");
    } else if (name === "throw") {
      tone(200, 650, 0.12, "triangle", 0, 0.12);
    } else if (name === "bottleBreak") {
      tone(1800, 400, 0.08, "square", 0, 0.1);
      tone(1200, 300, 0.1, "sawtooth", 0.04, 0.08);
    } else if (name === "bossCharge") {
      tone(140, 60, 0.4, "sawtooth", 0, 0.2);
    } else if (name === "bossHit") {
      tone(220, 60, 0.15, "square", 0, 0.2);
      tone(700, 200, 0.12, "sawtooth", 0.05, 0.12);
    } else if (name === "bossDown") {
      melody([392, 330, 262, 196, 131], 0.1, 0.18, "sawtooth");
    } else if (name === "throw") {
      tone(200, 650, 0.12, "triangle", 0, 0.12);
    } else if (name === "bottleBreak") {
      tone(1800, 400, 0.08, "square", 0, 0.1);
      tone(1200, 300, 0.1, "sawtooth", 0.04, 0.08);
    } else if (name === "bossCharge") {
      tone(140, 60, 0.4, "sawtooth", 0, 0.2);
    } else if (name === "bossHit") {
      tone(220, 60, 0.15, "square", 0, 0.2);
      tone(700, 200, 0.12, "sawtooth", 0.05, 0.12);
    } else if (name === "bossDown") {
      melody([392, 330, 262, 196, 131], 0.1, 0.18, "sawtooth");
    }
  },

  // Music shuru (dhun shuru se). Pehle se chal rahi ho to kuch nahi karta.
  musicStart() {
    if (musicTimer !== null) {
      return;
    }
    musicStepIndex = 0;
    nextNoteTime = 0;
    musicTimer = setInterval(musicScheduler, 50);
  },

  musicStop() {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  },

  isMuted() {
    return muted;
  }
};