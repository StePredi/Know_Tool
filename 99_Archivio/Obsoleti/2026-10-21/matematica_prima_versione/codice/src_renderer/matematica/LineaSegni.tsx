import type { ReactNode } from 'react'
import { scriviNumero, type Disequazione } from './disequazioni'
import { scriviFattore } from './polinomio'

const L = 640, X0 = 120, X1 = 620, TOP = 34, RH = 34

const sup = (s: string): string => s.replace(/\^(\d+)/g, (_, d: string) => [...d].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('')).replace(/-/g, '−')

/**
 * La linea dei segni: una riga per fattore (continua = positivo, tratteggiata = negativo), poi il risultato.
 * `mostra` = quante righe far vedere (una alla volta); a `righe + 1` compare anche il risultato.
 */
export function LineaSegni({ d, mostra }: { d: Disequazione; mostra: number }): ReactNode {
  const N = d.punti.length, nr = d.righe.length
  const H = TOP + (nr + 1) * RH + 16
  const bx = [X0, ...d.punti.map((_, i) => X0 + ((i + 1) * (X1 - X0)) / (N + 1)), X1]
  const px = (i: number): number => bx[i + 1]!
  const lim = Math.min(mostra, nr)
  const yR = TOP + nr * RH + RH / 2
  // il tratto lascia un po' d'aria solo dove la riga ha davvero una radice (un pallino o una ✕); altrimenti prosegue
  const tratto = (k: number, y: number, neg: boolean, radici: number[]): ReactNode => {
    const ha = (j: number): boolean => radici.some((r) => Math.abs(r - d.punti[j]!.v) < 1e-9)
    return <line key={'t' + k + '-' + y} x1={bx[k]! + (k > 0 && ha(k - 1) ? 4 : 0)} x2={bx[k + 1]! - (k < N && ha(k) ? 4 : 0)} y1={y} y2={y} stroke={neg ? 'var(--mute)' : 'var(--ink)'} strokeWidth={neg ? 1.5 : 2.5} strokeDasharray={neg ? '5 4' : undefined} />
  }
  return (
    <svg viewBox={`0 0 ${L} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Linea dei segni: una riga per fattore, continua se positivo, tratteggiata se negativo">
      {d.punti.map((p, j) => (
        <g key={'p' + j}>
          <text x={px(j)} y={16} textAnchor="middle" fontSize={13} fill="var(--ink)">{scriviNumero(p.v)}</text>
          <line x1={px(j)} x2={px(j)} y1={24} y2={H - 6} stroke="var(--line2)" strokeDasharray="2 3" />
        </g>
      ))}
      {d.righe.slice(0, lim).map((w, ri) => {
        const y = TOP + ri * RH + RH / 2
        return (
          <g key={'r' + ri}>
            <text x={8} y={y + 5} fontSize={14} fill="var(--ink)">{(w.den ? '÷ ' : '') + sup(scriviFattore(w.f))}</text>
            {Array.from({ length: N + 1 }, (_, k) => tratto(k, y, w.segni[k]! < 0, w.radici))}
            {d.punti.map((p, j) => w.radici.some((r) => Math.abs(r - p.v) < 1e-9) && (w.den
              ? <text key={'z' + j} x={px(j)} y={y + 5} textAnchor="middle" fontSize={15} fill="var(--err-line)">✕</text>
              : <circle key={'z' + j} cx={px(j)} cy={y} r={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />))}
          </g>
        )
      })}
      {mostra > nr && (
        <g>
          <line x1={8} x2={X1} y1={yR - RH / 2} y2={yR - RH / 2} stroke="var(--line)" />
          <text x={8} y={yR + 5} fontSize={14} fontWeight={700} fill="var(--ink)">risultato</text>
          {Array.from({ length: N + 1 }, (_, k) => {
            const ok = d.ok[k]!
            return (
              <g key={'k' + k}>
                <line x1={bx[k]! + (k > 0 ? 4 : 0)} x2={bx[k + 1]! - (k < N ? 4 : 0)} y1={yR} y2={yR} stroke={ok ? 'var(--par)' : 'var(--line)'} strokeWidth={ok ? 7 : 1.5} strokeDasharray={!ok && d.risultato[k]! < 0 ? '5 4' : undefined} />
                <text x={(bx[k]! + bx[k + 1]!) / 2} y={yR - 9} textAnchor="middle" fontSize={13} fill="var(--mute)">{d.risultato[k]! > 0 ? '+' : '−'}</text>
              </g>
            )
          })}
          {d.punti.map((_p, j) => <circle key={'c' + j} cx={px(j)} cy={yR} r={5} fill={d.incluso[j] ? 'var(--ink)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth={1.5} />)}
        </g>
      )}
    </svg>
  )
}
