# STATO DEL PROGETTO

## Fase attuale

**Italiano — implementazione: scheletro dell'app (02_App/) con la Home dell'autore. Da provare su Windows (`npm install`, `npm run dev`).**

---

## Fatto

- Formato dei file di studio
- Design della Home dell'autore
- Design dell'Editor del testo (annotazioni, parafrasi, esercizi con correzione, archivio testi)
- Dati di prova: Leopardi convertito nel formato a file (105 schede, 10 temi, glossario) in `01_Argomenti/italiano/autori/leopardi/`
- Scheletro dell'app Electron in `02_App/`: legge e valida i file (errori segnalati, mai blocchi), Home con Mappa e Lista, anteprima, scheda completa, modifica con scrittura immediata, aggiornamento automatico quando i file cambiano da fuori, pannello Controlli
- 22 test automatici (date, validazione, round-trip dei 105 file, scrittura e watcher)

---

## Da fare

- Provare l'app su Windows e correggere quello che non va
- Editor del testo (annotazioni, parafrasi, esercizi) e ponte "Apri nell'editor" verso `testi/`
- Installer finale (.exe) con electron-builder, a fine app
- Scheda riassuntiva generata dall'AI
- Eliminazione di schede, categorie e temi (rinviata: serve decidere cosa succede ai collegamenti)

---

## Punti aperti (da decidere con l'utente)

- Data `1809-12`: oggi solo un avviso; proposta di scrivere il mese come `12/1809`
- Scheda riassuntiva generata dall'AI
- Ponte "Apri nell'editor" (cartella `testi/`)
- Gli altri punti in `specifiche/formato_studio_italiano.md`, sezione "Da decidere con la demo"
- Dati dell'HTML non ancora convertiti: confronti, ripasso, note su lacune/trappole, testi chiave, luoghi/percorso, 3 voci di glossario extra

---

## In attesa

- Inglese, Sistemi e Reti, Matematica, Storia e altre materie (un tool alla volta, quando servono)
