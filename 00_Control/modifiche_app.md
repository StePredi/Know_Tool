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

## Lettore appunti (2026-10-15) — da provare su Windows
- Gli `.md` di `appunti/` e `pratica/` compaiono nell'albero e si aprono in una scheda (sola lettura)
- Clic su una fonte citata (`fonti/x.pdf`) = si apre con l'app predefinita del sistema (da provare: PDF, pptx, html)
- Provato solo nel browser con dati simulati, non in Electron

## 2026-10-25 — Storia

Apri l'app (`npm run dev` da `02_App/`) e nell'albero vai in **Storia**: ci sono
due argomenti nuovi, «Le alleanze europee» e «Darwinismo sociale e teorie
razziali». Aprili e guarda:

0. **La testata**: in alto «Storia › Le alleanze europee» e, a destra, la
   Copertura del libro; sotto, le tre famiglie **Leggi** (Mappa, Cronologia),
   **Trova** (Glossario, Chi è chi, Svolte) ed **Esercita** (Ripasso).
1. **La mappa**: in colonna a sinistra, sei rami colorati per le alleanze e
   quattro per il darwinismo; accanto a ogni voce la data.
2. **Una scheda «voce»** (per esempio *Triplice 1882*): il titolo, poi subito il
   testo; a destra la spalla con quando / dove / chi e l'elenco delle sezioni.
   Sotto: «Come si svolge» a passi numerati, «I dettagli», «Attenzione» con
   l'errore tipico e la nota, «Collegamenti» con il tipo di legame e il motivo.
3. **Una scheda «confronto»** (*I due blocchi*): la tabella con le stesse
   domande per i due casi; i nomi in testa sono cliccabili.
4. **Il grassetto e il corsivo** dentro i testi.
5. **Un collegamento che esce dall'argomento**: in *Eugenetica* (darwinismo) ce
   n'è uno tratteggiato e spento verso «totalitarismi», documento che non
   esiste ancora. Deve restare un avviso, non un errore.

6. **Cronologia**: prende il posto della mappa nella colonna, la scheda resta
   a destra. Guarda i salti di tempo («8 anni») e gli anni con più fatti.
7. **Copertura del libro**: i paragrafi scoperti in rosso; le pastiglie verdi
   portano alla scheda che copre quel paragrafo, anche in un altro argomento.
8. **Ripasso**: copre «quando» e «chi» negli eventi, «cosa» nelle persone e
   nei concetti, e una colonna del confronto. Si scopre con un clic.

### Aggiunta del 2026-10-25: riproduzione

Nella testata, gruppo **Scorri**: «‹» e «›» per andare a mano, **Riproduci**
per farle scorrere da sole, e il menu dei secondi. Prova che:

- l'ordine cambia con la vista: in **Mappa** segue i rami, in **Cronologia**
  segue gli anni;
- durante la riproduzione la barra dice «n di N» e il tasto «ferma» funziona;
- a ogni scheda il contenuto riparte dall'alto e la voce si vede nella colonna;
- arrivato in fondo si ferma da solo.

