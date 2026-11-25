import { useEffect, useState, type ReactNode } from 'react'
import type { Confronto, ExtraAutore, Nota, Percorso, Ripasso, TestoChiave } from '@shared/extraAutore'
import { useStore } from '../store'
import { Md } from '../utili'

type Sezione = 'confronti' | 'ripasso' | 'note' | 'testi' | 'percorso'

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

function CardTesto({ t }: { t: TestoChiave }): ReactNode {
  return (
    <section className="ex-card">
      <h2>{t.titolo}</h2>
      {t.metrica && <p className="ex-dom">{t.metrica}</p>}
      {t.versi.length > 0 && (
        <blockquote className="ex-versi">
          {t.versi.map((v, i) => <div key={i}>{v}</div>)}
        </blockquote>
      )}
      <ul className="ex-voci">
        {t.analisi.map((a, i) => <li key={i}><Md testo={a} /></li>)}
      </ul>
      {t.da_controllare && <p className="ex-pg">Versi e metrica non vengono dalla tua antologia: confrontali prima di usarli.</p>}
      {t.scheda && <Collegate ids={[t.scheda]} />}
    </section>
  )
}

/** Mappa schematica: i luoghi sono punti (longitudine e latitudine), la linea segue le tappe in ordine. */
function MappaPercorso({ p }: { p: Percorso }): ReactNode {
  const [sel, setSel] = useState(0)
  const indice = useStore((s) => s.indice)
  const imposta = useStore((s) => s.imposta)
  const lon = p.luoghi.map((l) => l.lon)
  const lat = p.luoghi.map((l) => l.lat)
  const [x0, x1, y0, y1] = [Math.min(...lon) - 1.2, Math.max(...lon) + 1.2, Math.min(...lat) - 0.8, Math.max(...lat) + 0.8]
  const W = 420
  const H = Math.round((W * (y1 - y0)) / ((x1 - x0) * Math.cos((43 * Math.PI) / 180)))
  const px = (l: { lon: number }): number => ((l.lon - x0) / (x1 - x0)) * W
  const py = (l: { lat: number }): number => H - ((l.lat - y0) / (y1 - y0)) * H
  const luogo = (id: string) => p.luoghi.find((l) => l.id === id)!
  const t = p.tappe[sel]!
  const linea = p.tappe.map((x) => `${px(luogo(x.luogo)).toFixed(1)},${py(luogo(x.luogo)).toFixed(1)}`).join(' ')
  return (
    <div className="ex-perc">
      <svg viewBox={`-60 -10 ${W + 120} ${H + 20}`} className="ex-mappa" role="img" aria-label="Percorso di una vita sui luoghi">
        <polyline points={linea} fill="none" stroke="var(--mute)" strokeWidth="1.5" strokeDasharray="4 3" />
        {p.luoghi.map((l) => {
          const attivo = l.id === t.luogo
          const a = l.lato === 'destra' ? 'start' : 'end'
          const dx = (l.dx ?? 0) + (l.lato === 'destra' ? 9 : -9)
          return (
            <g key={l.id}>
              <circle cx={px(l)} cy={py(l)} r={attivo ? 7 : 4.5} fill={attivo ? 'var(--ink)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth="2" />
              <text x={px(l) + dx} y={py(l) + 4 + (l.dy ?? 0)} textAnchor={a} fontSize="12" fill="var(--ink)" fontWeight={attivo ? 700 : 400}>{l.nome}</text>
            </g>
          )
        })}
      </svg>
      <ol className="ex-tappe">
        {p.tappe.map((x, i) => (
          <li key={i}>
            <button type="button" aria-current={i === sel} onClick={() => setSel(i)}>
              <small>{x.quando}</small>
              <b>{x.titolo}</b>
            </button>
            {i === sel && x.schede.filter((id) => indice?.byId.has(id)).length > 0 && (
              <div className="ex-sch">
                {x.schede.filter((id) => indice?.byId.has(id)).map((id) => (
                  <button key={id} type="button" className="ex-chip" onClick={() => imposta({ apertaId: id })}>{indice!.byId.get(id)!.titolo_breve}</button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
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
          {sezione === 'testi' && (extra.testiChiave.length ? <div className="ex-lista">{extra.testiChiave.map((t) => <CardTesto key={t.id} t={t} />)}</div> : vuoto('testi chiave', 'testi_chiave'))}
          {sezione === 'percorso' && (extra.percorso ? <MappaPercorso p={extra.percorso} /> : vuoto('luoghi e tappe', 'percorso.md (file)'))}
          {sezione === 'note' && (extra.note.length ? extra.note.map((n) => <CardNota key={n.id} n={n} />) : vuoto('note', 'note'))}
        </div>
      )}
    </div>
  )
}
