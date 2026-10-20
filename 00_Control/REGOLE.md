# REGOLE DI LAVORO

Queste regole valgono per me (Claude) in ogni sessione su questo progetto.

---

## 1. Lingua

- Scrivo **sempre in italiano**, sia nelle risposte in chat sia nei file.

---

## 2. Formattazione

- Formattazione **ben spaziata**: righe vuote tra titoli, paragrafi ed elenchi.
- Titoli chiari, frasi brevi, niente blocchi di testo compatti.

---

## 3. Dove salvo i file

Il progetto è organizzato per **argomento** (scuola e personale insieme), non per origine.

Cartelle principali:

- `00_Control/` → regole, log e stato del progetto
- `01_Argomenti/` → una cartella per ogni argomento
- `02_App/` → il codice dell'app
- `03_Demo/` → demo dei design (solo storico)
- `99_Archivio/` → materiale vecchio o concluso

Ogni argomento ha la sua cartella dentro `01_Argomenti/`, con questa struttura interna:

- `Fonti/` → PDF, link, video, libri
- `Appunti/` → appunti strutturati
- `Schemi/` → mappe e schemi
- `Pratica/` → esercizi, prove, output
- i documenti utili (per esempio una mappa «Per situazioni») stanno direttamente nella cartella dell'argomento
- le cartelle hanno l'iniziale maiuscola; quelle tecniche cominciano con `_`
- `_scheda.md` → tipo di argomento e regole specifiche

Per il tool **Italiano** vale la struttura dati della specifica (`00_Control/specifiche/formato_studio_italiano.md`).

Se un file non ha una collocazione chiara, **chiedo prima di salvarlo**.

---

## 4. Cancellazione

- **Non cancello mai file senza chiedere** e ottenere conferma esplicita.
- Se qualcosa non serve più, lo **sposto** in `99_Archivio/` (pacchetti e file temporanei in `99_Archivio/Obsoleti/<data>/`) e lo scrivo nel LOG. L'utente decide quando cancellare.

---

## 5. Nomi dei file e delle cartelle

- **Cartelle di studio** (materie, argomenti, `Fonti`, `Appunti`, `Pratica`, `Schemi`): iniziale **maiuscola**, spazi permessi (`Sistemi e Reti`). Quelle tecniche cominciano con `_`.
- **File che crei tu per un argomento** (appunti, pratica): minuscolo con underscore, niente accenti (`esp32_pin_touch_io.md`). I file di fonte (pdf, pptx, docx) si rinominano così solo se serve.
- I documenti strutturati (`indice.yaml`, `schede/<id>.yaml`, `argomento.yaml`) hanno nomi fissi dal loro modello.
- La data `YYYY-MM-DD` va **solo negli appunti di lezione** (`2026-09-30_derivate.md`).
- Il nome della materia non serve nel file: è già nella cartella.
- Niente due nomi che differiscono solo per maiuscole (su Windows sono lo stesso file).

---

## 6. Log e stato

- Ogni azione che faccio viene registrata in `LOG.md` (in ordine cronologico).
- `STATO.md` viene aggiornato quando cambia la fase o cosa è stato fatto.

---

## 7. Regola d'oro

- Non invento template né contenuti non richiesti: faccio solo ciò che viene chiesto per la fase in corso.
- Per ogni argomento leggo **prima** `_scheda.md` e mi comporto come scritto lì.

---

## 8. Inizio sessione

- All'inizio di ogni sessione leggo `REGOLE.md`, `STATO.md`, `DECISIONI.md` e `LOG.md` prima di fare qualsiasi cosa.
- Lavoro solo dentro questa cartella, mai fuori.

---

## 9. Prima di lavorare sull'italiano

- Prima di lavorare su italiano, mappa dell'autore o editor dei testi, leggo `00_Control/DECISIONI.md`.

---

## 10. Prima di progettare un nuovo tipo di documento

- Prima di disegnare o scrivere codice per un nuovo modello (per esempio Matematica), leggo e seguo `00_Control/procedura_nuovi_documenti.md`: prima il contenuto e i problemi reali dell'utente, poi il modello dei file, solo alla fine la schermata.
