import { corsiaDi, temiDi } from '@shared/derivati'
import { dataLunga } from '@shared/dates'
import { Md } from '../utili'
import { useColore, useStore } from '../store'

export function Anteprima({ id }: { id: string }) {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const imposta = useStore((s) => s.imposta)
  const colore = useColore()
  const s = ix.byId.get(id)
  if (!s) return null
  const c = corsiaDi(m, s.corsia)
  const col = colore(c.id)
  return (
    <aside aria-label="Anteprima della scheda" style={{ flex: 'none', width: 312, borderLeft: '1px solid var(--line)', background: 'var(--surface)', overflow: 'auto' }}>
      <div style={{ padding: '14px 15px 24px', animation: 'dcFade .16s ease-out' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${col}`, color: col, borderRadius: 999, padding: '4px 11px', fontSize: 12.5, fontWeight: 700 }}>
          <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: col }} />
          {c.nome}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mute)', margin: '11px 0 2px' }}>{dataLunga(s.data)}</div>
        <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.25, fontWeight: 700 }}>{s.titolo || s.titolo_breve}</h2>
        <p style={{ margin: '11px 0 0', fontSize: 14.5, lineHeight: 1.55 }}>
          <Md testo={s.riassunto} />
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
          {temiDi(m, s).map((t) => (
            <span key={t.id} className="chip soft" style={{ padding: '3px 10px' }}>{t.nome}</span>
          ))}
        </div>
        {s.attenzione && (
          <div role="note" className="note" style={{ marginTop: 13 }}>
            <strong style={{ display: 'block', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Attenzione</strong>
            <span style={{ fontSize: 13.5 }}><Md testo={s.attenzione} /></span>
          </div>
        )}
        <button className="btn lg on" style={{ width: '100%', marginTop: 15, padding: 10, fontSize: 14 }} onClick={() => imposta({ apertaId: s.id })}>
          Apri scheda
        </button>
      </div>
    </aside>
  )
}
