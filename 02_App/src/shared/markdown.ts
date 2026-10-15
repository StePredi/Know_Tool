// Un lettore di Markdown piccolo e prevedibile, per gli appunti della sessione di studio.
// Capisce: titoli, paragrafi, elenchi (anche annidati), tabelle, blocchi di codice, citazioni, linee, immagini,
// e nel testo: `codice`, **grassetto**, *corsivo*, [link](url). Niente HTML: ciò che non si capisce resta testo.

export type Inline =
  | { t: 'txt'; v: string }
  | { t: 'code'; v: string }
  | { t: 'b'; v: Inline[] }
  | { t: 'i'; v: Inline[] }
  | { t: 'a'; v: Inline[]; href: string }
  | { t: 'img'; alt: string; src: string }

export type Blocco =
  | { t: 'h'; livello: number; v: Inline[]; id: string }
  | { t: 'p'; v: Inline[] }
  | { t: 'lista'; voci: { depth: number; num: number | null; v: Inline[] }[] }
  | { t: 'codice'; lingua: string; v: string }
  | { t: 'tabella'; testa: Inline[][]; righe: Inline[][][] }
  | { t: 'cit'; v: Blocco[] }
  | { t: 'hr' }

export function inline(s: string): Inline[] {
  const out: Inline[] = []
  let i = 0
  let buf = ''
  const spingi = (): void => {
    if (buf) out.push({ t: 'txt', v: buf })
    buf = ''
  }
  while (i < s.length) {
    const c = s[i]!
    if (c === '\\' && i + 1 < s.length && /[\\`*_{}[\]()#+\-.!|>~]/.test(s[i + 1]!)) {
      buf += s[i + 1]
      i += 2
      continue
    }
    if (c === '`') {
      const run = s.slice(i).match(/^`+/)![0]
      const fine = s.indexOf(run, i + run.length)
      if (fine > i) {
        spingi()
        out.push({ t: 'code', v: s.slice(i + run.length, fine).replace(/^ (.*) $/, '$1') })
        i = fine + run.length
        continue
      }
      buf += run
      i += run.length
      continue
    }
    if (c === '!' && s[i + 1] === '[') {
      const m = s.slice(i).match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/)
      if (m) {
        spingi()
        out.push({ t: 'img', alt: m[1]!, src: m[2]! })
        i += m[0].length
        continue
      }
    }
    if (c === '[') {
      const m = s.slice(i).match(/^\[((?:[^\]\\]|\\.)*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/)
      if (m) {
        spingi()
        out.push({ t: 'a', v: inline(m[1]!), href: m[2]! })
        i += m[0].length
        continue
      }
    }
    if ((c === '*' || c === '_') && s[i + 1] === c) {
      const fine = s.indexOf(c + c, i + 2)
      if (fine > i + 2 && (c === '*' || !/\w/.test(s[i - 1] ?? ' '))) {
        spingi()
        out.push({ t: 'b', v: inline(s.slice(i + 2, fine)) })
        i = fine + 2
        continue
      }
    }
    if ((c === '*' || c === '_') && s[i + 1] !== ' ' && s[i + 1] !== undefined && s[i + 1] !== c) {
      const fine = s.indexOf(c, i + 1)
      if (fine > i + 1 && s[fine - 1] !== ' ' && (c === '*' || (!/\w/.test(s[i - 1] ?? ' ') && !/\w/.test(s[fine + 1] ?? ' ')))) {
        spingi()
        out.push({ t: 'i', v: inline(s.slice(i + 1, fine)) })
        i = fine + 1
        continue
      }
    }
    buf += c
    i++
  }
  spingi()
  return out
}

export function testoDi(v: Inline[]): string {
  return v.map((x) => (x.t === 'txt' || x.t === 'code' ? x.v : x.t === 'img' ? x.alt : testoDi(x.v))).join('')
}

const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function celle(riga: string): string[] {
  let r = riga.trim()
  if (r.startsWith('|')) r = r.slice(1)
  if (r.endsWith('|') && !r.endsWith('\\|')) r = r.slice(0, -1)
  const out: string[] = []
  let cur = ''
  for (let i = 0; i < r.length; i++) {
    if (r[i] === '\\' && r[i + 1] === '|') {
      cur += '|'
      i++
    } else if (r[i] === '`') {
      const fine = r.indexOf('`', i + 1)
      if (fine > i) {
        cur += r.slice(i, fine + 1)
        i = fine
      } else cur += r[i]
    } else if (r[i] === '|') {
      out.push(cur.trim())
      cur = ''
    } else cur += r[i]
  }
  out.push(cur.trim())
  return out
}

const èSepTabella = (r: string): boolean => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(r) && r.includes('-')

/** Toglie l'intestazione `---` iniziale (se c'è) e la restituisce a parte, come testo. */
export function separaIntestazione(src: string): { fm: string; corpo: string } {
  const m = src.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  return m ? { fm: m[1]!, corpo: src.replace(/^﻿/, '').slice(m[0].length) } : { fm: '', corpo: src.replace(/^﻿/, '') }
}

export function parseMd(src: string): Blocco[] {
  const righe = separaIntestazione(src).corpo.replace(/\r\n?/g, '\n').split('\n')
  return blocchi(righe)
}

function blocchi(righe: string[]): Blocco[] {
  const out: Blocco[] = []
  const usati = new Map<string, number>()
  let i = 0
  const inizioSpeciale = (r: string, next: string | undefined): boolean =>
    /^\s*(```|~~~)/.test(r) || /^ {0,3}#{1,6}\s/.test(r) || /^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(r) || /^\s*>/.test(r) || /^\s*([-*+]|\d+[.)])\s+/.test(r) || (r.includes('|') && next !== undefined && èSepTabella(next))
  while (i < righe.length) {
    const r = righe[i]!
    if (!r.trim()) {
      i++
      continue
    }
    const fence = r.match(/^(\s*)(```|~~~)\s*([\w+#-]*)/)
    if (fence) {
      const cod: string[] = []
      i++
      while (i < righe.length && !righe[i]!.trim().startsWith(fence[2]!)) {
        cod.push(righe[i]!.startsWith(fence[1]!) ? righe[i]!.slice(fence[1]!.length) : righe[i]!)
        i++
      }
      i++
      out.push({ t: 'codice', lingua: fence[3] ?? '', v: cod.join('\n') })
      continue
    }
    const h = r.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (h) {
      const v = inline(h[2]!)
      let id = slug(testoDi(v)) || 'sezione'
      const n = usati.get(id) ?? 0
      usati.set(id, n + 1)
      if (n) id += '-' + n
      out.push({ t: 'h', livello: h[1]!.length, v, id })
      i++
      continue
    }
    if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(r)) {
      out.push({ t: 'hr' })
      i++
      continue
    }
    if (/^\s*>/.test(r)) {
      const q: string[] = []
      while (i < righe.length && /^\s*>/.test(righe[i]!)) {
        q.push(righe[i]!.replace(/^\s*> ?/, ''))
        i++
      }
      out.push({ t: 'cit', v: blocchi(q) })
      continue
    }
    if (r.includes('|') && i + 1 < righe.length && èSepTabella(righe[i + 1]!)) {
      const testa = celle(r).map(inline)
      i += 2
      const rg: Inline[][][] = []
      while (i < righe.length && righe[i]!.trim() && righe[i]!.includes('|')) {
        const c = celle(righe[i]!)
        while (c.length < testa.length) c.push('')
        rg.push(c.slice(0, Math.max(testa.length, c.length)).map(inline))
        i++
      }
      out.push({ t: 'tabella', testa, righe: rg })
      continue
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(r)) {
      const voci: { depth: number; num: number | null; v: Inline[] }[] = []
      const rientri: number[] = []
      while (i < righe.length) {
        const m = righe[i]!.match(/^(\s*)([-*+]|(\d+)[.)])\s+(.*)$/)
        if (!m) {
          // continuazione di una voce (riga rientrata, non vuota)
          if (righe[i]!.trim() && /^\s{2,}\S/.test(righe[i]!) && voci.length && !inizioSpeciale(righe[i]!, righe[i + 1])) {
            const u = voci[voci.length - 1]!
            u.v = inline(testoDiGrezzo(u.v) + ' ' + righe[i]!.trim())
            i++
            continue
          }
          break
        }
        const rientro = m[1]!.replace(/\t/g, '    ').length
        while (rientri.length && rientro < rientri[rientri.length - 1]!) rientri.pop()
        if (!rientri.length || rientro > rientri[rientri.length - 1]!) rientri.push(rientro)
        voci.push({ depth: rientri.length - 1, num: m[3] ? Number(m[3]) : null, v: inline(m[4]!) })
        i++
      }
      out.push({ t: 'lista', voci })
      continue
    }
    const par: string[] = [r.trim()]
    i++
    while (i < righe.length && righe[i]!.trim() && !inizioSpeciale(righe[i]!, righe[i + 1])) {
      par.push(righe[i]!.trim())
      i++
    }
    out.push({ t: 'p', v: inline(par.join(' ')) })
  }
  return out
}

// Per riunire le righe di una voce di elenco si riparte dal testo: i simboli restano al loro posto.
function testoDiGrezzo(v: Inline[]): string {
  return v
    .map((x) => {
      switch (x.t) {
        case 'txt':
          return x.v
        case 'code':
          return '`' + x.v + '`'
        case 'b':
          return '**' + testoDiGrezzo(x.v) + '**'
        case 'i':
          return '*' + testoDiGrezzo(x.v) + '*'
        case 'a':
          return `[${testoDiGrezzo(x.v)}](${x.href})`
        case 'img':
          return `![${x.alt}](${x.src})`
      }
    })
    .join('')
}

/** Il primo titolo del documento, se c'è. */
export function primoTitolo(src: string): string | null {
  const m = separaIntestazione(src).corpo.match(/^ {0,3}#\s+(.+?)\s*#*\s*$/m)
  return m ? testoDi(inline(m[1]!)) : null
}

export function contaParole(src: string): number {
  return separaIntestazione(src).corpo.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

/** Le immagini citate (percorsi relativi), senza ripetizioni. */
export function immaginiCitate(src: string): string[] {
  const set = new Set<string>()
  for (const m of src.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) set.add(m[1]!)
  return [...set]
}
