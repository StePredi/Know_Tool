# SESSIONE DI STUDIO (in parallelo allo sviluppo)

Questa guida è per una sessione di Claude che **usa Know_Tool come se fosse già finito**: studia, crea e aggiorna contenuti nelle cartelle degli argomenti. Lo sviluppo dell'app va avanti in un'altra sessione, in parallelo.

---

## 1. Divisione dei compiti

**Sessione di sviluppo** (l'altra): modifica `02_App/` e le specifiche in `00_Control/specifiche/`.

**Sessione di studio** (questa):

- lavora **solo** dentro `01_Argomenti/`;
- non modifica mai `02_App/` né le specifiche;
- se manca una funzione o qualcosa non va, la scrive in `00_Control/segnalazioni_studio.md` (vedi §5) invece di aggirarla.

---

## 2. Prima di cominciare

Leggo, in questo ordine:

1. `00_Control/REGOLE.md`
2. `00_Control/STATO.md`
3. `00_Control/DECISIONI.md` (se tocco l'italiano)
4. questa guida
5. la specifica del modello che sto usando (§3)

Poi guardo gli ultimi punti di `00_Control/LOG.md`.

---

## 3. Cosa c'è già nell'app

| Tipo di contenuto | Dove sta | Specifica |
|---|---|---|
| Autore di italiano (mappa, testi, glossario) | `01_Argomenti/italiano/autori/<autore>/` | `specifiche/formato_studio_italiano.md`, `DECISIONI.md` |
| Documentazione «Per situazioni» (lingua o strumento tecnico) | una cartella con `indice.yaml` + `schede/*.yaml`, per esempio `01_Argomenti/informatica/reti/MikroTik per situazioni/` | `specifiche/modello_per_situazioni.md` |

L'app **legge i file dal disco** e si aggiorna da sola: quello che scrivo nelle cartelle compare nell'app.

---

## 4. Come lavoro sui contenuti

- Scrivo i file nel formato della specifica, **uno per volta**, e controllo che l'app li legga (nessun avviso nel pannello Controlli o nell'elenco avvisi del documento).
- Per una nuova documentazione «Per situazioni»: creo la cartella con `indice.yaml` e le schede; ogni scheda ha un `id` uguale al nome del file; ogni scheda citata nell'indice deve esistere; ogni `«SEGNAPOSTO»` usato nel codice va spiegato in `segnaposto`.
- Il campo `lato` di `indice.yaml` non conta più: i rami si dispongono in senso orario da in alto a sinistra, nell'ordine dell'indice (il primo ramo è il livello 1, il più semplice).
- Non invento contenuti: parto da fonti dell'utente (PDF, appunti, link) e le cito in `fonte`.
- Non cancello mai: se un file non serve lo sposto in `99_Archivio/`.
- File nuovi con nomi minuscoli, con underscore, senza spazi né accenti (le cartelle dei documenti «Per situazioni» fanno eccezione e hanno il nome mostrato nell'app).

---

## 5. Segnalazioni per lo sviluppo

Quando durante lo studio trovo un problema o un'idea per l'app, aggiungo una riga in `00_Control/segnalazioni_studio.md`:

```
- 2026-10-14 · Per situazioni · scheda «nat»: la frase si legge male in modalità scura · (bug | manca | idea)
```

Una riga sola, concreta: cosa stavo facendo, cosa è successo, cosa mi aspettavo. La sessione di sviluppo le legge e le smaltisce.

---

## 6. Git

- Committo **solo** `01_Argomenti/`, `00_Control/LOG.md` e `00_Control/segnalazioni_studio.md`.
- Mai `git add .` o `git add -A`: potrei prendere file di `02_App/` a metà.
- Messaggi di commit in italiano, su una riga (per esempio: `Git per situazioni: aggiunte le schede del ramo Annullare`).

---

## 7. Log

A fine lavoro aggiungo una riga a `LOG.md` con la data, cosa ho creato o cambiato e dove.
