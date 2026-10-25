import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildScene, sameSynapse } from '../model/scene.ts'
import { Simulator } from '../model/sim.ts'
import type { DiseaseId, DrugId, Pairing, Readout, SceneParams } from '../model/types.ts'
import { diseaseById, drugById } from '../content/library.ts'

export type ViewName = 'lab' | 'library' | 'monograph' | 'compare'
export type RailTab = 'drugs' | 'diseases'

export interface Selection {
  drug: DrugId | null
  dose: number
  disease: DiseaseId | null
  severity: number
  applyDrug: boolean
  applyDisease: boolean
}

interface Live {
  cleft: number
  baselineCleft: number
}

interface LabValue {
  view: ViewName
  setView: (view: ViewName) => void
  tab: RailTab
  setTab: (tab: RailTab) => void
  query: string
  setQuery: (query: string) => void
  sheet: boolean
  setSheet: (open: boolean) => void
  selection: Selection
  selectDrug: (id: DrugId | null) => void
  selectDisease: (id: DiseaseId | null) => void
  chooseDrug: (id: DrugId | null) => void
  chooseDisease: (id: DiseaseId | null) => void
  setApplyDrug: (on: boolean) => void
  setApplyDisease: (on: boolean) => void
  setDose: (dose: number) => void
  setSeverity: (severity: number) => void
  toggleCompare: () => void
  pairing: Pairing
  params: SceneParams
  baselineParams: SceneParams
  readout: Readout
  baselineReadout: Readout
  condition: Simulator | null
  baseline: Simulator | null
  liveRef: { current: Live }
  reduced: boolean
  subscribe: (fn: () => void) => () => void
}

const LabContext = createContext<LabValue | null>(null)

const EMPTY_READOUT: Readout = {
  firingHz: 0,
  restMv: -65,
  vesicleFill: 1,
  cleft: 1,
  cleftRaw: 0,
  peakMv: -65,
  shortIsiFraction: 0,
  releasePerSec: 0,
  blockFraction: 0,
}

function smooth(prev: Readout, next: Readout): Readout {
  const mix = (a: number, b: number) => a * 0.72 + b * 0.28
  return {
    ...next,
    firingHz: mix(prev.firingHz, next.firingHz),
    restMv: mix(prev.restMv, next.restMv),
    vesicleFill: mix(prev.vesicleFill, next.vesicleFill),
    cleft: mix(prev.cleft, next.cleft),
  }
}

const DRUG_IDS: DrugId[] = ['ssri', 'cocaine', 'amphetamine', 'ldopa', 'benzo', 'opioid', 'ketamine', 'alcohol', 'nicotine', 'caffeine', 'botox', 'curare']
const DISEASE_IDS: DiseaseId[] = ['parkinsons', 'alzheimers', 'ms', 'epilepsy', 'myasthenia', 'depression', 'schizophrenia']

function isDrug(value: string | null): value is DrugId {
  return DRUG_IDS.includes(value as DrugId)
}

function isDisease(value: string | null): value is DiseaseId {
  return DISEASE_IDS.includes(value as DiseaseId)
}

function isView(value: string | null): value is ViewName {
  return value === 'lab' || value === 'library' || value === 'monograph' || value === 'compare'
}

function unit(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(1, n))
}

function preferApplied(sel: Selection, prefer: 'drug' | 'disease'): Selection {
  if (!sel.drug || !sel.disease || !sel.applyDrug || !sel.applyDisease) return sel
  if (sameSynapse(sel.drug, sel.disease)) return sel
  return prefer === 'drug' ? { ...sel, applyDisease: false } : { ...sel, applyDrug: false }
}

function mask(sel: Selection) {
  const drugOn = Boolean(sel.drug && sel.applyDrug)
  const diseaseOn = Boolean(sel.disease && sel.applyDisease)
  const conflict = Boolean(sel.drug && sel.disease && !sameSynapse(sel.drug, sel.disease))
  let drug = sel.drug
  let disease = sel.disease
  if (conflict) {
    if (diseaseOn && !drugOn) drug = null
    else disease = null
  }
  return {
    drug,
    dose: drugOn ? sel.dose : 0,
    disease,
    severity: diseaseOn ? sel.severity : 0,
  }
}

function initialLab(): { view: ViewName; selection: Selection } {
  const fallback = {
    view: 'lab' as ViewName,
    selection: preferApplied(
      { drug: 'ldopa' as DrugId, dose: 0.42, disease: 'parkinsons' as DiseaseId, severity: 0.8, applyDrug: true, applyDisease: true },
      'drug',
    ),
  }
  if (typeof window === 'undefined') return fallback
  const params = new URLSearchParams(window.location.search)
  if (!params.has('view') && !params.has('drug') && !params.has('disease')) return fallback
  const drugParam = params.get('drug')
  const diseaseParam = params.get('disease')
  const viewParam = params.get('view')
  const drug = isDrug(drugParam) ? drugParam : null
  const disease = isDisease(diseaseParam) ? diseaseParam : null
  return {
    view: isView(viewParam) ? viewParam : 'lab',
    selection: preferApplied(
      {
        drug,
        disease,
        dose: unit(params.get('dose'), drug ? drugById(drug).defaultDose : 0.5),
        severity: unit(params.get('severity'), disease ? diseaseById(disease).defaultSeverity : 0.7),
        applyDrug: Boolean(drug),
        applyDisease: Boolean(disease),
      },
      'drug',
    ),
  }
}

export function LabProvider({ children }: { children: ReactNode }) {
  const start = initialLab()
  const [view, setView] = useState<ViewName>(start.view)
  const [tab, setTab] = useState<RailTab>(start.selection.disease ? 'diseases' : 'drugs')
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState(false)
  const [selection, setSelection] = useState<Selection>(start.selection)
  const [readout, setReadout] = useState<Readout>(EMPTY_READOUT)
  const [baselineReadout, setBaselineReadout] = useState<Readout>(EMPTY_READOUT)
  const [reduced, setReduced] = useState(false)
  const [sims, setSims] = useState<{ condition: Simulator; baseline: Simulator } | null>(null)

  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const readoutRef = useRef(readout)
  const baseReadoutRef = useRef(baselineReadout)
  const live = useRef<Live>({ cleft: 1, baselineCleft: 1 })
  const listeners = useRef(new Set<() => void>())

  const applied = useMemo(() => mask(selection), [selection])
  const built = useMemo(() => buildScene(applied, 'condition'), [applied])
  const baseBuilt = useMemo(() => buildScene(applied, 'baseline'), [applied])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const baseParams = buildScene(mask(selectionRef.current), 'baseline').params
    const condParams = buildScene(mask(selectionRef.current), 'condition').params
    const refSim = new Simulator(baseParams, 2)
    refSim.run(1400)
    const cleftRef = Math.max(0.02, refSim.meanN(800))
    const condition = new Simulator(condParams, 11)
    const baseline = new Simulator(baseParams, 13)
    condition.run(480)
    baseline.run(480)
    const next = condition.readout(cleftRef)
    const nextBase = baseline.readout(cleftRef)
    readoutRef.current = next
    baseReadoutRef.current = nextBase
    live.current = { cleft: next.cleft, baselineCleft: nextBase.cleft }
    setReadout(next)
    setBaselineReadout(nextBase)
    setSims({ condition, baseline })

    let raf = 0
    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      const sel = mask(selectionRef.current)
      const cond = buildScene(sel, 'condition')
      const bas = buildScene(sel, 'baseline')
      condition.setParams(cond.params)
      baseline.setParams(bas.params)
      condition.run(dt)
      baseline.run(dt)
      const c = condition.readout(cleftRef)
      const b = baseline.readout(cleftRef)
      live.current = { cleft: c.cleft, baselineCleft: b.cleft }
      for (const fn of listeners.current) fn()
      acc += dt
      if (acc > 140) {
        acc = 0
        const sm = smooth(readoutRef.current, c)
        const sb = smooth(baseReadoutRef.current, b)
        readoutRef.current = sm
        baseReadoutRef.current = sb
        setReadout(sm)
        setBaselineReadout(sb)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [selection.applyDrug ? selection.drug : null, selection.applyDisease ? selection.disease : null])

  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn)
    return () => {
      listeners.current.delete(fn)
    }
  }, [])

  const selectDrug = (id: DrugId | null) => {
    setSelection((prev) => {
      if (id === null || prev.drug === id) return { ...prev, drug: null, applyDrug: false }
      return preferApplied({ ...prev, drug: id, dose: drugById(id).defaultDose, applyDrug: true }, 'drug')
    })
    setTab('drugs')
    setSheet(false)
  }

  const selectDisease = (id: DiseaseId | null) => {
    setSelection((prev) => {
      if (id === null || prev.disease === id) return { ...prev, disease: null, applyDisease: false }
      return preferApplied({ ...prev, disease: id, severity: diseaseById(id).defaultSeverity, applyDisease: true }, 'disease')
    })
    setTab('diseases')
    setSheet(false)
  }

  const chooseDrug = (id: DrugId | null) => {
    setSelection((prev) => {
      if (id === null) return { ...prev, drug: null, applyDrug: false }
      if (prev.drug === id) return preferApplied({ ...prev, applyDrug: true }, 'drug')
      return preferApplied({ ...prev, drug: id, dose: drugById(id).defaultDose, applyDrug: true }, 'drug')
    })
    setTab('drugs')
  }

  const chooseDisease = (id: DiseaseId | null) => {
    setSelection((prev) => {
      if (id === null) return { ...prev, disease: null, applyDisease: false }
      if (prev.disease === id) return preferApplied({ ...prev, applyDisease: true }, 'disease')
      return preferApplied({ ...prev, disease: id, severity: diseaseById(id).defaultSeverity, applyDisease: true }, 'disease')
    })
    setTab('diseases')
  }

  const value: LabValue = {
    view,
    setView,
    tab,
    setTab,
    query,
    setQuery,
    sheet,
    setSheet,
    selection,
    selectDrug,
    selectDisease,
    chooseDrug,
    chooseDisease,
    setApplyDrug: (on) =>
      setSelection((prev) => {
        if (!prev.drug) return { ...prev, applyDrug: false }
        return preferApplied({ ...prev, applyDrug: on }, 'drug')
      }),
    setApplyDisease: (on) =>
      setSelection((prev) => {
        if (!prev.disease) return { ...prev, applyDisease: false }
        return preferApplied({ ...prev, applyDisease: on }, 'disease')
      }),
    setDose: (dose) => setSelection((prev) => ({ ...prev, dose })),
    setSeverity: (severity) => setSelection((prev) => ({ ...prev, severity })),
    toggleCompare: () => setView((v) => (v === 'compare' ? 'lab' : 'compare')),
    pairing: built.pairing,
    params: built.params,
    baselineParams: baseBuilt.params,
    readout,
    baselineReadout,
    condition: sims?.condition ?? null,
    baseline: sims?.baseline ?? null,
    liveRef: live,
    reduced,
    subscribe,
  }

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab(): LabValue {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error('useLab must be used inside LabProvider')
  return ctx
}
