import { useMemo, useState, type ReactNode } from 'react'
import type { DisegnoSit, PinDisegno, SchedaSit } from '@shared/situazioni'
import { norm } from './util'

// Disegno approssimativo di una scheda elettronica: i pin stanno sui due lati, colorati per famiglia di funzioni.
// Stesse modalità della mappa: filtro per famiglia, ricerca che sfuma, clic = dettagli e schede collegate.

const RH = 36
const TOP = 112
const W = 860
const PILL_W = 250
const BX = 300
const BW = 260

interface Props {
  d: DisegnoSit
  corrente: string
  schede: Record<string, SchedaSit>
  /** colore del ramo in cui sta la scheda (per il colore dei collegamenti) */
  colore: (id: string) => string
  apri: (id: string) => void
}

type Sel = { lato: 'sinistra' | 'destra'; i: number } | null

export function DisegnoScheda({ d, corrente, schede, colore, apri }: Props): ReactNode {
  const [filtro, setFiltro] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Sel>(null)
  const fam = useMemo(() => new Map(d.famiglie.map((f) => [f.id, f])), [d.famiglie])
  const righe = Math.max(d.sinistra.length, d.destra.length)
  const H = TOP + righe * RH + 96

  const corrisponde = (p: PinDisegno): boolean => {
    if (filtro && !p.famiglie.includes(filtro)) return false
    const t = norm(q).split(/\s+/).filter(Boolean)
    if (!t.length) return true
    const hay = norm([p.etichetta, p.gpio ? 'gpio' + p.gpio : '', p.titolo, ...p.funzioni, ...p.famiglie.map((f) => fam.get(f)?.nome ?? '')].join(' '))
    return t.every((x) => hay.includes(x))
  }

  const pin = sel ? d[sel.lato][sel.i] : null
  const collegate = useMemo(() => {
    if (!pin) return []
    const ids = [...pin.schede, ...pin.famiglie.flatMap((f) => fam.get(f)?.schede ?? [])]
    return [...new Set(ids)].filter((id) => id !== corrente && schede[id])
  }, [pin, fam, corrente, schede])

  const disegnaPin = (p: PinDisegno, lato: 'sinistra' | 'destra', i: number): ReactNode => {
    const y = TOP + i * RH
    const sx = lato === 'sinistra' ? BX - 12 - PILL_W : BX + BW + 12
    const holeX = lato === 'sinistra' ? BX + 14 : BX + BW - 14
    const edge = lato === 'sinistra' ? sx + PILL_W : sx
    const f0 = fam.get(p.famiglie[0] ?? '')
    const attivo = corrisponde(p)
    const scelto = sel?.lato === lato && sel.i === i
    return (
      <g
        key={lato + i}
        className={'s-pn' + (attivo ? '' : ' off') + (scelto ? ' sel' : '')}
        role="button"
        tabIndex={0}
        aria-label={`${p.etichetta}${p.gpio ? ', GPIO' + p.gpio : ''}`}
        aria-pressed={scelto}
        onClick={() => setSel({ lato, i })}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel({ lato, i }) } }}
      >
        <line className="s-pn-l" x1={edge} y1={y + 14} x2={holeX} y2={y + 14} />
        <rect className="s-pn-r" x={sx} y={y} width={PILL_W} height={28} rx={9} />
        <text className="s-pn-e" x={lato === 'sinistra' ? sx + 12 : sx + PILL_W - 12} y={y + 19} textAnchor={lato === 'sinistra' ? 'start' : 'end'}>{p.etichetta}</text>
        <text className="s-pn-g" x={lato === 'sinistra' ? sx + 64 : sx + PILL_W - 64} y={y + 19} textAnchor={lato === 'sinistra' ? 'start' : 'end'}>{p.gpio ? 'GPIO' + p.gpio : ''}</text>
        {p.famiglie.map((id, k) => {
          const f = fam.get(id)
          const cx = lato === 'sinistra' ? sx + PILL_W - 16 - k * 15 : sx + 16 + k * 15
          return <circle key={id} className="s-pn-d" data-c={f?.colore} cx={cx} cy={y + 14} r={5.5} />
        })}
        <circle className="s-pn-h" data-c={f0?.colore} cx={holeX} cy={y + 14} r={6.5} />
      </g>
    )
  }

  return (
    <div className="s-fg">
      <div className="s-ft">
        <div className="s-fchips" role="group" aria-label="Filtra per funzione">
          <button type="button" className="s-fc" aria-pressed={filtro === null} onClick={() => setFiltro(null)}>Tutti</button>
          {d.famiglie.map((f) => (
            <button key={f.id} type="button" className="s-fc" data-c={f.colore} aria-pressed={filtro === f.id} onClick={() => setFiltro(filtro === f.id ? null : f.id)}>
              <i />{f.nome}
            </button>
          ))}
        </div>
        <input className="inp s-fq" type="search" autoComplete="off" placeholder="Cerca un pin: GPIO34, SDA, touch…" aria-label="Cerca un pin" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="s-fb">
        <svg className="s-fs" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Schema dei pin: ${d.nome}`}>
          {/* scheda */}
          <rect className="s-pcb" x={BX} y={8} width={BW} height={H - 40} rx={22} />
          <path className="s-ant" d={`M${BX + 70} 78 V42 H${BX + 92} V70 H${BX + 114} V42 H${BX + 136} V70 H${BX + 158} V42 H${BX + 180} V78`} />
          <rect className="s-mod" x={BX + 46} y={TOP - 4} width={BW - 92} height={176} rx={8} />
          <text className="s-mod-t" x={BX + BW / 2} y={TOP + 74} textAnchor="middle">ESP32</text>
          <text className="s-mod-s" x={BX + BW / 2} y={TOP + 96} textAnchor="middle">{d.chip}</text>
          <circle className="s-led" cx={BX + 64} cy={TOP + 210} r={6} />
          <text className="s-cl" x={BX + 78} y={TOP + 214}>LED GPIO2</text>
          <circle className="s-led on" cx={BX + 64} cy={TOP + 236} r={6} />
          <text className="s-cl" x={BX + 78} y={TOP + 240}>alimentazione</text>
          <rect className="s-btn" x={BX + 44} y={H - 100} width={44} height={26} rx={6} />
          <text className="s-cl" x={BX + 66} y={H - 82} textAnchor="middle">EN</text>
          <rect className="s-btn" x={BX + BW - 88} y={H - 100} width={44} height={26} rx={6} />
          <text className="s-cl" x={BX + BW - 66} y={H - 82} textAnchor="middle">BOOT</text>
          <rect className="s-usb" x={BX + BW / 2 - 38} y={H - 46} width={76} height={34} rx={6} />
          <text className="s-cl" x={BX + BW / 2} y={H - 24} textAnchor="middle">USB</text>
          {d.sinistra.map((p, i) => disegnaPin(p, 'sinistra', i))}
          {d.destra.map((p, i) => disegnaPin(p, 'destra', i))}
        </svg>
        <aside className="s-fd" aria-live="polite">
          {!pin ? (
            <p className="s-fd-v">Scegli un pin per leggere a cosa serve. I pallini colorati sono le famiglie di funzioni; usa i filtri per vederne una sola.</p>
          ) : (
            <>
              <h2>{pin.titolo || pin.etichetta}</h2>
              <p className="s-fd-s">Scritta sulla scheda: <b>{pin.etichetta}</b></p>
              {pin.famiglie.length > 0 && (
                <div className="s-fd-f">
                  {pin.famiglie.map((id) => <span key={id} className="s-ftag" data-c={fam.get(id)?.colore}>{fam.get(id)?.nome ?? id}</span>)}
                </div>
              )}
              {pin.funzioni.length > 0 && <p className="s-fd-s">Nello schema: {pin.funzioni.join(' · ')}</p>}
              <ul className="s-fd-l">{pin.spiega.map((x, k) => <li key={k}>{x}</li>)}</ul>
              {pin.nota && <div className="s-fd-n"><b>Nota:</b> {pin.nota}</div>}
              {collegate.length > 0 && (
                <>
                  <h3 className="s-fd-h">Situazioni collegate</h3>
                  <div className="s-rels">
                    {collegate.map((id) => (
                      <button key={id} type="button" className="s-chip" data-c={colore(id)} onClick={() => apri(id)}>
                        {schede[id]!.sigla}<small>{schede[id]!.comando}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </aside>
      </div>
      {d.componenti.length > 0 && (
        <>
          <h2 className="s-sec">Già presenti sulla scheda</h2>
          <div className="s-two">
            {d.componenti.map((c) => (
              <div key={c.nome} className="s-card"><h3>{c.nome}</h3><p>{c.spiega}</p></div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
