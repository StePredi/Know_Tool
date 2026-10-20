# COME SI PROGETTA UN NUOVO TIPO DI DOCUMENTO

Vale per ogni nuovo modello della galleria «+ Nuovo» (Matematica, Inglese, Storia, Git…). Nasce da come sono stati fatti bene «Italiano» e «Per situazioni» e da cosa è andato storto con Matematica (2026-10-20).

---

## L'ordine non si cambia

> **1. Problema → 2. Materiale vero → 3. Prova a mano → 4. Modello dei file → 5. Verifica → 6. Specifica approvata → 7. Schermata minima → 8. Prova dell'utente.**

Nessun passo si salta e la schermata viene **per ultima**. Se mi accorgo di disegnare una schermata prima del passo 6, mi fermo.

---

## I passi

### 1. Problema (una frase)
Cosa non riesce a fare l'utente oggi e cosa deve riuscire a fare con il documento.
Esempio: «davanti a un esercizio non so che regola usare».

### 2. Materiale vero
Il documento nasce da cose **dell'utente**: appunti, libro, indice del programma, esercizi e verifiche vere, errori fatti.

- Se il materiale c'è: lo leggo tutto prima di proporre qualsiasi struttura.
- Se manca la teoria: bastano il **libro/indice** e **5-10 esercizi veri** con una riga ciascuno su *dove ci si blocca*. Gli errori reali decidono cosa serve.
- Teoria scritta da Claude senza fonte = `bozza: true`, con scritto da dove arriva; l'utente la corregge. Mai presentata come verificata.

### 3. Prova a mano (in file di testo, senza schermata)
Svolgo **3 esempi veri** nel formato che penso di usare, in testo semplice, e li salvo in `specifiche/prove/<modello>/`.

- Almeno **2 argomenti diversi** tra loro, perché una struttura provata su un caso solo non dimostra niente.
- I prototipi fatti in chat vanno salvati: se non sono salvati, il ragionamento non esiste.

### 4. Modello dei file
Si decide **cosa c'è in un file**, in due livelli:

- **Conoscenza** (obbligatoria): cosa è vero e cosa fare. Per esempio: come si riconosce, cosa si fa, esempio svolto, errore tipico, da non confondere.
- **Presentazione** (non nei file): colori, animazioni, disegni. Li produce il codice a partire dalla conoscenza. Un campo che dice *come mostrare* qualcosa (`figura`, `animazione`, `colore`) è ammesso solo se non si può ricavare, ed è facoltativo.

Regole:

- una cosa = un file; una scheda sta in circa 30 righe;
- ogni dato ha **un solo posto** (niente stessa informazione scritta due volte);
- nomi fissi dal modello, nessun file che differisce per le sole maiuscole;
- un file nuovo deve poter essere scritto da Claude **e** corretto da Ste a occhio.

### 5. Verifica
Prima della schermata:

- schema con messaggi di errore leggibili (zod), mai un blocco, solo avvisi;
- dove c'è un calcolo, un **test automatico** confronta ogni esempio dei file con il motore;
- salvataggio sicuro (`main/modifica.ts`): file temporaneo, copia in `99_Archivio/Versioni/`, mai cancellare.

### 6. Specifica scritta e approvata
Un file in `specifiche/` con queste sezioni:

1. Problema e utente
2. Materiale usato (e cosa manca)
3. Unità di conoscenza (cos'è «una scheda»)
4. Modello dei file (campi, esempio completo)
5. Prove fatte (link a `specifiche/prove/`)
6. Come si verifica che sia giusto
7. Cosa NON fa (confini)
8. Da decidere con Ste

**L'utente approva** (anche con un «ok vai»). Poi il modello entra in `DECISIONI.md`.

### 7. Schermata minima
Una sola vista che mostra la conoscenza dei file, riusando i componenti già esistenti (formule, mappe, schede). Niente animazioni o decorazioni finché la base non è provata.

### 8. Prova dell'utente su Windows
Ste prova l'app vera (non il browser). Si corregge. Solo dopo si aggiungono viste, esercizi, ripasso, una cosa alla volta, ognuna con la sua nota nella specifica.

---

## Cosa non si fa

- Schermata prima del modello dei dati.
- Dati inventati presentati come materiale vero.
- Struttura provata su un solo argomento e poi dichiarata «universale».
- Un nuovo tipo di figura o di campo per ogni argomento.
- Lo stesso dato copiato a mano in più campi.
- Scrivere altre regole nello stesso formato prima che l'utente abbia approvato il primo.
- Codice nuovo sopra codice non ancora provato in Electron.

---

## Esempi da seguire

- **Per situazioni**: materiale vero (documentazione MikroTik) → specifica `modello_per_situazioni.md` → modello `indice.yaml` + schede → schermata.
- **Italiano**: testi e autori veri → `formato_studio_italiano.md` → schermate.

## Dove siamo con Matematica

Il punto 6 non c'è: la specifica `modello_matematica.md` è nata dalla schermata. Si riparte dal punto 2 con libro/indice e gli esercizi dell'utente.
