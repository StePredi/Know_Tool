// Lettura di un argomento di matematica dal disco, salvataggio dei progressi e creazione.

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { controllaMatematica, leggiArgomento, leggiRegola, type Matematica, type Regola } from '../shared/matematica'

const BASE = '01_Argomenti'

function cartella(radice: string, rel: string): string {
  const parti = rel.split('/').filter(Boolean)
  if (!parti.length || parti.some((p) => p === '..' || p === '.' || p.includes('\\') || /^[_.]|^99_/.test(p))) throw new Error('Percorso non valido.')
  return join(radice, BASE, ...parti)
}

export async function èMatematica(dir: string): Promise<boolean> {
  try {
    await fs.access(join(dir, 'argomento.yaml'))
    return true
  } catch {
    return false
  }
}

async function leggiRipassate(dir: string): Promise<string[]> {
  try {
    const j = JSON.parse(await fs.readFile(join(dir, 'progresso.json'), 'utf8')) as { ripassate?: unknown }
    return Array.isArray(j.ripassate) ? j.ripassate.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export async function leggiMatematica(radice: string, rel: string): Promise<Matematica> {
  const dir = cartella(radice, rel)
  let src: string
  try {
    src = await fs.readFile(join(dir, 'argomento.yaml'), 'utf8')
  } catch {
    throw new Error('Questo argomento non ha più il file argomento.yaml.')
  }
  const { argomento, errore } = leggiArgomento(src)
  if (!argomento) throw new Error(errore ?? 'argomento.yaml non si legge.')
  const regole: Record<string, Regola> = {}
  const avvisi: string[] = []
  let nomi: string[] = []
  try {
    nomi = (await fs.readdir(join(dir, 'regole'))).filter((f) => f.endsWith('.yaml')).sort()
  } catch {
    avvisi.push('Manca la cartella regole.')
  }
  for (const nome of nomi) {
    const r = leggiRegola(await fs.readFile(join(dir, 'regole', nome), 'utf8'), nome)
    if (r.regola) regole[r.regola.id] = r.regola
    else if (r.errore) avvisi.push(r.errore)
  }
  avvisi.push(...controllaMatematica(argomento, regole))
  const ripassate = (await leggiRipassate(dir)).filter((id) => regole[id])
  return { rel, argomento, regole, ripassate, avvisi }
}

/** Segna o toglie «ripassata» e restituisce l'elenco aggiornato. Scrive in modo sicuro (file temporaneo + rinomina). */
export async function segnaRegolaRipassata(radice: string, rel: string, id: string, ripassata: boolean): Promise<string[]> {
  const dir = cartella(radice, rel)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Regola non valida.')
  const set = new Set(await leggiRipassate(dir))
  if (ripassata) set.add(id)
  else set.delete(id)
  const lista = [...set].sort()
  const file = join(dir, 'progresso.json')
  const tmp = file + '.tmp'
  await fs.writeFile(tmp, JSON.stringify({ ripassate: lista }, null, 2) + '\n', 'utf8')
  await fs.rename(tmp, file)
  return lista
}

/** Il contenuto di un argomento nuovo: argomento.yaml con una regola da compilare. Il nome della cartella decide il titolo. */
export function argomentoNuovo(titolo: string): { argomento: string; regola: { id: string; testo: string } } {
  const argomento = YAML.stringify({ modello: 'matematica', titolo, introduzione: '', ordine: ['prima-regola'], esempi: [], bozza: false }, { lineWidth: 0 })
  const regola = YAML.stringify(
    { id: 'prima-regola', nome: 'Prima regola', riconosci: 'Cosa vedi nell\'esercizio quando serve questa regola.', fai: 'Cosa fai.', formula: '', esempi: [], errore: '', confondi: [] },
    { lineWidth: 0 }
  )
  return { argomento, regola: { id: 'prima-regola', testo: regola } }
}

/** Crea la cartella dell'argomento (non sovrascrive: se esiste, errore). `dir` è la cartella dell'argomento, ancora inesistente. */
export async function scriviArgomentoNuovo(dir: string, titolo: string): Promise<void> {
  const n = argomentoNuovo(titolo)
  await fs.mkdir(join(dir, 'regole'), { recursive: true })
  await fs.writeFile(join(dir, 'argomento.yaml'), n.argomento, { encoding: 'utf8', flag: 'wx' })
  await fs.writeFile(join(dir, 'regole', `${n.regola.id}.yaml`), n.regola.testo, { encoding: 'utf8', flag: 'wx' })
}
