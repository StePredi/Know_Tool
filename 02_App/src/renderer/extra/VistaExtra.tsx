import { useEffect, useState, type ReactNode } from 'react'
import type { Confronto, ExtraAutore, Nota, Ripasso } from '@shared/extraAutore'
import { useStore } from '../store'
import { Md } from '../utili'

type Sezione = 'confronti' | 'ripasso' | 'note'

/** Le schede collegate: un clic apre la scheda completa. */
function Collegate({ ids }: { ids: string[] }): ReactNode {
  const indice = useStore((s) => s.indice)
  const imposta = useStore((s) => s.imposta)
  const visibili = ids.filter((id) => indice?.byId.has(id))
  if (visibili.length === 0) return null
  return (
    <div className="ex-sch">
      <span>Schede:</span>
      {visibili.map((id) => (
        <button key={id} type="button" className="ex-chip" onClick={() => imposta({ apertaId: id })}>
          {indice!.byId.get(id)!.titolo_breve}
        </button>
      ))}
    </div>
  )
}

function CardConfronto({ c }: { c: Confronto }): ReactNode {
  return (
    <section className="ex-card">
      <h2>{c.titolo}</h2>
      {c.domanda && <p className="ex-dom"><Md testo={c.domanda} /></p>}
      <div className="ex-scroll">
        <table className="ex-tab">
          <thead>
            <tr>{c.colonne.map((t, i) => <th key={i}>{t}</th>)}</tr>
          </thead>
          <tbody>
            {c.righe.map((r, i) => (
              <tr key={i}>
                {r.map((t, j) => (j === 0 ? <th key={j} scope="row">{t}</th> : <td key={j}><Md testo={t} /></td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Collegate ids={c.schede} />
      {c.pagine && <p className="ex-pg">{c.pagine}</p>}
    </section>
  )
}

function SezioneRipasso({ ripasso }: { ripasso: Ripasso[] }): ReactNode {
  const [cat, setCat] = useState<string>('')
  const [aperte, setAperte] = useState<Set<string>>(new Set())
  const gruppi = cat ? ripasso.filter((r) => r.categoria === cat) : ripasso
  const tutte = gruppi.flatMap((g) => g.domande.map((d, i) => ({ ...d, k: `${g.categoria}#${i}`, cat: g.categoria })))
  const scopri = (k: string): void => setAperte((o) => new Set(o).add(k))
  return (
    <>
      <div className="ex-bar">
        <div className="ex-cats" role="group" aria-label="Categoria">
          <button type="button" aria-pressed={cat === ''} onClick={() => setCat('')}>Tutte</button>
          {ripasso.map((r) => (
            <button key={r.categoria} type="button" aria-pressed={cat === r.categoria} onClick={() => setCat(r.categoria)}>
              {r.categoria}
            </button>
          ))}
        </div>
        <span className="ex-n">{aperte.size} di {tutte.length} scoperte</span>
        <button type="button" className="btn" onClick={() => setAperte(new Set())}>Copri tutte</button>
        <button type="button" className="btn" onClick={() => setAperte(new Set(tutte.map((t) => t.k)))}>Scopri tutte</button>
      </div>
      <div className="ex-lista">
        {tutte.map((d) => {
          const on = aperte.has(d.k)
          return (
            <article key={d.k} className="ex-q">
              <div className="ex-qh">
                {!cat && <small>{d.cat}</small>}
                {d.fuori_dal_libro && <span className="ex-fuori" title="Non è nelle tue pagine: conoscenza generale">fuori dal libro</span>}
              </div>
              <h3><Md testo={d.domanda} /></h3>
              {on ? (
                <p className="ex-ris"><Md testo={d.risposta} /></p>
              ) : (
                <button type="button" className="btn ex-mostra" onClick={() => scopri(d.k)}>Mostra la risposta</button>
              )}
              {on && <Collegate ids={d.schede} />}
            </article>
          )
        })}
      </div>
    </>
  )
}

function CardNota({ n }: { n: Nota }): ReactNode {
  return (
    <section className="ex-card">
      <h2>{n.titolo}</h2>
      {n.intro && <p className="ex-dom"><Md testo={n.intro} /></p>}
      <ul className="ex-voci">
        {n.voci.map((v, i) => <li key={i}><Md testo={v} /></li>)}
      </ul>
    </section>
  )
}

export function VistaExtra({ sezione }: { sezione: Sezione }): ReactNode {
  const autore = useStore((s) => s.stato?.autoreId)
  const [extra, setExtra] = useState<ExtraAutore | null>(null)
  const [errore, setErrore] = useState('')
  useEffect(() => {
    let vivo = true
    setExtra(null)
    setErrore('')
    window.api.leggiExtra().then((e) => { if (vivo) setExtra(e) }, (e: Error) => { if (vivo) setErrore(e.message) })
    return () => { vivo = false }
  }, [autore, sezione])

  const vuoto = (cosa: string, cartella: string): ReactNode => (
    <p className="ex-vuoto">Per questo autore non ci sono {cosa}. Si scrivono come file nella cartella <code>{cartella}/</code>.</p>
  )
  return (
    <div className="ex" role="region" aria-label={sezione}>
      {errore && <p role="alert" className="ex-err">{errore}</p>}
      {!extra && !errore && <p className="ex-vuoto">Apro…</p>}
      {extra && (
        <div className="ex-in">
          {extra.errori.length > 0 && (
            <div role="alert" className="ex-err">
              <b>File che non si leggono:</b>
              <ul>{extra.errori.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          {sezione === 'confronti' && (extra.confronti.length ? extra.confronti.map((c) => <CardConfronto key={c.id} c={c} />) : vuoto('confronti', 'confronti'))}
          {sezione === 'ripasso' && (extra.ripasso.length ? <SezioneRipasso ripasso={extra.ripasso} /> : vuoto('domande di ripasso', 'ripasso'))}
          {sezione === 'note' && (extra.note.length ? extra.note.map((n) => <CardNota key={n.id} n={n} />) : vuoto('note', 'note'))}
        </div>
      )}
    </div>
  )
}
