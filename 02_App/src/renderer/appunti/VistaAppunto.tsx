import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Appunto } from '@shared/types'
import { parseMd, separaIntestazione, type Blocco, type Inline } from '@shared/markdown'
import { useStore } from '../store'
import { trova, useHome } from '../home/stato'
import { ModificaAppunto } from './ModificaAppunto'

/** Un file di appunti (.md) letto nell'app: titoli, elenchi, tabelle, codice, con l'indice a lato. Solo lettura. */

function risolvi(da: string, href: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) return null
  const parti = da.split('/').slice(0, -1)
  for (const p of decodeURI(href.split('#')[0]!).split('/')) {
    if (p === '..') parti.pop()
    else if (p && p !== '.') parti.push(p)
  }
  return parti.join('/')
}

const FILE_CITATO = /^[^\s`]+\/[^\s`]+\.(pdf|pptx?|docx?|xlsx?|html?|png|jpe?g|gif|webp|svg|csv)$/i
const NOTA_CITATA = /^[^\s`]+\.md$/i

function apriFile(a: Appunto, citato: string): void {
  window.api.apriFonte(a.rel, citato).catch((e: unknown) => {
    const m = e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e)
    useStore.getState().mostraToast?.(m)
  })
}

/** Appunti appena creati: si aprono già in modifica. */
export const daModificare = new Set<string>()

/** Un altro appunto citato (es. `appunti/i2c_teoria.md`): lo si cerca accanto e nelle cartelle sopra. */
function altroAppunto(a: Appunto, citato: string) {
  const parti = a.rel.split('/')
  const albero = useHome.getState().albero
  for (let n = parti.length - 1; n >= 1; n--) {
    const t = trova(albero, [...parti.slice(0, n), ...citato.split('/')].join('/'))
    if (t) return t
  }
  return null
}

function Testo({ v, a }: { v: Inline[]; a: Appunto }): ReactNode {
  return (
    <>
      {v.map((x, k) => {
        switch (x.t) {
          case 'txt':
            return <Fragment key={k}>{x.v}</Fragment>
          case 'code':
            if (FILE_CITATO.test(x.v)) {
              return <button key={k} type="button" className="md-ic md-fonte" title="Apri con l'app predefinita del sistema" onClick={() => apriFile(a, x.v)}>{x.v}</button>
            }
            if (NOTA_CITATA.test(x.v) && x.v.includes('/')) {
              const t = altroAppunto(a, x.v)
              if (t) return <button key={k} type="button" className="md-ic md-fonte" title="Apri questi appunti" onClick={() => useHome.getState().apri(t)}>{x.v}</button>
            }
            return <code key={k} className="md-ic">{x.v}</code>
          case 'b':
            return <strong key={k}><Testo v={x.v} a={a} /></strong>
          case 'i':
            return <em key={k}><Testo v={x.v} a={a} /></em>
          case 'img': {
            const u = a.immagini[x.src] ?? (/^(https?:|data:)/i.test(x.src) ? x.src : null)
            return u ? <img key={k} className="md-img" src={u} alt={x.alt} /> : <span key={k} className="md-mancante">[immagine non trovata: {x.src}]</span>
          }
          case 'a': {
            if (x.href.startsWith('#')) {
              return <a key={k} href={x.href} onClick={(e) => { e.preventDefault(); document.getElementById('md-' + x.href.slice(1))?.scrollIntoView({ block: 'start' }) }}><Testo v={x.v} a={a} /></a>
            }
            const rel = risolvi(a.rel, x.href)
            const nodo = rel ? trova(useHome.getState().albero, rel) : null
            if (nodo) return <a key={k} href="#" onClick={(e) => { e.preventDefault(); useHome.getState().apri(nodo) }}><Testo v={x.v} a={a} /></a>
            if (/^[^:]+\.(pdf|pptx?|docx?|xlsx?|html?|png|jpe?g|csv)(#.*)?$/i.test(x.href)) return <a key={k} href="#" title="Apri con l'app predefinita del sistema" onClick={(e) => { e.preventDefault(); apriFile(a, x.href) }}><Testo v={x.v} a={a} /></a>
            if (/^https?:/i.test(x.href)) return <a key={k} href={x.href} target="_blank" rel="noreferrer"><Testo v={x.v} a={a} /></a>
            return <span key={k} className="md-nolink" title={x.href}><Testo v={x.v} a={a} /></span>
          }
        }
      })}
    </>
  )
}

function Codice({ v, lingua }: { v: string; lingua: string }): ReactNode {
  const [ok, setOk] = useState(false)
  return (
    <div className="md-cod">
      <div className="md-cod-t">
        <span>{lingua || 'testo'}</span>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void navigator.clipboard?.writeText(v).then(() => { setOk(true); setTimeout(() => setOk(false), 1400) }, () => undefined)
          }}
        >
          {ok ? 'Copiato' : 'Copia'}
        </button>
      </div>
      <pre tabIndex={0}><code>{v}</code></pre>
    </div>
  )
}

export function Bl({ b, a }: { b: Blocco; a: Appunto }): ReactNode {
  switch (b.t) {
    case 'h': {
      const H = ('h' + Math.min(6, b.livello)) as 'h1'
      return <H id={'md-' + b.id}><Testo v={b.v} a={a} /></H>
    }
    case 'p':
      return <p><Testo v={b.v} a={a} /></p>
    case 'hr':
      return <hr />
    case 'codice':
      return <Codice v={b.v} lingua={b.lingua} />
    case 'cit':
      return <blockquote>{b.v.map((x, k) => <Bl key={k} b={x} a={a} />)}</blockquote>
    case 'lista':
      return (
        <ul className="md-l">
          {b.voci.map((x, k) => (
            <li key={k} style={{ marginLeft: x.depth * 22 }}>
              <span className="md-m" aria-hidden="true">{x.num != null ? x.num + '.' : x.depth ? '–' : '•'}</span>
              <span><Testo v={x.v} a={a} /></span>
            </li>
          ))}
        </ul>
      )
    case 'tabella':
      return (
        <div className="md-tw" tabIndex={0}>
          <table>
            <thead><tr>{b.testa.map((c, k) => <th key={k}><Testo v={c} a={a} /></th>)}</tr></thead>
            <tbody>{b.righe.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}><Testo v={c} a={a} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      )
  }
}

export function VistaAppunto({ rel }: { rel: string }): ReactNode {
  const [a, setA] = useState<Appunto | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const nodo = useHome((h) => trova(h.albero, rel))
  const sopra = useRef<HTMLDivElement>(null)
  const [modifica, setModifica] = useState(() => daModificare.delete(rel))
  const [giro, setGiro] = useState(0)

  useEffect(() => {
    let vivo = true
    const carica = (): void => {
      window.api.leggiAppunto(rel).then(
        (r) => { if (vivo) { setA(r); setErrore(null) } },
        (e: unknown) => { if (vivo) setErrore(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e)) }
      )
    }
    carica()
    // se il file cambia mentre è aperto (la sessione di studio lo aggiorna), si rilegge al ritorno nella finestra
    window.addEventListener('focus', carica)
    return () => { vivo = false; window.removeEventListener('focus', carica) }
  }, [rel, giro])

  const blocchi = useMemo(() => (a ? parseMd(a.testo) : []), [a])
  const indice = useMemo(() => blocchi.filter((b): b is Extract<Blocco, { t: 'h' }> => b.t === 'h' && b.livello >= 2 && b.livello <= 3), [blocchi])
  const titolo = nodo?.nome ?? rel.split('/').pop()!.replace(/\.md$/i, '')
  const intestaz = a ? separaIntestazione(a.testo).fm : ''

  if (errore) return <div className="sit"><div className="s-in"><p role="alert" className="s-avv">{errore}</p></div></div>
  if (!a) return <div className="sit"><div className="s-in"><p>Apro gli appunti…</p></div></div>
  if (modifica) return <ModificaAppunto a={a} esci={(salvato) => { setModifica(false); if (salvato) setGiro((g) => g + 1) }} />
  // se il testo comincia già con il suo titolo (#), non si ripete
  const haH1 = blocchi[0]?.t === 'h' && blocchi[0].livello === 1
  return (
    <div className="sit" ref={sopra}>
      <div className="s-in md-wrap">
        <article className="md" aria-label={titolo}>
          {!haH1 && <h1>{titolo}</h1>}
          <p className="md-via">{rel.split('/').slice(0, -1).join(' › ')} <button type="button" className="btn m-vai ma-vai" title="Modifica questi appunti" onClick={() => setModifica(true)}>Modifica</button></p>
          {a.mancanti.length > 0 && <p role="status" className="s-avv">Immagini non trovate: {a.mancanti.join(', ')}</p>}
          {blocchi.map((b, k) => <Bl key={k} b={b} a={a} />)}
          {!blocchi.length && <p>Il file è vuoto.</p>}
          {intestaz && <details className="md-fm"><summary>Intestazione del file</summary><pre>{intestaz}</pre></details>}
        </article>
        {indice.length > 1 && (
          <nav className="md-toc" aria-label="Indice">
            <h2>In questa pagina</h2>
            {indice.map((h, k) => (
              <a key={k} href={'#' + h.id} className={h.livello === 3 ? 'sub' : ''} onClick={(e) => { e.preventDefault(); document.getElementById('md-' + h.id)?.scrollIntoView({ block: 'start' }) }}>
                <Testo v={h.v} a={a} />
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
