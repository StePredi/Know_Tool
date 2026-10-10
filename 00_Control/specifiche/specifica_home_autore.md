# Home dell'autore — specifica realizzativa

Documento operativo di `Home Autore.dc.html`: cosa fa, com'è fatto dentro, e in che punti **aggiorna** la bozza `formato_studio_italiano.md` (che resta valida per tutto il resto: cartelle, testi, editor, stato dello studente).

Stato: implementato e verificato nella demo. Autore di prova: Leopardi (41 schede, 6 categorie, 10 temi, 7 periodi).

---

## 1. Due obiettivi di questa fase

1. **Universalità.** La home non è più «la mappa di Leopardi»: è la mappa di *qualunque* autore. Niente corsie, temi, periodi o anni codificati nel programma.
2. **Modifica rapida senza disturbare lo studio.** Tutto è aggiungibile e modificabile, ma l'interfaccia di modifica esiste solo quando la si chiede.

Ne derivano due regole di progetto:

- **Nessun dato nel codice dell'interfaccia.** L'interfaccia legge una struttura dati; i dati di Leopardi sono solo il seme iniziale.
- **Due modalità, una sola schermata.** Studio (predefinita) e Modifica. Il passaggio è un bottone, non una pagina diversa.

---

## 2. Modello dei dati

Un unico oggetto `data`, che corrisponde — con nomi abbreviati — ai file della specifica a cartelle (`autore.md`, `temi.md`, `schede/*.md`).

```
data = {
  autore:  "Giacomo Leopardi",
  lanes:   [ { k, name, short, hue } ],        // le categorie/corsie
  temi:    [ { k, name } ],
  periods: [ { k, name, d } ],                 // d = data d'inizio
  schede:  [ scheda ]
}

scheda = {
  id, l,            // l = chiave della categoria
  d,                // data, testo libero (vedi §3)
  short, title,
  pg, ext,          // pagine del manuale; ext = fuori dal libro
  temi: [k], k: [id],   // temi; collegamenti (un lato solo)
  sum, det: [riga],
  w,                // avviso (facoltativo)
  text:  { title, meta, lines: [riga] },        // testo chiave (facoltativo)
  table: { title, intro, cols: [], rows: [[]] } // tabella (facoltativa)
}
```

Corrispondenze con la bozza: `lanes` = `corsie`, `l` = `corsia`, `d` = `anno` + `etichetta_anno` **fusi in un campo solo**, `k` = `collegamenti`, `sum` = sezione *Riassunto*, `det` = *Dettagli*, `w` = *Attenzione*, `ext` = `fuori_dal_libro`.

**Persistenza.** La demo salva `data` in `localStorage` (chiave `autore-studio-v2`) a ogni modifica, e offre «Copia dati (JSON)» per travasare il risultato nei file `.md` e «Ripristina» per tornare al seme. Nell'app vera questo strato è sostituito dalla lettura/scrittura dei file: il resto non cambia.

**Calcolato, mai scritto** (come da §8 della bozza): collegamento reciproco, elenco schede di un tema, ordine cronologico, conteggi, posizione sulla mappa, colore effettivo di una categoria.

---

## 3. Date: un campo libero, interpretato

Sostituisce la coppia `anno` (numero) + `etichetta_anno` (testo). Un campo solo, `d`, scritto come viene naturale; l'app ne ricava **ciò che si mostra** e **dove si posiziona** sull'asse.

| Si scrive | Si legge sulla card | Nella scheda aperta | Valore per l'asse |
|---|---|---|---|
| `14/06/1837` | 14/06/1837 | 14 giugno 1837 | 1837 + mese + giorno |
| `06/1837` | 06/1837 | giugno 1837 | 1837 + mese |
| `1837` | 1837 | 1837 | 1837 |
| `1809-1816` | 1809 – 1816 | 1809 – 1816 | 1809 (inizio) |
| `11/1822-05/1823` | 11/1822 – 05/1823 | idem | nov. 1822 |
| `1837-06-14` (ISO) | 14/06/1837 | 14 giugno 1837 | 1837 + mese + giorno |
| `1837-06` (ISO) | 06/1837 | giugno 1837 | 1837 + mese |
| `Settecento` | Settecento | Settecento | nessuno → zona *Senza data* |
| vuoto | senza data | senza data | nessuno → zona *Senza data* |
| `dal 1827` | dal 1827 | dal 1827 | 1827 |

Regole d'interpretazione: separatori `/ . -`; formato ISO `aaaa-mm-gg` e `aaaa-mm` riconosciuto prima di ogni altra cosa; giorno e mese opzionali; un intervallo è riconosciuto se entrambe le parti contengono cifre; se non c'è nulla di numerico il primo numero a quattro cifre fa da anno, altrimenti la scheda **non ha posizione cronologica** (e va nella zona *Senza data*, §3 bis). **Il giorno e il mese contano anche per l'ordinamento**: due eventi dello stesso anno si dispongono nell'ordine giusto senza più usare i decimali (`1819.5`). Il campo nascosto `y` non è più letto da nulla.

**Date impossibili.** Mese fuori da 1-12 o giorno inesistente per quel mese non vengono «aggiustati» né trasformati in `undefined`: la data resta testo, la scheda resta senza posizione, e l'editor mostra l'errore in chiaro accanto al campo (bordo d'avviso + messaggio: *«Giorno non valido: 30. febbraio 1830 ha 28 giorni.»*).

Nell'editor sei scorciatoie riscrivono il campo nel formato voluto: *Solo anno*, *Mese/anno*, *Giorno esatto*, *ISO*, *Intervallo*, *Senza data*.

**Ordine a parità di data.** Il secondo criterio è l'`id` della scheda, non la sua posizione nell'elenco: riordinare o duplicare le schede non cambia più la mappa.

---

## 3 bis. Zona «Senza data» e vuoti compressi

**Senza data.** Una scheda senza data numerica non sparisce e non viene inventata: finisce in una fascia dedicata **a fine asse**, dopo l'ultimo anno, con fondo tratteggiato ed etichetta *Senza data · n* sulla riga delle tacche. In vista Mappa un bottone *Senza data · n →* accanto a Mappa/Lista porta lì con un colpo; in vista Lista le stesse schede formano il gruppo finale *Senza data · n* (distinto da *Senza periodo*, che raccoglie le schede datate fuori da ogni periodo). Le schede si impilano nella fascia all'interno della propria corsia.

**Vuoti compressi.** Un intervallo di **7 anni o più senza nessuna scheda né inizio di periodo** non viene disegnato a scala: diventa un'interruzione di 58 px, a bande diagonali, con l'etichetta dei due estremi — `1798 ⟋ 1809` — al posto delle tacche di quegli anni. Come nella mappa originale di Leopardi: le fasi dense restano leggibili e i secoli vuoti non spingono tutto fuori schermo. La scala è quindi lineare a tratti: `xOf(anno)` somma i tratti pieni a 46 px/anno e i salti a larghezza fissa.

**Selezione sempre visibile.** Selezionare una card (clic, frecce, *Precedente/Successiva*) fa scorrere la mappa quanto basta a portarla dentro l'area visibile, con un margine sui quattro lati: una card vicina al bordo destro non finisce più sotto l'anteprima laterale.

---

## 4. Categorie (corsie) non fisse

- Numero libero: si aggiungono, si rinominano, si riordinano, si eliminano (eliminando una categoria le sue schede passano alla prima).
- Ogni categoria ha `name` (corsia della mappa, pastiglia nella lista), `short` (sigla sulla fascia della card) e `hue`: **una tonalità 0-360**, non un colore.
- Il colore vero è calcolato: `oklch(L C hue)` con `L`/`C` dipendenti da tema (chiaro/scuro) e palette (Vivace/Sobria). Quattro combinazioni da un solo numero, contrasto garantito su entrambi i fondi, e una categoria nuova è subito a posto.
- Le corsie si possono spegnere per filtrare la mappa e la lista.

Lo stesso vale per **temi** e **periodi**: liste modificabili, chiavi generate, nessun colore o anno codificato. I periodi si ordinano da sé in base alla data e definiscono i gruppi della vista Lista; le schede fuori da ogni periodo finiscono in un gruppo *Senza periodo* invece di sparire.

**Asse del tempo**: scala calcolata dalle date presenti (min−1 … max+1), 46 px per anno, tacche ogni N anni perché restino leggibili, vuoti lunghi compressi (§3 bis). Un autore del Novecento o del Trecento funziona senza toccare nulla.

**Eliminazioni con conferma.** Cancellare una corsia, un tema o un periodo chiede conferma dicendo quante schede coinvolge e cosa succede loro: *«Contiene 18 schede, che passeranno a Vita e luoghi»*, *«È usato da 6 schede: il tema sarà rimosso da tutte»*, *«Raggruppa 9 schede: le schede restano, cambia solo il raggruppamento»*. L'ultima corsia non è eliminabile.

---

## 5. Modalità Studio

Invariata rispetto alle decisioni già prese (§13 della bozza), con due aggiustamenti:

- L'anteprima a destra compare **solo** a scheda selezionata e mostra la data in forma lunga (*14 giugno 1837*).
- Il selettore «Corsie» è diventato «Categorie» ed è disponibile anche in vista Mappa.
- I tre selettori (Periodi, Temi, Categorie) sono pannelli a comparsa con altezza massima e scorrimento: con molte voci si raggiungono tutte.

Nessun elemento di modifica è visibile in questa modalità: il bordo superiore è neutro, la barra di modifica non esiste, le card non hanno maniglie.

---

## 6. Modalità Modifica

Si attiva dal bottone **✎ Modifica** in alto a destra. Segnali: bordo superiore viola (`--ed`), una barra con *+ Nuova scheda*, i conteggi, *Copia dati (JSON)*, *Ripristina*. Il nome dell'autore diventa un campo.

Dentro i tre selettori appare un blocco *Gestisci*: rinomina, elimina, aggiungi; per le categorie anche sigla, tonalità (cursore) e riordino.

### La scheda di modifica

Finestra **centrata** sopra la mappa (non più una barra laterale), larga fino a 1240 px, alta 88vh, con tre colonne **a scorrimento indipendente** — si lavora su una parte senza perdere di vista le altre.

```
┌ Scheda  [ titolo ................................ ]  (categoria)  Anteprima  ✕ ┐
├───────────────────┬───────────────────────────────────┬────────────────────────┤
│ 1 IDENTIFICAZIONE │ 2 CONTENUTO                       │ 3 RELAZIONI            │
│ etichetta breve   │ Riassunto (area ampia)            │ Temi (pastiglie)       │
│ data + scorciatoie│ Dettagli (una riga per punto)     │ Collegamenti + filtro  │
│ categoria         │ ┌ 4 APPROFONDIMENTI ───────────┐  │                        │
│ pagine            │ │ [Testo chiave] [Tabella]     │  │                        │
│ fuori dal libro   │ └──────────────────────────────┘  │                        │
│ avviso            │                                   │                        │
├───────────────────┴───────────────────────────────────┴────────────────────────┤
│ ← Precedente  Successiva →  3 di 41       Duplica  Elimina  + Nuova     Fine  │
└────────────────────────────────────────────────────────────────────────────────┘
```

Criteri seguiti:

- **Ordinate per tema, non per tipo di campo.** Chi sei (identificazione) · cosa dici (contenuto) · come ti leghi al resto (relazioni) · extra (approfondimenti).
- **Meno scorrimento possibile.** Il titolo sta nell'intestazione; le cose brevi stanno affiancate nelle colonne laterali; gli approfondimenti sono due schede alternative (una sola a schermo) invece di due blocchi in fila; la colonna centrale, quella in cui si scrive di più, è la più larga e non si comprime.
- **Liste lunghe sotto controllo.** I collegamenti hanno un filtro di ricerca che tiene sempre visibili quelli già attivi.
- **Campi al posto di moduli.** Niente *Salva*: ogni modifica è immediata. *Fine* chiude, `Esc` chiude.
- **Scorrere le schede senza uscire.** *Precedente/Successiva* in ordine cronologico, con la posizione scritta accanto.
- **Testo abbondante.** Caratteri da 15-16 px nei campi, 13 px nelle etichette: si scrive e si rilegge per minuti, non per secondi.
- **Righe come unità.** Dettagli, versi e righe di tabella si scrivono una per riga (`|` separa le celle, la prima riga sono le intestazioni): nessun pulsante «aggiungi elemento».

Azioni distruttive: *Elimina* chiede conferma e ripulisce i collegamenti che puntavano alla scheda; *Duplica* crea una copia subito modificabile; *Ripristina* chiede conferma.

---

## 7. Accessibilità e lettura

Confermate le scelte già prese, con un'aggiunta: le pastiglie non vanno a capo e tutte le etichette dei bottoni restano su una riga (nessuna parola che esce dal bordo arrotondato).

- Font: Atkinson Hyperlegible (alternative Lexend, di sistema), dimensione 13-19 px, spaziatura righe 1.30-2.00 — pannello **Aa Lettura**, valido per tutta l'app.
- Tema chiaro e scuro; palette categorie Vivace o Sobria.
- Tastiera: `← →` fra le schede in ordine cronologico, `Invio` apre la scheda completa, `Esc` chiude scheda e modifica, `Home`/`End` ai capi. Focus visibile su tutto.
- Contrasto: testo su fascia colorata con colore pieno, mai trasparenze.

---

## 8. Cosa cambia nella bozza `formato_studio_italiano.md`

| Punto | Prima | Ora |
|---|---|---|
| §3 corsie | sei corsie di base | elenco libero, con `short` e `hue` |
| §3 periodi | `{ nome, anno }` | `{ nome, data }`, data libera come §3 di questo documento |
| §4 scheda | `anno` + `etichetta_anno` | campo unico `data` |
| §4 scheda | `anno` con decimali per ordinare | giorno/mese reali; i decimali non servono più |
| §4 colori | «palette esatta delle corsie» da decidere | una tonalità per corsia, colori calcolati per tema e palette |
| §13 | anteprima a destra sempre presente | anteprima solo a scheda selezionata; modifica al centro |
| — | (non previsto) | modalità Modifica completa dentro la home |

Resta tutto il resto: file come fonte di verità, un file per cosa, collegamento scritto da un lato solo, `fuori_dal_libro` obbligatorio, `stato/` mai toccato dall'AI, validazione non bloccante.

---

## 9. Da decidere

- Quali campi dell'editor compaiono anche in forma «rapida» sulla mappa (es. correggere un'etichetta senza aprire la finestra).
- Se i periodi debbano avere anche una data di fine invece di dedurla dal periodo successivo.
- Dove far vivere i collegamenti fra autori diversi (`foscolo/ortis`) nell'interfaccia di modifica.
- Ponte «Apri nell'editor» dei testi: oggi è un segnale, va collegato alla cartella `testi/`.
