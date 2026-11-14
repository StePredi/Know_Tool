// **grassetto** e *corsivo* dentro i testi, come negli appunti .md.
// Un asterisco vero si scrive con la barra: \*  (per esempio «tutti i file \*.md»).
export interface PezzoEnfasi {
  t: 'testo' | 'b' | 'i'
  v: string
}

const senzaBarra = (s: string): string => s.replace(/\\\*/g, '*')

export function pezziEnfasi(s: string): PezzoEnfasi[] {
  const out: PezzoEnfasi[] = []
  const re = /(?<!\\)\*\*(.+?)(?<!\\)\*\*|(?<!\\)\*(.+?)(?<!\\)\*/g
  let ultimo = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    if (m.index > ultimo) out.push({ t: 'testo', v: senzaBarra(s.slice(ultimo, m.index)) })
    out.push(m[1] !== undefined ? { t: 'b', v: senzaBarra(m[1]) } : { t: 'i', v: senzaBarra(m[2]!) })
    ultimo = re.lastIndex
  }
  if (ultimo < s.length) out.push({ t: 'testo', v: senzaBarra(s.slice(ultimo)) })
  return out
}
