# BRIEF: sessione di sviluppo del modello di Storia

Obiettivo: progettare come si studia **Storia** in Know_Tool. Non esiste ancora nessuna cartella `01_Argomenti/Storia` né una specifica: si parte da zero.

## Leggi prima (in questo ordine)
1. `00_Control/REGOLE.md`, `DECISIONI.md`, `STATO.md`
2. `00_Control/specifiche/modello_matematica.md`: come ho deciso che una materia nuova non ha un motore suo ma usa il documento «Per situazioni».
3. `00_Control/specifiche/modello_per_situazioni.md`: il modello esistente (indice.yaml, rami, voci, schede).
4. `00_Control/specifiche/formato_studio_italiano.md`: il modello di Italiano (autori, fonti), il più vicino a Storia per il tipo di contenuto.
5. `00_Control/sessione_studio.md` (soprattutto §1 e §8): chi tocca cosa.

## Ordine di lavoro
1. **Specifica**: `00_Control/specifiche/modello_storia.md`. Prima di scrivere, rispondi a questa domanda: basta «Per situazioni» con qualche tipo di scheda nuovo o serve altro? Candidati: linea del tempo, cause e conseguenze, confronto tra fonti, personaggi/eventi collegati.
2. **Mockup HTML** in `03_Demo/storia/` con 2 o 3 argomenti veri del programma. Aspetta l'approvazione di Ste.
3. **Codice** in `02_App/` solo dopo l'approvazione della specifica e del mockup (schema zod in `src/shared/situazioni.ts`, test in `tests/`).
4. I contenuti (`01_Argomenti/Storia/...`) li scrive la sessione di studio, non questa.

## Regole di lavoro (da quello che è andato storto)
- Non spostare né rinominare cartelle di `01_Argomenti/` senza richiesta di Ste.
- Commit solo dei propri percorsi (`git add <percorsi>`, mai `-A`); messaggi in italiano.
- Prima di cominciare: `git status`; i file che non sono tuoi non li committi.
- Non cancellare file di Ste: spostali in `99_Archivio/Obsoleti/<data>/`.
- Se un test fallisce solo qui perché manca `01_Argomenti/Telecomunicazioni` (10 test MikroTik nella copia cloud), non è una regressione.
- Test: sul PC di Ste manca il modulo Linux di rollup, quindi vitest si lancia in una copia nel cloud; `tsc --noEmit` funziona anche sul PC.
- Aggiorna `LOG.md`, `STATO.md` e `DECISIONI.md` a fine lavoro.
