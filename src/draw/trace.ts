import { SIGNAL } from './palette.ts'
import type { Simulator } from '../model/sim.ts'

export function drawTrace(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Simulator, compact = false): void {
  ctx.clearRect(0, 0, w, h)
  const left = compact ? 28 : 46
  const top = compact ? 8 : 12
  const right = 12
  const bottom = compact ? 16 : 22
  const plotW = Math.max(10, w - left - right)
  const plotH = Math.max(10, h - top - bottom)
  const yOf = (v: number) => top + ((40 - v) / 130) * plotH
  const xOf = (t: number) => left + (t / 400) * plotW

  ctx.strokeStyle = 'rgba(231,224,212,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(left, yOf(0))
  ctx.lineTo(w - right, yOf(0))
  ctx.stroke()

  ctx.strokeStyle = 'rgba(231,224,212,0.28)'
  ctx.setLineDash([2.5, 3.5])
  ctx.beginPath()
  ctx.moveTo(left, yOf(-55))
  ctx.lineTo(w - right, yOf(-55))
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#9a9386'
  ctx.font = `${compact ? 10 : 11}px Outfit, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('0', 4, yOf(0) + 3)
  ctx.fillText('−80', 2, yOf(-80))
  if (!compact) {
    ctx.textAlign = 'right'
    ctx.fillText('THRESHOLD', w - right, yOf(-55) - 4)
  }

  const pts = sim.trace()
  if (pts.length > 1) {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = SIGNAL
    ctx.globalAlpha = 0.16
    ctx.lineWidth = compact ? 4 : 6
    strokePts(ctx, pts, xOf, yOf)
    ctx.globalAlpha = 1
    ctx.lineWidth = 1.55
    strokePts(ctx, pts, xOf, yOf)
  }

  ctx.globalAlpha = 1
  ctx.fillStyle = '#9a9386'
  ctx.textAlign = 'left'
  ctx.fillText('0', left, h - 4)
  ctx.textAlign = 'center'
  ctx.fillText('200 ms', left + plotW / 2, h - 4)
  ctx.textAlign = 'right'
  ctx.fillText('400 ms', w - right, h - 4)
}

function strokePts(
  ctx: CanvasRenderingContext2D,
  pts: { t: number; v: number }[],
  xOf: (t: number) => number,
  yOf: (v: number) => number,
): void {
  ctx.beginPath()
  ctx.moveTo(xOf(pts[0]!.t), yOf(pts[0]!.v))
  for (let i = 1; i < pts.length; i++) ctx.lineTo(xOf(pts[i]!.t), yOf(pts[i]!.v))
  ctx.stroke()
}
