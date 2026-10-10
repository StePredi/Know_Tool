import { useEffect } from 'react'
import { citaDa, daSistemare } from '@shared/testo'
import type { Annotazione, Esercizio, Evidenzia, Parafrasi, VoceScritta } from '@shared/types'
import { useStore } from '../store'
import { maxRightW, useEditor } from './stato'
import { eliminaVoce, rigaDi, salvaRaccolta, salvaVoce, scrivibile, statoEs, useTesto } from './dati'
import { nuovaDomanda, nuovaParafrasiLibera } from './azioni'
import { Area, lbl, Quadro } from './ui'

const HL: Record<Evidenzia, string> = { concetto: 'var(--hl-c)', definizione: 'var(--hl-d)', dubbio: 'var(--hl-u)' }
export const NOME_EV: Record<Evidenzia, string> = { concetto: 'Concetto', definizione: 'Definizione', dubbio: 'Dubbio' }
const ETI = { da_svolgere: 'Da svolgere', da_correggere: 'Da correggere', corretta: 'Corretta' }
const COL = { da_svolgere: ['var(--line)', 'var(--surface2)', 'var(--mute)'], da_correggere: ['var(--warn-line)', 'var(--warn-bg)', 'var(--warn-ink)'], corretta: ['var(--par)', 'var(--par-bg)', 'var(--par)'] } as const

export const nomeScheda = (id: string): string => useStore.getState().modello?.schede.find((s) => s.id === id)?.titolo_breve ?? id
export const larghezzaDx = (vw: number, leftPin: boolean, rightW: number): number => Math.max(300, Math.min(maxRightW(vw, leftPin), rightW))

const apriScheda = (id: string): void => useStore.getState().imposta({ apertaId: id, selId: id })

/** Pannello destro: tre schede (annotazioni, parafrasi, esercizi), ridimensionabile. */
export function PannelloDestro() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const wDx = larghezzaDx(ed.vw, ed.leftPin, ed.rightW)

  useEffect(() => {
    if (!ed.resizing) return
    const muovi = (e: MouseEvent): void => {
      e.preventDefault()
      const s = useEditor.getState()
      s.imposta({ rightW: Math.max(300, Math.min(maxRightW(window.innerWidth, s.leftPin), Math.round(window.innerWidth - e.clientX - 16))) })
    }
    const su = (): void => {
      useEditor.setState({ resizing: false })
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', muovi)
    document.addEventListener('mouseup', su)
    return () => {
      document.removeEventListener('mousemove', muovi)
      document.removeEventListener('mouseup', su)
    }
  }, [ed.resizing])

  const larga = wDx >= 560
  const allargaOff = maxRightW(ed.vw, ed.leftPin) <= 400 && wDx < 560
  const tabs = [
    ['ann', `Annotazioni · ${testo.annotazioni.length}`],
    ['par', `Parafrasi · ${testo.parafrasi.length}`],
    ['es', `Esercizi · ${testo.esercizi.length}`]
  ] as const
  const lato: React.CSSProperties = { flex: 'none', width: 36, border: 0, borderBottom: '3px solid transparent', borderLeft: '1px solid var(--line2)', background: 'var(--bg)', color: 'var(--mute)', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }

  return (
    <aside aria-label="Pannelli di riepilogo" style={{ position: 'absolute', right: 16, top: 16, bottom: 16, zIndex: 30, width: wDx, minWidth: 300, border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', boxShadow: '0 12px 30px rgba(8,12,18,.16)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'dcFade .14s ease-out' }}>
      <div
        onMouseDown={(e) => {
          e.preventDefault()
          document.body.style.userSelect = 'none'
          ed.imposta({ resizing: true })
        }}
        role="separator"
        aria-label="Trascina per allargare il pannello"
        title="Trascina per allargare il pannello"
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, cursor: 'col-resize', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span aria-hidden style={{ width: 3, height: 42, borderRadius: 2, background: ed.resizing ? 'var(--focus)' : 'transparent' }} />
      </div>
      <div role="tablist" aria-label="Pannelli" style={{ flex: 'none', display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--line)' }}>
        {tabs.map(([k, nome]) => (
          <button key={k} type="button" role="tab" aria-selected={ed.tab === k} onClick={() => ed.imposta({ tab: k })} style={{ flex: 1, minWidth: 0, border: 0, borderBottom: `3px solid ${ed.tab === k ? 'var(--focus)' : 'transparent'}`, background: ed.tab === k ? 'var(--surface)' : 'var(--bg)', color: ed.tab === k ? 'var(--ink)' : 'var(--mute)', padding: '12px 4px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</button>
        ))}
        <button type="button" className="hvi" disabled={allargaOff} onClick={() => ed.imposta({ rightW: ed.rightW >= 560 ? 392 : Math.min(640, maxRightW(ed.vw, ed.leftPin)) })} title={larga ? 'Riduci il pannello' : 'Allarga il pannello'} aria-label={larga ? 'Riduci il pannello' : 'Allarga il pannello'} style={lato}>{larga ? '⇥' : '⇤'}</button>
        <button type="button" className="hvi" onClick={() => ed.imposta({ rightOpen: false })} title="Riduci i pannelli" aria-label="Riduci i pannelli" style={lato}>▸</button>
      </div>
      {ed.tab === 'ann' && <TabAnnotazioni />}
      {ed.tab === 'par' && <TabParafrasi />}
      {ed.tab === 'es' && <TabEsercizi />}
    </aside>
  )
}

/** La pillola che resta quando il pannello è chiuso. */
export function PillolaDestra() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const nome = ed.tab === 'par' ? `Parafrasi · ${testo.parafrasi.length}` : ed.tab === 'es' ? 'Esercizi' : `Annotazioni · ${testo.annotazioni.length}`
  return (
    <button type="button" className="hv" onClick={() => ed.imposta({ rightOpen: true })} style={{ position: 'absolute', right: 16, top: 16, zIndex: 30, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 14, boxShadow: '0 12px 30px rgba(8,12,18,.16)', padding: '11px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, animation: 'dcFade .14s ease-out' }}>
      <span aria-hidden style={{ color: 'var(--mute)' }}>◂</span>
      <span style={{ whiteSpace: 'nowrap' }}>{nome}</span>
    </button>
  )
}

// ------------------------------------------------------------------ annotazioni

function TabAnnotazioni() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk, modello } = d
  const sel = ed.sel
  const B = ed.annVar === 'B'
  const citatoSel = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const ordinate = testo.annotazioni.slice().sort((a, b) => (a.span ?? a.spanScritto ?? [1e9, 0])[0] - (b.span ?? b.spanScritto ?? [1e9, 0])[0] || (a.span ?? [0, 0])[1] - (b.span ?? [0, 0])[1])
  const dot = (a: Annotazione): string => (a.evidenzia ? HL[a.evidenzia] : 'var(--line)')
  const seg = (on: boolean): React.CSSProperties => ({ border: 0, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)' })

  const apri = (a: Annotazione): void => {
    if (a.span && !daSistemare(a.stato)) ed.seleziona(a.span[0], a.span[1])
    ed.imposta({ annDet: a.id, detEdit: false })
  }
  const riaggancia = (a: Annotazione): void => {
    if (sel) void salvaVoce(testo.id, 'annotazioni', { id: a.id, span: sel, citato: citatoSel })
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderBottom: '1px solid var(--line2)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: 'var(--mute)', fontWeight: 700 }}>In ordine di testo</span>
        <div style={{ flex: 1 }} />
        <div role="group" aria-label="Densità del pannello" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 7, overflow: 'hidden' }}>
          <button type="button" aria-pressed={!B} onClick={() => ed.imposta({ annVar: 'A' })} style={{ ...seg(!B), borderRight: '1px solid var(--line)' }}>Compatto</button>
          <button type="button" aria-pressed={B} onClick={() => ed.imposta({ annVar: 'B' })} style={seg(B)}>Esteso</button>
        </div>
      </div>
      {ordinate.length === 0 && <div style={{ padding: '26px 18px', textAlign: 'center', color: 'var(--mute)', fontSize: 13, lineHeight: 1.6 }}>Nessuna annotazione.<br />Seleziona una o più parole nel testo e usa gli strumenti a sinistra.</div>}
      <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '11px 13px 24px', display: 'flex', flexDirection: 'column', gap: B ? 11 : 6 }}>
        {ordinate.map((a) => {
          const rot = daSistemare(a.stato)
          const fig = modello.figure.find((f) => f.id === a.figura)
          const riga = rot ? '⚑' : rigaDi(tk, testo.layout, a.span)
          const flags = (a.parola_chiave ? 'K' : '') + (a.flashcard ? 'F' : '') + (fig ? '❧' : '')
          if (!B) {
            return (
              <button key={a.id} type="button" className="hv" onClick={() => apri(a)} style={{ flex: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10, border: `1px solid ${rot ? 'var(--warn-line)' : 'var(--line)'}`, background: rot ? 'var(--warn-bg)' : 'var(--surface)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', minHeight: 40 }}>
                <span aria-hidden style={{ flex: 'none', width: 7, alignSelf: 'stretch', borderRadius: 4, background: rot ? 'var(--warn-line)' : dot(a) }} />
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: 'var(--mute)', width: 30, paddingTop: 1 }}>{riga}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>«{a.citato}»</span>
                  <span style={{ fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rot ? 'Da riagganciare' : a.nota || '—'}</span>
                </span>
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: 'var(--mute)', letterSpacing: '.08em' }}>{flags}</span>
              </button>
            )
          }
          const chip = (nome: string, bg: string, fg: string, bc: string) => <span key={nome} style={{ border: `1px solid ${bc}`, background: bg, color: fg, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{nome}</span>
          return (
            <div key={a.id} style={{ flex: 'none', border: `1px solid ${rot ? 'var(--warn-line)' : 'var(--line)'}`, background: rot ? 'var(--warn-bg)' : 'var(--surface)', borderRadius: 11, padding: '12px 13px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span aria-hidden style={{ flex: 'none', width: 11, height: 11, borderRadius: 4, background: rot ? 'var(--warn-line)' : dot(a) }} />
                <span style={lbl}>{riga}</span>
                <div style={{ flex: 1 }} />
                <button type="button" className="hv" onClick={() => apri(a)} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 7, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Vai al testo</button>
                <Quadro onClick={() => void eliminaVoce(testo.id, 'annotazioni', a.id)} label="Elimina annotazione">✕</Quadro>
              </div>
              <button type="button" className="hvo" onClick={() => apri(a)} title="Apri la scheda dell'annotazione" style={{ width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span aria-hidden style={{ flex: 'none', width: 3, alignSelf: 'stretch', borderRadius: 2, background: rot ? 'var(--warn-line)' : dot(a) }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty' }}>«{a.citato}»</span>
                <span aria-hidden style={{ flex: 'none', fontSize: 11, color: 'var(--mute)', paddingTop: 3 }}>▸</span>
              </button>
              {a.stato === 'riagganciata' && <Riagganciata testo="Riagganciata da sola dopo una modifica del testo." etichetta="Va bene" onOk={() => void salvaVoce(testo.id, 'annotazioni', { id: a.id, span: a.span, citato: a.citato })} />}
              {rot && <Avviso testo={a.stato === 'ambigua' ? 'Le parole citate compaiono in più punti: scegli tu quale.' : 'Le parole citate non si trovano più nel testo.'} etichetta="Riaggancia alla selezione" sel={sel} citato={citatoSel} onRiaggancia={() => riaggancia(a)} />}
              {a.nota.trim() && <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink)', textWrap: 'pretty' }}>{a.nota}</p>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {a.evidenzia && chip(NOME_EV[a.evidenzia], dot(a), 'var(--ink)', 'var(--line)')}
                {fig && chip(`❧ ${fig.nome}`, 'var(--ed-bg)', 'var(--ed)', 'var(--ed)')}
                {a.sottolinea && chip('Sottolineata', 'var(--surface2)', 'var(--ink)', 'var(--ink)')}
                {a.parola_chiave && chip('Parola chiave', 'var(--surface2)', 'var(--ink)', 'var(--line)')}
                {a.flashcard && chip('Flashcard', 'var(--surface2)', 'var(--ink)', 'var(--line)')}
                {a.schede.map((s) => (
                  <button key={s.id} type="button" onClick={() => apriScheda(s.id)} title="Apri la scheda collegata sulla mappa dell'autore" style={{ border: '1px solid var(--focus)', background: 'transparent', color: 'var(--focus)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>↗ {nomeScheda(s.id)}</button>
                ))}
                <button type="button" className="hvi" onClick={() => { if (a.span && !rot) ed.seleziona(a.span[0], a.span[1]); ed.imposta({ figOpen: true, figQ: '', figPrev: a.figura || 'metafora', figTarget: a.id }) }} style={{ border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>❧ {fig ? 'Cambia figura' : 'Aggiungi figura'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Riagganciata(props: { testo: string; etichetta: string; onOk: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--mute)' }}>
      <span aria-hidden style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--par)' }} />
      <span style={{ flex: 1 }}>{props.testo}</span>
      <button type="button" className="hv" onClick={props.onOk} style={{ flex: 'none', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{props.etichetta}</button>
    </div>
  )
}

export function Avviso(props: { testo: string; etichetta: string; sel: [number, number] | null; citato: string; onRiaggancia: () => void }) {
  return (
    <div style={{ border: '1px solid var(--warn-line)', background: 'var(--warn-bg)', color: 'var(--warn-ink)', borderRadius: 9, padding: '9px 10px', fontSize: 12, lineHeight: 1.5 }}>
      <b>Da riagganciare.</b> {props.testo}
      <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <button type="button" disabled={!props.sel} onClick={props.onRiaggancia} style={{ border: '1px solid var(--warn-line)', background: 'transparent', color: 'var(--warn-ink)', borderRadius: 7, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, cursor: props.sel ? 'pointer' : 'not-allowed', opacity: props.sel ? 1 : 0.45 }}>{props.etichetta}</button>
        <span style={{ fontSize: 11.5, alignSelf: 'center' }}>{props.sel ? `Userà «${props.citato.slice(0, 28)}${props.citato.length > 28 ? '…' : ''}»` : 'Seleziona prima le parole giuste nel testo.'}</span>
      </div>
    </div>
  )
}
export { Riagganciata }

// ------------------------------------------------------------------ parafrasi

function TabParafrasi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk } = d
  const sel = ed.sel
  const citatoSel = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const paras = testo.parafrasi.slice().sort((a, b) => (a.span ? 0 : 1) - (b.span ? 0 : 1) || (a.span && b.span ? a.span[0] - b.span[0] : a.ordine - b.ordine))
  const salva = (id: string, campi: Record<string, unknown>): void => void salvaVoce(testo.id, 'parafrasi', { id, ...campi })

  return (
    <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '13px 13px 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      {paras.map((p: Parafrasi) => {
        const rot = daSistemare(p.stato)
        const viva = !!p.span && !rot && p.span[1] < tk.token.length
        return (
          <div key={p.id} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 11, padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...lbl, letterSpacing: '.07em', color: rot ? 'var(--warn-ink)' : viva ? 'var(--par)' : 'var(--mute)', border: `1px solid ${rot ? 'var(--warn-line)' : viva ? 'var(--par)' : 'var(--line)'}`, background: rot ? 'var(--warn-bg)' : viva ? 'var(--par-bg)' : 'var(--surface2)', borderRadius: 999, padding: '2px 9px' }}>{viva ? rigaDi(tk, testo.layout, p.span) : p.citato ? 'Da riagganciare' : 'Libera'}</span>
              <div style={{ flex: 1 }} />
              <button type="button" className="hvi" onClick={() => salva(p.id, p.span ? { span: null, citato: '' } : sel ? { span: sel, citato: citatoSel } : {})} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 7, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', color: 'var(--mute)' }}>{p.span ? 'Scollega' : 'Collega alla selezione'}</button>
              <Quadro onClick={() => void eliminaVoce(testo.id, 'parafrasi', p.id)} label="Elimina parafrasi">✕</Quadro>
            </div>
            {p.citato && <blockquote style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--mute)', borderLeft: '3px solid var(--par)', paddingLeft: 10 }}>«{p.citato}»</blockquote>}
            {p.stato === 'riagganciata' && <Riagganciata testo="Riagganciata da sola dopo una modifica del testo." etichetta="Ok" onOk={() => salva(p.id, { span: p.span, citato: p.citato })} />}
            {rot && <Avviso testo={p.stato === 'ambigua' ? 'Il passo citato compare più volte nel nuovo testo: scegli tu quale.' : 'Le parole citate non si trovano più nel testo.'} etichetta="Riaggancia sulla selezione" sel={sel} citato={citatoSel} onRiaggancia={() => sel && salva(p.id, { span: sel, citato: citatoSel })} />}
            <Area label="Parafrasi" placeholder="Scrivi la parafrasi…" valore={p.testo} salva={(v) => salva(p.id, { testo: v })} style={{ minHeight: 86, borderRadius: 9, padding: '9px 10px', fontSize: 13, lineHeight: 1.6 }} />
          </div>
        )
      })}
      <button type="button" className="hvi" onClick={() => void nuovaParafrasiLibera()} style={{ alignSelf: 'flex-start', border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)', borderRadius: 9, padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>+ Parafrasi libera</button>
    </div>
  )
}

// ------------------------------------------------------------------ esercizi

export const rinumera = (l: Esercizio[]): Esercizio[] => l.map((e, i) => ({ ...e, numero: i + 1 }))

export function scriviEsercizi(testoId: string, l: Esercizio[]): Promise<void> {
  return salvaRaccolta(testoId, 'esercizi', l.map((e) => ({ ...e, passi: e.passi.map((p) => scrivibile(p)) }) as unknown as VoceScritta))
}

function TabEsercizi() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const lista = testo.esercizi.slice().sort((a, b) => a.numero - b.numero)
  const sel = ed.sel
  const svolte = lista.filter((e) => e.risposta.trim()).length
  const prossima = lista.find((e) => !e.risposta.trim())
  const visibili = lista.filter((e) => ed.esFiltro === 'tutti' || statoEs(e) === ed.esFiltro)
  const apriImport = (): void => ed.imposta({ esImportOpen: true, esImportFase: 'incolla', esImportTesto: '', esBozza: [], esCur: {} })
  const filtri = [['tutti', 'Tutte'], ['da_svolgere', 'Da svolgere'], ['da_correggere', 'Da correggere'], ['corretta', 'Corrette']] as const

  if (lista.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '30px 22px', textAlign: 'center' }}>
        <strong style={{ fontSize: 14.5 }}>Nessun esercizio ancora</strong>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.6, maxWidth: '30ch', textWrap: 'pretty' }}>Importa le domande per iniziare, oppure scrivine una partendo da un passo selezionato nel testo.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="hvp" onClick={apriImport} style={{ border: '1px solid var(--focus)', background: 'var(--focus)', color: 'var(--surface)', borderRadius: 9, padding: '10px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Importa le domande</button>
          <button type="button" disabled={!sel} onClick={() => void nuovaDomanda()} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '10px 15px', fontSize: 12.5, fontWeight: 700, cursor: sel ? 'pointer' : 'not-allowed', opacity: sel ? 1 : 0.45 }}>Nuova sulla selezione</button>
        </div>
      </div>
    )
  }

  const piccolo: React.CSSProperties = { border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 7, padding: '6px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 9, padding: '10px 13px', borderBottom: '1px solid var(--line2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{svolte} / {lista.length}</span>
          <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>svolte</span>
          <div style={{ flex: 1 }} />
          {prossima && (
            <button type="button" className="hvp" onClick={() => ed.imposta({ esDet: prossima.id, esEdit: null, esTestoEdit: null })} style={{ border: '1px solid var(--focus)', background: 'var(--focus)', color: 'var(--surface)', borderRadius: 7, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{svolte ? 'Continua' : 'Inizia'}</button>
          )}
          <button type="button" disabled={!sel} title="Nuova domanda sul passo selezionato (tasto D)" onClick={() => void nuovaDomanda()} style={{ ...piccolo, cursor: sel ? 'pointer' : 'not-allowed', opacity: sel ? 1 : 0.45 }}>+ Sulla selezione</button>
          <button type="button" className="hv" onClick={apriImport} style={piccolo}>Importa</button>
        </div>
        <div role="group" aria-label="Filtra per stato" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filtri.map(([k, nome]) => {
            const n = k === 'tutti' ? lista.length : lista.filter((e) => statoEs(e) === k).length
            const on = ed.esFiltro === k
            return <button key={k} type="button" aria-pressed={on} onClick={() => ed.imposta({ esFiltro: k })} style={{ border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)', borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{nome} · {n}</button>
          })}
        </div>
      </div>
      <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '12px 13px 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {visibili.map((e) => {
          const st = statoEs(e)
          const col = COL[st]
          const nPassi = e.passi.length
          return (
            <div key={e.id} style={{ flex: 'none', border: `1px solid ${st === 'da_correggere' ? 'var(--warn-line)' : 'var(--line)'}`, background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
              <span aria-hidden style={{ flex: 'none', width: 4, background: col[0] }} />
              <button type="button" className="hv" onClick={() => ed.imposta({ esDet: e.id, esTestoEdit: null })} title="Apri la domanda per svolgerla" style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', padding: '11px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{e.numero}</span>
                  <span style={{ flex: 'none', border: `1px solid ${col[0]}`, background: col[1], color: col[2], borderRadius: 999, padding: '2px 9px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{ETI[st]}</span>
                  <span style={{ flex: 1 }} />
                  {nPassi > 0 && <span title={nPassi > 1 ? `${nPassi} passi collegati` : 'Collegata a un passo del testo'} style={{ flex: 'none', border: '1px solid var(--par)', background: 'var(--par-bg)', color: 'var(--par)', borderRadius: 5, padding: '1px 6px', fontSize: 10.5, fontWeight: 700 }}>{nPassi > 1 ? `¶ ${nPassi}` : '¶'}</span>}
                  <span aria-hidden style={{ flex: 'none', fontSize: 11, color: 'var(--mute)' }}>▸</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty' }}>{e.testo || 'Domanda senza testo'}</span>
                {e.risposta.trim() && <span style={{ fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{e.risposta.trim()}</span>}
              </button>
              <span style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 5, padding: '11px 10px 11px 0' }}>
                <button type="button" aria-pressed={e.fatta} aria-label={e.fatta ? 'Segna come non fatta' : 'Segna come fatta'} title={e.fatta ? 'Segna come non fatta' : 'Segna come fatta'} onClick={() => void salvaVoce(testo.id, 'esercizi', { id: e.id, fatta: !e.fatta })} style={{ border: `2px solid ${e.fatta ? 'var(--par)' : 'var(--line)'}`, background: e.fatta ? 'var(--par)' : 'var(--surface)', color: e.fatta ? 'var(--on)' : 'transparent', borderRadius: 8, width: 28, height: 28, fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>✓</button>
                <Quadro size={26} label="Elimina domanda" onClick={() => void scriviEsercizi(testo.id, rinumera(lista.filter((x) => x.id !== e.id)))}>✕</Quadro>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
