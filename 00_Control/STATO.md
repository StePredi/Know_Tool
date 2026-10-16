# STATO DEL PROGETTO

## Fase attuale

**Italiano — implementazione: app (02_App/) con Home dell'autore ed Editor del testo. Editor da provare su Windows (`npm run dev`).**

---

## Fatto

- Studio in parallelo (2026-10-14): guida `sessione_studio.md` per una sessione che usa l'app come se fosse finita (solo `01_Argomenti/`), e `segnalazioni_studio.md` dove scrive bug e idee per lo sviluppo

- Modello «Per situazioni» (2026-10-14): documentazione MikroTik (37 situazioni) aperta in una scheda dell'app, con mappa a rami, ricerca, scheda ricetta / prima-e-dopo, ripasso e progresso. Specifica in `specifiche/modello_per_situazioni.md`

- Home generale (2026-10-14): schede stile browser, albero stretto, Home a tre fasce, vista cartella griglia/elenco, dettagli, ricerca per nome, crea/rinomina/archivia, preferiti e recenti

- Scheda riassuntiva generata dall'AI (2026-10-11): richiesta da copiare, proposta confronto Ora|Proposta con Applica/Scarta, nuove sezioni nella scheda

- Formato dei file di studio
- Design della Home dell'autore
- Design dell'Editor del testo (annotazioni, parafrasi, esercizi con correzione, archivio testi)
- Dati di prova: Leopardi convertito nel formato a file (105 schede, 10 temi, glossario) in `01_Argomenti/italiano/autori/leopardi/`
- Scheletro dell'app Electron in `02_App/`: legge e valida i file (errori segnalati, mai blocchi), Home con Mappa e Lista, anteprima, scheda completa, modifica con scrittura immediata, aggiornamento automatico quando i file cambiano da fuori, pannello Controlli
- 39 test automatici (date, validazione, round-trip dei 105 file, scrittura e watcher, testi e riaggancio)
- Elimina categorie (le schede passano a un'altra) e temi (tolti dalle schede); correzione con un clic delle date ambigue tipo `1809-12` → `12/1809`
- Elimina testo (archivia in `99_Archivio/testi_eliminati/`); barra in alto della Home su un solo livello; transizioni fluide
- Icone SVG uniche in tutta l'app (Icona.tsx) al posto dei simboli di testo
- Home: zoom, riproduzione cronologica, pagina Applicazione, elimina scheda (archivia in `99_Archivio/schede_eliminate/`)
- Editor del testo (riscritto sul prototipo): testi in `testi/<id>/` (testo.md + annotazioni/parafrasi/esercizi .json), figure in `_condiviso/figure_retoriche.json`; evidenziazione, annotazioni, parafrasi, esercizi (importazione, correzione, filtri), riaggancio automatico; dati di prova «L'infinito». Ingressi: «Testi» nella Home, «Apri nell'editor» nella scheda, «↗ Scheda sulla mappa» dall'editor

---

## Da fare

- Provare l'app su Windows e correggere quello che non va
- Provare l'editor del testo su Windows e correggere
- Installer finale (.exe) con electron-builder, a fine app
- Provare la scheda riassuntiva su Windows (con una proposta vera scritta da Claude)
- Provare la Home generale su Windows (schede, albero, nuova materia/cartella, rinomina, archivia)
- Provare «Per situazioni» (MikroTik) su Windows; poi: Git e Python come documentazioni, galleria di «+ Nuovo», generazione con Claude, figure SVG
- Dal controllo di MSP (2026-10-15): (1) leggere gli appunti `.md` dentro l'app (FATTO 2026-10-15: gli `.md` compaiono nell'albero e si aprono in sola lettura; le fonti citate si aprono con l'app predefinita del sistema; resta il pulsante «Verifica fonti»); (2) figure nei documenti «Per situazioni» (FATTO per lo schema dei pin: scheda di tipo `figura`, 2026-10-15; restano le figure dentro altre schede, per Git): per esempio lo schema dei pin dell'ESP32 come disegno approssimativo della scheda dentro la mappa, con filtri per famiglia (ADC, DAC, touch, SPI, I2C…), clic su un pin = dettagli e schede collegate, ricerca che sfuma i pin; dati ora in `TPSIT/MSP/schemi/esp32_pinout_interattivo.html`
- Home generale, giri successivi: nuovi tipi di documento da «+ Nuovo», ricerca nei contenuti, spostare con trascinamento, nuovo autore
- Segnalate dall'utente (2026-10-16), dopo il lettore degli appunti:
  1. **Fonti visibili** (FATTO 2026-10-16): i file non di testo delle cartelle di studio (pdf, pptx, docx, xlsx, html, immagini…) compaiono nell'albero e nella Home come «File»; un clic li apre con l'app predefinita del sistema
  2. **Rami della mappa «Per situazioni» che si aprono e chiudono** (FATTO 2026-10-16): il centro e i rami si vedono sempre; doppio clic (o il «+» sul nodo) apre/chiude un ramo o un gruppo; un solo pulsante con l'occhio («Apri tutto» / «Chiudi tutto» a seconda dello stato); il layout si ricalcola; la ricerca apre i rami che contengono i risultati. Il clic sul ramo non mette più a fuoco (il fuoco resta nella Griglia)
  3. **Modifica di ogni documento/file dell'app**: l'utente deve poter lavorare anche lui sui contenuti (appunti, schede, indice…) dall'app, non solo la sessione di studio
  4. **Organizzazione delle cartelle** più pensata, e i nomi delle cartelle con l'iniziale maiuscola (da progettare prima di spostare qualsiasi cosa)

---
## Punti aperti (da decidere con l'utente)

- Gli altri punti in `specifiche/formato_studio_italiano.md`, sezione "Da decidere con la demo"
- Dati dell'HTML non ancora convertiti: confronti, ripasso, note su lacune/trappole, testi chiave, luoghi/percorso, 3 voci di glossario extra

---

## In attesa

- Inglese, Sistemi e Reti, Matematica, Storia e altre materie (un tool alla volta, quando servono)
