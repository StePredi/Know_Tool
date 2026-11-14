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


## 2026-11-13 — Scheda «spiegazione» (teoria con testo e disegni)

Nuovo tipo di scheda nei documenti «Per situazioni», per le spiegazioni senza
codice: testo normale, riquadri, numeri grandi, tabelle e disegni nello stile
delle slide. Primo uso: 11 schede di «Docker per situazioni»
(`01_Argomenti/Sistemi e Reti/Docker/`).

File toccati: `src/shared/situazioni.ts` (schema e controlli),
`src/renderer/situazioni/Spiegazione.tsx` (nuovo), `Scheda.tsx`,
`ModificaScheda.tsx`, `util.ts`, `index.css` (classi `.sp-*`),
`tests/spiegazione.test.ts` (nuovo, 3 test).

Già controllato nel cloud: typecheck pulito, i 3 test passano, immagini di 7
schede in chiaro e scuro. **Non provato in Electron.**

### Da provare su Windows

Apri l'app (`npm run dev` da `02_App/`), vai in **Sistemi e Reti › Docker ›
Docker per situazioni** e guarda:

- [ ] **La mappa**: 9 rami e 65 foglie; il ramo «Capire i container» in alto.
- [ ] **Una scheda di spiegazione** (*VM o container*): in alto «Spiegazione»
      al posto di «Ricetta»; sotto, testo, tre riquadri, il disegno con le due
      pile affiancate (VM a sinistra, container a destra), la fascia scura,
      i numeri grandi, la tabella e la trappola gialla.
- [ ] **I colori dei livelli**: oro = sistemi operativi, scuro = hardware,
      colore del ramo = hypervisor ed engine, bianco = app e librerie.
- [ ] **Il flusso con le frecce** (*Immagine e container*, *Architettura
      Docker*, *Ciclo di vita*): le scritte sopra le frecce
      (`docker build`, `API REST`…) si leggono e non si sovrappongono.
- [ ] **La cornice tratteggiata** «Sistema host» (*docker0*, *Volume o bind
      mount*) con l'etichetta in alto a sinistra.
- [ ] **Il tema scuro**: tutti i riquadri leggibili, specialmente quelli oro
      e scuri.
- [ ] **Finestra stretta** (sotto i 900 px): le pile vanno una sotto l'altra;
      nel flusso le frecce vanno a capo senza uscire dal riquadro.
- [ ] **Precedente / Successiva, Situazioni vicine, Segna come ripassata**:
      funzionano anche sulle spiegazioni.
- [ ] **Modifica**: su una spiegazione si apre il testo YAML con la nota che
      spiega i blocchi; salvando una modifica la scheda si aggiorna.
- [ ] **Test sul PC**: `npx vitest run tests/spiegazione.test.ts` (sul PC i
      test non partivano per il modulo rollup mancante: va sistemato prima).

### Da fare nell'app

- [ ] **Moduli di modifica**: oggi la spiegazione si modifica solo come YAML.
      Servono: aggiungere / spostare / eliminare un blocco; un modulo per
      ogni tipo di blocco (titolo, testo, punti, carte, tabella, comandi,
      nota, trappola); per i disegni un editor a righe: pile = colonne con
      livelli dall'alto in basso, ogni livello con uno o più riquadri e il
      tono; flusso = nodi in fila con l'etichetta di ogni freccia e il gruppo.
- [x] (fatto 2026-11-13: `shared/testoSpiegazione.ts` + `costruisciIndici`) **Ricerca dentro le spiegazioni**: la ricerca della mappa guarda solo
      titolo, sigla, comando, parole e «quando». Aggiungere il testo dei
      blocchi (titoli, testo, punti, carte, nomi dei nodi e dei livelli) in
      `util.ts`, `costruisciIndici`.
- [x] (fatto 2026-11-14: `elementiDaCoprire`, barra «Mettiti alla prova» in `Scheda.tsx`, `s-quiz` in `Spiegazione.tsx`; da vedere in Electron) **Mettiti alla prova**: le spiegazioni non hanno il ripasso. Scelta: coprire i valori dei numeri grandi, le celle della
      tabella (tranne la prima colonna) e i nomi dei livelli dei disegni, da
      scoprire con un clic come nelle ricette.
- [x] (fatto 2026-11-13) **Nuova scheda**: «+ Nuova scheda» offre ricetta, prima e dopo, regola
      (`modelloScheda.ts`, `TipoNuova`); aggiungere «Spiegazione» con un
      esempio minimo (un testo e una pila).
- [ ] **Disegni che mancano** (da progettare con
      `procedura_nuovi_documenti.md`, prima i casi veri):
  - frecce che tornano indietro o si dividono (ciclo di vita completo con
    `docker start` che torna a «In esecuzione»; un utente verso più servizi);
  - frecce verticali fra i livelli di una pila (container → volume);
  - schemi di rete veri, con nodi e collegamenti liberi: è la stessa richiesta
    della segnalazione del 2026-10-16 sul laboratorio MikroTik VLAN.
- [x] (fatto 2026-11-13: `\*` = asterisco vero, `shared/enfasi.ts`) **Asterischi nel testo**: `*corsivo*` e `**grassetto**` usano gli
      asterischi, quindi un testo come `*.md` si rompe. Aggiungere un modo per
      scrivere un asterisco vero (per esempio `\*`) in `Testo` di
      `storia/Voce.tsx`.
- [ ] **Specifica**: la sezione «Spiegazione» è stata aggiunta a
      `specifiche/modello_per_situazioni.md`; dopo la prova di Ste, segnare la
      decisione in `DECISIONI.md`.
- [ ] **Mappa in HTML esterno** (come `Mappa MikroTik.html`): se se ne genera
      una per Docker, va incluso il componente `Spiegazione`.

### Da decidere sui contenuti

- [ ] Altre schede Docker hanno ancora righe di soli commenti dentro una
      ricetta: «Le altre opzioni frequenti» in *docker run -d*, «Cosa
      cercarci» in *docker logs*, «Differenza» in *Solo in locale*, i
      risultati in *CMD ed ENTRYPOINT*. Valutare se trasformarle in
      spiegazione o lasciarle così.
- [ ] Le altre documentazioni (MikroTik, Python, MSP) potrebbero usare la
      spiegazione per la teoria, per esempio il VLAN filtering.
- [ ] Il file temporaneo `99_Archivio/Obsoleti/2026-11-13/_tmp_app_src.tgz`
      (copia del codice usata per lavorare nel cloud) si può eliminare.

- [ ] **Spiegazioni, modifica a moduli**: passo 1 fatto 2026-11-14 (da provare su Windows: aprire una scheda Docker, «Modifica», «Moduli»: aggiungere, spostare, eliminare un blocco, salvare). Passo 2 (moduli per carte, tabella, disegni pile/flusso) da fare dopo la prova.
- [x] (fatto 2026-11-14, da vedere in Electron) **Disegno «rete»** (`specifiche/disegno_rete.md`): modello, controlli e disegno SVG. Scheda `vlan-schema-rete` aggiunta al MikroTik (51 schede).
