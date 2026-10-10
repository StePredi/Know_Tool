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
  mostraCartella: () => ipcRenderer.invoke('cartella:mostra'),
  zoom: (f) => webFrame.setZoomFactor(f),
  onModello: (cb) => {
    const h = (_: unknown, e: EventoModello): void => cb(e)
    ipcRenderer.on('modello:cambiato', h)
    return () => ipcRenderer.removeListener('modello:cambiato', h)
  }
}

contextBridge.exposeInMainWorld('api', api)
