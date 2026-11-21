# STATO DEL PROGETTO

## Fase attuale

**Storia (2026-10-25): modello approvato, schermata propria (`src/renderer/storia/`), macro-argomento della verifica completo — 11 documenti, 179 schede, copertura del libro 30/30. Da provare su Windows (`npm run dev`).**

---

## Fatto

- Linguaggi di Programmazione / C++ (2026-11-18): nuova materia con «Basi di C++ per situazioni» (10 rami, 39 schede, compreso il ramo «Chiavi e valori» con map/unordered_map). Esempi compilati con g++ 13; da aprire nell'app e da confrontare con il corso

- TPSIT/ESP (2026-11-18): aggiunta la libreria personale `oled_utils.h` a «ESP per situazioni»: ramo «Libreria oled_utils» (11 schede) + «oled_utils: problemi comuni», collegato alle schede OLED. Ora 13 rami e 83 schede, da aprire nell'app. Fonte in `TPSIT/ESP/Fonti/oled_utils.md`

- TPSIT/ESP (2026-11-04): aggiunto il display OLED SSD1306 (`Pratica/oled_ssd1306_codice.md`, sezione in `Appunti/esp32_hardware_e_sensori.md`) e le istruzioni Wire/AHT20 citate negli esercizi I2C (`Pratica/i2c_wire_codice.md`, `Pratica/esp32_sensori_codice.md`). Fonti in `Fonti/`. In «ESP per situazioni» nuovo ramo «Display OLED» (8 schede) più la scheda «Il display OLED resta nero»: 71 schede, 12 rami, da aprire nell'app

- Storia (2026-10-25): modello nuovo dentro «Per situazioni». Due tipi di scheda, `voce` (evento / persona / concetto / processo, con i cinque campi dei nuclei del libro: quando, dove, chi, cosa, perche' conta) e `confronto` (le stesse domande poste a piu' casi); collegamenti `lega` con tipo e motivo; flag `svolta`; sezioni di dettaglio `svolgimento`, `elementi`, `numeri`, `citazioni`, `storiografia`; campo `da` (libro, capitolo, paragrafo) e file di materia `_libri.yaml`; **grassetto** e *corsivo* nei testi. Specifica in `specifiche/modello_storia.md`, prove a mano in `specifiche/prove/storia/`, mockup in `03_Demo/storia/storia.html`. Contenuti: `01_Argomenti/Storia/Il mondo tra Otto e Novecento/`, il macro-argomento della prima verifica (Storia -> cartella del macro-argomento -> le mappe, senza livelli in mezzo), con 11 documenti e 179 schede (le alleanze europee, il darwinismo sociale, la belle epoque, l'eta' degli imperialismi, le potenze europee, fuori dall'Europa, la seconda rivoluzione industriale, l'Italia di fine Ottocento, l'eta' giolittiana, industria e questione meridionale, la guerra di Libia); copertura del libro 30 paragrafi su 30. Schermata propria in `src/renderer/storia/`, scelta dal documento con `vista: storia`. 12 test in `tests/storia.test.ts`. Da provare su Windows

- «+ Nuovo» rifatto (2026-10-16): una finestra con modelli a sinistra e, a destra, cosa crea, nome e cartella di destinazione; niente carte spente; tolta la carta «Mappa cronologica». Da provare su Windows

- Sessione di controllo (2026-10-16): guida `sessione_controllo.md` per una nuova sessione che lavora sull'app (ordine di lettura, mappa del codice, regole, cosa non è provato, elenco di cose da fare, messaggio di avvio)

- Studio in parallelo (2026-10-14): guida `sessione_studio.md` per una sessione che usa l'app come se fosse finita (solo `01_Argomenti/`), e `segnalazioni_studio.md` dove scrive bug e idee per lo sviluppo

- Modello «Per situazioni» (2026-10-14): documentazione MikroTik (37 situazioni) aperta in una scheda dell'app, con mappa a rami, ricerca, scheda ricetta / prima-e-dopo, ripasso e progresso. Specifica in `specifiche/modello_per_situazioni.md`

- Home generale (2026-10-14): schede stile browser, albero stretto, Home a tre fasce, vista cartella griglia/elenco, dettagli, ricerca per nome, crea/rinomina/archivia, preferiti e recenti

- Scheda riassuntiva generata dall'AI (2026-10-11): richiesta da copiare, proposta confronto Ora|Proposta con Applica/Scarta, nuove sezioni nella scheda

- Formato dei file di studio
- Design della Home dell'autore
- Design dell'Editor del testo (annotazioni, parafrasi, esercizi con correzione, archivio testi)
- Dati di prova: Leopardi convertito nel formato a file (105 schede, 10 temi, glossario) in `01_Argomenti/Italiano/Autori/leopardi/`
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
- Dal controllo di ESP (2026-10-15): (1) leggere gli appunti `.md` dentro l'app (FATTO 2026-10-15: gli `.md` compaiono nell'albero e si aprono in sola lettura; le fonti citate si aprono con l'app predefinita del sistema; resta il pulsante «Verifica fonti»); (2) figure nei documenti «Per situazioni» (FATTO per lo schema dei pin: scheda di tipo `figura`, 2026-10-15; restano le figure dentro altre schede, per Git): per esempio lo schema dei pin dell'ESP32 come disegno approssimativo della scheda dentro la mappa, con filtri per famiglia (ADC, DAC, touch, SPI, I2C…), clic su un pin = dettagli e schede collegate, ricerca che sfuma i pin; dati ora in `TPSIT/ESP/schemi/esp32_pinout_interattivo.html`
- Home generale, giri successivi: nuovi tipi di documento da «+ Nuovo», ricerca nei contenuti, spostare con trascinamento, nuovo autore
- Segnalate dall'utente (2026-10-16), dopo il lettore degli appunti:
  1. **Fonti visibili** (FATTO 2026-10-16): i file non di testo delle cartelle di studio (pdf, pptx, docx, xlsx, html, immagini…) compaiono nell'albero e nella Home come «File»; un clic li apre con l'app predefinita del sistema
  2. **Rami della mappa «Per situazioni» che si aprono e chiudono** (FATTO 2026-10-16): il centro e i rami si vedono sempre; doppio clic (o il «+» sul nodo) apre/chiude un ramo o un gruppo; un solo pulsante con l'occhio («Apri tutto» / «Chiudi tutto» a seconda dello stato); il layout si ricalcola; la ricerca apre i rami che contengono i risultati. Il clic sul ramo non mette più a fuoco (il fuoco resta nella Griglia)
  3. **Modifica di ogni documento/file dell'app** (proposta approvata il 2026-10-16: `specifiche/_storico/proposta_modifica_e_cartelle.md`; FATTO: schede «Per situazioni» a moduli e YAML con copia di sicurezza; mappa (`indice.yaml`) a moduli e YAML dal pulsante «Modifica mappa»; appunti `.md` con barra di formattazione e anteprima; nuova scheda e archivia scheda; nuovo/rinomina/archivia appunti dalla Home; resta: figure a moduli, importare/spostare file): l'utente deve poter lavorare anche lui sui contenuti (appunti, schede, indice…) dall'app, non solo la sessione di studio
  4. **Organizzazione delle cartelle** (FATTO 2026-10-16, commit fcadfba: struttura Materia/Argomento/{Fonti, Appunti, Pratica, Schemi} con nomi maiuscoli; piano in `specifiche/_storico/piano_riordino_cartelle.md`; vecchia descrizione: documenti utili direttamente nella cartella dell'argomento, niente `Mappe/`; vedi `specifiche/_storico/proposta_modifica_e_cartelle.md`) più pensata, e i nomi delle cartelle con l'iniziale maiuscola )

---
## Punti aperti (da decidere con l'utente)

- Gli altri punti in `specifiche/formato_studio_italiano.md`, sezione "Da decidere con la demo"
- Dati dell'HTML non ancora convertiti: confronti, ripasso, note su lacune/trappole, testi chiave, luoghi/percorso, 3 voci di glossario extra

---

## In attesa

- Inglese e altre materie (un tool alla volta, quando servono)
- **Matematica (2026-10-21).** Spec approvata, schema e vista scheda `regola`, Formulario, Derivate (22 schede, 10 esercizi, esempi controllati coi numeri). Il vecchio codice è in `99_Archivio/Obsoleti/2026-10-21/`. Prossimo: Limiti e gli altri argomenti dalla sessione di studio; figure per i grafici (aggiunta 3) e passi con motivazione per le dimostrazioni (aggiunta 4) quando servono.
- Sistemi e Reti: argomento `Python` creato (fonti e `_scheda.md`), documenti da fare dopo la scelta dei moduli.
- Sistemi e Reti (2026-11-13): argomento `Docker` con fonti, `_scheda.md` e «Docker per situazioni» (9 rami, 65 schede, di cui 11 «spiegazione»: nuovo tipo di scheda con testo e disegni), da aprire nell'app. Cosa provare e cosa resta da fare: `modifiche_app.md`, sezione 2026-11-13.
