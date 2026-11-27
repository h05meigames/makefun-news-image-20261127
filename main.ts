// Entry point for the news-image-20261127 bounty.
//
// When the program runs it draws the newspaper front page from scratch
// with the Pillow renderer (render_frontpage.py, no network, no random
// input) and places the finished picture at <output-dir>/entry.png.
//
// Run it with:
//   MAKEFUN_OUTPUT_DIR=/output node main.ts
// When MAKEFUN_OUTPUT_DIR is not set, the image goes to /output.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const renderer = join(scriptDir, "render_frontpage.py");
const scratch = join(outputDir, ".render-scratch.png");
const target = join(outputDir, "entry.png");

mkdirSync(outputDir, { recursive: true });

// Draw the front page now, at runtime, into a scratch file.
execFileSync("python3", [renderer, scratch], { stdio: "inherit" });

// Move the freshly drawn picture into place as the entry image.
copyFileSync(scratch, target);
rmSync(scratch);

console.log(`Wrote ${target}`);
