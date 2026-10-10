import { useEffect, useRef } from 'react'
import { citaDa, daSistemare } from '@shared/testo'
import { useStore } from '../store'
import { useEditor } from './stato'
import { commutaMarca, correnteDi, salvaVoce, useTesto } from './dati'
import { TestoCard } from './TestoCard'
import { PannelloAnnotazioni, PannelloEsercizi, PannelloParafrasi } from './Pannelli'
import { Aiuto, ElencoTesti, ImportaEsercizi, ModificaTesto, NuovoTesto, SchedaAnnotazione } from './Modali'

const STRUMENTI = [
  { k: '1', nome: 'Concetto', icona: '▬', col: 'var(--hb-concetto)' },
  { k: '2', nome: 'Definizione', icona: '▬', col: 'var(--hb-definizione)' },
  { k: '3', nome: 'Dubbio', icona: '▬', col: 'var(--hb-dubbio)' },
  { k: 'S', nome: 'Sottolinea', icona: 'U̲', col: 'var(--ink)' },
  { k: 'K', nome: 'Parola chiave', icona: '★', col: 'var(--ink)' },
  { k: 'F', nome: 'Flashcard', icona: '❐', col: 'var(--ink)' }
] as const

const èCampo = (t: EventTarget | null): boolean => {
  const e = t as HTMLElement | null
  return !!e && (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.tagName) || e.isContentEditable)
}

export function EditorTesti() {
  const d = useTesto()
  const ed = useEditor()
  const st = useStore()
  const centro = useRef<HTMLDivElement>(null)

  // il testo non esiste più (eliminato da fuori): si torna alla Home
  useEffect(() => {
    if (!d) ed.imposta({ testoId: null })
  }, [d]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (): void => ed.imposta({ larghezza: window.innerWidth })
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // il passo selezionato resta in vista
  useEffect(() => {
    if (!ed.sel) return
    centro.current?.querySelector(`[data-i="${ed.sel[1]}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [ed.sel?.[0], ed.sel?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  // tastiera
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      const s = useEditor.getState()
      const dati = s.testoId ? useStore.getState().modello?.testi.find((t) => t.id === s.testoId) : null
      if (!dati) return
      const aperta = s.annDet || s.modificaTesto || s.nuovoTesto || s.importa || s.aiuto || s.elencoTesti
      if (e.key === 'Escape') {
        if (èCampo(e.target)) {
          ;(e.target as HTMLElement).blur()
          return
        }
        e.stopPropagation()
        if (s.aiuto) s.imposta({ aiuto: false })
        else if (s.importa) s.imposta({ importa: false })
        else if (s.nuovoTesto) s.imposta({ nuovoTesto: false })
        else if (s.modificaTesto) s.imposta({ modificaTesto: false, riepilogo: null })
        else if (s.annDet) s.imposta({ annDet: null, modifica: false })
        else if (s.elencoTesti) s.imposta({ elencoTesti: false })
        else if (useStore.getState().apertaId) useStore.getState().imposta({ apertaId: null, auto: false })
        else if (s.sel) s.imposta({ sel: null, anchor: null, testa: null })
        return
      }
      if (èCampo(e.target) || aperta || e.ctrlKey || e.metaKey || e.altKey) return
      if (useStore.getState().apertaId || useStore.getState().applicazione) return
      const dt = useTesto_()
      if (!dt) return
      const { testo, tk } = dt
      const sel = s.sel
      const citato = sel ? citaDa(testo.corpo, tk.token, sel) : ''
      const k = e.key.toLowerCase()
      const marca = ({ '1': { evidenzia: 'concetto' }, '2': { evidenzia: 'definizione' }, '3': { evidenzia: 'dubbio' }, s: { marca: 'sottolinea' }, k: { marca: 'parola_chiave' }, f: { marca: 'flashcard' } } as const)[k as '1']
      if (marca) {
        if (sel) {
          e.preventDefault()
          void commutaMarca(testo, sel, citato, marca as never)
        }
      } else if (k === 'n' && sel) {
        e.preventDefault()
        s.imposta({ pannello: 'ann', destraAperta: true })
        setTimeout(() => document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Nota sul passo"]')?.focus(), 30)
      } else if (k === 'p' && sel) {
        e.preventDefault()
        void salvaVoce(testo.id, 'parafrasi', { span: sel, citato, testo: '' }).then(() => s.imposta({ pannello: 'par', destraAperta: true }))
      } else if (k === 'd' && sel) {
        e.preventDefault()
        void salvaVoce(testo.id, 'esercizi', { testo: '', risposta: '', correzione: '', fatta: false, passi: [{ span: sel, citato, et: '' }] }).then((id) => s.imposta({ pannello: 'es', destraAperta: true, esercizioAperto: id }))
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const n = tk.token.length
        if (!n) return
        const dir = e.key === 'ArrowRight' ? 1 : -1
        if (!sel || s.testa == null || s.anchor == null) {
          s.seleziona(dir > 0 ? 0 : n - 1, dir > 0 ? 0 : n - 1)
          return
        }
        const nuova = Math.max(0, Math.min(n - 1, s.testa + dir))
        if (e.shiftKey) s.seleziona(s.anchor, nuova)
        else s.seleziona(nuova, nuova)
      }
    }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [])

  // Ctrl + rotella sul testo = zoom del testo
  useEffect(() => {
    const el = centro.current
    if (!el) return
    const h = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const z = useEditor.getState().zoom
      useEditor.getState().imposta({ zoom: Math.max(70, Math.min(190, z + (e.deltaY < 0 ? 10 : -10))) })
    }
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [!!d])

  if (!d) return null
  const { testo, tk, modello } = d
  const stretto = ed.larghezza < 1180
  const destraAperta = ed.destraAperta && !(stretto && false)
  const sel = ed.sel
  const sx = ed.sinistraAperta ? 176 : 64
  const nAnn = testo.annotazioni.filter((a) => !daSistemare(a.stato)).length
  const cur = correnteDi(testo, sel)
  const conta = (k: string): number => testo.annotazioni.filter((a) => !daSistemare(a.stato) && (k === '1' ? a.evidenzia === 'concetto' : k === '2' ? a.evidenzia === 'definizione' : k === '3' ? a.evidenzia === 'dubbio' : k === 'S' ? a.sottolinea : k === 'K' ? a.parola_chiave : a.flashcard)).length
  const attivo = (k: string): boolean => !!cur && (k === '1' ? cur.evidenzia === 'concetto' : k === '2' ? cur.evidenzia === 'definizione' : k === '3' ? cur.evidenzia === 'dubbio' : k === 'S' ? cur.sottolinea : k === 'K' ? cur.parola_chiave : cur.flashcard)
  const premi = (k: string): void => {
    if (!sel) return
    const citato = citaDa(testo.corpo, tk.token, sel)
    const m = ({ '1': { evidenzia: 'concetto' }, '2': { evidenzia: 'definizione' }, '3': { evidenzia: 'dubbio' }, S: { marca: 'sottolinea' }, K: { marca: 'parola_chiave' }, F: { marca: 'flashcard' } } as const)[k as '1']
    void commutaMarca(testo, sel, citato, m as never)
  }
  const daRiagganciare = testo.annotazioni.filter((a) => daSistemare(a.stato)).length + testo.parafrasi.filter((a) => daSistemare(a.stato)).length
  const schedaDelTesto = testo.scheda ? modello.schede.find((s) => s.id === testo.scheda) : null
  const zoom = (z: number): void => ed.imposta({ zoom: Math.max(70, Math.min(190, z)) })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <header style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={() => ed.imposta({ testoId: null, sel: null, anchor: null, testa: null })}>← Home</button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{testo.titolo}</div>
          <div style={{ fontSize: 12, color: 'var(--mute)' }}>{[modello.autore.nome, testo.anno, testo.opera].filter(Boolean).join(' · ')}</div>
        </div>
        {modello.testi.length > 1 && (
          <select className="inp" style={{ width: 'auto' }} aria-label="Cambia testo" value={testo.id} onChange={(e) => ed.imposta({ testoId: e.target.value, sel: null, anchor: null, testa: null, esercizioAperto: null })}>
            {modello.testi.map((t) => <option key={t.id} value={t.id}>{t.titolo}</option>)}
          </select>
        )}
        <button type="button" className="btn" onClick={() => ed.imposta({ modificaTesto: true, riepilogo: null })}>✎ Modifica testo</button>
        <div style={{ flex: 1 }} />
        {daRiagganciare > 0 && <button type="button" className="btn" style={{ borderColor: 'var(--warn-line)', background: 'var(--warn-bg)', color: 'var(--warn-ink)' }} onClick={() => ed.imposta({ pannello: 'ann', destraAperta: true })}>⚠ {daRiagganciare} da riagganciare</button>}
        <button type="button" className="btn" aria-pressed={ed.numeri} title="Numeri di riga" onClick={() => ed.imposta({ numeri: !ed.numeri })} style={ed.numeri ? { background: 'var(--surface2)' } : undefined}>#</button>
        <div role="group" aria-label="Zoom del testo" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          <button className="btn" style={{ border: 0, borderRadius: 0 }} aria-label="Riduci il testo" onClick={() => zoom(ed.zoom - 10)}>−</button>
          <button className="btn" style={{ border: 0, borderRadius: 0, minWidth: 60 }} title="Torna al 100%" onClick={() => zoom(100)}>{ed.zoom}%</button>
          <button className="btn" style={{ border: 0, borderRadius: 0 }} aria-label="Ingrandisci il testo" onClick={() => zoom(ed.zoom + 10)}>+</button>
        </div>
        <button type="button" className="btn" aria-label="Scorciatoie" title="Scorciatoie e legenda" onClick={() => ed.imposta({ aiuto: true })}>?</button>
        {schedaDelTesto && <button type="button" className="btn" onClick={() => { ed.imposta({ testoId: null }); st.imposta({ apertaId: schedaDelTesto.id, selId: schedaDelTesto.id }) }}>↗ Scheda sulla mappa</button>}
        <button type="button" className="btn" aria-label="Tema chiaro o scuro" onClick={() => st.prefs({ scuro: !st.scuro })}>{st.scuro ? '☀' : '☾'}</button>
        <button type="button" className="btn" onClick={() => st.imposta({ applicazione: true })}>Aa</button>
        <button type="button" className="btn on" onClick={() => ed.imposta({ nuovoTesto: true })}>+ Testo</button>
      </header>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={centro} onMouseDown={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-textcard]') === null) ed.imposta({ sel: null, anchor: null, testa: null }) }} style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: `20px ${destraAperta && !stretto ? ed.larghezzaDestra + 32 : 20}px 60px ${sx + 28}px` }}>
          <TestoCard />
        </div>

        {/* barra sinistra */}
        <aside aria-label="Strumenti" className="flot" style={{ position: 'absolute', left: 14, top: 14, width: sx - 14, padding: 6, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 20 }}>
          <button type="button" className="tool" aria-label="Apri o chiudi la barra" aria-expanded={ed.sinistraAperta} onClick={() => ed.imposta({ sinistraAperta: !ed.sinistraAperta })} style={{ fontSize: 16 }}>☰</button>
          {STRUMENTI.map((t) => (
            <button key={t.k} type="button" className="tool" disabled={!sel} aria-pressed={attivo(t.k)} title={`${t.nome} (${t.k})`} onClick={() => premi(t.k)} style={ed.sinistraAperta ? { flexDirection: 'row', gap: 8, padding: '7px 8px', justifyContent: 'flex-start', fontSize: 13 } : undefined}>
              <span aria-hidden style={{ fontSize: 16, color: t.col, lineHeight: 1 }}>{t.icona}</span>
              {ed.sinistraAperta && <span style={{ flex: 1, textAlign: 'left' }}>{t.nome}</span>}
              <span style={{ color: 'var(--mute)' }}>{ed.sinistraAperta ? `${t.k} · ` : ''}{conta(t.k)}</span>
            </button>
          ))}
          <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--mute)', fontWeight: 700, padding: '6px 0 2px', borderTop: '1px solid var(--line2)', marginTop: 4 }}>{nAnn} NOTE</div>
        </aside>

        {/* pannello destro */}
        {destraAperta ? (
          <aside aria-label="Pannello" className="flot" style={{ position: 'absolute', right: 14, top: 14, bottom: 14, width: Math.min(ed.larghezzaDestra, ed.larghezza - sx - 60), display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 20 }}>
            <div role="separator" aria-orientation="vertical" aria-label="Allarga il pannello" onMouseDown={(e) => {
              e.preventDefault()
              const x0 = e.clientX
              const w0 = ed.larghezzaDestra
              const muovi = (m: MouseEvent): void => ed.imposta({ larghezzaDestra: Math.max(320, Math.min(760, w0 + (x0 - m.clientX))) })
              const su = (): void => { document.removeEventListener('mousemove', muovi); document.removeEventListener('mouseup', su) }
              document.addEventListener('mousemove', muovi)
              document.addEventListener('mouseup', su)
            }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, cursor: 'col-resize', zIndex: 2 }} />
            <div role="tablist" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingLeft: 6 }}>
              {([['ann', `Annotazioni · ${nAnn}`], ['par', `Parafrasi · ${testo.parafrasi.length}`], ['es', `Esercizi · ${testo.esercizi.length}`]] as const).map(([k, t]) => (
                <button key={k} type="button" role="tab" className="tab-p" aria-selected={ed.pannello === k} onClick={() => ed.imposta({ pannello: k })}>{t}</button>
              ))}
              <button type="button" className="btn" aria-label="Riduci il pannello" style={{ border: 0, marginRight: 4 }} onClick={() => ed.imposta({ destraAperta: false })}>▸</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {ed.pannello === 'ann' ? <PannelloAnnotazioni /> : ed.pannello === 'par' ? <PannelloParafrasi /> : <PannelloEsercizi />}
            </div>
          </aside>
        ) : (
          <button type="button" className="flot" style={{ position: 'absolute', right: 14, top: 14, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', zIndex: 20, color: 'var(--ink)' }} onClick={() => ed.imposta({ destraAperta: true })}>◂ Pannello · {nAnn}</button>
        )}
      </div>

      {ed.annDet && <SchedaAnnotazione />}
      {ed.modificaTesto && <ModificaTesto />}
      {ed.importa && <ImportaEsercizi />}
      {ed.aiuto && <Aiuto />}
    </div>
  )
}

/** Il testo aperto, letto fuori da React (per i gestori di tastiera). */
function useTesto_() {
  const id = useEditor.getState().testoId
  const modello = useStore.getState().modello
  const testo = modello?.testi.find((t) => t.id === id)
  if (!testo) return null
  return { testo, tk: tokCache(testo.corpo, testo.layout) }
}

import { tokenizza, type Tokenizzato } from '@shared/testo'
import type { Layout } from '@shared/types'
let ultimo: { c: string; l: Layout; t: Tokenizzato } | null = null
function tokCache(c: string, l: Layout): Tokenizzato {
  if (!ultimo || ultimo.c !== c || ultimo.l !== l) ultimo = { c, l, t: tokenizza(c, l) }
  return ultimo.t
}

/** Finestre che si aprono anche dalla Home. */
export function FinestreEditorHome() {
  const ed = useEditor()
  return (
    <>
      {ed.elencoTesti && <ElencoTesti />}
      {ed.nuovoTesto && <NuovoTesto />}
    </>
  )
}
