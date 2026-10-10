import { useEffect, useRef } from 'react'
import { corsiaDi, temiDi } from '@shared/derivati'
import { dataBreve, dataLunga } from '@shared/dates'
import { useColore, useStore } from '../store'
import { Md } from '../utili'

export function SchedaCompleta({ id }: { id: string }) {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const imposta = useStore((s) => s.imposta)
  const editando = useStore((s) => s.editando)
  const colore = useColore()
  const chiudi = useRef<HTMLButtonElement>(null)
  const s = ix.byId.get(id)

  useEffect(() => chiudi.current?.focus(), [id])
  if (!s) return null
  const c = corsiaDi(m, s.corsia)
  const col = colore(c.id)
  const collegate = (ix.adj.get(s.id) ?? []).map((k) => ix.byId.get(k)!).filter(Boolean).sort(ix.cmp)
  const num = ix.num(s)
  const prima = collegate.filter((x) => (ix.num(x) ?? 1e9) < (num ?? 1e9) || (ix.num(x) === num && x.id < s.id))
  const dopo = collegate.filter((x) => !prima.includes(x))
  const voci = m.glossario.filter((v) => v.schede.includes(s.id))

  const vai = (k: string): void => imposta({ apertaId: k, selId: k })
  const Lista = ({ items, vuoto }: { items: typeof collegate; vuoto: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((b) => (
        <button key={b.id} type="button" onClick={() => vai(b.id)} className="btn" style={{ textAlign: 'left', borderLeft: `3px solid ${colore(corsiaDi(m, b.corsia).id)}`, borderRadius: 7, padding: '7px 9px', whiteSpace: 'normal' }}>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--mute)' }}>{dataBreve(b.data)}</span>
          <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.3, marginTop: 1 }}>{b.titolo_breve}</span>
        </button>
      ))}
      {!items.length && <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>{vuoto}</span>}
    </div>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scheda completa"
      className="overlay"
      style={{ zIndex: 70, alignItems: 'flex-start', padding: '34px 22px', overflow: 'auto' }}
      onMouseDown={(e) => e.target === e.currentTarget && imposta({ apertaId: null })}
    >
      <div style={{ width: '100%', maxWidth: 1060, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 26px 70px rgba(0,0,0,.34)', overflow: 'hidden', animation: 'dcUp .18s ease-out', alignSelf: 'flex-start' }}>
        <div style={{ height: 5, background: col }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ background: col, color: 'var(--on)', borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 700 }}>{c.nome}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mute)' }}>{dataLunga(s.data)}</span>
              {s.pagine && <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)' }}>· {s.pagine}</span>}
              {s.fuori_dal_libro && <span className="chip soft" style={{ padding: '2px 9px' }}>fuori dal libro</span>}
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, lineHeight: 1.2, fontWeight: 700 }}>{s.titolo || s.titolo_breve}</h2>
          </div>
          {editando && (
            <button className="btn ed" onClick={() => imposta({ editId: s.id })}>Modifica</button>
          )}
          <button ref={chiudi} className="btn" onClick={() => imposta({ apertaId: null })}>Chiudi ✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr) 200px', alignItems: 'start' }}>
          <nav aria-label="Schede collegate prima" style={{ padding: 14, borderRight: '1px solid var(--line2)', alignSelf: 'stretch', background: 'var(--bg)' }}>
            <h3 className="h3s">← Prima</h3>
            <Lista items={prima} vuoto="Nessun collegamento precedente." />
          </nav>
          <div style={{ padding: '16px 20px 26px', minWidth: 0 }}>
            <section style={{ marginBottom: 18 }}>
              <h3 className="h3s">Riassunto</h3>
              <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.6 }}><Md testo={s.riassunto} /></p>
            </section>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {temiDi(m, s).map((t) => <span key={t.id} className="chip soft" style={{ padding: '4px 11px' }}>{t.nome}</span>)}
            </div>
            {s.dettagli.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Dettagli</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6 }}>
                  {s.dettagli.map((d, i) => <li key={i} style={{ marginBottom: 4 }}><Md testo={d} /></li>)}
                </ul>
              </section>
            )}
            {s.attenzione && (
              <div role="note" className="note" style={{ marginBottom: 18 }}>
                <strong style={{ display: 'block', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Attenzione</strong>
                <Md testo={s.attenzione} />
              </div>
            )}
            {s.tabella && (s.tabella.colonne.length > 0 || s.tabella.intro) && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Tabella</h3>
                {s.tabella.intro && <p style={{ margin: '0 0 8px', fontSize: 14 }}><Md testo={s.tabella.intro} /></p>}
                {s.tabella.colonne.length > 0 && (
                  <table className="tab">
                    <thead><tr>{s.tabella.colonne.map((h, i) => <th key={i}><Md testo={h} /></th>)}</tr></thead>
                    <tbody>{s.tabella.righe.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}><Md testo={x} /></td>)}</tr>)}</tbody>
                  </table>
                )}
              </section>
            )}
            {voci.length > 0 && (
              <section>
                <h3 className="h3s">Parole del glossario</h3>
                <dl style={{ margin: 0, fontSize: 14 }}>
                  {voci.map((v) => (
                    <div key={v.termine} style={{ marginBottom: 6 }}>
                      <dt style={{ fontWeight: 700, display: 'inline' }}>{v.termine}: </dt>
                      <dd style={{ display: 'inline', margin: 0 }}><Md testo={v.definizione} /></dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
          <nav aria-label="Schede collegate dopo" style={{ padding: 14, borderLeft: '1px solid var(--line2)', alignSelf: 'stretch', background: 'var(--bg)' }}>
            <h3 className="h3s">Dopo →</h3>
            <Lista items={dopo} vuoto="Nessun collegamento successivo." />
          </nav>
        </div>
      </div>
    </div>
  )
}
