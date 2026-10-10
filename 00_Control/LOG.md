# LOG

Registro cronologico delle azioni.

---

## 2026-09-30

- Fase 0: creata la struttura di cartelle (`00_Control/`, `01_Scuola/`, `02_Personale/`, `03_Progetti/`, `99_Archivio/`)
- Fase 0: creati `REGOLE.md`, `STATO.md`, `LOG.md` in `00_Control/`
- Aggiunta a `REGOLE.md` la sezione "8. Inizio sessione" (lettura di REGOLE/STATO/LOG a inizio sessione; lavoro solo dentro questa cartella)
- Riorganizzazione per argomenti: creata `01_Argomenti/` (vuota)
- Con conferma dell'utente, spostate `01_Scuola/`, `02_Personale/`, `03_Progetti/` (vuote) in `99_Archivio/`
- Aggiornato `REGOLE.md`: sezione 3 (struttura per argomento), sezione 5 (nomi file), sezione 7 (lettura di `_scheda.md`); sezione 8 già presente
- Aggiornato `STATO.md`: Fase 1 in corso
- Creato `00_Control/DECISIONI.md` con le decisioni prese (Control_Room, app unica con moduli, organizzazione per argomento, moduli, flusso di lavoro, stack da confermare, struttura provvisoria)
- Aggiornato `STATO.md`: sostituito "Da fare" con la roadmap (Fasi 1-5); Fase 1 in attesa dei file di progettazione dalla chat di italiano
- Aggiornato `REGOLE.md` sezione 8: aggiunta la lettura di `DECISIONI.md` a inizio sessione
- Aggiornato `DECISIONI.md`: prodotto = app desktop (Electron); aggiunte decisioni su storage a file, AI sugli stessi file senza API, formati (Markdown+frontmatter, JSON, slug), sicurezza (git); struttura di `01_Argomenti/` non più provvisoria; rimossa la decisione sullo stack con Dexie/IndexedDB (livello dati = Repository su file)
- Aggiornato `STATO.md`: Fase 1 = contratto dati (formato file di ogni entità, regole per l'AI, validazione), a partire dal documento di progettazione del modulo Italiano
- Aggiornato `DECISIONI.md`: aggiunte architettura a tre livelli (nucleo comune, modulo base, moduli specializzati), procedura per ogni nuova materia, stato dei moduli (in lavorazione: Italiano, Sistemi e Reti; previsti: matematica, inglese, altre)
- Creata la cartella `00_Control/specifiche/` (scelta dell'utente) per i documenti di progettazione dei moduli
- Salvata la specifica fornita dall'utente, senza modifiche, in `00_Control/specifiche/specifica_studio_italiano.md`
- Aggiornato `STATO.md`: ricevuta la specifica del modulo Italiano (da esaminare); manca `specifica_home_autore.md`
- Decompresso `aggiornamento_cowork.zip`: `specifica_home_autore.md` e `formato_studio_italiano.md` in `00_Control/specifiche/`; `Home Autore.dc.html` e `support.js` in `03_Demo/home_autore/` (creata `03_Demo/`); nessun file sostituito
- Riscritto `DECISIONI.md` (Control_Room, prodotto, dati, primo tool Italiano, home autore con design chiuso, data della scheda, prossimo passo, lista d'attesa)
- Aggiornato `REGOLE.md`: sezione 3 (struttura dati della specifica per il tool Italiano; aggiunta `03_Demo/`); sezione 8 già con la lettura di `DECISIONI.md`
- Aggiornato `STATO.md`: fase = Tool Italiano; fatto = home dell'autore (design chiuso); da fare = editor dei testi, poi implementazione in Claude Code; aggiunti i punti aperti delle specifiche
- Salvati in `00_Control/specifiche/`: `decisioni_home_autore.md` e `decisioni_editor_testo.md` (testo fornito dall'utente, senza modifiche)
- Con conferma dell'utente, sostituita `03_Demo/home_autore/Home Autore.dc.html` con la nuova versione
- Creata `03_Demo/editor_testo/` e salvata `Editor del testo.dc.html` (il file allegato `Editor_del_testo.dc.html`, rinominato come nei documenti di decisioni)
- Aggiornato `STATO.md`: aggiunte le demo e i documenti di decisioni; editor dei testi con demo ricevuta
- 2026-10-10: Aggiornati specifiche, decisioni e demo (Home autore, Editor del testo). Aggiunto DECISIONI.md.
- 2026-10-10: Con conferma dell'utente, sostituiti `formato_studio_italiano.md`, `Home Autore.dc.html`, `Editor del testo.dc.html` e `DECISIONI.md`; le versioni precedenti sono copiate in `99_Archivio/versioni_precedenti_2026-10-10/`. Aggiunto `03_Demo/editor_testo/support.js`; gli altri file dello zip erano già identici.
- 2026-10-10: Aggiunta a `REGOLE.md` la sezione 9 (lettura di `DECISIONI.md` prima di lavorare su italiano). Riscritto `STATO.md`.
