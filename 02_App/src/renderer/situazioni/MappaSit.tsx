import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Situazioni } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { useSit, VISTA0 } from './stato'
import { cerca, type InfoScheda } from './util'

interface Ctx {
  rel: string
  dati: Situazioni
  ordine: string[]
  info: Record<string, InfoScheda>
  pagliaio: Record<string, string>
}

export function MappaSit({ ctx }: { ctx: Ctx }): ReactNode {
  const { rel, dati, ordine, info, pagliaio } = ctx
  const v = useSit((x) => x.viste[rel] ?? VISTA0)
  const imposta = (p: Partial<typeof v>): void => useSit.getState().imposta(rel, p)
  const [sel, setSel] = useState(0)
  const trovate = useMemo(() => cerca(v.q, ordine, pagliaio), [v.q, ordine, pagliaio])
  const apri = (id: string): void => imposta({ scheda: id, q: '' })
  useEffect(() => setSel(0), [v.q])

  return (
    <>
      <div className="s-top">
        <div>
          <h1>{dati.indice.titolo}</h1>
          {dati.indice.sottotitolo && <p>{dati.indice.sottotitolo}</p>}
        </div>
        <span className="s-count">Ripassate: <b>{dati.ripassate.length}</b> / {ordine.length}</span>
        <div className="s-search">
          <input
            id="s-q"
            className="inp big"
            type="search"
            autoComplete="off"
            placeholder="Cosa vuoi fare? Per esempio: client senza IP, bridge, NAT, backup…"
            aria-label="Cerca una situazione"
            value={v.q}
            onChange={(e) => imposta({ q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, Math.max(0, Math.min(trovate.length, 8) - 1))) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)) }
              else if (e.key === 'Enter' && trovate[sel]) apri(trovate[sel]!)
            }}
          />
          <span className="s-kbd" aria-hidden="true">/</span>
          {v.q.trim() && (
            <div className="s-res" role="listbox">
              {trovate.length === 0 ? (
                <div className="s-none">Nessuna situazione trovata.</div>
              ) : (
                trovate.slice(0, 8).map((id, i) => (
                  <button key={id} type="button" role="option" aria-selected={i === sel} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => apri(id)}>
                    <span className="rt">{dati.schede[id]!.sigla}</span>
                    <span className="rk">{dati.schede[id]!.comando}</span>
                    <span className="rb" data-c={dati.indice.rami[info[id]!.bi]!.colore}>{dati.indice.rami[info[id]!.bi]!.nome}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {dati.avvisi.length > 0 && (
        <details className="s-avv">
          <summary>{dati.avvisi.length} avvisi sui file di questa documentazione</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{dati.avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </details>
      )}
      <div className="s-mappa">
        {dati.indice.rami.map((r, bi) => (
          <div key={r.id} className={'s-br' + (v.fuoco != null && v.fuoco !== bi ? ' dim' : '')} data-c={r.colore}>
            <button type="button" className="s-pill" aria-pressed={v.fuoco === bi} onClick={() => imposta({ fuoco: v.fuoco === bi ? null : bi })}>
              <i>{bi + 1}</i>{r.nome}
            </button>
            {r.voci.map((vo, k) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vo.gruppo && <span className="s-sub">{vo.gruppo}</span>}
                {vo.schede.filter((id) => dati.schede[id]).map((id) => {
                  const s = dati.schede[id]!
                  const fatta = dati.ripassate.includes(id)
                  return (
                    <button key={id} type="button" className={'s-leaf' + (v.q.trim() && !trovate.includes(id) ? ' nomatch' : '')} onClick={() => imposta({ scheda: id })}>
                      <span className="lt">{s.sigla}</span>
                      {v.fuoco === bi ? <span className="lw">{s.frase}</span> : <span className="lk">{s.comando}</span>}
                      {fatta && <span className="ok" aria-label="ripassata"><Icona nome="spunta" size={11} /></span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="s-hint">Clic su un ramo per metterlo a fuoco (<kbd>Esc</kbd> per tornare). Il numero sul ramo è il livello: dal più semplice al più complesso. <kbd>/</kbd> per cercare.</p>
    </>
  )
}
