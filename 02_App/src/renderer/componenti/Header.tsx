import { useEffect, useState, type ReactNode } from 'react'
import { erroreFine } from '@shared/dates'
import { schedeDelTema } from '@shared/derivati'
import type { Corsia, Periodo, Tema } from '@shared/types'
import { useColore, useStore, type Popover } from '../store'
import { Campo, slug } from '../utili'
import { Con, Icona, type NomeIcona } from './Icona'

function Filtro(props: { id: Exclude<Popover, 'lettura' | null>; titolo: string; icona: NomeIcona; n: number; riassunto: string; larghezza?: number; children: ReactNode }) {
  const popover = useStore((s) => s.popover)
  const imposta = useStore((s) => s.imposta)
  const aperto = popover === props.id
  const attivo = props.n > 0
  return (
    <div data-pop="1" style={{ position: 'relative', flex: 'none' }}>
      <button type="button" className="hd-b" aria-expanded={aperto} title={`${props.titolo}: ${props.riassunto}`} onClick={() => imposta({ popover: aperto ? null : props.id })} style={{ borderColor: attivo || aperto ? 'var(--ink)' : undefined, background: attivo ? 'var(--surface2)' : undefined }}>
        <Icona nome={props.icona} size={15} />
        <span className="hd-lab">{props.titolo}</span>
        {attivo && <span aria-label={`${props.n} attivi`} style={{ background: 'var(--ink)', color: 'var(--surface)', borderRadius: 999, minWidth: 18, height: 18, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{props.n}</span>}
        <Icona nome={aperto ? 'chiuso' : 'apri'} size={13} style={{ color: 'var(--mute)' }} />
      </button>
      {aperto && <div className="pop" style={{ right: 'auto', left: 0, width: props.larghezza ?? 360 }}>{props.children}</div>}
    </div>
  )
}

const Gestisci = ({ t }: { t: string }) => (
  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ed)' }}>{t}</span>
)

export function Header() {
  const m = useStore((s) => s.modello)!
  const st = useStore()
  const colore = useColore()
  const { imposta, prefs } = st
  const [elim, setElim] = useState<{ tipo: 'tema' | 'corsia'; id: string } | null>(null)
  const [verso, setVerso] = useState('')

  // un clic fuori chiude i popover
  useEffect(() => {
    const h = (e: MouseEvent): void => {
      if (!(e.target as HTMLElement).closest('[data-pop]')) useStore.getState().imposta({ popover: null })
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const attiviPer = st.periodi.length
  const nSpente = m.autore.corsie.filter((c) => st.corsieSpente[c.id]).length
  const aggiornaPeriodi = (periodi: Periodo[]): void => void window.api.aggiornaAutore({ periodi }).then((x) => st.applica(x))
  const aggiornaCorsie = (corsie: Corsia[]): void => void window.api.aggiornaAutore({ corsie }).then((x) => st.applica(x))
  const aggiornaTemi = (temi: Tema[]): void => void window.api.aggiornaTemi(temi).then((x) => st.applica(x))
  const commuta = (lista: number[], v: number): number[] => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

  return (
    <header className="hd" style={{ flex: 'none', borderBottom: '1px solid var(--line)', background: 'var(--surface)', borderTop: `3px solid ${st.editando ? 'var(--ed)' : 'transparent'}`, transition: 'border-color .18s' }}>
      <div className="hd-riga">
        {/* sinistra: dove sono */}
        <div className="hd-gruppo">
          {st.editando ? (
            <Campo valore={m.autore.nome} salva={(v) => void window.api.aggiornaAutore({ nome: v }).then((x) => st.applica(x))} label="Nome dell'autore" className="inp big" style={{ width: 190, flex: 'none', borderColor: 'var(--ed)', fontWeight: 700, padding: '6px 10px', fontSize: 14.5 }} />
          ) : (
            <strong style={{ fontSize: 15, whiteSpace: 'nowrap', flex: 'none' }}>{m.autore.nome}</strong>
          )}
          {st.stato && st.stato.autori.length > 1 && (
            <select className="inp" style={{ width: 'auto', flex: 'none' }} value={st.stato.autoreId ?? ''} onChange={(e) => void st.scegliAutore(e.target.value)} aria-label="Autore">
              {st.stato.autori.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          )}
          <div role="group" aria-label="Vista" className="hd-seg" style={{ marginLeft: 6 }}>
            {(['mappa', 'lista'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={st.vista === v} onClick={() => prefs({ vista: v })} style={{ borderRight: v === 'mappa' ? '1px solid var(--line)' : 0, background: st.vista === v ? 'var(--ink)' : 'var(--surface)', color: st.vista === v ? 'var(--surface)' : 'var(--ink)' }}>
                <Icona nome={v === 'mappa' ? 'mappa' : 'elenco'} size={15} /><span className="hd-lab">{v === 'mappa' ? 'Mappa' : 'Lista'}</span>
              </button>
            ))}
          </div>
          <div role="group" aria-label="Studio" className="hd-seg">
            {(['confronti', 'ripasso', 'testi', 'percorso', 'note'] as const).map((v, i) => (
              <button key={v} type="button" aria-pressed={st.vista === v} onClick={() => prefs({ vista: st.vista === v ? 'mappa' : v })} style={{ borderRight: i < 4 ? '1px solid var(--line)' : 0, background: st.vista === v ? 'var(--ink)' : 'var(--surface)', color: st.vista === v ? 'var(--surface)' : 'var(--ink)' }}>
                <span style={{ padding: '0 4px', textTransform: 'capitalize' }}>{v === 'testi' ? 'Testi chiave' : v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* centro: cosa guardo (filtri e ricerca) */}
        <div className="hd-gruppo hd-centro">
        <Filtro id="periodi" titolo="Periodi" icona="orologio" n={attiviPer} riassunto={attiviPer ? st.periodi.map((i) => m.autore.periodi[i]?.nome).filter(Boolean).join(' · ') : 'tutti'}>
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
                      <button className="btn" aria-label="Elimina periodo" onClick={() => aggiornaPeriodi(m.autore.periodi.filter((_, j) => j !== i))}><Icona nome="cestino" /></button>
                    </div>
                    {err && <span className="note" style={{ fontSize: 11.5, padding: '4px 7px', borderRadius: 7 }}>{err}</span>}
                  </div>
                )
              })}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => aggiornaPeriodi([...m.autore.periodi, { nome: 'Nuovo periodo', data: '' }])}><Con i="piu">Periodo</Con></button>
            </div>
          )}
        </Filtro>

          <Filtro id="temi" titolo="Temi" icona="segnalibro" n={st.temi.length} riassunto={st.temi.length ? st.temi.map((k) => m.temi.find((t) => t.id === k)?.nome).filter(Boolean).join(' · ') : 'tutti'}>
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
                  <button className="btn" aria-label={`Elimina il tema ${t.nome}`} title="Elimina il tema" onClick={() => setElim({ tipo: 'tema', id: t.id })}><Icona nome="cestino" /></button>
                </div>
              ))}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => {
                let id = slug('nuovo tema'); for (let n = 2; m.temi.some((t) => t.id === id); n++) id = `nuovo_tema${n}`
                aggiornaTemi([...m.temi, { id, nome: 'Nuovo tema' }])
              }}><Con i="piu">Tema</Con></button>
            </div>
          )}
        </Filtro>

          <Filtro id="corsie" titolo="Categorie" icona="cartella" larghezza={430} n={nSpente} riassunto={nSpente ? `${m.autore.corsie.length - nSpente} di ${m.autore.corsie.length}` : 'tutte'}>
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
                    <button className="btn" aria-label="Sposta in su" onClick={su}><Icona nome="su" /></button>
                    <button className="btn" aria-label={`Elimina la categoria ${c.nome}`} title="Elimina la categoria" disabled={m.autore.corsie.length <= 1} onClick={() => { setVerso(m.autore.corsie.find((x) => x.id !== c.id)?.id ?? ''); setElim({ tipo: 'corsia', id: c.id }) }}><Icona nome="cestino" /></button>
                  </div>
                )
              })}
              <button className="btn ghost-ed" style={{ alignSelf: 'flex-start' }} onClick={() => {
                let id = 'nuova_categoria'; for (let n = 2; m.autore.corsie.some((c) => c.id === id); n++) id = `nuova_categoria${n}`
                aggiornaCorsie([...m.autore.corsie, { id, nome: 'Nuova categoria', sigla: 'NUO', tonalita: 200 }])
              }}><Con i="piu">Categoria</Con></button>
            </div>
          )}
        </Filtro>

          <label className="hd-cerca">
            <Icona nome="cerca" size={15} style={{ color: 'var(--mute)' }} />
            <span className="sr">Cerca nelle schede</span>
            <input type="search" value={st.query} onChange={(e) => imposta({ query: e.target.value })} placeholder="Cerca titolo, dettagli, tema…" />
          </label>
        </div>

        {/* destra: modificare */}
        <div className="hd-gruppo" style={{ justifyContent: 'flex-end' }}>
          {st.editando && (
            <button type="button" className="hd-b ed hd-entra" title={`Nuova scheda (${m.schede.length} schede, ogni cambiamento è subito nel file)`} onClick={async () => { const r = await window.api.creaScheda({}); st.applica(r.modello); imposta({ editId: r.id, selId: r.id }) }}><Icona nome="aggiungiScheda" size={15} /><span className="hd-lab hd-lab2">Nuova scheda</span></button>
          )}
          <button type="button" className="hd-b" aria-pressed={st.editando} title="Attiva o disattiva la modifica dei contenuti" onClick={() => imposta({ editando: !st.editando })} style={st.editando ? { background: 'var(--ed)', color: 'var(--surface)', borderColor: 'var(--ed)' } : undefined}>
            <Icona nome="matita" size={15} /><span className="hd-lab">Modifica</span>
          </button>
        </div>
      </div>
      {elim && (() => {
        const tema = elim.tipo === 'tema' ? m.temi.find((t) => t.id === elim.id) : null
        const corsia = elim.tipo === 'corsia' ? m.autore.corsie.find((c) => c.id === elim.id) : null
        const nSchede = tema ? schedeDelTema(m, tema.id).length : m.schede.filter((x) => x.corsia === elim.id).length
        const nome = tema?.nome ?? corsia?.nome ?? elim.id
        const serveDest = elim.tipo === 'corsia' && nSchede > 0
        const chiudi = (): void => setElim(null)
        return (
          <div role="alertdialog" aria-label="Conferma eliminazione" className="overlay" style={{ zIndex: 95, alignItems: 'center', padding: 22, background: 'rgba(8,12,18,.6)' }} onMouseDown={(e) => e.target === e.currentTarget && chiudi()}>
            <div style={{ maxWidth: 500, background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '4px solid var(--err-line)', borderRadius: 14, padding: 20, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Eliminare {elim.tipo === 'tema' ? 'il tema' : 'la categoria'} «{nome}»?</h3>
              {elim.tipo === 'tema' ? (
                <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>Lo tolgo da <b>{nSchede}</b> sched{nSchede === 1 ? 'a' : 'e'}. Le schede <b>non</b> vengono eliminate.</p>
              ) : serveDest ? (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: 14.5 }}>Ha <b>{nSchede}</b> sched{nSchede === 1 ? 'a' : 'e'}: non vengono eliminate, passano a un'altra categoria.</p>
                  <label className="lbl" style={{ marginBottom: 14 }}>Sposta le schede in
                    <select className="inp big" value={verso} onChange={(e) => setVerso(e.target.value)}>
                      {m.autore.corsie.filter((c) => c.id !== elim.id).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>La categoria non ha schede.</p>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn lg" onClick={chiudi}>Annulla</button>
                <button className="btn lg" style={{ background: 'var(--err-line)', color: '#fff', borderColor: 'var(--err-line)' }} onClick={async () => {
                  try {
                    if (elim.tipo === 'tema') {
                      const r = await window.api.eliminaTema(elim.id)
                      st.applica(r.modello)
                      imposta({ temi: st.temi.filter((x) => x !== elim.id) })
                      st.mostraToast(`Tema «${nome}» eliminato · tolto da ${r.schedeToccate} schede`)
                    } else {
                      const r = await window.api.eliminaCorsia(elim.id, serveDest ? verso : null)
                      st.applica(r.modello)
                      const { [elim.id]: _tolta, ...resto } = st.corsieSpente
                      imposta({ corsieSpente: resto })
                      st.mostraToast(`Categoria «${nome}» eliminata · ${r.schedeSpostate} schede spostate`)
                    }
                  } catch (e) {
                    st.mostraToast((e as Error).message)
                  }
                  chiudi()
                }}><Con i="cestino">Elimina</Con></button>
              </div>
            </div>
          </div>
        )
      })()}
    </header>
  )
}
