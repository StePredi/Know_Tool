// Esplora 01_Argomenti come un albero di cartelle e documenti (per la Home generale).
// Legge soltanto, tranne nelle quattro operazioni esplicite: crea una cartella, rinomina, archivia.
// Nulla si cancella: archiviare sposta in 99_Archivio.

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { leggiDocMd } from '../shared/scheda_md'
import type { NodoArg } from '../shared/types'
import { spostaCartella } from './repository'
import { èSituazioni } from './situazioni'

const BASE = '01_Argomenti'
/** Cartelle che l'app usa per sé: non compaiono come cartelle di studio. */
const NASCOSTE = /^(_|\.|99_)/
const PROTETTI = new Set(['italiano', 'italiano/autori'])
const NOME_VIETATO = /[\\/:*?"<>|\u0000-\u001f]/

export function nomeValido(nome: string): string | null {
  const n = nome.trim().replace(/\s+/g, ' ')
  if (!n) return 'Scrivi un nome.'
  if (n.length > 60) return 'Il nome è troppo lungo (massimo 60 caratteri).'
  if (NOME_VIETATO.test(n)) return 'Il nome non può contenere \\ / : * ? " < > |'
  if (/^[._]/.test(n) || /^99_/.test(n)) return 'Il nome non può cominciare con «.», «_» o «99_»: sono riservati all\'app.'
  if (/[. ]$/.test(n)) return 'Il nome non può finire con un punto o uno spazio.'
  return null
}

async function mtime(p: string): Promise<number> {
  try {
    return (await fs.stat(p)).mtimeMs
  } catch {
    return 0
  }
}

async function elencaDir(p: string): Promise<string[]> {
  try {
    return (await fs.readdir(p, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort((a, b) => a.localeCompare(b, 'it'))
  } catch {
    return []
  }
}

async function leggiFm(file: string): Promise<Record<string, unknown>> {
  try {
    return leggiDocMd(await fs.readFile(file, 'utf8')).fm
  } catch {
    return {}
  }
}

async function nodoAutore(radice: string, rel: string, id: string): Promise<NodoArg> {
  const dir = join(radice, BASE, rel)
  const fm = await leggiFm(join(dir, 'autore.md'))
  const nome = typeof fm.nome === 'string' && fm.nome ? fm.nome : id
  let nSchede = 0
  try {
    nSchede = (await fs.readdir(join(dir, 'schede'))).filter((f) => f.endsWith('.md')).length
  } catch {
    // nessuna scheda
  }
  const testi: NodoArg[] = []
  for (const t of await elencaDir(join(dir, 'testi'))) {
    const file = join(dir, 'testi', t, 'testo.md')
    const tf = await leggiFm(file)
    const titolo = typeof tf.titolo === 'string' && tf.titolo ? tf.titolo : t
    const opera = typeof tf.opera === 'string' ? tf.opera : ''
    const anno = tf.anno != null ? String(tf.anno) : ''
    testi.push({
      rel: `${rel}/testi/${t}`,
      tipo: 'testo',
      nome: titolo,
      protetto: false,
      puoRinominare: true,
      puoArchiviare: true,
      autoreId: id,
      testoId: t,
      info: [opera, anno].filter(Boolean).join(' · ') || 'Testo',
      modificato: await mtime(file),
      figli: []
    })
  }
  const mappa: NodoArg = {
    rel: `${rel}#mappa`,
    tipo: 'mappa',
    nome: 'Mappa cronologica',
    protetto: true,
    puoRinominare: false,
    puoArchiviare: false,
    autoreId: id,
    info: `${nSchede} schede`,
    modificato: await mtime(join(dir, 'schede')),
    figli: []
  }
  return {
    rel,
    tipo: 'autore',
    nome,
    protetto: true,
    puoRinominare: true,
    puoArchiviare: false,
    autoreId: id,
    info: `${testi.length} testi · ${nSchede} schede`,
    modificato: Math.max(mappa.modificato, ...testi.map((t) => t.modificato), await mtime(join(dir, 'autore.md'))),
    figli: [mappa, ...testi]
  }
}

async function nodoSituazioni(radice: string, rel: string, nome: string): Promise<NodoArg> {
  const dir = join(radice, BASE, rel)
  let n = 0
  try {
    n = (await fs.readdir(join(dir, 'schede'))).filter((f) => f.endsWith('.yaml')).length
  } catch {
    // nessuna scheda
  }
  return {
    rel,
    tipo: 'situazioni',
    nome,
    protetto: false,
    puoRinominare: true,
    puoArchiviare: true,
    info: `${n} situazioni`,
    modificato: Math.max(await mtime(join(dir, 'indice.yaml')), await mtime(join(dir, 'schede')), await mtime(join(dir, 'progresso.json'))),
    figli: []
  }
}

async function figliDi(radice: string, rel: string): Promise<NodoArg[]> {
  const out: NodoArg[] = []
  for (const nome of await elencaDir(join(radice, BASE, rel))) {
    if (NASCOSTE.test(nome)) continue
    const r = rel ? `${rel}/${nome}` : nome
    // un autore è una cartella con autore.md dentro italiano/autori
    if (rel === 'italiano/autori' && (await mtime(join(radice, BASE, r, 'autore.md'))) > 0) {
      out.push(await nodoAutore(radice, r, nome))
      continue
    }
    // una cartella con indice.yaml è una documentazione «Per situazioni»: si apre in una scheda, non si esplora
    if (await èSituazioni(join(radice, BASE, r))) {
      out.push(await nodoSituazioni(radice, r, nome))
      continue
    }
    const figli = await figliDi(radice, r)
    const protetto = PROTETTI.has(r)
    out.push({
      rel: r,
      tipo: rel === '' ? 'materia' : 'cartella',
      nome,
      protetto,
      puoRinominare: !protetto,
      puoArchiviare: !protetto,
      info: riepilogo(figli),
      modificato: Math.max(await mtime(join(radice, BASE, r)), ...figli.map((f) => f.modificato)),
      figli
    })
  }
  return out
}

function riepilogo(figli: NodoArg[]): string {
  const c = figli.filter((f) => f.tipo === 'cartella').length
  const a = figli.filter((f) => f.tipo === 'autore').length
  const d = figli.filter((f) => f.tipo === 'situazioni').length
  const t = figli.reduce((n, f) => n + (f.tipo === 'testo' ? 1 : 0) + (f.tipo === 'autore' ? f.figli.filter((x) => x.tipo === 'testo').length : f.tipo === 'cartella' ? contaTesti(f) : 0), 0)
  const parti: string[] = []
  if (a) parti.push(a === 1 ? '1 autore' : `${a} autori`)
  if (d) parti.push(d === 1 ? '1 documento' : `${d} documenti`)
  if (c) parti.push(c === 1 ? '1 cartella' : `${c} cartelle`)
  if (t) parti.push(t === 1 ? '1 testo' : `${t} testi`)
  return parti.join(' · ') || 'Vuota'
}

function contaTesti(n: NodoArg): number {
  return n.figli.reduce((s, f) => s + (f.tipo === 'testo' ? 1 : contaTesti(f)), 0)
}

export async function leggiAlbero(radice: string): Promise<NodoArg[]> {
  return figliDi(radice, '')
}

/** Il percorso su disco di una cartella dell'albero; rifiuta tutto ciò che esce da 01_Argomenti. */
function cartellaDi(radice: string, rel: string): string {
  const parti = rel.split('/').filter(Boolean)
  if (parti.some((p) => p === '..' || p === '.' || NASCOSTE.test(p))) throw new Error('Percorso non valido.')
  return join(radice, BASE, ...parti)
}

async function esiste(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/** Nuova cartella (o nuova materia, se `padre` è vuoto). */
export async function creaNodo(radice: string, padre: string, nome: string): Promise<string> {
  const err = nomeValido(nome)
  if (err) throw new Error(err)
  const n = nome.trim().replace(/\s+/g, ' ')
  const dirPadre = cartellaDi(radice, padre)
  if (padre === 'italiano/autori') throw new Error('Gli autori si creano dalla cartella dell\'app, non da qui.')
  if (!(await esiste(dirPadre))) throw new Error('La cartella non esiste più.')
  const dest = join(dirPadre, n)
  if (await esiste(dest)) throw new Error(`Esiste già «${n}» qui.`)
  await fs.mkdir(dest)
  return padre ? `${padre}/${n}` : n
}

function sostituisciCampo(md: string, chiave: string, valore: string): string {
  const m = md.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/)
  if (!m) throw new Error('Il file non ha l\'intestazione prevista.')
  const re = new RegExp(`^${chiave}:.*$`, 'm')
  if (!re.test(m[2]!)) throw new Error(`Nel file manca il campo «${chiave}».`)
  const nuovo = m[2]!.replace(re, `${chiave}: ${JSON.stringify(valore)}`)
  return m[1]! + nuovo + m[3]! + md.slice(m[0].length)
}

/** Rinomina: una cartella cambia nome su disco; un autore o un testo cambia solo il nome scritto nel file (l'id resta). */
export async function rinominaNodo(radice: string, rel: string, nome: string): Promise<string> {
  const err = nomeValido(nome)
  if (err) throw new Error(err)
  const n = nome.trim().replace(/\s+/g, ' ')
  const mt = rel.match(/^(italiano\/autori\/[^/]+)\/testi\/([^/]+)$/)
  if (mt) {
    const file = join(cartellaDi(radice, rel), 'testo.md')
    await fs.writeFile(file, sostituisciCampo(await fs.readFile(file, 'utf8'), 'titolo', n), 'utf8')
    return rel
  }
  const ma = rel.match(/^italiano\/autori\/([^/]+)$/)
  if (ma) {
    const file = join(cartellaDi(radice, rel), 'autore.md')
    await fs.writeFile(file, sostituisciCampo(await fs.readFile(file, 'utf8'), 'nome', n), 'utf8')
    return rel
  }
  if (PROTETTI.has(rel)) throw new Error('Questa cartella serve all\'app: non si può rinominare.')
  const parti = rel.split('/')
  const attuale = parti.pop()!
  const padre = parti.join('/')
  if (n === attuale) return rel
  const da = cartellaDi(radice, rel)
  const a = join(cartellaDi(radice, padre), n)
  if (await esiste(a) && n.toLowerCase() !== attuale.toLowerCase()) throw new Error(`Esiste già «${n}» qui.`)
  await spostaCartella(da, a)
  return padre ? `${padre}/${n}` : n
}

const stamp = (): string => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)

/** Archivia: sposta in 99_Archivio (cartelle_archiviate o testi_eliminati), non cancella. Restituisce dove è finita. */
export async function archiviaNodo(radice: string, rel: string): Promise<string> {
  if (PROTETTI.has(rel) || /^italiano\/autori\/[^/]+$/.test(rel) || rel.includes('#')) {
    throw new Error('Questo elemento serve all\'app: non si può archiviare da qui.')
  }
  const da = cartellaDi(radice, rel)
  if (!(await esiste(da))) throw new Error('Non esiste più.')
  const mt = rel.match(/^italiano\/autori\/([^/]+)\/testi\/([^/]+)$/)
  const dir = join(radice, '99_Archivio', mt ? 'testi_eliminati' : 'cartelle_archiviate')
  await fs.mkdir(dir, { recursive: true })
  const nome = mt ? `${mt[1]}_${mt[2]}_${stamp()}` : `${rel.replace(/\//g, '_')}_${stamp()}`
  const a = join(dir, nome)
  await spostaCartella(da, a)
  return a
}
