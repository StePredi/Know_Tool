import { useState } from 'react'
import { citaDa, daSistemare, etichettaPosizione, parole } from '@shared/testo'
import type { Annotazione, Esercizio, Evidenzia, Parafrasi, Passo, Span, TipoFigura, VoceScritta } from '@shared/types'
import { useStore } from '../store'
import { Campo } from '../utili'
import { useEditor } from './stato'
import { correnteDi, eliminaVoce, salvaRaccolta, salvaVoce, scriviCampoAnnotazione, spanUguale, useTesto } from './dati'

export const NOME_EV: Record<Evidenzia, string> = { concetto: 'Concetto', definizione: 'Definizione', dubbio: 'Dubbio' }
const TIPI: Record<TipoFigura, string> = { suono: 'Suono', ordine: 'Ordine', significato: 'Significato', sintassi: 'Sintassi' }

/** Una voce con l'ancora scrivibile: se è rotta si riporta lo span scritto nel file, così non si perde. */
const scrivibile = <T extends { span: Span | null; spanScritto: Span | null }>(v: T): VoceScritta => ({ ...v, span: v.span ?? v.spanScritto }) as unknown as VoceScritta

const Vuoto = ({ t }: { t: string }) => <p style={{ color: 'var(--mute)', fontSize: 14, margin: '8px 2px' }}>{t}</p>

// ------------------------------------------------------------------ annotazioni

export function PannelloAnnotazioni() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk, modello } = d
  const [esteso, setEsteso] = useState(false)
  const [filtro, setFiltro] = useState<'tutte' | Evidenzia | 'figura' | 'nota' | 'flashcard' | 'sottolinea' | 'parola_chiave'>('tutte')
  const sel = ed.sel
  const cur = correnteDi(testo, sel)
  const citato = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const rotte = testo.annotazioni.filter((a) => daSistemare(a.stato))
  const riag = testo.annotazioni.filter((a) => a.stato === 'riagganciata')
  const passa = (a: Annotazione): boolean => {
    if (filtro === 'tutte') return true
    if (filtro === 'figura') return !!a.figura
    if (filtro === 'nota') return !!a.nota.trim()
    if (filtro === 'concetto' || filtro === 'definizione' || filtro === 'dubbio') return a.evidenzia === filtro
    return a[filtro]
  }
  const lista = testo.annotazioni.filter((a) => !daSistemare(a.stato) && passa(a)).sort((a, b) => a.span![0] - b.span![0] || b.span![1] - a.span![1])
  const figure = modello.figure
  const [nuovaScheda, setNuovaScheda] = useState('')
  const [nuovaFrase, setNuovaFrase] = useState('')

  const scrivi = (campi: Partial<Annotazione>): void => {
    if (sel) void scriviCampoAnnotazione(testo, sel, citato, campi)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rotte.length > 0 && (
        <section className="note" aria-label="Da riagganciare">
          <h4 className="h3s" style={{ color: 'inherit' }}>Da riagganciare · {rotte.length}</h4>
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>Il testo è cambiato e questi passi non si trovano più. Seleziona il nuovo passo nel testo e premi «Riaggancia».</p>
          {rotte.map((a) => (
            <div key={a.id} style={{ borderTop: '1px solid var(--warn-line)', padding: '7px 0', fontSize: 13.5 }}>
              <div>«{a.citato ?? '…'}» {a.stato === 'ambigua' && <b>· compare più volte</b>}</div>
              <button type="button" className="btn" disabled={!sel} style={{ marginTop: 5, padding: '4px 10px' }} onClick={() => void salvaVoce(testo.id, 'annotazioni', { id: a.id, span: sel, citato })}>Riaggancia sulla selezione</button>
              <button type="button" className="btn" style={{ marginTop: 5, marginLeft: 6, padding: '4px 10px' }} onClick={() => void eliminaVoce(testo.id, 'annotazioni', a.id)}>Elimina</button>
            </div>
          ))}
        </section>
      )}
      {riag.length > 0 && (
        <section className="note" aria-label="Riagganciate da sole">
          <h4 className="h3s" style={{ color: 'inherit' }}>Riagganciate da sole · {riag.length}</h4>
          {riag.map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '4px 0' }}>
              <span style={{ flex: 1 }}>«{a.citato}» ora è a {etichettaPosizione(tk, a.span, testo.layout)}</span>
              <button type="button" className="btn" style={{ padding: '3px 10px' }} onClick={() => void salvaVoce(testo.id, 'annotazioni', { id: a.id, span: a.span, citato: a.citato })}>Ok</button>
            </div>
          ))}
        </section>
      )}

      <section aria-label="Passo selezionato" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '11px 12px', background: 'var(--surface)' }}>
        <h4 className="h3s">Passo selezionato</h4>
        {!sel ? (
          <Vuoto t="Seleziona delle parole nel testo (trascina o usa ← → con Maiusc)." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <blockquote style={{ margin: 0, borderLeft: '3px solid var(--ink)', paddingLeft: 10, fontSize: 14.5 }}>
              {citato} <span style={{ color: 'var(--mute)', fontSize: 12 }}>· {etichettaPosizione(tk, sel, testo.layout)} · {parole(citato).length} parole</span>
            </blockquote>
            <label className="lbl">Figura retorica
              <select className="inp big" value={cur?.figura ?? ''} onChange={(e) => scrivi({ figura: e.target.value || null })}>
                <option value="">— nessuna —</option>
                {(Object.keys(TIPI) as TipoFigura[]).map((t) => (
                  <optgroup key={t} label={TIPI[t]}>
                    {figure.filter((f) => f.tipo === t).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            {cur?.figura && <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>{figure.find((f) => f.id === cur.figura)?.descrizione}</p>}
            <label className="lbl">Nota
              <Campo multi rows={3} className="inp big" label="Nota sul passo" placeholder="Scrivi qui (N)…" valore={cur?.nota ?? ''} salva={(v) => scrivi({ nota: v })} refEl={undefined} />
            </label>
            <div>
              <div className="lbl" style={{ marginBottom: 5 }}>Schede collegate</div>
              {(cur?.schede ?? []).map((c) => {
                const s = modello.schede.find((x) => x.id === c.id)
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13.5, padding: '3px 0' }}>
                    <button type="button" className="btn" style={{ padding: '2px 8px' }} title="Apri la scheda" onClick={() => useStore.getState().imposta({ apertaId: c.id, selId: c.id })}>{s?.titolo_breve ?? c.id}</button>
                    <span style={{ flex: 1, color: 'var(--mute)' }}>{c.frase}</span>
                    <button type="button" aria-label="Scollega la scheda" className="btn" style={{ padding: '0 7px' }} onClick={() => scrivi({ schede: (cur?.schede ?? []).filter((x) => x.id !== c.id) })}>✕</button>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                <select className="inp" style={{ flex: '1 1 130px' }} aria-label="Scheda da collegare" value={nuovaScheda} onChange={(e) => setNuovaScheda(e.target.value)}>
                  <option value="">+ collega una scheda…</option>
                  {modello.schede.map((s) => <option key={s.id} value={s.id}>{s.titolo_breve}</option>)}
                </select>
                <input className="inp" style={{ flex: '2 1 150px' }} placeholder="frase di collegamento" aria-label="Frase di collegamento" value={nuovaFrase} onChange={(e) => setNuovaFrase(e.target.value)} />
                <button type="button" className="btn" disabled={!nuovaScheda} onClick={() => {
                  scrivi({ schede: [...(cur?.schede ?? []).filter((x) => x.id !== nuovaScheda), { id: nuovaScheda, frase: nuovaFrase.trim() }] })
                  setNuovaScheda('')
                  setNuovaFrase('')
                }}>Aggiungi</button>
              </div>
            </div>
            {cur && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn" onClick={() => ed.imposta({ annDet: cur.id })}>Apri la scheda del passo</button>
                <button type="button" className="btn" onClick={() => void eliminaVoce(testo.id, 'annotazioni', cur.id)}>Togli tutto da qui</button>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-label="Elenco annotazioni">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <h4 className="h3" style={{ flex: 1 }}>Tutte · {lista.length}</h4>
          <select className="inp" style={{ width: 'auto' }} aria-label="Filtra" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
            <option value="tutte">Tutte</option><option value="concetto">Concetti</option><option value="definizione">Definizioni</option><option value="dubbio">Dubbi</option>
            <option value="figura">Con figura</option><option value="nota">Con nota</option><option value="parola_chiave">Parole chiave</option><option value="flashcard">Flashcard</option><option value="sottolinea">Sottolineati</option>
          </select>
          <button type="button" className="btn" style={{ padding: '4px 10px' }} aria-pressed={esteso} onClick={() => setEsteso(!esteso)}>{esteso ? 'Compatta' : 'Estesa'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {lista.map((a) => (
            <button key={a.id} type="button" className="voce" aria-pressed={spanUguale(sel, a.span)} onClick={() => ed.imposta({ sel: a.span, anchor: a.span![0], testa: a.span![1] })} onDoubleClick={() => ed.imposta({ annDet: a.id })}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
                <b style={{ color: 'var(--mute)' }}>{etichettaPosizione(tk, a.span, testo.layout)}</b>
                {a.evidenzia && <span className="pill" style={{ background: `var(--hl-${a.evidenzia})` }}>{NOME_EV[a.evidenzia]}</span>}
                {a.sottolinea && <span className="pill">sottolineato</span>}
                {a.parola_chiave && <span className="pill">parola chiave</span>}
                {a.flashcard && <span className="pill">flashcard</span>}
                {a.figura && <span className="pill">{figure.find((f) => f.id === a.figura)?.nome ?? a.figura}</span>}
              </div>
              <div style={{ fontSize: 14, marginTop: 3, ...(esteso ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{a.citato}</div>
              {esteso && a.nota.trim() && <div style={{ fontSize: 13.5, color: 'var(--mute)', marginTop: 3 }}>{a.nota}</div>}
              {esteso && a.schede.length > 0 && <div style={{ fontSize: 12.5, marginTop: 3 }}>↔ {a.schede.map((c) => modello.schede.find((s) => s.id === c.id)?.titolo_breve ?? c.id).join(' · ')}</div>}
            </button>
          ))}
          {!lista.length && <Vuoto t="Nessuna annotazione con questo filtro." />}
        </div>
      </section>
    </div>
  )
}

// ------------------------------------------------------------------ parafrasi

export function PannelloParafrasi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk } = d
  const sel = ed.sel
  const citato = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const ordinate = testo.parafrasi.slice().sort((a, b) => a.ordine - b.ordine)

  const sposta = (p: Parafrasi, dir: -1 | 1): void => {
    const i = ordinate.findIndex((x) => x.id === p.id)
    const j = i + dir
    if (j < 0 || j >= ordinate.length) return
    const l = ordinate.slice()
    ;[l[i], l[j]] = [l[j]!, l[i]!]
    void salvaRaccolta(testo.id, 'parafrasi', l.map((x, k) => ({ ...scrivibile(x), ordine: k + 1 })))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn on" disabled={!sel} title="Tasto P" onClick={() => void salvaVoce(testo.id, 'parafrasi', { span: sel, citato, testo: '' })}>+ Parafrasi sulla selezione</button>
        <button type="button" className="btn" onClick={() => void salvaVoce(testo.id, 'parafrasi', { span: null, citato: null, testo: '' })}>+ Libera</button>
      </div>
      {ordinate.map((p, i) => (
        <article key={p.id} style={{ border: `1px solid ${daSistemare(p.stato) ? 'var(--warn-line)' : 'var(--line2)'}`, borderRadius: 12, padding: '9px 11px', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 5 }}>
            <b style={{ color: 'var(--mute)', flex: 1 }}>{p.span ? etichettaPosizione(tk, p.span, testo.layout) : daSistemare(p.stato) ? 'da riagganciare' : 'libera'}</b>
            <button type="button" className="btn" aria-label="Sposta su" disabled={i === 0} style={{ padding: '0 7px' }} onClick={() => sposta(p, -1)}>↑</button>
            <button type="button" className="btn" aria-label="Sposta giù" disabled={i === ordinate.length - 1} style={{ padding: '0 7px' }} onClick={() => sposta(p, 1)}>↓</button>
            {p.span && <button type="button" className="btn" style={{ padding: '0 8px' }} title="Scollega dal passo" onClick={() => void salvaVoce(testo.id, 'parafrasi', { id: p.id, span: null, citato: null })}>Scollega</button>}
            {!p.span && sel && <button type="button" className="btn" style={{ padding: '0 8px' }} onClick={() => void salvaVoce(testo.id, 'parafrasi', { id: p.id, span: sel, citato })}>Collega alla selezione</button>}
            <ConfermaElimina onConferma={() => void eliminaVoce(testo.id, 'parafrasi', p.id)} />
          </div>
          {(p.span || p.citato) && (
            <blockquote role="button" tabIndex={0} onClick={() => p.span && ed.imposta({ sel: p.span, anchor: p.span[0], testa: p.span[1] })} style={{ margin: '0 0 6px', borderLeft: '3px solid var(--line)', paddingLeft: 9, fontSize: 13.5, color: 'var(--mute)', cursor: 'pointer' }}>{p.span ? citaDa(testo.corpo, tk.token, p.span) : p.citato}</blockquote>
          )}
          <Campo multi rows={3} className="inp big" label="Parafrasi" placeholder="Scrivi la parafrasi con parole tue…" valore={p.testo} salva={(v) => void salvaVoce(testo.id, 'parafrasi', { id: p.id, testo: v })} />
        </article>
      ))}
      {!ordinate.length && <Vuoto t="Nessuna parafrasi. Seleziona un passo e premi «P»." />}
    </div>
  )
}

/** Doppio passaggio: il primo clic chiede conferma, il secondo elimina. */
export function ConfermaElimina({ onConferma, testo = '✕' }: { onConferma: () => void; testo?: string }) {
  const [sicuro, setSicuro] = useState(false)
  return (
    <button type="button" className="btn" aria-label="Elimina" style={{ padding: '0 8px', ...(sicuro ? { background: 'var(--err-bg)', color: 'var(--err-ink)', borderColor: 'var(--err-line)' } : {}) }} onBlur={() => setSicuro(false)} onClick={() => (sicuro ? onConferma() : setSicuro(true))}>
      {sicuro ? 'Sicuro?' : testo}
    </button>
  )
}

// ------------------------------------------------------------------ esercizi

type FiltroEs = 'tutti' | 'svolgere' | 'correggere' | 'corrette'
const statoEs = (e: Esercizio): FiltroEs => (e.fatta ? 'corrette' : e.risposta.trim() ? 'correggere' : 'svolgere')

export function PannelloEsercizi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk } = d
  const [filtro, setFiltro] = useState<FiltroEs>('tutti')
  const ordinati = testo.esercizi.slice().sort((a, b) => a.numero - b.numero)
  const visibili = ordinati.filter((e) => filtro === 'tutti' || statoEs(e) === filtro)
  const aperto = ordinati.find((e) => e.id === ed.esercizioAperto) ?? null
  const sel = ed.sel
  const salva = (id: string, campi: Record<string, unknown>): void => void salvaVoce(testo.id, 'esercizi', { id, ...campi })
  const conta = (f: FiltroEs): number => ordinati.filter((e) => statoEs(e) === f).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([['tutti', `Tutti · ${ordinati.length}`], ['svolgere', `Da svolgere · ${conta('svolgere')}`], ['correggere', `Da correggere · ${conta('correggere')}`], ['corrette', `Corrette · ${conta('corrette')}`]] as const).map(([k, t]) => (
          <button key={k} type="button" className={'chip' + (filtro === k ? ' on' : '')} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn on" onClick={async () => { const id = await salvaVoce(testo.id, 'esercizi', { testo: '', risposta: '', correzione: '', fatta: false, passi: [] }); if (id) ed.imposta({ esercizioAperto: id }) }}>+ Domanda</button>
        <button type="button" className="btn" disabled={!sel} title="Tasto D" onClick={async () => {
          const id = await salvaVoce(testo.id, 'esercizi', { testo: '', risposta: '', correzione: '', fatta: false, passi: [{ span: sel, citato: citaDa(testo.corpo, tk.token, sel), et: etichettaPosizione(tk, sel, testo.layout) }] })
          if (id) ed.imposta({ esercizioAperto: id })
        }}>Domanda dalla selezione</button>
        <button type="button" className="btn" onClick={() => ed.imposta({ importa: true })}>Importa…</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibili.map((e) => (
          <button key={e.id} type="button" className="voce" aria-pressed={aperto?.id === e.id} onClick={() => ed.imposta({ esercizioAperto: e.id })}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <b>{e.numero}.</b>
              <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.testo || '(domanda vuota)'}</span>
              <span className="pill" style={{ background: e.fatta ? 'var(--hl-definizione)' : e.risposta.trim() ? 'var(--hl-concetto)' : undefined }}>{e.fatta ? 'corretta' : e.risposta.trim() ? 'da correggere' : 'da svolgere'}</span>
            </div>
          </button>
        ))}
        {!visibili.length && <Vuoto t="Nessun esercizio qui." />}
      </div>

      {aperto && (
        <section aria-label={`Esercizio ${aperto.numero}`} style={{ border: '2px solid var(--ink)', borderRadius: 14, padding: 12, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 className="h3" style={{ flex: 1 }}>Esercizio {aperto.numero}</h4>
            <button type="button" className="btn" aria-pressed={aperto.fatta} style={aperto.fatta ? { background: 'var(--hl-definizione)' } : undefined} onClick={() => salva(aperto.id, { fatta: !aperto.fatta })}>{aperto.fatta ? '✓ Corretta' : 'Segna corretta'}</button>
            <ConfermaElimina testo="Elimina" onConferma={() => { void eliminaVoce(testo.id, 'esercizi', aperto.id); ed.imposta({ esercizioAperto: null }) }} />
          </div>
          <label className="lbl">Domanda
            <Campo multi rows={2} className="inp big" label="Domanda" valore={aperto.testo} salva={(v) => salva(aperto.id, { testo: v })} />
          </label>
          <label className="lbl">La mia risposta
            <Campo multi rows={6} className="inp big" label="Risposta" placeholder="Scrivi la risposta…" valore={aperto.risposta} salva={(v) => salva(aperto.id, { risposta: v })} />
          </label>
          <label className="lbl">Correzione
            <Campo multi rows={3} className="inp big" label="Correzione" placeholder="Cosa va sistemato / risposta corretta…" valore={aperto.correzione} salva={(v) => salva(aperto.id, { correzione: v })} />
          </label>
          <div>
            <div className="lbl" style={{ marginBottom: 5 }}>Passi del testo a cui si riferisce</div>
            {aperto.passi.map((p: Passo, i) => {
              const aggiorna = (nuovo: Partial<Passo> | null): void => {
                const l = aperto.passi.map((x) => scrivibile(x))
                if (nuovo) l[i] = { ...l[i], ...nuovo }
                else l.splice(i, 1)
                salva(aperto.id, { passi: l })
              }
              return (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                  <Campo valore={p.et} salva={(v) => aggiorna({ et: v })} label="Etichetta del passo" className="inp" style={{ width: 90, flex: 'none' }} />
                  <button type="button" className="voce" style={{ flex: 1, padding: '5px 9px', borderColor: daSistemare(p.stato) ? 'var(--warn-line)' : undefined }} onClick={() => p.span && ed.imposta({ sel: p.span, anchor: p.span[0], testa: p.span[1], pannello: 'es' })}>
                    <span style={{ fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.span ? citaDa(testo.corpo, tk.token, p.span) : `da riagganciare: «${p.citato ?? ''}»`}</span>
                  </button>
                  {daSistemare(p.stato) && sel && <button type="button" className="btn" style={{ padding: '2px 8px' }} onClick={() => aggiorna({ span: sel, citato: citaDa(testo.corpo, tk.token, sel) })}>Riaggancia</button>}
                  <button type="button" className="btn" aria-label="Togli il passo" style={{ padding: '0 8px' }} onClick={() => aggiorna(null)}>✕</button>
                </div>
              )
            })}
            <button type="button" className="btn" disabled={!sel} onClick={() => salva(aperto.id, { passi: [...aperto.passi.map((x) => scrivibile(x)), { span: sel, citato: citaDa(testo.corpo, tk.token, sel), et: etichettaPosizione(tk, sel, testo.layout) }] })}>+ Aggiungi la selezione</button>
          </div>
        </section>
      )}
    </div>
  )
}
