import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { Matematica, Regola } from '@shared/matematica'
import { Con, Icona } from '../componenti/Icona'
import { BentoRegola } from './BentoRegola'
import { leggiDisequazione, perchéSegno, perGrafico, scriviNumero, valoreDisequazione, type Disequazione } from './disequazioni'
import { Formula } from './FormulaVista'
import { Grafico } from './GraficoVista'
import { LineaSegni } from './LineaSegni'
import { ErroreMat, grado, leggiPoli, passi, scomponi, scriviFattore, scriviScomposto, terminiNonNulli } from './polinomio'
import { useMat, type Pagina } from './stato'
import { TestoMat } from './TestoMat'

const messaggio = (e: unknown): string => (e instanceof ErroreMat ? e.message : 'Non riesco a leggerla: controlla parentesi e simboli.')

/** Un colore per ogni regola di un argomento (se la regola non ne sceglie uno suo). */
export const COLORI_REGOLE = ['#e5484d', '#5b5bd6', '#0f9e9e', '#d9a800', '#d6409f', '#5a6b82', '#22a565', '#f08c3c']
export const coloreRegola = (r: Regola, posizione: number): string => r.colore ?? COLORI_REGOLE[posizione % COLORI_REGOLE.length]!

const ordinate = (m: Matematica): Regola[] => {
  const nelOrdine = m.argomento.ordine.map((id) => m.regole[id]).filter((r): r is Regola => !!r)
  const fuori = Object.values(m.regole).filter((r) => !m.argomento.ordine.includes(r.id)).sort((a, b) => a.id.localeCompare(b.id))
  return [...nelOrdine, ...fuori]
}

/** Un argomento di matematica aperto in una scheda dell'app: la griglia delle regole, il calcolatore, il ripasso. */
export function VistaMatematica({ rel }: { rel: string }): ReactNode {
  const dati = useMat((s) => s.dati[rel])
  const errore = useMat((s) => s.errori[rel])
  const [pagina, setPagina] = useState<Pagina>('regole')
  const [regolaId, setRegolaId] = useState<string | null>(null)

  useEffect(() => {
    void useMat.getState().carica(rel)
  }, [rel])

  if (errore) return <div className="mat"><div className="mat-in"><p role="alert" className="mat-avv">{errore}</p></div></div>
  if (!dati) return <div className="mat"><div className="mat-in"><p>Apro l'argomento…</p></div></div>

  const vaiRegola = (id: string): void => { setRegolaId(id); setPagina('regole') }
  const nRip = dati.ripassate.length, nReg = Object.keys(dati.regole).length
  const pagine: [Pagina, string][] = [['regole', `Regole (${nReg})`]]
  if (dati.argomento.motore) pagine.push(['calcolatore', 'Prova su un esercizio'])
  pagine.push(['ripasso', `Ripasso (${nRip}/${nReg})`])

  return (
    <div className="mat">
      <div className="mat-in">
        <header className="mat-top">
          <span className="hm-ico hm-t-matematica" style={{ width: 44, height: 44 }}><Icona nome="somma" size={22} /></span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>{dati.argomento.titolo}</h1>
            {dati.argomento.introduzione && <p style={{ margin: '2px 0 0', color: 'var(--mute)', fontSize: 14 }}><TestoMat t={dati.argomento.introduzione} /></p>}
          </div>
        </header>
        <nav className="mat-tabs" aria-label="Viste dell'argomento">
          {pagine.map(([id, nome]) => <button key={id} type="button" className="mat-tab" aria-pressed={pagina === id} onClick={() => { setPagina(id); if (id === 'regole') setRegolaId(null) }}>{nome}</button>)}
        </nav>
        {dati.argomento.bozza && <p className="mat-avv" role="note">Bozza scritta da Claude: controlla le regole e correggi i file nella cartella <strong>regole</strong> dove non va. Poi metti <strong>bozza: false</strong> in argomento.yaml.</p>}
        {dati.avvisi.length > 0 && <ul className="mat-avv" style={{ paddingLeft: 28 }}>{dati.avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>}
        {pagina === 'regole' && <Regole m={dati} regolaId={regolaId} setRegolaId={setRegolaId} />}
        {pagina === 'calcolatore' && <Calcolatore m={dati} vaiRegola={vaiRegola} />}
        {pagina === 'ripasso' && <Ripasso m={dati} vaiRegola={vaiRegola} />}
      </div>
    </div>
  )
}

/** Sinistra del primo «=» di una formula: la «forma» da riconoscere (a²−b²), non tutta l'uguaglianza. */
const forma = (f: string): string => (f.includes('=') ? f.split('=')[0]!.trim() : f)

/** Livello 1: la griglia delle regole. Livello 2: una regola, con le sue quattro fasi. */
function Regole({ m, regolaId, setRegolaId }: { m: Matematica; regolaId: string | null; setRegolaId: (id: string | null) => void }): ReactNode {
  const lista = ordinate(m)
  const pos = regolaId ? lista.findIndex((r) => r.id === regolaId) : -1
  const r = pos >= 0 ? lista[pos]! : null
  if (r) {
    const col = coloreRegola(r, pos)
    return (
      <section aria-label={r.nome} style={{ '--c': col } as CSSProperties}>
        <nav className="mat-bc" aria-label="Dove sei">
          <button type="button" onClick={() => setRegolaId(null)}>Regole</button>
          <span aria-hidden="true">›</span>
          <b aria-current="page">{pos + 1} · {r.nome}</b>
        </nav>
        <header className="mat-rtesta">
          <span className="mat-rn">{pos + 1}</span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 19 }}>{r.nome}</h2>
            {r.formula && <p style={{ margin: '3px 0 0' }}><Formula grande testo={r.formula} /></p>}
          </div>
          <span style={{ flex: 1 }} />
          {pos > 0 && <button type="button" className="btn" onClick={() => setRegolaId(lista[pos - 1]!.id)}>← {lista[pos - 1]!.nome}</button>}
          {pos < lista.length - 1 && <button type="button" className="btn" onClick={() => setRegolaId(lista[pos + 1]!.id)}>{lista[pos + 1]!.nome} →</button>}
        </header>
        <BentoRegola key={r.id} r={r} nomeDi={(id) => m.regole[id]?.nome ?? id} ripassata={m.ripassate.includes(r.id)} segna={() => void useMat.getState().ripassata(m.rel, r.id)} />
      </section>
    )
  }
  return (
    <section aria-label="Regole">
      <p className="mat-nota" style={{ margin: '0 0 12px' }}>Davanti a un esercizio provi le regole <b>in ordine</b> e ti fermi alla prima che funziona. Apri una regola per capirla, riconoscerla, allenarti e ripassarla.</p>
      <div className="mat-grid">
        {lista.map((x, i) => {
          const fatta = m.ripassate.includes(x.id)
          return (
            <button key={x.id} type="button" className="mat-rg" style={{ '--c': coloreRegola(x, i) } as CSSProperties} onClick={() => setRegolaId(x.id)}>
              <span className="mat-rgn">{i + 1}</span>
              <span className="mat-rgnome">{x.nome}</span>
              {x.formula && <span className="mat-rgf"><Formula grande testo={forma(x.formula)} /></span>}
              <span className="mat-rgsub"><TestoMat t={x.riconosci} /></span>
              {fatta && <span className="mat-chip2">✓ ripassata</span>}
            </button>
          )
        })}
      </div>
      {!lista.length && <p className="mat-card">Questo argomento non ha ancora regole.</p>}
    </section>
  )
}

/* ───── calcolatore: per provare un esercizio tuo ───── */
function Calcolatore({ m, vaiRegola }: { m: Matematica; vaiRegola: (id: string) => void }): ReactNode {
  return m.argomento.motore === 'disequazioni' ? <RiconosciDisequazioni m={m} /> : <RiconosciScomposizione m={m} vaiRegola={vaiRegola} />
}

function Esempi({ voci, scegli }: { voci: string[]; scegli: (s: string) => void }): ReactNode {
  if (!voci.length) return null
  return <div className="mat-chips" aria-label="Esempi da provare">{voci.map((v) => <button key={v} type="button" className="chip" onClick={() => scegli(v)}>{v}</button>)}</div>
}

function RiconosciScomposizione({ m, vaiRegola }: { m: Matematica; vaiRegola: (id: string) => void }): ReactNode {
  const [testo, setTesto] = useState(m.argomento.esempi[0] ?? 'x^2-5x+6')
  const r = useMemo(() => {
    try {
      const p = leggiPoli(testo)
      if (grado(p) <= 1 || terminiNonNulli(p) === 1) return { semplice: true as const, p }
      const lista = passi(p)
      return { semplice: false as const, p, lista, primo: lista.findIndex((s) => s.ok) }
    } catch (e) {
      return { errore: messaggio(e) }
    }
  }, [testo])
  const regolaDi = (id: string): Regola | undefined => Object.values(m.regole).find((x) => x.controllo === id)
  return (
    <section aria-label="Scomponi un polinomio">
      <h2 className="mat-h">Scrivi il polinomio</h2>
      <input className="inp big" value={testo} onChange={(e) => setTesto(e.target.value)} aria-label="Polinomio da scomporre" aria-invalid={'errore' in r} spellCheck={false} />
      <Esempi voci={m.argomento.esempi} scegli={setTesto} />
      {'errore' in r ? <p role="alert" className="mat-err">{r.errore}</p> : r.semplice ? (
        <p className="mat-card">Questo è già scomposto: è un monomio o un binomio di 1º grado. <Formula testo={testo} /></p>
      ) : (
        <>
          <h2 className="mat-h">Prova i controlli in ordine</h2>
          <div className="mat-card" style={{ padding: 6 }}>
            {r.lista.map((s, i) => {
              const stato = i === r.primo ? 'go' : r.primo >= 0 && i > r.primo ? 'dopo' : 'no'
              const reg = regolaDi(s.id)
              return (
                <div key={s.id} className={'mat-ctl mat-' + stato}>
                  <span className="mat-ic"><Icona nome={stato === 'go' ? 'avanti' : stato === 'dopo' ? 'meno' : 'chiudi'} size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {i + 1}. <strong>{s.nome}</strong>
                    {stato === 'go' && <><span className="mat-ora">fai questo</span><span className="mat-sub"> {s.perche}</span></>}
                    {stato === 'no' && <span className="mat-sub"> · {s.no}</span>}
                  </span>
                  {reg && stato !== 'dopo' && <button type="button" className="btn" style={{ padding: '3px 9px', fontSize: 12.5 }} onClick={() => vaiRegola(reg.id)}>Vedi la regola</button>}
                </div>
              )
            })}
          </div>
          {r.primo >= 0 ? (
            <p className="mat-nota">Da questo passo escono: <Formula testo={r.lista[r.primo]!.fattori!.map(scriviFattore).join(' · ')} />. Poi ripeti la lista su ogni fattore che si può ancora scomporre.</p>
          ) : (
            <p className="mat-nota">Nessun controllo funziona: con questi strumenti non si scompone (può essere irriducibile).</p>
          )}
          <h2 className="mat-h">Scomposizione completa</h2>
          <p className="mat-card" style={{ margin: 0 }}><Formula grande testo={scriviScomposto(scomponi(r.p))} /></p>
        </>
      )}
    </section>
  )
}

function RiconosciDisequazioni({ m }: { m: Matematica }): ReactNode {
  const [testo, setTesto] = useState(m.argomento.esempi[0] ?? '(x^2-4)/(x-1) >= 0')
  const [mostra, setMostra] = useState(0)
  const [grafico, setGrafico] = useState(false)
  useEffect(() => setMostra(0), [testo])
  const r = useMemo((): { d: Disequazione } | { errore: string } => {
    try { return { d: leggiDisequazione(testo) } } catch (e) { return { errore: messaggio(e) } }
  }, [testo])
  return (
    <section aria-label="Risolvi una disequazione">
      <h2 className="mat-h">Scrivi la disequazione (secondo membro 0)</h2>
      <input className="inp big" value={testo} onChange={(e) => setTesto(e.target.value)} aria-label="Disequazione" aria-invalid={'errore' in r} spellCheck={false} />
      <Esempi voci={m.argomento.esempi} scegli={setTesto} />
      {'errore' in r ? <p role="alert" className="mat-err">{r.errore}</p> : <Segni d={r.d} mostra={mostra} setMostra={setMostra} grafico={grafico} setGrafico={setGrafico} />}
    </section>
  )
}

function Segni({ d, mostra, setMostra, grafico, setGrafico }: { d: Disequazione; mostra: number; setMostra: (n: number) => void; grafico: boolean; setGrafico: (b: boolean) => void }): ReactNode {
  const nr = d.righe.length
  const fatto = mostra > nr
  const g = useMemo(() => perGrafico(d), [d])
  return (
    <>
      <h2 className="mat-h">Linea dei segni, un fattore alla volta</h2>
      <div className="mat-card">
        <p className="mat-guida" aria-live="polite">
          {mostra === 0 ? 'Premi «Avanti» per mettere i punti e i fattori sulla linea.' : mostra <= nr ? <><b>Fattore {mostra} di {nr}.</b> {perchéSegno(d.righe[mostra - 1]!)}</> : <>Risultato: moltiplico i segni colonna per colonna e tengo gli intervalli in cui la disequazione («{d.rel.replace('>=', '≥').replace('<=', '≤')} 0») è vera.</>}
        </p>
        <LineaSegni d={d} mostra={mostra} />
        <div className="mat-bt">
          <button type="button" className="btn on" disabled={fatto} onClick={() => setMostra(mostra + 1)}><Con i="avanti" fine>Avanti</Con></button>
          <button type="button" className="btn" onClick={() => setMostra(nr + 1)}>Mostra tutto</button>
          <button type="button" className="btn" onClick={() => setMostra(0)}>Ricomincia</button>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn" aria-pressed={grafico} onClick={() => setGrafico(!grafico)}>{grafico ? 'Nascondi il grafico' : 'Mostra il grafico'}</button>
        </div>
      </div>
      <h2 className="mat-h">Soluzione</h2>
      <p className="mat-card" style={{ margin: 0 }}>
        {fatto ? <span className="mat-sol">{d.testo}</span> : <span style={{ color: 'var(--mute)' }}>Compare quando la linea è completa.</span>}
        {fatto && d.punti.length > 0 && <span className="mat-sub" style={{ display: 'block', marginTop: 4 }}>Punti: {d.punti.map((p, j) => `${scriviNumero(p.v)} ${p.den ? 'escluso (denominatore)' : d.incluso[j] ? 'incluso' : 'escluso'}`).join(' · ')}</span>}
      </p>
      {grafico && (
        <div className="mat-card" style={{ marginTop: 10 }}>
          <Grafico titolo={`Grafico di ${d.fratta ? 'una frazione' : 'un polinomio'} con la soluzione in verde sull'asse`} curve={[{ f: (x) => valoreDisequazione(d, x) }]} x0={g.x0} x1={g.x1} marchi={g.marchi} tratti={fatto ? g.tratti : []} />
        </div>
      )}
    </>
  )
}

/* ───── ripasso di tutte le regole dell'argomento ───── */
function Ripasso({ m, vaiRegola }: { m: Matematica; vaiRegola: (id: string) => void }): ReactNode {
  const [aperte, setAperte] = useState<Set<string>>(new Set())
  const [soloDaFare, setSoloDaFare] = useState(true)
  const lista = ordinate(m).map((r, i) => ({ r, i })).filter(({ r }) => !soloDaFare || !m.ripassate.includes(r.id))
  const alterna = (id: string): void => setAperte((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  return (
    <section aria-label="Ripasso">
      <div className="mat-bt" style={{ marginTop: 0 }}>
        <span style={{ fontSize: 14 }}>{m.ripassate.length} di {Object.keys(m.regole).length} regole ripassate</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn" aria-pressed={soloDaFare} onClick={() => setSoloDaFare(!soloDaFare)}>{soloDaFare ? 'Mostra anche quelle ripassate' : 'Solo quelle da ripassare'}</button>
      </div>
      <div className="mat-grid" style={{ marginTop: 12 }}>
        {lista.map(({ r, i }) => {
          const aperta = aperte.has(r.id), fatta = m.ripassate.includes(r.id)
          return (
            <article key={r.id} className="mat-rg mat-rg-fermo" style={{ '--c': coloreRegola(r, i) } as CSSProperties}>
              <span className="mat-rgn">{i + 1}</span>
              <h2 className="mat-rgnome" style={{ margin: 0 }}>{r.nome}</h2>
              <p className="mat-rgsub" style={{ margin: 0 }}><TestoMat t={r.riconosci} /></p>
              <div className={'mat-vela' + (aperta ? '' : ' mat-sfoca')} aria-hidden={!aperta}>
                {r.formula && <p className="mat-formula" style={{ marginTop: 0 }}><Formula grande testo={r.formula} /></p>}
                <p style={{ margin: 0 }}><b>Cosa fai:</b> <TestoMat t={r.fai} /></p>
              </div>
              <div className="mat-bt">
                <button type="button" className="btn" onClick={() => alterna(r.id)}><Con i={aperta ? 'occhioBarrato' : 'occhio'}>{aperta ? 'Nascondi' : 'Mostra la risposta'}</Con></button>
                <button type="button" className={'btn' + (fatta ? ' on' : '')} aria-pressed={fatta} onClick={() => void useMat.getState().ripassata(m.rel, r.id)}><Con i="spunta">{fatta ? 'Ripassata' : 'L\'ho ricordata'}</Con></button>
                <button type="button" className="btn" onClick={() => vaiRegola(r.id)}>Apri</button>
              </div>
            </article>
          )
        })}
      </div>
      {!lista.length && <p className="mat-card">Hai ripassato tutte le regole. Bravo: se vuoi rivederle, premi «Mostra anche quelle ripassate».</p>}
    </section>
  )
}
