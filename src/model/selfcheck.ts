import { buildScene } from './scene.ts'
import { Simulator } from './sim.ts'
import type { DiseaseId, DrugId, Readout } from './types.ts'

function run(drug: DrugId | null, dose: number, disease: DiseaseId | null, severity: number, ms: number, seed = 3): Readout {
  const built = buildScene({ drug, dose, disease, severity }, 'condition')
  const healthy = buildScene({ drug, dose, disease, severity }, 'baseline')
  const refSim = new Simulator(healthy.params, 2)
  refSim.run(1600)
  const ref = Math.max(0.02, refSim.meanN(800))
  const sim = new Simulator(built.params, seed)
  sim.run(ms)
  const r = sim.readout(ref)
  return r
}

function line(name: string, r: Readout, extra = ''): void {
  console.log(
    `${name.padEnd(28)} ${r.firingHz.toFixed(1).padStart(6)} Hz  fill ${r.vesicleFill.toFixed(2)}  cleft ${r.cleft.toFixed(2)}  peak ${r.peakMv.toFixed(0).padStart(4)}  short ${r.shortIsiFraction.toFixed(2)}  rel ${r.releasePerSec.toFixed(0)}  blk ${r.blockFraction.toFixed(2)} ${extra}`,
  )
}

const cases: [string, DrugId | null, number, DiseaseId | null, number, number][] = [
  ['healthy glu', null, 0, null, 0, 2000],
  ['gaba base', 'benzo', 0, null, 0, 2000],
  ['benzo 0.55', 'benzo', 0.55, null, 0, 2000],
  ['epilepsy 0.72', null, 0, 'epilepsy', 0.72, 2000],
  ['epi+benzo', 'benzo', 0.55, 'epilepsy', 0.72, 2000],
  ['pd 0.8', null, 0, 'parkinsons', 0.8, 2000],
  ['pd+ldopa', 'ldopa', 0.42, 'parkinsons', 0.8, 2000],
  ['ldopa alone', 'ldopa', 0.42, null, 0, 2000],
  ['da base', 'cocaine', 0, null, 0, 2000],
  ['cocaine 0.5', 'cocaine', 0.5, null, 0, 2000],
  ['cocaine 0.95', 'cocaine', 0.95, null, 0, 2000],
  ['amph 4s', 'amphetamine', 0.7, null, 0, 4000],
  ['ssri', 'ssri', 0.5, null, 0, 2000],
  ['depression', null, 0, 'depression', 0.6, 2000],
  ['dep+ssri', 'ssri', 0.5, 'depression', 0.6, 2000],
  ['opioid', 'opioid', 0.6, null, 0, 2000],
  ['caffeine', 'caffeine', 0.6, null, 0, 2000],
  ['ketamine', 'ketamine', 0.8, null, 0, 2000],
  ['alcohol', 'alcohol', 0.6, null, 0, 2000],
  ['nic 0', 'nicotine', 0, null, 0, 2000],
  ['nic 0.35', 'nicotine', 0.35, null, 0, 2000],
  ['nic 0.95', 'nicotine', 0.95, null, 0, 2000],
  ['botox', 'botox', 0.9, null, 0, 2000],
  ['curare', 'curare', 0.9, null, 0, 2000],
  ['mg', null, 0, 'myasthenia', 0.75, 2000],
  ['ms', null, 0, 'ms', 0.85, 2000],
  ['alz', null, 0, 'alzheimers', 0.7, 2000],
  ['schiz', null, 0, 'schizophrenia', 0.7, 2000],
  ['schiz+amph', 'amphetamine', 0.5, 'schizophrenia', 0.7, 2500],
]

for (const [name, drug, dose, disease, sev, ms] of cases) {
  // benzo at dose 0 still selects gaba synapse via the drug id. For a true gaba baseline, pass benzo with dose 0.
  line(name, run(drug, dose, disease, sev, ms))
}

const mismatch = buildScene({ drug: 'ssri', dose: 0.5, disease: 'parkinsons', severity: 0.8 }, 'condition')
console.log('mismatch', mismatch.pairing.kind, mismatch.pairing.drugApplied, mismatch.params.synapse, 'kUptake', mismatch.params.kUptake.toFixed(4))

let failed = false
function expect(name: string, ok: boolean, detail: string): void {
  if (!ok) {
    failed = true
    console.error(`FAIL ${name}: ${detail}`)
  } else {
    console.log(`ok ${name}`)
  }
}

const pd = run(null, 0, 'parkinsons', 0.8, 2000)
const rescued = run('ldopa', 0.42, 'parkinsons', 0.8, 2000)
const benzo = run('benzo', 0.55, null, 0, 2000)
const gaba = run('benzo', 0, null, 0, 2000)
const epi = run(null, 0, 'epilepsy', 0.72, 2000)
const epiBenzo = run('benzo', 0.55, 'epilepsy', 0.72, 2000)
const botox = run('botox', 0.9, null, 0, 2000)
const curare = run('curare', 0.9, null, 0, 2000)
const coke = run('cocaine', 0.5, null, 0, 2000)
const amph = run('amphetamine', 0.7, null, 0, 4000)
const dep = run(null, 0, 'depression', 0.6, 2000)
const depSsri = run('ssri', 0.5, 'depression', 0.6, 2000)
const nicMid = run('nicotine', 0.35, null, 0, 2000)
const nicHi = run('nicotine', 0.95, null, 0, 2000)
const nic0 = run('nicotine', 0, null, 0, 2000)
const ms = run(null, 0, 'ms', 0.85, 2000)

expect('parkinsons fill', pd.vesicleFill < 0.35, String(pd.vesicleFill))
expect('ldopa refill', rescued.vesicleFill > 0.45 && rescued.vesicleFill < 0.7, String(rescued.vesicleFill))
expect('benzo slows', benzo.firingHz < gaba.firingHz - 3, `${gaba.firingHz} -> ${benzo.firingHz}`)
expect('epilepsy bursts', epi.firingHz > 16 && epi.shortIsiFraction > 0.4, `${epi.firingHz} ${epi.shortIsiFraction}`)
expect('benzo calms epilepsy', epiBenzo.firingHz < epi.firingHz - 3, `${epi.firingHz} -> ${epiBenzo.firingHz}`)
expect('botox empty', botox.firingHz < 1 && botox.cleft < 0.2, `${botox.firingHz} ${botox.cleft}`)
expect('curare blocked receptor', curare.firingHz < 1 && curare.cleft > 0.6, `${curare.firingHz} ${curare.cleft}`)
expect('cocaine cleft', coke.cleft > 1.15, String(coke.cleft))
expect('amphetamine drain', amph.vesicleFill < 0.45 && amph.cleft > 0.7, `${amph.vesicleFill} ${amph.cleft}`)
expect('ssri recovers cleft', depSsri.cleft > dep.cleft + 0.05 && depSsri.vesicleFill < 0.75, `${dep.cleft} -> ${depSsri.cleft}`)
expect('nicotine nonmonotonic', nicMid.firingHz > nic0.firingHz + 5 && nicMid.firingHz > nicHi.firingHz + 5, `${nic0.firingHz} ${nicMid.firingHz} ${nicHi.firingHz}`)
expect('ms block', ms.blockFraction > 0.3 && ms.firingHz < 10, `${ms.blockFraction} ${ms.firingHz}`)
expect('mismatch ignores drug', mismatch.pairing.kind === 'mismatch' && !mismatch.pairing.drugApplied, mismatch.pairing.kind)
if (failed) throw new Error('simulation checks failed')
