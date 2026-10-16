# Proposta: modifica dei file e organizzazione delle cartelle (2026-10-16)

Da approvare dall'utente prima di toccare codice o cartelle. Punti 3 e 4 dell'elenco in `STATO.md`.

---

## 3. Modifica di ogni documento dell'app

**Obiettivo:** l'utente deve poter lavorare sui contenuti dall'app (appunti, schede, indice), non solo la sessione di studio.

### Cosa si modifica e come

| Tipo di file | Come si modifica | Fase |
|---|---|---|
| Appunti e pratica (`.md`) | Pulsante **Modifica** in alto: testo a sinistra, anteprima a destra; **Salva** (Ctrl+S) | 1 |
| Schede «Per situazioni» (`.yaml`) | Stesso editor di testo, ma **controlla lo schema prima di salvare**: errori in rosso con riga e motivo; non salva se rotto | 1 |
| `indice.yaml` (rami, ordine, gruppi) | Come sopra; poi, in fase 3, trascinamento dei rami e delle schede sulla mappa | 1 → 3 |
| Schede «Per situazioni» a moduli | Campi separati: titolo, sigla, comando, frase, righe di codice, trappole, collegamenti | 3 |
| Testi e autori (italiano) | Hanno già il loro editor: non cambia | — |
| File non di testo (pdf, pptx, immagini) | Si aprono col sistema (già fatto); da lì li modifica il programma giusto | — |

### Regole di sicurezza (valgono per tutti)

1. **Salvataggio sicuro**: file temporaneo + rinomina (come già per i progressi). Mai un file a metà.
2. **Copia prima di sovrascrivere**: la versione precedente va in `99_Archivio/Versioni/<percorso>/<data-ora>` (ultime 10 per file). Nulla si perde.
3. **Lavoro in due**: se la sessione di studio (o tu da un altro programma) cambia il file mentre lo stai modificando, al salvataggio compare l'avviso «Il file è cambiato sul disco» con tre scelte: *Ricarica* · *Confronta* · *Sovrascrivi*. L'app già rilegge i file quando la finestra torna in primo piano.
4. **Bozza non salvata**: se chiudi la scheda con modifiche, l'app chiede cosa fare.
5. **Solo dentro `01_Argomenti`**: stessa validazione dei percorsi di oggi.

### Fasi

1. Editor di testo per `.md` e `.yaml` (anteprima, validazione, copia di sicurezza, avviso di conflitto)
2. Nuovo file / nuova cartella / rinomina / archivia anche per appunti e schede
3. Modifica a moduli delle schede e trascinamento dei rami nell'indice
4. Proposte di Claude dentro l'app (Applica / Scarta) sugli stessi file

### Da decidere

- Editor di testo semplice (Markdown puro) o con barra di formattazione (grassetto, titoli, elenchi)?
- Le schede a moduli (fase 3) subito dopo la fase 1, o prima le cartelle?
- Quante versioni tenere per file (proposta: 10)?

---

## 4. Organizzazione delle cartelle

### Come è oggi (problemi)

```
01_Argomenti/
  Matematica/            <- maiuscola
  TPSIT/MSP/             <- maiuscola
    fonti  appunti  pratica  schemi      <- minuscole, accanto a «MSP per situazioni»
  informatica/reti/      <- minuscole
    MikroTik per situazioni
  italiano/              <- minuscola (e nome fisso nel codice)
    autori/leopardi/...  fonti  _condiviso
```

- Maiuscole miste; i nomi dei gruppi di materiale (`fonti`, `appunti`…) cambiano da materia a materia o mancano
- Le documentazioni dell'app stanno mischiate al materiale grezzo
- `italiano` e `italiano/autori` sono scritti dentro il codice (non si possono rinominare dall'app)

### Struttura proposta

```
01_Argomenti/
  Italiano/
    Autori/
      leopardi/            <- nome tecnico (id): resta minuscolo, nell'app si vede «Giacomo Leopardi»
    Fonti/
  Informatica/
    Reti/
      Mappe/
        MikroTik per situazioni/
  TPSIT/
    MSP/
      Fonti/       <- pdf, slide dei professori (originali, mai modificati)
      Appunti/     <- teoria
      Pratica/     <- esercizi e codice
      Schemi/      <- immagini, schemi, pagine html
      Mappe/
        MSP per situazioni/
  Matematica/
```

**Regola in una riga:** Materia › Argomento › {Fonti, Appunti, Pratica, Schemi, Mappe}. Non tutte servono sempre: l'app mostra solo quelle che esistono.

- **Maiuscola iniziale** per ogni cartella visibile, imposta dall'app (nome corretto in automatico quando crei o rinomini) e dalle regole della sessione di studio
- **«Nuovo argomento»** crea le cartelle standard già pronte
- Restano com'è: `00_Control`, `02_App`, `03_Demo`, `99_Archivio` (prefissi numerici = cartelle dell'app, non di studio)

### Cosa tocca la migrazione (e come la faccio senza rischi)

1. **Codice**: `italiano` e `italiano/autori` diventano `Italiano` e `Italiano/Autori` (esplora, repository, richiesta, stato, test)
2. **Spostamenti con git** (`git mv`), in un solo commit, con **elenco prima** (nessuno spostamento finché non lo approvi)
3. **Windows non distingue maiuscole e minuscole**: `italiano` → `Italiano` si fa in due passaggi (nome provvisorio) per non confondere git
4. **Riferimenti dentro gli appunti** (`fonti/x.pdf`, `pratica/...`): l'app cerca in modo insensibile alle maiuscole, così non si rompe nulla
5. **Schede aperte, preferiti e recenti**: i percorsi cambiano; l'app toglie da sola quelli che non esistono più (già così oggi)
6. Aggiorno `sessione_studio.md` con la struttura nuova, perché la sessione di studio la rispetti

### Da decidere

- Le cinque cartelle standard vanno bene? Nomi al plurale come sopra?
- `Mappe/` per le documentazioni «Per situazioni», o le lasciamo accanto agli appunti?
- I nomi tecnici degli autori (`leopardi`) restano minuscoli? (non si vedono nell'app)
- Posso partire con l'elenco degli spostamenti (solo elenco, senza muovere niente)?

---

## Decisioni dell'utente (2026-10-16)

1. Editor degli appunti: **con barra di formattazione** (non Markdown puro)
2. Ordine: **prima le schede a moduli**, poi le cartelle
3. **Niente cartella `Mappe/`**: i documenti utili (le mappe «Per situazioni») stanno **direttamente nella cartella dell'argomento**, accanto a Fonti, Appunti, Pratica, Schemi
4. I nomi tecnici (id degli autori, ecc.) li scelgo io

Struttura aggiornata:

```
Materia/
  Argomento/
    <Mappa per situazioni>/     <- documento utile, subito visibile
    Fonti/  Appunti/  Pratica/  Schemi/
```

## Stato dei lavori

- FATTO 2026-10-16: modifica delle schede «Per situazioni» a moduli e come testo YAML, con salvataggio sicuro (copia in `99_Archivio/Versioni`, ultime 10; avviso se il file è cambiato sul disco)
- Da fare: editor degli appunti `.md` con barra di formattazione; modifica di `indice.yaml` (rami, ordine); nuova scheda / elimina; moduli per le figure; poi l'elenco degli spostamenti delle cartelle
