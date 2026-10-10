import { useEffect, useRef, useState } from 'react'
import { corsiaDi } from '@shared/derivati'
import { dataLunga, parseData } from '@shared/dates'
import { leggiTabella, scriviTabella } from '@shared/scheda_md'
import type { SchedaPatch, Tabella } from '@shared/types'
import { useColore, useStore } from '../store'
import { Campo } from '../utili'

/** Finestra di modifica: ogni cambiamento va subito nel file (dopo una breve pausa o lasciando il campo). */
export function EditorScheda({ id }: { id: string }) {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const imposta = useStore((s) => s.imposta)
  const patch = useStore((s) => s.patchScheda)
  const colore = useColore()
  const s = ix.byId.get(id)
  const [filtro, setFiltro] = useState('')
  const primo = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  useEffect(() => primo.current?.focus(), [id])
  if (!s) return null

  const salva = (p: SchedaPatch): void => void patch(id, p)
  const col = colore(corsiaDi(m, s.corsia).id)
  const d = parseData(s.data)
  const lista = ix.chron
  const pos = lista.findIndex((x) => x.id === id)
  const vai = (k: string | undefined): void => {
    if (k) imposta({ editId: k, selId: k })
  }
  const collegate = new Set(ix.adj.get(id) ?? [])

  const commutaLink = async (k: string): Promise<void> => {
    const altra = ix.byId.get(k)!
    if (collegate.has(k)) {
      // togliere il collegamento significa toglierlo da dove è scritto (uno o entrambi i lati)
      if (s.collegamenti.includes(k)) await patch(id, { collegamenti: s.collegamenti.filter((x) => x !== k) })
      if (altra.collegamenti.includes(id)) await patch(k, { collegamenti: altra.collegamenti.filter((x) => x !== id) })
    } else await patch(id, { collegamenti: [...s.collegamenti, k] })
  }
  const commutaTema = (k: string): void =>
    salva({ temi: s.temi.includes(k) ? s.temi.filter((x) => x !== k) : [...s.temi, k] })

  const tab: Tabella = s.tabella ?? { intro: '', colonne: [], righe: [] }
  const testoTab = [tab.colonne, ...tab.righe].filter((r) => r.length).map((r) => r.join(' | ')).join('\n')
  const salvaTab = (intro: string, righe: string): void => {
    const rr = righe.split('\n').filter((r) => r.trim()).map((r) => r.split('|').map((c) => c.trim()))
    salva({ tabella: { intro, colonne: rr[0] ?? [], righe: rr.slice(1) } })
  }
  void leggiTabella
  void scriviTabella

  const linkVisibili = lista.filter((x) => x.id !== id && (!filtro || x.titolo_breve.toLowerCase().includes(filtro.toLowerCase())))

  return (
    <div role="dialog" aria-modal="true" aria-label="Modifica della scheda" className="overlay" style={{ zIndex: 80, alignItems: 'center', padding: 22 }} onKeyDown={(e) => e.key === 'Escape' && imposta({ editId: null })}>
      <div style={{ width: '100%', maxWidth: 1240, height: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '4px solid var(--ed)', borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.4)', overflow: 'hidden', animation: 'dcUp .18s ease-out' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ed)' }}>Scheda</span>
          <Campo refEl={primo} valore={s.titolo || s.titolo_breve} salva={(v) => salva({ titolo: v })} label="Titolo della scheda" placeholder="Titolo della scheda" className="inp big" style={{ flex: 1, fontSize: 20, fontWeight: 700 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${col}`, color: col, borderRadius: 999, padding: '5px 12px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: col }} />
            {corsiaDi(m, s.corsia).nome}
          </span>
          <button className="btn lg" onClick={() => imposta({ apertaId: id, editId: null })}>Anteprima</button>
          <button className="btn lg" aria-label="Chiudi la modifica" onClick={() => imposta({ editId: null })}>✕</button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(210px,290px) minmax(360px,1.8fr) minmax(200px,280px)' }}>
          <section aria-label="Identificazione" style={{ minHeight: 0, overflow: 'auto', borderRight: '1px solid var(--line)', background: 'var(--bg)', padding: '14px 15px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>
            <h3 className="h3">1 · Identificazione</h3>
            <label className="lbl">Etichetta breve · appare sulla card
              <Campo valore={s.titolo_breve} salva={(v) => salva({ titolo_breve: v })} className="inp big" style={{ fontWeight: 700 }} />
            </label>
            <label className="lbl">Data
              <Campo valore={s.data} salva={(v) => salva({ data: v })} invalido={!!d.err} placeholder="gg/mm/aaaa · mm/aaaa · aaaa" className="inp big" style={{ borderColor: d.err ? 'var(--warn-line)' : undefined }} />
            </label>
            {d.err && <p role="alert" className="note" style={{ margin: '-8px 0 0', padding: '8px 10px', fontSize: 13, fontWeight: 700 }}>{d.err}</p>}
            {d.ambigua && <p className="note" style={{ margin: '-8px 0 0', padding: '8px 10px', fontSize: 13 }}>Questa data si può leggere come intervallo di anni oppure come mese. Per un mese scrivi mm/aaaa.</p>}
            <p style={{ margin: '-4px 0 0', fontSize: 13, color: 'var(--mute)' }}>Letta come <b>{dataLunga(s.data)}</b>.</p>
            <label className="lbl">Categoria
              <select className="inp big" value={s.corsia} onChange={(e) => salva({ corsia: e.target.value })}>
                {m.autore.corsie.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label className="lbl">Pagine del libro
              <Campo valore={s.pagine} salva={(v) => salva({ pagine: v })} placeholder="p. 000" className="inp big" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, color: 'var(--mute)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', background: 'var(--surface)', cursor: 'pointer' }}>
              <input type="checkbox" checked={s.fuori_dal_libro} onChange={(e) => salva({ fuori_dal_libro: e.target.checked })} style={{ width: 17, height: 17, accentColor: 'var(--ed)' }} />
              Fuori dal libro
            </label>
            <label className="lbl" style={{ color: 'var(--warn-ink)' }}>Avviso allo studio
              <Campo multi rows={3} valore={s.attenzione} salva={(v) => salva({ attenzione: v })} placeholder="Errore da evitare, confusione frequente…" className="inp big warn" style={{ background: 'var(--warn-bg)', color: 'var(--warn-ink)' }} />
            </label>
          </section>

          <section aria-label="Contenuto" style={{ minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 11, padding: '14px 16px 22px' }}>
            <h3 className="h3">2 · Contenuto</h3>
            <label className="lbl">Riassunto
              <Campo multi rows={5} valore={s.riassunto} salva={(v) => salva({ riassunto: v })} placeholder="Due o tre frasi che bastano per il ripasso." className="inp big" style={{ minHeight: 140, fontSize: 16 }} />
            </label>
            <label className="lbl">Dettagli · una riga per punto · **grassetto** *corsivo*
              <Campo multi rows={9} valore={s.dettagli.join('\n')} salva={(v) => salva({ dettagli: v.split('\n') })} placeholder="Un punto per riga." className="inp big" style={{ minHeight: 240, fontSize: 15 }} />
            </label>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg)', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="h3">4 · Tabella</span>
              <Campo valore={tab.intro} salva={(v) => salvaTab(v, testoTab)} placeholder="Riga introduttiva" className="inp big" />
              <Campo multi rows={4} valore={testoTab} salva={(v) => salvaTab(tab.intro, v)} placeholder="Prima riga = intestazioni. Celle separate da |" className="inp big" style={{ fontSize: 14 }} />
            </div>
          </section>

          <section aria-label="Relazioni" style={{ minHeight: 0, overflow: 'auto', borderLeft: '1px solid var(--line)', background: 'var(--bg)', padding: '14px 15px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>
            <h3 className="h3">3 · Relazioni</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mute)' }}>Temi · {s.temi.length}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.temi.map((t) => (
                  <button key={t.id} type="button" className={'chip' + (s.temi.includes(t.id) ? ' on' : '')} aria-pressed={s.temi.includes(t.id)} onClick={() => commutaTema(t.id)}>{t.nome}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--line)', paddingTop: 11 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mute)' }}>Collegamenti · {collegate.size}</span>
              <input className="inp big" placeholder="Filtra le schede" aria-label="Filtra le schede da collegare" value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ fontSize: 14 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {linkVisibili.map((x) => (
                  <button key={x.id} type="button" className={'chip' + (collegate.has(x.id) ? ' on' : '')} aria-pressed={collegate.has(x.id)} onClick={() => void commutaLink(x.id)} style={{ fontWeight: 600, whiteSpace: 'normal', textAlign: 'left' }}>{x.titolo_breve}</button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
          <button className="btn lg" disabled={pos <= 0} onClick={() => vai(lista[pos - 1]?.id)}>← Precedente</button>
          <button className="btn lg" disabled={pos >= lista.length - 1} onClick={() => vai(lista[pos + 1]?.id)}>Successiva →</button>
          <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600 }}>{pos + 1} di {lista.length} · i cambiamenti sono già salvati</span>
          <div style={{ flex: 1 }} />
          <button className="btn lg" onClick={async () => { const r = await window.api.duplicaScheda(id); useStore.getState().applica(r.modello); vai(r.id) }}>Duplica</button>
          <button className="btn lg" onClick={async () => { const r = await window.api.creaScheda({ corsia: s.corsia }); useStore.getState().applica(r.modello); vai(r.id) }}>+ Nuova scheda</button>
          <button className="btn lg ed" onClick={() => imposta({ editId: null })}>Fatto</button>
        </div>
      </div>
    </div>
  )
}
