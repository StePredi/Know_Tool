# MongoDB (Sistemi e Reti)

**Tipo di argomento:** tecnico / pratico (database NoSQL a documenti, usato da Python con PyMongo asincrono e dalla shell mongosh).

---

## Cosa c'è

- `Fonti/` → materiale del corso (originali, mai modificati):
  - `mongodb_intro.ipynb` → notebook: database a documenti, PyMongo con `AsyncMongoClient`, find e cursori, proiezione, ordinamento, operatori di query, insert, update, delete (dati di esempio: collezione `studenti`)
  - `mongodb_cheat_sheet.pdf` → riepilogo in inglese PyMongo e mongosh: connessione, lettura, operatori, aggiornamenti, ObjectId, errori comuni

- `MongoDB per situazioni/` → la documentazione «Per situazioni» (si apre nell'app): 8 rami, 38 schede. In alto «Capire MongoDB» (4 spiegazioni con disegni), poi Collegarsi, Leggere, Filtri, Inserire, Modificare, Cancellare; in fondo il ramo trasversale «Quando non funziona»

---

## Regole specifiche

- Le fonti stanno solo in `Fonti/`: le schede le citano nel campo `fonte` (sezione del notebook o parte del cheat sheet), non le copiano.
- Il codice usa i nomi italiani del notebook (`studenti`, `nome`, `citta`, `voti`); il cheat sheet è in inglese (`students`, `name`): nelle schede si usa sempre la versione del notebook.
- L'equivalente in mongosh, quando c'è, sta nelle «Varianti» della scheda.
- I risultati scritti nei commenti sono quelli del notebook con i dati di esempio iniziali.
- Ciò che non è nelle fonti è segnato come «Nota» (per esempio il volume per i dati del container e la gestione di `InvalidId` con try/except).
- Nuove situazioni: una scheda per volta, nel ramo giusto di `indice.yaml`; un argomento nuovo = un nuovo ramo, inserito prima di «Quando non funziona». Un gruppo ha sempre almeno 2 schede.
- Le cartelle `Appunti/`, `Pratica/` e `Schemi/` si creano solo quando c'è materiale da metterci.
