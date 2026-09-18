export const RULES = Object.freeze({
  uniquePrint: 36,
  nestPrint: 0.28,
  fillMin: 12,
  fillMax: 58,
  uniqueVoid: 12,
  fillVoid: 20,
  nestHot: 0.62,
  velHot: 1.15,
  paperSol: 0.35,
});

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
