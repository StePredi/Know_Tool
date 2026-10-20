# Matematica dentro «Per situazioni» (PROPOSTA, da approvare)

Stato: bozza del 2026-10-20. Sostituisce la vecchia spec provvisoria (spostata in `_storico/`).
Procedura seguita: `00_Control/procedura_nuovi_documenti.md`. Nessun codice dell'app prima dell'approvazione.

## 1. Il problema (parole di Ste)
Davanti a un esercizio non riconosco **quale strumento** usare e non ricordo **la formula vera** né come adattarla.
Capisco la teoria, ma serve ripescarla in fretta: prima una **tabella/schema da usare durante gli esercizi**, poi la teoria approfondita dietro.

## 2. Decisione di struttura
Niente motore Matematica separato. Si riusa **l'albero di Per situazioni** (mappa a rami, schede, ricerca, modifica sicura, gallery).

- App: **Materia (Matematica) → un documento per argomento**.
- Disco: `01_Argomenti/Matematica/<Argomento>/<Argomento> per situazioni/` con `indice.yaml` + `schede/*.yaml` (+ `esercizi.yaml`).
- `centro` = l'argomento (es. «Derivate»). I **rami** sono le famiglie di casi, nell'ordine in cui si riconosce l'esercizio.
- Cartelle `Fonti / Appunti / Pratica / Schemi` dell'argomento restano come ora.

## 3. Cosa si aggiunge al modello esistente (il minimo)
1. **Nuovo tipo di scheda `regola`** (oltre a ricetta / prima_dopo / figura).
2. **Due campi opzionali in `indice.yaml`**: `ingresso` (come si riconosce l'esercizio, 1 frase) e `guida` (la domanda da farsi: «qual è l'ultima operazione?»). Mostrati sopra la mappa.
3. **`esercizi.yaml`** nella cartella del documento: esercizi reali con il «piano» (sequenza di schede).
4. **Quattro aggiunte** emerse dalla prova su 28 argomenti (vedi `03_Demo/matematica_per_situazioni/materia_matematica.html`, filtro per aggiunta): (+1) `ordine: true` sul ramo → pill numerate, per le procedure; (+2) `vedo` facoltativo, per le formule da ricordare; (+3) tipo di figura per grafici (rimandata dopo Derivate e Limiti); (+4) `passi` degli esempi come `{dice, perche, scheda}`, per le dimostrazioni.
5. Formule: stesso rendering del demo (notazione testuale, tra apici inversi nei testi). Si valuta se riusare `formula.ts` / `FormulaVista` già scritti dall'altra sessione.

Tutto il resto (rami, colori, voci, ricerca, mappa comprimibile, salvataggio con backup) è invariato.

## 4. Scheda `regola` — modello dati (conoscenza, non presentazione)
Campi comuni già esistenti: `id` (= nome file), `tipo: regola`, `titolo`, `sigla` (nome breve sulla foglia), `comando` (la formula in una riga, mostrata sulla foglia), `frase` (quando si usa, 1 riga), `fonte`, `parole` (ricerca), `varianti`, `vicine`.

Campi propri:
| campo | contenuto |
|---|---|
| `vedo` | cosa vedo nell'esercizio (il segnale di riconoscimento) |
| `formula` | testo o lista di formule (la regola vera) |
| `adatto` | lista di casi/adattamenti («se c'è una costante…», «se la base non è e…») |
| `esempi` | lista di `{da, passi[], ris}` svolti |
| `errore` | l'errore tipico |
| `confondi` | lista di `{scheda, differenza}`: con cosa la confondo e come le distinguo |
| `perche` | la teoria breve (perché funziona) |

Una cosa, un posto: la formula sta solo in `formula`; la foglia mostra `comando`, che deve coincidere con la prima formula (controllo automatico).

Esempio (derivata del prodotto):
```yaml
id: prodotto
tipo: regola
titolo: Derivata di un prodotto
sigla: Prodotto
comando: (f·g)' = f'·g + f·g'
frase: l'ultima operazione è una moltiplicazione tra due funzioni con x
vedo: due fattori che dipendono entrambi da x
formula: "`(f*g)' = f'*g + f*g'`"
adatto:
  - se un fattore è costante, esce fuori: `(k*f)' = k*f'`
esempi:
  - da: "`x^2 * sin(x)`"
    passi: ["`f = x^2, g = sin(x)`", "`2x*sin(x) + x^2*cos(x)`"]
    ris: "`2x*sin(x) + x^2*cos(x)`"
errore: derivare i due fattori e moltiplicare le derivate
confondi:
  - { scheda: quoziente, differenza: il quoziente ha il meno e il denominatore al quadrato }
perche: la variazione del prodotto ha un contributo da ciascun fattore
```

## 5. Prova a mano su più argomenti (già fatta nel demo)
Lo stesso modello regge **cinque argomenti** senza cambiare forma: Derivate (schema = ultima operazione), Limiti (cosa esce sostituendo), Scomposizione (fattore comune, poi numero di termini), Disequazioni (zero, fattori, segni, intervalli), Calcolo combinatorio (domande guida: conta l'ordine? ripetizioni? tutti o alcuni?). Differisce solo il contenuto di `ingresso`/`guida` e i rami. Demo: `03_Demo/matematica_per_situazioni/matematica_per_situazioni.html`.

## 6. Verifica
- **Strutturale** (zod, come ora): campi obbligatori, `id` = nome file, `comando` = prima formula, link `vicine`/`confondi`/`piano` verso schede esistenti (`controllaSituazioni`).
- **Formule**: ogni formula si legge con il parser (nessuna notazione non riconosciuta).
- **Esempi contro motore** (da decidere, §8): per Derivate/Limiti, controllo numerico del risultato di ogni esempio.
- Test: esempio YAML della spec = file reale nei test.

## 6bis. Dimostrazioni di geometria
Si parte dalla **tesi**, non dalla teoria: rami «voglio segmenti/angoli uguali», «rette parallele/perpendicolari», «triangoli congruenti/simili», più un ramo a passi «scheletro» (ipotesi, tesi, figura, costruzione) e uno di teoremi da citare. Ogni strategia è una scheda `regola` (formula = criterio). Gli esempi sono dimostrazioni con passi `{dice, perche, scheda}`, dove `scheda` è un link controllato. Non insegna a trovare l'idea da zero.

## 7. Cosa NON fa
- Non risolve esercizi né inventa dimostrazioni né sostituisce il libro.
- Non ha un motore grafico/algebrico proprio (niente grafici, niente editor di formule).
- Non migra in automatico i contenuti dell'altra sessione.
- Nessuna UI nuova oltre al rendering della scheda `regola` e delle due righe `ingresso`/`guida`.

## 8. Da decidere con Ste
1. Va bene `regola` come unico nuovo tipo (e `esercizi.yaml` separato)?
2. Verifica numerica degli esempi: sì per Derivate/Limiti, o solo controllo strutturale?
3. Il codice Matematica non committato dell'altra sessione (`matematica.ts`, `renderer/matematica/*`, `01_Argomenti/Matematica/*`): archiviarlo in `99_Archivio/Obsoleti/<data>/`, tenendo solo `formula.ts`/`FormulaVista` se compatibili?
4. Primo documento da costruire in app: Derivate, poi Limiti?

## 9. Tappe
1. Approvazione di questa spec. 2. Schema zod + test (`regola`, `ingresso`/`guida`, `esercizi.yaml`). 3. Contenuto reale Derivate (dal demo → YAML). 4. Rendering minimo scheda. 5. Prova su Windows. 6. Limiti, poi gli altri argomenti.
