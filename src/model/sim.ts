import { C_M, E_CL, E_K, E_L, E_NA, G_K, G_L, G_NA, gateSteady, hhRates, mgBlock, stepGate } from './hh.ts'
import type { AxonPulse, FusionEvent, Readout, SceneParams } from './types.ts'

const DT = 0.02
const SAMPLE_EVERY = 10
const HISTORY = 2000
const WINDOW_MS = 400

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

export class Simulator {
  t = 0
  V = -65
  m = 0.05
  h = 0.6
  n = 0.32
  vFill = 1
  N = 0
  sA = 0
  sN = 0
  sG = 0
  sC = 0
  fatigue = 0
  adapt = 0
  params: SceneParams
  fusions: FusionEvent[] = []
  axon: AxonPulse[] = []
  private spikes: number[] = []
  private releases: number[] = []
  private blocked: number[] = []
  private arrivals: { t: number; blocked: boolean }[] = []
  private nextAfferent = 40
  private afferentGap = 80
  private pulseLeft = 0
  private pulseGain = 1
  private pulseIndex = 0
  private nextPulse = 42
  private pulsesInTrain = 0
  private vHist = new Float64Array(HISTORY)
  private nHist = new Float64Array(HISTORY)
  private histCount = 0
  private histWrite = 0
  private stepCount = 0
  private rng: () => number
  private peak = -65
  private gabaFill = 1

  constructor(params: SceneParams, seed = 7) {
    this.params = params
    this.rng = mulberry32(seed)
    this.resetGates()
    this.vFill = clamp(params.synthesis, 0, 1.6)
    this.afferentGap = 1000 / params.afferentHz
  }

  setParams(params: SceneParams): void {
    this.params = params
  }

  private resetGates(): void {
    const r = hhRates(-65)
    this.m = gateSteady(r.am, r.bm)
    this.h = gateSteady(r.ah, r.bh)
    this.n = gateSteady(r.an, r.bn)
    this.V = -65
  }

  /** Replace the condition without keeping another transmitter's cleft. */
  reset(params: SceneParams, seed = 7): void {
    this.params = params
    this.rng = mulberry32(seed)
    this.t = 0
    this.N = 0
    this.sA = 0
    this.sN = 0
    this.sG = 0
    this.sC = 0
    this.fatigue = 0
    this.adapt = 0
    this.fusions = []
    this.axon = []
    this.spikes = []
    this.releases = []
    this.blocked = []
    this.arrivals = []
    this.nextAfferent = 36
    this.afferentGap = 1000 / params.afferentHz
    this.pulsesInTrain = 0
    this.pulseLeft = 0
    this.pulseGain = 1
    this.pulseIndex = 0
    this.nextPulse = 40
    this.histCount = 0
    this.histWrite = 0
    this.stepCount = 0
    this.peak = -65
    this.gabaFill = 1
    this.resetGates()
    this.vFill = clamp(params.synthesis, 0, 1.6)
  }

  run(ms: number): void {
    const steps = Math.round(ms / DT)
    for (let i = 0; i < steps; i++) this.step()
  }

  step(): void {
    const p = this.params
    const dt = DT
    this.t += dt

    if (this.t >= this.nextAfferent - 1e-6) {
      this.scheduleAfferent(this.nextAfferent)
      this.nextAfferent += this.afferentGap
      this.advancePattern(p)
    }

    while (this.arrivals.length > 0 && this.arrivals[0]!.t <= this.t) {
      const arrival = this.arrivals.shift()!
      if (!arrival.blocked) this.release()
    }

    if (p.pulseAmp > 0 && this.t >= this.nextPulse - 1e-6) {
      const gains = [1, 0.92, 1, 0.84, 0.96, 1, 0.76]
      this.pulseGain = gains[this.pulseIndex % gains.length]!
      this.pulseIndex++
      this.pulseLeft = 1.6
      this.nextPulse += 1000 / p.pulseHz
    }
    const iPulse = this.pulseLeft > 0 ? p.pulseAmp * this.pulseGain : 0
    if (this.pulseLeft > 0) this.pulseLeft -= dt

    // Vesicle pool tracks synthesis. Amphetamine adds a slow extra sink.
    this.vFill += dt * ((p.synthesis - this.vFill) / 2800 - p.drainRate * this.vFill)
    this.vFill = clamp(this.vFill, 0, 1.8)

    const clearance = p.kUptake + p.kEnzyme + p.kLeak
    const reverse = p.reverseRate * (0.7 + 0.3 * this.vFill) * clamp(p.kUptake / 0.006, 0, 1.4)
    this.N += dt * (reverse + p.tonicLeak * this.vFill - clearance * this.N)
    this.N = Math.max(0, this.N)

    const density = clamp(p.receptorDensity * (1 - 0.85 * p.fatigue * this.fatigue), 0, 1.4)
    this.sA += dt * (-this.sA / 2.8)
    this.sN += dt * (-this.sN / 48)
    this.sG += dt * (-this.sG / 12)
    this.sC += dt * (-this.sC / 1.8)
    this.fatigue += dt * (-this.fatigue / 70)

    // Nicotine holds nicotinic channels open between spikes, then desensitizes.

    const occ = this.N / (this.N + 0.45)
    const r = hhRates(this.V)
    this.m = stepGate(this.m, r.am, r.bm, dt)
    this.h = stepGate(this.h, r.ah, r.bh, dt)
    this.n = stepGate(this.n, r.an, r.bn, dt)

    const mP = 1 / (1 + Math.exp(-(this.V + 51) / 5))
    const shunt = 1 / (1 + 7.5 * p.gabaEfficacy * Math.min(1, this.sG))
    const gNaP = p.gNaP * 1.2 * shunt
    const iNa = p.gNaScale * G_NA * this.m ** 3 * this.h * (this.V - E_NA)
    const iNaP = gNaP * mP * (this.V - E_NA)
    const iK = G_K * this.n ** 4 * (this.V - E_K) + p.gKExtra * (this.V - E_K)
    const iL = G_L * (this.V - E_L)
    const iAmpa = p.gAmpa * p.ampaScale * this.sA * (this.V - 0)
    const iNmda = p.gNmda * p.nmdaScale * density * this.sN * mgBlock(this.V) * (this.V - 0)
    const iGaba = p.gGaba * p.gabaEfficacy * this.sG * (this.V - E_CL)
    const iNach = p.gNach * density * (this.sC + p.nachAgonist) * (this.V - 0)
    const iMod = p.modGain * occ + 85 * p.nachAgonist
    const iAdapt = 0.35 * this.adapt * (this.V - E_K)
    const wobble = 2.6 * Math.sin(this.t / 58 + 0.7)

    const iTotal = iNa + iNaP + iK + iL + iAmpa + iNmda + iGaba + iNach + iAdapt
    const prev = this.V
    this.V += (dt * (p.iApp + iPulse + wobble + iMod - iTotal)) / C_M
    if (this.V > this.peak) this.peak = this.V
    if (prev < 0 && this.V >= 0) {
      this.spikes.push(this.t)
      this.adapt = Math.min(1.4, this.adapt + 0.22)
    }
    this.adapt += dt * (0 - this.adapt) / 90

    this.stepCount++
    if (this.stepCount % SAMPLE_EVERY === 0) {
      this.vHist[this.histWrite] = this.V
      this.nHist[this.histWrite] = this.N
      this.histWrite = (this.histWrite + 1) % HISTORY
      if (this.histCount < HISTORY) this.histCount++
    }

    if (this.fusions.length > 20) this.fusions.splice(0, this.fusions.length - 12)
    if (this.axon.length > 12) this.axon.splice(0, this.axon.length - 8)
    if (this.spikes.length > 80) this.spikes.splice(0, this.spikes.length - 40)
  }

  private advancePattern(p: SceneParams): void {
    if (!p.train) {
      this.afferentGap = 1000 / p.afferentHz
      return
    }
    this.pulsesInTrain++
    if (this.pulsesInTrain < 6) this.afferentGap = 1000 / 30
    else {
      this.pulsesInTrain = 0
      this.afferentGap = 420
    }
  }

  private scheduleAfferent(t0: number): void {
    const p = this.params
    const blocked = this.rng() < p.blockProb
    const jitter = (this.rng() - 0.5) * 2 * p.jitterMs
    const t1 = t0 + p.delayMs + Math.max(0, jitter)
    this.arrivals.push({ t: t1, blocked })
    this.axon.push({ t0, t1, blocked })
    if (blocked) this.blocked.push(t0)
  }

  private release(): void {
    const p = this.params
    const occ = this.N / (this.N + 0.45)
    const pEff = clamp(p.pRel * (1 - p.autoreceptor * occ), 0, 1)
    const amount = pEff * clamp(this.vFill, 0, 1.5) * p.quanta
    this.N += amount
    if (p.synapse === 'glutamate') {
      this.sA = clamp(this.sA + amount * 1.15, 0, 4)
      this.sN = clamp(this.sN + amount * 0.55, 0, 4)
    } else if (p.synapse === 'gaba') {
      this.sG = clamp(this.sG + amount * 1.3, 0, 4)
    } else if (p.synapse === 'acetylcholine' || p.synapse === 'nmj') {
      this.sC = clamp(this.sC + amount * 1.4, 0, 5)
    }
    if (p.showGabaTerminal) {
      const gAmt = 0.72 * this.gabaFill
      this.sG = clamp(this.sG + gAmt, 0, 4)
    }
    this.fatigue = clamp(this.fatigue + 0.28 * p.fatigue, 0, 1)
    this.fusions.push({ t: this.t, amount })
    this.releases.push(this.t)
  }

  meanN(windowMs = 300): number {
    return this.meanOf(this.nHist, windowMs)
  }

  readout(cleftRef = 1): Readout {
    const now = this.t
    const recent = this.spikes.filter((t) => now - t <= 1000)
    const span = Math.max(250, Math.min(1000, now))
    const inSpan = this.spikes.filter((t) => now - t <= span)
    const firingHz = (inSpan.length / span) * 1000
    let restSum = 0
    let restN = 0
    let peak = -80
    const n = this.histCount
    for (let i = 0; i < n; i++) {
      const v = this.sample(this.vHist, i)
      if (v > peak) peak = v
      if (v < -50) {
        restSum += v
        restN++
      }
    }
    const isis: number[] = []
    for (let i = 1; i < recent.length; i++) isis.push(recent[i]! - recent[i - 1]!)
    const short = isis.filter((dt) => dt < 22).length
    const rel = this.releases.filter((t) => now - t <= 1000).length
    const blk = this.blocked.filter((t) => now - t <= 1000).length
    const attempts = rel + blk
    const cleftRaw = this.meanN(800)
    return {
      firingHz,
      restMv: restN > 0 ? restSum / restN : -65,
      vesicleFill: this.vFill,
      cleft: cleftRef > 1e-6 ? cleftRaw / cleftRef : 0,
      cleftRaw,
      peakMv: peak,
      shortIsiFraction: isis.length ? short / isis.length : 0,
      releasePerSec: rel,
      blockFraction: attempts ? blk / attempts : 0,
    }
  }

  /** Last 400 ms, oldest first, times relative to now. */
  trace(): { t: number; v: number }[] {
    const n = this.histCount
    const points: { t: number; v: number }[] = []
    const sampleMs = DT * SAMPLE_EVERY
    for (let i = 0; i < n; i++) {
      const age = (n - 1 - i) * sampleMs
      if (age > WINDOW_MS) continue
      points.push({ t: WINDOW_MS - age, v: this.sample(this.vHist, i) })
    }
    return points
  }

  private sample(buf: Float64Array, oldestIndex: number): number {
    const start = this.histCount < HISTORY ? 0 : this.histWrite
    const idx = (start + oldestIndex) % HISTORY
    return buf[idx]!
  }

  private meanOf(buf: Float64Array, windowMs: number): number {
    const n = this.histCount
    const samples = Math.min(n, Math.round(windowMs / (DT * SAMPLE_EVERY)))
    if (samples <= 0) return 0
    let sum = 0
    for (let i = n - samples; i < n; i++) sum += this.sample(buf, i)
    return sum / samples
  }
}

export const STEP_MS = DT
export const SWEEP_MS = WINDOW_MS
