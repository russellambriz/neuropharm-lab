import type { Readout, SceneParams } from './types.ts'

export interface Stat {
  k: string
  v: string
}

function n(x: number, digits = 2): string {
  return x.toFixed(digits)
}

function hz(x: number): string {
  return String(Math.round(x))
}

export function compareStats(baseP: SceneParams, condP: SceneParams, baseR: Readout, condR: Readout): Stat[] {
  const candidates: { k: string; a: number; b: number; digits?: number }[] = [
    { k: 'GABA-A', a: baseP.gabaEfficacy, b: condP.gabaEfficacy },
    { k: 'NMDA', a: baseP.nmdaScale, b: condP.nmdaScale },
    { k: 'Vesicle ceiling', a: baseP.synthesis, b: condP.synthesis },
    { k: 'P release', a: baseP.pRel, b: condP.pRel },
    { k: 'Persistent Na', a: baseP.gNaP, b: condP.gNaP },
    { k: 'Myelin', a: baseP.myelin, b: condP.myelin },
    { k: 'Receptors', a: baseP.receptorDensity, b: condP.receptorDensity },
    { k: 'Uptake', a: baseP.kUptake, b: condP.kUptake, digits: 3 },
    { k: 'gNa', a: baseP.gNaScale, b: condP.gNaScale },
    { k: 'Nicotinic agonist', a: baseP.nachAgonist, b: condP.nachAgonist },
  ]
  const ranked = candidates
    .map((c) => ({ ...c, delta: Math.abs(c.b - c.a) / Math.max(0.05, Math.abs(c.a)) }))
    .filter((c) => Math.abs(c.b - c.a) > 0.02)
    .sort((x, y) => y.delta - x.delta)
  const extra = ranked.slice(0, 2)
  while (extra.length < 2) {
    extra.push({ k: 'Vesicle fill', a: baseR.vesicleFill, b: condR.vesicleFill, delta: 0 })
  }
  return [
    { k: 'Window', v: '400 ms' },
    { k: 'Firing', v: `${hz(baseR.firingHz)} → ${hz(condR.firingHz)} Hz` },
    { k: `Cleft ${condP.transmitterName}`, v: `${n(baseR.cleft)} → ${n(condR.cleft)}` },
    ...extra.map((c) => ({ k: c.k, v: `${n(c.a, c.digits)} → ${n(c.b, c.digits)}` })),
  ]
}

export interface DeltaRow {
  name: string
  base: string
  cond: string
}

export function deltaRows(baseP: SceneParams, condP: SceneParams, baseR: Readout, condR: Readout): DeltaRow[] {
  const rows: { name: string; a: number; b: number; digits?: number; suffix?: string }[] = [
    { name: 'Firing', a: baseR.firingHz, b: condR.firingHz, digits: 0, suffix: ' Hz' },
    { name: 'Vesicle fill', a: baseR.vesicleFill, b: condR.vesicleFill },
    { name: `Cleft ${condP.transmitterName}`, a: baseR.cleft, b: condR.cleft },
    { name: 'GABA-A efficacy', a: baseP.gabaEfficacy, b: condP.gabaEfficacy },
    { name: 'NMDA scale', a: baseP.nmdaScale, b: condP.nmdaScale },
    { name: 'Release probability', a: baseP.pRel, b: condP.pRel },
    { name: 'Receptor density', a: baseP.receptorDensity, b: condP.receptorDensity },
    { name: 'Uptake rate', a: baseP.kUptake, b: condP.kUptake, digits: 3 },
    { name: 'Persistent Na', a: baseP.gNaP, b: condP.gNaP },
    { name: 'Myelin', a: baseP.myelin, b: condP.myelin },
    { name: 'Sodium conductance', a: baseP.gNaScale, b: condP.gNaScale },
    { name: 'Nicotinic agonist', a: baseP.nachAgonist, b: condP.nachAgonist },
    { name: 'Synthesis ceiling', a: baseP.synthesis, b: condP.synthesis },
  ]
  const changed = rows.filter((r) => Math.abs(r.a - r.b) > 0.02)
  const picked = (changed.length > 0 ? changed : rows.slice(0, 4)).slice(0, 6)
  return picked.map((r) => ({
    name: r.name,
    base: r.a.toFixed(r.digits ?? 2) + (r.suffix ?? ''),
    cond: r.b.toFixed(r.digits ?? 2) + (r.suffix ?? ''),
  }))
}
