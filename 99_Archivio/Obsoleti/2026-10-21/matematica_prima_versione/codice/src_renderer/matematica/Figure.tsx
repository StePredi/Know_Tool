import { useState, type ReactNode } from 'react'
import type { Figura } from '@shared/matematica'

const BLU = '#4c6fff'
const ROSSO = '#e5484d'
const INDACO = '#5b5bd6'
const VIOLA = '#8e4ec6'

const SUP: Record<string, string> = { '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' }
/** Testo semplice per dentro agli SVG: ^2 → ², - → −, * → × (le formule vere usano il componente Formula). */
export const semplice = (t: string): string =>
  t.replace(/\^(\d)/g, (_m, d: string) => SUP[d] ?? `^${d}`).replace(/-/g, '−').replace(/\*/g, '×')

/** Un quadrato fatto a quadratini: pieno se n è un quadrato perfetto, altrimenti manca un pezzo (tratteggiato). */
function Griglia({ n, x }: { n: number; x: number }): ReactNode {
  const s = Math.ceil(Math.sqrt(n))
  const c = Math.min(14, 56 / s)
  const celle: ReactNode[] = []
  let k = 0
  for (let r = 0; r < s; r++)
    for (let q = 0; q < s; q++) {
      k++
      const pieno = k <= n
      celle.push(
        <rect key={k} x={x + q * c} y={6 + r * c} width={c - 1.5} height={c - 1.5} rx={2} fill={pieno ? BLU : 'none'} fillOpacity={pieno ? 0.85 : 1} stroke={pieno ? 'none' : ROSSO} strokeDasharray={pieno ? undefined : '3 2'} />
      )
    }
  return <>{celle}</>
}

function Quadrati({ termini }: { termini: { t: string; lato?: string; n?: number }[] }): ReactNode {
  const largo = 80
  return (
    <svg viewBox={`0 0 ${termini.length * largo + 10} 96`} className="mat-fig" role="img" aria-label={termini.map((q) => `${q.t}: ${perfetto(q) ? 'quadrato perfetto' : 'non è un quadrato'}`).join('; ')}>
      {termini.map((q, i) => {
        const x = 6 + i * largo
        const ok = perfetto(q)
        return (
          <g key={i}>
            {q.n !== undefined ? <Griglia n={q.n} x={x} /> : q.lato ? (
              <>
                <rect x={x} y={6} width={56} height={56} rx={3} fill={BLU} fillOpacity={0.85} />
                <text x={x + 28} y={39} textAnchor="middle" fontSize={13} fill="#fff">{semplice(q.lato)}×{semplice(q.lato)}</text>
              </>
            ) : (
              <>
                <rect x={x} y={6} width={56} height={26} rx={3} fill={BLU} fillOpacity={0.85} />
                <rect x={x} y={34} width={56} height={26} rx={2} fill="none" stroke={ROSSO} strokeDasharray="3 2" />
              </>
            )}
            <text x={x + 28} y={84} textAnchor="middle" fontSize={13} fill="currentColor">{semplice(q.t)} {ok ? '✓' : '✗'}</text>
          </g>
        )
      })}
    </svg>
  )
}

export const perfetto = (q: { lato?: string; n?: number }): boolean => {
  if (q.n !== undefined) return Math.round(Math.sqrt(q.n)) ** 2 === q.n
  return !!q.lato
}

function Pezzi({ termini, segni }: { termini: string[]; segni: string[] }): ReactNode {
  let x = 6
  const out: ReactNode[] = []
  termini.forEach((t, i) => {
    out.push(
      <g key={'t' + i}>
        <rect x={x} y={22} width={54} height={40} rx={9} fill={BLU} fillOpacity={0.18} stroke={BLU} />
        <text x={x + 27} y={48} textAnchor="middle" fontSize={15} fill="currentColor">{semplice(t)}</text>
      </g>
    )
    x += 54
    if (i < termini.length - 1) {
      out.push(<text key={'s' + i} x={x + 10} y={48} textAnchor="middle" fontSize={20} fill="currentColor">{semplice(segni[i] ?? '+')}</text>)
      x += 20
    }
  })
  return (
    <svg viewBox={`0 0 ${Math.max(x + 6, 150)} 90`} className="mat-fig" role="img" aria-label={`${termini.length} pezzi: ${termini.map(semplice).join(' e ')}`}>
      {out}
      <text x={(Math.max(x + 6, 150)) / 2} y={82} textAnchor="middle" fontSize={13} fill="currentColor">{termini.length} {termini.length === 1 ? 'pezzo' : 'pezzi'}</text>
    </svg>
  )
}

function Segno({ segno }: { segno: '+' | '-' }): ReactNode {
  const s = 22
  return segno === '-' ? (
    <svg viewBox="0 0 190 90" className="mat-fig" role="img" aria-label="Con il meno si toglie un angolo: resta una L">
      <rect x={8} y={6} width={s * 3} height={s * 3} fill={INDACO} fillOpacity={0.85} />
      <rect x={8 + s * 2} y={6} width={s} height={s} fill="var(--surface)" stroke={ROSSO} strokeDasharray="3 2" />
      <text x={84} y={30} fontSize={12} fill="currentColor">togli un angolo:</text>
      <text x={84} y={46} fontSize={12} fill="currentColor">resta una L</text>
    </svg>
  ) : (
    <svg viewBox="0 0 190 90" className="mat-fig" role="img" aria-label="Con il più i quadrati restano attaccati: non c'è nessuna L">
      <rect x={6} y={6} width={54} height={54} fill={INDACO} fillOpacity={0.85} />
      <rect x={66} y={38} width={22} height={22} fill={INDACO} fillOpacity={0.85} />
      <text x={96} y={30} fontSize={12} fill="currentColor">attaccati:</text>
      <text x={96} y={46} fontSize={12} fill="currentColor">nessuna L</text>
    </svg>
  )
}

/** Ogni termine come prodotto di fattori: quelli in comune a tutti i termini sono evidenziati. */
function Fattori({ termini, comune }: { termini: { t: string; fattori: string[] }[]; comune: string[] }): ReactNode {
  const riga = 32
  // un fattore comune si evidenzia una volta sola per termine
  const pezzi = termini.map((q) => {
    const resto = [...comune]
    return q.fattori.map((f) => {
      const k = resto.indexOf(f)
      if (k >= 0) resto.splice(k, 1)
      return { f, c: k >= 0 }
    })
  })
  const largo = Math.max(...pezzi.map((p) => 96 + p.length * 30)) + 8
  return (
    <svg viewBox={`0 0 ${largo} ${termini.length * riga + 10}`} className="mat-fig" role="img" aria-label={termini.map((q) => `${semplice(q.t)} = ${q.fattori.map(semplice).join(' · ')}`).join('; ') + (comune.length ? `. In comune: ${comune.map(semplice).join(' · ')}` : '')}>
      {termini.map((q, i) => (
        <g key={i}>
          <text x={4} y={26 + i * riga} fontSize={13} fill="currentColor">{semplice(q.t)} =</text>
          {pezzi[i]!.map((p, k) => (
            <g key={k}>
              <rect x={92 + k * 30} y={8 + i * riga} width={26} height={24} rx={7} fill={p.c ? '#22a565' : BLU} fillOpacity={p.c ? 0.9 : 0.15} stroke={p.c ? '#22a565' : BLU} />
              <text x={105 + k * 30} y={25 + i * riga} textAnchor="middle" fontSize={13} fill={p.c ? '#fff' : 'currentColor'}>{semplice(p.f)}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

/** Il disegno di una domanda di «Riconosci». */
export function FiguraDomanda({ f }: { f: Figura }): ReactNode {
  switch (f.tipo) {
    case 'pezzi': return <Pezzi termini={f.termini} segni={f.segni} />
    case 'quadrati': return <Quadrati termini={f.termini} />
    case 'segno': return <Segno segno={f.segno} />
    case 'fattori': return <Fattori termini={f.termini} comune={f.comune} />
    case 'nessuna': return <svg viewBox="0 0 190 90" className="mat-fig" role="img" aria-label={f.testo || 'Non serve'}><text x={95} y={50} textAnchor="middle" fontSize={12} fill="var(--mute)">{f.testo || 'non serve'}</text></svg>
  }
}

/** L'animazione della differenza di quadrati: la L viola ruota e diventa un rettangolo (a−b)×(a+b). */
export function Ricomposizione(): ReactNode {
  const [a, setA] = useState(5)
  const [b, setB] = useState(2)
  const [t, setT] = useState(0)
  const s = 26
  const W = (a + b) * s + 10, H = a * s + 10
  const c0 = { x: (a - b) / 2, y: b / 2 }
  const c1 = { x: a + b / 2, y: b + (a - b) / 2 }
  const cx = c0.x + (c1.x - c0.x) * t, cy = c0.y + (c1.y - c0.y) * t
  const finito = t > 0.98
  return (
    <div className="mat-ric">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Un quadrato di lato ${a} senza un quadratino di lato ${b} si ricompone in un rettangolo ${a - b} per ${a + b}`} style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }}>
        <rect x={5} y={5 + b * s} width={a * s} height={(a - b) * s} fill={INDACO} fillOpacity={0.85} />
        <g transform={`translate(${5 + cx * s} ${5 + cy * s}) rotate(${90 * t})`}>
          <rect x={(-(a - b) * s) / 2} y={(-b * s) / 2} width={(a - b) * s} height={b * s} fill={VIOLA} fillOpacity={0.9} />
        </g>
        {t < 0.02 && <rect x={5 + (a - b) * s} y={5} width={b * s} height={b * s} fill="none" stroke={ROSSO} strokeWidth={2} strokeDasharray="5 4" />}
      </svg>
      <label className="mat-sl"><span>ricomponi</span><input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={(e) => setT(+e.target.value / 100)} /></label>
      <label className="mat-sl"><span>a = {a}</span><input type="range" min={3} max={8} value={a} onChange={(e) => { const v = +e.target.value; setA(v); if (b >= v) setB(v - 1) }} /></label>
      <label className="mat-sl"><span>b = {b}</span><input type="range" min={1} max={a - 1} value={b} onChange={(e) => setB(+e.target.value)} /></label>
      <p className="mat-ricnota" aria-live="polite">
        {finito
          ? <>Stessa area: {a}² − {b}² = {a * a - b * b} e ({a} − {b})({a} + {b}) = {(a - b) * (a + b)}.</>
          : <>Sposta «ricomponi»: la parte viola ruota e riempie il vuoto. Con a = {a} e b = {b} l’area della L è {a}² − {b}² = {a * a - b * b}.</>}
      </p>
    </div>
  )
}

/** L'anteprima ferma della ricomposizione, per la card chiusa. */
export function MiniRicomposizione(): ReactNode {
  const a = 5, b = 2, k = 14
  return (
    <svg viewBox={`0 0 ${(a + b) * k + 10} ${a * k + 10}`} role="img" aria-label="Un quadrato senza un angolo: la L che si ricompone in un rettangolo" style={{ width: '100%', maxWidth: 150, display: 'block', margin: '6px auto 0' }}>
      <rect x={5} y={5 + b * k} width={a * k} height={(a - b) * k} fill={INDACO} fillOpacity={0.85} />
      <rect x={5} y={5} width={(a - b) * k} height={b * k} fill={VIOLA} fillOpacity={0.9} />
      <rect x={5 + (a - b) * k} y={5} width={b * k} height={b * k} fill="none" stroke={ROSSO} strokeWidth={1.5} strokeDasharray="4 3" />
      <rect x={5 + a * k} y={5 + b * k} width={b * k} height={(a - b) * k} fill="none" stroke={VIOLA} strokeWidth={1.5} strokeDasharray="4 3" />
    </svg>
  )
}
