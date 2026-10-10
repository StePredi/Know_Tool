import { useStore } from '../store'

/** Pannello dei problemi trovati nei file: l'app li mostra, non li corregge da sola. */
export function Controlli() {
  const m = useStore((s) => s.modello)!
  const imposta = useStore((s) => s.imposta)
  const errori = m.problemi.filter((p) => p.gravita === 'errore')
  const avvisi = m.problemi.filter((p) => p.gravita === 'avviso')
  const Riga = ({ p }: { p: (typeof m.problemi)[number] }) => (
    <li style={{ padding: '8px 0', borderTop: '1px solid var(--line2)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mute)' }}>{p.file}</div>
      <div style={{ fontSize: 14 }}>{p.messaggio}</div>
      {p.scheda && (
        <button className="btn" style={{ marginTop: 4 }} onClick={() => imposta({ apertaId: p.scheda!, controlli: false })}>Apri la scheda</button>
      )}
    </li>
  )
  return (
    <aside role="dialog" aria-label="Controlli" style={{ position: 'fixed', top: 56, right: 14, bottom: 14, zIndex: 60, width: 420, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 14px 40px rgba(0,0,0,.22)', display: 'flex', flexDirection: 'column', animation: 'dcUp .14s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
        <strong style={{ flex: 1, fontSize: 14 }}>Controlli · {errori.length} errori · {avvisi.length} avvisi</strong>
        <button className="btn" aria-label="Chiudi" onClick={() => imposta({ controlli: false })}>✕</button>
      </div>
      <div style={{ overflow: 'auto', padding: '4px 14px 14px' }}>
        {!m.problemi.length && <p style={{ color: 'var(--mute)' }}>Tutto a posto: nessun problema nei file.</p>}
        {errori.length > 0 && <h3 className="h3s" style={{ marginTop: 10 }}>Errori</h3>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{errori.map((p, i) => <Riga key={i} p={p} />)}</ul>
        {avvisi.length > 0 && <h3 className="h3s" style={{ marginTop: 14 }}>Avvisi</h3>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{avvisi.map((p, i) => <Riga key={i} p={p} />)}</ul>
      </div>
    </aside>
  )
}
