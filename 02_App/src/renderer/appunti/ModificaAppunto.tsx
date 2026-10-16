import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Appunto, SorgenteFile } from '@shared/types'
import { parseMd } from '@shared/markdown'
import { applica, type AzioneMd } from '@shared/mdedit'
import { useStore } from '../store'
import { Bl } from './VistaAppunto'

// Modifica degli appunti (.md): testo con barra di formattazione e anteprima accanto.
// Si salva con la copia di sicurezza (99_Archivio/Versioni) e il controllo «il file è cambiato sul disco».

const ERR = (e: unknown): string => (e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e))

const BARRA: { a: AzioneMd; t: ReactNode; nome: string; tasti?: string }[] = [
  { a: 'h1', t: 'T1', nome: 'Titolo grande' },
  { a: 'h2', t: 'T2', nome: 'Titolo' },
  { a: 'h3', t: 'T3', nome: 'Sottotitolo' },
  { a: 'grassetto', t: <b>G</b>, nome: 'Grassetto', tasti: 'Ctrl+B' },
  { a: 'corsivo', t: <i>C</i>, nome: 'Corsivo', tasti: 'Ctrl+I' },
  { a: 'codice', t: '</>', nome: 'Codice nel testo' },
  { a: 'blocco', t: '{ }', nome: 'Blocco di codice' },
  { a: 'elenco', t: '• —', nome: 'Elenco puntato' },
  { a: 'numerato', t: '1.', nome: 'Elenco numerato' },
  { a: 'citazione', t: '❝', nome: 'Citazione' },
  { a: 'link', t: '🔗', nome: 'Collegamento', tasti: 'Ctrl+K' },
  { a: 'tabella', t: '▦', nome: 'Tabella' },
  { a: 'riga', t: '―', nome: 'Linea di separazione' }
]

export function ModificaAppunto({ a, esci }: { a: Appunto; esci: (salvato: boolean) => void }): ReactNode {
  const [src, setSrc] = useState<SorgenteFile | null>(null)
  const [testo, setTesto] = useState('')
  const [orig, setOrig] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [conflitto, setConflitto] = useState(false)
  const [scarta, setScarta] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [errSalva, setErrSalva] = useState<string[]>([])
  const [anteprima, setAnteprima] = useState(true)
  const ta = useRef<HTMLTextAreaElement>(null)
  const sporco = testo !== orig

  useEffect(() => {
    window.api.leggiSorgente(a.rel).then((s) => { setSrc(s); setTesto(s.testo); setOrig(s.testo) }, (e: unknown) => setErr(ERR(e)))
  }, [a.rel])

  const diff = useDeferredValue(testo)
  const blocchi = useMemo(() => parseMd(diff), [diff])

  const formatta = (az: AzioneMd): void => {
    const el = ta.current
    if (!el) return
    const r = applica({ testo: el.value, a: el.selectionStart, b: el.selectionEnd }, az)
    setTesto(r.testo)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.a, r.b) })
  }

  const salva = async (forza = false): Promise<void> => {
    if (!src || salvando) return
    setSalvando(true)
    try {
      const r = await window.api.salvaSorgente(a.rel, testo, src.mtime, forza)
      if (r.ok) {
        useStore.getState().mostraToast('Appunti salvati. La versione precedente è in 99_Archivio/Versioni.')
        esci(true)
      } else if ('conflitto' in r) setConflitto(true)
      else setErrSalva(r.errori)
    } catch (e) { setErrSalva([ERR(e)]) } finally { setSalvando(false) }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 's') { e.preventDefault(); void salva() }
      else if (document.activeElement === ta.current && (k === 'b' || k === 'i' || k === 'k')) {
        e.preventDefault()
        formatta(k === 'b' ? 'grassetto' : k === 'i' ? 'corsivo' : 'link')
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })

  // Tab = rientro nel testo (non salta fuori dal campo)
  const tasto = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return
    e.preventDefault()
    const el = e.currentTarget
    const i = el.selectionStart
    const nuovo = el.value.slice(0, i) + '  ' + el.value.slice(el.selectionEnd)
    setTesto(nuovo)
    requestAnimationFrame(() => el.setSelectionRange(i + 2, i + 2))
  }

  if (err) return <div className="sit"><div className="s-in"><p role="alert" className="s-avv">{err}</p></div></div>
  if (!src) return <div className="sit"><div className="s-in"><p>Apro gli appunti…</p></div></div>
  const nome = a.rel.split('/').pop()!

  return (
    <div className="sit">
      <div className="s-in ma-wrap">
        <div className="s-bar">
          <button type="button" className="btn" onClick={() => (sporco && !scarta ? setScarta(true) : esci(false))}>← Annulla</button>
          <span className="s-lvl">Modifica · {nome}{sporco ? ' · non salvato' : ''}</span>
          <button type="button" className="btn" aria-pressed={anteprima} onClick={() => setAnteprima((x) => !x)}>{anteprima ? 'Nascondi anteprima' : 'Mostra anteprima'}</button>
          <button type="button" className="btn on" disabled={!sporco || salvando} title="Salva (Ctrl+S)" onClick={() => void salva()}>{salvando ? 'Salvo…' : 'Salva'}</button>
        </div>
        {scarta && (
          <div role="alert" className="s-avv m-banner">
            Ci sono modifiche non salvate.
            <button type="button" className="btn" onClick={() => esci(false)}>Scarta e esci</button>
            <button type="button" className="btn" onClick={() => setScarta(false)}>Continua a modificare</button>
          </div>
        )}
        {conflitto && (
          <div role="alert" className="s-avv m-banner">
            Il file è cambiato sul disco mentre lo modificavi (forse la sessione di studio).
            <button type="button" className="btn" onClick={() => void salva(true)}>Sovrascrivi con la mia versione</button>
            <button type="button" className="btn" onClick={() => esci(false)}>Esci e rileggi quello sul disco</button>
          </div>
        )}
        {errSalva.length > 0 && <div role="alert" className="s-avv m-banner"><ul>{errSalva.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
        <div className="ma-barra" role="toolbar" aria-label="Formattazione">
          {BARRA.map((x) => (
            <button key={x.a} type="button" className="ma-b" title={x.nome + (x.tasti ? ` (${x.tasti})` : '')} aria-label={x.nome} onMouseDown={(e) => e.preventDefault()} onClick={() => formatta(x.a)}>{x.t}</button>
          ))}
        </div>
        <div className={'ma-due' + (anteprima ? '' : ' solo')}>
          <textarea ref={ta} className="inp mono ma-ta" aria-label="Testo degli appunti" spellCheck value={testo} onChange={(e) => setTesto(e.target.value)} onKeyDown={tasto} />
          {anteprima && (
            <article className="md ma-prev" aria-label="Anteprima">
              {blocchi.map((b, k) => <Bl key={k} b={b} a={{ ...a, testo: diff }} />)}
              {!blocchi.length && <p className="m-nota">L'anteprima compare qui.</p>}
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
