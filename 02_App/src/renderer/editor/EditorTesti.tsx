import { useEffect, useState } from 'react'
import { parole } from '@shared/testo'
import { useStore } from '../store'
import { useEditor } from './stato'
import { useTesto } from './dati'
import { contesto, nuovaDomanda, nuovaParafrasi, toggleFlag, toggleHl } from './azioni'
import { BarraStrumenti } from './BarraStrumenti'
import { TestoCard } from './TestoCard'
import { PannelloDestro, PillolaDestra } from './Pannelli'
import { SchedaRiassuntiva } from './Riassuntiva'
import { AvvisoRiancoro, ElencoTesti, ImportaEsercizi, ModificaTesto, NuovoTesto, PopoverLegenda, PopoverLettura, PopoverSelettore, SchedaAnnotazione, SchedaDomanda, SelettoreFigure } from './Modali'
import { lbl } from './ui'
import { Con, Icona } from '../componenti/Icona'

const èCampo = (t: EventTarget | null): boolean => {
  const e = t as HTMLElement | null
  return !!e && (['INPUT', 'TEXTAREA'].includes(e.tagName) || e.isContentEditable)
}

const quadro: React.CSSProperties = { flex: 'none', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, width: 34, height: 34, fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }
const attivo = (on: boolean): React.CSSProperties => ({ border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)' })
const separatore = <span style={{ flex: 'none', width: 1, height: 26, background: 'var(--line2)' }} />

function aggiornaTesto(id: string, patch: Parameters<typeof window.api.aggiornaTesto>[1]): void {
  void window.api
    .aggiornaTesto(id, patch)
    .then((m) => useStore.getState().applica(m))
    .catch((e: Error) => useStore.getState().mostraToast(e.message))
}

export function EditorTesti() {
  const d = useTesto()
  const ed = useEditor()
  const st = useStore()

  // il testo non esiste più (eliminato da fuori): si torna alla Home
  useEffect(() => {
    if (!d) useEditor.setState({ testoId: null })
  }, [d])

  // larghezza della finestra: sotto 1180 il pannello destro si chiude da solo, quando torna larga si riapre
  useEffect(() => {
    const h = (): void => {
      const s = useEditor.getState()
      useEditor.setState({ vw: window.innerWidth, rightOpen: window.innerWidth < 1180 ? false : s.vw < 1180 ? true : s.rightOpen })
    }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // Ctrl + rotella sulla card = zoom del testo; clic fuori dai popover li chiude
  useEffect(() => {
    const wheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      const t = e.target as HTMLElement | null
      if (!t?.closest?.('[data-textcard]')) return
      e.preventDefault()
      const z = useEditor.getState().zoom
      useEditor.getState().imposta({ zoom: Math.min(190, Math.max(70, z + (e.deltaY < 0 ? 10 : -10))) })
    }
    const via = (e: MouseEvent): void => {
      const s = useEditor.getState()
      if (!s.settingsOpen && !s.helpOpen && !s.selettoreOpen) return
      if ((e.target as HTMLElement | null)?.closest?.('[data-pop]')) return
      useEditor.setState({ settingsOpen: false, helpOpen: false, selettoreOpen: false })
    }
    document.addEventListener('wheel', wheel, { passive: false })
    document.addEventListener('mousedown', via)
    return () => {
      document.removeEventListener('wheel', wheel)
      document.removeEventListener('mousedown', via)
    }
  }, [])

  // tastiera
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      const s = useEditor.getState()
      const c = contesto()
      if (!c) return
      const g = useStore.getState()
      if (g.apertaId || g.editId || g.applicazione || g.controlli) return
      if (èCampo(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      if (s.modOpen || s.nuovoOpen || s.esImportOpen || s.riasOpen) {
        if (e.key === 'Escape') s.imposta({ modOpen: false, nuovoOpen: false, esImportOpen: false, riasOpen: false })
        return
      }
      if (s.figOpen) {
        if (e.key === 'Escape') s.imposta({ figOpen: false })
        return
      }
      if (s.elencoTesti) {
        if (e.key === 'Escape') s.imposta({ elencoTesti: false })
        return
      }
      if (s.esDet) {
        if (e.key === 'Escape') s.imposta({ esDet: null, esTestoEdit: null, esEdit: null })
        return
      }
      if (s.annDet) {
        if (e.key === 'Escape') s.imposta({ annDet: null, detEdit: false })
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const o = c.testo.annotazioni.slice().sort((a, b) => (a.span ? a.span[0] : 1e9) - (b.span ? b.span[0] : 1e9))
          const i = o.findIndex((a) => a.id === s.annDet)
          const j = i + (e.key === 'ArrowRight' ? 1 : -1)
          if (j >= 0 && j < o.length) s.imposta({ annDet: o[j]!.id })
        }
        return
      }
      if (!c.testo.corpo.trim()) return
      if (e.ctrlKey || e.metaKey || e.altKey) return // lo zoom con Ctrl lo gestisce App
      const toks = c.tk.token
      const sel = s.sel
      if (e.key === 'Escape') {
        s.imposta({ sel: null, anchor: null, testa: null })
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const dd = e.key === 'ArrowRight' ? 1 : -1
        if (!sel) {
          s.seleziona(0, 0)
          return
        }
        if (e.shiftKey) {
          const anchor = s.anchor == null ? sel[0] : s.anchor
          const testa = s.testa == null ? (anchor === sel[0] ? sel[1] : sel[0]) : s.testa
          const np = Math.min(toks.length - 1, Math.max(0, testa + dd))
          useEditor.setState({ sel: [Math.min(anchor, np), Math.max(anchor, np)], anchor, testa: np })
        } else {
          const np = Math.min(toks.length - 1, Math.max(0, (dd > 0 ? sel[1] : sel[0]) + dd))
          s.seleziona(np, np)
        }
        return
      }
      if (!sel) return
      const k = e.key.toLowerCase()
      const fa = (f: () => void): void => {
        e.preventDefault()
        f()
      }
      if (k === '1') fa(() => toggleHl('concetto'))
      else if (k === '2') fa(() => toggleHl('definizione'))
      else if (k === '3') fa(() => toggleHl('dubbio'))
      else if (k === 'k') fa(() => toggleFlag('parola_chiave'))
      else if (k === 'f') fa(() => toggleFlag('flashcard'))
      else if (k === 's') fa(() => toggleFlag('sottolinea'))
      else if (k === 'n')
        fa(() => {
          s.imposta({ leftPin: true })
          setTimeout(() => document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Nota sul passo selezionato"]')?.focus(), 30)
        })
      else if (k === 'p') fa(() => void nuovaParafrasi())
      else if (k === 'd') fa(() => void nuovaDomanda())
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  // il passo selezionato resta in vista
  useEffect(() => {
    if (!ed.sel) return
    document.querySelector(`[data-textcard] [data-i="${ed.sel[1]}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [ed.sel?.[0], ed.sel?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return null
  const { testo, modello } = d
  const vuoto = !testo.corpo.trim()
  const prosa = testo.layout === 'prosa'
  const sottotitolo = vuoto ? 'Nessun testo importato' : [modello.autore.nome, testo.anno, testo.opera].filter(Boolean).join(' · ') || 'Senza dati'
  const zoom = (z: number): void => ed.imposta({ zoom: Math.min(190, Math.max(70, z)) })
  const scuro = st.scuro
  const scheda = testo.scheda ? modello.schede.find((x) => x.id === testo.scheda) : null
  const seg = (on: boolean, extra: React.CSSProperties = {}): React.CSSProperties => ({ border: 0, padding: '0 14px', height: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)', ...extra })

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <header style={{ flex: 'none', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', flexWrap: 'wrap' }}>
          <button type="button" className="hv" onClick={() => ed.imposta({ testoId: null, sel: null, anchor: null, testa: null, annDet: null, esDet: null, selettoreOpen: false })} title="Torna alla Home" aria-label="Torna alla Home" style={quadro}><Icona nome="casa" size={17} style={{ margin: '0 auto' }} /></button>
          <button type="button" data-pop="1" className="hv" onClick={() => ed.imposta({ selettoreOpen: !ed.selettoreOpen })} aria-expanded={ed.selettoreOpen} title="Cambia testo" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, border: '1px solid transparent', background: 'transparent', borderRadius: 9, padding: '4px 9px', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>{testo.titolo || 'Testo senza titolo'}</strong>
              <span style={{ fontSize: 11.5, color: 'var(--mute)', whiteSpace: 'nowrap' }}>{sottotitolo}</span>
            </span>
            <span aria-hidden style={{ color: 'var(--mute)', display: 'flex' }}><Icona nome="apri" size={15} /></span>
          </button>
          <button type="button" className="hv" onClick={() => ed.imposta({ modOpen: true, modBozza: testo.corpo, sel: null, anchor: null, testa: null, riancoroInfo: null })} title="Modifica il testo" aria-label="Modifica il testo" style={quadro}><Icona nome="matita" size={16} style={{ margin: '0 auto' }} /></button>
          {separatore}
          <div role="group" aria-label="Layout del testo" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
            <button type="button" aria-pressed={!prosa} onClick={() => aggiornaTesto(testo.id, { layout: 'verso' })} style={seg(!prosa, { borderRight: '1px solid var(--line)' })}><Con i="versi" size={14}>Versi</Con></button>
            <button type="button" aria-pressed={prosa} onClick={() => aggiornaTesto(testo.id, { layout: 'prosa' })} style={seg(prosa)}><Con i="prosa" size={14}>Prosa</Con></button>
          </div>
          <button type="button" aria-pressed={ed.numeri} onClick={() => ed.imposta({ numeri: !ed.numeri })} title="Numeri di riga" aria-label="Numeri di riga" style={{ ...quadro, ...attivo(ed.numeri) }}><Icona nome="numeri" size={16} style={{ margin: '0 auto' }} /></button>
          <div role="group" aria-label="Zoom del testo" style={{ flex: 'none', display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
            <button type="button" onClick={() => zoom(ed.zoom - 10)} aria-label="Riduci il testo" style={{ border: 0, borderRight: '1px solid var(--line)', background: 'transparent', width: 32, height: 34, fontSize: 15, fontWeight: 700, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icona nome="meno" size={15} /></button>
            <button type="button" onClick={() => zoom(100)} title="Ripristina lo zoom (Ctrl 0)" style={{ border: 0, borderRight: '1px solid var(--line)', background: 'transparent', padding: '0 9px', height: 34, fontSize: 12, fontWeight: 700, cursor: 'pointer', minWidth: 54 }}>{ed.zoom}%</button>
            <button type="button" onClick={() => zoom(ed.zoom + 10)} aria-label="Ingrandisci il testo" style={{ border: 0, background: 'transparent', width: 32, height: 34, fontSize: 15, fontWeight: 700, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icona nome="piu" size={15} /></button>
          </div>

          <div style={{ flex: '1 1 0', minWidth: 8 }} />

          <button type="button" data-pop="1" onClick={() => ed.imposta({ helpOpen: !ed.helpOpen, settingsOpen: false })} aria-expanded={ed.helpOpen} title="Legenda e scorciatoie" aria-label="Legenda e scorciatoie" style={{ ...quadro, ...attivo(ed.helpOpen) }}><Icona nome="aiuto" size={17} style={{ margin: '0 auto' }} /></button>
          <button
            type="button"
            className="hv"
            disabled={!scheda}
            onClick={() => {
              if (!scheda) return
              ed.imposta({ testoId: null, sel: null, anchor: null, testa: null })
              useStore.getState().imposta({ apertaId: scheda.id, selId: scheda.id })
            }}
            title={scheda ? "Apri la scheda di questo testo sulla mappa dell'autore" : 'Questo testo non è collegato a una scheda della mappa'}
            aria-label="Scheda sulla mappa dell'autore"
            style={{ ...quadro, border: '1px solid var(--focus)', background: 'transparent', color: 'var(--focus)', opacity: scheda ? 1 : 0.45, cursor: scheda ? 'pointer' : 'not-allowed' }}
          >
            <Icona nome="mappa" size={17} style={{ margin: '0 auto' }} />
          </button>
          <button type="button" className="hv" onClick={() => st.prefs({ scuro: !scuro })} title={scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro'} aria-label={scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro'} style={quadro}><Icona nome={scuro ? 'luna' : 'sole'} size={17} style={{ margin: '0 auto' }} /></button>
          <button type="button" data-pop="1" onClick={() => ed.imposta({ settingsOpen: !ed.settingsOpen, helpOpen: false })} aria-expanded={ed.settingsOpen} title="Carattere e spaziatura dell'interfaccia" style={{ ...quadro, ...attivo(ed.settingsOpen) }}><Icona nome="testo" size={17} style={{ margin: '0 auto' }} /></button>
          <button type="button" className="hv" disabled={vuoto} onClick={() => ed.imposta({ riasOpen: true })} title={testo?.proposta ? 'Claude ha preparato una proposta di scheda: aprila' : 'Scheda riassuntiva: chiedi a Claude di prepararla'} style={{ flex: 'none', whiteSpace: 'nowrap', border: `1px solid ${testo?.proposta ? 'var(--par)' : 'var(--line)'}`, background: testo?.proposta ? 'var(--par-bg)' : 'var(--surface)', color: testo?.proposta ? 'var(--par)' : undefined, borderRadius: 8, padding: '0 13px', height: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, opacity: vuoto ? 0.45 : 1 }}>
            <Icona nome="carte" size={15} />Scheda riassuntiva{testo?.proposta ? ' · pronta' : ''}
          </button>
          {separatore}
          <button type="button" className="hv" onClick={() => ed.imposta({ nuovoOpen: true })} title="Importa un nuovo testo" style={{ flex: 'none', whiteSpace: 'nowrap', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, padding: '0 13px', height: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}><Con i="aggiungiScheda">Testo</Con></button>
        </div>
      </header>

      {ed.selettoreOpen && <PopoverSelettore />}
      {ed.settingsOpen && <PopoverLettura />}
      {ed.helpOpen && <PopoverLegenda />}

      {vuoto ? (
        <StatoVuoto />
      ) : (
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <BarraStrumenti />
          <TestoCard />
          {ed.rightOpen ? <PannelloDestro /> : <PillolaDestra />}
        </div>
      )}

      <AvvisoRiancoro />
      {ed.modOpen && <ModificaTesto />}
      {ed.riasOpen && <SchedaRiassuntiva />}
      {ed.esImportOpen && <ImportaEsercizi />}
      {ed.esDet && <SchedaDomanda />}
      {ed.annDet && <SchedaAnnotazione />}
      {ed.figOpen && <SelettoreFigure />}
    </div>
  )
}

// ------------------------------------------------------------------ testo ancora vuoto (importazione)

function StatoVuoto() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo } = d
  const [variante, setVariante] = useState<'A' | 'B'>('A')
  const [avviso, setAvviso] = useState('')
  const prosa = testo.layout === 'prosa'
  const b = ed.bozza
  const info = b.trim() ? `${parole(b).length} parole · ${b.trim().split('\n').filter((x) => x.trim()).length} righe` : "Il testo si può ancora sistemare dopo l'import."
  const importa = async (): Promise<void> => {
    if (!b.trim()) return
    try {
      const r = await window.api.modificaCorpo(testo.id, b.trim())
      useStore.getState().applica(r.modello)
      ed.imposta({ bozza: '', incollaAperto: false, sel: null, anchor: null, testa: null })
    } catch (e) {
      useStore.getState().mostraToast((e as Error).message)
    }
  }
  const leggiFile = (f: File | undefined): void => {
    if (!f) return
    void f.text().then((t) => ed.imposta({ bozza: t, incollaAperto: true }))
  }
  const seg = (on: boolean, extra: React.CSSProperties = {}): React.CSSProperties => ({ border: 0, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)', ...extra })
  const segV = (on: boolean): React.CSSProperties => ({ ...seg(on), padding: '7px 13px', fontSize: 12 })
  const scheda: React.CSSProperties = { textAlign: 'left', background: 'var(--surface)', borderRadius: 14, padding: '20px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7, minHeight: 150 }
  const vai = { border: '1px solid var(--focus)', background: 'var(--focus)', color: 'var(--surface)', borderRadius: 9, fontWeight: 700, cursor: 'pointer' } as const

  return (
    <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px 40px' }}>
      <div style={{ width: '100%', maxWidth: 880 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={lbl}>Variante dello stato vuoto</span>
          <div role="group" aria-label="Variante dello stato vuoto" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
            <button type="button" aria-pressed={variante === 'A'} onClick={() => setVariante('A')} style={{ ...segV(variante === 'A'), borderRight: '1px solid var(--line)' }}>A · tre vie</button>
            <button type="button" aria-pressed={variante === 'B'} onClick={() => setVariante('B')} style={segV(variante === 'B')}>B · incolla subito</button>
          </div>
        </div>

        {variante === 'A' ? (
          <div style={{ border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', padding: '34px 32px 30px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 700, letterSpacing: '-.015em' }}>Nessun testo da analizzare</h1>
            <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--mute)', maxWidth: '56ch', lineHeight: 1.6, textWrap: 'pretty' }}>Porta dentro il testo in uno dei tre modi. Dopo l'import scegli versi o prosa e puoi sistemarlo prima di iniziare ad annotare.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
              <button type="button" className="hv" onClick={() => ed.imposta({ incollaAperto: true })} style={{ ...scheda, border: '1px solid var(--focus)' }}>
                <Icona nome="tastiera" size={26} />
                <strong style={{ fontSize: 15 }}>Incolla il testo</strong>
                <span style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.5 }}>Dal libro digitale o da una pagina web. Il modo più rapido in classe.</span>
                <span style={{ marginTop: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--focus)' }}><Con i="avanti" size={13} fine>Apri l'area di incolla</Con></span>
              </button>
              <label className="hv" style={{ ...scheda, border: '1px solid var(--line)' }}>
                <input type="file" accept=".txt,text/plain" onChange={(e) => leggiFile(e.target.files?.[0])} style={{ display: 'none' }} />
                <Icona nome="file" size={26} />
                <strong style={{ fontSize: 15 }}>File .txt</strong>
                <span style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.5 }}>Scegli un file dal computer.</span>
                <span style={{ marginTop: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--mute)' }}><Con i="avanti" size={13} fine>Scegli file</Con></span>
              </label>
              <button type="button" className="hv" onClick={() => { ed.imposta({ incollaAperto: true }); setAvviso("L'importazione dei PDF non è ancora disponibile: apri il PDF, copia il testo e incollalo qui.") }} style={{ ...scheda, border: '1px solid var(--line)' }}>
                <Icona nome="libro" size={26} />
                <strong style={{ fontSize: 15 }}>PDF</strong>
                <span style={{ fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.5 }}>Estrae il testo dalle pagine. Da rivedere: gli a capo del PDF spesso sbagliano.</span>
                <span style={{ marginTop: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--mute)' }}><Con i="avanti" size={13} fine>Scegli file</Con></span>
              </button>
            </div>
            {ed.incollaAperto && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--line2)', paddingTop: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mute)', marginBottom: 7 }}>Incolla qui il testo</label>
                {avviso && <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--warn-ink)' }}>{avviso}</p>}
                <textarea autoFocus aria-label="Testo da importare" value={b} onChange={(e) => ed.imposta({ bozza: e.target.value })} placeholder="Sempre caro mi fu quest'ermo colle…" style={{ width: '100%', minHeight: 150, resize: 'vertical', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 12, padding: '13px 14px', fontSize: 14, lineHeight: 1.6, outlineOffset: -2 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  <button type="button" className="hvp" disabled={!b.trim()} onClick={() => void importa()} style={{ ...vai, padding: '10px 18px', fontSize: 13, opacity: b.trim() ? 1 : 0.45 }}><Con i="avanti" fine>Apri nell'editor</Con></button>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>{info}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', padding: '30px 32px 26px' }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 700, letterSpacing: '-.015em' }}>Incolla il testo da analizzare</h1>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--mute)', maxWidth: '56ch', lineHeight: 1.6, textWrap: 'pretty' }}>Un verso per riga. Puoi sistemare il testo adesso: dopo l'import le annotazioni si agganciano alle parole, non alle righe.</p>
            <textarea aria-label="Testo da importare" value={b} onChange={(e) => ed.imposta({ bozza: e.target.value })} placeholder={"Sempre caro mi fu quest'ermo colle,\ne questa siepe, che da tanta parte…"} style={{ width: '100%', minHeight: 230, resize: 'vertical', border: '2px dashed var(--line)', background: 'var(--bg)', borderRadius: 14, padding: 18, fontSize: 15, lineHeight: 1.75, outlineOffset: -2 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
              <button type="button" className="hvp" disabled={!b.trim()} onClick={() => void importa()} style={{ ...vai, padding: '11px 20px', fontSize: 13.5, opacity: b.trim() ? 1 : 0.45 }}><Con i="avanti" fine>Apri nell'editor</Con></button>
              <div role="group" aria-label="Layout del testo" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                <button type="button" aria-pressed={!prosa} onClick={() => aggiornaTesto(testo.id, { layout: 'verso' })} style={seg(!prosa, { borderRight: '1px solid var(--line)' })}><Con i="versi" size={14}>Versi</Con></button>
                <button type="button" aria-pressed={prosa} onClick={() => aggiornaTesto(testo.id, { layout: 'prosa' })} style={seg(prosa)}><Con i="prosa" size={14}>Prosa</Con></button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>{info}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>oppure</span>
              <label className="hv" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '10px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                <input type="file" accept=".txt,text/plain" onChange={(e) => leggiFile(e.target.files?.[0])} style={{ display: 'none' }} />
                File .txt
              </label>
              <button type="button" disabled title="Non ancora disponibile" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '10px 15px', fontSize: 12.5, fontWeight: 700, opacity: 0.45, cursor: 'not-allowed' }}>PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ finestre che si aprono anche dalla Home

export function FinestreEditorHome() {
  const ed = useEditor()
  return (
    <>
      {ed.elencoTesti && <ElencoTesti />}
      {ed.nuovoOpen && <NuovoTesto />}
    </>
  )
}
