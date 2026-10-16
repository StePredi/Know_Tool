// Lettura degli appunti (.md) della sessione di studio. Solo lettura: l'app non li modifica.

import { promises as fs } from 'node:fs'
import { join, posix } from 'node:path'
import { immaginiCitate, separaIntestazione } from '../shared/markdown'
import type { Appunto } from '../shared/types'

const BASE = '01_Argomenti'
const MAX_IMG = 6 * 1024 * 1024
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }

/** Un file di appunti: .md dentro 01_Argomenti, mai in cartelle riservate all'app e mai con nome nascosto. */
export function relAppuntoValido(rel: string): string[] {
  const parti = rel.split('/')
  if (parti.length < 2 || parti.some((p) => !p || p === '.' || p === '..' || p.includes('\\') || p.includes(':') || /^[_.]|^99_/.test(p))) throw new Error('Percorso non valido.')
  if (!/\.md$/i.test(parti[parti.length - 1]!)) throw new Error('Non è un file di appunti.')
  return parti
}

export async function leggiAppunto(radice: string, rel: string): Promise<Appunto> {
  const parti = relAppuntoValido(rel)
  const file = join(radice, BASE, ...parti)
  let src: string
  let modificato = 0
  try {
    src = await fs.readFile(file, 'utf8')
    modificato = (await fs.stat(file)).mtimeMs
  } catch {
    throw new Error('Questo file non c\'è più.')
  }
  const immagini: Record<string, string> = {}
  const mancanti: string[] = []
  const cartella = parti.slice(0, -1).join('/')
  for (const src_ of immaginiCitate(separaIntestazione(src).corpo)) {
    if (/^(https?:|data:|file:|\/|[a-z]:)/i.test(src_)) continue
    const dec = decodeURI(src_.split('#')[0]!.split('?')[0]!)
    const r = posix.normalize(posix.join(cartella, dec))
    const ext = r.split('.').pop()!.toLowerCase()
    // l'immagine deve restare dentro 01_Argomenti e non può stare in una cartella riservata
    if (r.startsWith('..') || r.split('/').some((p) => /^[_.]|^99_/.test(p)) || !MIME[ext]) {
      mancanti.push(src_)
      continue
    }
    try {
      const f = join(radice, BASE, ...r.split('/'))
      const st = await fs.stat(f)
      if (st.size > MAX_IMG) throw new Error('troppo grande')
      immagini[src_] = `data:${MIME[ext]};base64,${(await fs.readFile(f)).toString('base64')}`
    } catch {
      mancanti.push(src_)
    }
  }
  return { rel, testo: src, immagini, mancanti, modificato }
}

const APRIBILI = /\.(pdf|pptx?|docx?|xlsx?|html?|png|jpe?g|gif|webp|svg|txt|csv)$/i

/** Un file citato in un appunto (es. `fonti/x.pdf`): si cerca accanto all'appunto e poi nelle cartelle sopra, fino alla materia.
 *  Restituisce il percorso assoluto, pronto da aprire con l'app predefinita del sistema. Solo file di tipo noto dentro 01_Argomenti. */
export async function trovaFonte(radice: string, dalAppunto: string, citato: string): Promise<{ rel: string; assoluto: string }> {
  const parti = relAppuntoValido(dalAppunto)
  const c = decodeURI(citato.split('#')[0]!.split('?')[0]!).replace(/\\/g, '/')
  if (/^([a-z]:|\/|https?:)/i.test(c) || !APRIBILI.test(c)) throw new Error('Questo tipo di file non si apre da qui.')
  const cp = c.split('/').filter((p) => p && p !== '.')
  if (cp.some((p) => p === '..' || /^[_.]|^99_/.test(p))) throw new Error('Percorso non valido.')
  for (let n = parti.length - 1; n >= 1; n--) {
    const rel = [...parti.slice(0, n), ...cp].join('/')
    const assoluto = join(radice, BASE, ...rel.split('/'))
    try {
      if ((await fs.stat(assoluto)).isFile()) return { rel, assoluto }
    } catch {
      // si prova una cartella più in alto
    }
  }
  throw new Error(`Non trovo «${c}» nella cartella della materia.`)
}

export const èFileApribile = (nome: string): boolean => APRIBILI.test(nome)

/** Un file dell'albero (es. `TPSIT/MSP/fonti/x.pdf`) da aprire con l'app del sistema: percorso assoluto, solo se tipo noto e dentro 01_Argomenti. */
export async function fileApribile(radice: string, rel: string): Promise<string> {
  const parti = rel.split('/')
  if (parti.length < 2 || parti.some((p) => !p || p === '.' || p === '..' || p.includes('\\') || p.includes(':') || /^[_.]|^99_/.test(p))) throw new Error('Percorso non valido.')
  if (!APRIBILI.test(parti[parti.length - 1]!)) throw new Error('Questo tipo di file non si apre da qui.')
  const assoluto = join(radice, BASE, ...parti)
  try {
    if (!(await fs.stat(assoluto)).isFile()) throw new Error()
  } catch {
    throw new Error('Questo file non c\'è più.')
  }
  return assoluto
}
