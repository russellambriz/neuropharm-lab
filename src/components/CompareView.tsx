import { diseaseById, drugById } from '../content/library.ts'
import { compareStats } from '../model/metrics.ts'
import { useLab } from '../state/lab.tsx'
import { StageCanvas, TraceCanvas } from './canvases.tsx'

export function CompareView() {
  const lab = useLab()
  const stats = compareStats(lab.baselineParams, lab.params, lab.baselineReadout, lab.readout)
  const drug = lab.selection.drug ? drugById(lab.selection.drug) : null
  const disease = lab.selection.disease ? diseaseById(lab.selection.disease) : null
  const conditionName = [disease?.name, drug && lab.pairing.drugApplied ? drug.name : null].filter(Boolean).join(' · ') || 'Healthy'
  const instrument = lab.params.instrument === 'endplate' ? 'Endplate potential' : 'Postsynaptic membrane'
  return (
    <div className="compare">
      <div className="compare-lead">
        <h2>Baseline against the condition</h2>
        <p>Same afferent train. The left panel is the healthy synapse of this type. The right panel is {conditionName}.</p>
      </div>
      <div className="panels">
        <Panel title="Baseline" sub={instrument} tag="Healthy" sim={lab.baseline} which="baseline" />
        <Panel title={conditionName} sub={instrument} tag={lab.pairing.kind === 'mismatch' ? 'Disease only' : 'Condition'} sim={lab.condition} which="condition" />
      </div>
      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.k}>
            <span className="k">{stat.k}</span>
            <span className="v">{stat.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Panel({
  title,
  sub,
  tag,
  sim,
  which,
}: {
  title: string
  sub: string
  tag: string
  sim: ReturnType<typeof useLab>['condition']
  which: 'condition' | 'baseline'
}) {
  return (
    <section className="panel">
        <div className="panel-h">
        <h3>{title}</h3>
        <span>{sub} · {tag}</span>
      </div>
      <div className="art">
        <StageCanvas sim={sim} which={which} />
      </div>
      <div className="sweep">
        <TraceCanvas sim={sim} compact />
      </div>
    </section>
  )
}
