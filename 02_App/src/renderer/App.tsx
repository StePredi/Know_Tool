import { useEffect } from 'react'
import { useStore } from './store'
import { Header } from './componenti/Header'
import { Mappa } from './componenti/Mappa'
import { Lista } from './componenti/Lista'
import { Anteprima } from './componenti/Anteprima'
import { SchedaCompleta } from './componenti/SchedaCompleta'
import { EditorScheda } from './componenti/EditorScheda'
import { Controlli } from './componenti/Controlli'
import { Applicazione } from './componenti/Applicazione'
import { EditorTesti, FinestreEditorHome } from './editor/EditorTesti'
import { useEditor } from './editor/stato'

const FONT = {
  atkinson: "'Atkinson Hyperlegible', system-ui, sans-serif",
  lexend: "'Lexend', system-ui, sans-serif",
  sistema: 'system-ui, -apple-system, "Segoe UI", sans-serif'
}

export function App() {
  const st = useStore()

  useEffect(() => {
    void st.init()
    return window.api.onModello((e) => useStore.getState().onEvento(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const r = document.documentElement
    r.dataset.theme = st.scuro ? 'dark' : 'light'
    window.api.zoom(st.zoomUi)
    r.style.setProperty('--ls', String(st.ls / 100))
    r.style.setProperty('--ff', FONT[st.font])
  }, [st.scuro, st.zoomUi, st.ls, st.font])

  // zoom di tutta l'interfaccia: Ctrl + / Ctrl - / Ctrl 0
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (!e.ctrlKey && !e.metaKey) return
      if (useEditor.getState().testoId) {
        // nell'editor Ctrl + / - ingrandisce il testo, non l'interfaccia
        const ez = useEditor.getState().zoom
        const nz = e.key === '+' || e.key === '=' ? ez + 10 : e.key === '-' ? ez - 10 : e.key === '0' ? 100 : null
        if (nz != null) {
          e.preventDefault()
          useEditor.getState().imposta({ zoom: Math.max(70, Math.min(190, nz)) })
        }
        return
      }
      const z = useStore.getState().zoomUi
      let n: number | null = null
      if (e.key === '+' || e.key === '=') n = Math.min(2, z + 0.1)
      else if (e.key === '-') n = Math.max(0.7, z - 0.1)
      else if (e.key === '0') n = 1.15
      if (n != null) {
        e.preventDefault()
        useStore.getState().prefs({ zoomUi: +n.toFixed(2) })
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  // Esc chiude, dall'alto verso il basso
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.editId) return
      if (!useEditor.getState().testoId) {
        const e2 = useEditor.getState()
        if (e2.nuovoOpen) { e2.imposta({ nuovoOpen: false }); return }
        if (e2.elencoTesti && !s.apertaId) { e2.imposta({ elencoTesti: false }); return }
      }
      if (s.applicazione) s.imposta({ applicazione: false })
      else if (s.popover) s.imposta({ popover: null })
      else if (s.apertaId) s.imposta({ apertaId: null, auto: false })
      else if (s.controlli) s.imposta({ controlli: false })
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const testoId = useEditor((e) => e.testoId)

  if (st.caricamento) return <p style={{ padding: 30 }}>Apro la cartella…</p>

  if (!st.modello) {
    return (
      <div style={{ maxWidth: 560, margin: '12vh auto', padding: 24 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 10px' }}>Know Tool</h1>
        <p style={{ fontSize: 16 }}>
          {st.stato?.errore ?? 'Scegli la cartella Know_Tool: quella che contiene 01_Argomenti.'}
        </p>
        <button className="btn lg on" onClick={() => void st.scegliRadice()}>Scegli la cartella…</button>
        {st.stato?.radice && <p style={{ color: 'var(--mute)', fontSize: 13 }}>Cartella attuale: {st.stato.radice}</p>}
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {testoId ? (
        <EditorTesti />
      ) : (
        <>
          <Header />
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {st.vista === 'mappa' ? <Mappa /> : <Lista />}
            </main>
            {st.selId && <Anteprima id={st.selId} />}
          </div>
        </>
      )}
      <FinestreEditorHome />
      {st.apertaId && <SchedaCompleta id={st.apertaId} />}
      {st.editId && <EditorScheda id={st.editId} />}
      {st.controlli && <Controlli />}
      {st.applicazione && <Applicazione />}
      {st.toast && (
        <div role="status" style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--ink)', color: 'var(--surface)', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.3)', animation: 'dcUp .16s ease-out' }}>
          {st.toast}
        </div>
      )}
    </div>
  )
}
