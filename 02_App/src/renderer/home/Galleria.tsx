import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icona } from '../componenti/Icona'
import { Modale } from '../editor/ui'
import { disponibile, materiaDi, ordina, STRUTTURA, type Contesto, type IdModello, type Modello } from './modelli'

/** Il pulsante «+ Nuovo»: la galleria dei modelli di documento. Si cerca, si vedono prima i consigliati per la materia in cui sei, poi tutti. */
export function Galleria({ contesto, dove, scegli, chiudi }: { contesto: Contesto; dove: string; scegli: (id: IdModello) => void; chiudi: () => void }): ReactNode {
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const { consigliati, altri } = ordina(contesto, q)
  const materia = contesto.rel ? contesto.rel.split('/')[0]! : ''
  const strutt = STRUTTURA.filter((m) => !q.trim() || (m.nome + ' ' + m.descrizione).toLowerCase().includes(q.trim().toLowerCase()))

  const carta = (m: Modello): ReactNode => {
    const ok = disponibile(m, contesto)
    return (
      <button key={m.id} type="button" className="gal-c" disabled={!ok} onClick={() => scegli(m.id)} aria-label={m.nome} title={ok ? undefined : m.serve}>
        <span className="gal-i"><Icona nome={m.icona} size={22} /></span>
        <span className="gal-t">
          <strong>{m.nome}</strong>
          <span>{m.descrizione}</span>
          {!ok && m.serve && <em>{m.serve}</em>}
        </span>
      </button>
    )
  }

  return (
    <Modale
      titolo="Nuovo"
      larghezza={760}
      chiudi={chiudi}
      intestazione={
        <>
          <strong style={{ fontSize: 15 }}>Nuovo</strong>
          <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{dove ? `in ${dove}` : 'alla Home'}</span>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={chiudi} aria-label="Chiudi"><Icona nome="chiudi" size={14} /></button>
        </>
      }
    >
      <div className="gal">
        <input ref={ref} className="inp big" type="search" placeholder="Cerca un modello (per esempio: appunti, mappa, tempo)…" aria-label="Cerca un modello" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') chiudi() }} />
        {consigliati.length > 0 && (
          <section>
            <h3>Consigliati per {materia}</h3>
            <div className="gal-g">{consigliati.map(carta)}</div>
          </section>
        )}
        {altri.length > 0 && (
          <section>
            <h3>{consigliati.length ? 'Per tutte le materie' : 'Tutti i modelli'}</h3>
            <div className="gal-g">{altri.map(carta)}</div>
          </section>
        )}
        {strutt.length > 0 && (
          <section>
            <h3>Struttura</h3>
            <div className="gal-g">{strutt.map(carta)}</div>
          </section>
        )}
        {!consigliati.length && !altri.length && !strutt.length && <p className="m-nota">Nessun modello corrisponde a «{q}».</p>}
        <p className="m-nota">La galleria cresce un modello alla volta: ne aggiungiamo uno quando lo progettiamo insieme.</p>
      </div>
    </Modale>
  )
}
export { materiaDi }
