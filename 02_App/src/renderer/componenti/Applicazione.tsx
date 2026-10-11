import { useStore } from '../store'
import { Con, Icona } from './Icona'

const Riga = ({ titolo, aiuto, children }: { titolo: string; aiuto?: string; children: React.ReactNode }) => (
  <div style={{ padding: '14px 0', borderTop: '1px solid var(--line2)' }}>
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{titolo}</div>
    {aiuto && <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 8 }}>{aiuto}</div>}
    {children}
  </div>
)

/** Impostazioni di tutta l'app (non dei contenuti). */
export function Applicazione() {
  const st = useStore()
  const { prefs, imposta } = st
  const scelta = <T extends string | boolean>(valore: T, corrente: T, etichetta: string, fn: () => void) => (
    <button key={etichetta} className={'btn' + (valore === corrente ? ' on' : '')} style={{ flex: 1 }} aria-pressed={valore === corrente} onClick={fn}>{etichetta}</button>
  )
  return (
    <div role="dialog" aria-modal="true" aria-label="Applicazione" className="overlay" style={{ zIndex: 90, alignItems: 'center', padding: 22 }} onMouseDown={(e) => e.target === e.currentTarget && imposta({ applicazione: false })}>
      <div style={{ width: '100%', maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '4px solid var(--focus)', borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.4)', overflow: 'hidden', animation: 'dcUp .18s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
          <strong style={{ flex: 1, fontSize: 18 }}>Applicazione</strong>
          <button className="btn" aria-label="Chiudi" onClick={() => imposta({ applicazione: false })}><Icona nome="chiudi" /></button>
        </div>
        <div style={{ overflow: 'auto', padding: '4px 20px 20px' }}>
          <Riga titolo="Tema">
            <div style={{ display: 'flex', gap: 6 }}>
              {scelta(false, st.scuro, 'Chiaro', () => prefs({ scuro: false }))}
              {scelta(true, st.scuro, 'Scuro', () => prefs({ scuro: true }))}
            </div>
          </Riga>
          <Riga titolo={`Dimensione dell'interfaccia · ${Math.round(st.zoomUi * 100)}%`} aiuto="Ingrandisce testo, barre e pulsanti di tutta l'app. Scorciatoie: Ctrl + / Ctrl − / Ctrl 0.">
            <input type="range" min={70} max={200} step={5} value={Math.round(st.zoomUi * 100)} onChange={(e) => prefs({ zoomUi: +e.target.value / 100 })} style={{ width: '100%' }} aria-label="Dimensione dell'interfaccia" />
            <button className="btn" style={{ marginTop: 6 }} onClick={() => prefs({ zoomUi: 1.15 })}><Con i="riduci" size={14}>Ripristina (115%)</Con></button>
          </Riga>
          <Riga titolo="Carattere">
            <div style={{ display: 'flex', gap: 6 }}>
              {scelta('atkinson', st.font, 'Atkinson', () => prefs({ font: 'atkinson' }))}
              {scelta('lexend', st.font, 'Lexend', () => prefs({ font: 'lexend' }))}
              {scelta('sistema', st.font, 'Sistema', () => prefs({ font: 'sistema' }))}
            </div>
          </Riga>
          <Riga titolo={`Spaziatura delle righe · ${(st.ls / 100).toFixed(2)}`}>
            <input type="range" min={130} max={200} step={5} value={st.ls} onChange={(e) => prefs({ ls: +e.target.value })} style={{ width: '100%' }} aria-label="Spaziatura delle righe" />
          </Riga>
          <Riga titolo="Colori delle categorie">
            <div style={{ display: 'flex', gap: 6 }}>
              {scelta(false, st.sobria, 'Vivace', () => prefs({ sobria: false }))}
              {scelta(true, st.sobria, 'Sobria', () => prefs({ sobria: true }))}
            </div>
          </Riga>
          <Riga titolo={`Riproduzione · ${st.intervallo} secondi per scheda`} aiuto="Tempo prima di passare alla scheda successiva nel «▶ Riproduci».">
            <input type="range" min={5} max={60} step={5} value={st.intervallo} onChange={(e) => prefs({ intervallo: +e.target.value })} style={{ width: '100%' }} aria-label="Secondi per scheda" />
          </Riga>
          <Riga titolo="Cartella dei dati" aiuto={st.stato?.radice ?? 'Nessuna cartella'}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn" onClick={() => void window.api.mostraCartella()}><Con i="cartella">Apri la cartella dell'autore</Con></button>
              <button className="btn" onClick={() => { imposta({ applicazione: false }); void st.scegliRadice() }}><Con i="cartella">Cambia cartella…</Con></button>
            </div>
          </Riga>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: '10px 0 0' }}>Zoom della mappa: pulsanti − + sopra la mappa o Ctrl + rotella.</p>
        </div>
      </div>
    </div>
  )
}
