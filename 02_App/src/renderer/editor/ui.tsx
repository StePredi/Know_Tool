import type { CSSProperties, Ref } from 'react'
import { usaBozza } from '../utili'

export const lbl: CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--mute)' }

export const Kbd = ({ k }: { k: string }) => (
  <kbd style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--mute)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px', background: 'var(--bg)' }}>{k}</kbd>
)

/** Pulsante quadrato con un segno (icona SVG). */
export function Quadro(props: { onClick: () => void; label: string; children: React.ReactNode; size?: number; disabled?: boolean; style?: CSSProperties }) {
  const s = props.size ?? 28
  return (
    <button type="button" className="hvi" disabled={props.disabled} onClick={props.onClick} aria-label={props.label} title={props.label} style={{ flex: 'none', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 7, width: s, height: s, fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1, color: 'var(--mute)', ...props.style }}>
      {props.children}
    </button>
  )
}

export const primario: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid var(--focus)', background: 'var(--focus)', color: 'var(--surface)', borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }
export const secondario: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }
export const tratteggiato: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)', borderRadius: 9, padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }

/** Area di testo a scrittura immediata (copia locale, salva dopo una pausa e quando si esce dal campo). */
export function Area(props: { valore: string; salva: (v: string) => void; placeholder?: string; disabled?: boolean; label?: string; style?: CSSProperties; innerRef?: Ref<HTMLTextAreaElement>; spellcheck?: boolean }) {
  const b = usaBozza(props.valore, props.salva)
  return (
    <textarea ref={props.innerRef} aria-label={props.label} disabled={props.disabled} placeholder={props.placeholder} spellCheck={props.spellcheck} value={b.value} onChange={(e) => b.onChange(e.target.value)} onFocus={b.onFocus} onBlur={b.onBlur} style={{ width: '100%', resize: 'vertical', border: '1px solid var(--line)', background: 'var(--bg)', outlineOffset: -2, ...props.style }} />
  )
}

export function Riga(props: { valore: string; salva: (v: string) => void; placeholder?: string; label?: string; style?: CSSProperties }) {
  const b = usaBozza(props.valore, props.salva)
  return (
    <input type="text" aria-label={props.label} placeholder={props.placeholder} value={b.value} onChange={(e) => b.onChange(e.target.value)} onFocus={b.onFocus} onBlur={b.onBlur} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} style={{ width: '100%', border: '1px solid var(--line)', background: 'var(--bg)', outlineOffset: -2, ...props.style }} />
  )
}

/** Cornice di una finestra modale come nel prototipo: velo, scheda con angoli a 18, intestazione, corpo che scorre, piede. */
export function Modale(props: { titolo: string; z?: number; larghezza: number; altezza?: number; intestazione: React.ReactNode; piede?: React.ReactNode; children: React.ReactNode; scorri?: boolean; corpoStyle?: CSSProperties; chiudi: () => void; raggio?: number }) {
  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && props.chiudi()} style={{ position: 'fixed', inset: 0, zIndex: props.z ?? 80, background: 'rgba(8,12,18,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, animation: 'dcFade .12s ease-out' }}>
      <div role="dialog" aria-label={props.titolo} style={{ width: `min(${props.larghezza}px,100%)`, maxHeight: `min(88vh,${props.altezza ?? 860}px)`, display: 'flex', flexDirection: 'column', border: '1px solid var(--line)', borderRadius: props.raggio ?? 18, background: 'var(--surface)', boxShadow: '0 28px 70px rgba(0,0,0,.4)', overflow: 'hidden', animation: 'dcUp .16s ease-out' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--line2)' }}>{props.intestazione}</div>
        <div className={props.scorri === false ? undefined : 'ed-scroll'} style={{ flex: 1, minHeight: 0, ...(props.scorri === false ? {} : { overflowY: 'auto', overflowX: 'hidden' }), ...props.corpoStyle }}>{props.children}</div>
        {props.piede && <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--line2)', whiteSpace: 'nowrap' }}>{props.piede}</div>}
      </div>
    </div>
  )
}
