import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { citaDa, daSistemare, etichettaPosizione, parole } from '@shared/testo'
import type { Layout, VoceScritta } from '@shared/types'
import { useStore } from '../store'
import { Campo } from '../utili'
import { useEditor } from './stato'
import { eliminaVoce, salvaRaccolta, salvaVoce as salvaVoceDati, useTesto } from './dati'
import { NOME_EV } from './Pannelli'

function Finestra({ titolo, larga, chiudi, children, piede }: { titolo: string; larga?: boolean; chiudi: () => void; children: ReactNode; piede?: ReactNode }) {
  return (
    <div className="overlay" style={{ alignItems: 'center', zIndex: 60 }} onMouseDown={(e) => e.target === e.currentTarget && chiudi()}>
      <div role="dialog" aria-modal="true" aria-label={titolo} className="flot" style={{ width: larga ? 'min(860px, 94vw)' : 'min(620px, 94vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 20 }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>{titolo}</h2>
          <button type="button" className="btn" onClick={chiudi} aria-label="Chiudi">✕</button>
        </header>
        <div style={{ padding: '14px 18px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
        {piede && <footer style={{ display: 'flex', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--line)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{piede}</footer>}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ scheda di un'annotazione

export function SchedaAnnotazione() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk, modello } = d
  const vive = useMemo(() => testo.annotazioni.filter((a) => !daSistemare(a.stato)).sort((a, b) => a.span![0] - b.span![0] || b.span![1] - a.span![1]), [testo.annotazioni])
  const i = vive.findIndex((a) => a.id === ed.annDet)
  const a = vive[i]
  if (!a) return null
  const [s0, s1] = a.span!
  const T = tk.token
  const da = T[Math.max(0, s0 - 14)]!.start
  const fineCtx = T[Math.min(T.length - 1, s1 + 14)]!.end
  const prima = testo.corpo.slice(da, T[s0]!.start)
  const passo = testo.corpo.slice(T[s0]!.start, T[s1]!.end)
  const dopo = testo.corpo.slice(T[s1]!.end, fineCtx)
  const vai = (d: number): void => {
    const n = vive[i + d]
    if (n) ed.imposta({ annDet: n.id, sel: n.span, anchor: n.span![0], testa: n.span![1] })
  }
  const figura = modello.figure.find((f) => f.id === a.figura)
  const salva = (campi: VoceScritta): void => void salvaVoceDati(testo.id, 'annotazioni', { id: a.id, ...campi })

  return (
    <Finestra
      titolo={`Annotazione · ${etichettaPosizione(tk, a.span, testo.layout)}`}
      chiudi={() => ed.imposta({ annDet: null, modifica: false })}
      piede={
        <>
          <span style={{ flex: 1, alignSelf: 'center', color: 'var(--mute)', fontWeight: 700 }}>{i + 1} di {vive.length}</span>
          <button type="button" className="btn" disabled={i === 0} onClick={() => vai(-1)} aria-label="Precedente">◂</button>
          <button type="button" className="btn" disabled={i === vive.length - 1} onClick={() => vai(1)} aria-label="Successiva">▸</button>
          <button type="button" className="btn" onClick={() => ed.imposta({ annDet: null, modifica: false, sel: a.span, anchor: s0, testa: s1 })}>Vai al testo</button>
          <button type="button" className="btn" aria-pressed={ed.modifica} onClick={() => ed.imposta({ modifica: !ed.modifica })}>{ed.modifica ? 'Fine' : 'Modifica'}</button>
          {ed.modifica && <button type="button" className="btn" style={{ background: 'var(--err-bg)', color: 'var(--err-ink)', borderColor: 'var(--err-line)' }} onClick={() => { void eliminaVoce(testo.id, 'annotazioni', a.id); ed.imposta({ annDet: vive[i + 1]?.id ?? vive[i - 1]?.id ?? null, modifica: false }) }}>Elimina</button>}
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.8, whiteSpace: testo.layout === 'verso' ? 'pre-wrap' : 'normal' }}>
        <span style={{ color: 'var(--mute)' }}>{prima}</span>
        <mark style={{ background: a.evidenzia ? `var(--hl-${a.evidenzia})` : 'var(--surface2)', color: 'inherit', borderRadius: 4, padding: '0 2px', borderBottom: a.sottolinea ? '3px solid var(--ink)' : undefined }}>{passo}</mark>
        <span style={{ color: 'var(--mute)' }}>{dopo}</span>
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {a.evidenzia && <span className="pill" style={{ background: `var(--hl-${a.evidenzia})` }}>{NOME_EV[a.evidenzia]}</span>}
        {a.sottolinea && <span className="pill">sottolineato</span>}
        {a.parola_chiave && <span className="pill">parola chiave</span>}
        {a.flashcard && <span className="pill">flashcard</span>}
        <span className="pill">{parole(passo).length} parole</span>
      </div>
      {figura && (
        <div className="note" style={{ background: 'var(--surface2)', color: 'var(--ink)', borderColor: 'var(--line)' }}>
          <b>{figura.nome}</b> <span style={{ color: 'var(--mute)' }}>· {figura.tipo}</span>
          <div style={{ fontSize: 14 }}>{figura.descrizione}</div>
          {figura.esempio && <div style={{ fontSize: 13.5, color: 'var(--mute)' }}>Es.: {figura.esempio}</div>}
        </div>
      )}
      {ed.modifica ? (
        <label className="lbl">Nota<Campo multi rows={5} className="inp big" label="Nota" valore={a.nota} salva={(v) => salva({ nota: v })} /></label>
      ) : (
        a.nota.trim() && <p style={{ margin: 0, fontSize: 16, whiteSpace: 'pre-wrap' }}>{a.nota}</p>
      )}
      {a.schede.length > 0 && (
        <div>
          <div className="lbl" style={{ marginBottom: 5 }}>Schede collegate</div>
          {a.schede.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0' }}>
              <button type="button" className="btn" onClick={() => useStore.getState().imposta({ apertaId: c.id, selId: c.id })}>{modello.schede.find((s) => s.id === c.id)?.titolo_breve ?? c.id}</button>
              <span style={{ color: 'var(--mute)' }}>{c.frase}</span>
            </div>
          ))}
        </div>
      )}
    </Finestra>
  )
}

// ------------------------------------------------------------------ modifica del testo

export function ModificaTesto() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, modello } = d
  const [corpo, setCorpo] = useState(testo.corpo)
  const [occupato, setOccupato] = useState(false)
  const cambiato = corpo !== testo.corpo
  const aggiorna = (patch: Parameters<typeof window.api.aggiornaTesto>[1]): void => void window.api.aggiornaTesto(testo.id, patch).then((m) => useStore.getState().applica(m)).catch((e: Error) => useStore.getState().mostraToast(e.message))
  const esito = ed.riepilogo

  return (
    <Finestra
      titolo="Modifica testo"
      larga
      chiudi={() => ed.imposta({ modificaTesto: false, riepilogo: null })}
      piede={
        <>
          <button type="button" className="btn" onClick={() => ed.imposta({ modificaTesto: false, riepilogo: null })}>{esito ? 'Chiudi' : 'Annulla'}</button>
          {!esito && (
            <button type="button" className="btn on" disabled={!cambiato || occupato} onClick={async () => {
              setOccupato(true)
              try {
                const r = await window.api.modificaCorpo(testo.id, corpo)
                useStore.getState().applica(r.modello)
                ed.imposta({ riepilogo: r.esito })
              } catch (e) {
                useStore.getState().mostraToast((e as Error).message)
              }
              setOccupato(false)
            }}>Salva il testo</button>
          )}
        </>
      }
    >
      {esito && (
        <div className={esito.daSistemare ? 'note' : ''} style={esito.daSistemare ? undefined : { border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
          <b>Testo salvato.</b> {esito.riagganciate} annotazioni riagganciate da sole{esito.daSistemare ? `, ${esito.daSistemare} da sistemare a mano (le trovi in «Da riagganciare»).` : '. Nessuna da sistemare.'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label className="lbl" style={{ flex: '2 1 220px' }}>Titolo<Campo valore={testo.titolo} salva={(v) => aggiorna({ titolo: v })} className="inp big" label="Titolo" /></label>
        <label className="lbl" style={{ flex: '1 1 90px' }}>Anno<Campo valore={testo.anno} salva={(v) => aggiorna({ anno: v })} className="inp big" label="Anno" /></label>
        <label className="lbl" style={{ flex: '2 1 200px' }}>Opera<Campo valore={testo.opera} salva={(v) => aggiorna({ opera: v })} className="inp big" label="Opera" /></label>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label className="lbl" style={{ flex: '1 1 160px' }}>Scheda collegata
          <select className="inp big" value={testo.scheda ?? ''} onChange={(e) => aggiorna({ scheda: e.target.value || null })}>
            <option value="">— nessuna —</option>
            {modello.schede.map((s) => <option key={s.id} value={s.id}>{s.titolo_breve}</option>)}
          </select>
        </label>
        <label className="lbl" style={{ flex: '1 1 160px' }}>Impaginazione
          <select className="inp big" value={testo.layout} onChange={(e) => aggiorna({ layout: e.target.value as Layout })}>
            <option value="verso">Versi (un blocco per riga)</option><option value="prosa">Prosa (un blocco per paragrafo)</option>
          </select>
        </label>
      </div>
      <label className="lbl">Testo
        <textarea className="inp big" rows={14} value={corpo} onChange={(e) => { setCorpo(e.target.value); if (esito) ed.imposta({ riepilogo: null }) }} aria-label="Corpo del testo" style={{ fontFamily: 'inherit', lineHeight: 1.6 }} />
      </label>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>Cambiando il testo, annotazioni e parafrasi si riagganciano da sole cercando le parole citate; quelle ambigue o perse restano da sistemare.</p>
    </Finestra>
  )
}

// ------------------------------------------------------------------ nuovo testo

export function NuovoTesto() {
  const ed = useEditor()
  const m = useStore((s) => s.modello)!
  const [f, setF] = useState({ titolo: '', anno: '', opera: '', layout: 'verso' as Layout, corpo: '', scheda: '' })
  const [occ, setOcc] = useState(false)
  return (
    <Finestra
      titolo="Nuovo testo"
      larga
      chiudi={() => ed.imposta({ nuovoTesto: false })}
      piede={
        <>
          <button type="button" className="btn" onClick={() => ed.imposta({ nuovoTesto: false })}>Annulla</button>
          <button type="button" className="btn on" disabled={!f.titolo.trim() || occ} onClick={async () => {
            setOcc(true)
            try {
              const r = await window.api.creaTesto({ titolo: f.titolo.trim(), anno: f.anno, opera: f.opera, layout: f.layout, corpo: f.corpo, scheda: f.scheda || null })
              useStore.getState().applica(r.modello)
              ed.imposta({ nuovoTesto: false, elencoTesti: false, testoId: r.id, sel: null, anchor: null, testa: null, esercizioAperto: null })
            } catch (e) {
              useStore.getState().mostraToast((e as Error).message)
            }
            setOcc(false)
          }}>Crea il testo</button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label className="lbl" style={{ flex: '2 1 220px' }}>Titolo<input className="inp big" value={f.titolo} onChange={(e) => setF({ ...f, titolo: e.target.value })} autoFocus /></label>
        <label className="lbl" style={{ flex: '1 1 90px' }}>Anno<input className="inp big" value={f.anno} onChange={(e) => setF({ ...f, anno: e.target.value })} /></label>
        <label className="lbl" style={{ flex: '2 1 200px' }}>Opera<input className="inp big" value={f.opera} onChange={(e) => setF({ ...f, opera: e.target.value })} /></label>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label className="lbl" style={{ flex: '1 1 160px' }}>Scheda collegata (facoltativa)
          <select className="inp big" value={f.scheda} onChange={(e) => setF({ ...f, scheda: e.target.value })}>
            <option value="">— nessuna —</option>
            {m.schede.map((s) => <option key={s.id} value={s.id}>{s.titolo_breve}</option>)}
          </select>
        </label>
        <label className="lbl" style={{ flex: '1 1 160px' }}>Impaginazione
          <select className="inp big" value={f.layout} onChange={(e) => setF({ ...f, layout: e.target.value as Layout })}>
            <option value="verso">Versi</option><option value="prosa">Prosa</option>
          </select>
        </label>
      </div>
      <label className="lbl">Testo (puoi incollarlo anche dopo)
        <textarea className="inp big" rows={12} value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} aria-label="Corpo del testo" style={{ lineHeight: 1.6 }} />
      </label>
    </Finestra>
  )
}

// ------------------------------------------------------------------ elenco testi (dalla Home)

export function ElencoTesti() {
  const ed = useEditor()
  const m = useStore((s) => s.modello)!
  return (
    <Finestra titolo="Testi" chiudi={() => ed.imposta({ elencoTesti: false })} piede={<button type="button" className="btn on" onClick={() => ed.imposta({ nuovoTesto: true })}>+ Nuovo testo</button>}>
      {m.testi.length === 0 && <p style={{ margin: 0, color: 'var(--mute)' }}>Nessun testo in questo autore. Crea il primo con «+ Nuovo testo».</p>}
      {m.testi.map((t) => (
        <button key={t.id} type="button" className="voce" style={{ padding: '11px 14px' }} onClick={() => ed.imposta({ elencoTesti: false, testoId: t.id, sel: null, anchor: null, testa: null, esercizioAperto: null })}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{t.titolo}</div>
          <div style={{ color: 'var(--mute)', fontSize: 13 }}>{[t.anno, t.opera].filter(Boolean).join(' · ')} · {t.annotazioni.length} annotazioni · {t.esercizi.length} esercizi</div>
        </button>
      ))}
    </Finestra>
  )
}

// ------------------------------------------------------------------ importazione esercizi

/** Separa le domande numerate («1.», «2)», «3 -»); il testo che segue una riga numerata ne fa parte. */
export function dividiDomande(t: string): string[] {
  const out: string[] = []
  for (const riga of t.split(/\r?\n/)) {
    if (/^\s*\d+\s*[.)\-–:]\s+\S/.test(riga)) out.push(riga.replace(/^\s*\d+\s*[.)\-–:]\s+/, '').trim())
    else if (riga.trim() && out.length) out[out.length - 1] += ' ' + riga.trim()
    else if (riga.trim() && !out.length) out.push(riga.trim())
  }
  return out
}

export function ImportaEsercizi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const [t, setT] = useState('')
  const [fase, setFase] = useState<1 | 2>(1)
  const [da, setDa] = useState(() => (testo.esercizi.reduce((m, e) => Math.max(m, e.numero), 0) || 0) + 1)
  const domande = useMemo(() => dividiDomande(t), [t])
  useEffect(() => setFase(1), [t])
  return (
    <Finestra
      titolo="Importa esercizi"
      larga
      chiudi={() => ed.imposta({ importa: false })}
      piede={
        <>
          <button type="button" className="btn" onClick={() => ed.imposta({ importa: false })}>Annulla</button>
          {fase === 1 ? (
            <button type="button" className="btn on" disabled={!domande.length} onClick={() => setFase(2)}>Anteprima ({domande.length})</button>
          ) : (
            <button type="button" className="btn on" onClick={async () => {
              const nuove: VoceScritta[] = domande.map((q, k) => ({ id: `e${String(testo.esercizi.length + k + 1).padStart(3, '0')}`, numero: da + k, testo: q, risposta: '', correzione: '', fatta: false, passi: [] }))
              const vecchie = testo.esercizi.map((e) => ({ ...e, passi: e.passi.map((p) => ({ ...p, span: p.span ?? p.spanScritto })), } as unknown as VoceScritta))
              // gli id nuovi non devono scontrarsi con quelli esistenti
              const usati = new Set(testo.esercizi.map((e) => e.id))
              let n = testo.esercizi.reduce((m, e) => Math.max(m, Number(e.id.replace(/^\D+/, '')) || 0), 0)
              for (const v of nuove) { while (usati.has(`e${String(++n).padStart(3, '0')}`)) { /* avanti */ } v.id = `e${String(n).padStart(3, '0')}`; usati.add(String(v.id)) }
              await salvaRaccolta(testo.id, 'esercizi', [...vecchie, ...nuove])
              ed.imposta({ importa: false, pannello: 'es' })
            }}>Importa {domande.length} domande</button>
          )}
        </>
      }
    >
      {fase === 1 ? (
        <>
          <p style={{ margin: 0, color: 'var(--mute)', fontSize: 14 }}>Incolla le domande numerate (1. … 2. … oppure 1) …). Le righe senza numero vengono unite alla domanda precedente.</p>
          <textarea className="inp big" rows={14} value={t} onChange={(e) => setT(e.target.value)} aria-label="Domande da importare" autoFocus />
        </>
      ) : (
        <>
          <label className="lbl" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>Numera a partire da
            <input type="number" min={1} className="inp big" style={{ width: 90 }} value={da} onChange={(e) => setDa(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          {domande.map((q, k) => (
            <div key={k} style={{ display: 'flex', gap: 8, fontSize: 15 }}><b style={{ minWidth: 28 }}>{da + k}.</b><span>{q}</span></div>
          ))}
        </>
      )}
    </Finestra>
  )
}

// ------------------------------------------------------------------ aiuto

export function Aiuto() {
  const ed = useEditor()
  const tasti: [string, string][] = [
    ['1 · 2 · 3', 'concetto · definizione · dubbio (premi di nuovo per togliere)'], ['S', 'sottolinea'], ['K', 'parola chiave'], ['F', 'flashcard'], ['N', 'scrivi una nota sul passo'],
    ['P', 'parafrasi del passo'], ['D', 'domanda dal passo'], ['← →', 'sposta la selezione (Maiusc per estenderla)'], ['Esc', 'chiude / deseleziona'], ['Ctrl + rotella', 'zoom del testo']
  ]
  return (
    <Finestra titolo="Scorciatoie e legenda" chiudi={() => ed.imposta({ aiuto: false })}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 15 }}>
        {tasti.map(([k, v]) => (<><kbd key={k} style={{ fontWeight: 700, border: '1px solid var(--line)', borderRadius: 6, padding: '0 7px', background: 'var(--surface2)' }}>{k}</kbd><span key={k + 'v'}>{v}</span></>))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['concetto', 'definizione', 'dubbio'] as const).map((k) => <span key={k} className="pill" style={{ background: `var(--hl-${k})`, borderBottom: `3px solid var(--hb-${k})` }}>{NOME_EV[k]}</span>)}
        <span className="pill" style={{ borderBottom: '3px solid var(--ink)' }}>Sottolineato</span>
      </div>
      <p style={{ margin: 0, color: 'var(--mute)', fontSize: 14 }}>Un passo può avere più marcature insieme; quando si sovrappongono, le barre colorate si impilano sotto il testo (al massimo tre).</p>
    </Finestra>
  )
}

export { citaDa }
