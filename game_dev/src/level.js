import { CONFIG } from "./config.js";

// Lamba test level: 180 tiles lamba, 14 tiles oonchha. (PROPOSED: fairness pass ke baad)
// block(col, row, chaudai, oonchai): col aur row left-upar tile ka number hai.
// pit(col, chaudai): zameen mein gaddha khodta hai.
// Tile ke akshar: "." khali, "#" zameen, "?" reward crate, "U" khali (use hua) crate
const WIDTH = 180;
const HEIGHT = 14;

const grid = [];
for (let r = 0; r < HEIGHT; r++) {
  grid.push(new Array(WIDTH).fill("."));
}

function block(col, row, w, h) {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      grid[r][c] = "#";
    }
  }
}

function pit(col, w) {
  for (let c = col; c < col + w; c++) {
    grid[HEIGHT - 1][c] = ".";
  }
}

// ---------- Zameen aur gaddhe ----------
block(0, 13, WIDTH, 1);

pit(14, 2);     // gaddha 1: 2 tile
pit(44, 3);     // gaddha 2: 3 tile
pit(98, 4);     // gaddha 3: 4 tile (run se aasaan, walk se bhi timing se)
pit(120, 22);   // lamba gaddha: platforms par chadhkar paar karo
pit(163, 3);    // gaddha 4: 3 tile, seedhiyon se pehle

// ---------- Hissa 1 (tiles 0-31): safe shuruaat ----------
// Tiles 0-8 khali zameen, koi dushman nahi. Crates start ke paas.
block(9, 11, 1, 2);     // chhoti deewar: 2 tile oonchi (kudna sikho)

// ---------- Hissa 2 (tiles 32-59): stambh aur platform ----------
block(34, 10, 1, 3);    // stambh: 3 tile oonchha
block(36, 9, 4, 1);     // platform (stambh par chadhkar pahunchte hain)

// ---------- Hissa 3 (tiles 60-97): pahaad aur tairte platform ----------
block(62, 12, 1, 1);
block(63, 11, 1, 2);
block(64, 10, 1, 3);
block(65, 11, 1, 2);
block(66, 12, 1, 1);
block(72, 10, 4, 1);    // platform
block(78, 8, 4, 1);     // oonchha platform (neeche wale platform se chadhte hain)
block(84, 10, 3, 1);

// ---------- Hissa 5 (tiles 120-141): lamba gaddha, 4 platforms ----------
// Seedhi chadhai: zameen se 2 tile, phir 1-1 tile ke kadam (pehle 3 tile ka tight jump tha)
block(122, 11, 3, 1);   // pehla kadam: zameen se 2 tile oonchha
block(127, 10, 3, 1);   // 1 tile upar
block(132, 9, 3, 1);    // 1 tile upar
block(137, 10, 3, 1);   // 1 tile neeche

// ---------- Hissa 6 (tiles 142-179): dushmanon ka raasta, seedhiyan, goal ----------
block(150, 10, 4, 1);   // platform
block(156, 8, 4, 1);    // oonchha platform (risk wala coin raasta)
block(168, 12, 1, 1);   // seedhiyan
block(169, 11, 1, 2);
block(170, 10, 1, 3);
block(171, 9, 9, 4);    // oonchi chhat, goal iske upar hai

// ---------- Reward crates ----------
// item = "coin", "growth" (bada karne wala fruit) ya "power" (chili/fruit)
const CRATES = [
  { col: 3, row: 9, item: "coin" },
  { col: 4, row: 9, item: "growth" },
  { col: 5, row: 9, item: "coin" },
  { col: 70, row: 9, item: "power" },
  { col: 112, row: 9, item: "coin" },
  { col: 113, row: 9, item: "power" },
  { col: 114, row: 9, item: "coin" }
];

function placeCrates() {
  for (const c of CRATES) {
    grid[c.row][c.col] = "?";
  }
}
placeCrates();

// ---------- Coins: har coin ek tile ke beech mein rehta hai ----------
const COINS = [
  // Hissa 1
  { col: 13, row: 11 }, { col: 14, row: 10 }, { col: 15, row: 10 }, { col: 16, row: 11 },
  { col: 19, row: 12 }, { col: 20, row: 12 }, { col: 21, row: 12 },
  // Hissa 2
  { col: 37, row: 8 }, { col: 38, row: 8 },
  { col: 44, row: 10 }, { col: 45, row: 9 }, { col: 46, row: 10 },
  // Hissa 3
  { col: 73, row: 9 }, { col: 74, row: 9 },
  { col: 79, row: 7 }, { col: 80, row: 7 },
  { col: 85, row: 9 },
  // Hissa 4
  { col: 98, row: 10 }, { col: 99, row: 9 }, { col: 100, row: 9 }, { col: 101, row: 10 },
  // Hissa 5
  { col: 123, row: 9 }, { col: 125, row: 9 }, { col: 126, row: 9 },
  { col: 128, row: 9 }, { col: 130, row: 8 }, { col: 131, row: 8 },
  { col: 133, row: 8 }, { col: 135, row: 8 }, { col: 136, row: 9 },
  { col: 138, row: 9 },
  // Hissa 6
  { col: 157, row: 7 }, { col: 158, row: 7 },
  { col: 163, row: 10 }, { col: 164, row: 9 }, { col: 165, row: 10 },
  { col: 173, row: 8 }, { col: 174, row: 8 }
];

// Goal: oonchi chhat ke upar khada pole (3 tile oonchha).
const GOAL = { col: 176, row: 6, widthTiles: 1, heightTiles: 3 };

// Dushman: har ek { col, row } tile par shuru hota hai (row = zameen ke upar wala tile).
// Tile 106 wala hata diya (wo aksar gaddhe mein gir jata tha).
// Aakhri 3 ab 150, 155, 160 par hain (checkpoint 144 se 6 tile door).
const ENEMIES = [
  { col: 26, row: 12 },
  { col: 41, row: 12, type: "thrower" },   // Bottle Bandit: stambh (tile 34) ke peeche se aane par bottle
  { col: 52, row: 12 },
  { col: 66, row: 6, type: "vulture" },   // Vulture: pehle checkpoint (58) ke baad, khuli zameen par
  { col: 73, row: 9, type: "patrol" },    // Red Bandit: tile 72-75 ke platform par
  { col: 8, row: 9, type: "vulture" },    // Vulture: hawa mein hover karta hai, zameen se lagbhag 3 tile oopar
  { col: 14, row: 12, type: "boss" },   // Boss: abhi test ke liye shuruat ke paas
  { col: 80, row: 12 },
  { col: 89, row: 12, type: "armadillo" },   // Armadillo: gaddha 3 se pehle ki chaudi zameen par
  { col: 95, row: 12 },                      // Tumbleweed: laat khaya shell ise maar sakta hai

  { col: 111, row: 12 },
  { col: 150, row: 12 },
  { col: 151, row: 9, type: "patrol" },   // Red Bandit: tile 150-153 ke platform par
  { col: 155, row: 12 },
  { col: 160, row: 12 }
];

export const level = {
  tileSize: CONFIG.tileSize,
  width: WIDTH,
  height: HEIGHT,
  rows: grid,
  coins: COINS,
  goal: GOAL,
  enemies: ENEMIES,
  crates: CRATES,

  // Is jagah ka crate (nahi to undefined)
  crateAt(col, row) {
    return CRATES.find((c) => c.col === col && c.row === row);
  },

  // Saare crates wapas "?" bana do (game naye sire se shuru hone par)
  resetCrates() {
    placeCrates();
  },

  // Growth aur power wale crates wapas "?" bana do (cowboy marne ke baad)
  resetGrowthCrates() {
    for (const c of CRATES) {
      if (c.item === "growth" || c.item === "power") {
        grid[c.row][c.col] = "?";
      }
    }
  },

  // Is tile par solid hai ya nahi?
  isSolid(col, row) {
    // Left aur right ki seema deewar ki tarah solid hai
    if (col < 0 || col >= this.width) {
      return true;
    }
    // Neeche aur upar khula hai: gaddhe mein cowboy gir sakta hai
    if (row < 0 || row >= this.height) {
      return false;
    }
    const ch = this.rows[row][col];
    return ch === "#" || ch === "?" || ch === "U";
  }
};