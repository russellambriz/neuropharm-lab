import { useEffect, useRef } from 'react'
import { DISEASES, DRUGS, diseaseById } from '../content/library.ts'
import { labelDisease, labelDrug } from '../model/scene.ts'
import { useLab } from '../state/lab.tsx'
import { DossierBody, Search, Slider, formatHz, formatMv } from './bits.tsx'
import { StageCanvas, TraceCanvas } from './canvases.tsx'

export function LabView() {
  const lab = useLab()
  const q = lab.query.trim().toLowerCase()
  const pool = lab.tab === 'drugs' ? DRUGS : DISEASES
  const items = pool.filter((entry) => `${entry.name} ${entry.kicker} ${entry.line} ${entry.chip}`.toLowerCase().includes(q))
  const instrument = lab.params.instrument === 'endplate' ? 'Endplate potential' : 'Postsynaptic membrane'
  const comparing = Boolean(lab.selection.drug || lab.selection.disease)
  const pip = lab.params.transmitter === 'da' ? 'var(--da)' : lab.params.transmitter === 'ht' ? 'var(--ht)' : lab.params.transmitter === 'gaba' ? 'var(--gaba)' : lab.params.transmitter === 'ach' ? 'var(--ach)' : 'var(--glu)'
  return (
    <div className="workspace">
      <PhoneDock />
      <aside className="rail">
        <Search value={lab.query} onChange={lab.setQuery} placeholder="Search the library" />
        <div className="tabs" role="tablist">
          <button className={`tab ${lab.tab === 'drugs' ? 'on' : ''}`} onClick={() => lab.setTab('drugs')} role="tab" aria-selected={lab.tab === 'drugs'}>
            Drugs
          </button>
          <button className={`tab ${lab.tab === 'diseases' ? 'on' : ''}`} onClick={() => lab.setTab('diseases')} role="tab" aria-selected={lab.tab === 'diseases'}>
            Diseases
          </button>
        </div>
        <div className="list">
          {items.length === 0 ? <p className="hint" style={{ padding: '12px 4px' }}>Nothing in the library matches that.</p> : null}
          {items.map((entry) => {
            const on = entry.kind === 'drug' ? lab.selection.drug === entry.id : lab.selection.disease === entry.id
            return (
              <button
                key={entry.id}
                className={`item ${on ? 'on' : ''}`}
                onClick={() => (entry.kind === 'drug' ? lab.selectDrug(entry.id) : lab.selectDisease(entry.id))}
              >
                <span className="name">{entry.name}</span>
                <span className="meta">{entry.chip}</span>
              </button>
            )
          })}
        </div>
        <div className="paired">
          <div className="paired-label">{lab.pairing.kind === 'mismatch' ? 'Not on the same synapse' : 'On this synapse'}</div>
          {lab.selection.disease ? (
            <Slider
              label={`Severity · ${diseaseById(lab.selection.disease).name}`}
              value={lab.selection.severity}
              onChange={lab.setSeverity}
              hint="Unitless. 0 is healthy tissue, 1 is the far end of the model."
            />
          ) : null}
          {lab.selection.drug ? (
            <Slider label="Dose" value={lab.selection.dose} onChange={lab.setDose} hint="Unitless. Not milligrams, and not a prescription." />
          ) : null}
          {!lab.selection.drug && !lab.selection.disease ? <p className="hint">Choose a drug or a disease. The trace is a healthy synapse until you do.</p> : null}
        </div>
      </aside>
      <section className="stage-col">
        <div className="stage">
          {lab.pairing.kind === 'mismatch' || lab.pairing.kind === 'warn' ? (
            <div className="banner">
              <strong>{lab.pairing.kind === 'mismatch' ? 'These two do not share a synapse. ' : 'Read this pair carefully. '}</strong>
              {lab.pairing.note}
            </div>
          ) : null}
          <div className="stage-art">
            <StageCanvas sim={lab.condition} which="condition" />
          </div>
          <p className="stage-caption">Schematic · bouton enlarged · not to scale</p>
          <div className="legend">
            <span><i className="pip fill" style={{ background: pip }} /> In a vesicle</span>
            <span><i className="pip empty" /> Empty vesicle</span>
            <span><i className="pip cleft" style={{ background: pip, boxShadow: `0 0 8px ${pip}` }} /> In the cleft</span>
          </div>
        </div>
        <div className={`trace-card ${comparing ? 'with-ba' : ''}`}>
          <div className="trace-head">
            <h2>{instrument}</h2>
            <p>{comparing ? '400 ms · baseline, then this condition' : '400 ms · afferent held steady'}</p>
            <button className="phone-note linkish" onClick={() => lab.setView('monograph')}>
              Notes
            </button>
          </div>
          {comparing ? (
            <BeforeAfter
              firing={[lab.baselineReadout.firingHz, lab.readout.firingHz]}
              rest={[lab.baselineReadout.restMv, lab.readout.restMv]}
              fill={[lab.baselineReadout.vesicleFill, lab.readout.vesicleFill]}
              cleft={[lab.baselineReadout.cleft, lab.readout.cleft]}
              transmitter={lab.params.transmitterName}
            />
          ) : (
            <div className="meters">
              <div className="meter">
                <b>{formatHz(lab.readout.firingHz)}</b>
                <span>Hz firing</span>
              </div>
              <div className="meter">
                <b>{formatMv(lab.readout.restMv)}</b>
                <span>mV rest</span>
              </div>
              <div className="meter">
                <b>{lab.readout.vesicleFill.toFixed(2)}</b>
                <span>Vesicle fill</span>
              </div>
              <div className="meter">
                <b>{lab.readout.cleft.toFixed(2)}</b>
                <span>Cleft {lab.params.transmitterName}</span>
              </div>
            </div>
          )}
          {comparing ? (
            <div className="trace-key">
              <span><i className="base" /> Baseline</span>
              <span><i className="now" /> This condition</span>
            </div>
          ) : null}
          <TraceCanvas sim={lab.condition} baseline={comparing ? lab.baseline : null} />
          <p className="eq">C dV/dt = −gNa m³h (V−ENa) − gK n⁴ (V−EK) − gL (V−EL) + Isyn</p>
        </div>
      </section>
      <aside className="dossier">
        <DossierBody>
          <button className="linkish" style={{ marginTop: 14, alignSelf: 'flex-start' }} onClick={() => lab.setView('monograph')}>
            Open the monograph
          </button>
        </DossierBody>
      </aside>
    </div>
  )
}

function PhoneDock() {
  const lab = useLab()
  const { selection } = lab
  const drugs = lab.tab === 'drugs'
  const selected = drugs ? selection.drug : selection.disease
  const value = drugs ? selection.dose : selection.severity
  const row = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const id = selected ?? 'none'
    const chip = row.current?.querySelector<HTMLElement>(`[data-chip="${id}"]`)
    chip?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [selected, drugs])
  const entries = drugs ? DRUGS : DISEASES
  return (
    <div className="dock">
      <div className="dock-switches">
        <div className={`dock-side ${lab.tab === 'diseases' ? 'open' : ''}`}>
          <button
            type="button"
            className={`switch ${selection.disease && selection.applyDisease ? 'on' : ''}`}
            role="switch"
            aria-checked={Boolean(selection.disease && selection.applyDisease)}
            aria-label="Apply disease"
            disabled={!selection.disease}
            onClick={() => lab.setApplyDisease(!selection.applyDisease)}
          >
            <i />
          </button>
          <button type="button" className="dock-name" onClick={() => lab.setTab('diseases')}>
            {selection.disease ? labelDisease(selection.disease) : 'Disease'}
          </button>
        </div>
        <div className={`dock-side ${lab.tab === 'drugs' ? 'open' : ''}`}>
          <button
            type="button"
            className={`switch ${selection.drug && selection.applyDrug ? 'on' : ''}`}
            role="switch"
            aria-checked={Boolean(selection.drug && selection.applyDrug)}
            aria-label="Apply drug"
            disabled={!selection.drug}
            onClick={() => lab.setApplyDrug(!selection.applyDrug)}
          >
            <i />
          </button>
          <button type="button" className="dock-name" onClick={() => lab.setTab('drugs')}>
            {selection.drug ? labelDrug(selection.drug) : 'Drug'}
          </button>
        </div>
      </div>
      <div className="chips" ref={row} role="listbox" aria-label={drugs ? 'Drugs' : 'Diseases'}>
        <button type="button" data-chip="none" className={`chip ${selected ? '' : 'on'}`} onClick={() => (drugs ? lab.chooseDrug(null) : lab.chooseDisease(null))}>
          None
        </button>
        {entries.map((entry) => (
          <button
            type="button"
            key={entry.id}
            data-chip={entry.id}
            className={`chip ${selected === entry.id ? 'on' : ''}`}
            onClick={() => (entry.kind === 'drug' ? lab.chooseDrug(entry.id) : lab.chooseDisease(entry.id))}
          >
            {entry.name}
          </button>
        ))}
      </div>
      <label className={`scale ${selected ? '' : 'idle'}`}>
        <div className="scale-top">
          <span>{drugs ? 'Dose' : 'Severity'}</span>
          <b>{selected ? `${Math.round(value * 100)}%` : '—'}</b>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${selected ? value * 100 : 0}%` }} />
          <div className="thumb" style={{ left: `${selected ? value * 100 : 0}%` }} />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={selected ? Math.round(value * 100) : 0}
            disabled={!selected}
            aria-label={drugs ? 'Dose' : 'Severity'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={selected ? Math.round(value * 100) : 0}
            aria-valuetext={selected ? `${Math.round(value * 100)} percent` : 'No selection'}
            onChange={(event) => {
              const next = Number(event.target.value) / 100
              if (drugs) lab.setDose(next)
              else lab.setSeverity(next)
            }}
          />
        </div>
        <div className="scale-ticks" aria-hidden="true">
          <span>Low</span>
          <span>Med</span>
          <span>High</span>
        </div>
      </label>
    </div>
  )
}

function BeforeAfter({
  firing,
  rest,
  fill,
  cleft,
  transmitter,
}: {
  firing: [number, number]
  rest: [number, number]
  fill: [number, number]
  cleft: [number, number]
  transmitter: string
}) {
  const rows = [
    { k: 'Hz firing', base: formatHz(firing[0]), cond: formatHz(firing[1]), d: signedDelta(firing[0], firing[1], 0) },
    { k: 'mV rest', base: formatMv(rest[0]), cond: formatMv(rest[1]), d: signedDelta(rest[0], rest[1], 0) },
    { k: 'Vesicle fill', base: fill[0].toFixed(2), cond: fill[1].toFixed(2), d: signedDelta(fill[0], fill[1], 2) },
    { k: `Cleft ${transmitter}`, base: cleft[0].toFixed(2), cond: cleft[1].toFixed(2), d: signedDelta(cleft[0], cleft[1], 2) },
  ]
  return (
    <div className="ba">
      <div className="ba-head">
        <span />
        <span>Before</span>
        <span>After</span>
        <span>Δ</span>
      </div>
      {rows.map((row) => (
        <div className="ba-row" key={row.k}>
          <span className="ba-k">{row.k}</span>
          <b>{row.base}</b>
          <b className="now">{row.cond}</b>
          <em>{row.d}</em>
        </div>
      ))}
    </div>
  )
}

function signedDelta(base: number, cond: number, digits: number): string {
  const left = digits === 0 ? Math.round(base) : Number(base.toFixed(digits))
  const right = digits === 0 ? Math.round(cond) : Number(cond.toFixed(digits))
  const delta = right - left
  const abs = Math.abs(delta).toFixed(digits)
  if (Number(abs) === 0) return digits === 0 ? '0' : (0).toFixed(digits)
  return `${delta > 0 ? '+' : '−'}${abs}`
}
