import { useEffect, useMemo, useState } from 'react'
import { citaDa, daSistemare } from '@shared/testo'
import type { Annotazione, Esercizio, Evidenzia, Layout, Passo, TipoFigura } from '@shared/types'
import { useStore } from '../store'
import { useEditor, type Bozza } from './stato'
import { applicaFigura, correnteDi, eliminaVoce, rigaDi, salvaVoce, scrivibile, separaDomande, statoEs, useTesto } from './dati'
import { NOME_EV, rinumera, scriviEsercizi } from './Pannelli'
import { Area, lbl, Modale, primario, Quadro, Riga, secondario, tratteggiato } from './ui'

const HL: Record<Evidenzia, string> = { concetto: 'var(--hl-c)', definizione: 'var(--hl-d)', dubbio: 'var(--hl-u)' }
const TIPI: Record<TipoFigura, string> = { suono: 'Figure di suono', significato: 'Figure di significato', ordine: 'Figure di ordine', sintassi: 'Figure di sintassi' }
const ETI = { da_svolgere: 'Da svolgere', da_correggere: 'Da correggere', corretta: 'Corretta' }
const COL = { da_svolgere: ['var(--line)', 'var(--surface2)', 'var(--mute)'], da_correggere: ['var(--warn-line)', 'var(--warn-bg)', 'var(--warn-ink)'], corretta: ['var(--par)', 'var(--par-bg)', 'var(--par)'] } as const

const chiudiBtn = (f: () => void): React.ReactNode => (
  <button type="button" className="hv" onClick={f} aria-label="Chiudi" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, width: 30, height: 30, fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>✕</button>
)

/** ◂ ▸ affiancati, come nel prototipo. */
function Scorri(props: { etichetta: string; prevOff: boolean; nextOff: boolean; onPrev: () => void; onNext: () => void; nome: string }) {
  const b: React.CSSProperties = { border: 0, background: 'transparent', width: 32, height: 30, fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }
  return (
    <div role="group" aria-label={props.etichetta} style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
      <button type="button" className="hv" onClick={props.onPrev} disabled={props.prevOff} aria-label={`${props.nome} precedente`} style={{ ...b, borderRight: '1px solid var(--line)' }}>◂</button>
      <button type="button" className="hv" onClick={props.onNext} disabled={props.nextOff} aria-label={`${props.nome} successiva`} style={b}>▸</button>
    </div>
  )
}

/** Il passo con le parole attorno: una riga per ogni verso/paragrafo toccato. */
function Contesto(props: { span: [number, number]; fs: number; fondo: (inSpan: boolean) => string; peso?: number }) {
  const d = useTesto()!
  const { testo, tk } = d
  const T = tk.token
  const [s0, s1] = props.span
  const b0 = T[s0]!.blocco
  const b1 = T[Math.min(s1, T.length - 1)]!.blocco
  return (
    <>
      {tk.blocchi.slice(b0, b1 + 1).map((b) => (
        <div key={b.index} style={{ fontSize: 0 }}>
          {T.slice(b.da, b.a + 1).map((t) => {
            const dentro = t.index >= s0 && t.index <= s1
            const nx = T[t.index + 1]
            const stessa = !!nx && nx.blocco === b.index
            const dopoDentro = dentro && stessa && t.index + 1 <= s1
            return (
              <span key={t.index}>
                <span style={{ fontSize: props.fs, padding: '2px 0', borderRadius: 3, background: props.fondo(dentro), fontWeight: dentro ? props.peso ?? 400 : 400 }}>{t.text}</span>
                <span style={{ fontSize: props.fs, whiteSpace: 'pre', padding: '2px 0', background: props.fondo(dopoDentro) }}>{stessa ? testo.corpo.slice(t.end, nx!.start) : ''}</span>
              </span>
            )
          })}
        </div>
      ))}
    </>
  )
}

const sezione = (nome: string): React.ReactNode => <span style={lbl}>{nome}</span>

// ------------------------------------------------------------------ scheda di un'annotazione

export function SchedaAnnotazione() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk, modello } = d
  const ordinate = useMemo(() => testo.annotazioni.slice().sort((a, b) => (a.span ? a.span[0] : 1e9) - (b.span ? b.span[0] : 1e9)), [testo.annotazioni])
  const i = ordinate.findIndex((a) => a.id === ed.annDet)
  const a: Annotazione | undefined = ordinate[i]
  useEffect(() => {
    if (!a) ed.imposta({ annDet: null, detEdit: false })
  }, [a]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return null

  const rot = daSistemare(a.stato)
  const fig = modello.figure.find((f) => f.id === a.figura)
  const edit = ed.detEdit
  const salva = (campi: Record<string, unknown>): void => void salvaVoce(testo.id, 'annotazioni', { id: a.id, ...campi })
  const vai = (k: number): void => {
    const n = ordinate[i + k]
    if (n) ed.imposta({ annDet: n.id })
  }
  const par = a.span && !rot ? testo.parafrasi.find((p) => p.span && !daSistemare(p.stato) && p.span[0] <= a.span![1] && p.span[1] >= a.span![0]) : undefined
  const liberi = modello.schede.filter((s) => !a.schede.some((x) => x.id === s.id))
  const nomeSch = (id: string): string => modello.schede.find((s) => s.id === id)?.titolo_breve ?? id
  const tag: { nome: string; sw?: string; icona: string }[] = []
  if (a.evidenzia) tag.push({ nome: NOME_EV[a.evidenzia], sw: HL[a.evidenzia], icona: '' })
  if (a.sottolinea) tag.push({ nome: 'Sottolineatura', icona: '⎯' })
  if (a.parola_chiave) tag.push({ nome: 'Parola chiave', icona: '✦' })
  if (a.flashcard) tag.push({ nome: 'Flashcard', icona: '▣' })
  const bottoneScelta = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, background: on ? 'var(--surface2)' : 'var(--surface)', borderRadius: 9, padding: '0 13px', height: 38, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' })
  const fondoCtx = (dentro: boolean): string => (dentro ? (a.evidenzia ? HL[a.evidenzia] : 'var(--surface2)') : 'transparent')
  const mostraFig = !!fig || edit
  const mostraNota = !!a.nota.trim() || edit
  const mostraSchede = a.schede.length > 0 || edit

  return (
    <Modale
      titolo="Scheda dell'annotazione"
      z={78}
      larghezza={680}
      chiudi={() => ed.imposta({ annDet: null, detEdit: false })}
      intestazione={
        <>
          <span style={lbl}>Annotazione</span>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{rot ? 'Da riagganciare' : rigaDi(tk, testo.layout, a.span)}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{i + 1} di {ordinate.length}</span>
          <Scorri etichetta="Scorri le annotazioni" nome="Annotazione" prevOff={i <= 0} nextOff={i >= ordinate.length - 1} onPrev={() => vai(-1)} onNext={() => vai(1)} />
          {chiudiBtn(() => ed.imposta({ annDet: null, detEdit: false }))}
        </>
      }
      corpoStyle={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
      piede={
        <>
          {edit && (
            <button type="button" className="hvi" onClick={() => { void eliminaVoce(testo.id, 'annotazioni', a.id); ed.imposta({ annDet: ordinate[i + 1]?.id ?? ordinate[i - 1]?.id ?? null, detEdit: false }) }} style={{ ...secondario, background: 'transparent', color: 'var(--mute)' }}>Elimina</button>
          )}
          <div style={{ flex: 1 }} />
          {!edit ? (
            <>
              <button type="button" className="hv" onClick={() => ed.imposta({ detEdit: true })} style={secondario}>Modifica</button>
              <button type="button" className="hvp" onClick={() => { if (a.span && !rot) ed.seleziona(a.span[0], a.span[1]); ed.imposta({ annDet: null, detEdit: false }) }} style={primario}>Vai al testo</button>
            </>
          ) : (
            <button type="button" className="hvp" onClick={() => ed.imposta({ detEdit: false })} style={primario}>Fine</button>
          )}
        </>
      }
    >
      {a.span && !rot && a.span[1] < tk.token.length && (
        <div style={{ border: '1px solid var(--line2)', background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', fontSize: 16, lineHeight: 1.9 }}>
          <Contesto span={a.span} fs={16} fondo={fondoCtx} peso={a.parola_chiave ? 700 : 400} />
        </div>
      )}
      {rot && (
        <div style={{ border: '1px solid var(--warn-line)', background: 'var(--warn-bg)', color: 'var(--warn-ink)', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, lineHeight: 1.55 }}>
          <b>Da riagganciare.</b> Le parole citate non corrispondono più al testo: «{a.citato}»
        </div>
      )}

      {!edit && tag.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {tag.map((t) => (
            <span key={t.nome} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t.sw && <span aria-hidden style={{ width: 13, height: 13, borderRadius: 4, border: '1px solid var(--line)', background: t.sw }} />}
              <span aria-hidden style={{ fontSize: 12, color: 'var(--mute)' }}>{t.icona}</span>{t.nome}
            </span>
          ))}
        </div>
      )}

      {edit && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sezione('Evidenziatore')}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['concetto', 'definizione', 'dubbio'] as const).map((k) => (
                <button key={k} type="button" className="hv" aria-pressed={a.evidenzia === k} onClick={() => salva({ evidenzia: a.evidenzia === k ? null : k })} style={bottoneScelta(a.evidenzia === k)}>
                  <span aria-hidden style={{ width: 15, height: 15, borderRadius: 5, border: '1px solid var(--line)', background: HL[k] }} />{NOME_EV[k]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sezione('Marcature')}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([['sottolinea', 'Sottolineatura', '⎯'], ['parola_chiave', 'Parola chiave', '✦'], ['flashcard', 'Flashcard', '▣']] as const).map(([f, nome, ic]) => (
                <button key={f} type="button" className="hv" aria-pressed={a[f]} onClick={() => salva({ [f]: !a[f] })} style={bottoneScelta(a[f])}>
                  <span aria-hidden style={{ fontSize: 13 }}>{ic}</span><span style={{ whiteSpace: 'nowrap' }}>{nome}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mostraFig && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sezione('Figura retorica')}
          <div style={{ border: '1px solid var(--line2)', borderRadius: 12, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong style={{ flex: 1, fontSize: 14, color: 'var(--ed)' }}>{fig ? fig.nome : 'Nessuna figura retorica'}</strong>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--mute)' }}>{fig ? TIPI[fig.tipo] : ''}</span>
              {edit && (
                <button type="button" className="hv" onClick={() => ed.imposta({ figOpen: true, figQ: '', figPrev: a.figura || 'metafora', figTarget: a.id })} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{fig ? 'Cambia' : 'Aggiungi'}</button>
              )}
            </div>
            {fig && (
              <>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, textWrap: 'pretty' }}>{fig.descrizione}</p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--mute)', fontStyle: 'italic', textWrap: 'pretty' }}>{fig.esempio}</p>
              </>
            )}
          </div>
        </div>
      )}

      {mostraNota && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sezione('Nota')}
          {!edit ? (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>{a.nota}</p>
          ) : (
            <Area label="Nota" placeholder="Scrivi qui la nota di studio su questo passo…" valore={a.nota} salva={(v) => salva({ nota: v })} style={{ minHeight: 110, borderRadius: 11, padding: '11px 12px', fontSize: 13.5, lineHeight: 1.65 }} />
          )}
        </div>
      )}

      {par && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sezione('Parafrasi collegata')}
          <button type="button" className="hvo" onClick={() => ed.imposta({ tab: 'par', annDet: null, detEdit: false })} style={{ textAlign: 'left', border: '1px solid var(--par)', background: 'var(--par-bg)', color: 'var(--ink)', borderRadius: 11, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.6, cursor: 'pointer' }}>{par.testo || 'Parafrasi ancora vuota.'}</button>
        </div>
      )}

      {mostraSchede && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sezione('Schede collegate sulla mappa')}
          {a.schede.map((s, k) => (
            <div key={s.id} style={{ border: '1px solid var(--line2)', borderRadius: 11, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <button type="button" title="Apri la scheda sulla mappa dell'autore" onClick={() => { ed.imposta({ annDet: null, detEdit: false }); useStore.getState().imposta({ apertaId: s.id, selId: s.id }) }} style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', color: 'var(--focus)', padding: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↗ {nomeSch(s.id)}</button>
                {edit && <Quadro size={26} label="Scollega la scheda" onClick={() => salva({ schede: a.schede.filter((_, j) => j !== k) })}>✕</Quadro>}
              </div>
              {!edit && s.frase.trim() && <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--mute)', textWrap: 'pretty' }}>{s.frase}</p>}
              {edit && <Riga label="Perché è collegata" valore={s.frase} salva={(v) => salva({ schede: a.schede.map((x, j) => (j === k ? { id: x.id, frase: v } : x)) })} placeholder="Una riga sul perché di questo collegamento (facoltativa)" style={{ borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }} />}
            </div>
          ))}
          {edit && liberi.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {liberi.map((s) => (
                <button key={s.id} type="button" className="hvi" onClick={() => salva({ schede: [...a.schede, { id: s.id, frase: '' }] })} style={{ border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ {s.titolo_breve}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modale>
  )
}

// ------------------------------------------------------------------ figure retoriche

export function SelettoreFigure() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk, modello } = d
  const sel = ed.sel
  const target = (ed.figTarget ? testo.annotazioni.find((x) => x.id === ed.figTarget) : null) ?? correnteDi(testo, sel)
  const q = ed.figQ.trim().toLowerCase()
  const figure = modello.figure
  const gruppi = (Object.keys(TIPI) as TipoFigura[])
    .map((tipo) => ({
      tipo,
      lista: figure.filter((f) => f.tipo === tipo && (!q || f.nome.toLowerCase().includes(q) || f.descrizione.toLowerCase().includes(q))).sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
    }))
    .filter((g) => g.lista.length)
  const nTot = gruppi.reduce((s, g) => s + g.lista.length, 0)
  const prev = figure.find((f) => f.id === ed.figPrev) ?? figure[0]
  const scegli = (id: string): void => {
    void applicaFigura(testo, tk, sel, target?.id ?? null, id)
    ed.imposta({ figOpen: false })
  }
  const selTxt = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const seg = (on: boolean): React.CSSProperties => ({ border: 0, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)' })
  const chiudi = (): void => ed.imposta({ figOpen: false })

  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && chiudi()} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,12,18,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, animation: 'dcFade .12s ease-out' }}>
      <div role="dialog" aria-label="Scegli la figura retorica" style={{ width: 'min(1000px,100%)', maxHeight: 'min(86vh,760px)', display: 'flex', flexDirection: 'column', border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', boxShadow: '0 28px 70px rgba(0,0,0,.4)', animation: 'dcUp .16s ease-out' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <strong style={{ fontSize: 15 }}>Figure retoriche</strong>
          <span style={{ fontSize: 12, color: 'var(--mute)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>su «{target ? target.citato : selTxt}»</span>
          <div style={{ flex: 1, minWidth: 12 }} />
          <label style={{ flex: '0 1 300px', minWidth: 170, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg)', padding: '0 11px' }}>
            <span aria-hidden style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 700 }}>⌕</span>
            <input type="search" autoFocus value={ed.figQ} onChange={(e) => ed.imposta({ figQ: e.target.value })} placeholder="Cerca una figura…" aria-label="Cerca una figura retorica" style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', padding: '9px 0', fontSize: 13, outline: 'none' }} />
          </label>
          <div role="group" aria-label="Variante della card" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
            <button type="button" aria-pressed={ed.figVar === 'A'} onClick={() => ed.imposta({ figVar: 'A' })} style={{ ...seg(ed.figVar === 'A'), borderRight: '1px solid var(--line)' }}>A · griglia</button>
            <button type="button" aria-pressed={ed.figVar === 'B'} onClick={() => ed.imposta({ figVar: 'B' })} style={seg(ed.figVar === 'B')}>B · elenco</button>
          </div>
          <button type="button" className="hv" onClick={chiudi} aria-label="Chiudi" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, width: 34, height: 34, fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {ed.figVar === 'A' ? (
          <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 16px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {gruppi.map((g) => (
              <div key={g.tipo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--mute)' }}>{TIPI[g.tipo]}</strong>
                  <span style={{ flex: 1, height: 1, background: 'var(--line2)' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--mute)', fontWeight: 700 }}>{g.lista.length} {g.lista.length === 1 ? 'figura' : 'figure'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
                  {g.lista.map((f) => {
                    const on = target?.figura === f.id
                    const exp = ed.figExp === f.id
                    return (
                      <div key={f.id} style={{ border: `1px solid ${on ? 'var(--ed)' : 'var(--line)'}`, background: on ? 'var(--ed-bg)' : 'var(--surface)', borderRadius: 11, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'stretch' }}>
                          <button type="button" className="hv" onClick={() => scegli(f.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', color: on ? 'var(--ed)' : 'var(--ink)', padding: '11px 12px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>{f.nome}</button>
                          <button type="button" className="hv" aria-expanded={exp} aria-label="Mostra descrizione" onClick={() => ed.imposta({ figExp: exp ? null : f.id })} style={{ flex: 'none', width: 38, border: 0, borderLeft: '1px solid var(--line2)', background: 'transparent', color: 'var(--mute)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{exp ? '▴' : '▾'}</button>
                        </div>
                        {exp && (
                          <div style={{ borderTop: '1px solid var(--line2)', padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, textWrap: 'pretty' }}>{f.descrizione}</p>
                            <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--mute)', fontStyle: 'italic', textWrap: 'pretty' }}>{f.esempio}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch' }}>
            <div className="ed-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '14px 14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, alignContent: 'start' }}>
              {gruppi.map((g) => (
                <div key={g.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--mute)', padding: '0 2px 5px', borderBottom: '2px solid var(--line)' }}>{TIPI[g.tipo]}</div>
                  {g.lista.map((f) => {
                    const on = target?.figura === f.id
                    return (
                      <button key={f.id} type="button" className="hv" onClick={() => scegli(f.id)} onMouseEnter={() => ed.imposta({ figPrev: f.id })} onFocus={() => ed.imposta({ figPrev: f.id })} style={{ width: '100%', textAlign: 'left', border: `1px solid ${on ? 'var(--ed)' : 'var(--line2)'}`, background: on ? 'var(--ed-bg)' : 'transparent', color: on ? 'var(--ed)' : 'var(--ink)', borderRadius: 8, padding: '9px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>{f.nome}</button>
                    )
                  })}
                </div>
              ))}
            </div>
            {prev && (
              <div style={{ flex: '0 0 300px', minWidth: 240, borderLeft: '1px solid var(--line)', background: 'var(--bg)', padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={lbl}>{TIPI[prev.tipo]}</span>
                <strong style={{ fontSize: 17, letterSpacing: '-.01em' }}>{prev.nome}</strong>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, textWrap: 'pretty' }}>{prev.descrizione}</p>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--mute)', fontStyle: 'italic', textWrap: 'pretty' }}>{prev.esempio}</p>
                <div style={{ flex: 1 }} />
                <button type="button" className="hvp" onClick={() => scegli(prev.id)} style={{ ...primario, borderRadius: 9, padding: '11px 14px', fontSize: 13 }}>Applica alla selezione</button>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{nTot} figure su {figure.length} nel dizionario condiviso</span>
          <div style={{ flex: 1 }} />
          {target?.figura && (
            <button type="button" className="hv" onClick={() => { void applicaFigura(testo, tk, sel, target.id, target.figura); ed.imposta({ figOpen: false }) }} style={{ ...secondario, borderRadius: 8, color: 'var(--mute)' }}>Togli la figura</button>
          )}
          <button type="button" className="hv" onClick={chiudi} style={{ ...secondario, borderRadius: 8 }}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ domanda (svolgimento)

export function SchedaDomanda() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk } = d
  const lista = useMemo(() => testo.esercizi.slice().sort((a, b) => a.numero - b.numero), [testo.esercizi])
  const i = lista.findIndex((e) => e.id === ed.esDet)
  const e: Esercizio | undefined = lista[i]
  useEffect(() => {
    if (!e) ed.imposta({ esDet: null, esTestoEdit: null, esEdit: null })
  }, [e]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!e) return null
  const sel = ed.sel
  const st = statoEs(e)
  const col = COL[st]
  const salva = (campi: Record<string, unknown>): void => void salvaVoce(testo.id, 'esercizi', { id: e.id, ...campi })
  const scriviPassi = (passi: Passo[]): void => salva({ passi: passi.map((p) => scrivibile(p)) })
  const chiudi = (): void => ed.imposta({ esDet: null, esTestoEdit: null, esEdit: null })
  const vai = (k: number): void => {
    const n = lista[i + k]
    if (n) ed.imposta({ esDet: n.id, esEdit: null, esTestoEdit: null })
  }
  const editTesto = ed.esTestoEdit === e.id
  const editCorr = ed.esEdit === e.id
  const hasCorr = !!e.correzione.trim()
  const piccolo: React.CSSProperties = { flex: 'none', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }

  return (
    <Modale
      titolo="Svolgimento della domanda"
      z={79}
      larghezza={760}
      altezza={900}
      chiudi={chiudi}
      intestazione={
        <>
          <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{e.numero}</span>
          <span style={{ flex: 'none', border: `1px solid ${col[0]}`, background: col[1], color: col[2], borderRadius: 999, padding: '3px 11px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{ETI[st]}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11.5, color: 'var(--mute)', whiteSpace: 'nowrap' }}>{i + 1} di {lista.length}</span>
          <Scorri etichetta="Scorri le domande" nome="Domanda" prevOff={i <= 0} nextOff={i >= lista.length - 1} onPrev={() => vai(-1)} onNext={() => vai(1)} />
          {chiudiBtn(chiudi)}
        </>
      }
      corpoStyle={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}
      piede={
        <>
          <button type="button" aria-pressed={e.fatta} onClick={() => salva({ fatta: !e.fatta })} style={{ display: 'flex', alignItems: 'center', gap: 9, border: `2px solid ${e.fatta ? 'var(--par)' : 'var(--line)'}`, background: e.fatta ? 'var(--par)' : 'var(--surface)', color: e.fatta ? 'var(--on)' : 'var(--mute)', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>✓ {e.fatta ? 'Fatta' : 'Segna come fatta'}</button>
          <div style={{ flex: 1 }} />
          <button type="button" className="hvp" disabled={i >= lista.length - 1} onClick={() => vai(1)} style={primario}>Domanda successiva</button>
        </>
      }
    >
      {!editTesto ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <p style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty' }}>{e.testo || 'Domanda senza testo'}</p>
          <button type="button" className="hv" title="Modifica il testo della domanda" aria-label="Modifica il testo della domanda" onClick={() => ed.imposta({ esTestoEdit: e.id })} style={{ ...piccolo, width: 30, height: 30, fontSize: 12, lineHeight: 1, color: 'var(--mute)' }}>✎</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Area label="Testo della domanda" valore={e.testo} salva={(v) => salva({ testo: v })} placeholder="Scrivi qui la domanda." style={{ minHeight: 86, border: '1px solid var(--focus)', borderRadius: 12, padding: '12px 13px', fontSize: 16, fontWeight: 700, lineHeight: 1.55 }} />
          <button type="button" onClick={() => ed.imposta({ esTestoEdit: null })} style={{ ...primario, alignSelf: 'flex-start', borderRadius: 8, padding: '7px 13px', fontSize: 12 }}>Fine</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sezione('La tua risposta')}
        <Area label="La tua risposta" valore={e.risposta} salva={(v) => salva({ risposta: v })} placeholder="Scrivi qui con calma: questo spazio è solo tuo, la correzione si aggiunge sotto senza sovrascriverlo." style={{ minHeight: 200, borderRadius: 12, padding: '13px 14px', fontSize: 14.5, lineHeight: 1.75 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed var(--line2)', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ ...lbl, flex: 1 }}>Correzione</span>
          {!editCorr ? (
            <button type="button" className="hv" onClick={() => ed.imposta({ esEdit: e.id })} style={{ ...piccolo, padding: '7px 12px', fontSize: 12 }}>{hasCorr ? 'Modifica' : 'Scrivi la correzione'}</button>
          ) : (
            <button type="button" onClick={() => ed.imposta({ esEdit: null })} style={{ ...primario, borderRadius: 8, padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>Fine</button>
          )}
        </div>
        {!editCorr && hasCorr && <p style={{ margin: 0, borderLeft: '3px solid var(--par)', paddingLeft: 12, fontSize: 13.5, lineHeight: 1.7, textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>{e.correzione}</p>}
        {editCorr && <Area label="Correzione" valore={e.correzione} salva={(v) => salva({ correzione: v })} placeholder="Che cosa manca, che cosa va aggiunto." style={{ minHeight: 120, border: '1px solid var(--par)', borderRadius: 12, padding: '12px 13px', fontSize: 13.5, lineHeight: 1.7 }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--line2)', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ ...lbl, flex: 1 }}>Collegamenti al testo</span>
          <button type="button" className="hv" disabled={!sel} onClick={() => sel && scriviPassi([...e.passi, { span: [sel[0], sel[1]], citato: citaDa(testo.corpo, tk.token, sel), et: '', stato: 'ok', spanScritto: null }])} style={{ ...piccolo, padding: '6px 11px', fontSize: 11.5, color: 'var(--mute)', opacity: sel ? 1 : 0.45, cursor: sel ? 'pointer' : 'not-allowed' }}>+ Collega la selezione</button>
        </div>
        {e.passi.length === 0 && (
          <p style={{ margin: 0, border: '1px dashed var(--line)', borderRadius: 11, padding: '11px 13px', fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55, textWrap: 'pretty' }}>Nessun passo collegato. Seleziona una o più parole nel testo e premi «Collega la selezione»: la domanda comparirà anche accanto a quel verso. Puoi collegarne più d'uno.</p>
        )}
        {e.passi.map((p, pi) => {
          const rotto = daSistemare(p.stato)
          const viva = !!p.span && !rotto && p.span[1] < tk.token.length
          const cambia = (campi: Partial<Passo>): void => scriviPassi(e.passi.map((x, j) => (j === pi ? { ...x, ...campi } : x)))
          return (
            <div key={pi} style={{ display: 'flex', flexDirection: 'column', gap: 9, border: '1px solid var(--line)', borderRadius: 12, padding: '11px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, background: 'var(--par-bg)', color: 'var(--par)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{pi + 1}</span>
                <Riga label="Etichetta del passo" valore={p.et} salva={(v) => cambia({ et: v })} placeholder="Etichetta breve (facoltativa)" style={{ flex: 1, minWidth: 0, borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontWeight: 700 }} />
                <button type="button" className="hv" title="Vai a questo passo nel testo" onClick={() => { if (p.span) { ed.seleziona(p.span[0], p.span[1]); ed.imposta({ esDet: null }) } }} style={{ ...piccolo, padding: '7px 11px', fontSize: 11.5 }}>Vai</button>
                <Quadro size={28} label="Togli questo collegamento" onClick={() => scriviPassi(e.passi.filter((_, j) => j !== pi))}>✕</Quadro>
              </div>
              {p.stato === 'riagganciata' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--mute)' }}>
                  <span aria-hidden style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--par)' }} />
                  <span style={{ flex: 1 }}>Riagganciato da solo dopo una modifica del testo.</span>
                  <button type="button" className="hv" onClick={() => cambia({ stato: 'ok' })} style={{ ...piccolo, borderRadius: 6, padding: '3px 9px', fontSize: 11 }}>Ok</button>
                </div>
              )}
              {rotto && (
                <div style={{ border: '1px solid var(--warn-line)', background: 'var(--warn-bg)', color: 'var(--warn-ink)', borderRadius: 9, padding: '9px 10px', fontSize: 12, lineHeight: 1.5 }}>
                  <b>Da riagganciare.</b> {p.stato === 'ambigua' ? 'Il passo citato compare più volte nel nuovo testo: scegli tu quale.' : `Le parole citate non si trovano più nel testo: ${p.citato ? `«${p.citato}»` : '—'}`}
                  <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <button type="button" disabled={!sel} onClick={() => sel && cambia({ span: [sel[0], sel[1]], citato: citaDa(testo.corpo, tk.token, sel), stato: 'ok' })} style={{ border: '1px solid var(--warn-line)', background: 'transparent', color: 'var(--warn-ink)', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: sel ? 'pointer' : 'not-allowed', opacity: sel ? 1 : 0.45 }}>Riaggancia sulla selezione</button>
                    <span style={{ fontSize: 11.5, alignSelf: 'center' }}>{sel ? (() => { const c = citaDa(testo.corpo, tk.token, sel); return `Userà «${c.slice(0, 28)}${c.length > 28 ? '…' : ''}»` })() : 'Seleziona prima le parole giuste nel testo.'}</span>
                  </div>
                </div>
              )}
              {viva && (
                <div style={{ borderLeft: '3px solid var(--par)', paddingLeft: 12, fontSize: 15, lineHeight: 1.85 }}>
                  <Contesto span={p.span!} fs={15} fondo={(dentro) => (dentro ? 'var(--par-bg)' : 'transparent')} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Modale>
  )
}

// ------------------------------------------------------------------ importazione delle domande

export function ImportaEsercizi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const chiudi = (): void => ed.imposta({ esImportOpen: false, esImportFase: 'incolla', esImportTesto: '', esBozza: [], esCur: {} })
  const dest = (testo.esercizi.length ? `Si aggiungono alle ${testo.esercizi.length} già presenti in: ` : 'Si collegano a: ') + (testo.titolo || 'questo testo')
  const piccolo: React.CSSProperties = { border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 700 }
  const bozza = ed.esBozza
  const imposta = (b: Bozza[]): void => ed.imposta({ esBozza: b })

  return (
    <Modale
      titolo="Importa le domande"
      larghezza={720}
      chiudi={chiudi}
      scorri={false}
      corpoStyle={{ display: 'flex', flexDirection: 'column' }}
      intestazione={
        <>
          <strong style={{ flex: 1, fontSize: 13.5 }}>Importa le domande</strong>
          {chiudiBtn(chiudi)}
        </>
      }
    >
      {ed.esImportFase === 'incolla' ? (
        <>
          <div style={{ flex: 1, minHeight: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...piccolo, border: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--surface)' }}>Incolla</span>
              <button type="button" disabled title="Non ancora disponibile" style={{ ...piccolo, opacity: 0.45, cursor: 'not-allowed' }}>Da file .txt</button>
              <button type="button" disabled title="Non ancora disponibile" style={{ ...piccolo, opacity: 0.45, cursor: 'not-allowed' }}>Da PDF</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55 }}>{dest}</p>
            <textarea autoFocus aria-label="Domande da importare" value={ed.esImportTesto} onChange={(e) => ed.imposta({ esImportTesto: e.target.value })} spellCheck={false} placeholder={'1. Che funzione ha la siepe?\n2. Individua la gradazione dei versi 5-8.\n3. Perché il cuore «non si spaura»?'} style={{ flex: 1, minHeight: 240, resize: 'none', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 11, padding: '12px 13px', fontSize: 13.5, lineHeight: 1.7, outlineOffset: -2 }} />
          </div>
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--line2)' }}>
            <div style={{ flex: 1 }} />
            <button type="button" className="hv" onClick={chiudi} style={secondario}>Annulla</button>
            <button type="button" className="hvp" disabled={!ed.esImportTesto.trim()} onClick={() => ed.imposta({ esImportFase: 'separa', esBozza: separaDomande(ed.esImportTesto), esCur: {} })} style={{ ...primario, opacity: ed.esImportTesto.trim() ? 1 : 0.45 }}>Separa le domande</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--line2)' }}>
            <strong style={{ fontSize: 13 }}>{bozza.length} {bozza.length === 1 ? 'domanda riconosciuta' : 'domande riconosciute'}</strong>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{dest}</span>
          </div>
          <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '13px 16px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bozza.map((b, k) => {
              const cur = ed.esCur[b.id]
              return (
                <div key={b.id} style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700 }}>{k + 1}</span>
                    <div style={{ flex: 1 }} />
                    <button type="button" className="hv" disabled={k >= bozza.length - 1} title="Unisci con la domanda successiva" onClick={() => { const l = bozza.slice(); l[k] = { id: b.id, testo: b.testo + ' ' + l[k + 1]!.testo }; l.splice(k + 1, 1); imposta(l) }} style={{ ...secondario, borderRadius: 7, padding: '5px 9px', fontSize: 11 }}>Unisci</button>
                    <button
                      type="button"
                      className="hv"
                      disabled={cur == null}
                      title={cur == null ? 'Metti il cursore nel punto in cui vuoi tagliare' : 'Spezza in due domande nel punto del cursore'}
                      onClick={() => {
                        const t = b.testo
                        let cut = cur
                        if (cut == null || cut <= 0 || cut >= t.length) return
                        if (/\S/.test(t[cut - 1]!) && /\S/.test(t[cut]!)) while (cut > 0 && /\S/.test(t[cut - 1]!)) cut--
                        const a1 = t.slice(0, cut).trim()
                        const a2 = t.slice(cut).trim()
                        if (!a1 || !a2) return
                        const l = bozza.slice()
                        l.splice(k, 1, { id: b.id, testo: a1 }, { id: b.id + 's', testo: a2 })
                        ed.imposta({ esBozza: l, esCur: {} })
                      }}
                      style={{ ...secondario, borderRadius: 7, padding: '5px 9px', fontSize: 11 }}
                    >
                      Spezza
                    </button>
                    <Quadro size={26} label="Elimina" onClick={() => imposta(bozza.filter((x) => x.id !== b.id))}>✕</Quadro>
                  </div>
                  <textarea
                    aria-label={`Domanda ${k + 1}`}
                    value={b.testo}
                    onChange={(e) => imposta(bozza.map((x) => (x.id === b.id ? { id: x.id, testo: e.target.value } : x)))}
                    onSelect={(e) => ed.imposta({ esCur: { ...useEditor.getState().esCur, [b.id]: (e.target as HTMLTextAreaElement).selectionStart } })}
                    onKeyUp={(e) => ed.imposta({ esCur: { ...useEditor.getState().esCur, [b.id]: (e.target as HTMLTextAreaElement).selectionStart } })}
                    onClick={(e) => ed.imposta({ esCur: { ...useEditor.getState().esCur, [b.id]: (e.target as HTMLTextAreaElement).selectionStart } })}
                    style={{ width: '100%', minHeight: 62, resize: 'vertical', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 9, padding: '9px 10px', fontSize: 13, lineHeight: 1.6, outlineOffset: -2 }}
                  />
                </div>
              )
            })}
            <button type="button" className="hvi" onClick={() => imposta([...bozza, { id: 'b' + bozza.length + '_' + Date.now(), testo: '' }])} style={{ ...tratteggiato, alignSelf: 'flex-start' }}>+ Aggiungi una domanda</button>
          </div>
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--line2)' }}>
            <button type="button" className="hv" onClick={() => ed.imposta({ esImportFase: 'incolla' })} style={secondario}>Indietro</button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="hvp"
              onClick={async () => {
                const nuovi: Esercizio[] = bozza.filter((b) => b.testo.trim()).map((b, k) => ({ id: 'x' + Date.now().toString(36) + k, numero: 0, testo: b.testo.trim(), risposta: '', correzione: '', fatta: false, passi: [] }))
                await scriviEsercizi(testo.id, rinumera([...testo.esercizi.slice().sort((a, b) => a.numero - b.numero), ...nuovi]))
                chiudi()
              }}
              style={primario}
            >
              Salva esercizi
            </button>
          </div>
        </>
      )}
    </Modale>
  )
}

// ------------------------------------------------------------------ modifica del testo

export function ModificaTesto() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const [occ, setOcc] = useState(false)
  const chiudi = (): void => ed.imposta({ modOpen: false })
  return (
    <Modale
      titolo="Modifica il testo"
      larghezza={760}
      chiudi={chiudi}
      scorri={false}
      corpoStyle={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
      intestazione={
        <>
          <strong style={{ flex: 1, fontSize: 13.5 }}>Modifica il testo</strong>
          {chiudiBtn(chiudi)}
        </>
      }
      piede={
        <>
          <div style={{ flex: 1 }} />
          <button type="button" className="hv" onClick={chiudi} style={secondario}>Annulla</button>
          <button
            type="button"
            className="hvp"
            disabled={occ}
            onClick={async () => {
              setOcc(true)
              try {
                const r = await window.api.modificaCorpo(testo.id, ed.modBozza)
                useStore.getState().applica(r.modello)
                ed.imposta({ modOpen: false, sel: null, anchor: null, testa: null, riancoroInfo: { ok: r.esito.riagganciate, ko: r.esito.daSistemare } })
              } catch (e) {
                useStore.getState().mostraToast((e as Error).message)
              }
              setOcc(false)
            }}
            style={primario}
          >
            Applica e riaggancia
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55, textWrap: 'pretty' }}>Correggi refusi o versi. All'uscita le annotazioni cercano da sole le proprie parole nel nuovo testo; quelle che non si ritrovano restano segnalate nel pannello.</p>
      <textarea aria-label="Corpo del testo" autoFocus spellCheck={false} value={ed.modBozza} onChange={(e) => ed.imposta({ modBozza: e.target.value })} style={{ flex: 1, minHeight: 280, resize: 'none', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 11, padding: '13px 14px', fontSize: 14, lineHeight: 1.8, outlineOffset: -2 }} />
    </Modale>
  )
}

// ------------------------------------------------------------------ nuovo testo

export function NuovoTesto() {
  const ed = useEditor()
  const m = useStore((s) => s.modello)!
  const [f, setF] = useState({ titolo: '', anno: '', opera: '', layout: 'verso' as Layout, corpo: '' })
  const [occ, setOcc] = useState(false)
  const chiudi = (): void => ed.imposta({ nuovoOpen: false })
  const pronto = !!f.titolo.trim() && !!f.corpo.trim()
  const campo = (label: string, k: 'titolo' | 'anno' | 'opera', ph: string, disabled = false): React.ReactNode => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={lbl}>{label}</span>
      <input type="text" disabled={disabled} value={k === 'titolo' || k === 'anno' || k === 'opera' ? f[k] : ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} style={{ width: '100%', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 9, padding: '9px 11px', fontSize: 13, outlineOffset: -2 }} />
    </label>
  )
  const seg = (on: boolean): React.CSSProperties => ({ border: 0, padding: '0 14px', height: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)' })
  return (
    <Modale
      titolo="Nuovo testo"
      larghezza={720}
      chiudi={chiudi}
      corpoStyle={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
      intestazione={
        <>
          <strong style={{ flex: 1, fontSize: 13.5 }}>Nuovo testo</strong>
          {chiudiBtn(chiudi)}
        </>
      }
      piede={
        <>
          <div style={{ flex: 1 }} />
          <button type="button" className="hv" onClick={chiudi} style={secondario}>Annulla</button>
          <button
            type="button"
            className="hvp"
            disabled={!pronto || occ}
            onClick={async () => {
              setOcc(true)
              try {
                const r = await window.api.creaTesto({ titolo: f.titolo.trim(), anno: f.anno.trim(), opera: f.opera.trim(), layout: f.layout, corpo: f.corpo.trim() })
                useStore.getState().applica(r.modello)
                ed.imposta({ nuovoOpen: false, elencoTesti: false, selettoreOpen: false, testoId: r.id, sel: null, anchor: null, testa: null, tab: 'ann', annDet: null, esDet: null, riancoroInfo: null })
              } catch (e) {
                useStore.getState().mostraToast((e as Error).message)
              }
              setOcc(false)
            }}
            style={{ ...primario, opacity: pronto ? 1 : 0.45, cursor: pronto ? 'pointer' : 'not-allowed' }}
          >
            Crea il testo
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.55, textWrap: 'pretty' }}>Il testo che stai leggendo resta dov'è: questo se ne aggiunge accanto, e si passa dall'uno all'altro dal titolo in alto a sinistra.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {campo('Titolo', 'titolo', "L'infinito")}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={lbl}>Autore</span>
          <input type="text" disabled value={m.autore.nome} aria-label="Autore" style={{ width: '100%', border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--mute)', borderRadius: 9, padding: '9px 11px', fontSize: 13, outlineOffset: -2 }} />
        </label>
        {campo('Anno', 'anno', '1819')}
        {campo('Opera o raccolta', 'opera', 'Canti · Idilli')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={lbl}>Forma</span>
        <div role="group" aria-label="Forma del testo" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          <button type="button" aria-pressed={f.layout === 'verso'} onClick={() => setF({ ...f, layout: 'verso' })} style={{ ...seg(f.layout === 'verso'), borderRight: '1px solid var(--line)' }}>Versi</button>
          <button type="button" aria-pressed={f.layout === 'prosa'} onClick={() => setF({ ...f, layout: 'prosa' })} style={seg(f.layout === 'prosa')}>Prosa</button>
        </div>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={lbl}>Testo</span>
        <textarea aria-label="Testo" value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} placeholder="Incolla qui il testo…" spellCheck={false} style={{ width: '100%', minHeight: 200, resize: 'vertical', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 11, padding: '12px 13px', fontSize: 13.5, lineHeight: 1.75, outlineOffset: -2 }} />
      </label>
    </Modale>
  )
}

// ------------------------------------------------------------------ elenco testi (dalla Home)

export function ElencoTesti() {
  const ed = useEditor()
  const m = useStore((s) => s.modello)!
  const chiudi = (): void => ed.imposta({ elencoTesti: false })
  return (
    <Modale
      titolo="Testi"
      larghezza={560}
      chiudi={chiudi}
      corpoStyle={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}
      intestazione={
        <>
          <strong style={{ flex: 1, fontSize: 13.5 }}>Testi di {m.autore.nome}</strong>
          {chiudiBtn(chiudi)}
        </>
      }
    >
      {m.testi.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>Nessun testo in questo autore.</p>}
      {m.testi.map((t) => (
        <button key={t.id} type="button" className="hv" onClick={() => ed.imposta({ elencoTesti: false, testoId: t.id, sel: null, anchor: null, testa: null, tab: 'ann', annDet: null, esDet: null })} style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 10, padding: '9px 11px', cursor: 'pointer' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{t.titolo}</span>
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{[t.anno, t.opera].filter(Boolean).join(' · ') || '—'} · {t.annotazioni.length} {t.annotazioni.length === 1 ? 'annotazione' : 'annotazioni'}</span>
        </button>
      ))}
      <button type="button" className="hvi" onClick={() => ed.imposta({ nuovoOpen: true })} style={{ ...tratteggiato, width: '100%', textAlign: 'left', borderRadius: 10, padding: '9px 11px' }}>+ Importa un nuovo testo</button>
    </Modale>
  )
}

// ------------------------------------------------------------------ avviso di riaggancio

export function AvvisoRiancoro() {
  const ed = useEditor()
  const r = ed.riancoroInfo
  if (!r) return null
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 76, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,.26)', padding: '11px 14px', animation: 'dcUp .16s ease-out' }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.ok} {r.ok === 1 ? 'riferimento riagganciato' : 'riferimenti riagganciati'} · {r.ko} da sistemare — annotazioni, parafrasi e passi delle domande</span>
      <Quadro size={26} label="Chiudi avviso" onClick={() => ed.imposta({ riancoroInfo: null })}>✕</Quadro>
    </div>
  )
}

// ------------------------------------------------------------------ popover: selettore, lettura, legenda

const popX = (f: () => void, label: string): React.ReactNode => (
  <button type="button" onClick={f} aria-label={label} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 6, width: 24, height: 24, fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>✕</button>
)

export function PopoverSelettore() {
  const ed = useEditor()
  const m = useStore((s) => s.modello)!
  return (
    <div data-pop="1" style={{ position: 'fixed', top: 58, left: 14, zIndex: 70, width: 320, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: '0 18px 44px rgba(0,0,0,.24)', padding: 11, animation: 'dcUp .14s ease-out', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ ...lbl, padding: '2px 3px' }}>Testi di questo autore</span>
      {m.testi.filter((t) => t.id !== ed.testoId).map((t) => (
        <button key={t.id} type="button" className="hv" onClick={() => ed.imposta({ testoId: t.id, selettoreOpen: false, sel: null, anchor: null, testa: null, tab: 'ann', annDet: null, esDet: null, riancoroInfo: null })} style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 10, padding: '9px 11px', cursor: 'pointer' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{t.titolo}</span>
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{[m.autore.nome, t.anno].filter(Boolean).join(' · ') || '—'} · {t.annotazioni.length} {t.annotazioni.length === 1 ? 'annotazione' : 'annotazioni'}</span>
        </button>
      ))}
      <button type="button" className="hvi" onClick={() => ed.imposta({ nuovoOpen: true, selettoreOpen: false })} style={{ ...tratteggiato, width: '100%', textAlign: 'left', borderRadius: 10, padding: '9px 11px' }}>+ Importa un nuovo testo</button>
    </div>
  )
}

const FONT: { k: 'atkinson' | 'lexend' | 'sistema'; nome: string }[] = [{ k: 'atkinson', nome: 'Atkinson' }, { k: 'lexend', nome: 'Lexend' }, { k: 'sistema', nome: 'Sistema' }]

export function PopoverLettura() {
  const ed = useEditor()
  const st = useStore()
  const fs = Math.round(st.zoomUi * 16)
  return (
    <div data-pop="1" style={{ position: 'fixed', top: 58, right: 14, zIndex: 70, width: 286, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,.22)', padding: 14, animation: 'dcUp .14s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Lettura</strong>
        {popX(() => ed.imposta({ settingsOpen: false }), 'Chiudi impostazioni')}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mute)', marginBottom: 5 }}>Carattere</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {FONT.map((f) => {
          const on = st.font === f.k
          return <button key={f.k} type="button" aria-pressed={on} onClick={() => st.prefs({ font: f.k })} style={{ flex: 1, border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)', borderRadius: 7, padding: '8px 4px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{f.nome}</button>
        })}
      </div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--mute)', marginBottom: 4 }}>Dimensione interfaccia · {fs}px</label>
      <input type="range" min={13} max={19} step={1} value={Math.max(13, Math.min(19, fs))} onChange={(e) => st.prefs({ zoomUi: +(Number(e.target.value) / 16).toFixed(3) })} style={{ width: '100%', accentColor: 'var(--focus)', marginBottom: 12 }} />
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--mute)', marginBottom: 4 }}>Spaziatura righe · {(st.ls / 100).toFixed(2)}</label>
      <input type="range" min={130} max={200} step={5} value={st.ls} onChange={(e) => st.prefs({ ls: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--focus)' }} />
      <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.45 }}>La dimensione del testo da studiare si regola a parte, con lo zoom sulla card centrale.</p>
    </div>
  )
}

export function PopoverLegenda() {
  const ed = useEditor()
  const riga = (sw: React.ReactNode, nome: string): React.ReactNode => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {sw}
      {nome}
    </span>
  )
  const base: React.CSSProperties = { flex: 'none', width: 54, height: 17, borderRadius: 5 }
  const b = (t: string): React.ReactNode => <b style={{ color: 'var(--ink)' }}>{t}</b>
  const bolla = (bc: string, bg: string, fg: string, t: string): React.ReactNode => (
    <span aria-hidden style={{ flex: 'none', width: 54, display: 'flex', justifyContent: 'center' }}>
      <span style={{ border: `1px solid ${bc}`, background: bg, color: fg, borderRadius: 5, padding: '0 5px', fontSize: 11, fontWeight: 700 }}>{t}</span>
    </span>
  )
  return (
    <div data-pop="1" style={{ position: 'fixed', top: 62, right: 16, zIndex: 70, width: 330, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: '0 18px 44px rgba(0,0,0,.24)', padding: 14, animation: 'dcUp .14s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Legenda</strong>
        {popX(() => ed.imposta({ helpOpen: false }), 'Chiudi')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: 'var(--mute)' }}>
        {riga(<span aria-hidden style={{ ...base, background: 'var(--hl-c)', borderBottom: '3px solid var(--hl-c2)' }} />, 'Concetto')}
        {riga(<span aria-hidden style={{ ...base, background: 'var(--hl-d)', borderBottom: '3px solid var(--hl-d2)' }} />, 'Definizione')}
        {riga(<span aria-hidden style={{ ...base, background: 'var(--hl-u)', borderBottom: '3px solid var(--hl-u2)' }} />, 'Dubbio')}
        {riga(<span aria-hidden style={{ ...base, background: 'var(--hl-c)', backgroundImage: 'linear-gradient(var(--hl-c2),var(--hl-c2)),linear-gradient(var(--hl-c2),var(--hl-c2))', backgroundSize: '100% 2.5px,100% 2.5px', backgroundPosition: 'left bottom 0px,left bottom 4.5px', backgroundRepeat: 'no-repeat' }} />, 'Due annotazioni sulle stesse parole')}
        {riga(<span aria-hidden style={{ ...base, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '3px solid var(--ink)', borderRadius: 0 }} />, 'Sottolineatura')}
        {riga(<span aria-hidden style={{ flex: 'none', width: 54, textAlign: 'center', color: 'var(--ed)', textDecoration: 'underline wavy var(--ed)', textUnderlineOffset: 3 }}>abc</span>, 'Figura retorica')}
        {riga(bolla('var(--par)', 'var(--par-bg)', 'var(--par)', '¶'), 'Parafrasi sul verso')}
        {riga(bolla('var(--line)', 'var(--surface2)', 'var(--mute)', '?3'), 'Domanda sul verso')}
        {riga(<b style={{ flex: 'none', width: 54, textAlign: 'center', color: 'var(--ink)' }}>abc</b>, 'Parola chiave')}
      </div>
      <strong style={{ display: 'block', margin: '14px 0 8px', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Tasti</strong>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--mute)', lineHeight: 1.5 }}>
        <span>{b('clic')} una parola · {b('trascina')} o {b('Maiusc+clic')} un intervallo</span>
        <span>{b('← →')} sposta · {b('Maiusc+← →')} estendi · {b('Esc')} deseleziona</span>
        <span>{b('1 2 3')} evidenzia · {b('S')} sottolinea · {b('K F N P')}</span>
        <span>{b('D')} nuova domanda sul passo selezionato</span>
        <span>{b('Ctrl+rotellina')} zoom del testo</span>
      </div>
    </div>
  )
}
