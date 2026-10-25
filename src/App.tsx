import { CompareView } from './components/CompareView.tsx'
import { Header, toneClass } from './components/bits.tsx'
import { LabView } from './components/LabView.tsx'
import { LibraryView } from './components/LibraryView.tsx'
import { MonographView } from './components/MonographView.tsx'
import { useLab } from './state/lab.tsx'

export default function App() {
  const lab = useLab()
  return (
    <div className={`app view-${lab.view} ${toneClass(lab.params)} ${lab.sheet ? 'sheet' : ''}`}>
      <div className="screen">
        <Header />
        {lab.view === 'lab' ? <LabView /> : null}
        {lab.view === 'library' ? <LibraryView /> : null}
        {lab.view === 'monograph' ? <MonographView /> : null}
        {lab.view === 'compare' ? <CompareView /> : null}
      </div>
    </div>
  )
}
