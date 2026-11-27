// Entry point for the news-image-20261127 bounty.
//
// When the program runs it draws the newspaper front page for Friday
// 27 November 2026 from scratch and writes it to <output-dir>/entry.png.
//
// Everything here runs on the Node standard library only: the picture is
// painted pixel by pixel into a buffer, the letters come from a small
// single-stroke alphabet defined below, and the PNG file is encoded by
// hand with node:zlib. There is no network access, no randomness, no
// clock reads and no third-party module, so two runs write identical
// bytes. Run it with:
//
//   MAKEFUN_OUTPUT_DIR=/output node main.ts
//
// When MAKEFUN_OUTPUT_DIR is not set, the image goes to /output.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const PAGE_W = 1024;
const PAGE_H = 1024;
const MARGIN = 36;
const CONTENT_W = PAGE_W - 2 * MARGIN;

// Palette: warm newsprint, dark ink, one red accent.
const PAPER = [247, 243, 232];
const INK = [18, 18, 18];
const SOFT_INK = [70, 70, 70];
const RULE = [120, 110, 95];
const ACCENT = [163, 18, 18];
const SEA = [198, 222, 235];
const LAND = [232, 214, 178];
const PANEL = [233, 226, 208];
const STORM_BG = [226, 233, 240];
const MAP_BG = [250, 248, 240];
const BALLOON_RED = [214, 72, 48];
const BALLOON_YELLOW = [240, 200, 60];
const BASKET = [122, 82, 40];
const GULF_BLUE = [40, 90, 130];
const LAND_EDGE = [150, 130, 95];

// ---------------------------------------------------------------------------
// Canvas: an RGB pixel buffer with small drawing helpers.
// ---------------------------------------------------------------------------

class Canvas {
  constructor(width, height, bg) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      this.data[i * 3] = bg[0];
      this.data[i * 3 + 1] = bg[1];
      this.data[i * 3 + 2] = bg[2];
    }
  }

  put(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 3;
    this.data[i] = color[0];
    this.data[i + 1] = color[1];
    this.data[i + 2] = color[2];
  }

  // Filled disc centred on (cx, cy) with the given radius.
  disc(cx, cy, r, color) {
    const rr = r * r;
    const x0 = Math.ceil(cx - r);
    const x1 = Math.floor(cx + r);
    const y0 = Math.ceil(cy - r);
    const y1 = Math.floor(cy + r);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rr) this.put(x, y, color);
      }
    }
  }

  // A line with round ends, w pixels thick.
  thickLine(x0, y0, x1, y1, w, color) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const r = w / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.disc(
        Math.round(x0 + (x1 - x0) * t),
        Math.round(y0 + (y1 - y0) * t),
        r,
        color,
      );
    }
  }

  line(x0, y0, x1, y1, color, w = 1) {
    this.thickLine(x0, y0, x1, y1, w, color);
  }

  hline(x0, x1, y, color, w = 1) {
    this.fillRect(x0, y, x1, y + w, color);
  }

  // Filled rectangle; x1 and y1 are exclusive edges.
  fillRect(x0, y0, x1, y1, color) {
    const ax0 = Math.max(0, Math.floor(x0));
    const ay0 = Math.max(0, Math.floor(y0));
    const ax1 = Math.min(this.width, Math.ceil(x1));
    const ay1 = Math.min(this.height, Math.ceil(y1));
    for (let y = ay0; y < ay1; y++) {
      for (let x = ax0; x < ax1; x++) this.put(x, y, color);
    }
  }

  rectOutline(x0, y0, x1, y1, color, w = 2) {
    this.fillRect(x0, y0, x1, y0 + w, color);
    this.fillRect(x0, y1 - w, x1, y1, color);
    this.fillRect(x0, y0, x0 + w, y1, color);
    this.fillRect(x1 - w, y0, x1, y1, color);
  }

  fillEllipse(cx, cy, rx, ry, color) {
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
      const t = (y - cy) / ry;
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      this.fillRect(cx - dx, y, cx + dx + 1, y + 1, color);
    }
  }

  // Ellipse outline drawn as short thick segments along its rim.
  ellipseOutline(cx, cy, rx, ry, color, w = 2) {
    const step = 2;
    let prev = null;
    for (let a = 0; a <= 360; a += step) {
      const rad = (a * Math.PI) / 180;
      const px = cx + rx * Math.cos(rad);
      const py = cy + ry * Math.sin(rad);
      if (prev) this.thickLine(prev[0], prev[1], px, py, w, color);
      prev = [px, py];
    }
  }

  // An arc of an ellipse, angles in degrees, clockwise from 3 o'clock.
  arc(cx, cy, rx, ry, a0, a1, color, w = 2) {
    const step = 2;
    let prev = null;
    for (let a = a0; a <= a1; a += step) {
      const rad = (a * Math.PI) / 180;
      const px = cx + rx * Math.cos(rad);
      const py = cy + ry * Math.sin(rad);
      if (prev) this.thickLine(prev[0], prev[1], px, py, w, color);
      prev = [px, py];
    }
  }

  // Filled polygon, given as an array of [x, y] corners.
  polygon(points, color) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of points) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        this.fillRect(Math.ceil(xs[k]), y, Math.floor(xs[k + 1]) + 1, y + 1, color);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PNG encoder: hand-built chunks, per-row filter choice, zlib deflate.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function signedByte(b) {
  return b < 128 ? b : b - 256;
}

function encodePng(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    const px = y * w * 3;
    // Pick the cheaper filter for this row: none, or "up" (difference
    // from the row above). Flat newsprint compresses far better with up.
    let costNone = 0;
    let costUp = 0;
    for (let x = 0; x < w * 3; x++) {
      const b = canvas.data[px + x];
      costNone += Math.abs(signedByte(b));
      const up = y === 0 ? 0 : canvas.data[px - w * 3 + x];
      costUp += Math.abs(signedByte((b - up) & 0xff));
    }
    if (costUp < costNone) {
      raw[rowStart] = 2;
      for (let x = 0; x < w * 3; x++) {
        const up = y === 0 ? 0 : canvas.data[px - w * 3 + x];
        raw[rowStart + 1 + x] = (canvas.data[px + x] - up) & 0xff;
      }
    } else {
      raw[rowStart] = 0;
      raw.set(canvas.data.subarray(px, px + w * 3), rowStart + 1);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// A single-stroke alphabet, drawn from polylines on a small grid.
//
// Each glyph lives on a grid 14 units tall: capitals run from y=0 to the
// baseline at y=14, lowercase bodies sit on the x-height band y=4..14,
// and descenders drop to y=18. The first number is the glyph's advance
// width in grid units; the path is a list of moves (M x,y) and lines
// (L x,y). Letters are rendered by scaling the grid to the wanted cap
// height and stroking each polyline, so one alphabet serves every size
// on the page, from the 12 px footer to the 84 px masthead.
// ---------------------------------------------------------------------------

const CAP_H = 14;

// [advance width, path]
const GLYPHS = {
  A: [11, "M0,14 L5,0 L10,14 M2.5,9 L7.5,9"],
  B: [10, "M0,14 L0,0 L7,0 L9,2 L9,5 L7,7 L0,7 M7,7 L9,9 L9,12 L7,14 L0,14"],
  C: [10, "M10,3 L8,0 L3,0 L1,2 L1,12 L3,14 L8,14 L10,11"],
  D: [10, "M0,14 L0,0 L7,0 L9,2 L9,11 L7,14 L0,14"],
  E: [9, "M9,0 L0,0 L0,14 L9,14 M0,7 L7,7"],
  F: [9, "M0,14 L0,0 L9,0 M0,7 L7,7"],
  G: [10, "M10,3 L8,0 L3,0 L1,2 L1,12 L3,14 L8,14 L10,11 L10,8 L6,8"],
  H: [10, "M0,0 L0,14 M10,0 L10,14 M0,7 L10,7"],
  I: [4, "M2,0 L2,14 M0,0 L4,0 M0,14 L4,14"],
  J: [8, "M6,0 L6,11 L4,14 L1,14 L0,12"],
  K: [10, "M0,0 L0,14 M10,0 L0,7 L10,14"],
  L: [8, "M0,0 L0,14 L8,14"],
  M: [12, "M0,14 L0,0 L6,9 L12,0 L12,14"],
  N: [11, "M0,14 L0,0 L10,14 L10,0"],
  O: [10, "M2,0 L8,0 L10,2 L10,12 L8,14 L2,14 L0,12 L0,2 L2,0"],
  P: [9, "M0,14 L0,0 L7,0 L9,2 L9,5 L7,7 L0,7"],
  Q: [10, "M2,0 L8,0 L10,2 L10,12 L8,14 L2,14 L0,12 L0,2 L2,0 M6,9 L10,14"],
  R: [10, "M0,14 L0,0 L7,0 L9,2 L9,5 L7,7 L0,7 M7,7 L10,14"],
  S: [10, "M9,2 L7,0 L3,0 L1,2 L1,6 L9,8 L9,12 L7,14 L3,14 L1,12"],
  T: [10, "M0,0 L10,0 M5,0 L5,14"],
  U: [10, "M0,0 L0,11 L2,14 L8,14 L10,11 L10,0"],
  V: [10, "M0,0 L5,14 L10,0"],
  W: [13, "M0,0 L3,14 L6,4 L9,14 L12,0"],
  X: [10, "M0,0 L10,14 M10,0 L0,14"],
  Y: [10, "M0,0 L5,7 L10,0 M5,7 L5,14"],
  Z: [10, "M0,0 L10,0 L0,14 L10,14"],
  a: [9, "M2,4 L7,4 L9,6 L9,12 L7,14 L2,14 L0,12 L0,6 L2,4 M9,4 L9,14"],
  b: [9, "M0,0 L0,14 M0,14 L7,14 L9,12 L9,6 L7,4 L0,4"],
  c: [8, "M8,6 L6,4 L2,4 L0,6 L0,12 L2,14 L6,14 L8,12"],
  d: [9, "M9,0 L9,14 M9,14 L2,14 L0,12 L0,6 L2,4 L7,4 L9,6"],
  e: [8, "M8,12 L6,14 L2,14 L0,12 L0,6 L2,4 L6,4 L8,6 L8,9 L0,9"],
  f: [7, "M6,2 L4,0 L2,0 L1,1 L1,14 M0,7 L5,7"],
  g: [9, "M2,4 L7,4 L9,6 L9,12 L7,14 L2,14 L0,12 L0,6 L2,4 M9,12 L9,16 L7,18 L3,18 L1,16"],
  h: [9, "M0,0 L0,14 M0,8 L2,4 L7,4 L9,6 L9,14"],
  i: [4, "M2,4 L2,14 M2,0 L2,1"],
  j: [5, "M3,4 L3,15 L2,18 L0,17 M3,0 L3,1"],
  k: [9, "M0,0 L0,14 M9,4 L0,9 L9,14"],
  l: [4, "M2,0 L2,14"],
  m: [12, "M0,4 L0,14 M0,5 L2,4 L4,6 L4,14 M4,6 L6,4 L9,4 L11,6 L11,14"],
  n: [9, "M0,4 L0,14 M0,5 L2,4 L7,4 L9,6 L9,14"],
  o: [9, "M2,4 L7,4 L9,6 L9,12 L7,14 L2,14 L0,12 L0,6 L2,4"],
  p: [9, "M0,4 L0,18 M0,14 L7,14 L9,12 L9,6 L7,4 L0,4"],
  q: [9, "M9,4 L9,18 M9,14 L2,14 L0,12 L0,6 L2,4 L7,4 L9,6"],
  r: [7, "M0,4 L0,14 M0,5 L2,4 L6,4 L7,5"],
  s: [8, "M7,6 L5,4 L2,4 L0,6 L0,8 L7,10 L7,12 L5,14 L2,14 L0,12"],
  t: [7, "M3,0 L3,14 L6,14 M0,7 L6,7"],
  u: [9, "M0,4 L0,12 L2,14 L7,14 L9,12 L9,4"],
  v: [9, "M0,4 L4,14 L8,4"],
  w: [12, "M0,4 L2,14 L5,8 L8,14 L11,4"],
  x: [9, "M0,4 L9,14 M9,4 L0,14"],
  y: [9, "M0,4 L4,11 L8,4 M4,11 L4,16 L2,18 L0,17"],
  z: [8, "M0,4 L8,4 L0,14 L8,14"],
};

const DIGITS = {
  0: [10, "M2,0 L8,0 L10,2 L10,12 L8,14 L2,14 L0,12 L0,2 L2,0"],
  1: [10, "M5,0 L5,14 M2,3 L5,0 M2,14 L8,14"],
  2: [10, "M1,3 L3,0 L7,0 L9,3 L9,6 L1,14 L9,14"],
  3: [10, "M1,2 L3,0 L7,0 L9,2 L9,5 L7,7 L9,9 L9,12 L7,14 L3,14 L1,12"],
  4: [10, "M7,0 L7,14 M0,9 L8,9 M7,0 L0,9"],
  5: [10, "M9,0 L1,0 L1,7 L7,7 L9,9 L9,12 L7,14 L3,14 L1,12"],
  6: [10, "M9,2 L7,0 L3,0 L1,3 L1,11 L3,14 L7,14 L9,12 L9,8 L7,6 L3,6 L1,8"],
  7: [10, "M0,0 L10,0 L4,14"],
  8: [10, "M2,0 L8,0 L10,2 L8,7 L2,7 L0,2 L2,0 M2,7 L8,7 L10,10 L8,14 L2,14 L0,10 L2,7"],
  9: [10, "M1,12 L3,14 L7,14 L9,12 L9,3 L7,0 L3,0 L1,2 L1,6 L3,8 L8,8 L9,6"],
};

const MARKS = {
  " ": [5, ""],
  ".": [5, "M4,12 L4,14"],
  ",": [5, "M4,12 L4,14 M4,14 L2,17"],
  ":": [5, "M4,4 L4,6 M4,11 L4,13"],
  ";": [5, "M4,4 L4,6 M4,11 L4,13 M4,13 L2,17"],
  "!": [5, "M4,0 L4,10 M4,12 L4,14"],
  "?": [8, "M1,3 L3,0 L6,0 L8,2 L8,5 L5,8 L5,10 M5,12 L5,14"],
  "'": [4, "M4,0 L2,4"],
  "-": [8, "M1,8 L7,8"],
  "—": [13, "M0,8 L12,8"],
  "•": [10, "M5,6 L7,8 L5,10 L3,8 L5,6"],
  "/": [8, "M7,0 L3,14"],
  "%": [11, "M8,0 L2,14 M2,1 L2,3 M8,11 L8,13"],
  $: [10, "M5,0 L5,14 M8,3 L6,1 L3,1 L1,3 L1,6 L8,8 L8,11 L6,13 L3,13 L1,11"],
  "+": [11, "M5,2 L5,12 M0,7 L10,7"],
  "=": [11, "M0,5 L10,5 M0,10 L10,10"],
  "(": [7, "M6,0 L3,2 L3,12 L6,14"],
  ")": [7, "M1,0 L4,2 L4,12 L1,14"],
  '"': [8, "M2,0 L2,3 M6,0 L6,3"],
};

// Glyphs that are not in the table fall back to a blank of space width.
function glyphFor(ch) {
  if (ch in GLYPHS) return GLYPHS[ch];
  if (ch in DIGITS) return DIGITS[ch];
  if (ch in MARKS) return MARKS[ch];
  if (ch === "’") return MARKS["'"];
  if (ch === "–") return MARKS["-"];
  return MARKS[" "];
}

// Split a glyph path into polylines of [x, y] grid points.
const glyphCache = new Map();
function glyphStrokes(ch) {
  if (glyphCache.has(ch)) return glyphCache.get(ch);
  const [, path] = glyphFor(ch);
  const strokes = [];
  let current = null;
  let px = 0;
  let py = 0;
  for (const token of path.split(" ").filter(Boolean)) {
    const cmd = token[0];
    const rest = token.slice(1);
    if (cmd === "M") {
      const [x, y] = rest.split(",").map(Number);
      current = [[x, y]];
      strokes.push(current);
      px = x;
      py = y;
    } else if (cmd === "L") {
      const [x, y] = rest.split(",").map(Number);
      current.push([x, y]);
      px = x;
      py = y;
    } else if (cmd === "H") {
      const x = Number(rest);
      current.push([x, py]);
      px = x;
    } else if (cmd === "V") {
      const y = Number(rest);
      current.push([px, y]);
      py = y;
    }
  }
  glyphCache.set(ch, strokes);
  return strokes;
}

// Width of a string at the given cap height, in pixels.
function textWidth(text, size) {
  const s = size / CAP_H;
  let w = 0;
  for (const ch of text) {
    w += (glyphFor(ch)[0] + 0.5) * s;
  }
  return w - 0.5 * s;
}

function strokeWidthFor(size, bold) {
  return Math.max(1, Math.round(size / 9)) + (bold ? 1 : 0);
}

// Draw text with its top at yTop. align: "left" | "center" | "right".
function drawText(page, text, x, yTop, size, color, bold = false, align = "left") {
  const s = size / CAP_H;
  const w = Math.max(1, strokeWidthFor(size, bold));
  let cursor = x;
  if (align === "center") cursor = x - textWidth(text, size) / 2;
  if (align === "right") cursor = x - textWidth(text, size);
  for (const ch of text) {
    for (const stroke of glyphStrokes(ch)) {
      for (let i = 0; i + 1 < stroke.length; i++) {
        const [x0, y0] = stroke[i];
        const [x1, y1] = stroke[i + 1];
        page.thickLine(
          cursor + x0 * s,
          yTop + y0 * s,
          cursor + x1 * s,
          yTop + y1 * s,
          w,
          color,
        );
      }
    }
    cursor += (glyphFor(ch)[0] + 0.5) * s;
  }
}

function drawCentred(page, text, cx, yTop, size, color, bold = false) {
  drawText(page, text, cx, yTop, size, color, bold, "center");
}

// Greedy word wrap; returns the lines that fit inside maxWidth.
function wrapText(text, size, maxWidth) {
  const lines = [];
  let current = "";
  for (const word of text.split(" ")) {
    const trial = current ? current + " " + word : word;
    if (textWidth(trial, size) <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Draw a wrapped paragraph starting at (x, yTop); returns the y below it.
function drawPara(page, text, x, yTop, width, size, leading, color) {
  let y = yTop;
  for (const line of wrapText(text, size, width)) {
    drawText(page, line, x, y, size, color);
    y += leading;
  }
  return y;
}

function drawRule(page, x0, x1, y, width = 2, color = RULE) {
  page.fillRect(x0, y, x1, y + width, color);
}

// ---------------------------------------------------------------------------
// The front page itself. One section after another, top to bottom, each
// returning the y where the next section starts.
// ---------------------------------------------------------------------------

function drawMasthead(page) {
  drawRule(page, MARGIN, PAGE_W - MARGIN, 22, 3, INK);
  drawCentred(page, "THE WORLD", PAGE_W / 2, 30, 84, INK, true);
  drawRule(page, MARGIN, PAGE_W - MARGIN, 122, 1, INK);
  drawText(page, "FRIDAY 27 NOVEMBER 2026", MARGIN, 130, 15, INK, true);
  drawText(page, "No. 331  •  PRICE $2.50", PAGE_W - MARGIN, 130, 15, INK, true, "right");
  drawRule(page, MARGIN, PAGE_W - MARGIN, 152, 3, INK);
  return 164;
}

function drawLead(page, y) {
  drawCentred(page, "Drones kill two in Kuwait", PAGE_W / 2, y, 46, INK, true);
  y += 46 + 12;
  drawCentred(
    page,
    "Italian technicians die at air-defence site as Kuwait and Rome",
    PAGE_W / 2,
    y,
    20,
    INK,
  );
  y += 28;
  drawCentred(page, "blame Tehran; Iran denies any role", PAGE_W / 2, y, 20, INK);
  return y + 20 + 16;
}

// A schematic map of the Gulf: sea, a stylised Arabian peninsula, the
// countries around the water, and a red marker on Kuwait with two dashed
// drone tracks running in from the north-east.
function drawGulfMap(page, x0, y0, x1, y1) {
  page.fillRect(x0, y0, x1, y1, MAP_BG);
  page.rectOutline(x0, y0, x1, y1, INK, 2);
  drawCentred(page, "THE GULF — SCHEMATIC MAP", (x0 + x1) / 2, y0 + 8, 15, INK, true);
  const inner = [x0 + 10, y0 + 34, x1 - 10, y1 - 10];
  page.fillRect(inner[0], inner[1], inner[2], inner[3], SEA);
  // The peninsula: a broad landmass leaning into the sea.
  const land = [
    [inner[0] + 150, inner[1]],
    [inner[0] + 330, inner[1]],
    [inner[0] + 330, inner[1] + 55],
    [inner[0] + 250, inner[1] + 95],
    [inner[0] + 205, inner[1] + 150],
    [inner[0] + 150, inner[1] + 150],
    [inner[0] + 120, inner[1] + 80],
  ];
  page.polygon(land, LAND);
  for (let i = 0; i < land.length; i++) {
    const [ax, ay] = land[i];
    const [bx, by] = land[(i + 1) % land.length];
    page.thickLine(ax, ay, bx, by, 1, LAND_EDGE);
  }
  drawText(page, "IRAN", inner[0] + 18, inner[1] + 10, 13, SOFT_INK, true);
  drawText(page, "IRAQ", inner[0] + 20, inner[1] + 78, 13, SOFT_INK, true);
  drawText(page, "SAUDI ARABIA", inner[0] + 148, inner[1] + 112, 13, SOFT_INK, true);
  drawText(page, "PERSIAN", inner[0] + 275, inner[1] + 116, 13, GULF_BLUE);
  drawText(page, "GULF", inner[0] + 275, inner[1] + 132, 13, GULF_BLUE);
  // Kuwait, on the north-western shore of the Gulf.
  const kx = inner[0] + 178;
  const ky = inner[1] + 55;
  page.disc(kx, ky, 7, ACCENT);
  page.ellipseOutline(kx, ky, 7, 7, INK, 1);
  drawText(page, "KUWAIT", kx - 86, ky - 9, 13, ACCENT, true);
  // Two dashed tracks converging on the site from the north-east.
  for (const [sx, sy] of [
    [inner[0] + 300, inner[1] + 6],
    [inner[0] + 322, inner[1] + 48],
  ]) {
    const steps = 9;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 0.55) / steps;
      page.thickLine(
        sx + (kx - sx) * t0,
        sy + (ky - sy) * t0,
        sx + (kx - sx) * t1,
        sy + (ky - sy) * t1,
        2,
        ACCENT,
      );
    }
    page.disc(sx, sy, 4, INK);
  }
}

function drawLeadBody(page, y) {
  const textX = MARGIN;
  const textW = 556;
  const mapX0 = MARGIN + 584;
  const mapX1 = PAGE_W - MARGIN;
  const top = y;
  y = drawPara(
    page,
    "Two Italian technicians employed by Rheinmetall Italia were killed " +
      "when drones struck a Kuwaiti air-defence site. Kuwait and Italy " +
      "blamed Iran; Tehran denied any role and called it a false flag.",
    textX,
    y,
    textW,
    17,
    24,
    INK,
  );
  y += 8;
  drawPara(
    page,
    "Rome demanded answers over the killing of its nationals, and " +
      "Kuwait stepped up security around sensitive sites. Oil markets " +
      "steadied after an early jump.",
    textX,
    y,
    textW,
    17,
    24,
    INK,
  );
  drawGulfMap(page, mapX0, top, mapX1, top + 190);
  return top + 190 + 10;
}

// A Thanksgiving parade balloon, drawn from ellipses, an arc and strings.
function drawBalloon(page, cx, top) {
  const bodyTop = top;
  const bodyBottom = top + 62;
  page.fillEllipse(cx, (bodyTop + bodyBottom) / 2, 52, 31, BALLOON_RED);
  page.ellipseOutline(cx, (bodyTop + bodyBottom) / 2, 52, 31, INK, 2);
  page.fillEllipse(cx, (bodyTop + bodyBottom) / 2, 20, 31, BALLOON_YELLOW);
  page.ellipseOutline(cx, (bodyTop + bodyBottom) / 2, 20, 31, INK, 1);
  page.disc(cx - 8, bodyTop + 19, 5, INK);
  page.disc(cx + 12, bodyTop + 19, 5, INK);
  page.arc(cx, bodyTop + 26, 18, 12, 15, 165, INK, 2);
  for (const dx of [-34, 0, 34]) {
    page.thickLine(cx + dx, bodyBottom - 4, cx + dx / 2, bodyBottom + 34, 2, INK);
  }
  page.fillRect(cx - 16, bodyBottom + 34, cx + 16, bodyBottom + 56, BASKET);
  page.rectOutline(cx - 16, bodyBottom + 34, cx + 16, bodyBottom + 56, INK, 2);
}

function drawStormPanel(page, y) {
  const panelH = 148;
  page.fillRect(MARGIN, y, PAGE_W - MARGIN, y + panelH, STORM_BG);
  page.rectOutline(MARGIN, y, PAGE_W - MARGIN, y + panelH, INK, 2);
  drawBalloon(page, MARGIN + 108, y + 24);
  const tx = MARGIN + 232;
  const tw = PAGE_W - MARGIN - tx - 18;
  drawText(page, "Storm blacks out 900,000; parade postponed", tx, y + 12, 26, INK, true);
  drawPara(
    page,
    "A powerful coastal storm knocked out power to about 900,000 homes " +
      "and businesses along the US East Coast and forced the postponement " +
      "of the 100th Macy's Thanksgiving Day Parade — the first delay in " +
      "its history. Organisers moved the parade to Saturday; gusts hit " +
      "65 mph.",
    tx,
    y + 48,
    tw,
    17,
    23,
    INK,
  );
  return y + panelH + 12;
}

function drawLowerStories(page, y) {
  const gap = 17;
  const colW = Math.floor((CONTENT_W - 2 * gap) / 3);
  const xs = [MARGIN, MARGIN + colW + gap, MARGIN + 2 * (colW + gap)];
  const stories = [
    [
      "GAZA",
      "Hamas weighs reply after strikes kill 10",
      "Hamas weighed its response after strikes killed 10 in Gaza, " +
        "including senior official Khaled Abu Nada and his wife, on a " +
        "third night of bombing.",
    ],
    [
      "BANGKOK",
      "Blast at Bangkok refinery injures nine",
      "An explosion at the Bangchak oil refinery injured at least " +
        "nine people. The company was monitoring air quality around " +
        "the plant.",
    ],
    [
      "BRITAIN",
      "Migration falls to lowest since 1997",
      "Net migration to Britain fell to its lowest since 1997, " +
        "excluding the pandemic years, new figures showed.",
    ],
  ];
  for (let i = 0; i < stories.length; i++) {
    const [tag, headline, text] = stories[i];
    const x = xs[i];
    drawText(page, tag, x, y, 14, ACCENT, true);
    let cy = y + 20;
    cy = drawPara(page, headline, x, cy, colW, 19, 25, INK);
    cy += 4;
    drawPara(page, text, x, cy, colW, 14, 20, INK);
  }
  for (const dx of [xs[1] - gap / 2 - 1, xs[2] - gap / 2 - 1]) {
    page.fillRect(dx, y, dx + 1, y + 158, RULE);
  }
  return y + 158 + 8;
}

function drawByNumbers(page, y) {
  drawRule(page, MARGIN, PAGE_W - MARGIN, y, 3, INK);
  y += 8;
  drawCentred(page, "BY THE NUMBERS", PAGE_W / 2, y, 15, INK, true);
  y += 24;
  const stats = [
    ["2", "technicians killed", "in Kuwait"],
    ["900,000", "without power", "in the US"],
    ["10", "killed in", "Gaza strikes"],
    ["9", "hurt in the", "Bangkok blast"],
    ["65 mph", "storm gusts on", "the East Coast"],
  ];
  const gap = 10;
  const boxW = Math.floor((CONTENT_W - gap * (stats.length - 1)) / stats.length);
  for (let i = 0; i < stats.length; i++) {
    const [value, line1, line2] = stats[i];
    const bx = MARGIN + i * (boxW + gap);
    page.fillRect(bx, y, bx + boxW, y + 78, PANEL);
    page.rectOutline(bx, y, bx + boxW, y + 78, RULE, 1);
    drawCentred(page, value, bx + boxW / 2, y + 4, 30, ACCENT, true);
    drawCentred(page, line1, bx + boxW / 2, y + 40, 13, SOFT_INK);
    drawCentred(page, line2, bx + boxW / 2, y + 55, 13, SOFT_INK);
  }
  return y + 78 + 8;
}

function drawAlsoToday(page, y) {
  drawText(page, "ALSO TODAY", MARGIN, y, 15, ACCENT, true);
  const labelW = textWidth("ALSO TODAY  ", 15);
  drawPara(
    page,
    "Chess: Gukesh-Sindarov draw Game 3 of the World Championship  •  " +
      "Kim Jong Un vows more nuclear weapons  •  US GDP up to 4.3%  •  " +
      "Tanker capsizes off Ibiza",
    MARGIN + labelW,
    y,
    PAGE_W - MARGIN - MARGIN - labelW,
    15,
    20,
    INK,
  );
  return y + 40;
}

function drawFooter(page, y) {
  drawCentred(
    page,
    "THE WORLD  •  Friday 27 November 2026  •  Front page drawn for the make.fun news-image-20261127 bounty",
    PAGE_W / 2,
    y,
    12,
    SOFT_INK,
  );
}

function buildPage() {
  const page = new Canvas(PAGE_W, PAGE_H, PAPER);
  let y = drawMasthead(page);
  y = drawLead(page, y);
  y = drawLeadBody(page, y);
  y = drawStormPanel(page, y);
  y = drawLowerStories(page, y);
  y = drawByNumbers(page, y);
  y = drawAlsoToday(page, y);
  drawFooter(page, y + 14);
  return page;
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------

function main() {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outputDir, { recursive: true });
  const page = buildPage();
  const png = encodePng(page);
  const target = join(outputDir, "entry.png");
  writeFileSync(target, png);
  console.log(`Wrote ${target} (${png.length} bytes)`);
}

main();
