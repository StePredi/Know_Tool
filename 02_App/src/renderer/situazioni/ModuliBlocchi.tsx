/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react'
import { Con, Icona } from '../componenti/Icona'
import {
  TONI_STRATO, disegnoNuovo, formAStrato, frecceAllineate, stratoAForm, tabellaAggiungiColonna, tabellaAggiungiRiga, tabellaImposta,
  tabellaSpostaRiga, tabellaTogliColonna, tabellaTogliRiga, type Blocco
} from '@shared/bloccoSpiegazione'
import { Comandi, Mini, Riga1, Testo, muovi } from './ModificaScheda'

// Moduli a campi per i blocchi carte, tabella, comandi e disegno (specifiche/modifica_spiegazioni.md, passo 2).
// Ogni modulo riceve il valore del blocco (quello che sta sotto la chiave) e lo restituisce modificato;
// i campi vuoti facoltativi si tolgono al salvataggio (puliziaBlocco), non mentre si scrive.

type On<T = any> = (v: T) => void
const copia = <T,>(v: T): T => structuredClone(v)
const Etichetta = ({ children }: { children: ReactNode }): ReactNode => <span className="m-l">{children}</span>

/** Un elenco di righe di testo con sposta / togli / aggiungi (punti, frecce…). */
function ElencoTesti({ v, on, nome, aggiungi, minimo = 0, righe = 1 }: { v: string[]; on: On<string[]>; nome: string; aggiungi: string; minimo?: number; righe?: number }): ReactNode {
  return (
    <div className="m-lista">
      {v.map((x, i, arr) => (
        <div key={i} className="m-coppia">
          <div className="m-coppia-c"><Testo v={x} righe={righe} on={(s) => { const c = arr.slice(); c[i] = s; on(c) }} /></div>
          <Comandi i={i} n={arr.length} sposta={(d) => { const c = arr.slice(); muovi(c, i, d); on(c) }} togli={() => { if (arr.length > minimo) on(arr.filter((_, k) => k !== i)) }} />
        </div>
      ))}
      <button type="button" className="btn" aria-label={`${aggiungi} (${nome})`} onClick={() => on([...v, ''])}><Con i="piu">{aggiungi}</Con></button>
    </div>
  )
}

// ───────── Carte ─────────
export function FormCarte({ v, on }: { v: Blocco[]; on: On<Blocco[]> }): ReactNode {
  const imp = (i: number, k: string, x: unknown): void => { const c = copia(v); (c[i] as any)[k] = x; on(c) }
  return (
    <div className="m-bl-campo">
      <Etichetta>Carte</Etichetta>
      {v.map((c, i, arr) => (
        <div key={i} className="m-card">
          <div className="m-card-t">
            <span className="m-n">{i + 1}</span>
            <Riga1 v={c.titolo} ph="Titolo della carta" on={(s) => imp(i, 'titolo', s)} />
            <Comandi i={i} n={arr.length} sposta={(d) => { const x = copia(v); muovi(x, i, d); on(x) }} togli={() => { if (arr.length > 1) on(v.filter((_, k) => k !== i)) }} />
          </div>
          <div className="m-griglia">
            <label className="m-f"><Etichetta>Sotto il titolo</Etichetta><Riga1 v={c.sotto ?? ''} on={(s) => imp(i, 'sotto', s)} /></label>
            <label className="m-f"><Etichetta>Etichetta (pillola)</Etichetta><Riga1 v={c.etichetta ?? ''} ph="per esempio Consigliato" on={(s) => imp(i, 'etichetta', s)} /></label>
          </div>
          <label className="m-f largo"><Etichetta>Testo</Etichetta><Testo v={c.testo ?? ''} on={(s) => imp(i, 'testo', s)} /></label>
          <div className="m-f largo">
            <Etichetta>Punti</Etichetta>
            <ElencoTesti v={c.punti ?? []} nome={`carta ${i + 1}`} aggiungi="Punto" on={(x) => imp(i, 'punti', x)} />
          </div>
          <div className="m-f largo">
            <Etichetta>Numeri grandi</Etichetta>
            {(c.numeri ?? []).map((n: Blocco, k: number, na: Blocco[]) => (
              <div key={k} className="m-coppia">
                <div className="m-coppia-c">
                  <Riga1 v={n.valore} ph="Valore (16 GB)" on={(s) => { const x = copia(na); x[k]!.valore = s; imp(i, 'numeri', x) }} />
                  <Riga1 v={n.cosa ?? ''} ph="Cosa indica" on={(s) => { const x = copia(na); x[k]!.cosa = s; imp(i, 'numeri', x) }} />
                </div>
                <Comandi i={k} n={na.length} sposta={(d) => { const x = copia(na); muovi(x, k, d); imp(i, 'numeri', x) }} togli={() => imp(i, 'numeri', na.filter((_: Blocco, j: number) => j !== k))} />
              </div>
            ))}
            <button type="button" className="btn" onClick={() => imp(i, 'numeri', [...(c.numeri ?? []), { valore: '', cosa: '' }])}><Con i="piu">Numero</Con></button>
          </div>
        </div>
      ))}
      <button type="button" className="btn on" onClick={() => on([...v, { titolo: '' }])}><Con i="piu">Carta</Con></button>
    </div>
  )
}

// ───────── Tabella ─────────
export function FormTabella({ v, on }: { v: { colonne: string[]; righe: string[][] }; on: On }): ReactNode {
  return (
    <div className="m-bl-campo">
      <Etichetta>Tabella · la prima colonna è quella dei nomi</Etichetta>
      <div className="m-tab-scroll">
        <table className="m-tab">
          <thead>
            <tr>
              <th aria-label="Righe" />
              {v.colonne.map((c, i) => (
                <th key={i}>
                  <div className="m-tab-th">
                    <Riga1 v={c} ph={`Colonna ${i + 1}`} on={(s) => { const t = copia(v); t.colonne[i] = s; on(t) }} />
                    <Mini nome={`Togli la colonna ${i + 1}`} disabled={v.colonne.length <= 2} onClick={() => on(tabellaTogliColonna(v, i))}><Icona nome="cestino" size={12} /></Mini>
                  </div>
                </th>
              ))}
              <th><button type="button" className="btn" onClick={() => on(tabellaAggiungiColonna(v))}><Con i="piu">Colonna</Con></button></th>
            </tr>
          </thead>
          <tbody>
            {v.righe.map((r, ri) => (
              <tr key={ri}>
                <td className="m-tab-cmd">
                  <Comandi i={ri} n={v.righe.length} sposta={(d) => on(tabellaSpostaRiga(v, ri, d < 0 ? -1 : 1))} togli={() => on(tabellaTogliRiga(v, ri))} />
                </td>
                {v.colonne.map((_, ci) => (
                  <td key={ci}><Riga1 v={r[ci] ?? ''} on={(s) => on(tabellaImposta(v, ri, ci, s))} /></td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn" onClick={() => on(tabellaAggiungiRiga(v))}><Con i="piu">Riga</Con></button>
    </div>
  )
}

// ───────── Comandi ─────────
export function FormComandi({ v, on }: { v: Blocco[]; on: On<Blocco[]> }): ReactNode {
  return (
    <div className="m-bl-campo">
      <Etichetta>Comandi · il comando e cosa fa</Etichetta>
      {v.map((c, i, arr) => (
        <div key={i} className="m-coppia">
          <div className="m-coppia-c">
            <Testo v={c.codice} righe={1} mono on={(s) => { const x = copia(v); x[i]!.codice = s; on(x) }} />
            <Riga1 v={c.spiega} ph="Cosa fa" on={(s) => { const x = copia(v); x[i]!.spiega = s; on(x) }} />
          </div>
          <Comandi i={i} n={arr.length} sposta={(d) => { const x = copia(v); muovi(x, i, d); on(x) }} togli={() => { if (arr.length > 1) on(v.filter((_, k) => k !== i)) }} />
        </div>
      ))}
      <button type="button" className="btn" onClick={() => on([...v, { codice: '', spiega: '' }])}><Con i="piu">Comando</Con></button>
    </div>
  )
}

// ───────── Disegno ─────────
const SelTono = ({ v, on, nome }: { v: string; on: On<string>; nome: string }): ReactNode => (
  <select className="inp" aria-label={nome} value={v || 'chiaro'} onChange={(e) => on(e.target.value)}>
    {TONI_STRATO.map((t) => <option key={t} value={t}>{t}</option>)}
  </select>
)

function FormPile({ v, on }: { v: Blocco; on: On }): ReactNode {
  const col = (i: number, fn: (c: Blocco) => void): void => { const d = copia(v); fn(d.colonne[i]); on(d) }
  return (
    <>
      {(v.colonne as Blocco[]).map((c, i, arr) => (
        <div key={i} className="m-card">
          <div className="m-card-t">
            <span className="m-n">{i + 1}</span>
            <Riga1 v={c.titolo ?? ''} ph="Titolo della colonna (facoltativo)" on={(s) => col(i, (x) => { x.titolo = s })} />
            <Comandi i={i} n={arr.length} sposta={(d) => { const x = copia(v); muovi(x.colonne, i, d); on(x) }} togli={() => { if (arr.length > 1) on({ ...v, colonne: arr.filter((_, k) => k !== i) }) }} />
          </div>
          <div className="m-griglia">
            <label className="m-f"><Etichetta>Cornice tratteggiata</Etichetta><Riga1 v={c.cornice ?? ''} ph="per esempio Sistema host" on={(s) => col(i, (x) => { x.cornice = s })} /></label>
            <label className="m-f"><Etichetta>Nota sotto la colonna</Etichetta><Riga1 v={c.nota ?? ''} on={(s) => col(i, (x) => { x.nota = s })} /></label>
          </div>
          <Etichetta>Livelli, dall&apos;alto in basso · riquadri affiancati separati da « | »</Etichetta>
          {(c.strati as unknown[]).map((s, k, sa) => {
            const f = stratoAForm(s)
            return (
              <div key={k} className="m-coppia">
                <div className="m-coppia-c due">
                  <Riga1 v={f.testo} ph="Testo del livello" on={(t) => col(i, (x) => { x.strati[k] = formAStrato({ ...f, testo: t }) })} />
                  <SelTono v={f.tono} nome={`Tono del livello ${k + 1}`} on={(t) => col(i, (x) => { x.strati[k] = formAStrato({ ...f, tono: t }) })} />
                </div>
                <Comandi i={k} n={sa.length} sposta={(d) => col(i, (x) => muovi(x.strati, k, d))} togli={() => { if (sa.length > 1) col(i, (x) => x.strati.splice(k, 1)) }} />
              </div>
            )
          })}
          <button type="button" className="btn" onClick={() => col(i, (x) => x.strati.push(''))}><Con i="piu">Livello</Con></button>
        </div>
      ))}
      <button type="button" className="btn on" onClick={() => on({ ...v, colonne: [...v.colonne, { titolo: '', strati: [''] }] })}><Con i="piu">Colonna</Con></button>
    </>
  )
}

function FormFlusso({ v, on }: { v: Blocco; on: On }): ReactNode {
  const nodi = (v.nodi as unknown[]).map((n) => (typeof n === 'string' ? { nome: n } : (n as Blocco)))
  const frecce = frecceAllineate(v.frecce ?? [], nodi.length)
  const set = (n: Blocco[], f: string[] = frecce): void => on({ ...v, nodi: n, frecce: frecceAllineate(f, n.length) })
  const imp = (i: number, k: string, x: unknown): void => { const n = copia(nodi); (n[i] as any)[k] = x; set(n) }
  const gr = v.gruppo as { nome: string; da: number; a: number } | undefined
  return (
    <>
      {nodi.map((n, i) => (
        <div key={i}>
          <div className="m-card">
            <div className="m-card-t">
              <span className="m-n">{i + 1}</span>
              <Riga1 v={n.nome ?? ''} ph="Nome del riquadro" on={(s) => imp(i, 'nome', s)} />
              <Comandi i={i} n={nodi.length} sposta={(d) => { const x = copia(nodi); muovi(x, i, d); set(x) }} togli={() => { if (nodi.length > 2) set(nodi.filter((_, k) => k !== i), frecce.filter((_, k) => k !== Math.min(i, frecce.length - 1))) }} />
            </div>
            <div className="m-griglia">
              <label className="m-f"><Etichetta>Sotto il nome</Etichetta><Riga1 v={n.sotto ?? ''} on={(s) => imp(i, 'sotto', s)} /></label>
              <label className="m-f"><Etichetta>Tono</Etichetta><SelTono v={n.tono ?? 'chiaro'} nome={`Tono del riquadro ${i + 1}`} on={(t) => imp(i, 'tono', t)} /></label>
            </div>
            <div className="m-f largo"><Etichetta>Punti dentro il riquadro</Etichetta><ElencoTesti v={n.punti ?? []} nome={`riquadro ${i + 1}`} aggiungi="Punto" on={(x) => imp(i, 'punti', x)} /></div>
          </div>
          {i < nodi.length - 1 && (
            <label className="m-f m-freccia"><Etichetta>↓ Freccia fra {i + 1} e {i + 2}: cosa passa</Etichetta><Riga1 v={frecce[i] ?? ''} ph="per esempio richiesta HTTP (vuoto = senza scritta)" on={(s) => { const f = frecce.slice(); f[i] = s; on({ ...v, frecce: f }) }} /></label>
          )}
        </div>
      ))}
      <button type="button" className="btn on" onClick={() => set([...nodi, { nome: '' }], [...frecce, ''])}><Con i="piu">Riquadro</Con></button>
      <div className="m-card">
        <Etichetta>Gruppo tratteggiato attorno ai riquadri (facoltativo)</Etichetta>
        <div className="m-griglia">
          <Riga1 v={gr?.nome ?? ''} ph="Nome del gruppo (vuoto = nessun gruppo)" on={(s) => on({ ...v, gruppo: { nome: s, da: gr?.da ?? 1, a: gr?.a ?? nodi.length } })} />
          <div className="m-coppia-c due">
            <input className="inp" type="number" min={1} max={nodi.length} aria-label="Dal riquadro" value={gr?.da ?? 1} onChange={(e) => on({ ...v, gruppo: { nome: gr?.nome ?? '', da: Number(e.target.value) || 1, a: gr?.a ?? nodi.length } })} />
            <input className="inp" type="number" min={1} max={nodi.length} aria-label="Al riquadro" value={gr?.a ?? nodi.length} onChange={(e) => on({ ...v, gruppo: { nome: gr?.nome ?? '', da: gr?.da ?? 1, a: Number(e.target.value) || nodi.length } })} />
          </div>
        </div>
      </div>
    </>
  )
}

export function FormDisegno({ v, on }: { v: Blocco; on: On }): ReactNode {
  const cambia = (m: 'pile' | 'flusso'): void => { if (m !== v.modello) on(disegnoNuovo(m)) }
  return (
    <div className="m-bl-campo">
      <Etichetta>Disegno</Etichetta>
      <div className="m-tabs" role="tablist" aria-label="Modello del disegno">
        <button type="button" role="tab" aria-selected={v.modello === 'pile'} onClick={() => cambia('pile')}>Pile (livelli)</button>
        <button type="button" role="tab" aria-selected={v.modello === 'flusso'} onClick={() => cambia('flusso')}>Flusso (frecce)</button>
      </div>
      {v.modello === 'pile' ? <FormPile v={v} on={on} /> : <FormFlusso v={v} on={on} />}
      <label className="m-f largo"><Etichetta>Nota sotto il disegno</Etichetta><Riga1 v={v.nota ?? ''} on={(s) => on({ ...v, nota: s })} /></label>
    </div>
  )
}
