/** Shifted Hodgkin–Huxley rates. V is absolute mV; rest sits near −65. */

export const C_M = 1
export const G_NA = 120
export const G_K = 36
export const G_L = 0.3
export const E_NA = 50
export const E_K = -77
export const E_L = -54.387
export const E_CL = -70

/** Textbook rates. Afferent pacing, not this scale, sets the 12 Hz teaching rhythm. */
export const RATE_SCALE = 1

function limit(value: number, at: number): number {
  return Number.isFinite(value) ? value : at
}

export interface Rates {
  am: number
  bm: number
  ah: number
  bh: number
  an: number
  bn: number
}

export function hhRates(V: number): Rates {
  const v = V + 65
  const am = limit((0.1 * (25 - v)) / (Math.exp((25 - v) / 10) - 1), 1) * RATE_SCALE
  const bm = 4 * Math.exp(-v / 18) * RATE_SCALE
  const ah = 0.07 * Math.exp(-v / 20) * RATE_SCALE
  const bh = (1 / (Math.exp((30 - v) / 10) + 1)) * RATE_SCALE
  const an = limit((0.01 * (10 - v)) / (Math.exp((10 - v) / 10) - 1), 0.1) * RATE_SCALE
  const bn = 0.125 * Math.exp(-v / 80) * RATE_SCALE
  return { am, bm, ah, bh, an, bn }
}

export function gateSteady(alpha: number, beta: number): number {
  const sum = alpha + beta
  return sum > 0 ? alpha / sum : 0
}

export function stepGate(x: number, alpha: number, beta: number, dt: number): number {
  const sum = alpha + beta
  if (sum <= 0) return x
  const inf = alpha / sum
  const tau = 1 / sum
  return inf + (x - inf) * Math.exp(-dt / tau)
}

/** Jahr & Stevens magnesium block at 1 mM Mg2+. */
export function mgBlock(V: number): number {
  return 1 / (1 + Math.exp(-0.062 * V) / 3.57)
}
