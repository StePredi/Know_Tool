# Matematica: argomenti del programma e come si adatta il tool (2026-10-19)

Stato: **analisi in corso**. Elenco fornito da Ste (programma ufficiale: primo biennio per tutti, settore tecnologico, settore economico). Serve a controllare se la struttura pensata per il tool (riconoscere cosa fare davanti all'esercizio) regge su argomenti molto diversi.

---

## 1. L'idea del tool (da mettere alla prova)

- **Si parte dall'esercizio**: cosa vedo, quindi cosa faccio.
- Ogni **scheda di regola** ha: come la riconosci, cosa fai, formula, esempio svolto, errore tipico, regole da non confondere, e un **grafico o una figura interattivi dove servono**.
- **Radiografia** (prova fatta il 2026-10-19 sulle derivate): si scrive l'espressione, l'app la scompone in scatole annidate, la mossa più esterna decide la regola, il piano d'attacco va dall'esterno verso l'interno.
- Modalità: Radiografia, Tavola delle forme, Allenamento a riconoscere, Ripasso.
- Formule scritte con la tastiera normale (`x^2`, `sqrt(x)`, `pi`, `>=`), mostrate in forma bella; grafici di funzione dove sono utilizzabili.

---

## 2. I sei tipi di «ingresso»

Cosa ti dà l'esercizio decide come si riconosce la regola.

| Codice | Ingresso | Come si riconosce | Motore che serve |
|---|---|---|---|
| E | Espressione o equazione scritta | dalla struttura (la mossa più esterna) | lettore di espressioni, scatole annidate, grafico |
| T | Testo del problema | con domande guida («l'ordine conta?», «c'è ripetizione?») | albero di domande |
| F | Figura geometrica | dalla configurazione (parallele, triangolo rettangolo…) | figura interattiva in SVG |
| D | Dati (tabella, elenco) | dal tipo di dato (qualitativo, quantitativo, a coppie) | tabella dati, grafici statistici |
| P | Parametri di una situazione | dalle parole chiave e dai numeri | calcolatore con grafico o linea del tempo |
| R | Regione o curva nel piano | dal tipo di vincolo o di equazione | piano cartesiano con regioni |

---

## 3. Tutti gli argomenti

Legenda adattamento: **✓** la struttura attuale basta · **~** serve un adattamento · **✗** serve un motore nuovo.
Settore: **B** primo biennio (tutti) · **T** tecnologico · **Ec** economico.

### Primo biennio (1ª e 2ª)

| # | Argomento | Sett. | Ingresso | Cosa si riconosce | Visual | Adatt. |
|---|---|---|---|---|---|---|
| 1 | Insiemi numerici (N, Z, Q, R) | B | E | a quale insieme appartiene un numero | retta dei numeri, inclusioni | ~ |
| 2 | Potenze | B | E | quale proprietà (stessa base, stesso esponente…) | — | ✓ |
| 3 | Percentuali | B | T | sconto, aumento, percentuale di cosa | barra del 100 % | ✗ |
| 4 | Proporzioni | B | E, T | incognita nel medio o nell'estremo | — | ~ |
| 5 | Radicali | B | E | proprietà, razionalizzazione, condizioni di esistenza | — | ✓ |
| 6 | Monomi e polinomi | B | E | operazione e grado | — | ✓ |
| 7 | Scomposizione | B | E | **checklist in ordine** (raccoglimento, differenza di quadrati, trinomio…) | — | ~ |
| 8 | Frazioni algebriche | B | E | scomposizione, condizioni di esistenza, semplificazione | — | ✓ |
| 9 | Equazioni di 1º e 2º grado, anche fratte | B | E | grado, fratta, forma incompleta | parabola | ✓ |
| 10 | Disequazioni di 1º e 2º grado, anche fratte | B | E, R | segno dei fattori | tabella dei segni, parabola | ~ |
| 11 | Sistemi lineari | B | E | metodo adatto dai coefficienti | rette che si incontrano | ~ |
| 12 | Geometria euclidea del piano (congruenza, triangoli, parallele, quadrilateri, circonferenza) | B | F | quale criterio o proprietà | figura interattiva | ✗ |
| 13 | Equivalenza, similitudine, Talete, Pitagora, Euclide | B | F | quale teorema dalla configurazione | figura interattiva | ✗ |
| 14 | Trasformazioni geometriche | B | F, E | quale trasformazione e come si scrive | figura che si muove | ✗ |
| 15 | Piano cartesiano, retta e parabola | B | E, R | forma dell'equazione | grafico | ✓ |
| 16 | Funzioni lineari e quadratiche, proporzionalità diretta e inversa | B | E | tipo di funzione | grafico | ✓ |
| 17 | Funzioni a tratti, lettura di grafici | B | E, R | **ingresso = un grafico da leggere** | grafico | ~ |
| 18 | Statistica descrittiva | B | D | tipo di dato, indice adatto | tabelle, istogrammi | ✗ |
| 19 | Probabilità elementare | B | T | evento semplice, composto, contrario | albero, diagramma | ✗ |
| 20 | Foglio elettronico | B | — | fuori dal tool (eventuale collegamento) | — | — |

### Settore tecnologico: secondo biennio

| # | Argomento | Ingresso | Cosa si riconosce | Visual | Adatt. |
|---|---|---|---|---|---|
| 21 | Goniometria e trigonometria | E, F | identità, tipo di equazione, triangolo da risolvere | circonferenza goniometrica | ~ |
| 22 | Funzioni esponenziali e logaritmiche | E | proprietà, tipo di equazione | grafico | ✓ |
| 23 | Numeri complessi | E | forma (algebrica, trigonometrica, esponenziale) e operazione | piano di Gauss | ~ |
| 24 | Geometria analitica: coniche | E, R | quale conica dai coefficienti | grafico con fuochi e assi | ~ |
| 25 | Elementi di logica matematica | E | connettivi, quantificatori | tavola di verità | ✗ |
| 26 | Calcolo combinatorio e probabilità | T | ordine, ripetizione, tutti gli elementi | albero di domande | ✗ |
| 27 | Successioni | E, D | aritmetica, geometrica, ricorsiva | punti sul piano | ~ |
| 28 | Limiti e continuità | E | **forma del limite** (0/0, ∞/∞, ∞−∞…) | grafico con asintoti | ✓ |
| 29 | Introduzione alla derivata | E | rapporto incrementale, significato | tangente | ✓ |
| 30 | Complementi (approfondimenti) | vari | a seconda dell'indirizzo | vari | — |

### Settore tecnologico: quinto anno

| # | Argomento | Ingresso | Cosa si riconosce | Visual | Adatt. |
|---|---|---|---|---|---|
| 31 | Derivate | E | la mossa più esterna (prova già fatta) | grafico, tangente | ✓ |
| 32 | Studio di funzione | E | **procedura a tappe** (dominio, simmetrie, segno, limiti, asintoti, derivate) | grafico che si costruisce a tappe | ~ |
| 33 | Integrali indefiniti | E | forma (immediato, per parti, sostituzione, fratti semplici) | — | ✓ |
| 34 | Integrali definiti, aree e volumi | E | area tra curve, solido di rotazione | area ombreggiata, solido | ~ |
| 35 | Integrazione numerica | E | metodo (rettangoli, trapezi, Cavalieri-Simpson) | rettangoli e trapezi | ~ |
| 36 | Equazioni differenziali (cenni) | E | tipo (separabili, lineari del 1º ordine) | campo di direzioni | ~ |
| 37 | Probabilità e statistica: distribuzioni, inferenza di base | D, P | quale distribuzione, quale intervallo | curve con cursori | ✗ |

### Settore economico

| # | Argomento | Ingresso | Cosa si riconosce | Visual | Adatt. |
|---|---|---|---|---|---|
| 38 | Matematica finanziaria (interesse semplice e composto, sconto, rendite) | P, T | regime, tipo di rendita | linea del tempo dei flussi | ✗ |
| 39 | Statistica: regressione e correlazione | D | dati a coppie | diagramma di dispersione con retta | ✗ |
| 40 | Applicazioni economiche dell'analisi (costo, ricavo, profitto, domanda, offerta) | E, T | significato economico della derivata | grafici costo/ricavo, pareggio | ~ |
| 41 | Funzioni di due variabili, massimi e minimi | E | tipo di punto stazionario | curve di livello | ✗ |
| 42 | Ricerca operativa e programmazione lineare | R, T | vincoli, funzione obiettivo | regione ammissibile e vertici | ✗ |
| 43 | Problemi di scelta in certezza e incertezza | T, D | criterio (valore atteso, Wald, Laplace…) | tabella dei risultati, albero | ✗ |

(Nel settore economico tornano anche esponenziali e logaritmi, logica, geometria analitica essenziale, analisi con limiti e derivate, calcolo combinatorio e probabilità: sono gli stessi argomenti dei numeri 22, 24, 25, 26, 28–32.)

---

## 4. I più diversi tra loro

Scelti perché ognuno obbliga a un modo di riconoscere diverso:

1. **Geometria euclidea** (12–14): l'ingresso è una figura.
2. **Calcolo combinatorio e probabilità** (26, 19, 3, 43): l'ingresso è un testo.
3. **Statistica** (18, 39, 37): l'ingresso sono dati.
4. **Logica matematica** (25): l'uscita è una tavola di verità.
5. **Programmazione lineare** (42, 41): l'ingresso è una regione nel piano.
6. **Studio di funzione** (32): non c'è una sola regola ma una procedura a tappe.

Riferimento: **Derivate** (31), dove la radiografia funziona già.

---

## 5. Decisioni di Ste

- **2026-10-19**: gli argomenti **solo del settore economico** (38–43: matematica finanziaria, regressione, applicazioni economiche, funzioni di due variabili, programmazione lineare, problemi di scelta) vanno **in fondo**, dopo tutto il resto.
- **2026-10-19**: la struttura va provata su argomenti che Ste **conosce**, altrimenti non può giudicare se è giusta. Gli argomenti di prova si scelgono tra quelli che ha già studiato (vedi §6).

## 6. Argomenti noti per provare ogni forma di riconoscimento

| Forma da provare | Argomento difficile da giudicare | Alternativa che Ste conosce |
|---|---|---|
| a scatole (E) | derivate | derivate (già prova fatta) |
| a domande guida (T) | calcolo combinatorio | percentuali e proporzioni |
| a procedura in ordine | studio di funzione | scomposizione dei polinomi |
| a dati (D) | regressione, distribuzioni | statistica descrittiva |
| a figura (F) | similitudine, trasformazioni | Pitagora, Talete, Euclide |
| a regione (R) | programmazione lineare | disequazioni e sistemi |
