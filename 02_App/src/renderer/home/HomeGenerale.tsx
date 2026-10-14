import { useEffect, useMemo, useRef, useState } from 'react'
import type { NodoArg, TipoNodo } from '@shared/types'
import { Con, Icona } from '../componenti/Icona'
import { Modale, primario, secondario } from '../editor/ui'
import { useEditor } from '../editor/stato'
import { useStore } from '../store'
import { Albero, ICONA_NODO } from './Albero'
import { antenati, èDocumento, idScheda, tutti, trova, useHome } from './stato'

const ETICHETTA: Record<TipoNodo, string> = { materia: 'Materia', cartella: 'Cartella', autore: 'Autore', mappa: 'Mappa cronologica', testo: 'Testo', situazioni: 'Per situazioni' }

const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function quando(ms: number): string {
  if (!ms) return '—'
  const g = Math.floor((Date.now() - ms) / 86_400_000)
  if (g <= 0) return 'oggi'
  if (g === 1) return 'ieri'
  if (g < 7) return `${g} giorni fa`
  return new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Medaglia({ tipo, size = 38 }: { tipo: TipoNodo; size?: number }) {
  return (
    <span className={'hm-ico hm-t-' + tipo} style={{ width: size, height: size }}>
      <Icona nome={ICONA_NODO[tipo]} size={Math.round(size * 0.5)} />
    </span>
  )
}

function apriNodo(n: NodoArg): void {
  useHome.getState().apri(n)
}

// ------------------------------------------------------------------ cartoline

function Cartolina({ n, grande }: { n: NodoArg; grande?: boolean }) {
  const sel = useHome((h) => h.sel === n.rel)
  const pref = useHome((h) => h.preferiti.includes(n.rel))
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className={'hm-c hm-t-' + n.tipo + (sel ? ' sel' : '') + (grande ? ' grande' : '')}
        style={{ width: '100%' }}
        onClick={() => apriNodo(n)}
        onContextMenu={(e) => { e.preventDefault(); useHome.getState().imposta({ sel: n.rel }) }}
        title={n.nome}
      >
        <Medaglia tipo={n.tipo} size={grande ? 46 : 38} />
        <span style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: grande ? 18 : 14.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{n.nome}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, color: 'var(--mute)' }}>{n.info}</span>
        </span>
        <span style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {ETICHETTA[n.tipo]} · {quando(n.modificato)}
          {pref && <Icona nome="stella" size={12} piena />}
        </span>
      </button>
      <button type="button" className="hm-m" aria-label={`Dettagli di ${n.nome}`} title="Dettagli e azioni" onClick={() => useHome.getState().imposta({ sel: n.rel })}>
        <Icona nome="menu" size={15} />
      </button>
    </div>
  )
}

function Riga({ n }: { n: NodoArg }) {
  const sel = useHome((h) => h.sel === n.rel)
  const pref = useHome((h) => h.preferiti.includes(n.rel))
  return (
    <button type="button" className={'hm-riga hm-t-' + n.tipo + (sel ? ' sel' : '')} onClick={() => apriNodo(n)} onContextMenu={(e) => { e.preventDefault(); useHome.getState().imposta({ sel: n.rel }) }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Medaglia tipo={n.tipo} size={30} />
        <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nome}</span>
        {pref && <Icona nome="stella" size={12} piena />}
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.info}</span>
      <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{quando(n.modificato)}</span>
      <span
        role="button"
        tabIndex={0}
        aria-label={`Dettagli di ${n.nome}`}
        title="Dettagli e azioni"
        onClick={(e) => { e.stopPropagation(); useHome.getState().imposta({ sel: n.rel }) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); useHome.getState().imposta({ sel: n.rel }) } }}
        style={{ display: 'inline-flex', color: 'var(--mute)' }}
      >
        <Icona nome="menu" size={15} />
      </span>
    </button>
  )
}

function Vuota({ testo, onClick, icona = 'piu' }: { testo: string; onClick: () => void; icona?: 'piu' }) {
  return (
    <button type="button" className="hm-c hm-c-v" onClick={onClick}>
      <Icona nome={icona} size={20} />
      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{testo}</span>
    </button>
  )
}

// ------------------------------------------------------------------ finestre

type Dialogo = { tipo: 'nuova'; padre: string; materia: boolean } | { tipo: 'rinomina'; n: NodoArg } | { tipo: 'archivia'; n: NodoArg } | null

function ChiediNome(props: { titolo: string; etichetta: string; iniziale: string; conferma: string; chiudi: () => void; fai: (nome: string) => Promise<void> }) {
  const [v, setV] = useState(props.iniziale)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  const invia = async (): Promise<void> => {
    setBusy(true)
    setErr(null)
    try {
      await props.fai(v)
      props.chiudi()
    } catch (e) {
      setErr((e as Error).message.replace(/^Error invoking remote method '[^']*': (Error: )?/, ''))
      setBusy(false)
    }
  }
  return (
    <Modale
      titolo={props.titolo}
      larghezza={460}
      chiudi={props.chiudi}
      intestazione={<><Icona nome="cartella" size={18} /><strong style={{ fontSize: 15 }}>{props.titolo}</strong></>}
      piede={<><div style={{ flex: 1 }} /><button type="button" style={secondario} onClick={props.chiudi}>Annulla</button><button type="button" style={primario} disabled={busy} onClick={() => void invia()}><Con i="spunta">{props.conferma}</Con></button></>}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mute)' }}>{props.etichetta}</label>
        <input ref={ref} className="inp big" value={v} onChange={(e) => { setV(e.target.value); setErr(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void invia(); if (e.key === 'Escape') props.chiudi() }} aria-invalid={!!err} />
        {err && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--err-ink)', background: 'var(--err-bg)', border: '1px solid var(--err-line)', borderRadius: 8, padding: '7px 10px' }}>{err}</p>}
      </div>
    </Modale>
  )
}

function Archivia({ n, chiudi, fai }: { n: NodoArg; chiudi: () => void; fai: () => Promise<void> }) {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Modale
      titolo="Archivia"
      larghezza={460}
      chiudi={chiudi}
      intestazione={<><Icona nome="cestino" size={18} /><strong style={{ fontSize: 15 }}>Archivia «{n.nome}»</strong></>}
      piede={<><div style={{ flex: 1 }} /><button type="button" style={secondario} onClick={chiudi}>Annulla</button><button type="button" style={{ ...primario, background: 'var(--err-line)', borderColor: 'var(--err-line)' }} disabled={busy} onClick={() => { setBusy(true); fai().then(chiudi).catch((e: Error) => { setErr(e.message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '')); setBusy(false) }) }}><Con i="cestino">Archivia</Con></button></>}
    >
      <div style={{ padding: 16, fontSize: 14, lineHeight: 1.55 }}>
        <p style={{ margin: '0 0 8px' }}>{n.tipo === 'testo' ? 'Il testo con annotazioni, parafrasi ed esercizi' : n.tipo === 'situazioni' ? 'La documentazione con tutte le sue schede e i progressi' : 'La cartella con tutto quello che contiene'} va in <strong>99_Archivio</strong>: non viene cancellato e puoi recuperarlo a mano.</p>
        {err && <p role="alert" style={{ margin: 0, color: 'var(--err-ink)', background: 'var(--err-bg)', border: '1px solid var(--err-line)', borderRadius: 8, padding: '7px 10px' }}>{err}</p>}
      </div>
    </Modale>
  )
}

// ------------------------------------------------------------------ pannello dettagli

function Dettagli({ n, azioni }: { n: NodoArg; azioni: { rinomina: () => void; archivia: () => void } }) {
  const pref = useHome((h) => h.preferiti.includes(n.rel))
  const albero = useHome((h) => h.albero)
  const nomi = antenati(n.rel).map((r) => trova(albero, r)?.nome ?? r)
  return (
    <aside className="hm-det" aria-label="Dettagli">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <Medaglia tipo={n.tipo} size={46} />
        <div style={{ flex: 1 }} />
        <button type="button" className="btn" aria-label="Chiudi i dettagli" onClick={() => useHome.getState().imposta({ sel: null })} style={{ padding: '6px 8px' }}><Icona nome="chiudi" size={14} /></button>
      </div>
      <h2 style={{ margin: '0 0 2px', fontSize: 19, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{n.nome}</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--mute)' }}>{ETICHETTA[n.tipo]}</p>
      <dl style={{ margin: '0 0 16px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 13 }}>
        <dt style={{ color: 'var(--mute)' }}>Contiene</dt><dd style={{ margin: 0 }}>{n.info}</dd>
        <dt style={{ color: 'var(--mute)' }}>Posizione</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{nomi.length ? nomi.join(' › ') : 'Materie'}</dd>
        <dt style={{ color: 'var(--mute)' }}>Modificato</dt><dd style={{ margin: 0 }}>{quando(n.modificato)}</dd>
      </dl>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" className="btn on" onClick={() => apriNodo(n)}><Con i="dx">{èDocumento(n) ? 'Apri in una scheda' : 'Entra'}</Con></button>
        <button type="button" className="btn" aria-pressed={pref} onClick={() => useHome.getState().preferito(n.rel)}><Icona nome="stella" size={15} piena={pref} /> {pref ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}</button>
        {n.puoRinominare && <button type="button" className="btn" onClick={azioni.rinomina}><Con i="matita">Rinomina</Con></button>}
        {n.puoArchiviare && <button type="button" className="btn" onClick={azioni.archivia}><Con i="cestino">Archivia</Con></button>}
        {n.protetto && !n.puoArchiviare && <p style={{ margin: 0, fontSize: 12, color: 'var(--mute)', lineHeight: 1.45 }}>Serve all'app: non si sposta né si archivia da qui.</p>}
      </div>
    </aside>
  )
}

// ------------------------------------------------------------------ pagina

export function HomeGenerale() {
  const h = useHome()
  const modello = useStore((s) => s.modello)
  const [dlg, setDlg] = useState<Dialogo>(null)
  const [menuNuovo, setMenuNuovo] = useState(false)
  const attuale = h.percorso ? trova(h.albero, h.percorso) : null
  const radice = !h.percorso
  const sel = h.sel ? trova(h.albero, h.sel) : null

  // l'albero si rilegge: all'apertura, quando la finestra torna in primo piano e quando il modello cambia (file toccati da fuori)
  useEffect(() => {
    void useHome.getState().carica()
    const f = (): void => void useHome.getState().carica()
    window.addEventListener('focus', f)
    return () => window.removeEventListener('focus', f)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => void useHome.getState().carica(), 350)
    return () => clearTimeout(t)
  }, [modello])

  const figli = useMemo(() => {
    const l = [...(attuale ? attuale.figli : h.albero)]
    const peso = (n: NodoArg): number => (n.tipo === 'mappa' ? 0 : n.tipo === 'testo' || n.tipo === 'situazioni' ? 2 : 1)
    l.sort((a, b) => peso(a) - peso(b) || (h.ordina === 'recente' ? b.modificato - a.modificato : a.nome.localeCompare(b.nome, 'it')))
    return l
  }, [attuale, h.albero, h.ordina])

  const risultati = useMemo(() => {
    const q = norm(h.query.trim())
    if (!q) return null
    return tutti(h.albero).filter((n) => norm(n.nome).includes(q) || norm(n.info).includes(q))
  }, [h.query, h.albero])

  const recenti = h.recenti.map((r) => trova(h.albero, r.rel)).filter((n): n is NodoArg => !!n).slice(0, 4)
  const preferiti = h.preferiti.map((r) => trova(h.albero, r)).filter((n): n is NodoArg => !!n)

  const nuovoTesto = async (): Promise<void> => {
    if (!attuale?.autoreId) return
    const st = useStore.getState()
    if (st.stato?.autoreId !== attuale.autoreId) await st.scegliAutore(attuale.autoreId)
    useEditor.getState().imposta({ nuovoOpen: true })
  }

  const dopo = async (p: Promise<{ albero: NodoArg[]; rel?: string }>): Promise<string | undefined> => {
    const r = await p
    useHome.setState({ albero: r.albero })
    await useHome.getState().carica()
    return r.rel
  }

  const contenuto = (
    <>
      {risultati ? (
        <section aria-label="Risultati della ricerca">
          <h2 className="hm-sez">{risultati.length} {risultati.length === 1 ? 'risultato' : 'risultati'} per «{h.query}»</h2>
          <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden' }}>
            {risultati.map((n) => <Riga key={n.rel} n={n} />)}
            {!risultati.length && <p style={{ margin: 0, padding: 18, color: 'var(--mute)' }}>Nessun risultato. La ricerca guarda i nomi di materie, cartelle, autori, mappe e testi.</p>}
          </div>
        </section>
      ) : radice ? (
        <>
          {recenti.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <h2 className="hm-sez">Continua da dove eri</h2>
              <div className="hm-grid">{recenti.map((n) => <Cartolina key={n.rel} n={n} />)}</div>
            </section>
          )}
          {preferiti.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <h2 className="hm-sez">Preferiti</h2>
              <div className="hm-grid">{preferiti.map((n) => <Cartolina key={n.rel} n={n} />)}</div>
            </section>
          )}
          <section>
            <h2 className="hm-sez">Materie</h2>
            <div className="hm-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
              {figli.map((n) => <Cartolina key={n.rel} n={n} grande />)}
              <Vuota testo="Nuova materia" onClick={() => setDlg({ tipo: 'nuova', padre: '', materia: true })} />
            </div>
          </section>
        </>
      ) : h.vista === 'griglia' ? (
        <div className="hm-grid">
          {figli.map((n) => <Cartolina key={n.rel} n={n} />)}
          {attuale?.tipo === 'autore' ? <Vuota testo="Nuovo testo" onClick={() => void nuovoTesto()} /> : attuale && attuale.rel !== 'italiano/autori' && <Vuota testo="Nuova cartella" onClick={() => setDlg({ tipo: 'nuova', padre: attuale.rel, materia: false })} />}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden' }}>
          <div className="hm-riga" style={{ cursor: 'default', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--mute)' }}><span>Nome</span><span>Contiene</span><span>Modificato</span><span /></div>
          {figli.map((n) => <Riga key={n.rel} n={n} />)}
        </div>
      )}
      {!risultati && !radice && !figli.length && <p style={{ color: 'var(--mute)', margin: '4px 0 18px' }}>Qui non c'è ancora niente.</p>}
    </>
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', background: 'var(--bg)' }}>
      {h.alberoAperto && <Albero />}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 22px', borderBottom: '1px solid var(--line2)', background: 'var(--bg)' }}>
          {!h.alberoAperto && <button type="button" className="hd-b" aria-label="Mostra l'albero" title="Mostra l'albero" onClick={() => h.imposta({ alberoAperto: true })}><Icona nome="menu" size={16} /></button>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', minWidth: 0 }}>
            {!radice && (
              <button type="button" className="hd-b" aria-label="Torna alla cartella precedente" title="Indietro" onClick={() => h.vai(antenati(attuale!.rel).slice(-1)[0] ?? '')}><Icona nome="sx" size={16} /></button>
            )}
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attuale ? attuale.nome : 'Home'}</h1>
          </div>
          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 11, color: 'var(--mute)', display: 'inline-flex' }}><Icona nome="cerca" size={15} /></span>
            <input className="inp" type="search" aria-label="Cerca in tutte le materie" placeholder="Cerca in tutte le materie" value={h.query} onChange={(e) => h.imposta({ query: e.target.value })} style={{ width: 250, height: 36, borderRadius: 18, paddingLeft: 34, fontSize: 13.5 }} />
          </label>
          {!radice && !risultati && (
            <>
              <div role="group" aria-label="Vista" className="hd-seg" style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                <button type="button" className={'hd-b' + (h.vista === 'griglia' ? ' on' : '')} style={{ border: 0, borderRadius: 0 }} aria-pressed={h.vista === 'griglia'} onClick={() => h.imposta({ vista: 'griglia' })}><Con i="griglia">Griglia</Con></button>
                <button type="button" className={'hd-b' + (h.vista === 'elenco' ? ' on' : '')} style={{ border: 0, borderRadius: 0 }} aria-pressed={h.vista === 'elenco'} onClick={() => h.imposta({ vista: 'elenco' })}><Con i="elenco">Elenco</Con></button>
              </div>
              <select className="inp" style={{ width: 'auto', height: 36, fontSize: 13 }} aria-label="Ordina" value={h.ordina} onChange={(e) => h.imposta({ ordina: e.target.value as 'nome' | 'recente' })}>
                <option value="nome">Ordina per nome</option>
                <option value="recente">Più recenti prima</option>
              </select>
            </>
          )}
          <div style={{ position: 'relative' }}>
            <button type="button" className="hd-b on" aria-haspopup="menu" aria-expanded={menuNuovo} onClick={() => setMenuNuovo((v) => !v)}><Con i="piu">Nuovo</Con></button>
            {menuNuovo && (
              <div role="menu" className="pop" style={{ left: 'auto', right: 0, width: 210, padding: 6 }} onMouseLeave={() => setMenuNuovo(false)}>
                <button role="menuitem" type="button" className="alb-r" style={{ minHeight: 38 }} onClick={() => { setMenuNuovo(false); setDlg({ tipo: 'nuova', padre: '', materia: true }) }}><Icona nome="libro" size={15} /> Nuova materia</button>
                <button role="menuitem" type="button" className="alb-r" style={{ minHeight: 38, opacity: attuale && attuale.tipo !== 'autore' && attuale.rel !== 'italiano/autori' ? 1 : 0.45 }} disabled={!attuale || attuale.tipo === 'autore' || attuale.rel === 'italiano/autori'} onClick={() => { setMenuNuovo(false); if (attuale) setDlg({ tipo: 'nuova', padre: attuale.rel, materia: false }) }}><Icona nome="cartella" size={15} /> Nuova cartella qui</button>
                <button role="menuitem" type="button" className="alb-r" style={{ minHeight: 38, opacity: attuale?.tipo === 'autore' ? 1 : 0.45 }} disabled={attuale?.tipo !== 'autore'} onClick={() => { setMenuNuovo(false); void nuovoTesto() }}><Icona nome="testo" size={15} /> Nuovo testo qui</button>
              </div>
            )}
          </div>
        </div>
        <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '20px 22px 40px' }} onMouseDown={(e) => { if (e.target === e.currentTarget && h.sel) h.imposta({ sel: null }) }}>
          {contenuto}
        </div>
      </main>
      {sel && <Dettagli n={sel} azioni={{ rinomina: () => setDlg({ tipo: 'rinomina', n: sel }), archivia: () => setDlg({ tipo: 'archivia', n: sel }) }} />}
      {dlg?.tipo === 'nuova' && (
        <ChiediNome titolo={dlg.materia ? 'Nuova materia' : 'Nuova cartella'} etichetta="Nome" iniziale="" conferma="Crea" chiudi={() => setDlg(null)} fai={async (nome) => {
          const rel = await dopo(window.api.creaNodo(dlg.padre, nome))
          if (rel) { useHome.getState().imposta({ espansi: { ...useHome.getState().espansi, ...(dlg.padre ? { [dlg.padre]: true } : {}) } }); useHome.getState().vai(rel) }
        }} />
      )}
      {dlg?.tipo === 'rinomina' && (
        <ChiediNome titolo="Rinomina" etichetta="Nuovo nome" iniziale={dlg.n.nome} conferma="Rinomina" chiudi={() => setDlg(null)} fai={async (nome) => {
          const vecchio = dlg.n
          const rel = await dopo(window.api.rinominaNodo(vecchio.rel, nome))
          const s = useHome.getState()
          // se una cartella cambia nome, i riferimenti che la contengono (percorso, preferiti, recenti) la seguono
          if (rel && rel !== vecchio.rel) {
            const cambia = (r: string): string => (r === vecchio.rel || r.startsWith(vecchio.rel + '/') ? rel + r.slice(vecchio.rel.length) : r)
            s.imposta({ percorso: cambia(s.percorso), sel: cambia(s.sel ?? vecchio.rel), preferiti: s.preferiti.map(cambia), recenti: s.recenti.map((x) => ({ ...x, rel: cambia(x.rel) })), espansi: Object.fromEntries(Object.entries(s.espansi).map(([k, v]) => [cambia(k), v])) })
            await s.carica()
          }
          if (vecchio.tipo === 'situazioni') s.chiudiScheda(idScheda(vecchio))
          // il titolo scritto nelle schede aperte si aggiorna
          const nuovo = nome.trim().replace(/\s+/g, ' ')
          useHome.setState({ tabs: useHome.getState().tabs.map((t) => (vecchio.tipo === 'testo' && t.testoId === vecchio.testoId && t.autoreId === vecchio.autoreId) || (vecchio.tipo === 'autore' && t.tipo === 'mappa' && t.autoreId === vecchio.autoreId) ? { ...t, titolo: nuovo } : t) })
        }} />
      )}
      {dlg?.tipo === 'archivia' && (
        <Archivia n={dlg.n} chiudi={() => setDlg(null)} fai={async () => {
          const n = dlg.n
          await dopo(window.api.archiviaNodo(n.rel))
          useHome.getState().imposta({ sel: null })
          useStore.getState().mostraToast(`«${n.nome}» è in 99_Archivio.`)
        }} />
      )}
    </div>
  )
}
