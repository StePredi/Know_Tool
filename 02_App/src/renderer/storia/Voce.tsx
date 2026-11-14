import { useState, type ReactNode } from 'react'
import type { SchedaConfronto, SchedaVoce, Situazioni } from '@shared/situazioni'
import { ETICHETTA_LEGA } from '@shared/situazioni'
import { pezziEnfasi } from '@shared/enfasi'
import { Icona, type NomeIcona } from '../componenti/Icona'

/** Un campo coperto dal ripasso: si scopre con un clic. */
export function Coperto({ s, attivo }: { s: string; attivo: boolean }): ReactNode {
  const [visto, setVisto] = useState(false)
  if (!attivo || visto) return <Testo s={s} />
  return (
    <button type="button" className="st-coperto" title="clicca per scoprire" onClick={() => setVisto(true)}>
      {pezziEnfasi(s).map((p) => p.v).join('')}
    </button>
  )
}

/** **grassetto** e *corsivo* dentro i testi, come negli appunti .md; \* = asterisco vero. */
export function Testo({ s }: { s: string }): ReactNode {
  return <>{pezziEnfasi(s).map((p, i) => (p.t === 'b' ? <b key={i}>{p.v}</b> : p.t === 'i' ? <i key={i}>{p.v}</i> : p.v))}</>
}

function Sezione({ icona, titolo, children }: { icona: NomeIcona; titolo: string; children: ReactNode }): ReactNode {
  return (
    <>
      <h2 className="s-sec vc-sec"><Icona nome={icona} size={15} /> {titolo}</h2>
      {children}
    </>
  )
}

/** I dati della voce e l'indice delle sezioni: a lato, mai fra il titolo e il testo. */
function Spalla({ s, sezioni, nascosti }: { s: SchedaVoce; sezioni: { id: string; nome: string }[]; nascosti: string[] }): ReactNode {
  const righe: { k: string; v: string; i: NomeIcona }[] = [
    { k: 'quando', v: s.quando, i: 'orologio' },
    { k: 'dove', v: s.dove, i: 'mappa' },
    { k: 'chi', v: s.chi.join(', '), i: 'persona' }
  ]
  return (
    <aside className="vc-sp">
      <div className="vc-box">
        <div className="vc-box-t">In una riga</div>
        {righe.map((r) => (
          <div key={r.k} className={'vc-dato' + (r.v ? '' : ' vuoto')}>
            <div className="vc-dato-k"><Icona nome={r.i} size={12} /> {r.k}</div>
            <div className="vc-dato-v">{r.v ? <Coperto s={r.v} attivo={nascosti.includes(r.k)} /> : '—'}</div>
          </div>
        ))}
      </div>
      {sezioni.length > 1 && (
        <nav className="vc-box">
          <div className="vc-box-t">In questa scheda</div>
          {sezioni.map((x) => (
            <button key={x.id} type="button" className="vc-vai" onClick={() => document.getElementById('vc-' + x.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              {x.nome}
            </button>
          ))}
        </nav>
      )}
    </aside>
  )
}

/** Corpo di una scheda «voce» (storia): i cinque campi del libro più le sezioni di dettaglio. */
export function Voce({ dati, s, colore, apri, nascosti = [] }: { dati: Situazioni; s: SchedaVoce; colore: (id: string) => string | undefined; apri: (id: string) => void; nascosti?: string[] }): ReactNode {
  const sezioni = [
    { id: 'breve', nome: 'In breve', c: true },
    { id: 'svolgimento', nome: 'Come si svolge', c: s.svolgimento.length > 0 },
    { id: 'dettagli', nome: 'I dettagli', c: s.elementi.length > 0 },
    { id: 'numeri', nome: 'I numeri', c: s.numeri.length > 0 },
    { id: 'attenzione', nome: 'Attenzione', c: !!s.errore || s.confondi.length > 0 || !!s.nota },
    { id: 'studi', nome: 'Documenti e studi', c: s.citazioni.length > 0 || s.storiografia.length > 0 },
    { id: 'lega', nome: 'Collegamenti', c: s.lega.length > 0 }
  ].filter((x) => x.c)

  return (
    <div className="vc-g">
      <div className="vc-corpo">
        <section id="vc-breve">
          <h2 className="s-sec vc-sec">Che cos'è</h2>
          <p className="vc-cosa"><Coperto s={s.cosa} attivo={nascosti.includes('cosa')} /></p>
          <div className="vc-conta">
            <b>Perché conta</b>
            <p><Coperto s={s.conta} attivo={nascosti.includes('conta')} /></p>
          </div>
          {s.svolta && <p className="vc-svolta"><Icona nome="svolta" size={15} /> Punto di svolta: qui la vicenda cambia direzione.</p>}
        </section>

        {s.svolgimento.length > 0 && (
          <section id="vc-svolgimento">
            <Sezione icona="elenco" titolo="Come si svolge">
              <ol className="vc-passi">
                {s.svolgimento.map((p, i) => (
                  <li key={i}>
                    {p.quando && <span className="vc-passo-q">{p.quando}</span>}
                    <span><Testo s={p.passo} /></span>
                  </li>
                ))}
              </ol>
            </Sezione>
          </section>
        )}

        {s.elementi.length > 0 && (
          <section id="vc-dettagli">
            <Sezione icona="prosa" titolo="I dettagli">
              {s.elementi.map((e, i) => (
                <div key={i} className="vc-det">
                  <div className="vc-det-n"><Testo s={e.nome} /></div>
                  <div><Testo s={e.spiega} /></div>
                </div>
              ))}
            </Sezione>
          </section>
        )}

        {s.numeri.length > 0 && (
          <section id="vc-numeri">
            <Sezione icona="numeri" titolo="I numeri">
              <div className="vc-numeri">
                {s.numeri.map((n, i) => (
                  <div key={i} className="vc-num">
                    <div className="vc-num-v">{n.valore}</div>
                    <div className="vc-num-c"><Testo s={n.cosa} /></div>
                  </div>
                ))}
              </div>
            </Sezione>
          </section>
        )}

        {(s.errore || s.confondi.length > 0 || s.nota) && (
          <section id="vc-attenzione">
            <Sezione icona="avviso" titolo="Attenzione">
              {s.errore && <p className="rg-err"><Testo s={s.errore} /></p>}
              {s.confondi.filter((c) => dati.schede[c.scheda]).length > 0 && (
                <div className="vc-conf">
                  <div className="vc-et">Da non confondere con</div>
                  {s.confondi.filter((c) => dati.schede[c.scheda]).map((c) => (
                    <button key={c.scheda} type="button" className="s-chip" data-c={colore(c.scheda)} onClick={() => apri(c.scheda)}>
                      <b>{dati.schede[c.scheda]!.sigla}</b><small><Testo s={c.differenza} /></small>
                    </button>
                  ))}
                </div>
              )}
              {s.nota && <p className="vc-nota"><b>Nota.</b> <Testo s={s.nota} /></p>}
            </Sezione>
          </section>
        )}

        {(s.citazioni.length > 0 || s.storiografia.length > 0) && (
          <section id="vc-studi">
            <Sezione icona="citazione" titolo="Documenti e studi">
              {s.citazioni.map((c, i) => (
                <blockquote key={i} className="vc-cit">
                  <p><Testo s={c.testo} /></p>
                  <cite>{[c.chi, c.dove].filter(Boolean).join(' — ')}</cite>
                </blockquote>
              ))}
              {s.storiografia.map((h, i) => (
                <p key={i} className="vc-stor"><Icona nome="libro" size={14} /> {h.autore}, <i>{h.titolo}</i>{h.pagina ? ` · ${h.pagina}` : ''}</p>
              ))}
            </Sezione>
          </section>
        )}

        {s.lega.length > 0 && (
          <section id="vc-lega">
            <Sezione icona="collega" titolo="Collegamenti">
              <div className="vc-leghe">
                {s.lega.map((g, i) => {
                  const fuori = !!g.documento
                  const b = fuori ? null : dati.schede[g.scheda]
                  if (!fuori && !b) return null
                  return (
                    <button
                      key={i}
                      type="button"
                      className={'vc-lega' + (fuori ? ' fuori' : '')}
                      data-c={fuori ? undefined : colore(g.scheda)}
                      disabled={fuori}
                      onClick={() => !fuori && apri(g.scheda)}
                    >
                      <span className="vc-lega-t">{ETICHETTA_LEGA[g.tipo]}</span>
                      <span>
                        <b>{fuori ? `${g.scheda} (in «${g.documento}»)` : b!.titolo}</b>
                        {g.perche && <small><Testo s={g.perche} /></small>}
                        {fuori && <small>documento non ancora creato</small>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Sezione>
          </section>
        )}
      </div>
      <Spalla s={s} sezioni={sezioni.map((x) => ({ id: x.id, nome: x.nome }))} nascosti={nascosti} />
    </div>
  )
}

/** Corpo di una scheda «confronto»: le stesse domande poste a due o più casi. */
export function Confronto({ dati, s, colore, apri, ripasso = false }: { dati: Situazioni; s: SchedaConfronto; colore: (id: string) => string | undefined; apri: (id: string) => void; ripasso?: boolean }): ReactNode {
  return (
    <>
      <h2 className="s-sec vc-sec"><Icona nome="bilancia" size={15} /> Le stesse domande, caso per caso</h2>
      <div className="vc-tab-w">
        <table className="vc-tab">
          <thead>
            <tr>
              <th />
              {s.casi.map((c) => (
                <th key={c.nome} data-c={c.scheda ? colore(c.scheda) : undefined}>
                  {c.scheda && dati.schede[c.scheda]
                    ? <button type="button" className="vc-caso" onClick={() => apri(c.scheda!)}>{c.nome}</button>
                    : <span className="vc-caso">{c.nome}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.domande.map((d, i) => (
              <tr key={i}>
                <th scope="row">{d}</th>
                {s.casi.map((c, j) => <td key={c.nome}><Coperto s={c.risposte[i] ?? ''} attivo={ripasso && j === s.casi.length - 1} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
