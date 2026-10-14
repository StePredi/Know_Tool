# Home generale con tutte le materie (2026-10-14)

Stato: **costruita (primo giro)**, da provare su Windows.

## Decisioni dell'utente

- Idea: un misto tra l'Esplora risorse di Windows e la dashboard di Figma. Qui si creano e si organizzano i documenti di studio.
- Più schede aperte insieme, come un browser.
- L'area centrale ha più importanza. L'albero a sinistra resta, ma stretto e nascondibile.

## Struttura

- Barra schede in alto: «Home» fissa, poi mappe e testi. Si chiudono, si riordinano, si ricordano alla riapertura. Ctrl+T Home, Ctrl+W chiude, Ctrl+Tab cambia, Ctrl+Maiusc+T riapre l'ultima chiusa.
- Albero a sinistra: Materie → cartelle → autori → Mappa cronologica e Testi. Si nasconde.
- Centro: titolo con il nome della cartella corrente (e «‹» per tornare indietro, niente percorso Home › autore › …), ricerca, Griglia/Elenco, ordinamento, «+ Nuovo». La Home ha tre fasce: Continua da dove eri, Preferiti, Materie.
- Dettagli: pannello a destra che compare solo quando selezioni (pulsante «…» sulla cartolina o clic destro).
- I file restano cartelle vere in `01_Argomenti`. Nulla si cancella: archiviare sposta in `99_Archivio`.

## Regole

- Protetti (non si rinominano né si archiviano): `italiano`, `italiano/autori`, le cartelle degli autori. Il nome mostrato di un autore o di un testo si cambia scrivendo nel file (`nome:` / `titolo:`), l'id e la cartella restano.
- Nomi: niente `\ / : * ? " < > |`, non cominciano con `.`, `_` o `99_`, massimo 60 caratteri, mai doppioni nella stessa cartella.
- Le schede di documenti spariti (archiviati o tolti da fuori) si chiudono da sole.

## Da fare nei prossimi giri

- «+ Nuovo» con i nuovi tipi di documento man mano che li progettiamo.
- Ricerca nei contenuti (schede, annotazioni).
- Spostare con il trascinamento; creare un nuovo autore da qui.
- Conservare per ogni scheda filtri e selezioni.
