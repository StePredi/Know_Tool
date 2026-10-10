# STATO DEL PROGETTO

## Fase attuale

**Italiano — implementazione: app (02_App/) con Home dell'autore ed Editor del testo. Editor da provare su Windows (`npm run dev`).**

---

## Fatto

- Formato dei file di studio
- Design della Home dell'autore
- Design dell'Editor del testo (annotazioni, parafrasi, esercizi con correzione, archivio testi)
- Dati di prova: Leopardi convertito nel formato a file (105 schede, 10 temi, glossario) in `01_Argomenti/italiano/autori/leopardi/`
- Scheletro dell'app Electron in `02_App/`: legge e valida i file (errori segnalati, mai blocchi), Home con Mappa e Lista, anteprima, scheda completa, modifica con scrittura immediata, aggiornamento automatico quando i file cambiano da fuori, pannello Controlli
- 39 test automatici (date, validazione, round-trip dei 105 file, scrittura e watcher, testi e riaggancio)
- Home: zoom, riproduzione cronologica, pagina Applicazione, elimina scheda (archivia in `99_Archivio/schede_eliminate/`)
- Editor del testo: testi in `testi/<id>/` (testo.md + annotazioni/parafrasi/esercizi .json), figure in `_condiviso/figure_retoriche.json`; evidenziazione, annotazioni, parafrasi, esercizi (importazione, correzione, filtri), riaggancio automatico; dati di prova «L'infinito». Ingressi: «Testi» nella Home, «Apri nell'editor» nella scheda, «↗ Scheda sulla mappa» dall'editor

---

## Da fare

- Provare l'app su Windows e correggere quello che non va
- Provare l'editor del testo su Windows e correggere
- Installer finale (.exe) con electron-builder, a fine app
- Scheda riassuntiva generata dall'AI
- Eliminazione di categorie e temi (le schede si eliminano già)
- Home generale con tutte le materie (design da fare)

---

## Punti aperti (da decidere con l'utente)

- Data `1809-12`: oggi solo un avviso; proposta di scrivere il mese come `12/1809`
- Scheda riassuntiva generata dall'AI
- Gli altri punti in `specifiche/formato_studio_italiano.md`, sezione "Da decidere con la demo"
- Dati dell'HTML non ancora convertiti: confronti, ripasso, note su lacune/trappole, testi chiave, luoghi/percorso, 3 voci di glossario extra

---

## In attesa

- Inglese, Sistemi e Reti, Matematica, Storia e altre materie (un tool alla volta, quando servono)
