/*
 * Conversione della mappa HTML di Leopardi nel formato a file di
 * 00_Control/specifiche/formato_studio_italiano.md.
 *
 * Uso:  node convert_leopardi.cjs <mappa.html> <cartella_autore_destinazione>
 *
 * Non inventa contenuti: schede, dettagli, avvisi, pagine, temi e glossario
 * sono quelli della mappa. Le sintesi restano di una riga (poi si allungano
 * a parte). I collegamenti si scrivono da un lato solo.
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const YAML = require('yaml')

const [, , srcHtml, outDir] = process.argv
if (!srcHtml || !outDir) {
  console.error('Uso: node convert_leopardi.cjs <mappa.html> <cartella_autore>')
  process.exit(1)
}

// ---------- 1. estrazione dei dati dallo <script> della mappa ----------
const html = fs.readFileSync(srcHtml, 'utf8')
const start = html.indexOf('/* ============== DATI ============== */')
const endMarker = 'var byId={},adj={};'
const end = html.indexOf(endMarker)
if (start < 0 || end < 0) throw new Error('Struttura dello script non riconosciuta')
// prendo i dati fino al blocco "var RS" incluso, senza la parte di interfaccia
const code = html.slice(start, end)
const ctx = {}
vm.createContext(ctx)
vm.runInContext(code + '\n;this.out={NODES,LANES,GLOSS,GLOSS_EXTRA,THEMES,RS};', ctx)
const { NODES, LANES, GLOSS, GLOSS_EXTRA, THEMES, RS } = ctx.out

// ---------- 2. tabelle di corrispondenza ----------
// id e tonalità/sigle: quelli dell'esempio di autore.md nella specifica
const CORSIE = [
  { k: 'x', id: 'contesto', nome: 'Contesto storico', sigla: 'CTX', tonalita: 220 },
  { k: 'v', id: 'vita', nome: 'Vita e luoghi', sigla: 'VIT', tonalita: 150 },
  { k: 'p', id: 'persone', nome: 'Persone e influenze', sigla: 'PER', tonalita: 30 },
  { k: 'f', id: 'pensiero', nome: 'Pensiero', sigla: 'PEN', tonalita: 290 },
  { k: 'c', id: 'canti', nome: 'Canti', sigla: 'CAN', tonalita: 80 },
  { k: 'r', id: 'prose', nome: 'Prose ed edizioni', sigla: 'PRO', tonalita: 340 }
]
const laneId = Object.fromEntries(CORSIE.map(c => [c.k, c.id]))
for (const L of LANES) if (!laneId[L.k]) throw new Error('Corsia sconosciuta ' + L.k)

// periodi: quelli della demo della Home (03_Demo/home_autore)
const PERIODI = [
  { nome: '1798 Studi', data: '1798' },
  { nome: '1816 Conversione', data: '1816' },
  { nome: '1819 Idilli e Canzoni', data: '1819' },
  { nome: '1822 Roma e Operette', data: '1822' },
  { nome: '1827 Firenze e Pisa', data: '03/1827' },
  { nome: '1830 Aspasia e Napoli', data: '1830' },
  { nome: 'Dopo il 1837', data: '1838' }
]

const MESI = { gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, sett: 9, ott: 10, nov: 11, dic: 12 }
const mm = n => String(n).padStart(2, '0')
const mese = w => MESI[w.toLowerCase().replace(/\.$/, '')]

/** Etichetta della mappa -> campo `data` della specifica. Non si indovina:
 *  se l'etichetta non è una data scritta con mesi abbreviati, resta com'è. */
function convertiData(yl) {
  const s = yl.trim()
  if (s === '—' || s === '') return ''
  if (/^\d{4}(-\d{4})?$/.test(s)) return s
  let m = s.match(/^(\d{1,2})\s+(\p{L}+)\.?\s+(\d{4})$/u)
  if (m && mese(m[2])) return `${mm(m[1])}/${mm(mese(m[2]))}/${m[3]}`
  m = s.match(/^(\p{L}+)\.?-(\p{L}+)\.?\s+(\d{4})$/u) // "Lug.-sett. 1825"
  if (m && mese(m[1]) && mese(m[2])) return `${mm(mese(m[1]))}/${m[3]}-${mm(mese(m[2]))}/${m[3]}`
  const parti = s.split(/\s+-\s+/)
  const conv = p => {
    if (/^\d{4}$/.test(p)) return p
    const q = p.match(/^(\p{L}+)\.?\s+(\d{4})$/u)
    return q && mese(q[1]) ? `${mm(mese(q[1]))}/${q[2]}` : null
  }
  const out = parti.map(conv)
  if (out.every(x => x)) return out.join('-')
  return s // testo libero, lo interpreta l'app
}

// ---------- 3. collegamenti: un lato solo ----------
const byId = Object.fromEntries(NODES.map((n, i) => [n.id, { ...n, ord: i }]))
const diretti = new Set()
for (const n of NODES) for (const m of n.k) if (byId[m] && m !== n.id) diretti.add(`${n.id}>${m}`)
const proprietario = new Map() // id -> [collegamenti]
NODES.forEach(n => proprietario.set(n.id, []))
const viste = new Set()
let coppie = 0
for (const n of NODES) {
  for (const m of n.k) {
    if (!byId[m] || m === n.id) continue
    const chiave = [n.id, m].sort().join('|')
    if (viste.has(chiave)) continue
    viste.add(chiave)
    coppie++
    // se citata da un solo lato resta lì; se da entrambi la scrive la scheda che viene prima nella mappa
    const reciproca = diretti.has(`${m}>${n.id}`)
    const a = reciproca && byId[m].ord < byId[n.id].ord ? m : n.id
    const b = a === n.id ? m : n.id
    proprietario.get(a).push(b)
  }
}
// ordine dei collegamenti: come nell'originale
for (const n of NODES) {
  const mie = new Set(proprietario.get(n.id))
  proprietario.set(n.id, n.k.filter(x => mie.has(x)))
}

// ---------- 4. scrittura ----------
// liste di soli valori semplici in una riga; mappe brevi (corsie, periodi, temi) in una riga ciascuna
const front = (obj, { mappeInRiga = false } = {}) => {
  const doc = new YAML.Document(obj)
  YAML.visit(doc, {
    Seq(_, node) {
      if (node.items.every(i => YAML.isScalar(i))) node.flow = true
    },
    Map(_, node, pathNodes) {
      if (mappeInRiga && YAML.isSeq(pathNodes[pathNodes.length - 1])) node.flow = true
    }
  })
  return YAML.stringify(doc, { lineWidth: 0, flowCollectionPadding: true }).trimEnd()
}
const scrivi = (rel, testo) => {
  const p = path.join(outDir, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, testo.replace(/\r\n/g, '\n'), 'utf8')
}
const temiDi = id => THEMES.filter(t => t.ids.includes(id)).map(t => t.k)

const RISERVATI = /^(con|prn|aux|nul|com\d|lpt\d)$/i
const rapporto = { schede: 0, collegamenti_scritti: 0, rows: 0, ext: 0, data_testo: [], data_convertite: [], senza_data: [], titolo_uguale: 0 }

for (const n of NODES) {
  if (!/^[a-z0-9_]+$/.test(n.id) || RISERVATI.test(n.id)) throw new Error('Id non valido come nome file: ' + n.id)
  const data = convertiData(n.yl)
  if (data === '') rapporto.senza_data.push(n.id)
  else if (data !== n.yl) rapporto.data_convertite.push(`${n.id}: "${n.yl}" -> "${data}"`)
  else if (!/\d/.test(data)) rapporto.data_testo.push(`${n.id}: "${data}"`)

  const fm = {
    id: n.id,
    corsia: laneId[n.l],
    data,
    titolo_breve: n.s
  }
  if (n.t && n.t !== n.s) fm.titolo = n.t
  else rapporto.titolo_uguale++
  const temi = temiDi(n.id)
  if (temi.length) fm.temi = temi
  const coll = proprietario.get(n.id)
  if (coll.length) fm.collegamenti = coll
  if (n.pg) fm.pagine = n.pg
  fm.fuori_dal_libro = !!n.ext
  if (n.ext) rapporto.ext++
  rapporto.collegamenti_scritti += coll.length

  const riassunto = RS[n.id] || n.d[0].replace(/\*/g, '')
  let corpo = `## Riassunto\n${riassunto}\n\n## Dettagli\n${n.d.map(r => '- ' + r).join('\n')}\n`
  if (n.w) corpo += `\n## Attenzione\n${n.w}\n`
  if (n.rows) {
    rapporto.rows++
    corpo += `\n## Tabella\nLe 24 operette, nell'ordine dell'edizione del 1845\n\n| Titolo | Sintesi |\n|---|---|\n` +
      n.rows.map(r => `| ${r[0].replace(/\|/g, '\\|')} | ${r[1].replace(/\|/g, '\\|')} |`).join('\n') + '\n'
  }
  scrivi(`schede/${n.id}.md`, `---\n${front(fm)}\n---\n\n${corpo}`)
  rapporto.schede++
}

// autore.md
scrivi('autore.md', `---\n${front({
  id: 'leopardi',
  nome: 'Giacomo Leopardi',
  nascita: 1798,
  morte: 1837,
  corsie: CORSIE.map(c => ({ id: c.id, nome: c.nome, sigla: c.sigla, tonalita: c.tonalita })),
  periodi: PERIODI
}, { mappeInRiga: true })}\n---\n`)

// temi.md (nessun colore: la mappa non lo prevede)
scrivi('temi.md', `---\n${front({ temi: THEMES.map(t => ({ id: t.k, nome: t.n })) }, { mappeInRiga: true })}\n---\n`)

// glossario.md: le 32 voci della mappa (le altre 3 sono "conoscenza generale", vedi il rapporto)
const CORE = GLOSS.length // 32 voci nella mappa; GLOSS_EXTRA sono altre 3, aggiunte a parte
const idOk = id => !!byId[id]
const mancanti = []
const voci = GLOSS.slice(0, CORE).map(([termine, definizione, schede]) => {
  schede.filter(s => !idOk(s)).forEach(s => mancanti.push(`${termine}: ${s}`))
  return { termine, definizione, schede: schede.filter(idOk) }
})
scrivi('glossario.md', `---\n${front({ voci })}\n---\n`)

// ---------- 5. rapporto ----------
rapporto.coppie_uniche = coppie
rapporto.voci_glossario = voci.length
rapporto.temi = THEMES.length
rapporto.glossario_extra_non_importato = GLOSS_EXTRA.map(g => g[0])
rapporto.glossario_riferimenti_inesistenti = mancanti
console.log(JSON.stringify(rapporto, null, 2))
