import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { NodoArg } from '@shared/types'
import { Con, Icona } from '../componenti/Icona'
import { Modale, primario, secondario } from '../editor/ui'
import { ICONA_NODO } from './Albero'
import { destinazioni, iniziale, ordina, type Contesto, type IdModello, type Modello } from './modelli'

const pulisci = (m: string): string => m.replace(/^Error invoking remote method '[^']*': (Error: )?/, '')

/**
 * Il pulsante «+ Nuovo»: una sola finestra. A sinistra i modelli (prima i consigliati per la materia in cui sei),
 * a destra quello scelto: a cosa serve, cosa crea, il nome e la cartella dove nasce. Nessun modello è mai spento.
 */
export function Galleria({ contesto, albero, crea, chiudi }: { contesto: Contesto; albero: NodoArg[]; crea: (id: IdModello, padre: string, nome: string) => Promise<void>; chiudi: () => void }): ReactNode {
  const [q, setQ] = useState('')
  const [scelto, setScelto] = useState<IdModello>(() => ordina(contesto, '').consigliati[0]?.id ?? 'appunti')
  const [nome, setNome] = useState('')
  const [dove, setDove] = useState<Partial<Record<IdModello, string>>>({})
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLDivElement>(null)

  const { consigliati, altri, struttura } = ordina(contesto, q)
  const visibili = [...consigliati, ...altri, ...struttura]
  const m: Modello | null = visibili.find((x) => x.id === scelto) ?? visibili[0] ?? null
  const materia = contesto.rel ? contesto.rel.split('/')[0]! : ''

  const voci = useMemo(() => (m ? destinazioni(m, albero) : []), [m, albero])
  const buone = voci.filter((v) => v.ok)
  const proposta = m ? iniziale(contesto, voci) : ''
  const scelta = m ? dove[m.id] : undefined
  const padre = scelta !== undefined && buone.some((v) => v.n.rel === scelta) ? scelta : proposta

  useEffect(() => { nomeRef.current?.focus() }, [])
  // la cartella scelta (di solito quella in cui sei) deve vedersi anche in un albero lungo
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.gal-dest .gal-d.on')
    const box = el?.parentElement
    if (el && box) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
  }, [m?.id, padre])
  useEffect(() => {
    const f = (e: globalThis.KeyboardEvent): void => { if (e.key === 'Escape') chiudi() }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [chiudi])

  const prendi = (id: IdModello): void => {
    setScelto(id)
    setErr(null)
    requestAnimationFrame(() => nomeRef.current?.focus())
  }

  const frecce = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = visibili.findIndex((x) => x.id === m?.id)
    const n = visibili[Math.min(visibili.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]
    if (!n) return
    setScelto(n.id)
    setErr(null)
    requestAnimationFrame(() => lista.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
  }

  const invia = async (): Promise<void> => {
    if (!m || busy) return
    if (m.dove !== 'radice' && !padre) { setErr('Scegli la cartella dove crearlo.'); return }
    if (m.conNome && !nome.trim()) { setErr('Scrivi un nome.'); nomeRef.current?.focus(); return }
    setBusy(true)
    setErr(null)
    try {
      await crea(m.id, m.dove === 'radice' ? '' : padre, nome)
      chiudi()
    } catch (e) {
      setErr(pulisci((e as Error).message))
      setBusy(false)
    }
  }

  const riga = (x: Modello): ReactNode => (
    <button key={x.id} type="button" role="option" aria-selected={x.id === m?.id} className={'gal-m' + (x.id === m?.id ? ' on' : '')} onClick={() => prendi(x.id)}>
      <span className={'hm-ico hm-t-' + x.tipo} style={{ width: 36, height: 36 }}><Icona nome={x.icona} size={18} /></span>
      <span className="gal-mt">
        <strong>{x.nome}</strong>
        <span>{x.breve}</span>
      </span>
    </button>
  )

  const gruppo = (titolo: string, l: Modello[]): ReactNode => l.length > 0 && (
    <section>
      <h3>{titolo}</h3>
      {l.map(riga)}
    </section>
  )

  const doveVa = m && m.dove !== 'radice' ? (padre ? padre.split('/').join(' › ') : '') : 'cima all\'albero'
  const tipoFinale = m?.id === 'appunti' ? '.md' : ''

  return (
    <Modale
      titolo="Nuovo"
      larghezza={900}
      scorri={false}
      chiudi={chiudi}
      intestazione={
        <>
          <Icona nome="piu" size={18} />
          <strong style={{ fontSize: 15 }}>Nuovo</strong>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={chiudi} aria-label="Chiudi"><Icona nome="chiudi" size={14} /></button>
        </>
      }
      piede={
        <>
          <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{m && m.dove !== 'radice' && padre ? <>Nasce in <strong>{doveVa}</strong></> : null}</span>
          <div style={{ flex: 1 }} />
          <button type="button" style={secondario} onClick={chiudi}>Annulla</button>
          <button type="button" style={primario} disabled={busy || !m} onClick={() => void invia()}><Con i="spunta">{m && !m.conNome ? 'Continua' : 'Crea'}</Con></button>
        </>
      }
    >
      <div className="gal2">
        <div className="gal-sx">
          <input className="inp big" type="search" placeholder="Cerca un modello…" aria-label="Cerca un modello" value={q} onChange={(e) => setQ(e.target.value)} />
          <div ref={lista} role="listbox" aria-label="Modelli" onKeyDown={frecce} className="gal-lista">
            {gruppo(`Consigliati per ${materia}`, consigliati)}
            {gruppo(consigliati.length ? 'Per tutte le materie' : 'Documenti', altri)}
            {gruppo('Struttura', struttura)}
            {!visibili.length && <p className="m-nota">Nessun modello corrisponde a «{q}».</p>}
          </div>
          <p className="m-nota" style={{ margin: 0 }}>Un modello nuovo si aggiunge quando lo progettiamo insieme.</p>
        </div>

        <div className="gal-dx">
          {m ? (
            <>
              <div className="gal-top">
                <span className={'hm-ico hm-t-' + m.tipo} style={{ width: 52, height: 52 }}><Icona nome={m.icona} size={26} /></span>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 19 }}>{m.nome}</h2>
                  <p style={{ margin: '3px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--mute)' }}>{m.descrizione}</p>
                </div>
              </div>

              <div className="gal-crea">
                <span style={{ flex: 'none', display: 'inline-flex', marginTop: 1 }}><Icona nome={ICONA_NODO[m.tipo]} size={15} /></span>
                <span><strong style={{ color: 'var(--ink)' }}>Cosa crea:</strong> {m.crea}</span>
              </div>

              {m.conNome && (
                <div className="gal-campo">
                  <label className="gal-lbl" htmlFor="gal-nome">{m.etichettaNome}</label>
                  <input
                    id="gal-nome"
                    ref={nomeRef}
                    className="inp big"
                    value={nome}
                    placeholder={`per esempio: ${m.esempioNome}`}
                    aria-invalid={!!err}
                    onChange={(e) => { setNome(e.target.value); setErr(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void invia() }}
                  />
                  {nome.trim() && (m.dove === 'radice' || padre) && <p className="gal-path" aria-live="polite">{m.dove === 'radice' ? '' : doveVa + ' › '}{nome.trim()}{tipoFinale}</p>}
                </div>
              )}
              {err && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--err-ink)', background: 'var(--err-bg)', border: '1px solid var(--err-line)', borderRadius: 8, padding: '7px 10px' }}>{err}</p>}

              {m.dove !== 'radice' && (
                <div className="gal-campo">
                  <span className="gal-lbl" id="gal-dove">{m.dove === 'autore' ? 'Per quale autore' : 'In quale cartella'}</span>
                  {buone.length ? (
                    <div className="gal-dest" role="listbox" aria-labelledby="gal-dove">
                      {voci.map((v) =>
                        v.ok ? (
                          <button key={v.n.rel} type="button" role="option" aria-selected={v.n.rel === padre} className={'gal-d' + (v.n.rel === padre ? ' on' : '')} style={{ paddingLeft: 10 + v.livello * 18 }} onClick={() => { setDove({ ...dove, [m.id]: v.n.rel }); setErr(null) }}>
                            <Icona nome={ICONA_NODO[v.n.tipo]} size={15} />
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.n.nome}</span>
                            {v.n.rel === padre && <Icona nome="spunta" size={14} />}
                          </button>
                        ) : (
                          <div key={v.n.rel} className="gal-d via" style={{ paddingLeft: 10 + v.livello * 18 }}>
                            <Icona nome={ICONA_NODO[v.n.tipo]} size={15} />
                            <span>{v.n.nome}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="m-nota" style={{ margin: 0 }}>{m.dove === 'autore' ? 'Non c\'è ancora nessun autore di italiano.' : 'Non c\'è ancora nessuna materia: creane una dalla Struttura.'}</p>
                  )}
                </div>
              )}

            </>
          ) : (
            <p className="m-nota">Scegli un modello dalla lista.</p>
          )}
        </div>
      </div>
    </Modale>
  )
}

