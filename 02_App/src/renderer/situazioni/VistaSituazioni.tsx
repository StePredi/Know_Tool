import { useEffect, useMemo, type ReactNode } from 'react'
import { MappaSit } from './MappaSit'
import { SchedaVista } from './Scheda'
import { ModificaMappa } from './ModificaMappa'
import { useSit, VISTA0 } from './stato'
import { costruisciIndici } from './util'

/** Una documentazione «Per situazioni» aperta in una scheda dell'app. */
export function VistaSituazioni({ rel }: { rel: string }): ReactNode {
  const dati = useSit((s) => s.dati[rel])
  const errore = useSit((s) => s.errori[rel])
  const v = useSit((s) => s.viste[rel] ?? VISTA0)

  useEffect(() => {
    void useSit.getState().carica(rel)
  }, [rel])

  const idx = useMemo(() => (dati ? costruisciIndici(dati) : null), [dati])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      const t = document.activeElement as HTMLElement | null
      const scrive = !!t && /^(INPUT|TEXTAREA)$/.test(t.tagName)
      const s = useSit.getState()
      const vv = s.viste[rel] ?? VISTA0
      if (vv.scheda) {
        if (e.key === 'Escape' && !scrive) s.imposta(rel, { scheda: null })
        return
      }
      if (e.key === '/' && !scrive) {
        e.preventDefault()
        const q = document.getElementById('s-q') as HTMLInputElement | null
        q?.focus()
        q?.select()
      } else if (e.key === 'Escape') {
        if (vv.q) s.imposta(rel, { q: '' })
        else if (vv.fuoco != null) s.imposta(rel, { fuoco: null })
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [rel])

  if (errore) return <div className="sit"><div className="s-in"><p role="alert" className="s-avv">{errore}</p></div></div>
  if (!dati || !idx) return <div className="sit"><div className="s-in"><p>Apro la documentazione…</p></div></div>
  const ctx = { rel, dati, ...idx }
  return (
    <div className={'sit' + (v.scheda && dati.schede[v.scheda] || v.modificaMappa ? '' : ' sit-mappa')}>
      <div className="s-in">
        {v.scheda && dati.schede[v.scheda] ? <SchedaVista ctx={ctx} id={v.scheda} /> : v.modificaMappa ? <ModificaMappa ctx={ctx} esci={() => useSit.getState().imposta(rel, { modificaMappa: false })} /> : <MappaSit ctx={ctx} />}
      </div>
    </div>
  )
}
