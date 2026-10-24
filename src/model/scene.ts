import type { DiseaseId, DrugId, Pairing, SceneParams, SynapseKind, Transmitter } from './types.ts'

export interface Selection {
  drug: DrugId | null
  dose: number
  disease: DiseaseId | null
  severity: number
}

const DRUG_SYSTEMS: Record<DrugId, SynapseKind[]> = {
  ssri: ['serotonin'],
  cocaine: ['dopamine'],
  amphetamine: ['dopamine'],
  ldopa: ['dopamine'],
  benzo: ['gaba'],
  opioid: ['glutamate'],
  ketamine: ['glutamate'],
  alcohol: ['glutamate', 'gaba'],
  nicotine: ['acetylcholine'],
  caffeine: ['glutamate'],
  botox: ['nmj'],
  curare: ['nmj'],
}

const DISEASE_SYSTEMS: Record<DiseaseId, SynapseKind[]> = {
  parkinsons: ['dopamine'],
  alzheimers: ['acetylcholine'],
  ms: [],
  epilepsy: ['glutamate', 'gaba'],
  myasthenia: ['nmj'],
  depression: ['serotonin'],
  schizophrenia: ['dopamine'],
}

function baseline(kind: SynapseKind): SceneParams {
  const common: SceneParams = {
    synapse: kind,
    transmitter: 'glu',
    instrument: 'membrane',
    afferentHz: 12,
    train: false,
    synthesis: 1,
    pRel: 0.82,
    quanta: 1,
    kUptake: 0.045,
    kEnzyme: 0.004,
    kLeak: 0.002,
    receptorDensity: 1,
    gabaEfficacy: 1,
    nmdaScale: 1,
    ampaScale: 1,
    nachAgonist: 0,
    gNaScale: 1,
    gNaP: 0,
    gKExtra: 0,
    myelin: 1,
    delayMs: 0.45,
    jitterMs: 0,
    blockProb: 0,
    reverseRate: 0,
    drainRate: 0,
    autoreceptor: 0,
    tonicLeak: 0,
    modGain: 0,
    iApp: 0,
    pulseAmp: 0,
    pulseHz: 12,
    gAmpa: 0.085,
    gNmda: 0.5,
    gGaba: 0.15,
    gNach: 0.28,
    showGabaTerminal: false,
    enzyme: 'none',
    transporter: 'EAAT',
    receptorLabel: 'AMPA',
    receptorStyle: 'pore',
    fatigue: 0,
    transmitterName: 'glutamate',
  }

  if (kind === 'glutamate') return common

  if (kind === 'gaba') {
    return {
      ...common,
      synapse: 'gaba',
      transmitter: 'gaba',
      quanta: 1.05,
      kUptake: 0.02,
      kEnzyme: 0.003,
      iApp: 1.5,
      pulseAmp: 18,
      pulseHz: 12,
      gAmpa: 0,
      gNmda: 0,
      gGaba: 0.56,
      showGabaTerminal: false,
      enzyme: 'gaba-t',
      transporter: 'GAT',
      receptorLabel: 'GABA-A',
      transmitterName: 'GABA',
    }
  }

  if (kind === 'dopamine') {
    return {
      ...common,
      synapse: 'dopamine',
      transmitter: 'da',
      quanta: 0.85,
      kUptake: 0.006,
      kEnzyme: 0.0015,
      modGain: 4.8,
      iApp: 1.2,
      pulseAmp: 7.4,
      pulseHz: 12,
      gAmpa: 0,
      gNmda: 0,
      enzyme: 'mao',
      transporter: 'DAT',
      receptorLabel: 'D2',
      receptorStyle: 'gpcr',
      transmitterName: 'dopamine',
    }
  }

  if (kind === 'serotonin') {
    return {
      ...common,
      synapse: 'serotonin',
      transmitter: 'ht',
      quanta: 0.85,
      kUptake: 0.0065,
      kEnzyme: 0.0014,
      modGain: 4.2,
      iApp: 1.4,
      pulseAmp: 8.4,
      pulseHz: 12,
      gAmpa: 0,
      gNmda: 0,
      enzyme: 'mao',
      transporter: 'SERT',
      receptorLabel: '5-HT',
      receptorStyle: 'gpcr',
      transmitterName: 'serotonin',
    }
  }

  if (kind === 'acetylcholine') {
    return {
      ...common,
      synapse: 'acetylcholine',
      transmitter: 'ach',
      quanta: 1,
      kUptake: 0.002,
      kEnzyme: 0.12,
      gNach: 0.32,
      enzyme: 'ache',
      transporter: 'AChE',
      receptorLabel: 'nAChR',
      transmitterName: 'acetylcholine',
    }
  }

  return {
    ...common,
    synapse: 'nmj',
    transmitter: 'ach',
    instrument: 'endplate',
    quanta: 1.15,
    kUptake: 0.001,
    kEnzyme: 0.22,
    iApp: 0,
    gAmpa: 0,
    gNmda: 0,
    gNach: 0.22,
    enzyme: 'ache',
    transporter: 'AChE',
    receptorLabel: 'nAChR',
    transmitterName: 'acetylcholine',
  }
}

function preferredSynapse(drug: DrugId | null, disease: DiseaseId | null): SynapseKind {
  if (disease === 'ms') {
    if (drug) return DRUG_SYSTEMS[drug][0]!
    return 'glutamate'
  }
  if (drug && disease) {
    const overlap = DRUG_SYSTEMS[drug].filter((s) => DISEASE_SYSTEMS[disease].includes(s))
    if (overlap.length > 0) return overlap[0]!
    return DISEASE_SYSTEMS[disease][0] ?? DRUG_SYSTEMS[drug][0]!
  }
  if (disease === 'epilepsy') return 'glutamate'
  if (disease && DISEASE_SYSTEMS[disease][0]) return DISEASE_SYSTEMS[disease][0]!
  if (drug) return DRUG_SYSTEMS[drug][0]!
  return 'glutamate'
}

export function describePair(drug: DrugId | null, disease: DiseaseId | null): Pairing {
  const synapse = preferredSynapse(drug, disease)
  if (!drug && !disease) {
    return {
      kind: 'solo',
      synapse,
      drugApplied: false,
      diseaseApplied: false,
      note: 'Healthy synapse. The afferent train is steady, and nothing is blocking clearance or the receptors.',
    }
  }
  if (drug && !disease) {
    return {
      kind: 'solo',
      synapse,
      drugApplied: true,
      diseaseApplied: false,
      note: '',
    }
  }
  if (!drug && disease) {
    return {
      kind: 'solo',
      synapse,
      drugApplied: false,
      diseaseApplied: true,
      note: disease === 'ms' ? 'Myelin is on the axon. The synapse itself is unchanged until you add a drug.' : '',
    }
  }
  if (disease === 'ms' && drug) {
    return {
      kind: 'overlay',
      synapse,
      drugApplied: true,
      diseaseApplied: true,
      note: 'Demyelination stays on the axon. The drug still acts at the synapse.',
    }
  }
  const overlap = DRUG_SYSTEMS[drug!].filter((s) => DISEASE_SYSTEMS[disease!].includes(s))
  if (overlap.length === 0) {
    const drugName = drug!
    const diseaseName = disease!
    return {
      kind: 'mismatch',
      synapse: DISEASE_SYSTEMS[disease!][0] ?? 'glutamate',
      drugApplied: false,
      diseaseApplied: true,
      note: `${labelDrug(drugName)} and ${labelDisease(diseaseName)} do not share this synapse. The trace shows the disease alone. Clear one of them to study the other.`,
    }
  }
  const warn = warning(drug!, disease!)
  if (warn) {
    return {
      kind: 'warn',
      synapse: overlap[0]!,
      drugApplied: true,
      diseaseApplied: true,
      note: warn,
    }
  }
  return {
    kind: 'compose',
    synapse: overlap[0]!,
    drugApplied: true,
    diseaseApplied: true,
    note: composeNote(drug!, disease!),
  }
}

function warning(drug: DrugId, disease: DiseaseId): string | null {
  if (disease === 'myasthenia' && (drug === 'curare' || drug === 'botox')) {
    return drug === 'curare'
      ? 'Not a treatment. Curare blocks the acetylcholine receptors that myasthenia has already thinned.'
      : 'Not a treatment. Botulinum toxin stops the release myasthenia still depends on.'
  }
  if (disease === 'schizophrenia' && (drug === 'cocaine' || drug === 'amphetamine')) {
    return 'Not a treatment. This raises dopamine further on a terminal the model already treats as overactive.'
  }
  if (disease === 'epilepsy' && drug === 'alcohol') {
    return 'Not a therapy. Alcohol deepens GABA-A current and blocks NMDA acutely. It is not an antiseizure drug, and withdrawal can do the opposite.'
  }
  if (disease === 'alzheimers' && drug === 'nicotine') {
    return 'Not a treatment. The trace is only nicotinic activation and, at a high dose, desensitization.'
  }
  if (disease === 'epilepsy' && drug === 'caffeine') {
    return 'Not a treatment. Caffeine removes a brake on release and can make this cell more excitable.'
  }
  return null
}

function composeNote(drug: DrugId, disease: DiseaseId): string {
  if (disease === 'parkinsons' && drug === 'ldopa') {
    return 'Parkinson’s has cut synthesis. L-DOPA fills vesicles back part of the way. Clearance through DAT and MAO is still there.'
  }
  if (disease === 'depression' && drug === 'ssri') {
    return 'Synthesis stays low, so each impulse releases less. Blocking SERT lets cleft serotonin recover anyway. This is the acute trace, not the weeks-long clinical response.'
  }
  if (disease === 'epilepsy' && drug === 'benzo') {
    return 'The benzodiazepine raises GABA-A efficacy on the weakened inhibitory terminal. Persistent sodium is still present.'
  }
  if (drug === 'alcohol') {
    return 'Alcohol is stacking a GABA-A boost and an NMDA block onto this condition.'
  }
  return 'Both act on this synapse. Disease is applied first, then the drug.'
}

export function labelDrug(id: DrugId): string {
  const names: Record<DrugId, string> = {
    ssri: 'Sertraline',
    cocaine: 'Cocaine',
    amphetamine: 'Amphetamine',
    ldopa: 'L-DOPA',
    benzo: 'Diazepam',
    opioid: 'Morphine',
    ketamine: 'Ketamine',
    alcohol: 'Ethanol',
    nicotine: 'Nicotine',
    caffeine: 'Caffeine',
    botox: 'Botulinum toxin',
    curare: 'Curare',
  }
  return names[id]
}

export function labelDisease(id: DiseaseId): string {
  const names: Record<DiseaseId, string> = {
    parkinsons: 'Parkinson’s',
    alzheimers: 'Alzheimer’s',
    ms: 'Multiple sclerosis',
    epilepsy: 'Epilepsy',
    myasthenia: 'Myasthenia gravis',
    depression: 'Depression',
    schizophrenia: 'Schizophrenia',
  }
  return names[id]
}

export function buildScene(sel: Selection, mode: 'condition' | 'baseline'): { params: SceneParams; pairing: Pairing } {
  const pairing = describePair(sel.drug, sel.disease)
  const params = baseline(pairing.synapse)
  if (mode === 'baseline') return { params, pairing }

  const s = clamp01(sel.severity)
  const d = clamp01(sel.dose)
  if (pairing.diseaseApplied && sel.disease) applyDisease(params, sel.disease, s)
  if (pairing.drugApplied && sel.drug) applyDrug(params, sel.drug, d, sel.disease, s)
  return { params, pairing }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function applyDisease(p: SceneParams, id: DiseaseId, s: number): void {
  if (id === 'parkinsons') p.synthesis = 1 - 0.975 * s
  if (id === 'alzheimers') {
    p.synthesis *= 1 - 0.7 * s
    p.receptorDensity *= 1 - 0.55 * s
  }
  if (id === 'epilepsy') {
    p.gabaEfficacy *= 1 - 0.83 * s
    p.gNaP = 0.4 * s
    p.showGabaTerminal = true
    p.gGaba = 1.15
  }
  if (id === 'depression') p.synthesis *= 1 - 0.65 * s
  if (id === 'myasthenia') {
    p.receptorDensity *= 1 - 0.8 * s
    p.fatigue = s
    p.train = true
  }
  if (id === 'ms') {
    p.myelin = 1 - s
    p.delayMs = 0.45 + 8 * s
    p.jitterMs = 3 * s
    p.blockProb = Math.max(0, (s - 0.55) / 0.45) * 0.85
  }
  if (id === 'schizophrenia') {
    p.pRel = Math.min(1.4, p.pRel * (1 + 0.9 * s))
    p.tonicLeak = 0.0011 * s
  }
}

function applyDrug(p: SceneParams, id: DrugId, d: number, disease: DiseaseId | null, severity: number): void {
  if (id === 'ssri') {
    p.kUptake *= 1 - 0.85 * d
    p.autoreceptor = 0.28
  }
  if (id === 'benzo') p.gabaEfficacy *= 1 + 1.6 * d
  if (id === 'opioid') {
    p.pRel *= 1 - 0.8 * d
    p.gKExtra += 0.035 * d
  }
  if (id === 'caffeine') {
    p.pRel = Math.min(1.3, p.pRel * (1 + 0.45 * d))
    p.gKExtra = Math.max(0, p.gKExtra - 0.05 * d)
    p.iApp += 12 * d
  }
  if (id === 'nicotine') {
    const desens = (d * d) / (d * d + 0.35 * 0.35)
    p.nachAgonist = d * (1 - desens)
  }
  if (id === 'cocaine') {
    p.kUptake *= 1 - 0.9 * d
    if (d > 0.75) p.gNaScale *= 1 - (d - 0.75) * 2.4
  }
  if (id === 'amphetamine') {
    p.reverseRate = 0.011 * d
    p.drainRate = 0.00135 * d
    p.kUptake *= 1 - 0.25 * d
  }
  if (id === 'ldopa') {
    if (disease === 'parkinsons') {
      const sigma = 1 - 0.975 * clamp01(severity)
      p.synthesis = sigma + (1 - sigma) * (1 - Math.exp(-1.4 * d))
    } else {
      p.synthesis = 1 + 0.28 * d
    }
  }
  if (id === 'ketamine') p.nmdaScale *= 1 - 0.92 * d
  if (id === 'alcohol') {
    p.gabaEfficacy *= 1 + 0.9 * d
    p.nmdaScale *= 1 - 0.75 * d
    p.showGabaTerminal = true
    if (p.synapse === 'glutamate') p.gGaba = Math.max(p.gGaba, 0.3)
  }
  if (id === 'botox') p.pRel *= (1 - d) ** 1.4
  if (id === 'curare') p.receptorDensity *= 1 - 0.95 * d
}

export function transmitterColor(t: Transmitter): string {
  if (t === 'da') return '#e4a45c'
  if (t === 'ht') return '#d4c0ee'
  if (t === 'gaba') return '#a9c6de'
  if (t === 'ach') return '#a9d0bc'
  return '#e3947c'
}

export type { SynapseKind }
