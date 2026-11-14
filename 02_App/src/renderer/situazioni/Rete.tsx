import { useMemo, type ReactNode } from 'react'
import type { DisegnoRete } from '@shared/situazioni'
import { disponiRete, type CavoPosto } from '@shared/rete'

// Schema di rete: nodi in righe e cavi colorati per VLAN (specifiche/disegno_rete.md).
// Il trunk ha una striscia per VLAN, le porte access una sola; il colore viene da data-c, come nel resto delle schede.

function Cavo({ c, colori }: { c: CavoPosto; colori: Map<number, string> }): ReactNode {
  const n = c.strisce.length
  const passo = c.spessore + 1
  const dx = c.xa - c.xd
  const lato = (v: number): 1 | -1 => (v < 0 ? -1 : 1)
  // le etichette stanno sulla linea, vicino a ciascun capo: la porta dalla parte della linea, l'indirizzo dall'altra
  const punto = (t: number): { x: number; y: number } => ({ x: c.xd + dx * t, y: c.yd + (c.ya - c.yd) * t })
  const et = (t: number, l: 1 | -1, porta: string, ip: string): ReactNode => {
    const { x, y } = punto(t)
    return (
      <>
        {porta && <text className="s-rt-p" x={x + l * 10} y={y + 4} textAnchor={l < 0 ? 'end' : 'start'}>{porta}</text>}
        {ip && <text className="s-rt-p ip" x={x - l * 10} y={y + 4} textAnchor={l < 0 ? 'start' : 'end'}>{ip}</text>}
      </>
    )
  }
  return (
    <g>
      {c.strisce.map((v, k) => {
        const o = (k - (n - 1) / 2) * passo
        const col = v ? colori.get(v) : undefined
        return <line key={k} className="s-rt-c" data-c={col} x1={c.xd + o} y1={c.yd} x2={c.xa + o} y2={c.ya} strokeWidth={c.spessore} stroke={col ? 'var(--c)' : 'var(--mute)'} />
      })}
      {et(dx === 0 && c.tipo === 'access' ? 0.5 : 0.17, dx === 0 ? 1 : lato(dx), c.porta_da, c.ip_da)}
      {et(dx === 0 ? 0.68 : 0.83, dx === 0 ? 1 : lato(-dx), c.porta_a, c.ip_a)}
      {c.tipo === 'trunk' && <text className="s-rt-p it" x={(c.xd + c.xa) / 2 + 26} y={(c.yd + c.ya) / 2 + 4}>trunk · con tag</text>}
    </g>
  )
}

export function Rete({ d }: { d: DisegnoRete }): ReactNode {
  const p = useMemo(() => disponiRete(d), [d])
  const colori = useMemo(() => new Map(d.vlan.map((v) => [v.id, v.colore])), [d.vlan])
  return (
    <div className="s-rete">
      <svg viewBox={`0 0 ${p.larghezza} ${p.altezza}`} role="img" aria-label="Schema di rete" style={{ width: '100%', maxWidth: p.larghezza }}>
        {p.cavi.map((c, i) => <Cavo key={i} c={c} colori={colori} />)}
        {p.nodi.map((n) => (
          <g key={n.id} className={'s-rt-n ' + n.tipo}>
            {n.tipo === 'nuvola'
              ? <path transform={`translate(${n.x} ${n.y}) scale(${Math.max(1, n.w / 150)} 1)`} d="M-70 26 a22 22 0 0 1 -2 -43 a30 30 0 0 1 56 -8 a28 28 0 0 1 52 10 a22 22 0 0 1 14 41z" />
              : <rect x={n.x - n.w / 2} y={n.y - n.h / 2} width={n.w} height={n.h} rx={n.tipo === 'pc' || n.tipo === 'vm' ? 4 : 10} />}
            <text className="s-rt-t" x={n.x} y={n.sotto ? n.y - 3 : n.y + 5} textAnchor="middle">{n.nome}</text>
            {n.sotto && <text className="s-rt-s" x={n.x} y={n.y + 14} textAnchor="middle">{n.sotto}</text>}
          </g>
        ))}
      </svg>
      {d.vlan.length > 0 && (
        <ul className="s-rt-leg" aria-label="VLAN">
          {d.vlan.map((v) => (
            <li key={v.id} data-c={v.colore}><i />VLAN {v.id} · {v.nome}{v.rete && <> · <code>{v.rete}</code></>}</li>
          ))}
          <li className="n">porte access: senza tag · trunk: con tag</li>
        </ul>
      )}
      {d.nota && <p className="m-nota">{d.nota}</p>}
    </div>
  )
}
