import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { leggiConfronto, leggiNota, leggiRipasso, type ExtraAutore } from '../shared/extraAutore'

async function file(dir: string, sotto: string): Promise<string[]> {
  try {
    return (await fs.readdir(join(dir, sotto))).filter((f) => /\.md$/i.test(f)).sort()
  } catch {
    return []
  }
}

/** Legge confronti, ripasso e note della cartella di un autore. Cartelle assenti = elenchi vuoti. */
export async function leggiExtra(dirAutore: string): Promise<ExtraAutore> {
  const extra: ExtraAutore = { confronti: [], ripasso: [], note: [], errori: [] }
  for (const f of await file(dirAutore, 'confronti')) {
    const r = leggiConfronto(await fs.readFile(join(dirAutore, 'confronti', f), 'utf8'))
    if (r.ok) extra.confronti.push(r.dati)
    else extra.errori.push(`confronti/${f}: ${r.errore}`)
  }
  for (const f of await file(dirAutore, 'ripasso')) {
    const r = leggiRipasso(await fs.readFile(join(dirAutore, 'ripasso', f), 'utf8'))
    if (r.ok) extra.ripasso.push(r.dati)
    else extra.errori.push(`ripasso/${f}: ${r.errore}`)
  }
  for (const f of await file(dirAutore, 'note')) {
    extra.note.push(leggiNota(f.replace(/\.md$/i, ''), await fs.readFile(join(dirAutore, 'note', f), 'utf8')))
  }
  return extra
}
