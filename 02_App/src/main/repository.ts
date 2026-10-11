// Repository su file: l'unico punto in cui l'app tocca il disco.
// - legge la cartella di un autore e costruisce il modello (senza mai lanciare eccezioni di contenuto)
// - scrive subito, in modo atomico (file temporaneo + rinomina), cambiando solo i campi toccati
// - guarda la cartella e avvisa quando un file cambia dall'esterno (AI, editor di testo, git)

import { promises as fs } from 'node:fs'
import { join, relative } from 'node:path'
import chokidar, { type FSWatcher } from 'chokidar'
import { costruisciModello, idDaFile, type MappaFile } from '../shared/modello'
import { yamlFrontmatter } from '../shared/scheda_md'
import { corpoDi, jsonLeggibile, riancora, slug, tokenizza } from '../shared/testo'
import {
  applicaPatchScheda,
  leggiDocMd,
  normalizzaFineRiga,
  ORDINE_CAMPI_SCHEDA,
  scriviDocMd,
  type DocMd
} from '../shared/scheda_md'
import type { ApplicaProposta, AutorePatch, EsitoRiaggancio, Layout, Modello, NuovaScheda, NuovoTesto, Raccolta, SchedaPatch, Tema, VoceScritta } from '../shared/types'

export const PERCORSO_AUTORI = ['01_Argomenti', 'italiano', 'autori']

const FILE_NOTI = /^(autore\.md|temi\.md|glossario\.md|schede\/[^/]+\.md|testi\/[^/]+\/(testo\.md|annotazioni\.json|parafrasi\.json|esercizi\.json|proposta_scheda\.md)|\.\.\/\.\.\/_condiviso\/figure_retoriche\.json)$/i
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

/**
 * Sposta una cartella. Su Windows `rename` fallisce (EPERM/EBUSY) se qualcosa la tiene aperta, per esempio il
 * controllo dei file: in quel caso si copia tutto nella destinazione e poi si tolgono gli originali.
 * La copia è completa prima di toccare gli originali, quindi non si perde nulla.
 */
export async function spostaCartella(da: string, a: string, rinomina: (x: string, y: string) => Promise<void> = fs.rename): Promise<void> {
  try {
    await rinomina(da, a)
    return
  } catch (e) {
    const c = (e as NodeJS.ErrnoException).code
    if (!['EPERM', 'EBUSY', 'EACCES', 'EXDEV', 'ENOTEMPTY'].includes(c ?? '')) throw e
  }
  await fs.cp(da, a, { recursive: true, errorOnExist: true, force: false })
  try {
    await fs.rm(da, { recursive: true, force: true, maxRetries: 6, retryDelay: 100 })
  } catch {
    // la cartella può restare occupata: si tolgono almeno i file (la cartella vuota è ignorata dall'app)
    for (const f of await fs.readdir(da, { recursive: true, withFileTypes: true })) {
      if (f.isFile()) await fs.rm(join(f.parentPath, f.name), { force: true })
    }
  }
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
    await leggi('../../_condiviso/figure_retoriche.json')
    let testi: string[] = []
    try {
      testi = (await fs.readdir(join(this.dir, 'testi'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
    } catch {
      // nessun testo: l'editor parte vuoto
    }
    for (const t of testi) {
      await Promise.all(['testo.md', 'annotazioni.json', 'parafrasi.json', 'esercizi.json', 'proposta_scheda.md'].map((n) => leggi(`testi/${t}/${n}`)))
    }
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
    const relativo = (p: string): string => relative(this.dir, p).replace(/\\/g, '/')
    this.watcher = chokidar.watch([this.dir, join(this.dir, '..', '..', '_condiviso')], {
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

  // ---------- testi (editor) ----------

  private async leggiRaccolta(testoId: string, raccolta: Raccolta): Promise<Record<string, unknown>[]> {
    try {
      const v = JSON.parse(await this.leggiDisco(`testi/${testoId}/${raccolta}.json`)) as unknown
      return Array.isArray(v) ? (v.filter((x) => typeof x === 'object' && x !== null && !Array.isArray(x)) as Record<string, unknown>[]) : []
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw new Error(`${raccolta}.json del testo «${testoId}» non si legge come JSON: correggilo a mano prima di modificarlo dall'app.`)
    }
  }

  private scriviRaccolta(testoId: string, raccolta: Raccolta, voci: unknown[]): Promise<void> {
    return this.scrivi(`testi/${testoId}/${raccolta}.json`, jsonLeggibile(voci))
  }

  private async esisteTesto(id: string): Promise<void> {
    if (!this.cache.has(`testi/${id}/testo.md`)) throw new Error(`Il testo «${id}» non esiste.`)
  }

  /** Riscrive testo.md cambiando solo il frontmatter e/o il corpo; gli altri campi del frontmatter restano. */
  private async riscriviTesto(id: string, cambia: (fm: Record<string, unknown>) => void, corpo?: string): Promise<void> {
    const rel = `testi/${id}/testo.md`
    const vecchio = await this.leggiDisco(rel)
    const doc = leggiDocMd(vecchio)
    if (doc.erroreYaml) throw new Error(`testo.md di «${id}» ha un frontmatter non valido: correggilo a mano.`)
    cambia(doc.fm)
    const ordine = ['id', 'titolo', 'scheda', 'layout', 'fonte', 'anno', 'opera']
    const fm: Record<string, unknown> = {}
    for (const k of ordine) if (k in doc.fm && doc.fm[k] !== '' && doc.fm[k] != null) fm[k] = doc.fm[k]
    for (const k of Object.keys(doc.fm)) if (!(k in fm) && doc.fm[k] != null && doc.fm[k] !== '') fm[k] = doc.fm[k]
    const testo = `---\n${yamlFrontmatter(fm)}\n---\n\n${corpo ?? corpoDi(vecchio)}\n`
    if (testo !== vecchio) await this.scrivi(rel, testo)
  }

  creaTesto(nuovo: NuovoTesto): Promise<{ id: string; modello: Modello }> {
    return this.inCoda(async () => {
      const base = slug(nuovo.titolo)
      let id = base
      for (let i = 2; this.cache.has(`testi/${id}/testo.md`); i++) id = `${base}_${i}`
      const fm: Record<string, unknown> = { id, titolo: nuovo.titolo.trim() || 'Nuovo testo' }
      if (nuovo.scheda) fm.scheda = nuovo.scheda
      fm.layout = nuovo.layout
      fm.fonte = 'incolla'
      if (nuovo.anno?.trim()) fm.anno = nuovo.anno.trim()
      if (nuovo.opera?.trim()) fm.opera = nuovo.opera.trim()
      const corpo = nuovo.corpo.replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '')
      await this.scrivi(`testi/${id}/testo.md`, `---\n${yamlFrontmatter(fm)}\n---\n\n${corpo}\n`)
      for (const r of ['annotazioni', 'parafrasi', 'esercizi'] as Raccolta[]) await this.scriviRaccolta(id, r, [])
      this.emetti([])
      return { id, modello: this.modello() }
    })
  }

  /** «Elimina» non cancella: sposta la cartella del testo in 99_Archivio/testi_eliminati/ (si recupera a mano o con git). */
  eliminaTesto(id: string): Promise<{ modello: Modello; archiviato: string }> {
    return this.inCoda(async () => {
      await this.esisteTesto(id)
      const cartella = join(this.radice, '99_Archivio', 'testi_eliminati')
      await fs.mkdir(cartella, { recursive: true })
      const ora = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      const destinazione = join(cartella, `${this.autoreId}_${id}_${ora}`)
      const origine = join(this.dir, 'testi', id)
      try {
        await this.watcher?.unwatch(origine)
      } catch {
        // non importa se non era osservata
      }
      await spostaCartella(origine, destinazione)
      for (const k of [...this.cache.keys()]) if (k.startsWith(`testi/${id}/`)) this.cache.delete(k)
      this.emetti([])
      return { modello: this.modello(), archiviato: destinazione }
    })
  }

  aggiornaTesto(id: string, patch: { layout?: Layout; titolo?: string; anno?: string; opera?: string; scheda?: string | null }): Promise<Modello> {
    return this.inCoda(async () => {
      await this.esisteTesto(id)
      await this.riscriviTesto(id, (fm) => {
        if (patch.layout !== undefined) fm.layout = patch.layout
        if (patch.titolo !== undefined) fm.titolo = patch.titolo
        if (patch.anno !== undefined) fm.anno = patch.anno
        if (patch.opera !== undefined) fm.opera = patch.opera
        if (patch.scheda !== undefined) fm.scheda = patch.scheda
      })
      this.emetti([])
      return this.modello()
    })
  }

  /** Cambia il testo e riaggancia annotazioni, parafrasi e passi degli esercizi (decisioni_editor_testo.md §4). Niente si perde: ciò che non si ritrova resta com'è e viene segnalato. */
  modificaCorpo(id: string, corpoNuovo: string): Promise<{ modello: Modello; esito: EsitoRiaggancio }> {
    return this.inCoda(async () => {
      await this.esisteTesto(id)
      const corpo = corpoNuovo.replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '')
      const doc = leggiDocMd(await this.leggiDisco(`testi/${id}/testo.md`))
      const layout: Layout = doc.fm.layout === 'prosa' ? 'prosa' : 'verso'
      const tk = tokenizza(corpo, layout)
      let riagganciate = 0
      let daSistemare = 0
      const ricolloca = (o: Record<string, unknown>): void => {
        const span = Array.isArray(o.span) && o.span.length === 2 ? ([o.span[0], o.span[1]] as [number, number]) : null
        const citato = typeof o.citato === 'string' ? o.citato : null
        if (!citato) return
        const r = riancora(span, citato, tk, corpo)
        if (r.stato === 'riagganciata') {
          o.span = r.span
          riagganciate++
        } else if (r.stato === 'rotta' || r.stato === 'ambigua') daSistemare++
      }
      const raccolte = {} as Record<Raccolta, Record<string, unknown>[]>
      for (const r of ['annotazioni', 'parafrasi', 'esercizi'] as Raccolta[]) raccolte[r] = await this.leggiRaccolta(id, r)
      raccolte.annotazioni.forEach(ricolloca)
      raccolte.parafrasi.forEach(ricolloca)
      for (const e of raccolte.esercizi) {
        if (Array.isArray(e.passi)) (e.passi as Record<string, unknown>[]).forEach(ricolloca)
      }
      await this.riscriviTesto(id, () => undefined, corpo)
      for (const r of ['annotazioni', 'parafrasi', 'esercizi'] as Raccolta[]) await this.scriviRaccolta(id, r, raccolte[r])
      this.emetti([])
      return { modello: this.modello(), esito: { riagganciate, daSistemare } }
    })
  }

  salvaVoce(testoId: string, raccolta: Raccolta, voce: VoceScritta): Promise<{ id: string; modello: Modello }> {
    return this.inCoda(async () => {
      await this.esisteTesto(testoId)
      const voci = await this.leggiRaccolta(testoId, raccolta)
      const { stato: _s, spanScritto: _w, ...pulita } = voce as Record<string, unknown>
      void _s
      void _w
      if (Array.isArray(pulita.passi)) {
        pulita.passi = (pulita.passi as Record<string, unknown>[]).map(({ stato: _a, spanScritto: _b, ...p }) => {
          void _a
          void _b
          return p
        })
      }
      const prefisso = raccolta === 'annotazioni' ? 'a' : raccolta === 'parafrasi' ? 'p' : 'e'
      let id = typeof pulita.id === 'string' && pulita.id ? pulita.id : ''
      const i = id ? voci.findIndex((v) => v.id === id) : -1
      if (i >= 0) voci[i] = { ...voci[i], ...pulita }
      else {
        if (!id) {
          const max = voci.reduce((m, v) => Math.max(m, Number(String(v.id ?? '').replace(/^\D+/, '')) || 0), 0)
          id = `${prefisso}${String(max + 1).padStart(3, '0')}`
        }
        const nuova: Record<string, unknown> = { ...pulita, id }
        if (raccolta === 'esercizi' && nuova.numero === undefined) nuova.numero = voci.reduce((m, v) => Math.max(m, Number(v.numero) || 0), 0) + 1
        if (raccolta === 'parafrasi' && nuova.ordine === undefined) nuova.ordine = voci.reduce((m, v) => Math.max(m, Number(v.ordine) || 0), 0) + 1
        // id in testa, come negli altri file
        const { id: _i, ...resto } = nuova
        void _i
        voci.push({ id, ...resto })
      }
      await this.scriviRaccolta(testoId, raccolta, voci)
      this.emetti([])
      return { id, modello: this.modello() }
    })
  }

  eliminaVoce(testoId: string, raccolta: Raccolta, id: string): Promise<Modello> {
    return this.inCoda(async () => {
      await this.esisteTesto(testoId)
      const voci = await this.leggiRaccolta(testoId, raccolta)
      const resto = voci.filter((v) => v.id !== id)
      if (resto.length !== voci.length) {
        await this.scriviRaccolta(testoId, raccolta, resto)
        this.emetti([])
      }
      return this.modello()
    })
  }

  salvaRaccolta(testoId: string, raccolta: Raccolta, voci: VoceScritta[]): Promise<Modello> {
    return this.inCoda(async () => {
      await this.esisteTesto(testoId)
      const pulite = voci.map((v) => {
        const { stato: _s, spanScritto: _w, ...p } = v as Record<string, unknown>
        void _s
        void _w
        if (Array.isArray(p.passi)) p.passi = (p.passi as Record<string, unknown>[]).map(({ stato: _a, spanScritto: _b, ...q }) => { void _a; void _b; return q })
        return p
      })
      await this.scriviRaccolta(testoId, raccolta, pulite)
      this.emetti([])
      return this.modello()
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

  /** Sposta un file in 99_Archivio/<cartella>/ (mai cancellato) e lo toglie dalla memoria. */
  private async archiviaFile(rel: string, cartella: string, nome: string): Promise<string> {
    const dir = join(this.radice, '99_Archivio', cartella)
    await fs.mkdir(dir, { recursive: true })
    const ora = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const dest = join(dir, `${this.autoreId}_${nome}_${ora}.md`)
    const da = join(this.dir, rel)
    try {
      await fs.rename(da, dest)
    } catch {
      await fs.copyFile(da, dest)
      await fs.rm(da, { force: true, maxRetries: 5, retryDelay: 100 })
    }
    this.cache.delete(rel)
    return dest
  }

  /**
   * Applica a una scheda le sezioni scelte della proposta dell'AI. Se il testo non ha una scheda la crea (serve `nuova`)
   * e la collega. La proposta, usata, va in 99_Archivio/proposte_applicate/.
   */
  applicaProposta(testoId: string, scelte: ApplicaProposta): Promise<{ modello: Modello; schedaId: string; creata: boolean }> {
    return this.inCoda(async () => {
      const m = this.modello()
      const t = m.testi.find((x) => x.id === testoId)
      const p = t?.proposta
      if (!t || !p) throw new Error('Non c\'è nessuna proposta da applicare.')
      if (p.errore) throw new Error(p.errore)
      const sez = new Set(scelte.sezioni)
      let schedaId = t.scheda && m.schede.some((x) => x.id === t.scheda) ? t.scheda : null
      const creata = !schedaId
      if (!schedaId) {
        const n = scelte.nuova
        if (!n || !m.autore.corsie.some((c) => c.id === n.corsia)) throw new Error('Scegli la categoria della nuova scheda.')
        let id = slug(p.scheda || t.id) || 'scheda'
        for (let i = 2; this.cache.has(`schede/${id}.md`); i++) id = `${slug(p.scheda || t.id)}_${i}`
        schedaId = id
        sez.add('riassunto')
        const doc: DocMd = {
          haFrontmatter: true,
          erroreYaml: null,
          preambolo: '',
          fm: { id, corsia: n.corsia, data: n.data.trim(), titolo_breve: n.titolo_breve.trim() || t.titolo, testi: [t.id], fuori_dal_libro: false, origine: 'analisi' },
          sezioni: [
            { titolo: 'Riassunto', testo: '' },
            { titolo: 'Dettagli', testo: '' }
          ]
        }
        await this.scrivi(`schede/${id}.md`, scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA }))
      }
      const rel = `schede/${schedaId}.md`
      const testoScheda = await this.leggiDisco(rel)
      const doc = leggiDocMd(testoScheda)
      if (doc.erroreYaml) throw new Error(`«${schedaId}.md» ha un frontmatter non valido: correggilo a mano.`)
      const patch: SchedaPatch = {}
      if (sez.has('riassunto') && p.sezioni.riassunto) patch.riassunto = p.sezioni.riassunto
      if (sez.has('struttura')) patch.struttura = p.sezioni.struttura
      if (sez.has('contesto')) patch.contesto = p.sezioni.contesto
      if (sez.has('citazioni')) patch.citazioni = p.sezioni.citazioni
      if (sez.has('domande')) patch.domande = p.sezioni.domande
      if (sez.has('temi')) {
        const attuali = Array.isArray(doc.fm.temi) ? doc.fm.temi.map(String) : []
        patch.temi = [...new Set([...attuali, ...p.temi])]
      }
      applicaPatchScheda(doc, patch)
      await this.scrivi(rel, scriviDocMd(doc, { ordine: ORDINE_CAMPI_SCHEDA }))
      if (creata) await this.riscriviTesto(testoId, (fm) => { fm.scheda = schedaId })
      await this.archiviaFile(p.file, 'proposte_applicate', testoId)
      this.emetti([])
      return { modello: this.modello(), schedaId, creata }
    })
  }

  /** Scarta la proposta: il file va in 99_Archivio/proposte_scartate/. */
  scartaProposta(testoId: string): Promise<Modello> {
    return this.inCoda(async () => {
      const rel = `testi/${testoId}/proposta_scheda.md`
      if (!this.cache.has(rel)) throw new Error('Non c\'è nessuna proposta da scartare.')
      await this.archiviaFile(rel, 'proposte_scartate', testoId)
      this.emetti([])
      return this.modello()
    })
  }

  /** Toglie un tema da temi.md e da tutte le schede che lo usano. Le schede restano. */
  eliminaTema(id: string): Promise<{ modello: Modello; schedeToccate: number }> {
    return this.inCoda(async () => {
      const testo = await this.leggiDisco('temi.md')
      const doc = leggiDocMd(testo)
      if (doc.erroreYaml) throw new Error('temi.md ha un frontmatter non valido: correggilo a mano.')
      const temi = Array.isArray(doc.fm.temi) ? (doc.fm.temi as { id?: unknown }[]) : []
      if (!temi.some((t) => t && t.id === id)) throw new Error(`Il tema «${id}» non esiste più.`)
      doc.fm.temi = temi.filter((t) => !(t && t.id === id))
      await this.scrivi('temi.md', scriviDocMd(doc, { mappeInRiga: true }))
      let schedeToccate = 0
      for (const [rel, t] of [...this.cache]) {
        if (!/^schede\/[^/]+\.md$/.test(rel)) continue
        const d = leggiDocMd(t)
        const lista = d.fm.temi
        if (d.erroreYaml || !Array.isArray(lista) || !lista.includes(id)) continue
        const resto = lista.filter((x) => x !== id)
        if (resto.length) d.fm.temi = resto
        else delete d.fm.temi
        schedeToccate++
        await this.scrivi(rel, scriviDocMd(d, { ordine: ORDINE_CAMPI_SCHEDA }))
      }
      this.emetti([])
      return { modello: this.modello(), schedeToccate }
    })
  }

  /**
   * Toglie una categoria (corsia). Le sue schede passano a `verso`: serve se ce ne sono; non si può eliminare l'ultima categoria.
   */
  eliminaCorsia(id: string, verso: string | null): Promise<{ modello: Modello; schedeSpostate: number }> {
    return this.inCoda(async () => {
      const testo = await this.leggiDisco('autore.md')
      const doc = leggiDocMd(testo)
      if (doc.erroreYaml) throw new Error('autore.md ha un frontmatter non valido: correggilo a mano.')
      const corsie = Array.isArray(doc.fm.corsie) ? (doc.fm.corsie as { id?: unknown }[]) : []
      if (!corsie.some((c) => c && c.id === id)) throw new Error(`La categoria «${id}» non esiste più.`)
      if (corsie.length <= 1) throw new Error('Deve restare almeno una categoria.')
      const sue: string[] = []
      for (const [rel, t] of this.cache) {
        if (!/^schede\/[^/]+\.md$/.test(rel)) continue
        const d = leggiDocMd(t)
        if (!d.erroreYaml && d.fm.corsia === id) sue.push(rel)
      }
      if (sue.length) {
        if (!verso || verso === id || !corsie.some((c) => c && c.id === verso)) throw new Error('Scegli la categoria in cui spostare le sue schede.')
        for (const rel of sue) {
          const d = leggiDocMd(this.cache.get(rel)!)
          d.fm.corsia = verso
          await this.scrivi(rel, scriviDocMd(d, { ordine: ORDINE_CAMPI_SCHEDA }))
        }
      }
      doc.fm.corsie = corsie.filter((c) => !(c && c.id === id))
      await this.scrivi('autore.md', scriviDocMd(doc, { ordine: ['id', 'nome', 'nascita', 'morte', 'corsie', 'periodi'], mappeInRiga: true }))
      this.emetti([])
      return { modello: this.modello(), schedeSpostate: sue.length }
    })
  }
}

export { idDaFile }
