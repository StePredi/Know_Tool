import type { ReactNode } from 'react'
import { campiona, etichettaTacca, limitiY, tacche, tracciato } from './grafico'

export interface Curva {
  f: (x: number) => number
  /** nome nella legenda (se ce n'è più di una) */
  nome?: string
  /** seconda curva: colore diverso e tratteggio, per non affidarsi solo al colore */
  seconda?: boolean
}
/** Un punto sull'asse x: pieno = incluso, vuoto = escluso; asintoto = tratteggio verticale. */
export interface Marchio { x: number; pieno?: boolean; asintoto?: boolean; etichetta?: string }
export interface Tratto { lo: number; hi: number }

const L = 640, A = 280, MS = 36, MD = 14, MA = 12, MB = 26

/** Grafico di una o più funzioni, con assi, tacche e, se serve, le soluzioni evidenziate sull'asse x. */
export function Grafico({ curve, x0, x1, y0, y1, tratti = [], marchi = [], titolo }: { curve: Curva[]; x0: number; x1: number; y0?: number; y1?: number; tratti?: Tratto[]; marchi?: Marchio[]; titolo: string }): ReactNode {
  const dati = curve.map((c) => campiona(c.f, x0, x1))
  const [ay, by] = y0 !== undefined && y1 !== undefined ? [y0, y1] : limitiY(dati.flat())
  const sx = (x: number): number => MS + ((x - x0) / (x1 - x0)) * (L - MS - MD)
  const sy = (y: number): number => MA + (1 - (y - ay) / (by - ay)) * (A - MA - MB)
  const tx = tacche(x0, x1, 9), ty = tacche(ay, by, 6)
  const asseX = ay <= 0 && by >= 0 ? sy(0) : A - MB
  const asseY = x0 <= 0 && x1 >= 0 ? sx(0) : MS
  return (
    <svg viewBox={`0 0 ${L} ${A}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={titolo}>
      {tx.map((v) => <line key={'gx' + v} x1={sx(v)} x2={sx(v)} y1={MA} y2={A - MB} stroke="var(--axis)" />)}
      {ty.map((v) => <line key={'gy' + v} x1={MS} x2={L - MD} y1={sy(v)} y2={sy(v)} stroke="var(--axis)" />)}
      <line x1={MS} x2={L - MD} y1={asseX} y2={asseX} stroke="var(--line)" strokeWidth={1.5} />
      <line x1={asseY} x2={asseY} y1={MA} y2={A - MB} stroke="var(--line)" strokeWidth={1.5} />
      {tx.map((v) => <text key={'tx' + v} x={sx(v)} y={A - 8} textAnchor="middle" fontSize={11} fill="var(--mute)">{etichettaTacca(v)}</text>)}
      {ty.filter((v) => v !== 0).map((v) => <text key={'ty' + v} x={MS - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="var(--mute)">{etichettaTacca(v)}</text>)}
      {marchi.filter((m) => m.asintoto).map((m) => <line key={'as' + m.x} x1={sx(m.x)} x2={sx(m.x)} y1={MA} y2={A - MB} stroke="var(--err-line)" strokeDasharray="5 4" />)}
      {curve.map((c, i) => <path key={i} d={tracciato(dati[i]!, sx, sy, ay, by)} fill="none" stroke={c.seconda ? 'var(--hl-u2)' : 'var(--focus)'} strokeWidth={2.2} strokeDasharray={c.seconda ? '7 4' : undefined} />)}
      {tratti.map((t, i) => <line key={'tr' + i} x1={sx(Math.max(t.lo, x0))} x2={sx(Math.min(t.hi, x1))} y1={asseX} y2={asseX} stroke="var(--par)" strokeWidth={7} strokeLinecap="round" opacity={0.85} />)}
      {marchi.filter((m) => !m.asintoto).map((m) => (
        <g key={'mk' + m.x}>
          <circle cx={sx(m.x)} cy={asseX} r={5.5} fill={m.pieno ? 'var(--ink)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth={1.8} />
          {m.etichetta && <text x={sx(m.x)} y={asseX - 11} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--ink)">{m.etichetta}</text>}
        </g>
      ))}
    </svg>
  )
}
