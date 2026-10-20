import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import type { Regola } from '@shared/matematica'
import { Con } from '../componenti/Icona'
import { FiguraDomanda, MiniRicomposizione, Ricomposizione } from './Figure'
import { Formula } from './FormulaVista'
import { TestoMat } from './TestoMat'

type FaseId = 'capisci' | 'riconosci' | 'fai' | 'ripassa'
const FASI: { id: FaseId; n: number; nome: string; colore: string }[] = [
  { id: 'capisci', n: 1, nome: 'Capisci', colore: '#0f9e9e' },
  { id: 'riconosci', n: 2, nome: 'Riconosci', colore: '#4c6fff' },
  { id: 'fai', n: 3, nome: 'Fai e prova', colore: '#22a565' },
  { id: 'ripassa', n: 4, nome: 'Ripassa', colore: '#d6409f' }
]
/** I colori del tipo di informazione (uguali in tutte le regole). */
const COL = { formula: '#8e4ec6', errore: '#e5484d', confondi: '#d9a800' }

const tinta = (c: string): CSSProperties => ({ '--c': c }) as CSSProperties

/** La «bento grid» di una regola: quattro card, quella aperta occupa tutta la larghezza. */
export function BentoRegola({ r, nomeDi, ripassata, segna }: { r: Regola; nomeDi: (id: string) => string; ripassata: boolean; segna: () => void }): ReactNode {
  const [aperta, setAperta] = useState<FaseId | null>(null)
  const corpo = (id: FaseId, piena: boolean): ReactNode => {
    switch (id) {
      case 'capisci': return <Capisci r={r} piena={piena} />
      case 'riconosci': return <Riconosci r={r} piena={piena} />
      case 'fai': return <Fai r={r} piena={piena} />
      case 'ripassa': return <Ripassa r={r} piena={piena} nomeDi={nomeDi} ripassata={ripassata} segna={segna} />
    }
  }
  return (
    <div className={'mat-bento' + (aperta ? ' mat-bento-ap' : '')}>
      {FASI.map((f) => {
        const on = aperta === f.id
        const capo = (
          <div className="mat-bhd">
            <span className="mat-bnn">{f.n}</span>
            <span className="mat-btt">{f.nome}</span>
            {on ? <button type="button" className="btn" onClick={() => setAperta(null)}>Chiudi</button> : <span className="mat-bapri">Apri</span>}
          </div>
        )
        if (on) return <section key={f.id} className={`mat-b mat-b-${f.id} mat-b-ap`} style={tinta(f.colore)} aria-label={f.nome}>{capo}{corpo(f.id, true)}</section>
        const apri = (): void => setAperta(f.id)
        const tasto = (e: KeyboardEvent): void => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apri() } }
        return <div key={f.id} role="button" tabIndex={0} aria-expanded={false} aria-label={`Apri la fase ${f.nome}`} className={`mat-b mat-b-${f.id}`} style={tinta(f.colore)} onClick={apri} onKeyDown={tasto}>{capo}{corpo(f.id, false)}</div>
      })}
    </div>
  )
}

const Etichetta = ({ c, children }: { c: string; children: ReactNode }): ReactNode => <span className="mat-tag" style={tinta(c)}>{children}</span>

/* ───── 1 · Capisci ───── */
function Capisci({ r, piena }: { r: Regola; piena: boolean }): ReactNode {
  if (!piena) {
    return (
      <>
        <p className="mat-anteprima"><TestoMat t={r.capisci[0] ?? r.fai} /></p>
        {r.animazione && <MiniRicomposizione />}
        {r.animazione && <span className="mat-chip2" style={{ alignSelf: 'center' }}>con disegno animato</span>}
      </>
    )
  }
  return (
    <div className={'mat-corpo' + (r.animazione ? ' mat-cap2' : '')}>
      <div>
        {r.capisci.length === 0 && <p className="mat-nota">Questa regola non ha ancora la spiegazione da zero. Intanto: <TestoMat t={r.fai} /></p>}
        {r.capisci.map((p, i) => <p key={i} className="mat-par"><TestoMat t={p} /></p>)}
      </div>
      {r.animazione === 'ricomposizione' && <Ricomposizione />}
    </div>
  )
}

/* ───── 2 · Riconosci ───── */
const BADGE = { si: 'sì', no: 'no' } as const

function Riconosci({ r, piena }: { r: Regola; piena: boolean }): ReactNode {
  const [i, setI] = useState(0)
  const es = r.riconosciEsempi
  if (!piena) {
    const d = es[0]?.domande
    return d ? (
      <>
        <div className="mat-qchips">{d.map((q, k) => <span key={k} className="mat-chip2">{q.titolo}</span>)}</div>
        <p className="mat-nota">{d.length} domande, ognuna con il suo disegno</p>
      </>
    ) : <p className="mat-anteprima"><TestoMat t={r.riconosci} /></p>
  }
  if (!es.length) {
    return (
      <div className="mat-corpo">
        <dl className="mat-dl">
          <dt>Come la riconosci</dt><dd><TestoMat t={r.riconosci} /></dd>
          <dt>Cosa fai</dt><dd><TestoMat t={r.fai} /></dd>
        </dl>
      </div>
    )
  }
  const e = es[Math.min(i, es.length - 1)]!
  return (
    <div className="mat-corpo">
      <p className="mat-par">Scegli un’espressione e guarda cosa risponde ogni domanda.</p>
      <div className="mat-esbt">
        {es.map((x, k) => <button key={k} type="button" className={'mat-esb' + (k === i ? ' on' : '')} aria-pressed={k === i} onClick={() => setI(k)}><Formula testo={x.da} /></button>)}
      </div>
      <div className="mat-qs">
        {e.domande.map((q, k) => (
          <div key={k} className="mat-q">
            <h4>{k + 1}. {q.titolo}</h4>
            <FiguraDomanda f={q.figura} />
            {q.risposta !== 'na' && <span className={'mat-ans mat-ans-' + q.risposta}>{BADGE[q.risposta as 'si' | 'no']}</span>}
            {q.nota && <p className="mat-nota"><TestoMat t={q.nota} /></p>}
          </div>
        ))}
      </div>
      <p className="mat-grande"><Formula grande testo={e.da} /></p>
      <p className={'mat-esito ' + (e.esito.ok ? 'ok' : 'no')}>{e.esito.ok ? '✓ ' : '✗ '}<TestoMat t={e.esito.testo} /></p>
    </div>
  )
}

/* ───── 3 · Fai e prova ───── */
function Fai({ r, piena }: { r: Regola; piena: boolean }): ReactNode {
  const [ei, setEi] = useState(0)
  const [passo, setPasso] = useState(0)
  const [scelta, setScelta] = useState<number | null>(null)
  const ex = r.esercizi[ei]
  if (!piena) {
    if (ex) {
      return (
        <>
          <p className="mat-anteprima"><Formula grande testo={ex.da} /></p>
          <p className="mat-nota">{ex.passi.length} {ex.passi.length === 1 ? 'passo' : 'passi'} · {r.esercizi.length} {r.esercizi.length === 1 ? 'esercizio' : 'esercizi'} da provare</p>
        </>
      )
    }
    const e0 = r.esempi[0]
    return e0 ? <p className="mat-anteprima"><Formula testo={e0.da} /> → <Formula testo={e0.risultato} /></p> : <p className="mat-anteprima"><TestoMat t={r.fai} /></p>
  }
  const finito = !!ex && passo >= ex.passi.length
  const corrente = ex && !finito ? ex.passi[passo]! : null
  const prossimo = (): void => { setPasso(passo + 1); setScelta(null) }
  const altro = (): void => { setEi((ei + 1) % r.esercizi.length); setPasso(0); setScelta(null) }
  return (
    <div className="mat-corpo">
      <p className="mat-par"><b>Cosa fai:</b> <TestoMat t={r.fai} /></p>
      {r.esempi.length > 0 && <Etichetta c={COL.formula}>Guarda come si fa</Etichetta>}
      {r.esempi.map((e, k) => (
        <div key={k} className="mat-esempio">
          <p style={{ margin: 0 }}><Formula testo={e.da} /></p>
          {e.passi.length > 0 && <ol>{e.passi.map((p, j) => <li key={j}><TestoMat t={p} /></li>)}</ol>}
          {e.risultato && <p style={{ margin: 0 }}>→ <Formula testo={e.risultato} /></p>}
        </div>
      ))}
      {ex && (
        <>
          <Etichetta c="#22a565">Prova tu</Etichetta>
          <p className="mat-par">Scomponi <Formula grande testo={ex.da} />. A ogni passo scegli la mossa giusta: se sbagli ti dico perché.</p>
          {ex.passi.slice(0, passo).map((p, k) => <div key={k} className="mat-fatto"><span className="mat-bnn">{k + 1}</span><span><TestoMat t={p.dopo} /></span></div>)}
          {corrente && (
            <div className="mat-passo">
              <p style={{ margin: '0 0 8px' }}><b>Passo {passo + 1}.</b> <TestoMat t={corrente.domanda} /></p>
              <div className="mat-opts">
                {corrente.opzioni.map((o, k) => {
                  const sel = scelta === k
                  return (
                    <button key={k} type="button" className={'mat-opt' + (sel ? (o.giusta ? ' good' : ' bad') : '')} disabled={scelta !== null && corrente.opzioni[scelta]!.giusta} onClick={() => setScelta(k)}>
                      <span><TestoMat t={o.testo} /></span>
                      {sel && <span className="mat-why" role="status">{o.giusta ? '✓ ' : '✗ '}<TestoMat t={o.perche} /></span>}
                    </button>
                  )
                })}
              </div>
              {scelta !== null && corrente.opzioni[scelta]!.giusta && <div className="mat-bt"><button type="button" className="btn on" onClick={prossimo}><Con i="avanti" fine>{passo + 1 < ex.passi.length ? 'Avanti' : 'Vedi il risultato'}</Con></button></div>}
            </div>
          )}
          {finito && (
            <>
              <p className="mat-grande"><TestoMat t={ex.passi[ex.passi.length - 1]!.dopo} /></p>
              {r.esercizi.length > 1 && <div className="mat-bt"><button type="button" className="btn on" onClick={altro}>Un altro esercizio</button></div>}
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ───── 4 · Ripassa ───── */
function Ripassa({ r, piena, nomeDi, ripassata, segna }: { r: Regola; piena: boolean; nomeDi: (id: string) => string; ripassata: boolean; segna: () => void }): ReactNode {
  const [svela, setSvela] = useState(false)
  if (!piena) {
    return (
      <>
        <p className="mat-anteprima mat-sfoca" aria-hidden="true">{r.formula ? <Formula grande testo={r.formula} /> : <TestoMat t={r.fai} />}</p>
        <p className="mat-nota">{ripassata ? '✓ ripassata' : 'prova a ricordarla, poi svela'}</p>
      </>
    )
  }
  return (
    <div className="mat-corpo">
      <p className="mat-par">Prova a dirla a voce, poi svela.</p>
      <div className={'mat-vela' + (svela ? '' : ' mat-sfoca')} aria-hidden={!svela}>
        {r.formula && <div className="mat-blocco" style={tinta(COL.formula)}><Etichetta c={COL.formula}>Formula</Etichetta><p className="mat-grande"><Formula grande testo={r.formula} /></p></div>}
        <div className="mat-blocco" style={tinta('#22a565')}><Etichetta c="#22a565">Cosa fai</Etichetta><p className="mat-par" style={{ margin: 0 }}><TestoMat t={r.fai} /></p></div>
        {r.errore && <div className="mat-blocco" style={tinta(COL.errore)}><Etichetta c={COL.errore}>Errore tipico</Etichetta><p className="mat-par" style={{ margin: 0 }}><TestoMat t={r.errore} /></p></div>}
        {r.confondi.length > 0 && (
          <div className="mat-blocco" style={tinta(COL.confondi)}>
            <Etichetta c={COL.confondi}>Da non confondere con</Etichetta>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{r.confondi.map((c, k) => <li key={k}><strong>{nomeDi(c.con)}</strong>: <TestoMat t={c.differenza} /></li>)}</ul>
          </div>
        )}
      </div>
      <div className="mat-bt">
        <button type="button" className="btn" aria-pressed={svela} onClick={() => setSvela(!svela)}><Con i={svela ? 'occhioBarrato' : 'occhio'}>{svela ? 'Nascondi' : 'Svela'}</Con></button>
        <button type="button" className={'btn' + (ripassata ? ' on' : '')} aria-pressed={ripassata} onClick={segna}><Con i="spunta">{ripassata ? 'Ripassata' : 'L\'ho ricordata'}</Con></button>
      </div>
    </div>
  )
}
