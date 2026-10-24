import { DISEASE_GROUPS, DISEASES, DRUG_GROUPS, DRUGS, drugById, type DiseaseEntry, type DrugEntry } from '../content/library.ts'
import { useLab } from '../state/lab.tsx'
import { Search, Slider } from './bits.tsx'

export function LibraryView() {
  const lab = useLab()
  const q = lab.query.trim().toLowerCase()
  const drugs = DRUGS.filter((entry) => hit(entry, q))
  const diseases = DISEASES.filter((entry) => hit(entry, q))
  const title = lab.pairing.kind === 'compose' || lab.pairing.kind === 'overlay'
    ? 'These two compose'
    : lab.pairing.kind === 'warn'
      ? 'This pair is flagged'
      : lab.pairing.kind === 'mismatch'
        ? 'These two do not share a synapse'
        : 'How pairing works'
  const note = lab.pairing.note || 'A drug and a disease share one synapse when they share a transmitter. Multiple sclerosis stays on the axon whichever synapse you open. A mismatched pair explains itself instead of inventing a cell that does both.'
  return (
    <div className="lib-wrap">
      <div className="library">
        <section className="pane">
          <div className="pane-head">
            <h2>Drugs</h2>
            <span>{drugs.length}</span>
          </div>
          <Search value={lab.query} onChange={lab.setQuery} placeholder="Search drugs" />
          {DRUG_GROUPS.map((group) => {
            const rows = drugs.filter((entry) => entry.group === group)
            if (rows.length === 0) return null
            return (
              <div key={group}>
                <p className="group">{group}</p>
                {rows.map((entry) => (
                  <EntryButton key={entry.id} entry={entry} on={lab.selection.drug === entry.id} onClick={() => lab.selectDrug(entry.id)} />
                ))}
              </div>
            )
          })}
          {drugs.length === 0 ? <p className="hint">No drug matches that.</p> : null}
        </section>
        <section className="pane">
          <div className="pane-head">
            <h2>Diseases</h2>
            <span>{diseases.length}</span>
          </div>
          <Search value={lab.query} onChange={lab.setQuery} placeholder="Search diseases" />
          {DISEASE_GROUPS.map((group) => {
            const rows = diseases.filter((entry) => entry.group === group)
            if (rows.length === 0) return null
            return (
              <div key={group}>
                <p className="group">{group}</p>
                {rows.map((entry) => (
                  <EntryButton key={entry.id} entry={entry} on={lab.selection.disease === entry.id} onClick={() => lab.selectDisease(entry.id)} />
                ))}
              </div>
            )
          })}
          {diseases.length === 0 ? <p className="hint">No disease matches that.</p> : null}
          <div className="note-card">
            <strong>How pairing works</strong>
            <p>A drug and a disease share one synapse when they share a transmitter. Multiple sclerosis stays on the axon whichever synapse you open. A mismatched pair explains itself instead of inventing a cell that does both.</p>
          </div>
        </section>
      </div>
      <footer className="composer">
        {lab.selection.drug ? (
          <Slider label={`Dose · ${drugById(lab.selection.drug).name}`} value={lab.selection.dose} onChange={lab.setDose} hint="Unitless. Not milligrams." />
        ) : (
          <div className="note-card">
            <strong>No drug</strong>
            <p>Choose one from the list to set a dose.</p>
          </div>
        )}
        {lab.selection.disease ? (
          <Slider label="Severity" value={lab.selection.severity} onChange={lab.setSeverity} hint="Unitless, from intact tissue to the far end of the model." />
        ) : (
          <div className="note-card">
            <strong>No disease</strong>
            <p>Choose one from the list to set severity.</p>
          </div>
        )}
        <div className="note-card">
          <strong>{title}</strong>
          <p>{note}</p>
        </div>
      </footer>
    </div>
  )
}

function EntryButton({ entry, on, onClick }: { entry: DrugEntry | DiseaseEntry; on: boolean; onClick: () => void }) {
  return (
    <button className={`entry ${on ? 'on' : ''}`} onClick={onClick}>
      <div className="name">{entry.name}</div>
      <div className="line">{entry.line}</div>
      <span className="chip"><i className={`dot ${entry.chipKind}`} />{entry.chip}</span>
    </button>
  )
}

function hit(entry: { name: string; line: string; kicker: string; chip: string }, q: string): boolean {
  if (!q) return true
  return `${entry.name} ${entry.line} ${entry.kicker} ${entry.chip}`.toLowerCase().includes(q)
}
