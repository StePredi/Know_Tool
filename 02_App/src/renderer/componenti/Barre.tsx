import type { ReactNode } from 'react'
import { useStore } from '../store'
import { usaFiltro } from '../utili'
import { useEditor } from '../editor/stato'
import { Icona, type NomeIcona } from './Icona'
import { EVENTO_SENZA_DATA } from './Mappa'

/** Un pulsante della barra laterale: icona sopra, nome sotto. */
function Voce(props: { icona: NomeIcona; nome: string; titolo: string; onClick: () => void; badge?: ReactNode; attivo?: boolean; tono?: 'err' | 'warn' }) {
  return (
    <button type="button" className="dock-b" title={props.titolo} aria-label={props.titolo} aria-pressed={props.attivo} onClick={props.onClick}>
      <span style={{ position: 'relative', display: 'inline-flex', color: props.tono === 'err' ? 'var(--err-line)' : props.tono === 'warn' ? 'var(--warn-line)' : undefined }}>
        <Icona nome={props.icona} size={20} />
        {props.badge != null && <span className="dock-n">{props.badge}</span>}
      </span>
      <span>{props.nome}</span>
    </button>
  )
}

/** Barra a sinistra: i luoghi dell'app (testi, controlli, impostazioni). */
export function BarraLaterale() {
  const m = useStore((s) => s.modello)!
  const controlli = useStore((s) => s.controlli)
  const imposta = useStore((s) => s.imposta)
  const errori = m.problemi.filter((p) => p.gravita === 'errore').length
  const n = m.problemi.length
  return (
    <nav aria-label="Sezioni dell'app" className="dock">
      <Voce icona="libro" nome="Testi" titolo="Apri l'editor dei testi" badge={m.testi.length} onClick={() => useEditor.getState().imposta({ elencoTesti: true })} />
      <Voce icona={n ? 'avviso' : 'scudo'} nome="Controlli" titolo={n ? `Controlli: ${n} segnalazioni` : 'Controlli sui file: nessun problema'} badge={n || undefined} tono={n ? (errori ? 'err' : 'warn') : undefined} attivo={controlli} onClick={() => imposta({ controlli: !controlli })} />
      <div style={{ flex: 1 }} />
      <Voce icona="regolazioni" nome="Impostazioni" titolo="Applicazione: aspetto, zoom, cartella" onClick={() => imposta({ applicazione: true })} />
    </nav>
  )
}

/** Barra in basso, sospesa sul contenuto: zoom a sinistra, riproduzione al centro, schede senza data a destra. */
export function BarraInferiore() {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const st = useStore()
  const passa = usaFiltro()
  const { imposta, prefs } = st
  const nSenza = m.schede.filter((s) => ix.num(s) == null).length
  const mappa = st.vista === 'mappa'
  const riproduci = (): void => {
    const vis = ix.chron.filter((x) => passa(x) && !st.corsieSpente[x.corsia])
    const da = vis.find((x) => x.id === st.selId) ?? vis[0]
    if (da) imposta({ apertaId: da.id, selId: da.id, auto: true })
  }
  return (
    <div className="flut" aria-label="Strumenti della vista">
      <div className="flut-lato" style={{ justifyContent: 'flex-start' }}>
        {mappa && (
          <div role="group" aria-label="Zoom della mappa" className="hd-seg flut-b">
            <button type="button" aria-label="Riduci la mappa" onClick={() => prefs({ zoomMappa: Math.max(0.5, +(st.zoomMappa - 0.1).toFixed(2)) })} style={{ padding: '0 10px' }}><Icona nome="meno" size={15} /></button>
            <button type="button" title="Torna al 100%" onClick={() => prefs({ zoomMappa: 1 })} style={{ minWidth: 54, borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(st.zoomMappa * 100)}%</button>
            <button type="button" aria-label="Ingrandisci la mappa" onClick={() => prefs({ zoomMappa: Math.min(1.6, +(st.zoomMappa + 0.1).toFixed(2)) })} style={{ padding: '0 10px' }}><Icona nome="piu" size={15} /></button>
          </div>
        )}
      </div>
      <button type="button" className="hd-b on flut-b" style={{ height: 42, padding: '0 20px', borderRadius: 999, fontSize: 13.5 }} title="Mostra le schede una alla volta in ordine cronologico (rispetta i filtri)" onClick={riproduci}>
        <Icona nome="gioca" size={16} />Riproduci
      </button>
      <div className="flut-lato" style={{ justifyContent: 'flex-end' }}>
        {mappa && nSenza > 0 && (
          <button type="button" className="hd-b flut-b" title={`${nSenza} schede senza data: vai alla zona «Senza data»`} onClick={() => window.dispatchEvent(new Event(EVENTO_SENZA_DATA))}><Icona nome="orologio" size={15} />Senza data · {nSenza}</button>
        )}
      </div>
    </div>
  )
}
