# Home dell'autore — decisioni tecniche

Riepilogo di tutte le decisioni prese su `Home Autore.dc.html`. Ogni voce è una scelta già implementata, con la ragione per cui è stata presa. Per il dettaglio realizzativo vedi `specifica_home_autore.md`.

---

## 1. Principi

| # | Decisione | Perché |
|---|---|---|
| 1.1 | Nessun dato nel codice dell'interfaccia | la home è la mappa di *qualunque* autore, non di Leopardi |
| 1.2 | Due modalità (Studio / Modifica), una sola schermata | niente pagina di amministrazione separata |
| 1.3 | I file sono la fonte di verità; `localStorage` è solo la demo | l'app vera legge/scrive `autore.md`, `temi.md`, `schede/*.md` |
| 1.4 | Tutto ciò che è derivabile non si scrive | reciprocità dei collegamenti, ordine, conteggi, posizioni, colori |
| 1.5 | Nessun *Salva*: ogni modifica è immediata | *Fine* chiude, `Esc` chiude |

---

## 2. Modello dei dati

```
data = { autore, lanes:[{k,name,short,hue}], temi:[{k,name}],
         periods:[{k,name,d,f}], schede:[scheda] }

scheda = { id, l, d, short, title, pg, ext, temi:[k], k:[id],
           sum, det:[riga], w,
           text:{title,meta,lines:[]}, table:{title,intro,cols:[],rows:[[]]} }
```

- **2.1** `l` = chiave categoria; `k` = collegamenti, **scritti da un lato solo** e resi reciproci a runtime.
- **2.2** `ext` (fuori dal libro) è **obbligatorio**: distingue ciò che sta sul manuale da ciò che non c'è.
- **2.3** `text` e `table` sono approfondimenti facoltativi, mai due blocchi in fila: due schede alternative nell'editor.
- **2.4** `stato/` (progressi dello studente) non è mai toccato dall'AI.

---

## 3. Date — campo unico, interpretato

- **3.1** `anno` + `etichetta_anno` sono **fusi in un campo solo**, `d`, scritto in linguaggio naturale.
- **3.2** Formati riconosciuti: `gg/mm/aaaa`, `mm/aaaa`, `aaaa`, ISO `aaaa-mm-gg` / `aaaa-mm`, intervalli (`1809-1816`, `11/1822-05/1823`), testo libero (`Settecento`, `dal 1827`), vuoto. Separatori `/ . -`; l'ISO si riconosce **prima** di tutto il resto.
- **3.3** Giorno e mese contano per l'ordinamento: **i decimali (`1819.5`) non servono più** e il campo `y` non è letto da nulla.
- **3.4** Date impossibili **non vengono aggiustate**: restano testo, la scheda resta senza posizione, l'editor mostra l'errore in chiaro (*«Giorno non valido: 30. febbraio 1830 ha 28 giorni»*).
- **3.5** A parità di data il secondo criterio è l'**`id`**, non la posizione nell'elenco: riordinare o duplicare non muove la mappa.
- **3.6** Sei scorciatoie riscrivono il campo nel formato voluto: *Solo anno · Mese/anno · Giorno esatto · ISO · Intervallo · Senza data*.

---

## 4. Asse del tempo

- **4.1** Scala calcolata dalle date presenti (min−1 … max+1), **46 px/anno**, tacche ogni N anni per restare leggibili. Un autore del Trecento o del Novecento funziona senza toccare nulla.
- **4.2** **Vuoti compressi**: un intervallo di **≥ 7 anni** senza schede né inizi di periodo diventa un'interruzione fissa di **58 px** a bande diagonali, etichettata `1798 ⟋ 1809`. La scala è lineare a tratti: `xOf(anno)` somma tratti pieni e salti.
- **4.3** **Zona «Senza data»**: fascia tratteggiata a fine asse, etichetta *Senza data · n*, schede impilate nella propria corsia. Si raggiunge con un bottone accanto a Mappa/Lista.
- **4.4** *Senza data* ≠ *Senza periodo*: il secondo raccoglie le schede **datate** che cadono fuori da ogni periodo.
- **4.5** Selezionare una card (clic, frecce, *Precedente/Successiva*) fa scorrere la mappa quanto basta, con margine sui quattro lati: niente card nascoste sotto l'anteprima.

---

## 5. Categorie, temi, periodi

- **5.1** Categorie (corsie) in **numero libero**: aggiungibili, rinominabili, riordinabili, eliminabili. L'ultima non è eliminabile; eliminandone una le sue schede passano alla prima.
- **5.2** Ogni categoria ha `name`, `short` (sigla sulla fascia) e **`hue` 0-360**, non un colore. Il colore vero è `oklch(L C hue)` con `L`/`C` dipendenti da **tema** (chiaro/scuro) e **palette** (Vivace/Sobria): quattro combinazioni da un numero solo, contrasto garantito.
- **5.3** Le corsie si spengono per filtrare mappa e lista.
- **5.4** **I periodi hanno una data di fine facoltativa `f`.** Se vuota, il periodo finisce dove comincia il successivo (l'ultimo arriva in fondo all'asse); se scritta, il periodo si chiude lì — una fase può finire senza che un'altra cominci, e le schede nel vuoto vanno in *Senza periodo*. `f` usa lo stesso formato libero di `d` ed è **inclusiva**. Nell'editor è un secondo campo con bordo tratteggiato: *dal… / al…*.
- **5.5** **Le date dei periodi stanno nella sezione Periodi**, non dedotte dal periodo successivo.
- **5.6** Eliminazioni con conferma che dice **quante schede coinvolge e cosa succede loro**: *«Contiene 18 schede, che passeranno a Vita e luoghi»*, *«È usato da 6 schede: il tema sarà rimosso da tutte»*, *«Raggruppa 9 schede: cambia solo il raggruppamento»*.
- **5.7** I tre selettori (Periodi, Temi, Categorie) sono pannelli a comparsa con altezza massima e scorrimento.

---

## 6. Collegamenti fra autori — Persone e influenze

- **6.1** **Nessun meccanismo a parte.** Un autore esterno (Foscolo, Giordani, Mme de Staël) è una **scheda della corsia «Persone e influenze»**, e il legame con l'opera di casa è un normale collegamento fra schede.
- **6.2** Niente elenco separato di rimandi né record-ponte: chi studia incontra l'influenza dove se l'aspetta, accanto alle persone.

---

## 7. Modifica

- **7.1** **Modifica rapida sulla mappa: non si fa.** Nessun campo in forma abbreviata sulle card; ogni cambiamento passa dalla finestra di modifica. Una sola strada, nessun doppione da tenere allineato.
- **7.2** La scheda di modifica è una **finestra centrata** (max 1240 px, 88vh) con **tre colonne a scorrimento indipendente**: 1 Identificazione · 2 Contenuto · 3 Relazioni, più il blocco 4 Approfondimenti dentro la colonna centrale.
- **7.3** Colonne ordinate **per tema, non per tipo di campo**: chi sei · cosa dici · come ti leghi · extra.
- **7.4** Il titolo sta nell'intestazione; la colonna centrale (dove si scrive di più) è la più larga e non si comprime.
- **7.5** I collegamenti hanno un **filtro di ricerca** che tiene sempre visibili quelli già attivi.
- **7.6** **Righe come unità**: dettagli, versi e righe di tabella si scrivono una per riga (`|` separa le celle, la prima riga sono le intestazioni). Nessun pulsante «aggiungi elemento».
- **7.7** *Precedente/Successiva* scorrono le schede in **ordine cronologico** senza uscire, con la posizione scritta accanto (*3 di 41*).
- **7.8** *Elimina* chiede conferma e **ripulisce i collegamenti entranti**; *Duplica* crea una copia già modificabile; *Ripristina* chiede conferma.
- **7.9** Testo abbondante: 15-16 px nei campi, 13 px nelle etichette — si scrive per minuti, non per secondi.

---

## 8. Studio

- **8.1** L'anteprima laterale compare **solo** a scheda selezionata, con la data in forma lunga (*14 giugno 1837*).
- **8.2** In modalità Studio **nessun elemento di modifica è visibile**: bordo superiore neutro, nessuna barra, nessuna maniglia sulle card.
- **8.3** Modalità Modifica segnalata da bordo superiore viola (`--ed`) e barra con *+ Nuova scheda*, conteggi, *Copia dati (JSON)*, *Ripristina*.

---

## 9. Lettura e accessibilità

- **9.1** Font Atkinson Hyperlegible (alternative Lexend, di sistema); 13-19 px; interlinea 1.30-2.00 — pannello **Aa Lettura** valido per tutta l'app.
- **9.2** Tema chiaro/scuro; palette categorie Vivace/Sobria.
- **9.3** Tastiera: `← →` fra le schede in ordine cronologico, `Invio` apre, `Esc` chiude, `Home`/`End` ai capi. Focus sempre visibile.
- **9.4** Contrasto: testo su fascia colorata **a colore pieno, mai trasparenze**.
- **9.5** Pastiglie ed etichette dei bottoni su **una riga sola**: nessuna parola che esce dal bordo arrotondato.

---

## 10. Aperto

- Ponte **«Apri nell'editor»**: oggi è un segnale, va collegato alla cartella `testi/` e deve aprire l'Editor sul testo giusto con il suo stato.
