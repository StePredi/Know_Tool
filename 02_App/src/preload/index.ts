import { contextBridge, ipcRenderer, webFrame } from 'electron'
import type { Api, EventoModello } from '../shared/types'

const api: Api = {
  stato: () => ipcRenderer.invoke('stato:ottieni'),
  scegliRadice: () => ipcRenderer.invoke('radice:scegli'),
  scegliAutore: (id) => ipcRenderer.invoke('autore:scegli', id),
  aggiornaScheda: (id, patch) => ipcRenderer.invoke('scheda:aggiorna', id, patch),
  creaScheda: (n) => ipcRenderer.invoke('scheda:crea', n),
  eliminaScheda: (id) => ipcRenderer.invoke('scheda:elimina', id),
  duplicaScheda: (id) => ipcRenderer.invoke('scheda:duplica', id),
  aggiornaAutore: (p) => ipcRenderer.invoke('autore:aggiorna', p),
  aggiornaTemi: (t) => ipcRenderer.invoke('temi:aggiorna', t),
  applicaProposta: (id, scelte) => ipcRenderer.invoke('proposta:applica', id, scelte),
  scartaProposta: (id) => ipcRenderer.invoke('proposta:scarta', id),
  eliminaTema: (id) => ipcRenderer.invoke('tema:elimina', id),
  eliminaCorsia: (id, verso) => ipcRenderer.invoke('corsia:elimina', id, verso),
  mostraCartella: () => ipcRenderer.invoke('cartella:mostra'),
  albero: () => ipcRenderer.invoke('albero:leggi'),
  leggiSituazioni: (rel) => ipcRenderer.invoke('situazioni:leggi', rel),
  segnaRipassata: (rel, id, v) => ipcRenderer.invoke('situazioni:ripassata', rel, id, v),
  leggiMateriaStoria: (materia) => ipcRenderer.invoke('storia:materia', materia),
  leggiAppunto: (rel) => ipcRenderer.invoke('appunti:leggi', rel),
  leggiSorgente: (rel) => ipcRenderer.invoke('modifica:leggi', rel),
  salvaSorgente: (rel, testo, m, forza) => ipcRenderer.invoke('modifica:salva', rel, testo, m, forza ?? false),
  creaFile: (rel, testo) => ipcRenderer.invoke('modifica:crea', rel, testo),
  archiviaFile: (rel) => ipcRenderer.invoke('modifica:archivia', rel),
  apriFile: (rel) => ipcRenderer.invoke('appunti:apriFile', rel),
  apriFonte: (dal, citato) => ipcRenderer.invoke('appunti:apri', dal, citato),
  creaSituazioni: (p, n) => ipcRenderer.invoke('albero:creaSituazioni', p, n),
  creaMatematica: (p, n) => ipcRenderer.invoke('albero:creaMatematica', p, n),
  creaAppunto: (p, n) => ipcRenderer.invoke('albero:creaAppunto', p, n),
  creaNodo: (p, n) => ipcRenderer.invoke('albero:crea', p, n),
  rinominaNodo: (r, n) => ipcRenderer.invoke('albero:rinomina', r, n),
  archiviaNodo: (r) => ipcRenderer.invoke('albero:archivia', r),
  creaTesto: (n) => ipcRenderer.invoke('testo:crea', n),
  eliminaTesto: (id) => ipcRenderer.invoke('testo:elimina', id),
  aggiornaTesto: (id, p) => ipcRenderer.invoke('testo:aggiorna', id, p),
  modificaCorpo: (id, c) => ipcRenderer.invoke('testo:corpo', id, c),
  salvaVoce: (t, r, v) => ipcRenderer.invoke('voce:salva', t, r, v),
  eliminaVoce: (t, r, id) => ipcRenderer.invoke('voce:elimina', t, r, id),
  salvaRaccolta: (t, r, v) => ipcRenderer.invoke('raccolta:salva', t, r, v),
  zoom: (f) => webFrame.setZoomFactor(f),
  onModello: (cb) => {
    const h = (_: unknown, e: EventoModello): void => cb(e)
    ipcRenderer.on('modello:cambiato', h)
    return () => ipcRenderer.removeListener('modello:cambiato', h)
  }
}

contextBridge.exposeInMainWorld('api', api)
