import { classify } from "./classify.js";

export const DURATION = 40;

export const LOGS = [
  { t: 0.28, kind: "scan", line: "boot   paper tape  send false" },
  { t: 2.05, kind: "scan", line: "SCAN   KETTLE  fill 28.4  uniq  9  nest 0.66" },
  { t: 3.40, kind: "void", line: "VOID   KETTLE  unique 9 on 31% fill   skip" },
  { t: 5.15, kind: "scan", line: "SCAN   VELVET  fill 36.1  uniq 13  nest 0.61" },
  { t: 6.70, kind: "nest", line: "NEST   VELVET  vel 1.9  top 0.27      skip" },
  { t: 8.55, kind: "scan", line: "SCAN   MOSS    fill 41.8  uniq 11  nest 0.74" },
  { t: 9.90, kind: "nest", line: "NEST   MOSS    cluster too hot        skip" },
  { t: 11.6, kind: "scan", line: "SCAN   BRACK   fill 22.0  uniq  8  nest 0.71" },
  { t: 12.8, kind: "void", line: "VOID   BRACK   fat curve, thin unique skip" },
  { t: 14.4, kind: "scan", line: "SCAN   SABLE   fill 24.6  uniq 47  nest 0.23" },
  { t: 15.7, kind: "print", line: "PRINT  SABLE   uniq 51  nest 0.21     lock" },
  { t: 16.5, kind: "paper", line: "PAPER  in      +0.35 SOL" },
  { t: 19.8, kind: "paper", line: "PAPER          +1.18 SOL" },
  { t: 23.4, kind: "paper", line: "PAPER          +2.21 SOL" },
  { t: 27.8, kind: "paper", line: "PAPER          +3.14 SOL" },
  { t: 32.1, kind: "paper", line: "PAPER  peak    +3.91 SOL" },
  { t: 36.4, kind: "close", line: "CLOSE          +3.74 SOL  1 print  2 voids  send false" },
];

const PNL = [
  [16.5, 0.35],
  [19.8, 1.18],
  [23.4, 2.21],
  [27.8, 3.14],
  [32.1, 3.91],
  [35.3, 3.68],
  [36.4, 3.74],
  [40.0, 3.74],
];

const MINTS = [
  { t: 0, ticker: "KETTLE", fill: 22.0, unique: 8, topShare: 0.24, fillVel: 1.3, mcap: 9.4 },
  { t: 3.4, ticker: "KETTLE", fill: 31.2, unique: 9, topShare: 0.26, fillVel: 1.6, mcap: 12.1 },
  { t: 5.15, ticker: "VELVET", fill: 33.0, unique: 13, topShare: 0.25, fillVel: 1.7, mcap: 14.8 },
  { t: 6.7, ticker: "VELVET", fill: 39.4, unique: 13, topShare: 0.27, fillVel: 2.0, mcap: 17.2 },
  { t: 8.55, ticker: "MOSS", fill: 37.5, unique: 11, topShare: 0.29, fillVel: 2.2, mcap: 16.4 },
  { t: 9.9, ticker: "MOSS", fill: 44.8, unique: 11, topShare: 0.31, fillVel: 2.4, mcap: 19.6 },
  { t: 11.6, ticker: "BRACK", fill: 18.4, unique: 7, topShare: 0.28, fillVel: 1.4, mcap: 8.1 },
  { t: 12.8, ticker: "BRACK", fill: 26.9, unique: 8, topShare: 0.3, fillVel: 1.8, mcap: 11.0 },
  { t: 14.4, ticker: "SABLE", fill: 21.8, unique: 47, topShare: 0.08, fillVel: 0.4, mcap: 11.4 },
  { t: 16.5, ticker: "SABLE", fill: 29.4, unique: 51, topShare: 0.08, fillVel: 0.45, mcap: 14.9 },
  { t: 23.4, ticker: "SABLE", fill: 41.2, unique: 56, topShare: 0.09, fillVel: 0.4, mcap: 21.6 },
  { t: 32.1, ticker: "SABLE", fill: 51.6, unique: 61, topShare: 0.09, fillVel: 0.3, mcap: 28.4 },
  { t: 36.4, ticker: "SABLE", fill: 49.8, unique: 63, topShare: 0.08, fillVel: 0.18, mcap: 27.1 },
  { t: 40.0, ticker: "SABLE", fill: 50.1, unique: 64, topShare: 0.08, fillVel: 0.12, mcap: 27.4 },
];

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function sample(keys, t, fields) {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      const u = (t - a.t) / (b.t - a.t || 1);
      const out = { ...b };
      for (const f of fields) out[f] = lerp(a[f], b[f], u);
      return out;
    }
  }
  return { ...keys[keys.length - 1] };
}

function paperSol(t) {
  if (t < PNL[0][0]) return 0;
  for (let i = 1; i < PNL.length; i++) {
    if (t <= PNL[i][0]) {
      const u = (t - PNL[i - 1][0]) / (PNL[i][0] - PNL[i - 1][0] || 1);
      return lerp(PNL[i - 1][1], PNL[i][1], u);
    }
  }
  return PNL[PNL.length - 1][1];
}

export function padClock(t) {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function at(t) {
  const logs = LOGS.filter((l) => l.t <= t);
  const last = logs[logs.length - 1];
  const mintRow = sample(MINTS, t, ["fill", "unique", "topShare", "fillVel", "mcap"]);
  const read = classify({
    unique: mintRow.unique,
    fill: mintRow.fill,
    topShare: mintRow.topShare,
    fillVel: mintRow.fillVel,
  });
  const sol = paperSol(t);
  const peak = t >= 32.1 ? 3.91 : Math.max(sol, t >= 16.5 ? sol : 0);
  const event = last ? last.kind.toUpperCase() : "SCAN";
  const voids = logs.filter((l) => l.kind === "void").length;
  const nests = logs.filter((l) => l.kind === "nest").length;
  const prints = logs.filter((l) => l.kind === "print").length;

  return {
    t,
    clock: padClock(t),
    boot: t < 1.65,
    event,
    note: last ? last.line : "watching the tape",
    mint: {
      ticker: mintRow.ticker,
      fill: mintRow.fill,
      unique: Math.round(mintRow.unique),
      nest: read.nest,
      topShare: mintRow.topShare,
      fillVel: mintRow.fillVel,
      mcap: mintRow.mcap,
    },
    logs,
    paper: {
      active: t >= 16.5,
      closed: t >= 36.4,
      sol,
      peak,
    },
    session: {
      prints,
      voids,
      nests,
      send: false,
    },
  };
}
