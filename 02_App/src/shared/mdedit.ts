// Azioni della barra di formattazione degli appunti: funzioni pure su (testo, selezione) → nuovo testo e selezione.

export type AzioneMd = 'h1' | 'h2' | 'h3' | 'grassetto' | 'corsivo' | 'codice' | 'blocco' | 'link' | 'elenco' | 'numerato' | 'citazione' | 'tabella' | 'riga'
export interface Sel { testo: string; a: number; b: number }

const inizioRiga = (t: string, i: number): number => t.lastIndexOf('\n', i - 1) + 1
const fineRiga = (t: string, i: number): number => {
  const k = t.indexOf('\n', i)
  return k < 0 ? t.length : k
}

function avvolgi(s: Sel, m: string, ph: string): Sel {
  const { testo: t, a, b } = s
  const sel = t.slice(a, b)
  if (t.slice(a - m.length, a) === m && t.slice(b, b + m.length) === m) {
    return { testo: t.slice(0, a - m.length) + sel + t.slice(b + m.length), a: a - m.length, b: b - m.length }
  }
  if (sel.length >= 2 * m.length && sel.startsWith(m) && sel.endsWith(m)) {
    const dentro = sel.slice(m.length, sel.length - m.length)
    return { testo: t.slice(0, a) + dentro + t.slice(b), a, b: a + dentro.length }
  }
  const x = sel || ph
  return { testo: t.slice(0, a) + m + x + m + t.slice(b), a: a + m.length, b: a + m.length + x.length }
}

function perRighe(s: Sel, fn: (righe: string[]) => string[]): Sel {
  const a = inizioRiga(s.testo, s.a)
  const b = fineRiga(s.testo, s.b > s.a && s.testo[s.b - 1] === '\n' ? s.b - 1 : s.b)
  const nuove = fn(s.testo.slice(a, b).split('\n')).join('\n')
  return { testo: s.testo.slice(0, a) + nuove + s.testo.slice(b), a, b: a + nuove.length }
}

const titolo = (n: number) => (s: Sel): Sel =>
  perRighe(s, (r) => {
    const gia = r.every((x) => new RegExp(`^#{${n}} `).test(x))
    return r.map((x) => {
      const nudo = x.replace(/^#{1,6}\s+/, '')
      return gia ? nudo : '#'.repeat(n) + ' ' + nudo
    })
  })

export function applica(s: Sel, azione: AzioneMd): Sel {
  switch (azione) {
    case 'h1': return titolo(1)(s)
    case 'h2': return titolo(2)(s)
    case 'h3': return titolo(3)(s)
    case 'grassetto': return avvolgi(s, '**', 'grassetto')
    case 'corsivo': return avvolgi(s, '*', 'corsivo')
    case 'codice': return avvolgi(s, '`', 'codice')
    case 'elenco':
      return perRighe(s, (r) => {
        const gia = r.every((x) => /^\s*[-*] /.test(x))
        return r.map((x) => (gia ? x.replace(/^(\s*)[-*] /, '$1') : '- ' + x.replace(/^\s*(?:[-*]|\d+\.) /, '')))
      })
    case 'numerato':
      return perRighe(s, (r) => {
        const gia = r.every((x) => /^\s*\d+\. /.test(x))
        return r.map((x, i) => (gia ? x.replace(/^(\s*)\d+\. /, '$1') : `${i + 1}. ` + x.replace(/^\s*(?:[-*]|\d+\.) /, '')))
      })
    case 'citazione':
      return perRighe(s, (r) => {
        const gia = r.every((x) => /^> ?/.test(x))
        return r.map((x) => (gia ? x.replace(/^> ?/, '') : '> ' + x))
      })
    case 'blocco': {
      const sel = s.testo.slice(s.a, s.b) || 'codice'
      const pre = s.a === 0 || s.testo[s.a - 1] === '\n' ? '' : '\n'
      const ins = `${pre}\`\`\`\n${sel}\n\`\`\`\n`
      const da = s.a + pre.length + 4
      return { testo: s.testo.slice(0, s.a) + ins + s.testo.slice(s.b), a: da, b: da + sel.length }
    }
    case 'link': {
      const sel = s.testo.slice(s.a, s.b) || 'testo'
      const url = 'indirizzo'
      const ins = `[${sel}](${url})`
      const da = s.a + sel.length + 3
      return { testo: s.testo.slice(0, s.a) + ins + s.testo.slice(s.b), a: da, b: da + url.length }
    }
    case 'tabella': {
      const pre = s.a === 0 || s.testo[s.a - 1] === '\n' ? '' : '\n\n'
      const ins = `${pre}| Colonna 1 | Colonna 2 |\n| --- | --- |\n| | |\n`
      return { testo: s.testo.slice(0, s.a) + ins + s.testo.slice(s.b), a: s.a + pre.length + 2, b: s.a + pre.length + 11 }
    }
    case 'riga': {
      const pre = s.a === 0 || s.testo[s.a - 1] === '\n' ? '' : '\n'
      const ins = `${pre}\n---\n\n`
      return { testo: s.testo.slice(0, s.a) + ins + s.testo.slice(s.b), a: s.a + ins.length, b: s.a + ins.length }
    }
  }
}
