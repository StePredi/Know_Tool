// Dai file al modello dell'autore, con validazione che non rompe mai l'app:
// ogni problema diventa una voce in `problemi`, mai un'eccezione (formato_studio_italiano.md §10).

import { z } from 'zod'
import { leggiProposta } from './proposta'
import { leggiDocMd, leggiDettagli, leggiTabella, trovaSezione, type DocMd } from './scheda_md'
import { erroreFine, parseData } from './dates'
import { controllaTesti, leggiFigure, leggiTesto, type FileTesto } from './testo'
import type { Autore, Corsia, Modello, Testo, Periodo, Problema, Scheda, Tema, VoceGlossario } from './types'

/** chiave = percorso relativo alla cartella dell'autore ("autore.md", "schede/fuga.md"), valore = testo del file */
export type MappaFile = Record<string, string>

const RISERVATI = /^(con|prn|aux|nul|com\d|lpt\d)$/i
const COLONNE_RIASSUNTO = 110 // caratteri per riga, per stimare «circa 5 righe»

// ---------- lettura dei campi con zod, un campo alla volta ----------

const testo = z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v))
const elencoDiTesti = z.union([
  z.array(z.union([z.string(), z.number()]).transform((v) => String(v))),
  testo.transform((s) => (s.trim() ? [s.trim()] : []))
])
const numero = z.union([z.number(), z.string().transform((s) => Number(s))]).refine((n) => Number.isFinite(n), 'deve essere un numero')

class Segnalatore {
  readonly problemi: Problema[] = []
  constructor(private file: string, private scheda?: string) {}
  errore(codice: string, messaggio: string): void {
    this.problemi.push({ gravita: 'errore', codice, file: this.file, messaggio, ...(this.scheda ? { scheda: this.scheda } : {}) })
  }
  avviso(codice: string, messaggio: string): void {
    this.problemi.push({ gravita: 'avviso', codice, file: this.file, messaggio, ...(this.scheda ? { scheda: this.scheda } : {}) })
  }
}

function campo<T>(
  fm: Record<string, unknown>,
  nome: string,
  schema: z.ZodType<T>,
  s: Segnalatore,
  opzioni: { obbligatorio?: boolean; predefinito: T }
): T {
  const v = fm[nome]
  if (v === undefined || v === null) {
    if (opzioni.obbligatorio) s.errore('campo-obbligatorio', `Campo obbligatorio mancante: «${nome}».`)
    return opzioni.predefinito
  }
  const r = schema.safeParse(v)
  if (r.success) return r.data
  s.errore('campo-non-valido', `Campo «${nome}» non valido: ${r.error.issues[0]?.message ?? 'valore non riconosciuto'}.`)
  return opzioni.predefinito
}

// ---------- autore, temi, glossario ----------

function leggiAutore(testoFile: string | undefined, idAtteso: string, problemi: Problema[]): Autore {
  const s = new Segnalatore('autore.md')
  const fallback: Autore = { id: idAtteso, nome: idAtteso, nascita: null, morte: null, corsie: [], periodi: [] }
  if (testoFile == null) {
    s.errore('file-mancante', 'Manca il file autore.md: senza corsie e periodi la mappa non si può disegnare.')
    problemi.push(...s.problemi)
    return { ...fallback, corsie: [corsiaDiRiserva()] }
  }
  const doc = leggiDocMd(testoFile)
  if (doc.erroreYaml) {
    s.errore('yaml', `Il frontmatter di autore.md non si legge: ${doc.erroreYaml}`)
    problemi.push(...s.problemi)
    return { ...fallback, corsie: [corsiaDiRiserva()] }
  }
  const fm = doc.fm
  const id = campo(fm, 'id', testo, s, { obbligatorio: true, predefinito: idAtteso })
  const nome = campo(fm, 'nome', testo, s, { obbligatorio: true, predefinito: idAtteso })
  const nascita = campo<number | null>(fm, 'nascita', numero, s, { predefinito: null })
  const morte = campo<number | null>(fm, 'morte', numero, s, { predefinito: null })

  const corsie: Corsia[] = []
  const grezze = Array.isArray(fm.corsie) ? fm.corsie : []
  if (!Array.isArray(fm.corsie)) s.errore('campo-obbligatorio', 'Campo obbligatorio mancante: «corsie».')
  grezze.forEach((c, i) => {
    const o = (c ?? {}) as Record<string, unknown>
    const cid = campo(o, 'id', testo, s, { obbligatorio: true, predefinito: `corsia${i + 1}` })
    const cnome = campo(o, 'nome', testo, s, { obbligatorio: true, predefinito: cid })
    const sigla = campo(o, 'sigla', testo, s, { predefinito: cnome.slice(0, 3).toUpperCase() })
    let ton = campo(o, 'tonalita', numero, s, { predefinito: (i * 47) % 360 })
    if (ton < 0 || ton > 360) {
      s.avviso('tonalita-fuori-intervallo', `La tonalità della corsia «${cid}» (${ton}) deve stare tra 0 e 360.`)
      ton = ((ton % 360) + 360) % 360
    }
    if (corsie.some((x) => x.id === cid)) s.errore('corsia-duplicata', `Due corsie hanno lo stesso id «${cid}».`)
    corsie.push({ id: cid, nome: cnome, sigla, tonalita: ton })
  })
  if (!corsie.length) {
    s.errore('autore-senza-corsie', 'Nessuna corsia in autore.md: ne uso una provvisoria.')
    corsie.push(corsiaDiRiserva())
  }

  const periodi: Periodo[] = []
  const pg = Array.isArray(fm.periodi) ? fm.periodi : []
  pg.forEach((p, i) => {
    const o = (p ?? {}) as Record<string, unknown>
    const pn = campo(o, 'nome', testo, s, { obbligatorio: true, predefinito: `Periodo ${i + 1}` })
    const pd = campo(o, 'data', testo, s, { obbligatorio: true, predefinito: '' })
    const pf = campo(o, 'fine', testo, s, { predefinito: '' })
    const dd = parseData(pd)
    if (dd.err) s.errore('periodo-data', `Periodo «${pn}»: ${dd.err}`)
    const ef = erroreFine(pd, pf || undefined)
    if (ef) s.errore('periodo-fine', `Periodo «${pn}»: ${ef}`)
    periodi.push({ nome: pn, data: pd, ...(pf ? { fine: pf } : {}) })
  })
  problemi.push(...s.problemi)
  return { id, nome, nascita, morte, corsie, periodi }
}

function corsiaDiRiserva(): Corsia {
  return { id: 'generale', nome: 'Generale', sigla: 'GEN', tonalita: 220 }
}

function leggiTemi(testoFile: string | undefined, problemi: Problema[]): Tema[] {
  if (testoFile == null) return []
  const s = new Segnalatore('temi.md')
  const doc = leggiDocMd(testoFile)
  if (doc.erroreYaml) {
    s.errore('yaml', `Il frontmatter di temi.md non si legge: ${doc.erroreYaml}`)
    problemi.push(...s.problemi)
    return []
  }
  const out: Tema[] = []
  const g = Array.isArray(doc.fm.temi) ? doc.fm.temi : []
  g.forEach((t, i) => {
    const o = (t ?? {}) as Record<string, unknown>
    const id = campo(o, 'id', testo, s, { obbligatorio: true, predefinito: `tema${i + 1}` })
    const nome = campo(o, 'nome', testo, s, { obbligatorio: true, predefinito: id })
    const colore = campo(o, 'colore', testo, s, { predefinito: '' })
    if (out.some((x) => x.id === id)) s.errore('tema-duplicato', `Due temi hanno lo stesso id «${id}».`)
    out.push({ id, nome, ...(colore ? { colore } : {}) })
  })
  problemi.push(...s.problemi)
  return out
}

function leggiGlossario(testoFile: string | undefined, problemi: Problema[]): VoceGlossario[] {
  if (testoFile == null) return []
  const s = new Segnalatore('glossario.md')
  const doc = leggiDocMd(testoFile)
  if (doc.erroreYaml) {
    s.errore('yaml', `Il frontmatter di glossario.md non si legge: ${doc.erroreYaml}`)
    problemi.push(...s.problemi)
    return []
  }
  const out: VoceGlossario[] = []
  const g = Array.isArray(doc.fm.voci) ? doc.fm.voci : []
  g.forEach((v, i) => {
    const o = (v ?? {}) as Record<string, unknown>
    const termine = campo(o, 'termine', testo, s, { obbligatorio: true, predefinito: `voce ${i + 1}` })
    const definizione = campo(o, 'definizione', testo, s, { obbligatorio: true, predefinito: '' })
    const schede = campo(o, 'schede', elencoDiTesti, s, { predefinito: [] as string[] })
    out.push({ termine, definizione, schede })
  })
  problemi.push(...s.problemi)
  return out
}

// ---------- scheda ----------

export function idDaFile(file: string): string {
  return file.replace(/^schede\//, '').replace(/\.md$/i, '')
}

export function leggiScheda(file: string, testoFile: string, corsiaPredefinita: string, problemi: Problema[]): Scheda {
  const idFile = idDaFile(file)
  const s = new Segnalatore(file, idFile)
  const doc: DocMd = leggiDocMd(testoFile)
  if (!/^[a-z0-9_]+$/.test(idFile) || RISERVATI.test(idFile)) {
    s.avviso('id-non-valido', `Il nome file «${idFile}» non segue la regola: minuscole, cifre e underscore, senza spazi né accenti.`)
  }
  if (!doc.haFrontmatter) s.errore('frontmatter-mancante', 'Manca il frontmatter (le righe tra --- all\'inizio del file).')
  if (doc.erroreYaml) s.errore('yaml', `Il frontmatter non si legge: ${doc.erroreYaml}`)
  const fm = doc.erroreYaml ? {} : doc.fm

  const idFm = campo(fm, 'id', testo, s, { obbligatorio: doc.haFrontmatter && !doc.erroreYaml, predefinito: idFile })
  if (idFm !== idFile) s.errore('id-diverso', `L'id «${idFm}» è diverso dal nome del file «${idFile}»: uso il nome del file.`)
  const corsia = campo(fm, 'corsia', testo, s, { obbligatorio: doc.haFrontmatter && !doc.erroreYaml, predefinito: corsiaPredefinita })
  const data = campo(fm, 'data', testo, s, { obbligatorio: doc.haFrontmatter && !doc.erroreYaml, predefinito: '' })
  const breveFm = campo(fm, 'titolo_breve', testo, s, { obbligatorio: doc.haFrontmatter && !doc.erroreYaml, predefinito: '' })
  const titoloFm = campo(fm, 'titolo', testo, s, { predefinito: '' })
  const temi = campo(fm, 'temi', elencoDiTesti, s, { predefinito: [] as string[] })
  const collegamenti = campo(fm, 'collegamenti', elencoDiTesti, s, { predefinito: [] as string[] })
  const testi = campo(fm, 'testi', elencoDiTesti, s, { predefinito: [] as string[] })
  const pagine = campo(fm, 'pagine', testo, s, { predefinito: '' })
  const fuori = campo(fm, 'fuori_dal_libro', z.boolean(), s, { obbligatorio: doc.haFrontmatter && !doc.erroreYaml, predefinito: false })

  const d = parseData(data)
  if (d.err) s.errore('data-impossibile', `${d.err} La scheda resta senza posizione sulla mappa.`)
  else if (d.ambigua) {
    s.avviso(
      'data-ambigua',
      `«${data}» è letto come intervallo ${d.label}. Se intendevi un mese, scrivilo come ${data.split('-')[1]!.padStart(2, '0')}/${data.split('-')[0]}.`
    )
  }

  const sRias = trovaSezione(doc, 'Riassunto')
  const riassunto = sRias ? sRias.testo.trim() : ''
  if (!sRias) s.errore('riassunto-mancante', 'Manca la sezione «Riassunto».')
  else if (!riassunto) s.errore('riassunto-vuoto', 'La sezione «Riassunto» è vuota.')
  else {
    const righe = Math.max(riassunto.split('\n').length, Math.ceil(riassunto.length / COLONNE_RIASSUNTO))
    if (righe > 5) s.avviso('riassunto-lungo', `Il riassunto è lungo (circa ${righe} righe): dovrebbe stare in 2-4.`)
  }
  const sDett = trovaSezione(doc, 'Dettagli')
  if (!sDett) s.avviso('dettagli-mancanti', 'Manca la sezione «Dettagli».')
  const sAtt = trovaSezione(doc, 'Attenzione')
  const sTab = trovaSezione(doc, 'Tabella')

  const titoloBreve = breveFm || (doc.erroreYaml ? `⚠ ${idFile}` : idFile)
  problemi.push(...s.problemi)
  return {
    id: idFile,
    corsia,
    data,
    titolo_breve: titoloBreve,
    titolo: titoloFm || titoloBreve,
    temi,
    collegamenti,
    testi,
    pagine,
    fuori_dal_libro: fuori,
    riassunto,
    dettagli: sDett ? leggiDettagli(sDett.testo) : [],
    attenzione: sAtt ? sAtt.testo.trim() : '',
    tabella: sTab ? leggiTabella(sTab.testo) : null,
    struttura: trovaSezione(doc, 'Struttura e metrica')?.testo.trim() ?? '',
    contesto: trovaSezione(doc, 'Contesto')?.testo.trim() ?? '',
    citazioni: trovaSezione(doc, 'Citazioni chiave')?.testo.trim() ?? '',
    domande: trovaSezione(doc, 'Domande')?.testo.trim() ?? '',
    file
  }
}

// ---------- modello completo ----------

export function costruisciModello(files: MappaFile, idAutoreAtteso: string): Modello {
  const problemi: Problema[] = []
  const autore = leggiAutore(files['autore.md'], idAutoreAtteso, problemi)
  const temi = leggiTemi(files['temi.md'], problemi)
  const corsiaBase = autore.corsie[0]!.id

  const nomiSchede = Object.keys(files)
    .filter((k) => /^schede\/[^/]+\.md$/i.test(k))
    .sort()
  const schede: Scheda[] = nomiSchede.map((f) => leggiScheda(f, files[f]!, corsiaBase, problemi))

  // id duplicati nel frontmatter (con l'id = nome file non può succedere sui file, ma si segnala comunque)
  const viste = new Map<string, string>()
  for (const f of nomiSchede) {
    const doc = leggiDocMd(files[f]!)
    const id = doc.fm.id == null ? null : String(doc.fm.id)
    if (id == null) continue
    const altro = viste.get(id)
    if (altro) {
      problemi.push({ gravita: 'errore', codice: 'id-duplicato', file: f, scheda: idDaFile(f), messaggio: `L'id «${id}» è usato anche da ${altro}.` })
    } else viste.set(id, f)
  }

  const idSchede = new Set(schede.map((x) => x.id))
  const idCorsie = new Set(autore.corsie.map((c) => c.id))
  const idTemi = new Set(temi.map((t) => t.id))
  const lato = new Set<string>()
  for (const sc of schede) for (const k of sc.collegamenti) lato.add(`${sc.id}>${k}`)
  const push = (gravita: Problema['gravita'], codice: string, sc: Scheda, messaggio: string): void => {
    problemi.push({ gravita, codice, file: sc.file, scheda: sc.id, messaggio })
  }
  for (const sc of schede) {
    if (!idCorsie.has(sc.corsia)) push('errore', 'corsia-inesistente', sc, `La corsia «${sc.corsia}» non esiste in autore.md.`)
    for (const t of sc.temi) if (!idTemi.has(t)) push('errore', 'tema-inesistente', sc, `Il tema «${t}» non esiste in temi.md.`)
    for (const k of sc.collegamenti) {
      if (k.includes('/')) continue // collegamento verso un altro autore: qui non si può verificare
      if (k === sc.id) push('avviso', 'collegamento-su-se-stessa', sc, 'La scheda è collegata a se stessa.')
      else if (!idSchede.has(k)) push('errore', 'collegamento-inesistente', sc, `Il collegamento «${k}» non punta a nessuna scheda.`)
      else if (lato.has(`${k}>${sc.id}`) && sc.id < k) {
        push('avviso', 'collegamento-doppio', sc, `Il collegamento con «${k}» è scritto da entrambi i lati: ne basta uno, il reciproco lo calcola l'app.`)
      }
    }
  }

  const glossario = leggiGlossario(files['glossario.md'], problemi)
  for (const v of glossario) {
    for (const k of v.schede) {
      if (!idSchede.has(k) && !k.includes('/')) {
        problemi.push({ gravita: 'avviso', codice: 'glossario-scheda-inesistente', file: 'glossario.md', messaggio: `La voce «${v.termine}» cita la scheda «${k}», che non esiste.` })
      }
    }
  }

  // testi (editor): cartelle testi/<id>/ e dizionario condiviso delle figure retoriche
  const figure = leggiFigure(files['../../_condiviso/figure_retoriche.json'], problemi)
  const idFigure = new Set(figure.map((f) => f.id))
  const perId = new Map<string, FileTesto>()
  for (const k of Object.keys(files)) {
    const m = k.match(/^testi\/([^/]+)\/(testo\.md|annotazioni\.json|parafrasi\.json|esercizi\.json|proposta_scheda\.md)$/)
    if (!m) continue
    const f = perId.get(m[1]!) ?? { id: m[1]! }
    const campo = m[2] === 'testo.md' ? 'testo' : m[2] === 'proposta_scheda.md' ? 'proposta' : (m[2]!.replace('.json', '') as 'annotazioni' | 'parafrasi' | 'esercizi')
    f[campo] = files[k]!
    perId.set(m[1]!, f)
  }
  const testi: Testo[] = []
  for (const id of [...perId.keys()].sort()) {
    const f = perId.get(id)!
    const t = leggiTesto(f, problemi, idFigure)
    if (t) {
      if (f.proposta != null) t.proposta = leggiProposta(id, f.proposta, { temi: new Set(temi.map((x) => x.id)), corsie: new Set(autore.corsie.map((c) => c.id)), corpo: t.corpo })
      testi.push(t)
    }
  }
  controllaTesti(testi, idSchede, problemi)
  const idTesti = new Set(testi.map((t) => t.id))
  for (const sc of schede) {
    for (const k of sc.testi) {
      if (!idTesti.has(k)) push('avviso', 'testo-inesistente', sc, `La scheda cita il testo «${k}», che non esiste in testi/.`)
    }
  }

  const ordine = { errore: 0, avviso: 1 } as const
  problemi.sort((a, b) => ordine[a.gravita] - ordine[b.gravita] || a.file.localeCompare(b.file) || a.codice.localeCompare(b.codice))
  return { autore, temi, glossario, schede, testi, figure, problemi }
}
