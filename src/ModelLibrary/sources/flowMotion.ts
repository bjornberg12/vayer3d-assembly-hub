/** Suppress numerical leakage; motion is driven by solved current only. */
export function flowSpeed(current: number) {
  return Number.isFinite(current) && current > 0.001
    ? Math.min(0.15 + Math.log10(1 + current) * 0.35, 2.5)
    : 0;
}