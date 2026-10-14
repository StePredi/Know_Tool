# Modello «Per situazioni» (linguaggio o strumento)

Stato: **specifica da approvare** — nulla è ancora costruito.
Origine: la «guida documentazione per situazioni» di Ste e tre documentazioni già fatte (Git, Python, MikroTik).

## 1. A cosa serve
Studiare un linguaggio o uno strumento partendo da **cosa devi fare** e non dal nome del comando.
Una documentazione = una mappa di situazioni → schede pratiche (ricetta o prima-e-dopo) con trappole e ripasso.
Compare in «+ Nuovo» come modello, tra i «Consigliati» delle materie tecniche e in «Per tutte le materie».

## 2. Stile (decisione di Ste)
- Base: **Know_Tool** (token, Atkinson Hyperlegible, schede, bottoni, chip, ricerca). Il monospazio JetBrains Mono è solo per il codice.
- **Palette dei rami vivace**, solo su rami, foglie, numeri di fase e segni di avanzamento: 8 colori stabili con tinta chiara (`t`) e testo scuro (`k`), verificati in chiaro e scuro.
- **Riferimento di stile: la documentazione MikroTik** (preferita da Ste, soprattutto nei dettagli). Dettagli da riprendere:
  - ricerca grande con tasto `/` e risultati con badge del ramo; contatore «n di N ripassate»;
  - ramo cliccato = messa a fuoco: gli altri si abbassano, sulle foglie compare la frase «w» in corsivo al posto del comando; `Esc` esce;
  - foglie con comando in chip piccolo, spunta ✓ quando ripassata, sottorami a pillola vuota con bordo colorato;
  - pan con trascinamento, zoom con ± / percentuale / «Tutta», Ctrl+rotella;
  - scheda: tipo in maiuscoletto, chip col comando, riquadro «Quando serve» colorato, pillola del livello;
  - riga riassuntiva (fasi, righe, trappole) con i pulsanti accanto; riquadro «trappole» con link che portano alla riga;
  - note laterali con numero tondo, bordo giallo se c'è una trappola, evidenziazione incrociata riga ↔ nota;
  - segnaposto in corsivo colorato, con valore d'esempio e spiegazione;
  - Prima e dopo con etichette «Prima»/«Dopo» rosso/verde e parti modificate evidenziate;
  - «Precedente / Successiva» e «Situazioni vicine» a chip con il comando; avviso breve (toast) quando si segna come ripassata.
- Il codice **non scorre mai in orizzontale**: va a capo con rientro.

## 3. Dati: tutto in file, nella cartella del documento
```
<cartella>/<nome>/
  indice.yaml        # titolo, centro (es. «Git»), rami (id, nome, colore, lato, gruppi, schede in ordine)
  schede/<id>.md     # una scheda: frontmatter + sezioni
  progresso.json     # schede ripassate, ultima aperta
```
- `indice.yaml`: rami numerati per difficoltà (7–10), 2–8 foglie per ramo, sottorami solo se ≥ 2 foglie; lato `L R T B`.
- Scheda `r` (ricetta): `titolo, sigla (s), comando (k), frase (w), fonte (src), parole (kw), quando`; poi fasi con righe `{c, m, a[], t}`, `segnaposto`, `varianti`, `vicine`, `figura?`.
- Scheda `p` (prima e dopo): `prima`, `dopo` con parti segnate ⟦ ⟧, `uso`, `riconoscila`, `parti`, `trappola`, `varianti`, `vicine`.
- Stesso modello dati della guida (branches + pages), ma scritto in file leggibili e modificabili a mano.
- Una validazione (zod) controlla campi obbligatori, rami e vicine esistenti, segnaposto dichiarati.

## 4. Schermate
1. **Mappa** — mappa a quattro lati (guida) con le regole di stile del §2.
2. **Scheda** — ricetta o prima-e-dopo, con trappole sulle righe, anatomia, segnaposto.
3. **Ripasso** — interruttore sulla scheda: il codice si sfoca, si scopre riga per riga col clic; «Segna come ripassata».
4. **Ricerca** — su titolo, comando, parole chiave, «quando».
Si apre in una scheda (tab) dell'app come mappa e testi; nell'albero ha un'icona sua.

## 5. Generazione da parte di Claude
- Ste dà nome dello strumento/linguaggio e, se vuole, le fonti. Claude scrive **solo una proposta** (`proposta_documentazione/` dentro la cartella) seguendo la guida (§8.3).
- L'app mostra la proposta, controlla i campi e i collegamenti tra schede, e Ste **applica o scarta** (come per la scheda riassuntiva). Nulla viene sovrascritto senza conferma.
- Per aggiungere schede a una documentazione esistente: proposta parziale, stessa conferma.

## 6. Contenuti iniziali
Git, Python e MikroTik vengono **convertiti** dai tre artifact nei file del §3 e compaiono come tre documentazioni pronte. Conversione automatica con controllo a campione; resta il giudizio di Ste sul risultato.

## 7. Cosa NON c'è (per ora)
Niente flashcard, niente quiz. Figure SVG animate (Git `aree`, `head`, `ff`, `merge`, `rebase`): in un secondo passo, con un solo meccanismo comune. Temi diversi per documentazione: no.

## 8. Tappe di costruzione
1. Formato file + lettura/validazione + conversione dei tre artifact + test.
2. Mappa (pan/zoom, fuoco, ricerca).
3. Scheda ricetta + prima-e-dopo.
4. Ripasso e progresso.
5. Voce nella galleria di «+ Nuovo» e nodo nell'albero.
6. Generazione con proposta e conferma.
7. Figure SVG.
Ogni tappa: provata nel browser con dati veri, poi consegnata e commitata.

## 9. Da confermare con Ste
- Le 8 tinte dei rami (Git/Python/MikroTik ne usano 8–11): se un ramo extra serve, si riusano i colori in giro.
- Dove stanno le documentazioni nella materia (proposta: cartella `Informatica/...` scelta da Ste alla creazione).
- Tema chiaro/scuro: segue l'app, niente pulsante tema separato.
