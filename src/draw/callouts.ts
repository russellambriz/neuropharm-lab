import { STAGE_VIEW, vesiclePointers } from './stage.ts'

export interface CalloutBox {
  id: string
  text: string
  lines: string[]
  x: number
  y: number
  w: number
  h: number
  ax: number
  ay: number
}

type Measure = (line: string) => number

type AnchorName = 'soma' | 'axon' | 'myelin' | 'node' | 'terminal' | 'full' | 'empty' | 'cleft' | 'gap' | 'pump' | 'receptors' | 'next'

const ROWS: { id: string; text: string; lines: string[]; anchor: AnchorName }[][] = [
  [
    { id: 'soma', text: 'Cell body (soma)', lines: ['Cell body (soma)'], anchor: 'soma' },
    { id: 'myelin', text: 'Myelin sheath', lines: ['Myelin sheath'], anchor: 'myelin' },
    { id: 'node', text: 'Node of Ranvier', lines: ['Node of Ranvier'], anchor: 'node' },
    { id: 'empty', text: 'Empty vesicle', lines: ['Empty vesicle'], anchor: 'empty' },
  ],
  [
    { id: 'axon', text: 'Axon', lines: ['Axon'], anchor: 'axon' },
    { id: 'terminal', text: 'Axon terminal', lines: ['Axon terminal'], anchor: 'terminal' },
    { id: 'pump', text: 'Reuptake pump', lines: ['Reuptake pump'], anchor: 'pump' },
    { id: 'gap', text: 'Synaptic cleft (gap)', lines: ['Synaptic cleft (gap)'], anchor: 'gap' },
  ],
  [
    { id: 'vesicles', text: 'Vesicles: sacs of neurotransmitter', lines: ['Vesicles: sacs of', 'neurotransmitter'], anchor: 'full' },
    { id: 'released', text: 'Released neurotransmitter', lines: ['Released', 'neurotransmitter'], anchor: 'cleft' },
    { id: 'receptors', text: 'Receptors', lines: ['Receptors'], anchor: 'receptors' },
    { id: 'next', text: 'Next neuron (postsynaptic)', lines: ['Next neuron', '(postsynaptic)'], anchor: 'next' },
  ],
]

function anchors(fill: number): Record<AnchorName, [number, number]> {
  const vesicles = vesiclePointers(fill)
  return {
    soma: [108, 250],
    axon: [164, 214],
    myelin: [274, 214],
    node: [239, 214],
    terminal: [540, 220],
    full: vesicles.full,
    empty: vesicles.empty,
    cleft: [656, 220],
    gap: [674, 214],
    pump: [582, 152],
    receptors: [718, 216],
    next: [756, 214],
  }
}

function project(w: number, h: number, x: number, y: number): { x: number; y: number } {
  const scale = Math.min(w / STAGE_VIEW.w, h / STAGE_VIEW.h)
  const ox = (w - STAGE_VIEW.w * scale) / 2
  const oy = (h - STAGE_VIEW.h * scale) / 2
  return { x: ox + x * scale, y: oy + y * scale }
}

export function layoutCallouts(w: number, h: number, fill: number, measure: Measure, font = 12, padBottom = 2): CalloutBox[] {
  if (w < 40 || h < 40) return []
  const points = anchors(fill)
  const lineH = Math.round(font * 1.2)
  const gap = 5
  const rows = ROWS.map((row) => {
    const boxes = row.map((item) => {
      const width = Math.max(...item.lines.map((line) => measure(line)))
      const point = project(w, h, points[item.anchor][0], points[item.anchor][1])
      return {
        id: item.id,
        text: item.text,
        lines: item.lines,
        x: 0,
        y: 0,
        w: Math.ceil(width) + 2,
        h: item.lines.length * lineH,
        ax: point.x,
        ay: point.y,
      }
    })
    boxes.sort((a, b) => a.ax - b.ax)
    return boxes
  })

  const heights = rows.map((row) => Math.max(...row.map((box) => box.h)))
  const block = heights.reduce((sum, height) => sum + height, 0) + gap * (rows.length - 1)
  const featureFloor = project(w, h, 0, 304).y + 4
  let y = h - padBottom - block
  if (featureFloor + block <= h - padBottom) y = Math.max(y, featureFloor)
  if (y < 2) y = 2

  rows.forEach((boxes, index) => {
    const total = boxes.reduce((sum, box) => sum + box.w, 0) + gap * (boxes.length - 1)
    let cursor = Math.max(4, (w - total) / 2)
    for (const box of boxes) {
      const ideal = box.ax - box.w / 2
      box.x = Math.max(cursor, ideal)
      box.y = y
      cursor = box.x + box.w + gap
    }
    const last = boxes[boxes.length - 1]
    const overflow = last.x + last.w - (w - 4)
    if (overflow > 0) {
      for (const box of boxes) box.x -= overflow
    }
    if (boxes[0].x < 4) {
      cursor = 4
      for (const box of boxes) {
        box.x = cursor
        cursor += box.w + gap
      }
    }
    for (const box of boxes) {
      box.x = Math.max(2, Math.min(w - box.w - 2, box.x))
      box.y = y
    }
    y += heights[index] + gap
  })

  const flat = rows.flat()
  separate(flat, w, h - padBottom)
  return flat
}

function separate(boxes: CalloutBox[], w: number, bottom: number): void {
  for (let pass = 0; pass < 16; pass++) {
    let moved = false
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        if (overlapX > 1 && overlapY > 1) {
          if (a.x <= b.x) b.x += overlapX + 2
          else a.x += overlapX + 2
          moved = true
        }
      }
    }
    if (!moved) break
  }
  for (const box of boxes) {
    box.x = Math.max(2, Math.min(w - box.w - 2, box.x))
    box.y = Math.max(2, Math.min(bottom - box.h, box.y))
  }
}

export function leaderOf(box: CalloutBox): { x1: number; y1: number; x2: number; y2: number } {
  const fromTop = box.ay < box.y + 2
  const x1 = Math.max(box.x + 6, Math.min(box.x + box.w - 6, box.ax))
  const y1 = fromTop ? box.y : box.y + box.h
  return { x1, y1, x2: box.ax, y2: box.ay }
}
