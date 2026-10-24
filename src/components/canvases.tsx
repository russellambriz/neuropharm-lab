import { useEffect, useRef } from 'react'
import { drawStage } from '../draw/stage.ts'
import { drawTrace } from '../draw/trace.ts'
import type { Simulator } from '../model/sim.ts'
import { useLab } from '../state/lab.tsx'

function bindCanvas(
  canvas: HTMLCanvasElement,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
  const parent = canvas.parentElement
  if (!parent) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = parent.clientWidth
  const h = parent.clientHeight
  if (w < 2 || h < 2) return
  const pw = Math.floor(w * dpr)
  const ph = Math.floor(h * dpr)
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw
    canvas.height = ph
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(ctx, w, h)
}

export function StageCanvas({ sim, which, mini = false }: { sim: Simulator | null; which: 'condition' | 'baseline'; mini?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { subscribe, liveRef, reduced } = useLab()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !sim) return
    const paint = () => {
      bindCanvas(canvas, (ctx, w, h) => {
        const cleft = which === 'baseline' ? liveRef.current.baselineCleft : liveRef.current.cleft
        drawStage(ctx, w, h, sim, { cleft, reduced, mini })
      })
    }
    paint()
    const stop = subscribe(paint)
    const observer = new ResizeObserver(paint)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    return () => {
      stop()
      observer.disconnect()
    }
  }, [sim, which, mini, subscribe, liveRef, reduced])
  return <canvas ref={ref} aria-hidden="true" />
}

export function TraceCanvas({ sim, compact = false }: { sim: Simulator | null; compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { subscribe } = useLab()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !sim) return
    const paint = () => {
      bindCanvas(canvas, (ctx, w, h) => drawTrace(ctx, w, h, sim, compact))
    }
    paint()
    const stop = subscribe(paint)
    const observer = new ResizeObserver(paint)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    return () => {
      stop()
      observer.disconnect()
    }
  }, [sim, compact, subscribe])
  return <canvas ref={ref} className={compact ? undefined : 'trace'} aria-label="Membrane potential trace" />
}
