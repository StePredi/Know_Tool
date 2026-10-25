// Lettura di una documentazione «Per situazioni» dal disco e salvataggio dei progressi.

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { controllaEsercizi, controllaSituazioni, leggiEsercizi, leggiIndice, leggiLibri, leggiSchedaSit, type DocumentoMateria, type EserciziSit, type Libri, type SchedaSit, type Situazioni } from '../shared/situazioni'

const BASE = '01_Argomenti'

function cartella(radice: string, rel: string): string {
  const parti = rel.split('/').filter(Boolean)
  if (!parti.length || parti.some((p) => p === '..' || p === '.' || p.includes('\\') || /^[_.]|^99_/.test(p))) throw new Error('Percorso non valido.')
  return join(radice, BASE, ...parti)
}

export async function èSituazioni(dir: string): Promise<boolean> {
  try {
    await fs.access(join(dir, 'indice.yaml'))
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

export async function leggiSituazioni(radice: string, rel: string): Promise<Situazioni> {
  const dir = cartella(radice, rel)
  let src: string
  try {
    src = await fs.readFile(join(dir, 'indice.yaml'), 'utf8')
  } catch {
    throw new Error('Questa documentazione non ha più il file indice.yaml.')
  }
  const { indice, errore } = leggiIndice(src)
  if (!indice) throw new Error(errore ?? 'indice.yaml non si legge.')
  const schede: Record<string, SchedaSit> = {}
  const avvisi: string[] = []
  let nomi: string[] = []
  try {
    nomi = (await fs.readdir(join(dir, 'schede'))).filter((f) => f.endsWith('.yaml')).sort()
  } catch {
    avvisi.push('Manca la cartella schede.')
  }
  for (const nome of nomi) {
    const r = leggiSchedaSit(await fs.readFile(join(dir, 'schede', nome), 'utf8'), nome)
    if (r.scheda) schede[r.scheda.id] = r.scheda
    else if (r.errore) avvisi.push(r.errore)
  }
  avvisi.push(...controllaSituazioni(indice, schede))
  let esercizi: EserciziSit | undefined
  try {
    const re = leggiEsercizi(await fs.readFile(join(dir, 'esercizi.yaml'), 'utf8'))
    if (re.esercizi) {
      esercizi = re.esercizi
      avvisi.push(...controllaEsercizi(esercizi, schede))
    } else if (re.errore) avvisi.push(re.errore)
  } catch {
    /* esercizi.yaml è facoltativo */
  }
  const ripassate = (await leggiRipassate(dir)).filter((id) => schede[id])
  const libri = indice.vista === 'storia' ? await leggiLibriMateria(radice, rel) : undefined
  return { rel, indice, schede, esercizi, ripassate, avvisi, libri }
}

/** `01_Argomenti/<Materia>/_libri.yaml`: i libri della materia. Facoltativo. */
async function leggiLibriMateria(radice: string, rel: string): Promise<Libri | undefined> {
  const materia = rel.split('/').filter(Boolean)[0]
  if (!materia) return undefined
  try {
    const r = leggiLibri(await fs.readFile(join(radice, BASE, materia, '_libri.yaml'), 'utf8'))
    return r.libri
  } catch {
    return undefined
  }
}

/** Per la vista «Copertura del libro»: tutti i documenti «storia» della materia, con il solo campo «da». */
export async function leggiMateriaStoria(radice: string, materia: string): Promise<{ libri: Libri; documenti: DocumentoMateria[] }> {
  if (!materia || /[\\/]/.test(materia) || /^[_.]|^99_/.test(materia)) throw new Error('Materia non valida.')
  const libri = (await leggiLibriMateria(radice, materia)) ?? {}
  const documenti: DocumentoMateria[] = []
  const radiceMateria = join(radice, BASE, materia)
  const cerca = async (dir: string, rel: string, prof: number): Promise<void> => {
    if (prof > 3) return
    let voci: string[] = []
    try {
      voci = (await fs.readdir(dir, { withFileTypes: true })).filter((v) => v.isDirectory() && !/^[_.]|^99_/.test(v.name)).map((v) => v.name)
    } catch {
      return
    }
    if (await èSituazioni(dir)) {
      try {
        const { indice } = leggiIndice(await fs.readFile(join(dir, 'indice.yaml'), 'utf8'))
        if (indice?.vista === 'storia') {
          const schede: DocumentoMateria['schede'] = []
          const nomi = (await fs.readdir(join(dir, 'schede'))).filter((f) => f.endsWith('.yaml')).sort()
          for (const nome of nomi) {
            const r = leggiSchedaSit(await fs.readFile(join(dir, 'schede', nome), 'utf8'), nome)
            const sc = r.scheda
            if (sc && (sc.tipo === 'voce' || sc.tipo === 'confronto')) schede.push({ id: sc.id, titolo: sc.titolo, da: sc.da })
          }
          documenti.push({ rel, titolo: indice.titolo, schede })
        }
      } catch {
        /* un documento che non si legge non ferma la copertura */
      }
      return
    }
    for (const v of voci) await cerca(join(dir, v), `${rel}/${v}`, prof + 1)
  }
  await cerca(radiceMateria, materia, 0)
  return { libri, documenti }
}

/** Segna o toglie «ripassata» e restituisce l'elenco aggiornato. Scrive in modo sicuro (file temporaneo + rinomina). */
export async function segnaRipassata(radice: string, rel: string, id: string, ripassata: boolean): Promise<string[]> {
  const dir = cartella(radice, rel)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Scheda non valida.')
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
