import { useState, type ReactNode } from 'react'
import type { SchedaVoce, Situazioni } from '@shared/situazioni'
import { copertura as calcolaCopertura } from '@shared/situazioni'
import { Icona } from '../componenti/Icona'
import { Testo } from './Voce'
import { useStoria } from './stato'

/** Glossario, «Chi è chi», Svolte: elenchi ricavati dalle schede, non file.
 *  Griglia di card: chiuse mostrano solo il termine (si scorre con l'occhio),
 *  aperte mostrano la spiegazione. Il termine resta la cosa da ricordare. */
export function Elenco({ dati, vista, apri }: { dati: Situazioni; vista: 'glossario' | 'persone' | 'svolte'; apri: (id: string) => void }): ReactNode {
  const [aperte, setAperte] = useState<string[]>([])
  const voci = Object.values(dati.schede).filter((s): s is SchedaVoce => s.tipo === 'voce')
  const conf = {
    glossario: { titolo: 'Glossario', sotto: 'Ricavato: tutte le voci di genere «concetto». Clicca un termine per vedere che cosa vuol dire.', filtro: (s: SchedaVoce) => s.genere === 'concetto', testo: (s: SchedaVoce) => s.cosa, alfabetico: true },
    persone: { titolo: 'Chi è chi', sotto: 'Ricavato: tutte le voci di genere «persona». Clicca un nome per vedere chi è.', filtro: (s: SchedaVoce) => s.genere === 'persona', testo: (s: SchedaVoce) => s.cosa, alfabetico: true },
    svolte: { titolo: 'Svolte', sotto: 'Ricavate: le voci segnate come punto di svolta, in ordine di comparsa. Clicca per vedere perché contano.', filtro: (s: SchedaVoce) => s.svolta, testo: (s: SchedaVoce) => s.conta, alfabetico: false }
  }[vista]
  const scelte = voci.filter(conf.filtro)
  if (conf.alfabetico) scelte.sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'))
  const ramoDi = (id: string): string | undefined => dati.indice.rami.find((x) => x.voci.some((v) => v.schede.includes(id)))?.colore
  const nomeRamo = (id: string): string => dati.indice.rami.find((x) => x.voci.some((v) => v.schede.includes(id)))?.nome ?? ''
  const tutteAperte = scelte.length > 0 && aperte.length === scelte.length

  return (
    <div className="st-vista larga">
      <h1>{conf.titolo}</h1>
      <p className="st-sotto">{conf.sotto}</p>
      {scelte.length === 0 ? (
        <p className="st-vuoto">Nessuna voce di questo tipo in questo argomento.</p>
      ) : (
        <>
          <div className="st-gl-barra">
            <span>{scelte.length} voci</span>
            <button type="button" className="btn" onClick={() => setAperte(tutteAperte ? [] : scelte.map((s) => s.id))}>
              <Icona nome={tutteAperte ? 'chiuso' : 'apri'} size={13} /> {tutteAperte ? 'Chiudi tutte' : 'Apri tutte'}
            </button>
          </div>
          <div className="st-griglia">
            {scelte.map((s) => {
              const aperta = aperte.includes(s.id)
              return (
                <article key={s.id} className={'st-gl' + (aperta ? ' aperta' : '')} data-c={ramoDi(s.id)}>
                  <button
                    type="button"
                    className="st-gl-t"
                    aria-expanded={aperta}
                    onClick={() => setAperte((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                  >
                    <b>{s.titolo}</b>
                    <Icona nome={aperta ? 'su' : 'giu'} size={13} />
                  </button>
                  {aperta && (
                    <div className="st-gl-c">
                      <p><Testo s={conf.testo(s)} /></p>
                      <div className="st-gl-p">
                        {nomeRamo(s.id) && <span className="st-gl-ramo">{nomeRamo(s.id)}</span>}
                        <button type="button" className="st-pill" onClick={() => apri(s.id)}>
                          Apri la scheda <Icona nome="dx" size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/** Copertura del libro: vista di materia, dice quali paragrafi nessuna scheda copre. */
export function Copertura({ dati, vaiA }: { dati: Situazioni; vaiA: (rel: string, id: string) => void }): ReactNode {
  const materia = dati.rel.split('/').filter(Boolean)[0] ?? ''
  const m = useStoria((s) => s.materia[materia])
  if (!m) return <div className="st-vista"><h1>Copertura del libro</h1><p className="st-sotto">Leggo i documenti della materia…</p></div>
  const righe = calcolaCopertura(m.libri, m.documenti)
  if (righe.length === 0)
    return (
      <div className="st-vista">
        <h1>Copertura del libro</h1>
        <p className="st-sotto">Per vedere la copertura serve il file <code>01_Argomenti/{materia}/_libri.yaml</code> con i capitoli e i paragrafi dei libri.</p>
      </div>
    )
  const coperti = righe.filter((r) => r.schede.length > 0).length
  const pc = Math.round((coperti / righe.length) * 100)
  const perLibro = new Map<string, typeof righe>()
  for (const r of righe) perLibro.set(r.libro, [...(perLibro.get(r.libro) ?? []), r])

  return (
    <div className="st-vista">
      <h1>Copertura del libro</h1>
      <p className="st-sotto">Di tutta la materia {materia}, non di un argomento solo. In rosso i paragrafi che nessuna scheda copre: lì il libro dice cose che nel tool non ci sono.</p>
      <div className="st-cop-tot">
        <b>{coperti} paragrafi su {righe.length} hanno almeno una scheda ({pc}%)</b>
        <div className="st-barra"><div style={{ width: `${pc}%` }} /></div>
      </div>
      {[...perLibro.entries()].map(([libro, rs]) => (
        <section key={libro}>
          <h2 className="st-libro">{libro}</h2>
          {rs.map((r, i) => {
            const nuovoCap = i === 0 || rs[i - 1]!.capitolo !== r.capitolo
            return (
              <div key={`${r.capitolo}-${r.paragrafo}`}>
                {nuovoCap && <div className="st-cap">Cap. {r.capitolo} — {r.titoloCapitolo}</div>}
                <div className={'st-par' + (r.schede.length ? '' : ' scoperto')}>
                  <span className="st-par-n">{r.paragrafo}.</span>
                  <span className="st-par-t">{r.titolo}</span>
                  <span className="st-par-d">
                    {r.schede.length === 0 ? (
                      <span className="st-nessuna"><Icona nome="avviso" size={13} /> nessuna scheda</span>
                    ) : (
                      [...new Set(r.schede.map((x) => x.documento))].map((doc) => {
                        const prima = r.schede.find((x) => x.documento === doc)!
                        const n = r.schede.filter((x) => x.documento === doc).length
                        return (
                          <button key={doc} type="button" className="st-pill ok" onClick={() => vaiA(prima.rel, prima.id)}>
                            {n} in «{doc}»
                          </button>
                        )
                      })
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
