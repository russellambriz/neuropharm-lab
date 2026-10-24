export type DrugId =
  | 'ssri'
  | 'cocaine'
  | 'amphetamine'
  | 'ldopa'
  | 'benzo'
  | 'opioid'
  | 'ketamine'
  | 'alcohol'
  | 'nicotine'
  | 'caffeine'
  | 'botox'
  | 'curare'

export type DiseaseId =
  | 'parkinsons'
  | 'alzheimers'
  | 'ms'
  | 'epilepsy'
  | 'myasthenia'
  | 'depression'
  | 'schizophrenia'

export type SynapseKind = 'glutamate' | 'gaba' | 'dopamine' | 'serotonin' | 'acetylcholine' | 'nmj'

export type Transmitter = 'glu' | 'gaba' | 'da' | 'ht' | 'ach'

export type PairKind = 'solo' | 'compose' | 'overlay' | 'mismatch' | 'warn'

export interface Pairing {
  kind: PairKind
  synapse: SynapseKind
  /** Drug parameters are left out of the integrator. */
  drugApplied: boolean
  diseaseApplied: boolean
  note: string
}

export interface SceneParams {
  synapse: SynapseKind
  transmitter: Transmitter
  instrument: 'membrane' | 'endplate'
  afferentHz: number
  /** Repetitive train, used for myasthenia. */
  train: boolean
  synthesis: number
  pRel: number
  quanta: number
  kUptake: number
  kEnzyme: number
  kLeak: number
  receptorDensity: number
  gabaEfficacy: number
  nmdaScale: number
  ampaScale: number
  /** Tonic nicotinic open fraction from an agonist (nicotine), already including desensitization. */
  nachAgonist: number
  gNaScale: number
  /** Teaching coefficient. 0.40 × severity for epilepsy. */
  gNaP: number
  gKExtra: number
  myelin: number
  delayMs: number
  jitterMs: number
  blockProb: number
  /** Cleft units per ms at full vesicles and intact transporter. */
  reverseRate: number
  /** Extra vesicle sink, per ms. */
  drainRate: number
  autoreceptor: number
  /** Cleft units per ms, spike-independent. */
  tonicLeak: number
  /** Steady inward current (µA/cm²) at full cleft occupancy. */
  modGain: number
  /** Tonic drive, µA/cm². */
  iApp: number
  /** Brief excitatory pulse amplitude. 0 when the synapse itself is the drive. */
  pulseAmp: number
  pulseHz: number
  gAmpa: number
  gNmda: number
  gGaba: number
  gNach: number
  showGabaTerminal: boolean
  enzyme: 'mao' | 'ache' | 'gaba-t' | 'none'
  transporter: string
  receptorLabel: string
  receptorStyle: 'gpcr' | 'pore'
  /** Within-train receptor fade, 0–1. */
  fatigue: number
  transmitterName: string
}

export interface Readout {
  firingHz: number
  restMv: number
  vesicleFill: number
  cleft: number
  cleftRaw: number
  peakMv: number
  shortIsiFraction: number
  releasePerSec: number
  blockFraction: number
}

export interface FusionEvent {
  t: number
  amount: number
}

export interface AxonPulse {
  t0: number
  t1: number
  blocked: boolean
}
