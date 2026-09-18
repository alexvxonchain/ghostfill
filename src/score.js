import { clamp } from "./rules.js";

export function nestScore({ unique = 0, topShare = 0, fillVel = 0 } = {}) {
  const crowded = 0.45 * (1 - clamp(unique / 80, 0, 1));
  const whale = 0.35 * clamp(topShare, 0, 1);
  const rush = 0.2 * clamp(fillVel / 2.8, 0, 1);
  return clamp(crowded + whale + rush, 0, 1);
}
