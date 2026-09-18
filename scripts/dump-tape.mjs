import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { at, DURATION } from "../src/tape.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "frames");
const FPS = 30;
fs.mkdirSync(outDir, { recursive: true });
const frames = [];
const n = FPS * DURATION;
for (let i = 0; i < n; i++) frames.push(at(i / FPS));
fs.writeFileSync(path.join(outDir, "tape.json"), JSON.stringify(frames));
console.log(`dumped ${frames.length} frames -> frames/tape.json`);
