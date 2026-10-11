import { citaDa } from '@shared/testo'
import type { Annotazione, Evidenzia } from '@shared/types'
import { useEditor } from './stato'
import { correnteDi, eliminaVoce, rigaDi, scriviCampoAnnotazione, useTesto } from './dati'
import { nuovaParafrasi, nuovaParafrasiLibera, toggleFlag, toggleHl } from './azioni'
import { Area, Kbd, lbl } from './ui'
import { Con, Icona, type NomeIcona } from '../componenti/Icona'

const HL: Record<Evidenzia, string> = { concetto: 'var(--hl-c)', definizione: 'var(--hl-d)', dubbio: 'var(--hl-u)' }

type Flag = 'sottolinea' | 'parola_chiave' | 'flashcard'
const MARCHE: { f: Flag; nome: string; icona: NomeIcona; key: string; titolo: string }[] = [
  { f: 'sottolinea', nome: 'Sottolineatura', icona: 'sottolinea', key: 'S', titolo: 'Sottolinea la selezione (tasto S)' },
  { f: 'parola_chiave', nome: 'Parola chiave', icona: 'stella', key: 'K', titolo: 'Segna come parola chiave (tasto K)' },
  { f: 'flashcard', nome: 'Flashcard', icona: 'carte', key: 'F', titolo: 'Crea una flashcard da questo intervallo (tasto F)' }
]
const EVID: { k: Evidenzia; nome: string; key: string }[] = [
  { k: 'concetto', nome: 'Concetto', key: '1' },
  { k: 'definizione', nome: 'Definizione', key: '2' },
  { k: 'dubbio', nome: 'Dubbio', key: '3' }
]

const stato = (on: boolean): React.CSSProperties => (on ? { border: '1px solid var(--ink)', background: 'var(--surface2)' } : { border: '1px solid var(--line)', background: 'var(--surface)' })

export function BarraStrumenti() {
  const d = useTesto()!
  const ed = useEditor()
  const { testo, tk } = d
  const sel = ed.sel
  const noSel = !sel
  const cur = correnteDi(testo, sel)
  const conta = (fn: (a: Annotazione) => boolean): number => testo.annotazioni.filter(fn).length
  const cursor = noSel ? 'not-allowed' : 'pointer'
  const op = noSel ? 0.45 : 1
  const citato = sel ? citaDa(testo.corpo, tk.token, sel) : ''
  const fig = cur?.figura ? d.modello.figure.find((f) => f.id === cur.figura) : null

  if (!ed.leftPin) {
    const voci: { titolo: string; swatch: string; icona: NomeIcona; on: boolean; n: number; click: () => void }[] = [
      ...EVID.map((e) => ({ titolo: e.nome, swatch: HL[e.k], icona: 'evidenzia' as NomeIcona, on: cur?.evidenzia === e.k, n: conta((a) => a.evidenzia === e.k), click: () => toggleHl(e.k) })),
      ...MARCHE.map((m) => ({ titolo: m.nome, swatch: 'transparent', icona: m.icona, on: !!cur?.[m.f], n: conta((a) => a[m.f]), click: () => toggleFlag(m.f) }))
    ]
    return (
      <aside aria-label="Strumenti ridotti" style={{ position: 'absolute', left: 16, top: 16, zIndex: 30, width: 60, border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', boxShadow: '0 12px 30px rgba(8,12,18,.16)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, animation: 'dcFade .14s ease-out' }}>
        <button type="button" className="hv" onClick={() => ed.imposta({ leftPin: true })} title="Apri gli strumenti" aria-label="Apri gli strumenti" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 10, height: 36, fontSize: 14, fontWeight: 700, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icona nome="menu" size={17} /></button>
        <span style={{ height: 1, background: 'var(--line2)' }} />
        {voci.map((r) => (
          <button key={r.titolo} type="button" disabled={noSel} aria-pressed={r.on} title={`${r.titolo} · ${r.n} nel testo`} aria-label={`${r.titolo} · ${r.n} nel testo`} onClick={r.click} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, ...stato(r.on), borderRadius: 10, fontSize: 13, fontWeight: 700, cursor, opacity: op, lineHeight: 1 }}>
            <span aria-hidden style={{ width: 18, height: 18, borderRadius: 5, border: `1px solid ${r.swatch === 'transparent' ? 'transparent' : 'var(--line)'}`, background: r.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink)', lineHeight: 1 }}>{r.icona ? <Icona nome={r.icona} size={r.swatch === 'transparent' ? 16 : 11} /> : null}</span>
            <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 9.5, fontWeight: 700, color: 'var(--mute)', lineHeight: 1 }}>{r.n || ''}</span>
          </button>
        ))}
        <span style={{ height: 1, background: 'var(--line2)' }} />
        <div title="Annotazioni sul testo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{testo.annotazioni.length}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: 'var(--mute)', lineHeight: 1 }}>NOTE</span>
        </div>
      </aside>
    )
  }

  const bottone = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, ...stato(on), borderRadius: 9, padding: '0 12px', fontSize: 13, fontWeight: 700, cursor, opacity: op, textAlign: 'left' })

  return (
    <aside aria-label="Strumenti di annotazione" style={{ position: 'absolute', left: 16, top: 16, bottom: 16, zIndex: 30, width: 258, border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', boxShadow: '0 12px 30px rgba(8,12,18,.16)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'dcFade .14s ease-out' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px 9px', borderBottom: '1px solid var(--line2)' }}>
        <strong style={{ flex: 1, ...lbl }}>Strumenti</strong>
        <button type="button" className="hv" onClick={() => ed.imposta({ leftPin: false })} title="Riduci gli strumenti" aria-label="Riduci gli strumenti" style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, width: 28, height: 28, fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icona nome="riduci" size={15} /></button>
      </div>
      <div className="ed-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ border: `1px solid ${sel ? 'var(--focus)' : 'var(--line2)'}`, background: sel ? 'var(--surface2)' : 'var(--bg)', borderRadius: 11, padding: '10px 11px' }}>
          <div style={{ ...lbl, marginBottom: 4 }}>Selezione</div>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, wordBreak: 'break-word' }}>{sel ? `«${citato}»` : 'Nessuna selezione'}</div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 3 }}>{sel ? `${rigaDi(tk, testo.layout, sel)} · parole ${sel[0]}–${sel[1]}` : 'Clicca una parola nel testo per iniziare'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={lbl}>Evidenziatori</div>
          {EVID.map((e) => {
            const on = cur?.evidenzia === e.k
            const n = conta((a) => a.evidenzia === e.k)
            return (
              <button key={e.k} type="button" disabled={noSel} aria-pressed={on} title={`Evidenzia ${e.nome.toLowerCase()} (tasto ${e.key}) · ${n} nel testo`} onClick={() => toggleHl(e.k)} style={bottone(on)}>
                <span aria-hidden style={{ flex: 'none', width: 17, height: 17, borderRadius: 5, border: '1px solid var(--line)', background: HL[e.k] }} />
                <span style={{ flex: 1 }}>{e.nome}</span>
                <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 700, color: 'var(--mute)' }}>{n || ''}</span>
                <Kbd k={e.key} />
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={lbl}>Marcature</div>
          {MARCHE.map((m) => {
            const on = !!cur?.[m.f]
            const n = conta((a) => a[m.f])
            return (
              <button key={m.f} type="button" disabled={noSel} aria-pressed={on} title={m.titolo} onClick={() => toggleFlag(m.f)} style={bottone(on)}>
                <span aria-hidden style={{ flex: 'none', width: 17, display: 'flex', justifyContent: 'center' }}><Icona nome={m.icona} size={16} /></span>
                <span style={{ flex: 1 }}>{m.nome}</span>
                <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 700, color: 'var(--mute)' }}>{n || ''}</span>
                <Kbd k={m.key} />
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <div style={lbl}>Nota</div>
            <Kbd k="N" />
          </div>
          <Area label="Nota sul passo selezionato" disabled={noSel} placeholder={noSel ? 'Seleziona delle parole' : 'Scrivi una nota su questa selezione…'} valore={cur?.nota ?? ''} salva={(v) => sel && void scriviCampoAnnotazione(testo, sel, citato, { nota: v })} style={{ minHeight: 92, borderRadius: 9, padding: '9px 10px', fontSize: 12.5, lineHeight: 1.5, opacity: op }} />
          <button type="button" disabled={noSel} onClick={() => ed.imposta({ figOpen: true, figQ: '', figPrev: cur?.figura || 'metafora', figTarget: cur ? cur.id : null })} style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 40, border: `1px solid ${fig ? 'var(--ed)' : 'var(--line)'}`, background: fig ? 'var(--ed-bg)' : 'var(--surface)', color: fig ? 'var(--ed)' : 'var(--ink)', borderRadius: 9, padding: '0 12px', fontSize: 13, fontWeight: 700, cursor, opacity: op, textAlign: 'left' }}>
            <span aria-hidden style={{ flex: 'none', width: 17, display: 'flex', justifyContent: 'center' }}><Icona nome="figura" size={16} /></span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fig ? fig.nome : 'Figura retorica…'}</span>
            <span aria-hidden style={{ color: 'var(--mute)', display: 'flex' }}><Icona nome="dx" size={14} /></span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={lbl}>Parafrasi</div>
          <button type="button" className="hv" disabled={noSel} onClick={() => void nuovaParafrasi()} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '0 12px', fontSize: 13, fontWeight: 700, cursor, opacity: op, textAlign: 'left' }}>
            <span aria-hidden style={{ flex: 'none', width: 17, display: 'flex', justifyContent: 'center', color: 'var(--par)' }}><Icona nome="parafrasi" size={16} /></span>
            <span style={{ flex: 1 }}>Sulla selezione</span>
            <Kbd k="P" />
          </button>
          <button type="button" className="hvi" onClick={() => void nuovaParafrasiLibera()} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, border: '1px dashed var(--line)', background: 'transparent', borderRadius: 9, padding: '0 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left', color: 'var(--mute)' }}>
            <span aria-hidden style={{ flex: 'none', width: 17, display: 'flex', justifyContent: 'center' }}><Icona nome="piu" size={16} /></span>
            <span style={{ flex: 1 }}>Libera</span>
          </button>
        </div>

        {cur && (
          <button type="button" className="hvi" onClick={() => void eliminaVoce(testo.id, 'annotazioni', cur.id)} style={{ alignSelf: 'flex-start', border: '1px solid var(--line)', background: 'transparent', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--mute)' }}><Con i="cestino" size={14}>Elimina questa annotazione</Con></button>
        )}
      </div>
    </aside>
  )
}
