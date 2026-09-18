import { at, DURATION } from "./tape.js";

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[38;2;93;255;154m",
  mint: "\x1b[38;2;212;255;232m",
  amber: "\x1b[38;2;231;193;90m",
  red: "\x1b[38;2;255;107;90m",
  mute: "\x1b[38;2;109;138;122m",
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
  clear: "\x1b[2J\x1b[H",
};

function paint(kind, text) {
  if (kind === "print" || kind === "paper" || kind === "close") return C.green + text + C.reset;
  if (kind === "nest") return C.amber + text + C.reset;
  if (kind === "void") return C.red + text + C.reset;
  return C.mint + text + C.reset;
}

function screen(s) {
  const lines = [];
  lines.push(`${C.bold}${C.green}GHOSTFILL${C.reset}  ${C.dim}paper desk · send false${C.reset}          ${s.clock}`);
  lines.push(`${C.mute}──────────────────────────────────────────────────────────────${C.reset}`);
  const logs = s.logs.slice(-10);
  for (const log of logs) {
    lines.push(` ${C.mute}${padClock(log.t)}${C.reset}  ${paint(log.kind, log.line)}`);
  }
  while (lines.length < 14) lines.push("");
  lines.push(`${C.mute}──────────────────────────────────────────────────────────────${C.reset}`);
  const m = s.mint;
  const nest = m.nest.toFixed(2);
  const pnl = s.paper.active ? `${s.paper.sol >= 0 ? "+" : ""}${s.paper.sol.toFixed(2)} SOL` : "—";
  const pnlCol = s.paper.active ? C.green : C.mute;
  lines.push(
    ` ${C.bold}${m.ticker}${C.reset}  fill ${m.fill.toFixed(1)}%  uniq ${m.unique}  nest ${nest}  ${paint(s.event.toLowerCase(), s.event)}`,
  );
  lines.push(` ${pnlCol}${C.bold}${pnl}${C.reset}  ${C.mute}${s.session.prints} print · ${s.session.voids} void · ${s.session.nests} nest · no keys${C.reset}`);
  return C.clear + C.hide + lines.join("\n") + "\n";
}

function padClock(t) {
  const s = Math.max(0, Math.floor(t));
  return `00:${String(s).padStart(2, "0")}`;
}

const started = Date.now();
const timer = setInterval(() => {
  const t = (Date.now() - started) / 1000;
  process.stdout.write(screen(at(Math.min(t, DURATION))));
  if (t >= DURATION) {
    clearInterval(timer);
    process.stdout.write(C.show);
  }
}, 80);

process.on("SIGINT", () => {
  process.stdout.write(C.show + C.reset);
  process.exit(0);
});
