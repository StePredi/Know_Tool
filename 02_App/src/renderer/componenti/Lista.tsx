import { corsiaDi, dentroFascia, fascePeriodi, temiDi } from '@shared/derivati'
import { dataBreve } from '@shared/dates'
import type { Scheda } from '@shared/types'
import { useColore, useStore } from '../store'
import { usaFiltro } from '../utili'
import { Con } from './Icona'

export function Lista() {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const selId = useStore((s) => s.selId)
  const corsieSpente = useStore((s) => s.corsieSpente)
  const imposta = useStore((s) => s.imposta)
  const colore = useColore()
  const passa = usaFiltro()

  const visibili = ix.chron.filter((s) => passa(s) && !corsieSpente[corsiaDi(m, s.corsia).id])
  const fasce = fascePeriodi(m.autore.periodi)
  const gruppi: { nome: string; items: Scheda[] }[] = []
  const usate = new Set<string>()
  for (const f of fasce) {
    const items = visibili.filter((s) => dentroFascia(ix.num(s), f))
    items.forEach((s) => usate.add(s.id))
    if (items.length) gruppi.push({ nome: f.nome, items })
  }
  const fuori = visibili.filter((s) => !usate.has(s.id) && ix.num(s) != null)
  if (fuori.length) gruppi.push({ nome: fasce.length ? 'Fuori dai periodi' : 'Tutte le schede', items: fuori })
  const senza = visibili.filter((s) => ix.num(s) == null)
  if (senza.length) gruppi.push({ nome: 'Senza data', items: senza })

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 18px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {gruppi.map((g) => (
          <section key={g.nome} style={{ marginBottom: 26 }}>
            <h2 className="h3" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
              <span>{g.nome}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </h2>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
              {g.items.map((s, i) => {
                const c = corsiaDi(m, s.corsia)
                const col = colore(c.id)
                return (
                  <div
                    key={s.id}
                    onClick={() => imposta({ selId: s.id })}
                    onDoubleClick={() => imposta({ apertaId: s.id })}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(74px,124px) minmax(92px,132px) minmax(190px,1fr) auto',
                      columnGap: 18,
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderTop: i ? '1px solid var(--line2)' : 'none',
                      background: selId === s.id ? 'var(--surface2)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dataBreve(s.data)}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, border: `1px solid ${col}`, color: col, borderRadius: 999, padding: '3px 9px', justifySelf: 'start', whiteSpace: 'nowrap' }}>
                      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                      {c.sigla}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{s.titolo_breve}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: 'var(--mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {temiDi(m, s).map((t) => t.nome).join(' · ')}
                      </span>
                    </span>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); imposta({ apertaId: s.id }) }}><Con i="esterno">Apri</Con></button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        {!gruppi.length && <p style={{ fontSize: 13, color: 'var(--mute)' }}>Nessuna scheda con questi filtri.</p>}
      </div>
    </div>
  )
}
