import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { SchedaConfronto, SchedaVoce, Situazioni } from '@shared/situazioni'
import { fonteInChiaro, type Riferimento } from '@shared/situazioni'
import { Icona, type NomeIcona } from '../componenti/Icona'
import { useHome } from '../home/stato'
import { useSit } from '../situazioni/stato'
import { Cronologia, Mappa } from './Navigatore'
import { Confronto, Testo, Voce } from './Voce'
import { Copertura, Elenco } from './Viste'
import { ordineVista, PASSI, STORIA0, useStoria, type VistaStoria as Vista } from './stato'

/* Le viste raggruppate per quello che servono: leggere il contenuto, trovare
   una voce, esercitarsi. La copertura sta fuori: è di materia, non del documento. */
const FAMIGLIE: { nome: string; viste: { id: Vista; nome: string; icona: NomeIcona }[] }[] = [
  { nome: 'Leggi', viste: [{ id: 'mappa', nome: 'Mappa', icona: 'mappa' }, { id: 'cronologia', nome: 'Cronologia', icona: 'orologio' }] },
  { nome: 'Trova', viste: [{ id: 'glossario', nome: 'Glossario', icona: 'libro' }, { id: 'persone', nome: 'Chi è chi', icona: 'persona' }, { id: 'svolte', nome: 'Svolte', icona: 'svolta' }] }
]

function Testata({ rel, dati, st, passo }: { rel: string; dati: Situazioni; st: ReturnType<typeof statoDi>; passo: (d: 1 | -1) => void }): ReactNode {
  const imposta = (p: Partial<typeof STORIA0>): void => useStoria.getState().imposta(rel, p)
  const materia = rel.split('/').filter(Boolean)[0] ?? ''
  const copertura = st.vista === 'copertura'
  return (
    <header className="st-testa">
      <div className="st-r st-r-dove">
        <span className="st-materia">{materia}</span>
        <Icona nome="dx" size={13} />
        <span className="st-arg">{dati.indice.titolo}</span>
        <span className="st-sp" />
        <button type="button" className={'btn' + (copertura ? ' on' : '')} aria-pressed={copertura} onClick={() => imposta({ vista: copertura ? 'mappa' : 'copertura' })}>
          <Icona nome="scudo" size={14} /> Copertura del libro
        </button>
      </div>
      {!copertura && (
        <div className="st-r st-r-fai">
          {FAMIGLIE.map((f) => (
            <div key={f.nome} className="st-fam">
              <span className="st-fam-t">{f.nome}</span>
              <div className="st-gruppo">
                {f.viste.map((v) => (
                  <button key={v.id} type="button" className="btn" aria-pressed={st.vista === v.id} onClick={() => imposta({ vista: v.id })}>
                    <Icona nome={v.icona} size={14} /> {v.nome}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <span className="st-sp" />
          <div className="st-fam">
            <span className="st-fam-t">Scorri</span>
            <div className="st-gruppo">
              <button type="button" className="btn" title="Scheda precedente" aria-label="Scheda precedente" onClick={() => passo(-1)}><Icona nome="sx" size={14} /></button>
              <button type="button" className="btn st-int" aria-pressed={st.riproduci} title={st.riproduci ? 'Ferma' : 'Riproduci da sola'} onClick={() => imposta({ riproduci: !st.riproduci })}>
                <Icona nome={st.riproduci ? 'pausa' : 'gioca'} size={14} piena={!st.riproduci} /> {st.riproduci ? 'Pausa' : 'Riproduci'}
              </button>
              <button type="button" className="btn" title="Scheda successiva" aria-label="Scheda successiva" onClick={() => passo(1)}><Icona nome="dx" size={14} /></button>
            </div>
            <label className="st-passo">
              <span className="sr">Ogni quanti secondi</span>
              <select value={st.passo} onChange={(e) => imposta({ passo: Number(e.target.value) })}>
                {PASSI.map((n) => <option key={n} value={n}>{n}s</option>)}
              </select>
            </label>
          </div>
          <div className="st-fam">
            <span className="st-fam-t">Esercita</span>
            <button type="button" className="btn st-int" aria-pressed={st.ripasso} onClick={() => imposta({ ripasso: !st.ripasso })}>
              <span className="st-led" /> Ripasso
            </button>
          </div>
        </div>
      )}
      {!copertura && (dati.indice.ingresso || dati.indice.guida) && (
        <div className="st-guida">
          {dati.indice.ingresso && <div><b>Quando usarlo</b>{dati.indice.ingresso}</div>}
          {dati.indice.guida && <div><b>La domanda da farsi</b>{dati.indice.guida}</div>}
        </div>
      )}
    </header>
  )
}

function statoDi(rel: string): typeof STORIA0 {
  return useStoria.getState().stati[rel] ?? STORIA0
}

/** Che cosa nasconde il ripasso, in base al genere della voce. */
const RIPASSO: Record<SchedaVoce['genere'], (keyof SchedaVoce)[]> = {
  evento: ['quando', 'chi'],
  persona: ['cosa', 'quando'],
  concetto: ['cosa'],
  processo: ['conta']
}

function Scheda({ rel, dati, id, ripasso, apri }: { rel: string; dati: Situazioni; id: string; ripasso: boolean; apri: (x: string) => void }): ReactNode {
  const s = dati.schede[id]
  if (!s) return <p className="st-vuoto">Questa scheda non c'è più.</p>
  const ramo = dati.indice.rami.find((x) => x.voci.some((v) => v.schede.includes(id)))
  const colore = (x: string): string | undefined => dati.indice.rami.find((r) => r.voci.some((v) => v.schede.includes(x)))?.colore
  const fatta = dati.ripassate.includes(id)
  const nascosti = s.tipo === 'voce' && ripasso ? RIPASSO[s.genere] : []

  return (
    <article className="st-scheda" data-c={ramo?.colore}>
      <div className="st-kind">
        {s.tipo === 'voce' ? s.genere : 'confronto'}
        {s.tipo === 'voce' && s.svolta ? ' · punto di svolta' : ''}
        {ramo ? ` · ${ramo.nome}` : ''}
      </div>
      <h1>{s.titolo}</h1>
      {ripasso && nascosti.length > 0 && (
        <p className="st-ripasso-n"><Icona nome="occhioBarrato" size={14} /> Ripasso: {nascosti.map((c) => `«${c}»`).join(' e ')} sono coperti. Clicca per scoprire.</p>
      )}
      {s.tipo === 'voce'
        ? <Voce dati={dati} s={s} colore={colore} apri={apri} nascosti={nascosti as string[]} />
        : <Confronto dati={dati} s={s as SchedaConfronto} colore={colore} apri={apri} ripasso={ripasso} />}
      {(s.tipo === 'voce' || s.tipo === 'confronto') && s.da.length > 0 && (
        <p className="st-da">
          Dal libro: {s.da.map((d: Riferimento, i: number) => <code key={i}>{fonteInChiaro(d, dati.libri)}</code>)}
          {s.parole ? <span className="st-pc">parole chiave: {s.parole}</span> : null}
        </p>
      )}
      <div className="st-mark">
        <button type="button" className="btn" aria-pressed={fatta} onClick={() => void useSit.getState().ripassata(rel, id)}>
          {fatta ? <><Icona nome="spunta" size={14} /> Ripassata</> : 'Segna come ripassata'}
        </button>
      </div>
    </article>
  )
}

/** Un argomento di Storia: navigazione a sinistra, scheda a destra. */
export function VistaStoria({ rel }: { rel: string }): ReactNode {
  const dati = useSit((s) => s.dati[rel])
  const errore = useSit((s) => s.errori[rel])
  const st = useStoria((s) => s.stati[rel] ?? STORIA0)

  useEffect(() => {
    void useSit.getState().carica(rel)
  }, [rel])

  const materia = rel.split('/').filter(Boolean)[0] ?? ''
  useEffect(() => {
    if (st.vista === 'copertura' && materia) void useStoria.getState().caricaMateria(materia)
  }, [st.vista, materia])

  const corpo = useRef<HTMLDivElement>(null)
  const ordine = dati ? ordineVista(dati, st.vista) : []
  const corrente = st.scheda && dati?.schede[st.scheda] ? st.scheda : ordine[0]

  /** Avanti o indietro di una scheda, nell'ordine della vista aperta. In fondo si ferma. */
  const passo = useCallback(
    (d: 1 | -1): void => {
      if (!ordine.length) return
      const i = corrente ? ordine.indexOf(corrente) : -1
      const k = i + d
      if (k < 0) return
      if (k >= ordine.length) {
        useStoria.getState().imposta(rel, { riproduci: false })
        return
      }
      useStoria.getState().imposta(rel, { scheda: ordine[k] })
    },
    [rel, corrente, ordine.join('|')]
  )

  // riproduzione a tempo: va avanti da sola finché non si ferma o finiscono le schede
  useEffect(() => {
    if (!st.riproduci) return
    const t = setInterval(() => passo(1), Math.max(3, st.passo) * 1000)
    return () => clearInterval(t)
  }, [st.riproduci, st.passo, passo])

  // a ogni scheda nuova: contenuto dall'inizio e voce corrente in vista nella colonna
  useEffect(() => {
    corpo.current?.scrollTo({ top: 0, behavior: st.riproduci ? 'smooth' : 'auto' })
    corpo.current?.querySelector('.st-foglia.sel, .st-vv.sel')?.scrollIntoView({ block: 'nearest' })
  }, [corrente, st.riproduci])

  if (errore) return <div className="st"><p role="alert" className="st-avv">{errore}</p></div>
  if (!dati) return <div className="st"><p>Apro l'argomento…</p></div>

  const apri = (id: string): void => useStoria.getState().imposta(rel, { scheda: id })
  const conColonna = st.vista === 'mappa' || st.vista === 'cronologia'
  const elenco = st.vista === 'glossario' || st.vista === 'persone' || st.vista === 'svolte' ? st.vista : null
  const posizione = corrente ? ordine.indexOf(corrente) + 1 : 0

  return (
    <div className={'st' + (conColonna ? '' : ' st-piena')}>
      <Testata rel={rel} dati={dati} st={st} passo={passo} />
      {dati.avvisi.length > 0 && (
        <details className="st-avvisi">
          <summary><Icona nome="avviso" size={14} /> {dati.avvisi.length} avvisi nella lettura dei file</summary>
          <ul>{dati.avvisi.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </details>
      )}
      <div className="st-corpo" ref={corpo}>
        {conColonna && (
          <nav className="st-col" aria-label="Navigazione dell'argomento">
            <div className="st-col-in">
              {st.vista === 'mappa'
                ? <Mappa rel={rel} dati={dati} scheda={corrente ?? null} apri={apri} />
                : <Cronologia dati={dati} scheda={corrente ?? null} apri={apri} />}
            </div>
          </nav>
        )}
        <main className="st-main">
          {st.vista === 'copertura'
            ? <Copertura dati={dati} vaiA={(r, id) => {
                useStoria.getState().imposta(r, { scheda: id, vista: 'mappa' })
                const n = useHome.getState().albero.flatMap(function piatto(x): typeof x[] { return [x, ...(x.figli ?? []).flatMap(piatto)] }).find((x) => x.rel === r)
                if (n) useHome.getState().apri(n)
              }} />
            : conColonna
              ? (corrente
                  ? <>
                      {st.riproduci && (
                        <p className="st-play">
                          <Icona nome="gioca" size={13} piena /> Riproduzione · {posizione} di {ordine.length} · ogni {st.passo}s
                          <button type="button" onClick={() => useStoria.getState().imposta(rel, { riproduci: false })}>ferma</button>
                        </p>
                      )}
                      <Scheda rel={rel} dati={dati} id={corrente} ripasso={st.ripasso} apri={apri} />
                    </>
                  : <p className="st-vuoto">Questo argomento non ha ancora schede.</p>)
              : <Elenco dati={dati} vista={elenco ?? 'glossario'} apri={(id) => useStoria.getState().imposta(rel, { scheda: id, vista: 'mappa' })} />}
        </main>
      </div>
    </div>
  )
}

export { Testo }
