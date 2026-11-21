/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import YAML from 'yaml'
import { schemaScheda, type Situazioni } from '@shared/situazioni'
import type { SorgenteFile } from '@shared/types'
import { Con, Icona } from '../componenti/Icona'
import { useStore } from '../store'
import { useSit } from './stato'
import { ModificaSpiegazione } from './ModificaSpiegazione'
import { puliziaBlocco } from '@shared/bloccoSpiegazione'

// Modifica di una scheda «Per situazioni»: a moduli (un campo per ogni parte) oppure come testo YAML.
// Si salva solo se la scheda rispetta lo schema. La versione precedente resta in 99_Archivio/Versioni.

type O = Record<string, any>
const ERR = (e: unknown): string => (e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e))
interface Ctx { rel: string; dati: Situazioni }

const ORDINE: Record<string, string[]> = {
  ricetta: ['tipo', 'id', 'titolo', 'sigla', 'comando', 'frase', 'fonte', 'parole', 'quando', 'fasi', 'varianti', 'segnaposto', 'vicine'],
  prima_dopo: ['tipo', 'id', 'titolo', 'sigla', 'comando', 'frase', 'fonte', 'parole', 'prima', 'dopo', 'uso', 'riconoscila', 'parti', 'trappola', 'varianti', 'vicine'],
  spiegazione: ['tipo', 'id', 'titolo', 'sigla', 'comando', 'frase', 'fonte', 'parole', 'quando', 'blocchi', 'varianti', 'vicine'],
  figura: ['tipo', 'id', 'titolo', 'sigla', 'comando', 'frase', 'fonte', 'parole', 'quando', 'disegno', 'varianti', 'vicine']
}

/** Toglie i campi vuoti facoltativi e rimette le chiavi nell'ordine di lettura. */
function pulisci(o: O): O {
  const riga = (r: O): O => {
    const x: O = { codice: r.codice ?? '' }
    if (r.commento) x.commento = r.commento
    const parti = (r.parti ?? []).filter((p: O) => p.voce || p.spiega)
    if (parti.length) x.parti = parti
    if (r.trappola) x.trappola = r.trappola
    return x
  }
  const c: O = { ...o }
  if (c.fasi) c.fasi = c.fasi.map((f: O) => ({ nome: f.nome ?? '', righe: (f.righe ?? []).map(riga) }))
  for (const k of ['varianti', 'vicine', 'parti']) if (Array.isArray(c[k]) && !c[k].length) delete c[k]
  if (Array.isArray(c.varianti)) c.varianti = c.varianti.filter((v: O) => v.codice || v.spiega)
  if (Array.isArray(c.parti)) c.parti = c.parti.filter((p: O) => p.voce || p.spiega)
  if (c.segnaposto && !Object.keys(c.segnaposto).length) delete c.segnaposto
  if (c.tipo === 'spiegazione' && Array.isArray(c.blocchi)) c.blocchi = c.blocchi.map(puliziaBlocco)
  for (const k of ['fonte', 'parole', 'trappola']) if (c[k] === '') delete c[k]
  const ord = ORDINE[c.tipo] ?? []
  const out: O = {}
  for (const k of ord) if (k in c) out[k] = c[k]
  for (const k of Object.keys(c)) if (!(k in out)) out[k] = c[k]
  return out
}
const aYaml = (o: O): string => YAML.stringify(pulisci(o), { lineWidth: 0 })

function problemi(o: unknown, id: string): string[] {
  const r = schemaScheda.safeParse(o)
  if (!r.success) return r.error.issues.map((i) => `${i.path.join(' › ') || '(scheda)'}: ${i.message}`)
  return r.data.id === id ? [] : [`L'id deve restare «${id}» (come il nome del file)`]
}

export function Campo({ nome, aiuto, children, largo }: { nome: string; aiuto?: string; children: ReactNode; largo?: boolean }): ReactNode {
  return (
    <label className={'m-f' + (largo ? ' largo' : '')}>
      <span className="m-l">{nome}</span>
      {children}
      {aiuto && <span className="m-h">{aiuto}</span>}
    </label>
  )
}
export function Testo({ v, on, righe = 2, mono }: { v: string; on: (s: string) => void; righe?: number; mono?: boolean }): ReactNode {
  const n = Math.max(righe, Math.min(14, (v ?? '').split('\n').length))
  return <textarea className={'inp m-t' + (mono ? ' mono' : '')} rows={n} value={v ?? ''} spellCheck={!mono} onChange={(e) => on(e.target.value)} />
}
export function Riga1({ v, on, mono, ph }: { v: string; on: (s: string) => void; mono?: boolean; ph?: string }): ReactNode {
  return <input className={'inp' + (mono ? ' mono' : '')} value={v ?? ''} placeholder={ph} spellCheck={!mono} onChange={(e) => on(e.target.value)} />
}
export function Mini({ nome, onClick, disabled, children }: { nome: string; onClick: () => void; disabled?: boolean; children: ReactNode }): ReactNode {
  return <button type="button" className="m-mini" aria-label={nome} title={nome} disabled={disabled} onClick={onClick}>{children}</button>
}
export function Comandi({ i, n, sposta, togli }: { i: number; n: number; sposta: (d: number) => void; togli: () => void }): ReactNode {
  return (
    <span className="m-cmd">
      <Mini nome="Sposta su" disabled={i === 0} onClick={() => sposta(-1)}><Icona nome="su" size={13} /></Mini>
      <Mini nome="Sposta giù" disabled={i === n - 1} onClick={() => sposta(1)}><Icona nome="giu" size={13} /></Mini>
      <Mini nome="Togli" onClick={togli}><Icona nome="cestino" size={13} /></Mini>
    </span>
  )
}
export const muovi = (a: any[], i: number, d: number): void => {
  const j = i + d
  if (j < 0 || j >= a.length) return
  ;[a[i], a[j]] = [a[j], a[i]]
}

export function ModificaScheda({ ctx, id, esci }: { ctx: Ctx; id: string; esci: () => void }): ReactNode {
  const relFile = `${ctx.rel}/schede/${id}.yaml`
  const [src, setSrc] = useState<SorgenteFile | null>(null)
  const [o, setO] = useState<O | null>(null)
  const [tab, setTab] = useState<'moduli' | 'yaml'>('moduli')
  const [testo, setTesto] = useState('')
  const [errLettura, setErrLettura] = useState<string | null>(null)
  const [sporco, setSporco] = useState(false)
  const [conflitto, setConflitto] = useState(false)
  const [scarta, setScarta] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [errSalva, setErrSalva] = useState<string[]>([])
  const [cercaV, setCercaV] = useState('')
  const [chiediArchivia, setChiediArchivia] = useState(false)

  const carica = (): void => {
    window.api.leggiSorgente(relFile).then(
      (s) => {
        try {
          const d = YAML.parse(s.testo) as O
          setSrc(s); setO(d); setTesto(s.testo); setSporco(false); setConflitto(false); setErrLettura(null)
        } catch (e) {
          setErrLettura(`Il file non si legge come YAML: ${(e as Error).message}`)
          setSrc(s); setTesto(s.testo); setTab('yaml')
        }
      },
      (e: unknown) => setErrLettura(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e))
    )
  }
  useEffect(carica, [relFile]) // eslint-disable-line react-hooks/exhaustive-deps

  const daYaml = useMemo((): { o?: O; err?: string } => {
    if (tab !== 'yaml') return {}
    try { return { o: YAML.parse(testo) as O } } catch (e) { return { err: (e as Error).message } }
  }, [tab, testo])

  const attuale: unknown = tab === 'yaml' ? daYaml.o : o
  const err = useMemo(() => (daYaml.err ? [`YAML non valido: ${daYaml.err}`] : attuale ? problemi(pulisci(attuale as O), id) : ['Nessun contenuto']), [attuale, daYaml.err, id])
  const buono = err.length === 0

  const mut = (fn: (c: O) => void): void => {
    if (!o) return
    const c = structuredClone(o)
    fn(c)
    setO(c); setSporco(true); setErrSalva([])
  }
  const imp = (k: string) => (v: string): void => mut((c) => { c[k] = v })

  const cambiaTab = (t: 'moduli' | 'yaml'): void => {
    if (t === tab) return
    if (t === 'yaml') { if (o) setTesto(aYaml(o)) }
    else if (daYaml.o && !daYaml.err) { setO(daYaml.o) } else return
    setTab(t)
  }

  const salva = async (forza = false): Promise<void> => {
    if (!src || !buono) return
    const out = tab === 'yaml' ? testo : aYaml(o!)
    setSalvando(true)
    try {
      const r = await window.api.salvaSorgente(relFile, out.endsWith('\n') ? out : out + '\n', src.mtime, forza)
      if (r.ok) {
        await useSit.getState().carica(ctx.rel)
        useStore.getState().mostraToast('Scheda salvata. La versione precedente è in 99_Archivio/Versioni.')
        esci()
      } else if ('conflitto' in r) setConflitto(true)
      else setErrSalva(r.errori)
    } catch (e) {
      setErrSalva([e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e)])
    } finally {
      setSalvando(false)
    }
  }

  const archivia = async (): Promise<void> => {
    try {
      const ix = await window.api.leggiSorgente(`${ctx.rel}/indice.yaml`)
      const d = YAML.parse(ix.testo) as O
      for (const r of d.rami ?? []) {
        r.voci = (r.voci ?? []).map((v: O) => ({ ...v, schede: (v.schede ?? []).filter((x: string) => x !== id) })).filter((v: O) => v.schede.length)
        if (!r.voci.length) throw new Error(`«${ctx.dati.schede[id]?.titolo ?? id}» è l'unica scheda del ramo «${r.nome}»: togli prima il ramo o aggiungi un'altra scheda dalla «Modifica mappa».`)
      }
      const esito = await window.api.salvaSorgente(`${ctx.rel}/indice.yaml`, YAML.stringify(d, { lineWidth: 0 }), ix.mtime, false)
      if (!esito.ok) throw new Error('conflitto' in esito ? 'La mappa è cambiata sul disco: riprova.' : esito.errori.join(' '))
      const dove = await window.api.archiviaFile(relFile)
      const citata = Object.values(ctx.dati.schede).filter((s) => s.id !== id && (s.vicine ?? []).includes(id)).map((s) => s.sigla)
      await useSit.getState().carica(ctx.rel)
      useSit.getState().imposta(ctx.rel, { scheda: null, modifica: false })
      useStore.getState().mostraToast(`Scheda archiviata in ${dove}.` + (citata.length ? ` Era citata da: ${citata.join(', ')} (da togliere dalle «vicine»).` : ''))
    } catch (e) {
      setChiediArchivia(false)
      setErrSalva([ERR(e)])
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void salva() }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })

  if (errLettura && !src) return <p role="alert" className="s-avv">{errLettura}</p>
  if (!src) return <p>Apro la scheda…</p>

  const tipo = (o?.tipo ?? daYaml.o?.tipo) as string | undefined
  const moduli = tipo === 'ricetta' || tipo === 'prima_dopo' || tipo === 'spiegazione'
  const usati = new Set<string>()
  if (o?.fasi) for (const f of o.fasi) for (const r of f.righe ?? []) for (const m of String(r.codice ?? '').matchAll(/«([A-Z0-9_]+)»/g)) usati.add(m[1]!)
  const mancanti = [...usati].filter((u) => !o?.segnaposto?.[u])
  const altre = Object.values(ctx.dati.schede).filter((s) => s.id !== id)
  const trovate = cercaV.trim() ? altre.filter((s) => (s.titolo + ' ' + s.sigla + ' ' + s.comando).toLowerCase().includes(cercaV.trim().toLowerCase())).slice(0, 8) : []

  const elenco = (chiave: 'varianti' | 'parti', a: string, b: string, nomeA: string, nomeB: string, mono: boolean): ReactNode => (
    <div className="m-lista">
      {(o?.[chiave] ?? []).map((x: O, i: number, arr: O[]) => (
        <div key={i} className="m-coppia">
          <div className="m-coppia-c">
            {mono ? <Testo v={x[a]} on={(v) => mut((c) => { c[chiave][i][a] = v })} righe={1} mono /> : <Riga1 v={x[a]} on={(v) => mut((c) => { c[chiave][i][a] = v })} ph={nomeA} mono />}
            <Riga1 v={x[b]} on={(v) => mut((c) => { c[chiave][i][b] = v })} ph={nomeB} />
          </div>
          <Comandi i={i} n={arr.length} sposta={(d) => mut((c) => muovi(c[chiave], i, d))} togli={() => mut((c) => c[chiave].splice(i, 1))} />
        </div>
      ))}
      <button type="button" className="btn" onClick={() => mut((c) => { (c[chiave] ??= []).push({ [a]: '', [b]: '' }) })}><Con i="piu">{chiave === 'varianti' ? 'Variante' : 'Parte'}</Con></button>
    </div>
  )

  const vicine = (
    <section className="m-sez">
      <h2>Situazioni vicine</h2>
      <div className="s-rels">
        {(o?.vicine ?? []).map((v: string) => (
          <span key={v} className="m-chip" title={ctx.dati.schede[v]?.titolo ?? 'Questa scheda non esiste'}>
            {ctx.dati.schede[v]?.sigla ?? v}
            <button type="button" aria-label={`Togli ${v}`} onClick={() => mut((c) => { c.vicine = c.vicine.filter((x: string) => x !== v) })}><Icona nome="chiudi" size={11} /></button>
          </span>
        ))}
      </div>
      <input className="inp" placeholder="Cerca una scheda da collegare…" value={cercaV} onChange={(e) => setCercaV(e.target.value)} aria-label="Cerca una scheda da collegare" />
      {trovate.length > 0 && (
        <div className="m-trov">
          {trovate.map((s) => (
            <button key={s.id} type="button" disabled={(o?.vicine ?? []).includes(s.id)} onClick={() => { mut((c) => { (c.vicine ??= []).push(s.id) }); setCercaV('') }}>
              <b>{s.sigla}</b> <span>{s.comando}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="m-wrap">
      <div className="s-bar">
        <button type="button" className="btn" onClick={() => (sporco && !scarta ? setScarta(true) : esci())}>← Annulla</button>
        <span className="s-lvl">Modifica · {ctx.dati.schede[id]?.titolo ?? id}</span>
        <div className="m-tabs" role="tablist" aria-label="Come modificare">
          <button type="button" role="tab" aria-selected={tab === 'moduli'} disabled={!moduli} onClick={() => cambiaTab('moduli')}>Moduli</button>
          <button type="button" role="tab" aria-selected={tab === 'yaml'} onClick={() => cambiaTab('yaml')}>Testo (YAML)</button>
        </div>
        <button type="button" className="btn" title="Toglie la scheda dalla mappa e la mette in 99_Archivio" onClick={() => setChiediArchivia(true)}>Archivia</button>
        <button type="button" className="btn on" disabled={!buono || salvando || (!sporco && tab === 'moduli')} title="Salva (Ctrl+S)" onClick={() => void salva()}>{salvando ? 'Salvo…' : 'Salva'}</button>
      </div>

      {chiediArchivia && (
        <div role="alert" className="s-avv m-banner">
          Archiviare questa scheda? Sparisce dalla mappa e il file va in 99_Archivio/Archiviati (non viene cancellato).
          <button type="button" className="btn" onClick={() => void archivia()}>Sì, archivia</button>
          <button type="button" className="btn" onClick={() => setChiediArchivia(false)}>No</button>
        </div>
      )}
      {scarta && (
        <div role="alert" className="s-avv m-banner">
          Ci sono modifiche non salvate.
          <button type="button" className="btn" onClick={esci}>Scarta e esci</button>
          <button type="button" className="btn" onClick={() => setScarta(false)}>Continua a modificare</button>
        </div>
      )}
      {conflitto && (
        <div role="alert" className="s-avv m-banner">
          Il file è cambiato sul disco da quando lo hai aperto (la sessione di studio o un altro programma).
          <button type="button" className="btn" onClick={() => void salva(true)}>Sovrascrivi con la mia versione</button>
          <button type="button" className="btn" onClick={carica}>Ricarica dal disco (perdo le mie modifiche)</button>
        </div>
      )}
      {errSalva.length > 0 && <div role="alert" className="s-avv">{errSalva.join(' · ')}</div>}
      {errLettura && <div role="alert" className="s-avv">{errLettura}</div>}

      <div className={'m-stato ' + (buono ? 'ok' : 'no')} role="status">
        {buono ? 'La scheda è a posto: si può salvare.' : <>Da sistemare prima di salvare: <ul>{err.slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}</ul></>}
      </div>

      {tab === 'yaml' || !moduli || !o ? (
        <>
          {!moduli && tipo === 'figura' && <p className="m-nota">Le figure (disegno della scheda con i pin) si modificano come testo: i moduli arriveranno dopo.</p>}
          {!moduli && tipo === 'regola' && <p className="m-nota">Le regole di matematica si modificano come testo YAML: formule in notazione testuale, per esempio (f*g)&apos; = f&apos;*g + f*g&apos;.</p>}
          <textarea className="inp m-yaml mono" aria-label="Testo YAML della scheda" spellCheck={false} value={testo} onChange={(e) => { setTesto(e.target.value); setSporco(true); setErrSalva([]) }} />
        </>
      ) : (
        <div className="m-form">
          <section className="m-sez">
            <h2>Intestazione</h2>
            <div className="m-griglia">
              <Campo nome="Titolo" aiuto="La situazione, in parole tue"><Riga1 v={o.titolo} on={imp('titolo')} /></Campo>
              <Campo nome="Sigla" aiuto="Etichetta breve sul nodo della mappa"><Riga1 v={o.sigla} on={imp('sigla')} /></Campo>
              <Campo nome="Comando" aiuto="Il comando o la funzione principale"><Riga1 v={o.comando} on={imp('comando')} mono /></Campo>
              <Campo nome="Frase" aiuto="Una riga che riassume (si vede con il fuoco sul ramo)"><Riga1 v={o.frase} on={imp('frase')} /></Campo>
              <Campo nome="Fonte" aiuto="Da dove viene (slide, PDF, pagina)"><Riga1 v={o.fonte} on={imp('fonte')} /></Campo>
              <Campo nome="Parole di ricerca" aiuto="Parole che devono far trovare la scheda"><Riga1 v={o.parole} on={imp('parole')} /></Campo>
            </div>
            {(tipo === 'ricetta' || tipo === 'spiegazione') && <Campo nome="Quando serve" largo><Testo v={o.quando} on={imp('quando')} /></Campo>}
            {tipo === 'prima_dopo' && (
              <>
                <div className="m-griglia">
                  <Campo nome="Prima" aiuto="Come si presenta prima"><Testo v={o.prima} on={imp('prima')} righe={3} mono /></Campo>
                  <Campo nome="Dopo" aiuto="Come si presenta dopo"><Testo v={o.dopo} on={imp('dopo')} righe={3} mono /></Campo>
                </div>
                <Campo nome="A cosa serve" largo><Testo v={o.uso} on={imp('uso')} /></Campo>
                <Campo nome="Come riconoscerla" largo><Testo v={o.riconoscila} on={imp('riconoscila')} /></Campo>
                <Campo nome="Trappola" aiuto="L'errore tipico (facoltativo)" largo><Riga1 v={o.trappola} on={imp('trappola')} /></Campo>
              </>
            )}
          </section>

          {tipo === 'prima_dopo' && (
            <section className="m-sez">
              <h2>Le parti, una per una</h2>
              {elenco('parti', 'voce', 'spiega', 'Voce', 'Cosa significa', true)}
            </section>
          )}

          {tipo === 'spiegazione' && (
            <ModificaSpiegazione blocchi={o.blocchi ?? []} cambia={(fn) => mut((c) => { c.blocchi = fn(c.blocchi ?? []) })} />
          )}

          {tipo === 'ricetta' && (
            <section className="m-sez">
              <h2>Fasi e righe di codice</h2>
              {(o.fasi ?? []).map((f: O, fi: number, fasi: O[]) => (
                <div key={fi} className="m-card">
                  <div className="m-card-t">
                    <span className="m-n">{fi + 1}</span>
                    <input className="inp" aria-label={`Nome della fase ${fi + 1}`} placeholder="Nome della fase" value={f.nome ?? ''} onChange={(e) => mut((c) => { c.fasi[fi].nome = e.target.value })} />
                    <Comandi i={fi} n={fasi.length} sposta={(d) => mut((c) => muovi(c.fasi, fi, d))} togli={() => mut((c) => c.fasi.splice(fi, 1))} />
                  </div>
                  {(f.righe ?? []).map((r: O, ri: number, righe: O[]) => (
                    <div key={ri} className="m-riga">
                      <div className="m-riga-c">
                        <Campo nome={`Riga ${ri + 1}`} aiuto="Usa «NOME» dove il valore cambia da caso a caso"><Testo v={r.codice} on={(v) => mut((c) => { c.fasi[fi].righe[ri].codice = v })} righe={1} mono /></Campo>
                        <div className="m-griglia">
                          <Campo nome="Commento"><Riga1 v={r.commento} on={(v) => mut((c) => { c.fasi[fi].righe[ri].commento = v })} /></Campo>
                          <Campo nome="Trappola" aiuto="Errore tipico su questa riga"><Riga1 v={r.trappola} on={(v) => mut((c) => { c.fasi[fi].righe[ri].trappola = v })} /></Campo>
                        </div>
                        <details className="m-parti" open={(r.parti ?? []).length > 0}>
                          <summary>Spiegazione delle parti ({(r.parti ?? []).length})</summary>
                          {(r.parti ?? []).map((p: O, pi: number, pp: O[]) => (
                            <div key={pi} className="m-coppia">
                              <div className="m-coppia-c">
                                <Riga1 v={p.voce} ph="Pezzo di codice" mono on={(v) => mut((c) => { c.fasi[fi].righe[ri].parti[pi].voce = v })} />
                                <Riga1 v={p.spiega} ph="Cosa significa" on={(v) => mut((c) => { c.fasi[fi].righe[ri].parti[pi].spiega = v })} />
                              </div>
                              <Comandi i={pi} n={pp.length} sposta={(d) => mut((c) => muovi(c.fasi[fi].righe[ri].parti, pi, d))} togli={() => mut((c) => c.fasi[fi].righe[ri].parti.splice(pi, 1))} />
                            </div>
                          ))}
                          <button type="button" className="btn" onClick={() => mut((c) => { (c.fasi[fi].righe[ri].parti ??= []).push({ voce: '', spiega: '' }) })}><Con i="piu">Parte</Con></button>
                        </details>
                      </div>
                      <Comandi i={ri} n={righe.length} sposta={(d) => mut((c) => muovi(c.fasi[fi].righe, ri, d))} togli={() => mut((c) => { if (c.fasi[fi].righe.length > 1) c.fasi[fi].righe.splice(ri, 1) })} />
                    </div>
                  ))}
                  <button type="button" className="btn" onClick={() => mut((c) => { c.fasi[fi].righe.push({ codice: '' }) })}><Con i="piu">Riga di codice</Con></button>
                </div>
              ))}
              <button type="button" className="btn on" onClick={() => mut((c) => { (c.fasi ??= []).push({ nome: '', righe: [{ codice: '' }] }) })}><Con i="piu">Fase</Con></button>
            </section>
          )}

          {tipo === 'ricetta' && (
            <section className="m-sez">
              <h2>Segnaposto</h2>
              <p className="m-nota">I «NOME» del codice che cambiano da caso a caso: qui dici cosa sono e un valore d'esempio.</p>
              {Object.entries((o.segnaposto ?? {}) as Record<string, O>).map(([nome, s]) => (
                <div key={nome} className="m-coppia">
                  <div className="m-coppia-c tre">
                    <code className="m-ph">«{nome}»{!usati.has(nome) && <em title="Non è usato nel codice"> · non usato</em>}</code>
                    <Riga1 v={s.esempio} ph="Valore d'esempio" mono on={(v) => mut((c) => { c.segnaposto[nome].esempio = v })} />
                    <Riga1 v={s.spiega} ph="Cos'è" on={(v) => mut((c) => { c.segnaposto[nome].spiega = v })} />
                  </div>
                  <Mini nome={`Togli ${nome}`} onClick={() => mut((c) => { delete c.segnaposto[nome] })}><Icona nome="cestino" size={13} /></Mini>
                </div>
              ))}
              {mancanti.length > 0 && (
                <div className="s-avv">
                  Nel codice ci sono segnaposto non spiegati: {mancanti.map((m) => `«${m}»`).join(', ')}.{' '}
                  <button type="button" className="btn" onClick={() => mut((c) => { c.segnaposto ??= {}; for (const m of mancanti) c.segnaposto[m] = { esempio: '', spiega: '' } })}><Con i="piu">Aggiungili</Con></button>
                </div>
              )}
            </section>
          )}

          {tipo !== 'spiegazione' && <section className="m-sez">
            <h2>Varianti</h2>
            <p className="m-nota">Altri modi di ottenere la stessa cosa (facoltativo).</p>
            {elenco('varianti', 'codice', 'spiega', 'Codice', 'Quando si usa', true)}
          </section>}
          {vicine}
        </div>
      )}
    </div>
  )
}
