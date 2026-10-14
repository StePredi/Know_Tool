import { Icona, type NomeIcona } from '../componenti/Icona'
import type { NodoArg, TipoNodo } from '@shared/types'
import { èDocumento, HOME_ID, idScheda, useHome } from './stato'

export const ICONA_NODO: Record<TipoNodo, NomeIcona> = { materia: 'libro', cartella: 'cartella', autore: 'file', mappa: 'mappa', testo: 'testo', situazioni: 'carte' }

function Riga({ n, livello }: { n: NodoArg; livello: number }) {
  const espanso = useHome((h) => !!h.espansi[n.rel])
  const percorso = useHome((h) => h.percorso)
  const attiva = useHome((h) => h.attiva)
  const apribile = èDocumento(n)
  const contenitore = !apribile && n.figli.length > 0
  const on = apribile ? attiva === idScheda(n) : attiva === HOME_ID && percorso === n.rel
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: livello * 14 }}>
        {contenitore ? (
          <button type="button" className="alb-f" aria-label={espanso ? `Chiudi ${n.nome}` : `Apri ${n.nome}`} aria-expanded={espanso} onClick={() => useHome.getState().commutaEspanso(n.rel)}>
            <Icona nome={espanso ? 'giu' : 'dx'} size={13} />
          </button>
        ) : (
          <span style={{ width: 20, flex: 'none' }} />
        )}
        <button
          type="button"
          className={'alb-r hm-t-' + n.tipo + (on ? ' on' : '')}
          onClick={() => {
            useHome.getState().apri(n)
            if (contenitore && !espanso) useHome.getState().commutaEspanso(n.rel)
          }}
          title={n.nome}
        >
          <span style={{ color: `hsl(var(--h) 50% 42%)`, display: 'inline-flex' }}><Icona nome={ICONA_NODO[n.tipo]} size={15} /></span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nome}</span>
        </button>
      </div>
      {contenitore && espanso && n.figli.map((f) => <Riga key={f.rel} n={f} livello={livello + 1} />)}
    </>
  )
}

/** L'albero stretto a sinistra: Materie → cartelle → autori → mappa e testi. Si nasconde. */
export function Albero() {
  const albero = useHome((h) => h.albero)
  const percorso = useHome((h) => h.percorso)
  const attiva = useHome((h) => h.attiva)
  return (
    <nav className="alb" aria-label="Materie e documenti">
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 6px 12px' }}>
        <button type="button" className={'alb-r' + (attiva === HOME_ID && !percorso ? ' on' : '')} style={{ flex: 1, minHeight: 34 }} onClick={() => useHome.getState().vai('')}>
          <Icona nome="casa" size={15} /> Tutte le materie
        </button>
        <button type="button" className="alb-f" style={{ width: 28, height: 28 }} aria-label="Nascondi l'albero" title="Nascondi l'albero" onClick={() => useHome.getState().imposta({ alberoAperto: false })}>
          <Icona nome="sx" size={15} />
        </button>
      </div>
      <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '2px 8px 12px' }}>
        {albero.map((n) => <Riga key={n.rel} n={n} livello={0} />)}
        {!albero.length && <p style={{ margin: '10px 8px', fontSize: 12.5, color: 'var(--mute)' }}>Nessuna materia.</p>}
      </div>
    </nav>
  )
}

