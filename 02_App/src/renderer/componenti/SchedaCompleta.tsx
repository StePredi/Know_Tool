import { useEffect, useRef } from 'react'
import { corsiaDi, temiDi } from '@shared/derivati'
import { dataBreve, dataLunga } from '@shared/dates'
import { useColore, useStore } from '../store'
import { Md, usaFiltro } from '../utili'
import { useEditor } from '../editor/stato'
import { Con, Icona } from './Icona'

export function SchedaCompleta({ id }: { id: string }) {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const imposta = useStore((s) => s.imposta)
  const editando = useStore((s) => s.editando)
  const colore = useColore()
  const chiudi = useRef<HTMLButtonElement>(null)
  const corpo = useRef<HTMLDivElement>(null)
  const auto = useStore((x) => x.auto)
  const intervallo = useStore((x) => x.intervallo)
  const corsieSpente = useStore((x) => x.corsieSpente)
  const passa = usaFiltro()
  const s = ix.byId.get(id)

  // sequenza cronologica: le schede visibili con i filtri attuali (se la scheda aperta non c'è, si usano tutte)
  const filtrata = ix.chron.filter((x) => passa(x) && !corsieSpente[x.corsia])
  const seq = filtrata.some((x) => x.id === id) ? filtrata : ix.chron
  const pos = seq.findIndex((x) => x.id === id)
  const vaiSeq = (d: number): void => {
    const n = seq[pos + d]
    if (n) imposta({ apertaId: n.id, selId: n.id })
  }

  useEffect(() => {
    chiudi.current?.focus()
    corpo.current?.scrollTo({ top: 0 })
  }, [id])

  // riproduzione automatica: passa alla successiva e si ferma all'ultima
  useEffect(() => {
    if (!auto) return
    if (pos < 0 || pos >= seq.length - 1) {
      imposta({ auto: false })
      return
    }
    const t = setTimeout(() => vaiSeq(1), intervallo * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, id, intervallo, pos])

  if (!s) return null
  const c = corsiaDi(m, s.corsia)
  const col = colore(c.id)
  const collegate = (ix.adj.get(s.id) ?? []).map((k) => ix.byId.get(k)!).filter(Boolean).sort(ix.cmp)
  const num = ix.num(s)
  const prima = collegate.filter((x) => (ix.num(x) ?? 1e9) < (num ?? 1e9) || (ix.num(x) === num && x.id < s.id))
  const dopo = collegate.filter((x) => !prima.includes(x))
  const voci = m.glossario.filter((v) => v.schede.includes(s.id))
  const testiScheda = m.testi.filter((t) => t.scheda === s.id || (s.testi ?? []).includes(t.id))
  const paroleChiave = Array.from(new Set(testiScheda.flatMap((t) => t.annotazioni.filter((a) => a.parola_chiave && a.citato).map((a) => (a.citato as string).trim()))))
  const righe = (x: string): string[] => x.split('\n').map((r) => r.trim()).filter(Boolean)
  const domande = righe(s.domande ?? '')

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

  const tasto = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowRight') { e.preventDefault(); vaiSeq(1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); vaiSeq(-1) }
    else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); imposta({ auto: !auto }) }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scheda completa"
      className="overlay"
      style={{ zIndex: 70, alignItems: 'center', padding: 22 }}
      onKeyDown={tasto}
      onMouseDown={(e) => e.target === e.currentTarget && imposta({ apertaId: null, auto: false })}
    >
      <div style={{ width: '100%', maxWidth: 1180, height: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--line)', borderTop: `4px solid ${col}`, borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.4)', overflow: 'hidden', animation: 'dcUp .18s ease-out' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${col}`, color: col, borderRadius: 999, padding: '3px 11px', fontSize: 12.5, fontWeight: 700 }}>
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: col }} />{c.nome}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mute)' }}>{dataLunga(s.data)}</span>
              {s.pagine && <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mute)' }}>· {s.pagine}</span>}
              {s.fuori_dal_libro && <span className="chip soft" style={{ padding: '2px 9px' }}>fuori dal libro</span>}
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 24, lineHeight: 1.2, fontWeight: 700 }}>{s.titolo || s.titolo_breve}</h2>
          </div>
          {editando && <button className="btn ed" onClick={() => imposta({ editId: s.id, auto: false })}><Con i="matita">Modifica</Con></button>}
          <button ref={chiudi} className="btn" aria-label="Chiudi" onClick={() => imposta({ apertaId: null, auto: false })}><Icona nome="chiudi" /></button>
        </div>
        <div ref={corpo} style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: '210px minmax(0,1fr) 210px', alignItems: 'start' }}>
          <nav aria-label="Schede collegate prima" style={{ padding: 14, borderRight: '1px solid var(--line2)', alignSelf: 'stretch', background: 'var(--bg)' }}>
            <h3 className="h3s"><Con i="indietro" size={13}>Prima</Con></h3>
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
            {paroleChiave.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Parole chiave</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {paroleChiave.map((p) => <span key={p} className="chip" style={{ padding: '4px 11px', fontWeight: 600 }}>{p}</span>)}
                </div>
              </section>
            )}
            {s.struttura && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Struttura e metrica</h3>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>{righe(s.struttura).map((r, i) => <p key={i} style={{ margin: '0 0 4px' }}><Md testo={r.replace(/^[-*]\s+/, '')} /></p>)}</div>
              </section>
            )}
            {s.contesto && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Contesto</h3>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>{righe(s.contesto).map((r, i) => <p key={i} style={{ margin: '0 0 4px' }}><Md testo={r.replace(/^[-*]\s+/, '')} /></p>)}</div>
              </section>
            )}
            {s.citazioni && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Citazioni chiave</h3>
                {righe(s.citazioni).map((r, i) => <blockquote key={i} style={{ margin: '0 0 7px', padding: '4px 12px', borderLeft: `3px solid ${col}`, fontSize: 15, lineHeight: 1.55, fontStyle: 'italic' }}><Md testo={r.replace(/^(>|[-*])\s+/, '')} /></blockquote>)}
              </section>
            )}
            {domande.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <h3 className="h3s">Domande da interrogazione</h3>
                <ol style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
                  {domande.map((d, i) => {
                    const t = d.replace(/^(\d+[.)]|[-*])\s+/, '')
                    const q = t.indexOf('?')
                    return <li key={i} style={{ marginBottom: 5 }}>{q >= 0 ? <><strong>{t.slice(0, q + 1)}</strong>{t.slice(q + 1)}</> : t}</li>
                  })}
                </ol>
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
            <h3 className="h3s"><Con i="avanti" size={13} fine>Dopo</Con></h3>
            <Lista items={dopo} vuoto="Nessun collegamento successivo." />
          </nav>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
          <button className="btn" disabled={pos <= 0} onClick={() => vaiSeq(-1)}><Con i="indietro">Precedente</Con></button>
          <button className="btn" disabled={pos >= seq.length - 1} onClick={() => vaiSeq(1)}><Con i="avanti" fine>Successiva</Con></button>
          <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600 }}>{pos + 1} di {seq.length} in ordine cronologico</span>
          <div style={{ flex: 1 }} />
          {testiScheda.map((t) => (
            <button key={t.id} className="btn" onClick={() => { imposta({ apertaId: null, auto: false }); useEditor.getState().imposta({ testoId: t.id, sel: null, anchor: null, testa: null, tab: 'ann', annDet: null, esDet: null }) }}>
              <Con i="libro">Apri nell'editor{testiScheda.length > 1 ? ` · ${t.titolo}` : ''}</Con>
            </button>
          ))}
          <button className={'btn' + (auto ? ' on' : '')} aria-pressed={auto} title="Passa da sola alla scheda successiva (barra spaziatrice)" onClick={() => imposta({ auto: !auto })}>
            {auto ? <Con i="pausa">Pausa</Con> : <Con i="gioca">{`Riproduci · ${intervallo} s`}</Con>}
          </button>
          <button className="btn" onClick={() => imposta({ apertaId: null, auto: false })}><Con i="chiudi">Chiudi</Con></button>
        </div>
      </div>
    </div>
  )
}
