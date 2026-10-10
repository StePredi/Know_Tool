// Repository su file: l'unico punto in cui l'app tocca il disco.
// - legge la cartella di un autore e costruisce il modello (senza mai lanciare eccezioni di contenuto)
// - scrive subito, in modo atomico (file temporaneo + rinomina), cambiando solo i campi toccati
// - guarda la cartella e avvisa quando un file cambia dall'esterno (AI, editor di testo, git)

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import chokidar, { type FSWatcher } from 'chokidar'
import { costruisciModello, idDaFile, type MappaFile } from '../shared/modello'
import {
  applicaPatchScheda,
  leggiDocMd,
  normalizzaFineRiga,
  ORDINE_CAMPI_SCHEDA,
  scriviDocMd,
  type DocMd
} from '../shared/scheda_md'
import type { AutorePatch, Modello, NuovaScheda, SchedaPatch, Tema } from '../shared/types'

export const PERCORSO_AUTORI = ['01_Argomenti', 'italiano', 'autori']

const FILE_NOTI = /^(autore\.md|temi\.md|glossario\.md|schede\/[^/]+\.md)$/i
const TEMPORANEI = /\.tmp-|\.swp$|~$|\.lock$/i

export interface EventoRepo {
  modello: Modello
  esterni: string[]
}

async function scriviAtomico(percorso: string, testo: string): Promise<void> {
  const tmp = `${percorso}.tmp-${process.pid}-${Date.now()}`
  await fs.writeFile(tmp, testo, 'utf8')
  let ultimo: unknown
  for (let i = 0; i < 6; i++) {
    try {
      await fs.rename(tmp, percorso)
      return
    } catch (e) {
      ultimo = e // su Windows un antivirus o un'anteprima può tenere il file per un attimo
      await new Promise((r) => setTimeout(r, 40 * (i + 1)))
    }
  }
  await fs.rm(tmp, { force: true })
  throw ultimo
}

export class Repository {
  readonly dir: string
  private cache = new Map<string, string>()
  private watcher: FSWatcher | null = null
  private ascoltatori = new Set<(e: EventoRepo) => void>()
  private daRileggere = new Set<string>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private coda: Promise<unknown> = Promise.resolve()

  constructor(readonly radice: string, readonly autoreId: string) {
    this.dir = join(radice, ...PERCORSO_AUTORI, autoreId)
  }

  static cartellaAutori(radice: string): string {
    return join(radice, ...PERCORSO_AUTORI)
  }

  /** Autori presenti: una cartella con autore.md dentro `autori/`. */
  static async elencaAutori(radice: string): Promise<{ id: string; nome: string }[]> {
    const base = Repository.cartellaAutori(radice)
    let voci: string[] = []
    try {
      voci = (await fs.readdir(base, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
    } catch {
      return []
    }
    const out: { id: string; nome: string }[] = []
    for (const id of voci.sort()) {
      let nome = id
      try {
        const doc = leggiDocMd(await fs.readFile(join(base, id, 'autore.md'), 'utf8'))
        if (doc.fm.nome) nome = String(doc.fm.nome)
      } catch {
        // cartella senza autore.md: compare comunque, l'app segnalerà il problema
      }
      out.push({ id, nome })
    }
    return out
  }

  // ---------- lettura ----------

  async carica(): Promise<void> {
    this.cache.clear()
    const leggi = async (rel: string): Promise<void> => {
      try {
        this.cache.set(rel, normalizzaFineRiga(await fs.readFile(join(this.dir, rel), 'utf8')))
      } catch {
        // file assente: lo segnalerà la validazione
      }
    }
    await Promise.all(['autore.md', 'temi.md', 'glossario.md'].map(leggi))
    let schede: string[] = []
    try {
      schede = (await fs.readdir(join(this.dir, 'schede'))).filter((f) => /\.md$/i.test(f))
    } catch {
      // niente cartella schede: mappa vuota, nessun errore
    }
    await Promise.all(schede.map((f) => leggi(`schede/${f}`)))
  }

  modello(): Modello {
    const mappa: MappaFile = {}
    for (const [k, v] of this.cache) mappa[k] = v
    return costruisciModello(mappa, this.autoreId)
  }

  // ---------- aggiornamento automatico ----------

  onCambio(cb: (e: EventoRepo) => void): () => void {
    this.ascoltatori.add(cb)
    return () => this.ascoltatori.delete(cb)
  }

  private emetti(esterni: string[]): void {
    const e: EventoRepo = { modello: this.modello(), esterni }
    this.ascoltatori.forEach((cb) => cb(e))
  }

  avvia(): void {
    if (this.watcher) return
    const relativo = (p: string): string => p.slice(this.dir.length + 1).replace(/\\/g, '/')
    this.watcher = chokidar.watch(this.dir, {
      ignoreInitial: true,
      ignored: (p: string) => TEMPORANEI.test(p),
      awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 30 }
    })
    const evento = (p: string): void => {
      const rel = relativo(p)
      if (!FILE_NOTI.test(rel)) return
      this.daRileggere.add(rel)
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => void this.rileggi(), 100)
    }
    this.watcher.on('add', evento).on('change', evento).on('unlink', evento)
  }

  async ferma(): Promise<void> {
    if (this.timer) clearTimeout(this.timer)
    await this.watcher?.close()
    this.watcher = null
  }

  /** Rilegge i file segnalati dal watcher: se il contenuto è già quello in memoria (nostra scrittura) non emette nulla. */
  private async rileggi(): Promise<void> {
    const lista = [...this.daRileggere]
    this.daRileggere.clear()
    const cambiati: string[] = []
    for (const rel of lista) {
      let nuovo: string | null = null
      try {
        nuovo = normalizzaFineRiga(await fs.readFile(join(this.dir, rel), 'utf8'))
      } catch {
        nuovo = null // cancellato o non ancora leggibile
      }
      const vecchio = this.cache.get(rel) ?? null
      if (nuovo === vecchio) continue
      if (nuovo == null) this.cache.delete(rel)
      else this.cache.set(rel, nuovo)
      cambiati.push(rel)
    }
    if (cambiati.length) this.emetti(cambiati)
  }

  // ---------- scrittura immediata ----------

  /** Le scritture si mettono in coda: una alla volta, nell'ordine in cui arrivano. */
  private inCoda<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.coda.then(fn, fn)
    this.coda = p.catch(() => undefined)
    return p
  }

  private async leggiDisco(rel: string): Promise<string> {
    return normalizzaFineRiga(await fs.readFile(join(this.dir, rel), 'utf8'))
  }

  private async scrivi(rel: string, testo: string): Promise<void> {
    await fs.mkdir(join(this.dir, rel, '..'), { recursive: true })
    await scriviAtomico(join(this.dir, rel), testo)
    this.cache.set(rel, testo)
  }

  aggiornaScheda(id: string, patch: SchedaPatch): Promise<Modello> {
    return this.inCoda(async () => {
      const rel = `schede/${id}.md`
      const testo = await this.leggiDisco(rel)
      const doc = leggiDocMd(testo)
      if (doc.erroreYaml) throw new Error(`«${id}.md» ha un frontmatter non valido: correggilo a mano prima di modificarla dall'app.`)
      applicaPatchScheda(doc, patch)
      const nuovo = scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA })
      if (nuovo !== testo) {
        await this.scrivi(rel, nuovo)
        this.emetti([])
      }
      return this.modello()
    })
  }

  creaScheda(nuova: NuovaScheda): Promise<{ id: string; modello: Modello }> {
    return this.inCoda(async () => {
      const m = this.modello()
      let id = 'nuova'
      for (let i = 2; this.cache.has(`schede/${id}.md`); i++) id = `nuova${i}`
      const doc: DocMd = {
        haFrontmatter: true,
        erroreYaml: null,
        preambolo: '',
        fm: {
          id,
          corsia: nuova.corsia ?? m.autore.corsie[0]!.id,
          data: nuova.data ?? '',
          titolo_breve: nuova.titolo_breve ?? 'Nuova scheda',
          fuori_dal_libro: false
        },
        sezioni: [
          { titolo: 'Riassunto', testo: '' },
          { titolo: 'Dettagli', testo: '' }
        ]
      }
      await this.scrivi(`schede/${id}.md`, scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA }))
      this.emetti([])
      return { id, modello: this.modello() }
    })
  }

  duplicaScheda(id: string): Promise<{ id: string; modello: Modello }> {
    return this.inCoda(async () => {
      const doc = leggiDocMd(await this.leggiDisco(`schede/${id}.md`))
      if (doc.erroreYaml) throw new Error(`«${id}.md» ha un frontmatter non valido: non si può duplicare.`)
      let nuovoId = `${id}_copia`
      for (let i = 2; this.cache.has(`schede/${nuovoId}.md`); i++) nuovoId = `${id}_copia${i}`
      doc.fm.id = nuovoId
      doc.fm.titolo_breve = `${String(doc.fm.titolo_breve ?? id)} (copia)`
      if (doc.fm.titolo) doc.fm.titolo = `${String(doc.fm.titolo)} (copia)`
      await this.scrivi(`schede/${nuovoId}.md`, scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA }))
      this.emetti([])
      return { id: nuovoId, modello: this.modello() }
    })
  }

  /**
   * «Elimina» non cancella: sposta il file in 99_Archivio/schede_eliminate/ (si recupera a mano o con git)
   * e toglie la scheda dai collegamenti delle altre schede e dalle voci del glossario.
   */
  eliminaScheda(id: string): Promise<{ modello: Modello; archiviata: string; collegamentiTolti: number; vociTolte: number }> {
    return this.inCoda(async () => {
      const rel = `schede/${id}.md`
      if (!this.cache.has(rel)) throw new Error(`La scheda «${id}» non esiste più.`)
      const cartella = join(this.radice, '99_Archivio', 'schede_eliminate')
      await fs.mkdir(cartella, { recursive: true })
      const ora = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      const destinazione = join(cartella, `${this.autoreId}_${id}_${ora}.md`)
      await fs.rename(join(this.dir, rel), destinazione)
      this.cache.delete(rel)

      let collegamentiTolti = 0
      for (const [altro, testo] of [...this.cache]) {
        if (!/^schede\/[^/]+\.md$/.test(altro)) continue
        const doc = leggiDocMd(testo)
        const col = doc.fm.collegamenti
        if (doc.erroreYaml || !Array.isArray(col) || !col.includes(id)) continue
        const resto = col.filter((x) => x !== id)
        if (resto.length) doc.fm.collegamenti = resto
        else delete doc.fm.collegamenti
        collegamentiTolti++
        await this.scrivi(altro, scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA }))
      }

      let vociTolte = 0
      const testoGl = this.cache.get('glossario.md')
      if (testoGl) {
        const gl = leggiDocMd(testoGl)
        const voci = gl.fm.voci
        if (!gl.erroreYaml && Array.isArray(voci)) {
          let cambiato = false
          for (const v of voci as { schede?: unknown }[]) {
            if (v && Array.isArray(v.schede) && v.schede.includes(id)) {
              v.schede = v.schede.filter((x) => x !== id)
              vociTolte++
              cambiato = true
            }
          }
          if (cambiato) await this.scrivi('glossario.md', scriviDocMd(gl))
        }
      }
      this.emetti([])
      return { modello: this.modello(), archiviata: destinazione, collegamentiTolti, vociTolte }
    })
  }

  aggiornaAutore(patch: AutorePatch): Promise<Modello> {
    return this.inCoda(async () => {
      const testo = await this.leggiDisco('autore.md')
      const doc = leggiDocMd(testo)
      if (doc.erroreYaml) throw new Error('autore.md ha un frontmatter non valido: correggilo a mano.')
      if (patch.nome !== undefined) doc.fm.nome = patch.nome
      if (patch.corsie !== undefined) {
        doc.fm.corsie = patch.corsie.map((c) => ({ id: c.id, nome: c.nome, sigla: c.sigla, tonalita: c.tonalita }))
      }
      if (patch.periodi !== undefined) {
        doc.fm.periodi = patch.periodi.map((p) => ({ nome: p.nome, data: p.data, ...(p.fine ? { fine: p.fine } : {}) }))
      }
      const nuovo = scriviDocMd(doc, { ordine: ['id', 'nome', 'nascita', 'morte', 'corsie', 'periodi'], mappeInRiga: true })
      if (nuovo !== testo) {
        await this.scrivi('autore.md', nuovo)
        this.emetti([])
      }
      return this.modello()
    })
  }

  aggiornaTemi(temi: Tema[]): Promise<Modello> {
    return this.inCoda(async () => {
      let testo = ''
      try {
        testo = await this.leggiDisco('temi.md')
      } catch {
        testo = ''
      }
      const doc: DocMd = testo ? leggiDocMd(testo) : { haFrontmatter: true, erroreYaml: null, preambolo: '', fm: {}, sezioni: [] }
      if (doc.erroreYaml) throw new Error('temi.md ha un frontmatter non valido: correggilo a mano.')
      doc.fm.temi = temi.map((t) => ({ id: t.id, nome: t.nome, ...(t.colore ? { colore: t.colore } : {}) }))
      const nuovo = scriviDocMd(doc, { mappeInRiga: true })
      if (nuovo !== testo) {
        await this.scrivi('temi.md', nuovo)
        this.emetti([])
      }
      return this.modello()
    })
  }
}

export { idDaFile }
