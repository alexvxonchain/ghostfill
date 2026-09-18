import { RULES } from "./rules.js";
import { nestScore } from "./score.js";

export function classify(row = {}) {
  const nest = nestScore(row);
  const unique = Number(row.unique || 0);
  const fill = Number(row.fill || 0);
  const fillVel = Number(row.fillVel || 0);

  if (
    unique >= RULES.uniquePrint &&
    nest <= RULES.nestPrint &&
    fill >= RULES.fillMin &&
    fill <= RULES.fillMax
  ) {
    return { event: "PRINT", nest, send: false };
  }

  if (unique < RULES.uniqueVoid && fill >= RULES.fillVoid) {
    return { event: "VOID", nest, send: false };
  }

  if (nest >= RULES.nestHot && fillVel >= RULES.velHot) {
    return { event: "NEST", nest, send: false };
  }

  return { event: "SCAN", nest, send: false };
}
