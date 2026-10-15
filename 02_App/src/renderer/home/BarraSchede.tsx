import { useEffect, useState } from 'react'
import { Icona, type NomeIcona } from '../componenti/Icona'
import { HOME_ID, useHome, type SchedaApp } from './stato'

const ICONA: Record<SchedaApp['tipo'], NomeIcona> = { home: 'casa', mappa: 'mappa', testo: 'libro', situazioni: 'carte', appunto: 'file' }

/** Le schede aperte, come in un browser: Home fissa, poi mappe e testi. Si riordinano trascinandole. */
export function BarraSchede() {
  const tabs = useHome((h) => h.tabs)
  const attiva = useHome((h) => h.attiva)
  const [trascina, setTrascina] = useState<string | null>(null)
  const [sopra, setSopra] = useState<string | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (!e.ctrlKey && !e.metaKey) return
      const s = useHome.getState()
      const k = e.key.toLowerCase()
      if (k === 'w' && !e.shiftKey) {
        if (s.attiva !== HOME_ID) { e.preventDefault(); s.chiudiScheda(s.attiva) }
      } else if (k === 't' && e.shiftKey) {
        e.preventDefault(); s.riapriScheda()
      } else if (k === 't') {
        e.preventDefault(); s.attiva_(HOME_ID)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const i = s.tabs.findIndex((t) => t.id === s.attiva)
        const n = s.tabs.length
        s.attiva_(s.tabs[(i + (e.shiftKey ? n - 1 : 1)) % n]!.id)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  return (
    <div className="tabs" role="tablist" aria-label="Schede aperte">
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          tabIndex={0}
          aria-selected={t.id === attiva}
          className={'tab' + (t.id === attiva ? ' on' : '') + (sopra === t.id && trascina && trascina !== t.id ? ' drop' : '')}
          draggable={t.id !== HOME_ID}
          onDragStart={(e) => { setTrascina(t.id); e.dataTransfer.effectAllowed = 'move' }}
          onDragOver={(e) => { if (trascina) { e.preventDefault(); setSopra(t.id) } }}
          onDrop={(e) => { e.preventDefault(); if (trascina) useHome.getState().muovi(trascina, t.id); setTrascina(null); setSopra(null) }}
          onDragEnd={() => { setTrascina(null); setSopra(null) }}
          onClick={() => useHome.getState().attiva_(t.id)}
          onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); useHome.getState().chiudiScheda(t.id) } }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); useHome.getState().attiva_(t.id) } }}
          title={t.titolo}
        >
          <Icona nome={ICONA[t.tipo]} size={14} />
          <span className="tab-t">{t.titolo}</span>
          {t.id !== HOME_ID && (
            <button type="button" className="tab-x" aria-label={`Chiudi ${t.titolo}`} title="Chiudi (Ctrl+W)" onClick={(e) => { e.stopPropagation(); useHome.getState().chiudiScheda(t.id) }}>
              <Icona nome="chiudi" size={12} />
            </button>
          )}
        </div>
      ))}
      <button type="button" className="tab-nuova" aria-label="Nuova scheda: vai alla Home" title="Nuova scheda (Ctrl+T)" onClick={() => useHome.getState().attiva_(HOME_ID)}>
        <Icona nome="piu" size={15} />
      </button>
    </div>
  )
}
