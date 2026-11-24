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
| Autore di italiano (mappa, testi, glossario) | `01_Argomenti/Italiano/Autori/<autore>/` | `specifiche/formato_studio_italiano.md`, `DECISIONI.md` |
| Documentazione «Per situazioni» (lingua o strumento tecnico) | una cartella con `indice.yaml` + `schede/*.yaml`, per esempio `01_Argomenti/Telecomunicazioni/MikroTik/MikroTik per situazioni/` | `specifiche/modello_per_situazioni.md` |

L'app **legge i file dal disco** e si aggiorna da sola: quello che scrivo nelle cartelle compare nell'app.

### Come sono organizzate le cartelle (dal 2026-10-16)

```
01_Argomenti/<Materia>/<Argomento>/
    Fonti/     slide e PDF originali (mai modificati)
    Appunti/   la teoria (.md)
    Pratica/   codice ed esercizi (.md)
    Schemi/    immagini e schemi
    <Documento per situazioni>/   la mappa utile, direttamente nella cartella dell'argomento
    _scheda.md                    tipo di argomento e regole (nascosta all'app)
```

- Le cartelle hanno **l'iniziale maiuscola** (Telecomunicazioni, MikroTik, Fonti, Appunti, Pratica, Schemi). Le cartelle tecniche cominciano con `_` e non compaiono nell'app. I nomi dei file e dei documenti sono liberi.
- Italiano è a parte: `Italiano/Autori/<autore>/` (id dell'autore sempre minuscolo), `Italiano/Fonti/`, `Italiano/_condiviso/`.
- Gli appunti citano le fonti come `fonti/x.pdf`: l'app le trova anche se la cartella è `Fonti/` (le maiuscole non contano).
- Un nuovo argomento: creo la cartella `Materia/Argomento/` con le sottocartelle che servono (Fonti, Appunti, Pratica, Schemi) e `_scheda.md`; il documento «Per situazioni» sta accanto, non dentro `Pratica/`.

---

## 4. Cosa produco (e cosa no)

- Il risultato dello studio è ciò che **l'app sa mostrare**: per ora autori di italiano e documentazioni «Per situazioni». Se il compito non dice altro, produco solo quello.
- **Non creo materiale che nessuno ha chiesto** (appunti, pratica, schemi, pagine HTML a parte). Se penso che serva, lo **propongo** in una riga e aspetto il sì.
- Se il materiale del compito ha parti che l'app non sa ancora mostrare (uno schema di pin, un disegno, appunti da leggere nell'app), **non costruisco un sostituto fuori dall'app**: lo scrivo in `segnalazioni_studio.md` come «manca» e metto i dati in una forma che si possa portare dentro l'app (per esempio un elenco di pin con famiglie, non una pagina HTML).
- Quello che aggiungo e che nelle fonti non c'è lo segno come «nota» (già così).

---

## 4b. Come lavoro sui contenuti

- Scrivo i file nel formato della specifica, **uno per volta**, e controllo che l'app li legga (nessun avviso nel pannello Controlli o nell'elenco avvisi del documento).
- Per una nuova documentazione «Per situazioni»: creo la cartella con `indice.yaml` e le schede; ogni scheda ha un `id` uguale al nome del file; ogni scheda citata nell'indice deve esistere; ogni `«SEGNAPOSTO»` usato nel codice va spiegato in `segnaposto`.
- Il campo `lato` di `indice.yaml` non conta più: i rami si dispongono in senso orario da in alto a sinistra, nell'ordine dell'indice (il primo ramo è il livello 1, il più semplice).
- Se la fonte ha uno schema di una scheda (pin sui due lati), lo porto come scheda di tipo `figura` (formato in `specifiche/modello_per_situazioni.md`, sezione Figure), non come pagina HTML.
- Rispetto il compito: faccio la mappa e le schede chieste, non altro.
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

Regole complete su git e sessioni: **`sessioni_e_commit.md`** (vale quello, non questo file).

In breve: committo solo `01_Argomenti/`, `LOG.md` e `segnalazioni_studio.md`, con prefisso `studio:`, un commit a ogni unità di lavoro finita. Mai `git add .`.

---

## 7. Log

A fine lavoro aggiungo una riga a `LOG.md` con la data, cosa ho creato o cambiato e dove.

## Matematica: come si scrive un argomento (2026-10-21)
Specifica: `specifiche/modello_matematica.md`. Esempio completo da copiare: `01_Argomenti/Matematica/Derivate/Derivate per situazioni/`.

- **Dove:** `01_Argomenti/Matematica/<Argomento>/<Argomento> per situazioni/` con `indice.yaml`, `schede/<id>.yaml` (tipo `regola`) e, se serve, `esercizi.yaml`. Dall'app: «+ Nuovo → Matematica» crea la struttura.
- **Materiale:** si parte dagli esercizi e dai punti in cui Ste si blocca, non da un programma inventato. Formule e risultati si controllano sul libro di Ste.
- **Mappa:** un ramo = una famiglia di casi, nell'ordine in cui si riconosce l'esercizio. Per le procedure (scomposizione, disequazioni, studio di funzione) il ramo ha `ordine: true`: le schede sono i passi 1, 2, 3. L'indice ha `ingresso` (cosa guardo) e `guida` (la domanda da farsi).
- **Scheda `regola`:** `vedo` (segnale di riconoscimento), `formula` (testo o lista), `adatto` (come adattarla), `esempi` (`da`, `passi`, `ris`, `verifica`), `errore`, `confondi` (`scheda` + `differenza`), `perche`. `comando` è la riga corta sulla foglia della mappa (se manca si usa la prima formula).
- **Formule:** notazione testuale. In `formula`, `da`, `ris`, `comando` senza apici inversi; negli altri testi tra apici inversi. Segni: `^` apice, `_` pedice (un carattere o tra parentesi), `frac(a|b)`, `sqrt(x)`, `->`, `>=`, `<=`, `!=`, `+-`, `inf`, `pi`, `*`. Funzioni: sin cos tan cot arcsin arccos arctan ln log exp. `f` e `g` sono sempre le due funzioni generiche.
- **Controllo con i numeri:** negli esempi di derivate scrivi `verifica: derivata` (`ris` è la derivata di `da`); per la scomposizione `verifica: scomposizione`. Il test calcola i due lati in sei punti e segnala gli esempi che non tornano.
- **Prima di consegnare:** `cd 02_App && npm test`. `tests/regola.test.ts` legge da solo tutti i documenti in `01_Argomenti/Matematica`: indice, schede, collegamenti (`confondi`, `vicine`, passi con scheda, `esercizi.yaml`) e formule.
- **Non si fa:** scrivere interfaccia o codice dell'app (tocca alla sessione di controllo); inventare formule a memoria senza controllo; mettere nei testi parole dentro le formule (`in x = 2`): le lettere vengono lette come variabili.
- **Dimostrazioni di geometria:** si parte dalla tesi. Rami per tipo di tesi, un ramo a passi per lo scheletro. Negli esempi, passi `{dice, perche, scheda}` con la scheda del criterio che li giustifica.

---

## 8. Per non pestarci i piedi

Regole complete su git e sessioni: **`sessioni_e_commit.md`** (vale quello, non questo file).

Specifico per lo studio: non sposto né rinomino cartelle di `01_Argomenti/` senza richiesta di Ste (si rompono indici e test); se serve, lo segnalo in `segnalazioni_studio.md`. Se ho scritto una scheda `regola`, lancio `npx vitest run tests/regola.test.ts` in `02_App` oppure scrivo «non verificato» nel LOG.
