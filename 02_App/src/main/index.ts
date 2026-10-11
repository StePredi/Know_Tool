// Processo principale: finestra, scelta della cartella, ponte (IPC) verso l'interfaccia.
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { existsSync, promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Repository } from './repository'
import type { StatoApp } from '../shared/types'

const qui = dirname(fileURLToPath(import.meta.url))
const fileConfig = (): string => join(app.getPath('userData'), 'config.json')

interface Config {
  radice?: string
  autore?: string
}

async function leggiConfig(): Promise<Config> {
  try {
    return JSON.parse(await fs.readFile(fileConfig(), 'utf8')) as Config
  } catch {
    return {}
  }
}
async function scriviConfig(c: Config): Promise<void> {
  try {
    await fs.mkdir(app.getPath('userData'), { recursive: true })
    await fs.writeFile(fileConfig(), JSON.stringify(c, null, 2), 'utf8')
  } catch {
    // la configurazione è un comfort: se non si scrive, l'app funziona lo stesso
  }
}

const èRadice = (p: string): boolean => existsSync(join(p, '01_Argomenti'))

/** Ordine: variabile KNOW_TOOL_ROOT → ultima cartella usata → cartella sopra 02_App in sviluppo. */
async function trovaRadice(cfg: Config): Promise<string | null> {
  const env = process.env.KNOW_TOOL_ROOT
  if (env && èRadice(env)) return env
  if (cfg.radice && èRadice(cfg.radice)) return cfg.radice
  const sopra = join(process.cwd(), '..')
  if (!app.isPackaged && èRadice(sopra)) return sopra
  return null
}

let finestra: BrowserWindow | null = null
let repo: Repository | null = null
let stopAscolto: (() => void) | null = null
let radice: string | null = null
let config: Config = {}

async function chiudiRepo(): Promise<void> {
  stopAscolto?.()
  stopAscolto = null
  await repo?.ferma()
  repo = null
}

async function apri(nuovaRadice: string | null, autorePreferito?: string): Promise<StatoApp> {
  await chiudiRepo()
  radice = nuovaRadice
  if (!radice) return { radice: null, autori: [], autoreId: null, modello: null, errore: null }
  const autori = await Repository.elencaAutori(radice)
  if (!autori.length) {
    return {
      radice,
      autori,
      autoreId: null,
      modello: null,
      errore: 'Nella cartella non ho trovato nessun autore (01_Argomenti/italiano/autori/<autore>/autore.md).'
    }
  }
  const id = autori.find((a) => a.id === autorePreferito)?.id ?? autori[0]!.id
  try {
    const r = new Repository(radice, id)
    await r.carica()
    r.avvia()
    stopAscolto = r.onCambio((e) => finestra?.webContents.send('modello:cambiato', e))
    repo = r
    config = { radice, autore: id }
    await scriviConfig(config)
    return { radice, autori, autoreId: id, modello: r.modello(), errore: null }
  } catch (e) {
    return { radice, autori, autoreId: id, modello: null, errore: `Non riesco a leggere la cartella: ${(e as Error).message}` }
  }
}

function creaFinestra(): void {
  finestra = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 980,
    minHeight: 640,
    title: 'Know Tool',
    backgroundColor: '#f6f5f1',
    webPreferences: {
      preload: join(qui, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })
  finestra.setMenuBarVisibility(false)
  finestra.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  if (process.env.ELECTRON_RENDERER_URL) void finestra.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void finestra.loadFile(join(qui, '../renderer/index.html'))
  finestra.on('closed', () => (finestra = null))
}

function registraIpc(): void {
  const serve = (): Repository => {
    if (!repo) throw new Error('Nessun autore aperto.')
    return repo
  }
  ipcMain.handle('stato:ottieni', async () => {
    if (repo && radice) {
      const autori = await Repository.elencaAutori(radice)
      return { radice, autori, autoreId: repo.autoreId, modello: repo.modello(), errore: null } satisfies StatoApp
    }
    return apri(await trovaRadice(config), config.autore)
  })
  ipcMain.handle('radice:scegli', async () => {
    const r = await dialog.showOpenDialog({
      title: 'Scegli la cartella Know_Tool',
      properties: ['openDirectory']
    })
    if (r.canceled || !r.filePaths[0]) return apri(radice, config.autore)
    const p = r.filePaths[0]
    if (!èRadice(p)) {
      const s = await apri(radice, config.autore)
      return { ...s, errore: `«${p}» non sembra la cartella Know_Tool: dentro non c'è 01_Argomenti.` }
    }
    return apri(p)
  })
  ipcMain.handle('autore:scegli', (_e, id: string) => (radice ? apri(radice, id) : apri(null)))
  ipcMain.handle('scheda:aggiorna', (_e, id: string, patch) => serve().aggiornaScheda(id, patch))
  ipcMain.handle('scheda:crea', (_e, nuova) => serve().creaScheda(nuova))
  ipcMain.handle('testo:crea', (_e, n) => serve().creaTesto(n))
  ipcMain.handle('testo:elimina', (_e, id: string) => serve().eliminaTesto(id))
  ipcMain.handle('testo:aggiorna', (_e, id: string, p) => serve().aggiornaTesto(id, p))
  ipcMain.handle('testo:corpo', (_e, id: string, c: string) => serve().modificaCorpo(id, c))
  ipcMain.handle('voce:salva', (_e, t: string, r, v) => serve().salvaVoce(t, r, v))
  ipcMain.handle('voce:elimina', (_e, t: string, r, id: string) => serve().eliminaVoce(t, r, id))
  ipcMain.handle('raccolta:salva', (_e, t: string, r, v) => serve().salvaRaccolta(t, r, v))
  ipcMain.handle('scheda:elimina', (_e, id: string) => serve().eliminaScheda(id))
  ipcMain.handle('scheda:duplica', (_e, id: string) => serve().duplicaScheda(id))
  ipcMain.handle('autore:aggiorna', (_e, patch) => serve().aggiornaAutore(patch))
  ipcMain.handle('temi:aggiorna', (_e, temi) => serve().aggiornaTemi(temi))
  ipcMain.handle('tema:elimina', (_e, id: string) => serve().eliminaTema(id))
  ipcMain.handle('corsia:elimina', (_e, id: string, verso: string | null) => serve().eliminaCorsia(id, verso))
  ipcMain.handle('cartella:mostra', async () => {
    if (repo) await shell.openPath(repo.dir)
  })
}

app.whenReady().then(async () => {
  config = await leggiConfig()
  Menu.setApplicationMenu(null)
  registraIpc()
  creaFinestra()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creaFinestra()
  })
})

app.on('window-all-closed', () => {
  void chiudiRepo().finally(() => app.quit())
})
