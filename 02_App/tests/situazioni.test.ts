import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { cp } from 'node:fs/promises'
import { beforeEach, describe, expect, it } from 'vitest'
import { leggiAlbero } from '../src/main/esplora'
import { leggiSituazioni, segnaRipassata } from '../src/main/situazioni'
import { controllaSituazioni, leggiIndice, leggiSchedaSit, ordineSchede } from '../src/shared/situazioni'

const REL = 'Telecomunicazioni/MikroTik/MikroTik per situazioni'
let radice = ''

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-sit-'))
  // copia dei dati veri: i test non toccano mai la cartella dell'utente
  await cp(resolve(__dirname, '..', '..', '01_Argomenti', 'Telecomunicazioni'), join(radice, '01_Argomenti', 'Telecomunicazioni'), { recursive: true })
})

describe('Per situazioni: dati veri di MikroTik', () => {
  it('legge tutte le 51 schede senza avvisi e con 10 rami', async () => {
    const d = await leggiSituazioni(radice, REL)
    expect(d.avvisi).toEqual([])
    expect(Object.keys(d.schede)).toHaveLength(51)
    expect(d.indice.rami).toHaveLength(10)
    expect(ordineSchede(d.indice)).toHaveLength(51)
    expect(d.schede['bridge-unico']!.tipo).toBe('prima_dopo')
    expect(d.schede['dhcp-server']!.tipo).toBe('ricetta')
  })

  it('ogni segnaposto usato nel codice è spiegato, e ogni scheda vicina esiste', async () => {
    const d = await leggiSituazioni(radice, REL)
    expect(controllaSituazioni(d.indice, d.schede)).toEqual([])
  })

  it('compare nell\'albero come documento che non si esplora', async () => {
    const a = await leggiAlbero(radice)
    const mikrotik = a.find((n) => n.nome === 'Telecomunicazioni')!.figli.find((n) => n.nome === 'MikroTik')!
    const doc = mikrotik.figli.find((n) => n.tipo === 'situazioni')!
    expect(doc.tipo).toBe('situazioni')
    expect(doc.nome).toBe('MikroTik per situazioni')
    expect(doc.info).toBe('51 situazioni')
    expect(doc.figli).toEqual([])
    expect(doc.puoRinominare && doc.puoArchiviare).toBe(true)
  })

  it('segna e toglie «ripassata» e il file resta valido', async () => {
    expect(await segnaRipassata(radice, REL, 'accesso', true)).toEqual(['accesso'])
    expect(await segnaRipassata(radice, REL, 'menu', true)).toEqual(['accesso', 'menu'])
    expect((await leggiSituazioni(radice, REL)).ripassate).toEqual(['accesso', 'menu'])
    expect(await segnaRipassata(radice, REL, 'accesso', false)).toEqual(['menu'])
    const j = JSON.parse(await readFile(join(radice, '01_Argomenti', REL, 'progresso.json'), 'utf8')) as { ripassate: string[] }
    expect(j.ripassate).toEqual(['menu'])
  })

  it('ignora nel progresso le schede che non esistono più', async () => {
    await writeFile(join(radice, '01_Argomenti', REL, 'progresso.json'), JSON.stringify({ ripassate: ['accesso', 'fantasma'] }))
    expect((await leggiSituazioni(radice, REL)).ripassate).toEqual(['accesso'])
  })

  it('rifiuta percorsi che escono dalla cartella o toccano cartelle dell\'app', async () => {
    await expect(leggiSituazioni(radice, '../fuori')).rejects.toThrow()
    await expect(segnaRipassata(radice, '99_Archivio/x', 'a', true)).rejects.toThrow()
    await expect(segnaRipassata(radice, REL, '../x', true)).rejects.toThrow()
  })
})

describe('Per situazioni: file sbagliati danno messaggi chiari', () => {
  it('indice illeggibile o con colore inesistente', () => {
    expect(leggiIndice('modello: per_situazioni\ntitolo: x\ncentro: y\nrami:\n- id: a\n  nome: A\n  colore: fucsia\n  lato: L\n  voci:\n  - schede: [x]\n').errore).toMatch(/colore/)
    expect(leggiIndice('::: non yaml [').errore).toMatch(/indice\.yaml/)
    const base = 'modello: per_situazioni\ntitolo: x\ncentro: y\nrami:\n- id: a\n  nome: A\n  colore: red\n  lato: L\n  voci:\n  - schede: [x]\n'
    expect(leggiIndice(base).indice?.prefissoCommento).toBe('#')
    expect(leggiIndice(base + 'prefissoCommento: //\nesempiRicerca: timer\n').indice).toMatchObject({ prefissoCommento: '//', esempiRicerca: 'timer' })
  })
  it('scheda con id diverso dal nome del file, o senza fasi', () => {
    const ok = 'id: a\ntipo: ricetta\ntitolo: T\nsigla: S\ncomando: c\nfrase: f\nquando: q\nfasi:\n- nome: n\n  righe:\n  - codice: x\n'
    expect(leggiSchedaSit(ok, 'a.yaml').scheda?.id).toBe('a')
    expect(leggiSchedaSit(ok, 'b.yaml').errore).toMatch(/non corrisponde/)
    expect(leggiSchedaSit(ok.replace(/fasi:[\s\S]*/, 'fasi: []\n'), 'a.yaml').errore).toMatch(/fasi/)
  })
  it('segnala schede citate ma assenti e segnaposto non spiegati', async () => {
    const dir = join(radice, '01_Argomenti', 'x', 'doc')
    await mkdir(join(dir, 'schede'), { recursive: true })
    await writeFile(join(dir, 'indice.yaml'), 'modello: per_situazioni\ntitolo: T\ncentro: C\nrami:\n- id: a\n  nome: A\n  colore: red\n  lato: L\n  voci:\n  - schede: [uno, due]\n')
    await writeFile(join(dir, 'schede', 'uno.yaml'), 'id: uno\ntipo: ricetta\ntitolo: T\nsigla: S\ncomando: c\nfrase: f\nquando: q\nfasi:\n- nome: n\n  righe:\n  - codice: ping «HOST»\nvicine: [boh]\n')
    const d = await leggiSituazioni(radice, 'x/doc')
    expect(d.avvisi.join('\n')).toMatch(/«due»/)
    expect(d.avvisi.join('\n')).toMatch(/«HOST»/)
    expect(d.avvisi.join('\n')).toMatch(/«boh»/)
  })

  it('legge una figura (schema dei pin) e segnala famiglie e schede che non esistono', () => {
    const src = `id: pin
tipo: figura
titolo: Schema
sigla: Pin
comando: Scheda
frase: x
quando: y
disegno:
  modello: scheda_pin
  nome: Scheda
  famiglie:
  - {id: adc, nome: ADC, colore: orange, schede: [manca]}
  sinistra:
  - {etichetta: D34, gpio: '34', famiglie: [adc, nonesiste], schede: [altra]}
  destra:
  - {etichetta: GND}
`
    const r = leggiSchedaSit(src, 'pin.yaml')
    expect(r.errore).toBeUndefined()
    expect(r.scheda?.tipo).toBe('figura')
    const idx = leggiIndice('modello: per_situazioni\ntitolo: x\ncentro: y\nrami:\n- id: a\n  nome: A\n  colore: red\n  lato: L\n  voci:\n  - schede: [pin]\n').indice!
    const av = controllaSituazioni(idx, { pin: r.scheda! })
    expect(av.join('|')).toMatch(/«manca»/)
    expect(av.join('|')).toMatch(/nonesiste/)
    expect(av.join('|')).toMatch(/«altra»/)
    expect(leggiSchedaSit(src.replace('modello: scheda_pin', 'modello: altro'), 'pin.yaml').errore).toMatch(/modello/)
  })
})
