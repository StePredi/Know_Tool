import { useEffect, useMemo, useState } from 'react'
import { SEZIONI_ANALISI } from '@shared/proposta'
import type { SezioneProposta } from '@shared/types'
import { useStore } from '../store'
import { Con, Icona } from '../componenti/Icona'
import { useEditor } from './stato'
import { useTesto } from './dati'
import { richiestaPerClaude, type OpzioniRichiesta } from './richiesta'
import { Modale, primario, secondario, lbl } from './ui'

const NOMI: Record<SezioneProposta, string> = { riassunto: 'Riassunto', struttura: 'Struttura e metrica', contesto: 'Contesto', citazioni: 'Citazioni chiave', domande: 'Domande', temi: 'Temi' }

async function copia(testo: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    const a = document.createElement('textarea')
    a.value = testo
    document.body.appendChild(a)
    a.select()
    const ok = document.execCommand('copy')
    a.remove()
    return ok
  }
}

/** «Scheda riassuntiva»: 1) la richiesta da dare a Claude, 2) la proposta di Claude da confermare sezione per sezione. */
export function SchedaRiassuntiva() {
  const d = useTesto()
  const m = useStore((s) => s.modello)!
  const ed = useEditor()
  const [opz, setOpz] = useState<OpzioniRichiesta>({ contesto: true, citazioni: true, domande: true })
  const [occ, setOcc] = useState(false)
  const testo = d?.testo
  const p = testo?.proposta && !testo.proposta.errore ? testo.proposta : null
  const scheda = testo?.scheda ? m.schede.find((s) => s.id === testo.scheda) : undefined
  const chiudi = (): void => ed.imposta({ riasOpen: false })

  // attuale (della scheda) e proposto, per ogni sezione
  const righe = useMemo(() => {
    if (!p) return []
    const ora = (k: SezioneProposta): string => {
      if (!scheda) return ''
      if (k === 'temi') return scheda.temi.map((t) => m.temi.find((x) => x.id === t)?.nome ?? t).join(', ')
      return scheda[k]
    }
    const prop = (k: SezioneProposta): string => (k === 'temi' ? [...new Set([...(scheda?.temi ?? []), ...p.temi])].map((t) => m.temi.find((x) => x.id === t)?.nome ?? t).join(', ') : p.sezioni[k])
    return ([...SEZIONI_ANALISI.map((s) => s.k), 'temi'] as SezioneProposta[])
      .map((k) => ({ k, ora: ora(k), prop: prop(k) }))
      .filter((r) => r.prop.trim())
      .map((r) => ({ ...r, stato: r.ora.trim() === '' ? ('nuova' as const) : r.ora.trim() === r.prop.trim() ? ('uguale' as const) : ('cambiata' as const) }))
  }, [p, scheda, m.temi])

  const chiave = p ? JSON.stringify([p.sezioni, p.temi, scheda?.id]) : ''
  const [scelte, setScelte] = useState<Set<SezioneProposta>>(new Set())
  // di default si selezionano le sezioni nuove; quelle che sovrascrivono testo già scritto restano da scegliere
  useEffect(() => {
    setScelte(new Set(righe.filter((r) => r.stato === 'nuova').map((r) => r.k)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave])

  const [nuova, setNuova] = useState({ corsia: '', data: '', titolo_breve: '' })
  useEffect(() => {
    if (!p || !testo) return
    setNuova({ corsia: p.corsia ?? m.autore.corsie[0]!.id, data: p.data || testo.anno || '', titolo_breve: p.titolo_breve || testo.titolo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave])

  if (!d || !testo) return null
  const richiesta = richiestaPerClaude(m, testo, opz)
  const nSel = [...scelte].filter((k) => righe.some((r) => r.k === k && r.stato !== 'uguale')).length
  const puoApplicare = !!p && (scheda ? nSel > 0 : !!nuova.corsia) && !occ

  const casella = (chiaveOp: keyof OpzioniRichiesta, nome: string): React.ReactNode => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <input type="checkbox" checked={opz[chiaveOp]} onChange={(e) => setOpz({ ...opz, [chiaveOp]: e.target.checked })} />
      {nome}
    </label>
  )

  return (
    <Modale
      titolo="Scheda riassuntiva"
      larghezza={860}
      chiudi={chiudi}
      corpoStyle={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}
      intestazione={
        <>
          <Icona nome="carte" size={18} />
          <strong style={{ flex: 1, fontSize: 13.5 }}>Scheda riassuntiva · {testo.titolo}</strong>
          <button type="button" className="hv" onClick={chiudi} aria-label="Chiudi" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Icona nome="chiudi" size={14} /></button>
        </>
      }
      piede={
        <>
          {p && (
            <button
              type="button"
              className="hv"
              disabled={occ}
              style={{ ...secondario, color: 'var(--err-ink)', borderColor: 'var(--err-line)', background: 'var(--err-bg)' }}
              onClick={async () => {
                setOcc(true)
                try {
                  useStore.getState().applica(await window.api.scartaProposta(testo.id))
                  useStore.getState().mostraToast('Proposta scartata · salvata in 99_Archivio/proposte_scartate')
                } catch (e) {
                  useStore.getState().mostraToast((e as Error).message)
                }
                setOcc(false)
              }}
            >
              <Con i="cartella" size={14}>Scarta la proposta</Con>
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="hv" onClick={chiudi} style={secondario}><Con i="chiudi" size={13}>Chiudi</Con></button>
          {p && (
            <button
              type="button"
              className="hvp"
              disabled={!puoApplicare}
              style={{ ...primario, opacity: puoApplicare ? 1 : 0.45, cursor: puoApplicare ? 'pointer' : 'not-allowed' }}
              onClick={async () => {
                setOcc(true)
                try {
                  const sezioni = [...scelte].filter((k) => righe.some((r) => r.k === k && r.stato !== 'uguale'))
                  const r = await window.api.applicaProposta(testo.id, { sezioni, ...(scheda ? {} : { nuova }) })
                  useStore.getState().applica(r.modello)
                  useStore.getState().mostraToast(r.creata ? 'Scheda creata e collegata al testo' : 'Scheda aggiornata')
                  useStore.getState().imposta({ selId: r.schedaId })
                  chiudi()
                } catch (e) {
                  useStore.getState().mostraToast((e as Error).message)
                }
                setOcc(false)
              }}
            >
              <Con i="spunta" size={14}>{scheda ? `Applica ${nSel} ${nSel === 1 ? 'sezione' : 'sezioni'}` : 'Crea la scheda'}</Con>
            </button>
          )}
        </>
      }
    >
      {/* 2 · proposta */}
      {p ? (
        <section aria-label="Proposta di Claude" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...lbl, color: 'var(--par)' }}>Proposta pronta{p.generata ? ` · ${p.generata}` : ''}</span>
            <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{scheda ? `Confrontata con la scheda «${scheda.titolo_breve}». Spunta le sezioni da applicare.` : 'Il testo non ha ancora una scheda: ne creo una nuova.'}</span>
          </div>
          {p.avvisi.length > 0 && (
            <div role="note" className="note" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {p.avvisi.map((a, i) => <span key={i}>{a}</span>)}
            </div>
          )}
          {!scheda && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <label className="lbl">Categoria
                <select className="inp big" value={nuova.corsia} onChange={(e) => setNuova({ ...nuova, corsia: e.target.value })}>
                  {m.autore.corsie.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="lbl">Data
                <input className="inp big" value={nuova.data} placeholder="1819" onChange={(e) => setNuova({ ...nuova, data: e.target.value })} />
              </label>
              <label className="lbl">Nome sulla card
                <input className="inp big" value={nuova.titolo_breve} onChange={(e) => setNuova({ ...nuova, titolo_breve: e.target.value })} />
              </label>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 130px 1fr 1fr', gap: 10, padding: '7px 12px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--mute)' }}>
              <span /><span>Sezione</span><span>Ora nella scheda</span><span>Proposta</span>
            </div>
            {righe.map((r) => {
              const off = r.stato === 'uguale'
              const forzata = !scheda && r.k === 'riassunto'
              const on = forzata || (scelte.has(r.k) && !off)
              return (
                <label key={r.k} style={{ display: 'grid', gridTemplateColumns: '28px 130px 1fr 1fr', gap: 10, padding: '10px 12px', borderTop: '1px solid var(--line2)', alignItems: 'start', cursor: off || forzata ? 'default' : 'pointer', opacity: off ? 0.55 : 1, background: on ? 'var(--par-bg)' : 'transparent', transition: 'background-color .14s' }}>
                  <input type="checkbox" disabled={off || forzata} checked={on} onChange={(e) => { const n = new Set(scelte); if (e.target.checked) n.add(r.k); else n.delete(r.k); setScelte(n) }} style={{ marginTop: 3 }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <b style={{ fontSize: 13 }}>{NOMI[r.k]}</b>
                    <span className="chip soft" style={{ padding: '1px 8px', fontSize: 11, alignSelf: 'flex-start', ...(r.stato === 'nuova' ? { color: 'var(--par)', borderColor: 'var(--par)' } : r.stato === 'cambiata' ? { color: 'var(--warn-ink)', borderColor: 'var(--warn-line)' } : {}) }}>{r.stato === 'uguale' ? 'uguale' : r.stato}</span>
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--mute)', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 150, overflow: 'auto' }}>{r.ora || '—'}</span>
                  <span style={{ fontSize: 12.5, whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 150, overflow: 'auto' }}>
                    {r.k === 'citazioni' && p.citazioniNonTrovate.length > 0
                      ? r.prop.split('\n').map((riga, i) => {
                          const manca = p.citazioniNonTrovate.some((c) => riga.includes(c))
                          return <span key={i} style={manca ? { background: 'var(--warn-bg)', color: 'var(--warn-ink)' } : undefined}>{riga}{'\n'}</span>
                        })
                      : r.prop}
                  </span>
                </label>
              )
            })}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)' }}>Le parole chiave non si riscrivono: la scheda le prende dalle tue annotazioni.</p>
        </section>
      ) : (
        <section aria-label="Proposta di Claude" style={{ border: '1px dashed var(--line)', borderRadius: 12, padding: '14px 16px', color: 'var(--mute)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icona nome="orologio" size={18} />
          {testo.proposta?.errore ? testo.proposta.errore : 'Nessuna proposta ancora. Quando Claude scrive proposta_scheda.md compare qui da sola.'}
        </section>
      )}

      {/* 1 · richiesta */}
      <section aria-label="Richiesta a Claude" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <span style={lbl}>{p ? 'Chiedi una nuova proposta' : '1 · Chiedi a Claude'}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600 }}>Sempre: riassunto e struttura/metrica. In più:</span>
          {casella('contesto', 'Contesto')}
          {casella('citazioni', 'Citazioni chiave')}
          {casella('domande', 'Domande')}
        </div>
        <textarea readOnly aria-label="Richiesta da incollare a Claude" value={richiesta} style={{ minHeight: p ? 90 : 170, resize: 'vertical', border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 9, padding: '9px 11px', fontSize: 12, lineHeight: 1.5, fontFamily: 'ui-monospace, Consolas, monospace' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="hvp" style={primario} onClick={async () => useStore.getState().mostraToast((await copia(richiesta)) ? 'Richiesta copiata: incollala a Claude' : 'Non sono riuscito a copiare: selezionala e copiala a mano')}>
            <Con i="incolla" size={14}>Copia la richiesta</Con>
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>Incollala a Claude nella cartella Know_Tool. Non tocca la scheda: prepara solo la proposta.</span>
        </div>
      </section>
    </Modale>
  )
}
