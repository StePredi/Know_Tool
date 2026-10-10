import { useEffect } from 'react'
import { useStore } from './store'
import { Header } from './componenti/Header'
import { Mappa } from './componenti/Mappa'
import { Lista } from './componenti/Lista'
import { Anteprima } from './componenti/Anteprima'
import { SchedaCompleta } from './componenti/SchedaCompleta'
import { EditorScheda } from './componenti/EditorScheda'
import { Controlli } from './componenti/Controlli'

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
    r.style.setProperty('--fs', st.fs + 'px')
    r.style.setProperty('--ls', String(st.ls / 100))
    r.style.setProperty('--ff', FONT[st.font])
  }, [st.scuro, st.fs, st.ls, st.font])

  // Esc chiude, dall'alto verso il basso
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.editId) return
      if (s.popover) s.imposta({ popover: null })
      else if (s.apertaId) s.imposta({ apertaId: null })
      else if (s.controlli) s.imposta({ controlli: false })
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

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
      <Header />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {st.vista === 'mappa' ? <Mappa /> : <Lista />}
        </main>
        {st.selId && <Anteprima id={st.selId} />}
      </div>
      {st.apertaId && <SchedaCompleta id={st.apertaId} />}
      {st.editId && <EditorScheda id={st.editId} />}
      {st.controlli && <Controlli />}
      {st.toast && (
        <div role="status" style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--ink)', color: 'var(--surface)', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.3)', animation: 'dcUp .16s ease-out' }}>
          {st.toast}
        </div>
      )}
    </div>
  )
}
