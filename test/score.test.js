import assert from "node:assert/strict";
import test from "node:test";
import { classify } from "../src/classify.js";
import { nestScore } from "../src/score.js";
import { RULES } from "../src/rules.js";
import { at } from "../src/tape.js";

test("nest score stays in 0..1", () => {
  assert.equal(nestScore({ unique: 80, topShare: 0, fillVel: 0 }) >= 0, true);
  assert.equal(nestScore({ unique: 0, topShare: 1, fillVel: 9 }) <= 1, true);
});

test("PRINT needs unique 36+ and a quiet nest", () => {
  const hit = classify({ unique: 51, fill: 29.4, topShare: 0.08, fillVel: 0.45 });
  assert.equal(hit.event, "PRINT");
  assert.equal(hit.send, false);
  assert.equal(hit.nest <= RULES.nestPrint, true);
});

test("VOID is a fat fill with almost nobody there", () => {
  const hit = classify({ unique: 9, fill: 31, topShare: 0.26, fillVel: 1.6 });
  assert.equal(hit.event, "VOID");
});

test("NEST is a hot cluster, not a print", () => {
  const hit = classify({ unique: 14, fill: 40, topShare: 0.32, fillVel: 2.5 });
  assert.equal(hit.event, "NEST");
});

test("demo tape never sends and finishes green", () => {
  const end = at(39.5);
  assert.equal(end.session.send, false);
  assert.equal(end.paper.closed, true);
  assert.equal(end.paper.sol > 3, true);
  assert.equal(end.mint.ticker, "SABLE");
});
