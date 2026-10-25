import type { ReactNode } from 'react'
import { DISCLAIMER, diseaseById, drugById } from '../content/library.ts'
import { labelDisease, labelDrug } from '../model/scene.ts'
import type { SceneParams } from '../model/types.ts'
import { useLab } from '../state/lab.tsx'

export function toneClass(params: SceneParams): string {
  if (params.transmitter === 'da') return 'tone-da'
  if (params.transmitter === 'ht') return 'tone-ht'
  if (params.transmitter === 'gaba') return 'tone-gaba'
  if (params.transmitter === 'ach') return 'tone-ach'
  return 'tone-glu'
}

export function Header() {
  const lab = useLab()
  const { selection } = lab
  const disease = selection.disease ? diseaseById(selection.disease) : null
  const drug = selection.drug ? drugById(selection.drug) : null
  return (
    <header className="top">
      <button className="brand" onClick={() => lab.setView('lab')} aria-label="NeuroPharm Lab, back to the lab">
        <span className="brand-mark">NeuroPharm Lab</span>
      </button>
      <div className="top-center">
        <div className={`slot ${disease ? '' : 'ghost'}`}>
          <span className="k">Disease</span>
          <span className="v">{disease ? labelDisease(disease.id) : 'None'}</span>
          {disease ? <span className="dose">{selection.severity.toFixed(2)}</span> : null}
        </div>
        <div className={`slot ${drug ? '' : 'ghost'}`}>
          <span className="k">Drug</span>
          <span className="v">{drug ? labelDrug(drug.id) : 'None'}</span>
          {drug ? <span className="dose">{selection.dose.toFixed(2)}</span> : null}
        </div>
      </div>
      <div className="top-right">
        <button className="browse linkish" onClick={() => lab.setSheet(!lab.sheet)}>
          {lab.sheet ? 'Close' : 'Browse'}
        </button>
        {lab.view === 'library' ? (
          <button className="linkish" onClick={() => lab.setView('lab')}>Open in the lab</button>
        ) : (
          <button className="linkish" onClick={() => lab.setView('library')}>Library</button>
        )}
        <button className={`switch ${lab.view === 'compare' ? 'on' : ''}`} onClick={lab.toggleCompare} aria-pressed={lab.view === 'compare'}>
          <i />
          Before / After
        </button>
        <span className="top-note">Not medical advice</span>
      </div>
    </header>
  )
}

export function Slider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint: string
}) {
  const pct = `${Math.round(value * 1000) / 10}%`
  return (
    <label className="tune">
      <div className="tune-top">
        <span>{label}</span>
        <b>{value.toFixed(2)}</b>
      </div>
      <div className="track">
        <div className="fill" style={{ width: pct }} />
        <div className="thumb" style={{ left: pct }} />
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(value * 1000)}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={Number(value.toFixed(2))}
          aria-valuetext={value.toFixed(2)}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value) / 1000)}
        />
      </div>
      <p className="hint">{hint}</p>
    </label>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="search">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="11" cy="11" r="6.25" />
        <path d="M16 16.5 L20 20.5" />
      </svg>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}

export function DossierBody({ variant = 'rail', children }: { variant?: 'rail' | 'article'; children?: ReactNode }) {
  const lab = useLab()
  const drug = lab.selection.drug ? drugById(lab.selection.drug) : null
  const disease = lab.selection.disease ? diseaseById(lab.selection.disease) : null
  const showDrug = Boolean(drug && lab.pairing.drugApplied)
  const entry = showDrug ? drug : disease
  const lead = entry
    ? `${showDrug && disease ? `With ${disease.name}. ` : ''}${entry.line}`
    : 'Nothing is blocking clearance, release, or the receptors.'
  return (
    <>
      <p className="kicker">{variant === 'article' ? 'Mechanism of action' : entry ? entry.kicker : 'Baseline'}</p>
      <h1>{entry ? entry.name : 'Healthy synapse'}</h1>
      <p className={variant === 'article' ? 'lede' : 'subhead'}>{lead}</p>
      {entry ? (
        <>
          <div className="block">
            <h3>Mechanism</h3>
            <p>{entry.mechanism}</p>
          </div>
          <div className="block">
            <h3>In this model</h3>
            <p>{entry.inModel}</p>
            {lab.pairing.note ? <p>{lab.pairing.note}</p> : null}
          </div>
          <div className="block">
            <h3>Effects</h3>
            <p>{entry.effects}</p>
          </div>
          <div className="block">
            <h3>Side effects</h3>
            <p>{entry.sideEffects}</p>
          </div>
        </>
      ) : (
        <div className="block">
          <h3>What you are looking at</h3>
          <p>
            A regular afferent train arrives at one synapse. Vesicles release, transmitter crosses the cleft, and the postsynaptic cell answers with the Hodgkin–Huxley currents under the trace. Pick a drug, a disease, or both.
          </p>
        </div>
      )}
      {children}
      {variant === 'rail' ? <p className="disclaimer">{DISCLAIMER}</p> : null}
    </>
  )
}

export function formatHz(value: number): string {
  return String(Math.round(value))
}

export function formatMv(value: number): string {
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : ''}${rounded}`
}
