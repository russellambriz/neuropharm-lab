import { DISCLAIMER, diseaseById, drugById } from '../content/library.ts'
import { deltaRows } from '../model/metrics.ts'
import { useLab } from '../state/lab.tsx'
import { DossierBody } from './bits.tsx'
import { StageCanvas, TraceCanvas } from './canvases.tsx'

export function MonographView() {
  const lab = useLab()
  const drug = lab.selection.drug && lab.pairing.drugApplied ? drugById(lab.selection.drug) : null
  const disease = lab.selection.disease ? diseaseById(lab.selection.disease) : null
  const entry = drug ?? disease
  const rows = deltaRows(lab.baselineParams, lab.params, lab.baselineReadout, lab.readout)
  const instrument = lab.params.instrument === 'endplate' ? 'Endplate' : 'Membrane'
  return (
    <div className="monograph">
      <aside className="notes">
        <button className="linkish" onClick={() => lab.setView('lab')}>
          Back to the lab
        </button>
        {entry ? (
          entry.facts.map((fact) => (
            <div className="fact" key={fact.k}>
              <span className="k">{fact.k}</span>
              <span className="v">{fact.v}</span>
            </div>
          ))
        ) : (
          <div className="fact">
            <span className="k">State</span>
            <span className="v">Healthy synapse</span>
          </div>
        )}
        <div className="fact">
          <span className="k">Dose or severity</span>
          <span className="v">{drug ? lab.selection.dose.toFixed(2) : disease ? lab.selection.severity.toFixed(2) : '—'}</span>
        </div>
        <p className="disclaimer">{DISCLAIMER}</p>
      </aside>
      <article className="article">
        <DossierBody variant="article" />
      </article>
      <aside className="instrument">
        <p className="kicker">What the stage changes</p>
        <h2>{instrument}</h2>
        <div className="mini">
          <StageCanvas sim={lab.condition} which="condition" mini />
        </div>
        <div className="deltas">
          {rows.map((row) => (
            <div className="delta" key={row.name}>
              <span>{row.name}</span>
              <b>{row.base}</b>
              <em>{row.cond}</em>
            </div>
          ))}
        </div>
        <div className="mini-trace">
          <TraceCanvas sim={lab.condition} compact />
        </div>
      </aside>
    </div>
  )
}
