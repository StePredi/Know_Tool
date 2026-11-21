/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from 'react'
import YAML from 'yaml'
import { Con } from '../componenti/Icona'
import {
  BLOCCHI_SEMPLICI, NOME_BLOCCO, TIPI_BLOCCO, aggiungiBlocco, bloccoVuoto, eliminaBlocco, riassuntoBlocco, spostaBlocco, tipoBlocco,
  type Blocco, type TipoBlocco
} from '@shared/bloccoSpiegazione'
import { Comandi, Riga1, Testo } from './ModificaScheda'
import { FormCarte, FormComandi, FormDisegno, FormTabella } from './ModuliBlocchi'

// Modifica a moduli dei blocchi di una scheda «spiegazione» (specifiche/modifica_spiegazioni.md, passo 1):
// elenco dei blocchi con sposta / elimina / aggiungi; titolo, testo, punti, nota e trappola hanno i loro campi,
// carte, tabella, disegno e comandi si modificano come testo YAML del solo blocco.

interface Props {
  blocchi: Blocco[]
  /** applica una modifica ai blocchi della scheda (la scheda intera la gestisce ModificaScheda) */
  cambia: (fn: (blocchi: Blocco[]) => Blocco[]) => void
}

const AIUTO: Partial<Record<TipoBlocco, string>> = {
  titolo: 'Titolo di una parte della spiegazione',
  testo: 'Un paragrafo. Nel testo: **grassetto**, `codice`, formule come nelle schede di Matematica',
  nota: 'Una nota a margine',
  trappola: "L'errore tipico da evitare"
}

export function ModificaSpiegazione({ blocchi, cambia }: Props): ReactNode {
  const [sel, setSel] = useState(0)
  const [menu, setMenu] = useState(false)
  const [chiedi, setChiedi] = useState<number | null>(null)
  /** cambia a ogni scelta/spostamento/eliminazione: il modulo del blocco riparte dal blocco giusto */
  const [ver, setVer] = useState(0)
  const pos = Math.min(sel, blocchi.length - 1)
  const b = blocchi[pos]

  useEffect(() => { if (sel !== pos) setSel(Math.max(pos, 0)) }, [sel, pos])

  const sposta = (i: number, d: -1 | 1): void => {
    const r = spostaBlocco(blocchi, i, d)
    cambia((x) => spostaBlocco(x, i, d).blocchi)
    setSel(r.pos); setChiedi(null); setVer((v) => v + 1)
  }
  const togli = (i: number): void => {
    cambia((x) => eliminaBlocco(x, i).blocchi)
    setSel(Math.max(0, Math.min(i, blocchi.length - 2))); setChiedi(null); setVer((v) => v + 1)
  }
  const aggiungi = (t: TipoBlocco): void => {
    const r = aggiungiBlocco(blocchi, t, blocchi.length ? pos : -1)
    cambia((x) => aggiungiBlocco(x, t, blocchi.length ? pos : -1).blocchi)
    setSel(r.pos); setMenu(false); setChiedi(null); setVer((v) => v + 1)
  }
  const imposta = (i: number, v: Blocco): void => cambia((x) => x.map((y, k) => (k === i ? v : y)))

  return (
    <section className="m-sez">
      <h2>Blocchi della spiegazione</h2>
      <p className="m-nota">Ogni blocco è un pezzo di spiegazione. Scegline uno per modificarlo; con le frecce lo sposti, con il cestino lo togli.</p>
      <div className="m-bl-ed">
        <div className="m-bl-lista" role="list" aria-label="Blocchi">
          {blocchi.map((x, i) => {
            const t = tipoBlocco(x)
            return (
              <div key={i} role="listitem" className={'m-bl' + (i === pos ? ' sel' : '')}>
                <button type="button" className="m-bl-v" aria-current={i === pos} onClick={() => { setSel(i); setChiedi(null); setVer((v) => v + 1) }}>
                  <span className="m-bl-k">{t ? NOME_BLOCCO[t] : '?'}</span>
                  <span className="m-bl-x">{riassuntoBlocco(x)}</span>
                </button>
                {chiedi === i ? (
                  <span className="m-bl-conf" role="alert">
                    Eliminare? <button type="button" className="btn" onClick={() => togli(i)}>Sì</button> <button type="button" className="btn" onClick={() => setChiedi(null)}>No</button>
                  </span>
                ) : (
                  <Comandi i={i} n={blocchi.length} sposta={(d) => sposta(i, d < 0 ? -1 : 1)} togli={() => (bloccoVuoto(x) ? togli(i) : setChiedi(i))} />
                )}
              </div>
            )
          })}
          <button type="button" className="btn on" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Con i="piu">Blocco</Con></button>
          {menu && (
            <div className="m-bl-menu" role="menu" aria-label="Tipo di blocco">
              {TIPI_BLOCCO.map((t) => <button key={t} type="button" role="menuitem" className="btn" onClick={() => aggiungi(t)}>{NOME_BLOCCO[t]}</button>)}
            </div>
          )}
        </div>
        <div className="m-bl-form">{b ? <FormBlocco key={pos + ':' + ver} b={b} on={(v) => imposta(pos, v)} /> : <p className="m-nota">Nessun blocco: aggiungine uno.</p>}</div>
      </div>
    </section>
  )
}

function FormBlocco({ b, on }: { b: Blocco; on: (b: Blocco) => void }): ReactNode {
  const t = tipoBlocco(b)
  if (!t) return <p role="alert" className="s-avv">Blocco non riconosciuto: si modifica dal «Testo (YAML)».</p>
  if (!BLOCCHI_SEMPLICI.includes(t)) return <BloccoComplesso b={b} on={on} t={t} />
  const v = b[t]
  return (
    <div className="m-bl-campo">
      <span className="m-l">{NOME_BLOCCO[t]}</span>
      {t === 'punti' ? (
        <>
          {(v as string[]).map((p, i, arr) => (
            <div key={i} className="m-coppia">
              <div className="m-coppia-c"><Testo v={p} righe={1} on={(s) => { const c = arr.slice(); c[i] = s; on({ punti: c }) }} /></div>
              <Comandi i={i} n={arr.length} sposta={(d) => { const c = arr.slice(); const j = i + d; if (j >= 0 && j < c.length) { [c[i], c[j]] = [c[j]!, c[i]!]; on({ punti: c }) } }} togli={() => { if (arr.length > 1) on({ punti: arr.filter((_, k) => k !== i) }) }} />
            </div>
          ))}
          <button type="button" className="btn" onClick={() => on({ punti: [...(v as string[]), ''] })}><Con i="piu">Punto</Con></button>
        </>
      ) : t === 'titolo' ? (
        <Riga1 v={v} on={(s) => on({ titolo: s })} />
      ) : (
        <Testo v={v} righe={t === 'testo' ? 4 : 2} on={(s) => on({ [t]: s })} />
      )}
      {AIUTO[t] && <span className="m-h">{AIUTO[t]}</span>}
    </div>
  )
}

/** Carte, tabella, comandi, disegno: modulo a campi, oppure il testo YAML del solo blocco. */
function BloccoComplesso({ b, on, t }: { b: Blocco; on: (b: Blocco) => void; t: TipoBlocco }): ReactNode {
  const [vista, setVista] = useState<'campi' | 'yaml'>('campi')
  const v = b[t]
  return (
    <div className="m-bl-campo">
      <div className="m-tabs" role="tablist" aria-label="Come modificare il blocco">
        <button type="button" role="tab" aria-selected={vista === 'campi'} onClick={() => setVista('campi')}>Campi</button>
        <button type="button" role="tab" aria-selected={vista === 'yaml'} onClick={() => setVista('yaml')}>Testo (YAML)</button>
      </div>
      {vista === 'yaml' ? <BloccoYaml b={b} on={on} t={t} />
        : t === 'carte' ? <FormCarte v={v} on={(x) => on({ carte: x })} />
        : t === 'tabella' ? <FormTabella v={v} on={(x) => on({ tabella: x })} />
        : t === 'comandi' ? <FormComandi v={v} on={(x) => on({ comandi: x })} />
        : <FormDisegno v={v} on={(x) => on({ disegno: x })} />}
    </div>
  )
}

/** Il testo YAML del solo blocco, con l'errore sotto se non si legge. */
function BloccoYaml({ b, on, t }: { b: Blocco; on: (b: Blocco) => void; t: TipoBlocco }): ReactNode {
  const [src, setSrc] = useState(() => YAML.stringify(b, { lineWidth: 0 }))
  const [err, setErr] = useState('')
  const cambia = (s: string): void => {
    setSrc(s)
    try {
      const o = YAML.parse(s) as Blocco
      if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('Deve cominciare con «' + t + ':»')
      if (Object.keys(o).length !== 1 || tipoBlocco(o) === null) throw new Error('Un blocco ha una sola voce fra: ' + TIPI_BLOCCO.join(', '))
      setErr(''); on(o)
    } catch (e) {
      setErr((e as Error).message)
    }
  }
  return (
    <div className="m-bl-campo">
      <span className="m-l">{NOME_BLOCCO[t]} · testo YAML del blocco</span>
      <textarea className="inp m-yaml mono" rows={Math.min(22, Math.max(6, src.split('\n').length + 1))} spellCheck={false} aria-label={`Testo YAML del blocco ${NOME_BLOCCO[t]}`} value={src} onChange={(e) => cambia(e.target.value)} />
      {err && <span role="alert" className="s-avv">{err}</span>}
    </div>
  )
}
