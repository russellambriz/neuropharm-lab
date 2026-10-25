import { INK, MEM, transmitterPaint } from './palette.ts'
import type { Simulator } from '../model/sim.ts'

export interface StageOpts {
  cleft: number
  reduced: boolean
  mini: boolean
}

export const STAGE_VIEW = { w: 900, h: 450 }

export const STAGE_VESICLES: [number, number][] = [
  [470, 190], [494, 176], [518, 190], [546, 178],
  [484, 214], [510, 214], [538, 208],
  [566, 196], [588, 186], [572, 222], [596, 236], [548, 238],
]

export function vesiclePointers(fill: number): { full: [number, number]; empty: [number, number] } {
  let full: [number, number] = STAGE_VESICLES[0]
  let empty: [number, number] = STAGE_VESICLES[STAGE_VESICLES.length - 1]
  let sawEmpty = false
  STAGE_VESICLES.forEach((point, i) => {
    const threshold = (i + 0.5) / STAGE_VESICLES.length
    if (fill >= threshold) full = point
    else if (!sawEmpty) {
      empty = point
      sawEmpty = true
    }
  })
  return { full, empty }
}

export function drawStage(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Simulator, opts: StageOpts): void {
  ctx.clearRect(0, 0, w, h)
  const vbW = opts.mini ? 640 : 900
  const vbH = opts.mini ? 320 : 450
  const scale = Math.min(w / vbW, h / vbH)
  ctx.save()
  ctx.translate((w - vbW * scale) / 2, (h - vbH * scale) / 2)
  ctx.scale(scale, scale)
  if (opts.mini) drawCloseup(ctx, sim, opts)
  else drawFull(ctx, sim, opts)
  ctx.restore()
}

function drawFull(ctx: CanvasRenderingContext2D, sim: Simulator, opts: StageOpts): void {
  const p = sim.params
  const color = transmitterPaint(p.transmitterName)
  const phase = opts.reduced ? 0 : sim.t / 280

  ctx.fillStyle = color
  ctx.globalAlpha = 0.08
  ctx.beginPath()
  ctx.ellipse(690, 214, 46, 78, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.strokeStyle = MEM
  ctx.lineWidth = 1.15
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  strokePaths(ctx, [
    'M74 176 C46 154 34 118 22 78',
    'M42 132 C26 112 30 92 14 74',
    'M64 198 C28 194 12 176 2 140',
    'M70 236 C36 258 26 302 12 344',
    'M98 250 C90 292 114 334 82 382',
    'M108 168 C100 132 122 100 104 64',
    'M92 96 C78 84 70 70 62 48',
  ])

  ctx.beginPath()
  ctx.moveTo(108, 214)
  ctx.lineTo(430, 214)
  ctx.stroke()

  const myelin = [176, 246, 316, 386]
  myelin.forEach((x, i) => {
    const cover = p.myelin * myelin.length - i
    if (cover <= 0) return
    drawMyelin(ctx, x, 203, 56, 22, Math.min(1, cover))
  })

  ctx.fillStyle = '#12130f'
  ctx.strokeStyle = MEM
  ctx.lineWidth = 1.35
  ctx.beginPath()
  ctx.arc(108, 214, 46, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = '#4a4c42'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(108, 214, 14, 0, Math.PI * 2)
  ctx.stroke()

  const bouton = new Path2D('M432 214 C452 162 508 136 562 150 C618 164 642 198 636 230 C630 268 592 298 540 292 C488 286 452 258 432 214 Z')
  ctx.fillStyle = '#14160f'
  ctx.strokeStyle = MEM
  ctx.lineWidth = 1.3
  ctx.fill(bouton)
  ctx.stroke(bouton)

  STAGE_VESICLES.forEach((v, i) => {
    const threshold = (i + 0.5) / STAGE_VESICLES.length
    drawVesicle(ctx, v[0], v[1], sim.vFill >= threshold ? 'full' : 'empty', color, sim.vFill)
  })

  const live = sim.fusions.filter((f) => sim.t - f.t < 110 && f.amount > 0.12)
  if (live.length > 0) {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = color
    ctx.lineWidth = 1.15
    ctx.beginPath()
    ctx.moveTo(612, 202)
    ctx.bezierCurveTo(612, 194, 628, 194, 632, 206)
    ctx.bezierCurveTo(636, 218, 626, 226, 616, 222)
    ctx.fill()
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const dots = Math.round(Math.min(8, Math.max(0, opts.cleft) * 6))
  ctx.fillStyle = color
  for (let i = 0; i < dots; i++) {
    const drift = opts.reduced ? 0 : Math.sin(phase + i) * 4
    ctx.globalAlpha = 0.75 + (i % 3) * 0.08
    ctx.beginPath()
    ctx.arc(646 + (i % 3) * 10, 198 + i * 8 + drift, 2.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (p.kUptake > 0.001) {
    ctx.save()
    ctx.translate(568, 150)
    ctx.rotate(-0.28)
    ctx.fillStyle = '#14160f'
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    roundRect(ctx, 0, 0, 26, 12, 3)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(8, 12)
    ctx.lineTo(8, 19)
    ctx.moveTo(5, 16)
    ctx.lineTo(8, 20)
    ctx.lineTo(11, 16)
    ctx.stroke()
    ctx.restore()
  }

  if (p.enzyme === 'mao' || p.enzyme === 'gaba-t') {
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    const cx = 505
    const cy = 262
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2
      const x = cx + Math.cos(a) * 9
      const y = cy + Math.sin(a) * 9
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  ctx.strokeStyle = MEM
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(724, 108)
  ctx.bezierCurveTo(706, 168, 706, 262, 726, 328)
  ctx.stroke()

  const open = receptorOpen(sim)
  for (const y of [156, 196, 236, 276]) {
    if (p.receptorStyle === 'gpcr') drawGpcr(ctx, 712, y, color)
    else drawPore(ctx, 712, y, color, open, p.receptorDensity < 0.35)
  }

  if (p.showGabaTerminal) drawSmallGaba(ctx, 250, 78, Math.max(0.28, Math.min(1, p.gabaEfficacy)))

  drawAxonPulse(ctx, sim, 108, 430, 214)
}

function drawCloseup(ctx: CanvasRenderingContext2D, sim: Simulator, opts: StageOpts): void {
  const p = sim.params
  const color = transmitterPaint(p.transmitterName)
  ctx.strokeStyle = MEM
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(16, 176)
  ctx.lineTo(250, 176)
  ctx.stroke()
  drawMyelin(ctx, 48, 165, 52, 22, p.myelin > 0.5 ? 1 : p.myelin * 2)
  drawMyelin(ctx, 118, 165, 52, 22, p.myelin > 0.75 ? 1 : Math.max(0, p.myelin * 2 - 1))
  const bouton = new Path2D('M248 176 C262 132 312 112 360 124 C408 136 428 164 422 190 C416 220 384 244 338 240 C292 236 260 214 248 176 Z')
  ctx.fillStyle = '#14160f'
  ctx.strokeStyle = MEM
  ctx.lineWidth = 1.25
  ctx.fill(bouton)
  ctx.stroke(bouton)
  const spots: [number, number][] = [
    [300, 156], [324, 148], [348, 160], [316, 176], [342, 182], [328, 198], [354, 196],
  ]
  spots.forEach((s, i) => drawVesicle(ctx, s[0], s[1], sim.vFill > (i + 0.4) / spots.length ? 'full' : 'empty', color, sim.vFill))
  const dots = Math.round(Math.min(9, opts.cleft * 7))
  ctx.fillStyle = color
  for (let i = 0; i < dots; i++) {
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.arc(400 + (i % 4) * 10, 150 + (i % 5) * 12, 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = MEM
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(520, 78)
  ctx.bezierCurveTo(500, 130, 500, 230, 522, 286)
  ctx.stroke()
  const open = receptorOpen(sim)
  for (const y of [132, 168, 204, 240]) drawPore(ctx, 498, y, color, open, p.receptorDensity < 0.35)
  if (p.showGabaTerminal) drawSmallGaba(ctx, 210, 70, Math.max(0.28, Math.min(1, p.gabaEfficacy)))
  label(ctx, 300, 96, p.transmitterName.toUpperCase(), 'center')
  label(ctx, 430, 96, 'CLEFT')
  label(ctx, 548, 78, p.receptorLabel)
}

function receptorOpen(sim: Simulator): number {
  const p = sim.params
  if (p.synapse === 'glutamate') return Math.min(1, sim.sA)
  if (p.synapse === 'gaba') return Math.min(1, sim.sG * p.gabaEfficacy)
  if (p.synapse === 'acetylcholine' || p.synapse === 'nmj') return Math.min(1, (sim.sC + p.nachAgonist) * p.receptorDensity)
  return Math.min(1, sim.N / (sim.N + 0.45))
}

function drawAxonPulse(ctx: CanvasRenderingContext2D, sim: Simulator, x0: number, x1: number, y: number): void {
  const live = sim.axon.filter((a) => sim.t >= a.t0 && sim.t <= a.t1 + 30)
  for (const a of live) {
    const span = Math.max(0.2, a.t1 - a.t0)
    const u = Math.min(1, (sim.t - a.t0) / span)
    if (a.blocked && u > 0.72) continue
    ctx.fillStyle = a.blocked ? '#c47a64' : '#dff6b0'
    ctx.globalAlpha = a.blocked ? 0.7 : 0.95
    ctx.beginPath()
    ctx.arc(x0 + (x1 - x0) * u * 0.72, y, 3.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawSmallGaba(ctx: CanvasRenderingContext2D, x: number, y: number, opacity: number): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#14160f'
  ctx.strokeStyle = '#a9c6de'
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x - 14, y - 38, x - 54, y - 46, x - 74, y - 28)
  ctx.bezierCurveTo(x - 94, y - 10, x - 82, y + 18, x - 54, y + 18)
  ctx.bezierCurveTo(x - 36, y + 18, x - 14, y + 10, x, y)
  ctx.fill()
  ctx.stroke()
  drawVesicle(ctx, x - 40, y - 16, 'full', '#a9c6de', 1)
  drawVesicle(ctx, x - 22, y - 22, 'full', '#a9c6de', 1)
  ctx.fillStyle = '#9a9386'
  ctx.font = '11px Outfit, sans-serif'
  ctx.fillText(opacity < 0.7 ? 'GABA · REDUCED' : 'GABA', x - 90, y - 48)
  ctx.restore()
}

function drawVesicle(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'full' | 'empty', color: string, fill: number): void {
  ctx.beginPath()
  ctx.arc(x, y, 7.2, 0, Math.PI * 2)
  if (kind === 'full') {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.45 + 0.5 * Math.max(0, Math.min(1, fill))
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = color
    ctx.lineWidth = 0.6
    ctx.stroke()
  } else {
    ctx.strokeStyle = INK
    ctx.globalAlpha = 0.28
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function drawMyelin(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number): void {
  ctx.save()
  ctx.globalAlpha = Math.max(0.15, alpha)
  ctx.fillStyle = '#171910'
  ctx.strokeStyle = '#c9c1b3'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawGpcr(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#12140f'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.15
  roundRect(ctx, 0, -10, 15, 20, 4)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(7.5, 10)
  ctx.lineTo(7.5, 18)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(7.5, 20.5, 2.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPore(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, open: number, blocked: boolean): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#12140f'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.15
  roundRect(ctx, 0, -12, 15, 24, 3.5)
  ctx.fill()
  ctx.stroke()
  if (blocked) {
    ctx.beginPath()
    ctx.moveTo(3, -5)
    ctx.lineTo(12, 5)
    ctx.moveTo(12, -5)
    ctx.lineTo(3, 5)
    ctx.stroke()
  } else {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.35 + 0.6 * Math.max(0, Math.min(1, open))
    ctx.beginPath()
    ctx.arc(7.5, 0, 2.3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function strokePaths(ctx: CanvasRenderingContext2D, ds: string[]): void {
  for (const d of ds) ctx.stroke(new Path2D(d))
}

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, align: CanvasTextAlign = 'left'): void {
  ctx.fillStyle = '#9a9386'
  ctx.font = '11px Outfit, sans-serif'
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
