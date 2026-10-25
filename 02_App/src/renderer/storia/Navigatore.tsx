import type { ReactNode } from 'react'
import type { SchedaVoce, Situazioni } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { anno, useStoria, STORIA0 } from './stato'

interface P {
  rel: string
  dati: Situazioni
  scheda: string | null
  apri: (id: string) => void
}

/** La mappa dell'argomento: rami e voci, in colonna. Non la mappa a rami con pan e zoom. */
export function Mappa({ rel, dati, scheda, apri }: P): ReactNode {
  const chiusi = useStoria((s) => (s.stati[rel] ?? STORIA0).chiusi)
  const apriChiudi = (id: string): void =>
    useStoria.getState().imposta(rel, { chiusi: chiusi.includes(id) ? chiusi.filter((x) => x !== id) : [...chiusi, id] })

  return (
    <>
      <div className="st-col-t">Mappa dell'argomento</div>
      <div className="st-centro">{dati.indice.centro}</div>
      {dati.indice.rami.map((r) => {
        const aperto = !chiusi.includes(r.id)
        const ids = r.voci.flatMap((v) => v.schede).filter((id) => dati.schede[id])
        return (
          <div key={r.id} className="st-ramo" data-c={r.colore}>
            <button type="button" className="st-ramo-t" onClick={() => apriChiudi(r.id)} aria-expanded={aperto}>
              <Icona nome={aperto ? 'meno' : 'piu'} size={13} />
              <span>{r.nome}</span>
              {r.quando ? <span className="st-anni">{r.quando}</span> : null}
            </button>
            {aperto && (
              <div className="st-foglie">
                {ids.map((id, i) => {
                  const s = dati.schede[id]!
                  const sv = s.tipo === 'voce' && s.svolta
                  return (
                    <button key={id} type="button" className={'st-foglia' + (id === scheda ? ' sel' : '')} onClick={() => apri(id)}>
                      {r.ordine ? <span className="st-n">{i + 1}.</span> : <span className="st-pall" />}
                      <span className="st-nome">
                        {sv ? <Icona nome="svolta" size={13} /> : null}
                        {s.sigla}
                      </span>
                      {s.tipo === 'voce' && s.quando ? <span className="st-q">{s.quando}</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/** La cronologia a blocchi d'anno: prende il posto della mappa, la scheda resta a destra. */
export function Cronologia({ dati, scheda, apri }: Omit<P, 'rel'>): ReactNode {
  const voci = Object.values(dati.schede).filter((s): s is SchedaVoce => s.tipo === 'voce')
  const ramoDi = (id: string): { colore: string; nome: string } | undefined => {
    const r = dati.indice.rami.find((x) => x.voci.some((v) => v.schede.includes(id)))
    return r ? { colore: r.colore, nome: r.nome } : undefined
  }
  const datate = voci.filter((s) => s.quando && anno(s.quando) < 9999).sort((a, b) => anno(a.quando) - anno(b.quando))
  const gruppi: { anno: number; voci: SchedaVoce[] }[] = []
  for (const s of datate) {
    const a = anno(s.quando)
    const g = gruppi[gruppi.length - 1]
    if (g && g.anno === a) g.voci.push(s)
    else gruppi.push({ anno: a, voci: [s] })
  }
  const senza = voci.filter((s) => !s.quando || anno(s.quando) === 9999)

  return (
    <>
      <div className="st-col-t">Cronologia</div>
      {gruppi.map((g, i) => {
        const salto = i > 0 ? g.anno - gruppi[i - 1]!.anno : 0
        return (
          <div key={g.anno}>
            {salto >= 4 && <div className="st-salto"><span>{salto} anni</span></div>}
            <div className={'st-blk' + (g.voci.some((s) => s.svolta) ? ' sv' : '')}>
              <div className="st-blk-a">
                <div className="st-anno">{g.anno}</div>
                {g.voci.length > 1 && <div className="st-blk-n">{g.voci.length} fatti</div>}
              </div>
              <div className="st-blk-v">
                {g.voci.map((s) => {
                  const r = ramoDi(s.id)
                  return (
                    <button key={s.id} type="button" className={'st-vv' + (s.id === scheda ? ' sel' : '')} data-c={r?.colore} onClick={() => apri(s.id)}>
                      <span className="st-vv-t">
                        {s.svolta ? <Icona nome="svolta" size={13} /> : null}
                        {s.titolo}
                      </span>
                      <span className="st-vv-s">
                        {!/^\d{4}$/.test(s.quando.trim()) && <b>{s.quando}</b>}
                        {r?.nome}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
      {senza.length > 0 && (
        <div className="st-senza">
          <div className="st-col-t">Senza una data precisa · {senza.length}</div>
          <div className="st-senza-l">
            {senza.map((s) => (
              <button key={s.id} type="button" className={'st-pill' + (s.id === scheda ? ' on' : '')} onClick={() => apri(s.id)}>{s.sigla}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
