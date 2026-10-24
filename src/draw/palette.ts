export const INK = '#e7e0d4'
export const MEM = '#e7e0d4'
export const SOFT = 'rgba(231,224,212,0.45)'
export const SIGNAL = '#dff6b0'

export function transmitterPaint(name: string): string {
  if (name === 'dopamine') return '#e4a45c'
  if (name === 'serotonin') return '#d4c0ee'
  if (name === 'GABA') return '#a9c6de'
  if (name === 'acetylcholine') return '#a9d0bc'
  return '#e3947c'
}
