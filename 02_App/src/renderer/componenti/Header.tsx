import { useEffect, type ReactNode } from 'react'
import { erroreFine } from '@shared/dates'
import { schedeDelTema } from '@shared/derivati'
import type { Corsia, Periodo, Tema } from '@shared/types'
import { useColore, useStore, type Popover } from '../store'
import { Campo, slug } from '../utili'
import { EVENTO_SENZA_DATA } from './Mappa'

function Filtro(props: { id: Exclude<Popover, 'lettura' | null>; titolo: string; etichetta: string; attivo: boolean; children: ReactNode }) {
  const popover = useStore((s) => s.popover)
  const imposta = useStore((s) => s.imposta)
  const aperto = popover === props.id
  return (
    <div data-pop="1" style={{ position: 'relative', flex: '1 1 280px', minWidth: 230, maxWidth: 430, border: `1px solid ${props.attivo ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, background: props.attivo ? 'var(--surface2)' : 'var(--surface)' }}>
      <button type="button" aria-expanded={aperto} onClick={() => imposta({ popover: aperto ? null : props.id })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, border: 0, borderRadius: 13, background: 'transparent', padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11, color: 'var(--mute)' }}>{props.titolo}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.etichetta}</span>
        <span aria-hidden style={{ color: 'var(--mute)', fontSize: 11 }}>{aperto ? '▲' : '▼'}</span>
      </button>
      {aperto && <div className="pop">{props.children}</div>}
    </div>
  )
}

const Gestisci = ({ t }: { t: string }) => (
  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ed)' }}>{t}</span>
)

export function Header() {
  const m = useStore((s) => s.modello)!
  const ix = useStore((s) => s.indice)!
  const st = useStore()
  const colore = useColore()
  const { imposta, prefs } = st

  // un clic fuori chiude i popover
  useEffect(() => {
    const h = (e: MouseEvent): void => {
      if (!(e.target as HTMLElement).closest('[data-pop]')) useStore.getState().imposta({ popover: null })
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const nSenza = m.schede.filter((s) => ix.num(s) == null).length
  const errori = m.problemi.filter((p) => p.gravita === 'errore').length
  const nProblemi = m.problemi.length
  const attiviPer = st.periodi.length
  const aggiornaPeriodi = (periodi: Periodo[]): void => void window.api.aggiornaAutore({ periodi }).then((x) => st.applica(x))
  const aggiornaCorsie = (corsie: Corsia[]): void => void window.api.aggiornaAutore({ corsie }).then((x) => st.applica(x))
  const aggiornaTemi = (temi: Tema[]): void => void window.api.aggiornaTemi(temi).then((x) => st.applica(x))
  const commuta = (lista: number[], v: number): number[] => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

  return (
    <header style={{ flex: 'none', borderBottom: '1px solid var(--line)', background: 'var(--surface)', borderTop: `3px solid ${st.editando ? 'var(--ed)' : 'transparent'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', flexWrap: 'wrap' }}>
        {st.editando ? (
          <Campo valore={m.autore.nome} salva={(v) => void window.api.aggiornaAutore({ nome: v }).then((x) => st.applica(x))} label="Nome dell'autore" className="inp big" style={{ width: 220, flex: 'none', borderColor: 'var(--ed)', fontWeight: 700 }} />
        ) : (
          <strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{m.autore.nome}</strong>
        )}
        {st.stato && st.stato.autori.length > 1 && (
          <select className="inp" style={{ width: 'auto' }} value={st.stato.autoreId ?? ''} onChange={(e) => void st.scegliAutore(e.target.value)} aria-label="Autore">
            {st.stato.autori.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        )}
        <div role="group" aria-label="Vista" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {(['mappa', 'lista'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={st.vista === v} onClick={() => prefs({ vista: v })} style={{ border: 0, borderRight: v === 'mappa' ? '1px solid var(--line)' : 0, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: st.vista === v ? 'var(--ink)' : 'var(--surface)', color: st.vista === v ? 'var(--surface)' : 'var(--ink)' }}>
              {v === 'mappa' ? 'Mappa' : 'Lista'}
            </button>
          ))}
        </div>
        {st.vista === 'mappa' && nSenza > 0 && (
          <button type="button" className="btn" style={{ borderStyle: 'dashed', color: 'var(--mute)' }} onClick={() => window.dispatchEvent(new Event(EVENTO_SENZA_DATA))}>Senza data · {nSenza} →</button>
        )}
        <div style={{ flex: '1 1 0', minWidth: 8 }} />
        <label style={{ flex: '0 1 380px', minWidth: 120, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg)', padding: '0 10px' }}>
          <span aria-hidden style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 700 }}>⌕</span>
          <span className="sr">Cerca nelle schede</span>
          <input type="search" value={st.query} onChange={(e) => imposta({ query: e.target.value })} placeholder="Cerca titolo, dettagli, tema…" style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', padding: '8px 0', fontSize: 13, outline: 'none' }} />
        </label>
        <div style={{ flex: '1 1 0', minWidth: 8 }} />
        <button className="btn" onClick={() => void window.api.mostraCartella()} title="Apri la cartella dell'autore">Cartella</button>
        <button className="btn" onClick={() => imposta({ controlli: !st.controlli })} aria-expanded={st.controlli} style={nProblemi ? { borderColor: errori ? 'var(--err-line)' : 'var(--warn-line)' } : undefined}>
          Controlli{nProblemi ? ` · ${nProblemi}` : ' ✓'}
        </button>
        <button className="btn" onClick={() => prefs({ scuro: !st.scuro })}>{st.scuro ? 'Chiaro' : 'Scuro'}</button>
        <button className="btn" data-pop="1" aria-expanded={st.popover === 'lettura'} onClick={() => imposta({ popover: st.popover === 'lettura' ? null : 'lettura' })}>Aa Lettura</button>
        <button className="btn" aria-pressed={st.editando} title="Attiva o disattiva la modifica dei contenuti" onClick={() => imposta({ editando: !st.editando })} style={st.editando ? { background: 'var(--ed)', color: 'var(--surface)', borderColor: 'var(--ed)' } : undefined}>
          {st.editando ? 'Modifica attiva' : 'Modifica'}
        </button>
      </div>

      {st.editando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', padding: '0 14px 10px' }}>
          <Gestisci t="Modifica attiva" />
          <button className="btn ed" onClick={async () => { const r = await window.api.creaScheda({}); st.applica(r.modello); imposta({ editId: r.id, selId: r.id }) }}>+ Nuova scheda</button>
          <span style={{ fontSize: 12, color: 'var(--mute)' }}>{m.schede.length} schede · ogni cambiamento è subito nel file</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'center', padding: '0 14px 11px', flexWrap: 'wrap' }}>
        <Filtro id="periodi" titolo="Periodi" attivo={attiviPer > 0} etichetta={attiviPer ? st.periodi.map((i) => m.autore.periodi[i]?.nome).filter(Boolean).join(' · ') : 'Tutti'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <button className={'chip' + (attiviPer ? '' : ' on')} onClick={() => imposta({ periodi: [] })}>Tutti</button>
            {m.autore.periodi.map((p, i) => (
              <button key={i} className={'chip' + (st.periodi.includes(i) ? ' on' : '')} aria-pressed={st.periodi.includes(i)} onClick={() => imposta({ periodi: commuta(st.periodi, i) })}>{p.nome}</button>
            ))}
          </div>
          {st.editando && (
            <div style={{ marginTop: 12, borderTop: '2px solid var(--line)', paddingTop: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Gestisci t="Gestisci periodi" />
              {m.autore.periodi.map((p, i) => {
                const err = erroreFine(p.data, p.fine)
                const set = (x: Partial<Periodo>): void => aggiornaPeriodi(m.autore.periodi.map((q, j) => (j === i ? { ...q, ...x } : q)))
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, border: '1px solid var(--line2)', borderRadius: 9, padding: '7px 8px' }}>
                    <Campo valore={p.nome} salva={(v) => set({ nome: v })} label="Nome del periodo" className="inp" />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Campo valore={p.data} salva={(v) => set({ data: v })} label="Data d'inizio" placeholder="dal…" className="inp" />
                      <Campo valore={p.fine ?? ''} salva={(v) => set({ fine: v })} label="Data di fine, facoltativa (ultimo giorno incluso)" placeholder="al…" className="inp" style={{ borderStyle: 'dashed' }} />
                      <button className="btn" aria-label="Elimina periodo" onClick={() => aggiornaPeriodi(m.autore.periodi.filter((_, j) => j !== i))}>✕</button>
                    </div>
                    {err && <span className="note" style={{ fontSize: 11.5, padding: '4px 7px', borderRadius: 7 }}>{err}</span>}
                  </div>
                )
              })}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => aggiornaPeriodi([...m.autore.periodi, { nome: 'Nuovo periodo', data: '' }])}>+ Periodo</button>
            </div>
          )}
        </Filtro>

        <Filtro id="temi" titolo="Temi" attivo={st.temi.length > 0} etichetta={st.temi.length ? st.temi.map((k) => m.temi.find((t) => t.id === k)?.nome).filter(Boolean).join(' · ') : 'Tutti'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <button className={'chip' + (st.temi.length ? '' : ' on')} onClick={() => imposta({ temi: [] })}>Tutti</button>
            {m.temi.map((t) => (
              <button key={t.id} className={'chip' + (st.temi.includes(t.id) ? ' on' : '')} aria-pressed={st.temi.includes(t.id)} onClick={() => imposta({ temi: st.temi.includes(t.id) ? st.temi.filter((x) => x !== t.id) : [...st.temi, t.id] })}>{t.nome}</button>
            ))}
          </div>
          {st.editando && (
            <div style={{ marginTop: 12, borderTop: '2px solid var(--line)', paddingTop: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Gestisci t="Gestisci temi" />
              {m.temi.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Campo valore={t.nome} salva={(v) => aggiornaTemi(m.temi.map((x) => (x.id === t.id ? { ...x, nome: v } : x)))} label="Nome del tema" className="inp" />
                  <span style={{ fontSize: 11.5, color: 'var(--mute)', fontWeight: 700, whiteSpace: 'nowrap' }}>{schedeDelTema(m, t.id).length} schede</span>
                </div>
              ))}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => {
                let id = slug('nuovo tema'); for (let n = 2; m.temi.some((t) => t.id === id); n++) id = `nuovo_tema${n}`
                aggiornaTemi([...m.temi, { id, nome: 'Nuovo tema' }])
              }}>+ Tema</button>
            </div>
          )}
        </Filtro>

        <Filtro id="corsie" titolo="Categorie" attivo={Object.values(st.corsieSpente).some(Boolean)} etichetta={Object.values(st.corsieSpente).some(Boolean) ? `${m.autore.corsie.filter((c) => !st.corsieSpente[c.id]).length} di ${m.autore.corsie.length}` : 'Tutte'}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {m.autore.corsie.map((c) => (
              <button key={c.id} className={'chip' + (st.corsieSpente[c.id] ? '' : ' on')} aria-pressed={!st.corsieSpente[c.id]} style={{ display: 'flex', alignItems: 'center', gap: 7 }} onClick={() => imposta({ corsieSpente: { ...st.corsieSpente, [c.id]: !st.corsieSpente[c.id] } })}>
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: 3, background: colore(c.id) }} />{c.nome}
              </button>
            ))}
          </div>
          {st.editando && (
            <div style={{ marginTop: 12, borderTop: '2px solid var(--line)', paddingTop: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Gestisci t="Gestisci categorie" />
              {m.autore.corsie.map((c, i) => {
                const set = (x: Partial<Corsia>): void => aggiornaCorsie(m.autore.corsie.map((q) => (q.id === c.id ? { ...q, ...x } : q)))
                const su = (): void => {
                  if (!i) return
                  const l = [...m.autore.corsie]; [l[i - 1], l[i]] = [l[i]!, l[i - 1]!]; aggiornaCorsie(l)
                }
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span aria-hidden style={{ width: 14, height: 14, borderRadius: 4, background: colore(c.id), flex: 'none' }} />
                    <Campo valore={c.nome} salva={(v) => set({ nome: v })} label="Nome della categoria" className="inp" />
                    <Campo valore={c.sigla} salva={(v) => set({ sigla: v })} label="Sigla" className="inp" style={{ width: 76 }} />
                    <input type="range" min={0} max={355} step={5} value={c.tonalita} onChange={(e) => set({ tonalita: +e.target.value })} aria-label="Colore della categoria" style={{ width: 62 }} />
                    <button className="btn" aria-label="Sposta in su" onClick={su}>↑</button>
                  </div>
                )
              })}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => {
                let id = 'nuova_categoria'; for (let n = 2; m.autore.corsie.some((c) => c.id === id); n++) id = `nuova_categoria${n}`
                aggiornaCorsie([...m.autore.corsie, { id, nome: 'Nuova categoria', sigla: 'NUO', tonalita: 200 }])
              }}>+ Categoria</button>
            </div>
          )}
        </Filtro>
      </div>

      {st.popover === 'lettura' && (
        <div data-pop="1" style={{ position: 'fixed', top: 56, right: 14, zIndex: 60, width: 286, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,.22)', padding: 14, animation: 'dcUp .14s ease-out' }}>
          <strong style={{ display: 'block', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Lettura</strong>
          <div className="h3s">Carattere</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['atkinson', 'Atkinson'], ['lexend', 'Lexend'], ['sistema', 'Sistema']] as const).map(([k, n]) => (
              <button key={k} className={'btn' + (st.font === k ? ' on' : '')} style={{ flex: 1 }} aria-pressed={st.font === k} onClick={() => prefs({ font: k })}>{n}</button>
            ))}
          </div>
          <label className="h3s" style={{ display: 'block' }}>Dimensione testo · {st.fs}px</label>
          <input type="range" min={13} max={19} step={1} value={st.fs} onChange={(e) => prefs({ fs: +e.target.value })} style={{ width: '100%', marginBottom: 12 }} />
          <label className="h3s" style={{ display: 'block' }}>Spaziatura righe · {(st.ls / 100).toFixed(2)}</label>
          <input type="range" min={130} max={200} step={5} value={st.ls} onChange={(e) => prefs({ ls: +e.target.value })} style={{ width: '100%', marginBottom: 12 }} />
          <div className="h3s">Palette delle categorie</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([[false, 'Vivace'], [true, 'Sobria']] as const).map(([v, n]) => (
              <button key={n} className={'btn' + (st.sobria === v ? ' on' : '')} style={{ flex: 1 }} aria-pressed={st.sobria === v} onClick={() => prefs({ sobria: v })}>{n}</button>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.4 }}>Valgono per tutta l'app. Nella mappa: <b>←</b> <b>→</b> fra le schede, <b>Invio</b> apre, <b>Esc</b> chiude.</p>
        </div>
      )}
    </header>
  )
}
