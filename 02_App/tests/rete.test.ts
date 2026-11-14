import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { controllaSituazioni, leggiSchedaSit, schemaDisegnoRete, type DisegnoRete } from '../src/shared/situazioni'
import { controllaRete, disponiRete, larghezzaNodo, testoRete } from '../src/shared/rete'

const PROVE = resolve(__dirname, '..', '..', '00_Control', 'specifiche', 'prove', 'rete')
const intestazione = (id: string): string => `id: ${id}\ntitolo: Prova\nsigla: P\ncomando: x\nfrase: ''\nquando: q\n`
const carica = (f: string): string => intestazione('prova-rete') + readFileSync(resolve(PROVE, f), 'utf8')
const rete = (f: string): DisegnoRete => {
  const r = leggiSchedaSit(carica(f), 'prova-rete.yaml')
  expect(r.errore).toBeUndefined()
  const s = r.scheda!
  if (s.tipo !== 'figura' || s.disegno.modello !== 'rete') throw new Error('non è una figura di rete')
  return s.disegno
}

describe('Disegno «rete»: le due prove a mano', () => {
  it.each(['01_intervlan_routing.yaml', '02_vlan_vm_hap.yaml'])('%s si legge e non ha avvisi', (f) => {
    const d = rete(f)
    expect(controllaRete(d)).toEqual([])
    const indice = { modello: 'per_situazioni', vista: 'situazioni', titolo: 't', centro: 'c', sottotitolo: '', prefissoCommento: '#', esempiRicerca: '', ingresso: '', guida: '', rami: [{ id: 'b1', nome: 'r', colore: 'red', lato: 'R', ordine: false, quando: '', voci: [{ schede: ['prova-rete'] }] }] }
    expect(controllaSituazioni(indice as never, { 'prova-rete': leggiSchedaSit(carica(f), 'prova-rete.yaml').scheda! })).toEqual([])
  })

  it('InterVlanRouting: 6 nodi, 5 cavi, il trunk ha 3 strisce e gli access una', () => {
    const p = disponiRete(rete('01_intervlan_routing.yaml'))
    expect(p.nodi).toHaveLength(6)
    expect(p.cavi).toHaveLength(5)
    expect(p.cavi.find((c) => c.tipo === 'trunk')!.strisce).toEqual([10, 20, 30])
    expect(p.cavi.filter((c) => c.tipo === 'access').map((c) => c.strisce)).toEqual([[10], [20], [30]])
    expect(p.cavi.find((c) => c.da === 'net')!.strisce).toEqual([0])
  })

  it('le righe vanno dall’alto in basso e i nodi di una riga non si sovrappongono', () => {
    const p = disponiRete(rete('01_intervlan_routing.yaml'))
    const y = (id: string): number => p.nodi.find((n) => n.id === id)!.y
    expect(y('net')).toBeLessThan(y('r1'))
    expect(y('r1')).toBeLessThan(y('s1'))
    expect(y('s1')).toBeLessThan(y('p10'))
    const riga = p.nodi.filter((n) => n.y === y('p10')).sort((a, b) => a.x - b.x)
    for (let i = 1; i < riga.length; i++) expect(riga[i]!.x - riga[i]!.w / 2).toBeGreaterThan(riga[i - 1]!.x + riga[i - 1]!.w / 2)
    for (const n of p.nodi) { expect(n.x - n.w / 2).toBeGreaterThanOrEqual(0); expect(n.x + n.w / 2).toBeLessThanOrEqual(p.larghezza) }
  })

  it('il capo del cavo sta sul bordo del nodo, verso l’altro nodo', () => {
    const p = disponiRete(rete('01_intervlan_routing.yaml'))
    const r1 = p.nodi.find((n) => n.id === 'r1')!, s1 = p.nodi.find((n) => n.id === 's1')!
    const c = p.cavi.find((x) => x.da === 'r1')!
    expect(c.yd).toBe(r1.y + r1.h / 2)
    expect(c.ya).toBe(s1.y - s1.h / 2)
  })

  it('la ricerca trova porte, indirizzi e VLAN', () => {
    const t = testoRete(rete('02_vlan_vm_hap.yaml'))
    expect(t).toContain('ether4')
    expect(t).toContain('.254')
    expect(t).toContain('hAP ac lite')
    expect(t).toContain('vlan20')
  })
})

describe('Disegno «rete»: avvisi', () => {
  const d0 = (): DisegnoRete => schemaDisegnoRete.parse(YAML.parse(`
modello: rete
vlan: [{ id: 10, nome: a, colore: blue }]
nodi:
  - [{ id: a, nome: A }]
  - [{ id: b, nome: B }]
  - [{ id: c, nome: C }]
cavi:
  - { da: a, a: b, access: 10 }
  - { da: b, a: c, trunk: [10] }
`))

  it('uno schema a posto non ha avvisi', () => expect(controllaRete(d0())).toEqual([]))
  it('nodo che non esiste', () => { const d = d0(); d.cavi[0]!.a = 'zz'; expect(controllaRete(d).join(' ')).toMatch(/«zz».*non esiste/) })
  it('righe non vicine: avviso e il cavo non si disegna', () => {
    const d = d0(); d.cavi.push({ da: 'a', a: 'c', porta_da: '', porta_a: '', ip_da: '', ip_a: '' })
    expect(controllaRete(d).join(' ')).toMatch(/righe vicine/)
    expect(disponiRete(d).cavi).toHaveLength(2)
  })
  it('VLAN non dichiarata, id doppio e nodo senza cavi', () => {
    const d = d0(); d.cavi[0]!.access = 99; d.nodi[2]!.push({ id: 'a', nome: 'doppio', tipo: 'pc', sotto: '' }); d.nodi.push([{ id: 'solo', nome: 'S', tipo: 'pc', sotto: '' }])
    const m = controllaRete(d).join(' | ')
    expect(m).toMatch(/VLAN 99/); expect(m).toMatch(/«a» compare due volte/); expect(m).toMatch(/«solo» non ha nessun cavo/)
  })
  it('access e trunk insieme: conta il trunk', () => {
    const d = d0(); d.cavi[1]!.access = 10
    expect(controllaRete(d).join(' ')).toMatch(/sia access sia trunk/)
    expect(disponiRete(d).cavi[1]!.tipo).toBe('trunk')
  })
  it('lo schema rifiuta un cavo senza «da» o un colore sconosciuto', () => {
    const src = carica('01_intervlan_routing.yaml')
    expect(leggiSchedaSit(src.replace('colore: blue', 'colore: celeste'), 'x.yaml').errore).toBeTruthy()
    expect(leggiSchedaSit(src.replace('{ da: net, a: r1,', '{ a: r1,'), 'x.yaml').errore).toBeTruthy()
  })
})

describe('Disegno «rete»: larghezza dei riquadri', () => {
  it('cresce con il testo ma non sfora lo spazio della riga; la nuvola può essere più larga', () => {
    expect(larghezzaNodo('A', '', 166, 'pc')).toBe(150)
    expect(larghezzaNodo('dhcp-server su br-vlan20 e br-vlan30', 'x', 400, 'router')).toBeGreaterThan(250)
    expect(larghezzaNodo('un nome molto molto lungo per un nodo', '', 166, 'pc')).toBe(166)
    expect(larghezzaNodo('192.168.24.0/24', 'management', 166, 'nuvola')).toBeGreaterThan(166)
  })
})
