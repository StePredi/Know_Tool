# Modifiche da fare all'app (dopo la prima prova su Windows)

Elenco raccolto il 2026-10-10. Spuntare quando fatto.

## Da fare con Claude Code

- [x] **Testo più grande**: aumentare la dimensione predefinita del testo in tutta l'app
- [x] **Barra in alto più grande**: ingrandire l'intestazione (pulsanti, ricerca, filtri Periodi/Temi/Categorie)
- [x] **Impostazioni di Applicazione**: dimensione testo, carattere, spaziatura, palette e tema chiaro/scuro escono da "Aa Lettura" e vanno in una scheda/pagina «Applicazione», valida per tutta l'app. Sistemare anche il fatto che oggi non funzionano bene (da capire cosa non va: scala del testo non coerente nelle varie parti, valori in px fissi)
- [x] **Scheda completa al centro e nello stile del resto dell'app**: oggi è un riquadro largo in alto a sinistra dello schermo con colori e margini diversi; deve stare al centro e usare gli stessi bordi, colori e spaziature di Home e anteprima
- [x] **Ripasso nella scheda dell'autore** (scelta dell'utente): opzione di ripasso dentro la Home dell'autore. Da chiarire con l'utente la forma (un elenco di schede da ripassare? un percorso?) prima di costruirla

## Da progettare prima (non da costruire ora)

- [ ] **Home generale con tutti gli argomenti/materie**: manca; il design è ancora da fare (decisione dell'utente)

## Già deciso, da fare più avanti

- Editor del testo e ponte «Apri nell'editor»
- Installer .exe (electron-builder)
- Eliminazione di schede, categorie e temi

## Aggiunte il 2026-10-10 (seconda richiesta)

- [x] **Zoom**: Ctrl + / Ctrl − / Ctrl 0 per tutta l'interfaccia (cursore in «Applicazione»); pulsanti − + e Ctrl + rotella per la mappa
- [x] **Modalità riproduzione** («▶ Riproduci»): apre le schede una alla volta in ordine cronologico, rispetta i filtri; frecce ← →, spazio = pausa/avvio, passaggio automatico ogni N secondi (impostabile). È anche il ripasso dell'autore (come descritto dall'utente)
- Nota: la dimensione del testo non cambiava perché i testi erano in pixel fissi; ora la dimensione dell'interfaccia è uno zoom vero, predefinito 115%
- [ ] Da vedere dopo la prova: i «Dettagli» di alcune schede ripetono il riassunto (dato da rivedere, non il codice)
- [x] **Elimina scheda** (editor, «Elimina…» con conferma): il file va in `99_Archivio/schede_eliminate/`, la scheda viene tolta dai collegamenti delle altre e dal glossario

## Editor del testo — da rivedere dopo la prova su Windows
- Provato solo nel browser con dati simulati, non in Electron
- Nell'elenco esercizi il foglio della risposta compare sotto l'elenco (da valutare se spostarlo)
