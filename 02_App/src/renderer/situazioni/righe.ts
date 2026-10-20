/** Un blocco di codice (anche su più righe): il rientro comune (che dà il margine) e quello relativo di ogni riga. */
export function righeCodice(codice: string): { ind: number; righe: { rel: number; t: string }[] } {
  const ls = codice.replace(/^\n+/, '').trimEnd().split('\n')
  const rient = ls.map((l) => l.match(/^ */)![0].length)
  const m = Math.min(...ls.map((l, i) => (l.trim() ? rient[i]! : Infinity)))
  const base = Number.isFinite(m) ? m : 0
  return { ind: base, righe: ls.map((l, i) => ({ rel: l.trim() ? rient[i]! - base : 0, t: l.trim() })) }
}

/** Il codice di una riga da copiare: il rientro a sinistra conta (in Python cambia il significato), si tolgono solo gli spazi a destra. */
export function codiceDaCopiare(codice: string): string {
  return codice.replace(/^\n+/, '').trimEnd()
}
