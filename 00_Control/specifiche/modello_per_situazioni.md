# Modello «Per situazioni» (linguaggio o strumento)

Stato: **tappe 1–4 costruite per MikroTik (scheda, mappa essenziale, ripasso, progresso)**; mappa a quattro lati con zoom e trascinamento fatta; restano galleria di «+ Nuovo», generazione con Claude, Git e Python, figure.
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
  schede/<id>.yaml   # una scheda (YAML: scelto al posto di .md perché è tutta struttura)
  progresso.json     # schede ripassate, ultima aperta
```
- `indice.yaml`: rami numerati per difficoltà (7–10), 2–8 foglie per ramo, sottorami solo se ≥ 2 foglie; lato `L R T B`.
- Scheda `ricetta`: `id, titolo, sigla, comando, frase, fonte, parole, quando`; poi `fasi` con `righe` (`codice, commento, parti[{voce,spiega}], trappola`), `segnaposto {NOME: {esempio, spiega}}`, `varianti[{codice,spiega}]`, `vicine[]`.
- Scheda `prima_dopo`: `prima`, `dopo` con parti segnate ⟦ ⟧, `uso`, `riconoscila`, `parti`, `trappola`, `varianti`, `vicine`.
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
(2026-10-14: fatte 1, 3, 4 e la mappa a quattro lati con pan/zoom (prima una griglia, poi sostituita) al posto della 2.)
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

---

## Figure (2026-10-15)

Una scheda può essere una **figura**: un disegno che si apre dalla mappa come le altre situazioni, ha un posto in un ramo e compare come foglia.

Primo modello di disegno: `scheda_pin`, lo schema di una scheda elettronica (per ora tipo DevKit: pin sui due lati, chip al centro, USB in basso).

Formato (`schede/<id>.yaml`):

```
tipo: figura
(id, titolo, sigla, comando, frase, fonte, parole, quando, varianti, vicine: come le altre schede)
disegno:
  modello: scheda_pin
  nome: DOIT ESP32 DevKit V1
  chip: WROOM-32
  famiglie:                       # i colori e i filtri
  - {id: adc, nome: ADC, colore: orange, schede: [adc-leggi]}
  sinistra:                       # dall'alto in basso, come sulla scheda
  - etichetta: D34                # la scritta stampata
    gpio: '34'
    titolo: GPIO34
    famiglie: [adc, in]           # id dichiarati sopra
    funzioni: [ADC1_6]            # come nello schema originale
    spiega: [Ingresso analogico (ADC1, canale 6).]
    nota: ...                     # solo ciò che NON sta nelle fonti
    schede: [pin-solo-ingresso]   # schede collegate in più (si sommano a quelle della famiglia)
  destra: [...]
  componenti:                     # LED, pulsanti: schede sotto il disegno
  - {nome: LED rosso (GPIO2), spiega: ...}
```

Si usa come le altre schede: filtri per famiglia, ricerca di un pin (nome, GPIO, funzione), clic su un pin = spiegazione e schede collegate. La ricerca della mappa trova la figura anche dai nomi dei pin.

Colori delle famiglie: gli stessi dei rami (red, orange, yellow, green, teal, blue, indigo, violet, pink, slate).

Da fare: figure dentro altre schede (per esempio gli schemi di Git: aree, HEAD, merge) e altri modelli di disegno (SVG libero).

