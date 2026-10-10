# Editor del testo — decisioni tecniche

Riepilogo di tutte le decisioni prese su `Editor del testo.dc.html`. Per il confronto con la prima bozza vedi `editor_testo_modifiche.md`.

---

## 1. Principi

| # | Decisione | Perché |
|---|---|---|
| 1.1 | Il testo occupa tutta la superficie; i comandi galleggiano sopra | si legge, non si amministra |
| 1.2 | Niente *Salva*: ogni modifica è immediata | l'etichetta «salvato» è stata rimossa |
| 1.3 | Lettura e modifica sono stati distinti | la modifica è sempre un passaggio esplicito |
| 1.4 | Nessuna statistica a schermo | versi/parole/annotazioni non servivano allo studio |
| 1.5 | Un testo per volta, gli altri in archivio | cambiando testo si conservano annotazioni, parafrasi ed esercizi |

---

## 2. Modello dei dati

```
testo   = { meta:{titolo,autore,anno,opera}, layout:"versi"|"prosa", testo }
ann     = { id, span:[i,j], citato, tipo, sottolinea, chiave, flashcard,
            figura, nota, par, scheda, stato }
parafrasi = { id, ordine, span|null, testo }
esercizio = { id, numero, testo, risposta, correzione, fatta,
              passi:[{ span, citato, et }] }
archivio  = [ { id, meta, testo, layout, anns, paras, esercizi } ]
```

- **2.1** Il testo è **tokenizzato**: ogni annotazione punta a un intervallo di token `[i,j]` **e** conserva il `citato` (le parole testuali). Lo span serve a disegnare, il citato a ritrovarsi.
- **2.2** `stato` dell'annotazione: `ok` · `riagganciata` · `ambigua` · `rotta`.
- **2.3** Cambiando testo, `anns`, `paras` ed `esercizi` del testo precedente finiscono nell'**archivio** insieme al testo; tornandoci si ritrovano intatti.

---

## 3. Evidenziazione

- **3.1** **Continua, non per parola**: lo sfondo copre anche gli spazi tra parole dello stesso intervallo; gli angoli arrotondati restano solo agli estremi. Un'annotazione si legge come un blocco unico.
- **3.2** **Sovrapposizioni**: lo sfondo è uno solo, per priorità **dubbio > definizione > concetto**; ogni annotazione lascia in più una **barra di colore pieno sotto le parole**, impilata, fino a tre visibili.
- **3.3** **La sottolineatura non è un'opzione ma uno strumento** (`S`), disegnata con la stessa barra, in colore inchiostro, e presente nelle liste e nella scheda come le altre marcature.
- **3.4** Colori a piena opacità: niente testo su trasparenze.

---

## 4. Riaggancio dopo una modifica del testo

Quando il testo cambia, ogni annotazione e parafrasi viene ricollocata con questa catena:

1. **4.1** Se le parole all'intervallo attuale coincidono ancora con `citato` → `ok`, non si tocca nulla.
2. **4.2** Altrimenti si cercano **tutte le occorrenze** del `citato` nel nuovo testo.
3. **4.3** Una sola occorrenza → riaggancio automatico, stato `riagganciata`.
4. **4.4** Più occorrenze → vince quella **più vicina alla posizione precedente**; se due sono equidistanti lo stato è `ambigua` e decide la persona.
5. **4.5** Nessuna occorrenza → `rotta`.
- **4.6** **Niente si perde mai in silenzio.** Il riaggancio automatico si annuncia con una riga discreta (*«Riagganciata da sola dopo una modifica del testo»*) con conferma *Ok*; i casi `rotta`/`ambigua` mostrano un avviso giallo con *Riaggancia sulla selezione* (attivo solo se c'è una selezione).
- **4.7** Al salvataggio della modifica si riporta il conteggio: quante riagganciate, quante da sistemare.

---

## 5. Layout

- **5.1** **Card flottanti**, non colonne: strumenti a sinistra e pannelli a destra hanno angoli a 16 px, ombra e margine di 16 px dai bordi della finestra; il testo scorre sotto.
- **5.2** Il padding del contenitore del testo **si adatta all'apertura dei pannelli**: la colonna di lettura non finisce mai nascosta.
- **5.3** **Barra sinistra**: di default una **colonna stretta di 60 px già operativa** — sei strumenti (tre evidenziatori, sottolineatura, parola chiave, flashcard) con il proprio conteggio, più il totale in fondo. Si annota senza mai aprirla; l'apertura è una scelta (`☰`), **mai automatica alla selezione**.
- **5.4** Gli strumenti **si disattivano quando non c'è selezione**.
- **5.5** **Barra destra**: collassa in una pillola che riporta il pannello attivo e il conteggio (*«Annotazioni · 9»*); si chiude sotto 1180 px e si riapre tornando larghi. È **ridimensionabile** con una maniglia.
- **5.6** Intestazione delle barre fissa, scroll confinato al corpo, `scrollbar-gutter: stable` e scrollbar sottile: la barra resta dentro i bordi arrotondati.
- **5.7** **Testo centrato** orizzontalmente nella card con allineamento interno a sinistra (come nelle edizioni a stampa); la prosa ha `max-width: 68ch`. La card cresce con il contenuto invece di riempire la finestra.

---

## 6. Intestazione e aiuti

- **6.1** **Una sola fascia** (prima erano due). Statistiche rimosse.
- **6.2** I comandi secondari sono **icone quadrate 34 px** con `title` e `aria-label`: `#` numeri di riga, `?` legenda, `↗` scheda sulla mappa, `☀`/`☾` tema, `Aa` lettura. Restano a etichetta solo i due controlli con stato: segmento **Versi/Prosa** e **zoom**. *+ Testo* chiude la fila.
- **6.3** Legenda e scorciatoie sono confluite in **un unico popover `?`**: campioni di colore (compreso l'esempio di doppia annotazione), sottolineatura, figura retorica, parola chiave, tutte le scorciatoie. Si chiude con clic fuori o `Esc`.

---

## 7. Scheda di studio dell'annotazione

- **7.1** Ogni annotazione, da entrambe le viste della lista, apre una **scheda modale** sul singolo passo.
- **7.2** Contiene: il **passo nel contesto** (verso o paragrafo intero, con l'evidenziazione al punto giusto), la posizione e il contatore *3 di 9*, le marcature, la figura retorica (nome, tipo, descrizione, esempio), la nota di studio, la parafrasi collegata, la scheda sulla mappa, l'eventuale avviso *da riagganciare*.
- **7.3** **Si apre in sola lettura**: niente input, niente pulsanti di stato, tipografia della lettura. *Modifica* attiva le marcature, apre la nota, consente di cambiare figura e mostra *Elimina*; *Fine* torna alla lettura.
- **7.4** In lettura **le sezioni vuote non compaiono**; in modifica compaiono tutte.
- **7.5** Navigazione `◂ ▸` o frecce, `Esc` chiude, *Vai al testo* seleziona il passo nel documento.

---

## 8. Parafrasi

- **8.1** Due modi di crearla: **sulla selezione** (`P`), che la lega a un intervallo e ne cita il passo, oppure **libera**, senza ancoraggio.
- **8.2** Una parafrasi ancorata mostra il **passo citato** in `blockquote` e si può **scollegare** dal testo restando una parafrasi libera.
- **8.3** Il verso che ha una parafrasi collegata lo segnala con un pulsante che porta lì.
- **8.4** Le parafrasi seguono lo stesso riaggancio delle annotazioni quando il testo cambia.

---

## 9. Esercizi

- **9.1** **Il testo della domanda è sempre modificabile**, anche dopo l'importazione: niente campo bloccato.
- **9.2** **Una domanda può puntare a più passi del testo.** `passi` è una lista; ogni passo ha il suo `span`, il suo `citato` e una **etichetta breve** (`et`) scritta a mano per distinguerlo (*«v. 1-4»*, *«la siepe»*).
- **9.3** Si aggiunge un passo selezionando il testo; si rimuove singolarmente. Un esercizio senza passi è legittimo.
- **9.4** **Ordine del pannello: esercizi in alto, foglio di risposta al centro, collegamenti al testo in basso.** Si legge la domanda, si risponde, e solo dopo si guarda a cosa rimanda.
- **9.5** **Importazione in due fasi**: si incolla il blocco di domande, si vede l'anteprima della divisione, si conferma. Le righe vuote vengono scartate, la numerazione è ricalcolata.
- **9.6** Ogni esercizio ha `risposta` (dello studente), `correzione` e `fatta`; il filtro in alto seleziona *tutti / da fare / fatti*.
- **9.7** Scorciatoia `D` per una nuova domanda dalla selezione.

---

## 10. Testi e archivio

- **10.1** *+ Testo* apre il modulo con **titolo, autore, anno, opera, layout, corpo**: il nuovo testo parte pulito, il precedente va in archivio con tutto il suo stato.
- **10.2** Un testo può nascere **vuoto** (import successivo): l'editor mostra lo stato *Vuoto (import)* e l'area d'incolla.
- **10.3** Il selettore dei testi riprende un testo dall'archivio **con annotazioni, parafrasi ed esercizi**, mettendo in archivio quello corrente.
- **10.4** `↗ Scheda sulla mappa` è il ponte verso la Home dell'autore (da collegare alla cartella `testi/`).

---

## 11. Tastiera

`1`/`2`/`3` evidenziatori · `S` sottolinea · `K` parola chiave · `F` flashcard · `N` nota · `P` parafrasi · `D` domanda · `← →` sposta la selezione, con `Shift` la estende · `Esc` deseleziona o chiude.
