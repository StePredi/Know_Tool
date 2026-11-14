/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import YAML from 'yaml'
import { COLORI_RAMO, controllaSituazioni, schemaIndice, type Situazioni } from '@shared/situazioni'
import type { SorgenteFile } from '@shared/types'
import { Con } from '../componenti/Icona'
import { useStore } from '../store'
import { useSit } from './stato'
import { Campo, Comandi, Riga1, muovi } from './ModificaScheda'
import { idLibero, modelloScheda, type TipoNuova } from '@shared/modelloScheda'

// Modifica della mappa («indice.yaml»): titolo, rami, gruppi, ordine e schede di ogni ramo.
// Si salva solo se l'indice è valido. La versione precedente resta in 99_Archivio/Versioni.

type O = Record<string, any>
const ORD_IDX = ['modello', 'titolo', 'sottotitolo', 'centro', 'prefissoCommento', 'esempiRicerca', 'rami']
const ORD_RAMO = ['id', 'nome', 'colore', 'lato', 'voci']

/** Toglie voci e gruppi rimasti vuoti e rimette le chiavi in ordine di lettura. */
function pulisci(o: O): O {
  const c: O = { ...o }
  c.rami = (c.rami ?? []).map((r: O) => {
    const voci = (r.voci ?? [])
      .map((v: O) => {
        const x: O = {}
        if (v.gruppo) x.gruppo = v.gruppo
        x.schede = v.schede ?? []
        return x
      })
      .filter((v: O) => v.schede.length)
    const out: O = {}
    for (const k of ORD_RAMO) if (k === 'voci' ? true : k in r) out[k] = k === 'voci' ? voci : r[k]
    for (const k of Object.keys(r)) if (!(k in out)) out[k] = r[k]
    return out
  })
  for (const k of ['sottotitolo', 'esempiRicerca']) if (c[k] === '') delete c[k]
  const out: O = {}
  for (const k of ORD_IDX) if (k in c) out[k] = c[k]
  for (const k of Object.keys(c)) if (!(k in out)) out[k] = c[k]
  return out
}
const aYaml = (o: O): string => YAML.stringify(pulisci(o), { lineWidth: 0 })

function problemi(o: unknown, schede: Situazioni['schede']): string[] {
  const vuoti = ((o as O)?.rami ?? []).filter((r: O) => !(r.voci ?? []).some((v: O) => (v.schede ?? []).length)).map((r: O) => `Il ramo «${r.nome || r.id}» non ha nessuna scheda: aggiungine una (o spostala da un altro ramo) oppure toglilo`)
  if (vuoti.length) return vuoti
  const r = schemaIndice.safeParse(o)
  if (!r.success) return r.error.issues.map((i) => `${i.path.join(' › ') || '(mappa)'}: ${i.message}`)
  const ids = r.data.rami.map((x) => x.id)
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i)
  const e: string[] = dup.length ? [`Id di ramo ripetuto: ${[...new Set(dup)].join(', ')}`] : []
  const mancano = new Set<string>()
  for (const ra of r.data.rami) for (const v of ra.voci) for (const s of v.schede) if (!schede[s]) mancano.add(s)
  if (mancano.size) e.push(`Schede che non esistono: ${[...mancano].join(', ')}`)
  return e.concat(controllaSituazioni(r.data, schede).filter((x) => /rami|ripet/i.test(x)))
}

const slug = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ramo'
const ERR = (e: unknown): string => (e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '') : String(e))

export function ModificaMappa({ ctx, esci }: { ctx: { rel: string; dati: Situazioni }; esci: () => void }): ReactNode {
  const relFile = `${ctx.rel}/indice.yaml`
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
  const [nuova, setNuova] = useState<{ titolo: string; tipo: TipoNuova; dove: string; err: string[] }>({ titolo: '', tipo: 'ricetta', dove: '', err: [] })

  useEffect(() => {
    window.api.leggiSorgente(relFile).then(
      (s) => {
        try { setO(YAML.parse(s.testo) as O); setSrc(s); setTesto(s.testo) } catch (e) { setErrLettura(`Il file non si legge come YAML: ${(e as Error).message}`); setSrc(s); setTesto(s.testo); setTab('yaml') }
      },
      (e: unknown) => setErrLettura(ERR(e))
    )
  }, [relFile])

  const daYaml = useMemo((): { o?: O; err?: string } => {
    if (tab !== 'yaml') return {}
    try { return { o: YAML.parse(testo) as O } } catch (e) { return { err: (e as Error).message } }
  }, [tab, testo])
  const attuale: unknown = tab === 'yaml' ? daYaml.o : o
  const err = useMemo(() => (daYaml.err ? [`YAML non valido: ${daYaml.err}`] : attuale ? problemi(pulisci(attuale as O), ctx.dati.schede) : ['Nessun contenuto']), [attuale, daYaml.err, ctx.dati.schede])
  const buono = err.length === 0

  const mut = (fn: (c: O) => void): void => {
    if (!o) return
    const c = structuredClone(o)
    fn(c)
    setO(c); setSporco(true); setErrSalva([])
  }
  const cambiaTab = (t: 'moduli' | 'yaml'): void => {
    if (t === tab) return
    if (t === 'yaml') { if (o) setTesto(aYaml(o)) } else if (daYaml.o && !daYaml.err) setO(daYaml.o)
    else return
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
        useStore.getState().mostraToast('Mappa salvata. La versione precedente è in 99_Archivio/Versioni.')
        esci()
      } else if ('conflitto' in r) setConflitto(true)
      else setErrSalva(r.errori)
    } catch (e) { setErrSalva([ERR(e)]) } finally { setSalvando(false) }
  }
  useEffect(() => {
    const h = (e: KeyboardEvent): void => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void salva() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })

  if (errLettura && !src) return <p role="alert" className="s-avv">{errLettura}</p>
  if (!src) return <p>Apro la mappa…</p>

  const rami: O[] = o?.rami ?? []
  const collocate = new Set<string>()
  for (const r of rami) for (const v of r.voci ?? []) for (const s of v.schede ?? []) collocate.add(s)
  const libere = Object.values(ctx.dati.schede).filter((s) => !collocate.has(s.id))
  const destinazioni: { v: string; t: string }[] = []
  rami.forEach((r, ri) => (r.voci ?? []).forEach((v: O, vi: number) => destinazioni.push({ v: `${ri}:${vi}`, t: `${r.nome || r.id}${v.gruppo ? ' › ' + v.gruppo : ''}` })))
  const sposta = (ri: number, vi: number, si: number, dest: string): void => {
    const [dr, dv] = dest.split(':').map(Number) as [number, number]
    mut((c) => {
      const [id] = c.rami[ri].voci[vi].schede.splice(si, 1)
      c.rami[dr].voci[dv].schede.push(id)
    })
  }

  const creaScheda = async (): Promise<void> => {
    const titolo = nuova.titolo.trim()
    if (!titolo) { setNuova({ ...nuova, err: ['Scrivi il titolo della scheda.'] }); return }
    const id = idLibero(titolo, Object.keys(ctx.dati.schede))
    try {
      const r = await window.api.creaFile(`${ctx.rel}/schede/${id}.yaml`, modelloScheda(nuova.tipo, id, titolo))
      if (!r.ok) { setNuova({ ...nuova, err: 'errori' in r ? r.errori : ['Non sono riuscito a creare la scheda.'] }); return }
      if (nuova.dove) {
        const [dr, dv] = nuova.dove.split(':').map(Number) as [number, number]
        mut((c) => { c.rami[dr].voci[dv].schede.push(id) })
      }
      await useSit.getState().carica(ctx.rel)
      setNuova({ titolo: '', tipo: nuova.tipo, dove: nuova.dove, err: [] })
      useStore.getState().mostraToast(`Scheda «${titolo}» creata${nuova.dove ? ': salva la mappa per mostrarla' : ''}. Aprila dalla mappa per compilarla.`)
    } catch (e) { setNuova({ ...nuova, err: [ERR(e)] }) }
  }

  return (
    <div className="m-wrap">
      <div className="s-bar">
        <button type="button" className="btn" onClick={() => (sporco && !scarta ? setScarta(true) : esci())}>← Annulla</button>
        <span className="s-lvl">Modifica la mappa · {ctx.dati.indice.titolo}</span>
        <div className="m-tabs" role="tablist" aria-label="Come modificare">
          <button type="button" role="tab" aria-selected={tab === 'moduli'} disabled={!!daYaml.err || (!o && tab === 'yaml')} onClick={() => cambiaTab('moduli')}>Moduli</button>
          <button type="button" role="tab" aria-selected={tab === 'yaml'} onClick={() => cambiaTab('yaml')}>Testo (YAML)</button>
        </div>
        <button type="button" className="btn on" disabled={!buono || salvando || (!sporco && tab === 'moduli')} title="Salva (Ctrl+S)" onClick={() => void salva()}>{salvando ? 'Salvo…' : 'Salva'}</button>
      </div>
      {scarta && (
        <div role="alert" className="s-avv m-banner">
          Ci sono modifiche non salvate.
          <button type="button" className="btn" onClick={esci}>Scarta e esci</button>
          <button type="button" className="btn" onClick={() => setScarta(false)}>Continua a modificare</button>
        </div>
      )}
      {conflitto && (
        <div role="alert" className="s-avv m-banner">
          Il file è cambiato mentre lo modificavi (forse l'hai toccato fuori dall'app).
          <button type="button" className="btn" onClick={() => void salva(true)}>Sovrascrivi con la mia versione</button>
          <button type="button" className="btn" onClick={() => window.location.reload()}>Ricarica</button>
        </div>
      )}
      {errSalva.length > 0 && <div role="alert" className="s-avv m-banner"><ul>{errSalva.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      <div className={'m-stato ' + (buono ? 'ok' : 'no')} role="status">
        {buono ? 'La mappa è a posto: si può salvare.' : <>Da sistemare prima di salvare: <ul>{err.slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}</ul></>}
      </div>

      {tab === 'yaml' ? (
        <textarea className="inp m-t mono m-yaml" aria-label="Testo YAML della mappa" rows={28} spellCheck={false} value={testo} onChange={(e) => { setTesto(e.target.value); setSporco(true); setErrSalva([]) }} />
      ) : (
        o && (
          <div className="m-form">
            <section className="m-sez">
              <h2>Intestazione</h2>
              <div className="m-griglia">
                <Campo nome="Titolo"><Riga1 v={o.titolo} on={(v) => mut((c) => { c.titolo = v })} /></Campo>
                <Campo nome="Nel centro della mappa" aiuto="La parola grande al centro."><Riga1 v={o.centro} on={(v) => mut((c) => { c.centro = v })} /></Campo>
                <Campo nome="Sottotitolo" largo><Riga1 v={o.sottotitolo ?? ''} on={(v) => mut((c) => { c.sottotitolo = v })} /></Campo>
                <Campo nome="Esempi di ricerca" aiuto="Mostrati nella casella di ricerca."><Riga1 v={o.esempiRicerca ?? ''} on={(v) => mut((c) => { c.esempiRicerca = v })} /></Campo>
                <Campo nome="Inizio dei commenti" aiuto="# (shell, Python, MikroTik) oppure //"><Riga1 mono v={o.prefissoCommento ?? '#'} on={(v) => mut((c) => { c.prefissoCommento = v })} /></Campo>
              </div>
            </section>

            <section className="m-sez">
              <h2>Rami</h2>
              <p className="m-nota">L'ordine qui è quello della mappa: in senso orario partendo da in alto a sinistra.</p>
              {rami.map((r, ri) => (
                <div key={ri} className="m-card" data-c={r.colore}>
                  <div className="m-card-t">
                    <span className="m-n">{ri + 1}</span>
                    <Riga1 v={r.nome} ph="Nome del ramo" on={(v) => mut((c) => { c.rami[ri].nome = v })} />
                    <select className="inp m-sel" aria-label="Colore" value={r.colore} onChange={(e) => mut((c) => { c.rami[ri].colore = e.target.value })}>
                      {COLORI_RAMO.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <Comandi i={ri} n={rami.length} sposta={(d) => mut((c) => muovi(c.rami, ri, d))} togli={() => mut((c) => { if (c.rami.length > 1) c.rami.splice(ri, 1) })} />
                  </div>
                  {(r.voci ?? []).map((v: O, vi: number, vs: O[]) => (
                    <div key={vi} className="m-riga">
                      <div className="m-riga-c">
                        <Riga1 v={v.gruppo ?? ''} ph="Gruppo (vuoto = schede senza gruppo)" on={(x) => mut((c) => { c.rami[ri].voci[vi].gruppo = x })} />
                        <div className="m-lista">
                          {(v.schede ?? []).map((id: string, si: number, ss: string[]) => (
                            <div key={id + si} className="m-coppia">
                              <div className="m-coppia-c">
                                <span className="m-ph"><b>{ctx.dati.schede[id]?.sigla ?? id}</b> <em>{ctx.dati.schede[id]?.titolo ?? 'non esiste'}</em></span>
                                <select className="inp m-sel" aria-label={`Sposta ${id}`} value="" onChange={(e) => e.target.value && sposta(ri, vi, si, e.target.value)}>
                                  <option value="">Sposta in…</option>
                                  {destinazioni.filter((d) => d.v !== `${ri}:${vi}`).map((d) => <option key={d.v} value={d.v}>{d.t}</option>)}
                                </select>
                              </div>
                              <Comandi i={si} n={ss.length} sposta={(d) => mut((c) => muovi(c.rami[ri].voci[vi].schede, si, d))} togli={() => mut((c) => { c.rami[ri].voci[vi].schede.splice(si, 1) })} />
                            </div>
                          ))}
                          {libere.length > 0 && (
                            <select className="inp m-sel" aria-label="Aggiungi una scheda" value="" onChange={(e) => e.target.value && mut((c) => { c.rami[ri].voci[vi].schede.push(e.target.value) })}>
                              <option value="">+ Aggiungi una scheda non ancora in mappa…</option>
                              {libere.map((s) => <option key={s.id} value={s.id}>{s.sigla} · {s.titolo}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                      <Comandi i={vi} n={vs.length} sposta={(d) => mut((c) => muovi(c.rami[ri].voci, vi, d))} togli={() => mut((c) => { c.rami[ri].voci.splice(vi, 1) })} />
                    </div>
                  ))}
                  <button type="button" className="btn" onClick={() => mut((c) => { (c.rami[ri].voci ??= []).push({ gruppo: 'Nuovo gruppo', schede: [] }) })}><Con i="piu">Gruppo</Con></button>
                </div>
              ))}
              <button type="button" className="btn on" onClick={() => mut((c) => {
                let id = 'nuovo'
                const usati = new Set(c.rami.map((x: O) => x.id))
                for (let n = 1; usati.has(id); n++) id = `nuovo-${n}`
                c.rami.push({ id: slug(id), nome: 'Nuovo ramo', colore: COLORI_RAMO[c.rami.length % COLORI_RAMO.length], lato: 'R', voci: [{ schede: [] }] })
              })}><Con i="piu">Ramo</Con></button>
            </section>

            <section className="m-sez">
              <h2>Nuova scheda</h2>
              <p className="m-nota">Crea una scheda con un modello da compilare. Poi aprila dalla mappa e usa «Modifica».</p>
              <div className="m-griglia">
                <Campo nome="Titolo"><Riga1 v={nuova.titolo} ph="Per esempio: Leggere un sensore I2C" on={(v) => setNuova({ ...nuova, titolo: v, err: [] })} /></Campo>
                <Campo nome="Tipo">
                  <select className="inp m-sel" value={nuova.tipo} onChange={(e) => setNuova({ ...nuova, tipo: e.target.value as TipoNuova })}>
                    <option value="ricetta">Ricetta (passi con codice)</option>
                    <option value="prima_dopo">Prima e dopo (cosa cambia)</option>
                    <option value="regola">Regola (matematica: formula ed esempi)</option>
                    <option value="spiegazione">Spiegazione (teoria: testo, riquadri, disegni)</option>
                  </select>
                </Campo>
                <Campo nome="Mettila in" aiuto="Facoltativo: puoi anche aggiungerla dopo.">
                  <select className="inp m-sel" value={nuova.dove} onChange={(e) => setNuova({ ...nuova, dove: e.target.value })}>
                    <option value="">Per ora in nessun ramo</option>
                    {destinazioni.map((d) => <option key={d.v} value={d.v}>{d.t}</option>)}
                  </select>
                </Campo>
              </div>
              {nuova.err.length > 0 && <p role="alert" className="s-avv">{nuova.err.join(' ')}</p>}
              <button type="button" className="btn on" onClick={() => void creaScheda()}><Con i="piu">Crea la scheda</Con></button>
            </section>

            {libere.length > 0 && (
              <section className="m-sez">
                <h2>Schede non ancora in mappa</h2>
                <p className="m-nota">Esistono ma nessun ramo le mostra. Aggiungile da un gruppo qui sopra.</p>
                <div className="s-rels">{libere.map((s) => <span key={s.id} className="m-chip" title={s.titolo}>{s.sigla}</span>)}</div>
              </section>
            )}
          </div>
        )
      )}
    </div>
  )
}
