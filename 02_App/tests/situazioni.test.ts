import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { cp } from 'node:fs/promises'
import { beforeEach, describe, expect, it } from 'vitest'
import { leggiAlbero } from '../src/main/esplora'
import { leggiSituazioni, segnaRipassata } from '../src/main/situazioni'
import { controllaSituazioni, leggiIndice, leggiSchedaSit, ordineSchede } from '../src/shared/situazioni'

const REL = 'informatica/reti/MikroTik per situazioni'
let radice = ''

beforeEach(async () => {
  radice = await mkdtemp(join(tmpdir(), 'kt-sit-'))
  // copia dei dati veri: i test non toccano mai la cartella dell'utente
  await cp(resolve(__dirname, '..', '..', '01_Argomenti', 'informatica'), join(radice, '01_Argomenti', 'informatica'), { recursive: true })
})

describe('Per situazioni: dati veri di MikroTik', () => {
  it('legge tutte le 37 schede senza avvisi e con 9 rami', async () => {
    const d = await leggiSituazioni(radice, REL)
    expect(d.avvisi).toEqual([])
    expect(Object.keys(d.schede)).toHaveLength(37)
    expect(d.indice.rami).toHaveLength(9)
    expect(ordineSchede(d.indice)).toHaveLength(37)
    expect(d.schede['bridge-unico']!.tipo).toBe('prima_dopo')
    expect(d.schede['dhcp-server']!.tipo).toBe('ricetta')
  })

  it('ogni segnaposto usato nel codice è spiegato, e ogni scheda vicina esiste', async () => {
    const d = await leggiSituazioni(radice, REL)
    expect(controllaSituazioni(d.indice, d.schede)).toEqual([])
  })

  it('compare nell\'albero come documento che non si esplora', async () => {
    const a = await leggiAlbero(radice)
    const reti = a.find((n) => n.nome === 'informatica')!.figli.find((n) => n.nome === 'reti')!
    const doc = reti.figli[0]!
    expect(doc.tipo).toBe('situazioni')
    expect(doc.nome).toBe('MikroTik per situazioni')
    expect(doc.info).toBe('37 situazioni')
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
})
