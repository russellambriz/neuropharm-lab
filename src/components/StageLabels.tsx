import { useEffect, useState } from 'react'
import { layoutCallouts, leaderOf, type CalloutBox } from '../draw/callouts.ts'
import type { Simulator } from '../model/sim.ts'

export function StageLabels({ sim }: { sim: Simulator | null }) {
  const [boxes, setBoxes] = useState<CalloutBox[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const art = document.querySelector('.stage-art')
    if (!art) return
    const measure = document.createElement('canvas').getContext('2d')
    const phone = window.matchMedia('(max-width: 800px)')
    const layout = () => {
      const rect = art.getBoundingClientRect()
      const font = rect.width < 420 ? 12 : 13
      if (measure) measure.font = `${font}px Outfit, sans-serif`
      const widthOf = (line: string) => (measure ? measure.measureText(line).width : line.length * font * 0.56)
      const fill = sim?.vFill ?? 1
      const padBottom = phone.matches ? 2 : 36
      const next = layoutCallouts(rect.width, rect.height, fill, widthOf, font, padBottom)
      setSize({ w: rect.width, h: rect.height })
      setBoxes(next)
    }
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(art)
    phone.addEventListener('change', layout)
    document.fonts?.ready.then(layout).catch(() => undefined)
    return () => {
      observer.disconnect()
      phone.removeEventListener('change', layout)
    }
  }, [sim])

  if (boxes.length === 0 || size.w < 40) return null
  return (
    <div className="callouts" aria-label="Schematic labels">
      <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" aria-hidden="true">
        {boxes.map((box) => {
          const line = leaderOf(box)
          return (
            <g key={box.id}>
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
              <circle cx={line.x2} cy={line.y2} r="2.4" />
            </g>
          )
        })}
      </svg>
      {boxes.map((box) => (
        <p key={box.id} className="callout" style={{ left: box.x, top: box.y, width: box.w }} aria-label={box.text}>
          {box.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      ))}
    </div>
  )
}
