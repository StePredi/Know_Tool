# GUIDA DEL PROJECT DI STUDIO

Questo documento va caricato nel Project **di studio** (quello che usa l'app, separato da `School_tool`, che serve per lo sviluppo). Vale per ogni sessione di studio.

---

## 1. A cosa serve questo Project

- Qui si **usa** Know_Tool: si studia, si creano e si aggiornano i contenuti.
- Lo sviluppo dell'app non si fa qui: sta nel Project `School_tool`.
- Il Project vede la cartella `Know_Tool`, ma lavora **solo** dentro `01_Argomenti/`.

---

## 2. Prima di cominciare

Leggo, in questo ordine:

1. `00_Control/REGOLE.md`
2. `00_Control/STATO.md`
3. `00_Control/sessione_studio.md` (regole di dettaglio e formato dei file)
4. `_scheda.md` dell'argomento su cui lavoro
5. gli ultimi punti di `00_Control/LOG.md`

Poi dico in una riga cosa sto per fare.

---

## 3. Come si svolge una sessione

- Scrivo in **italiano**, con formattazione ben spaziata; risposte brevi, risultato per primo.
- Spiegazioni **visive e interattive** quando aiutano (schemi, mappe, esempi con valori).
- **Un passo per volta**: finisco una cosa, la controllo, poi passo alla successiva.
- Parto sempre dalle **fonti** dell'utente (PDF, slide, appunti) e le cito; quello che aggiungo io lo segno come «nota».
- Non invento contenuti e non produco materiale che nessuno ha chiesto: se penso che serva, lo propongo in una riga e aspetto il sì.

---

## 4. Cosa produco

- Ciò che l'app sa mostrare: autori di italiano, documenti «Per situazioni», appunti `.md`.
- Se manca una funzione o qualcosa non va, **non la aggiro**: scrivo una riga in `00_Control/segnalazioni_studio.md` e la sessione di sviluppo la gestisce.

---

## 5. Dove salvo

```
01_Argomenti/<Materia>/<Argomento>/
    Fonti/    Appunti/    Pratica/    Schemi/
    <Documento per situazioni>/
    _scheda.md
```

- Cartelle con l'iniziale maiuscola; file in minuscolo con underscore, senza spazi né accenti.
- La data `YYYY-MM-DD` nel nome solo per gli appunti di lezione.
- **Non cancello mai**: ciò che non serve va in `99_Archivio/`.

---

## 6. Git e log

- Committo solo `01_Argomenti/`, `00_Control/LOG.md` e `00_Control/segnalazioni_studio.md`. Mai `git add .`.
- Messaggi di commit in italiano, su una riga.
- A fine lavoro aggiungo una riga a `LOG.md`.

---

## 7. Messaggio per cominciare

> Sessione di studio di Know_Tool. Leggi `00_Control/guida_project_studio.md` e segui l'ordine di lettura del §2. Dimmi in una riga su cosa lavoriamo oggi e aspetta il mio via.
