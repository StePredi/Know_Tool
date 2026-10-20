# Studio di italiano: come deve funzionare la struttura

Specifica del tool unico di italiano: **studio dell'autore** (mappa a corsie) e **analisi dei testi** (editor) nello stesso sistema, con i dati salvati come file che sia l'app sia l'AI possono leggere e modificare.

Stato: bozza aggiornata con la demo della home dell'autore. Dove differisce, prevale `specifica_home_autore.md`.

---

## 1. Principi

1. **I file sono la fonte di verità.** Non c'è un database: l'app legge, mostra e modifica file in una cartella.
2. **Una cosa = un file.** Una scheda, un testo, una tabella di confronto: ognuno ha il suo file. L'AI ne modifica uno senza toccare gli altri.
3. **Ogni informazione si scrive in un posto solo.** Quello che si può calcolare (collegamenti reciproci, schede di un tema, ordinamenti) **non si scrive**, lo calcola l'app.
4. **ID leggibili.** `fuga_1819`, non codici casuali. L'ID coincide con il nome del file.
5. **Contenuto e progresso sono separati.** Ciò che scrivono lo studente e l'AI sta nelle schede; ciò che fa lo studente nell'app (schede studiate, risposte sbagliate) sta in un file di stato.
6. **L'AI lavora dalla porta sul retro.** Modifica i file direttamente, l'app si aggiorna da sola. Ogni modifica è annullabile (cartella sotto git).
7. **L'app non si rompe sugli errori.** Valida i file e segnala i problemi invece di non aprirsi.
8. **Regola d'oro dal libro.** Si usa solo ciò che sta nelle pagine del manuale. Tutto il resto è marcato `fuori_dal_libro: true`. Non si inventa.

---

## 2. Struttura delle cartelle

```
01_Argomenti/Italiano/
├── _condiviso/
│   └── figure_retoriche.json        dizionario unico per tutti i testi
├── autori/
│   └── leopardi/
│       ├── autore.md                dati dell'autore, corsie, periodi
│       ├── temi.md                  i temi trasversali
│       ├── glossario.md             termini e definizioni
│       ├── schede/                  una scheda = un file
│       │   ├── fuga_1819.md
│       │   └── ...
│       ├── confronti/               una tabella = un file
│       ├── ripasso/                 domande di ripasso
│       ├── note/                    lacune e trappole
│       └── testi/                   un testo = una cartella
│           └── l_infinito/
│               ├── testo.md
│               ├── annotazioni.json
│               ├── parafrasi.json
│               └── esercizi.json
└── stato/
    └── leopardi.json                progresso dello studente
```

Un nuovo autore è una nuova cartella dentro `autori/` con la stessa struttura.

---

## 3. L'autore: `autore.md`

```
---
id: leopardi
nome: Giacomo Leopardi
nascita: 1798
morte: 1837
corsie:
  - { id: contesto, nome: Contesto storico,   sigla: CTX, tonalita: 220 }
  - { id: vita,     nome: Vita e luoghi,      sigla: VIT, tonalita: 150 }
  - { id: persone,  nome: Persone e influenze, sigla: PER, tonalita: 30 }
  - { id: pensiero, nome: Pensiero,           sigla: PEN, tonalita: 290 }
  - { id: canti,    nome: Canti,              sigla: CAN, tonalita: 80 }
  - { id: prose,    nome: Prose ed edizioni,  sigla: PRO, tonalita: 340 }
periodi:
  - { nome: "1798 Studi", data: "1798" }
  - { nome: "1816 Conversione", data: "1816" }
---

Note libere sull'autore (facoltative).
```

- Le **corsie** sono un elenco libero per autore: si aggiungono, rinominano, riordinano ed eliminano (es. "Poetica" o "Viaggi")
- `sigla` è l'etichetta breve sulla fascia della card
- `tonalita` è un numero da 0 a 360, **non un colore**. L'app calcola il colore vero in base a tema (chiaro o scuro) e palette (Vivace o Sobria), così il contrasto è garantito e una corsia nuova è subito a posto
- I **periodi** hanno una data d'inizio (stesso formato della data delle schede). Si ordinano da soli, definiscono i gruppi della vista Lista e servono ai salti sull'asse. Le schede fuori da ogni periodo finiscono in un gruppo "Senza periodo"
- Le corsie si possono spegnere per filtrare mappa e lista

---

## 4. La scheda: `schede/<id>.md`

È il cuore del sistema. Una scheda contiene **tutto** quello che la riguarda.

```
---
id: fuga_1819
corsia: vita
data: "1819"
titolo_breve: Malattia agli occhi, fuga mancata
titolo: "1819: l'anno difficile e la fuga mancata"
temi: [dolore, morte]
collegamenti: [convfil, inf, pidilli, zib, padre]
testi: []
pagine: "p. 677-678"
fuori_dal_libro: false
---

## Riassunto
Due-quattro righe che condensano il contenuto della scheda. È il testo che compare nell'anteprima.

## Dettagli
- Primo punto, con **grassetto** e *corsivo* dove serve.
- Secondo punto.

## Attenzione
Avviso su una trappola o su una lacuna del libro (facoltativa).
```

### Campi del frontmatter

| Campo | Obbligatorio | Significato |
|---|---|---|
| `id` | sì | Uguale al nome del file, senza spazi né accenti |
| `corsia` | sì | Un `id` presente in `autore.md` |
| `data` | sì | Testo libero, interpretato dall'app (vedi sotto). Dice cosa si legge sulla card e dove va sull'asse |
| `titolo_breve` | sì | Nome sulla card |
| `titolo` | no | Nome completo nella scheda aperta; se manca si usa il breve |
| `temi` | no | Lista di `id` dei temi |
| `collegamenti` | no | `id` di altre schede dello stesso autore |
| `testi` | no | `id` dei testi collegati (ponte verso l'editor) |
| `pagine` | no | Riferimenti al manuale |
| `fuori_dal_libro` | sì | `true` se l'informazione non viene dalle pagine |

### La data

Un campo solo, scritto come viene naturale. L'app ricava ciò che si mostra e dove si posiziona.

| Si scrive | Si legge sulla card | Nella scheda aperta | Posizione sull'asse |
|---|---|---|---|
| `14/06/1837` | 14/06/1837 | 14 giugno 1837 | 1837 + mese + giorno |
| `06/1837` | 06/1837 | giugno 1837 | 1837 + mese |
| `1837` | 1837 | 1837 | 1837 |
| `1809-1816` | 1809 – 1816 | 1809 – 1816 | 1809 (inizio) |
| `11/1822-05/1823` | 11/1822 – 05/1823 | idem | novembre 1822 |
| `1837-06-14` (ISO) | 14/06/1837 | 14 giugno 1837 | 1837 + mese + giorno |
| `1837-06` (ISO) | 06/1837 | giugno 1837 | 1837 + mese |
| `Settecento` | Settecento | Settecento | nessuna: zona "Senza data" |
| vuoto | senza data | senza data | nessuna: zona "Senza data" |
| `dal 1827` | dal 1827 | dal 1827 | 1827 |

Regole: separatori `/ . -`; giorno e mese facoltativi; un intervallo è riconosciuto se entrambe le parti contengono cifre; se non c'è nulla di numerico, il primo numero a quattro cifre fa da anno, altrimenti la scheda resta senza posizione. Il formato ISO (`aaaa-mm-gg`, `aaaa-mm`) è riconosciuto per primo. Giorno e mese contano anche per l'ordine: non servono più i decimali.

**Date impossibili.** Un mese fuori da 1-12 o un giorno inesistente (anche con gli anni bisestili) non vengono corretti di nascosto: la data resta testo, la scheda resta senza posizione e l'editor mostra l'errore accanto al campo (es. "Giorno non valido: 30 febbraio 1830 ha 28 giorni").

**Intervalli abbreviati.** `1819-20` e `1816-18` sono letti come intervalli (1819-1820, 1816-1818): il secondo numero si completa con il secolo del primo. Vale solo se ne esce un anno successivo al primo, così `1798-06` resta giugno 1798 (ISO).

**Ordine a parità di data.** Il secondo criterio è l'`id`, non la posizione nell'elenco: riordinare o duplicare schede non cambia la mappa. Vale anche per i file, dove l'ordine di lettura della cartella non è garantito.

### Zona "Senza data" e vuoti compressi

- Una scheda senza data numerica non sparisce: sta in una fascia a fine asse, "Senza data · n", dove si impila dentro la propria corsia. Un bottone accanto a Mappa / Lista ci porta direttamente. Nella Lista forma il gruppo finale, distinto da "Senza periodo" (schede datate fuori da ogni periodo)
- Un intervallo di **7 anni o più** senza schede né inizio di periodo viene compresso in un'interruzione di 58 px con i due estremi scritti (`1798 ⟋ 1809`). La scala diventa lineare a tratti: 46 px per anno nelle fasi piene, larghezza fissa per i salti
- Selezionare una card (clic, frecce, Precedente/Successiva) fa scorrere la mappa quanto basta a tenerla visibile

### Nomi dei campi

Nei file si usano i nomi leggibili di questo documento. La demo usa internamente nomi abbreviati (`l`, `d`, `k`, `sum`, `det`, `w`, `ext`, `pg`): l'app vera li converte, e l'AI non li vede mai.

### Sezioni del corpo

- **Riassunto**: obbligatoria, 2-4 righe. Sostituisce il vecchio "Da ricordare" di una riga
- **Dettagli**: obbligatoria, elenco con formattazione base (grassetto, corsivo)
- **Attenzione**: facoltativa
- **Tabella**: facoltativa, per le schede che contengono un elenco strutturato (es. le Operette morali con titolo e sintesi di ciascuna)

### Collegamenti tra autori

Si scrivono come `autore/id`, ad esempio `foscolo/ortis`. Senza prefisso si intende lo stesso autore.

### Regola sui collegamenti

Si scrive **un lato solo**. Se A cita B, l'app mostra il collegamento anche su B. L'AI non deve cercare di aggiungere il reciproco.

---

## 5. Temi, glossario, confronti, ripasso, note

### `temi.md`

```
---
temi:
  - { id: natura,  nome: Natura,           colore: verde }
  - { id: piacere, nome: "Piacere e noia", colore: ambra }
---
```

Il tema **non elenca le schede**: sono le schede a dichiarare i propri temi. L'app costruisce l'elenco di un tema raccogliendo le schede che lo citano.

### `glossario.md`

```
---
voci:
  - termine: Idillio
    definizione: "Dal greco eidyllion, «quadretto»..."
    schede: [pidilli, inf]
---
```

### `confronti/<id>.md`

Una tabella per file (es. `le_tre_fasi_del_pessimismo.md`): titolo, domanda a cui risponde, colonne, righe, schede collegate, pagine. Servono per le domande da verifica che chiedono "cosa cambia da una fase all'altra".

### `ripasso/<id>.md`

Domanda, risposta, categoria, schede collegate, `fuori_dal_libro`. Una domanda per file oppure raggruppate per categoria (da decidere nella demo).

### `note/`

- `lacune.md`: cosa manca dalle pagine caricate
- `trappole.md`: cose che si confondono (es. "Due Paoline", "Operette: 25 o 24")

---

## 6. I testi e l'editor

Ogni testo è una cartella dentro `autori/<autore>/testi/`.

### `testo.md`

```
---
id: l_infinito
titolo: L'infinito
scheda: infinito
layout: verso
fonte: incolla
---

Sempre caro mi fu quest'ermo colle,
e questa siepe, che da tanta parte
dell'ultimo orizzonte il guardo esclude.
```

- `layout`: `verso` o `prosa`
- `scheda`: la scheda-opera che lo contiene (ponte inverso rispetto a `testi` della scheda)
- `fonte`: `incolla`, `txt`, `pdf`

### `annotazioni.json`

```
[
  {
    "id": "a001",
    "span": [0, 4],
    "citato": "Sempre caro mi fu quest'ermo",
    "evidenzia": "concetto",
    "figura": "anastrofe",
    "parola_chiave": false,
    "nota": "Inversione, enfasi sul «sempre».",
    "flashcard": false,
    "scheda": "indefinito"
  }
]
```

- `span`: intervallo di parole (primo e ultimo indice, estremi inclusi)
- `citato`: **il testo effettivo delle parole selezionate**. Serve a riagganciare l'annotazione se il testo cambia e gli indici si spostano
- `evidenzia`: `concetto` (giallo), `definizione` (blu), `dubbio` (rosso) o assente
- `figura`: `id` di una figura in `_condiviso/figure_retoriche.json`
- `scheda`: **ponte verso la mappa**, l'`id` di una scheda dell'autore (es. un verso collegato alla scheda sul pensiero che lo spiega)

La scheda cita i propri testi con il campo `testi`; l'annotazione cita la scheda con `scheda`. L'app mostra entrambe le direzioni.

### `parafrasi.json`

Elenco di parafrasi, ciascuna con `id`, `testo`, `span` (oppure `null` se libera) e `ordine`.

### `esercizi.json`

Elenco di domande con `numero`, `testo`, `risposta`, `span` collegato (facoltativo) e `fatta`.

### `_condiviso/figure_retoriche.json`

```
[
  {
    "id": "anafora",
    "nome": "Anafora",
    "tipo": "ordine",
    "descrizione": "Ripetizione di una parola all'inizio di versi o frasi.",
    "esempio": "..."
  }
]
```

Tipi: `suono`, `ordine`, `significato`, `sintassi`. Valido per tutti gli autori.

### Tokenizzazione

Come si dividono le parole (apostrofi, punteggiatura, accenti) la decide il tokenizer dell'editor. Questo documento fissa solo che gli `span` contano le **parole**, non i versi né i caratteri.

---

## 7. Stato dello studente: `stato/<autore>.json`

```
{
  "schede_studiate": ["nasc", "stud"],
  "ripasso_sbagliate": ["fuga_1819"],
  "esercizi_fatti": []
}
```

È l'unico file che l'app scrive per conto dello studente. L'AI **non lo modifica**: così le sue correzioni ai contenuti non cancellano mai i progressi.

---

## 8. Che cosa NON si scrive (lo calcola l'app)

- il collegamento reciproco tra due schede
- l'elenco delle schede di un tema
- l'ordine sull'asse del tempo (deriva da `data`)
- il colore effettivo di una corsia (deriva da `tonalita`, tema e palette)
- la scala dell'asse (lineare, calcolata dalle date presenti)
- il numero di righe e la numerazione laterale dei versi
- le percentuali di avanzamento

---

## 9. Regole per l'AI che modifica i file

1. All'inizio leggo `REGOLE.md` e questo documento.
2. **Un file per volta**, e registro in `LOG.md` cosa ho cambiato.
3. Uso solo ciò che c'è nelle pagine caricate. Il resto: `fuori_dal_libro: true`, mai taciuto.
4. Non cambio un `id` esistente. Se serve, propongo il cambio e aspetto conferma, perché altri file lo citano.
5. Non scrivo campi calcolati (reciproci, liste di un tema).
6. Non tocco `stato/`.
7. Prima di citare una scheda in `collegamenti`, `testi`, `temi` o `scheda`, controllo che esista.
8. Se un'informazione manca o è dubbia, la segnalo in `note/lacune.md` invece di indovinarla.

---

## 10. Controlli dell'app (validazione)

L'app segnala, senza rifiutarsi di aprire:

- frontmatter mancante o con campi obbligatori assenti
- `id` diverso dal nome del file
- `corsia`, `tema`, `figura` o scheda collegata inesistenti
- `id` duplicati
- annotazione il cui `citato` non corrisponde più alle parole dello `span`
- `data` non interpretabile o impossibile (la scheda va in "Senza data" e l'errore va segnalato, non nascosto)
- sezione "Riassunto" mancante, vuota o più lunga di circa 5 righe
- riassunto probabilmente vecchio (i dettagli sono cambiati dopo l'ultima modifica del riassunto)

---

## 11. Fuori dal primo traguardo

- Mappa dei luoghi (specifica di Leopardi, vista opzionale)
- Flashcard generate dai contenuti
- Import avanzato (foto, OCR) e modalità live
- Export (Markdown, PDF, Anki)

## 12. Da decidere con la demo

- Ripasso: una domanda per file o raggruppate
- Come la mappa mostra le schede senza temi
- Se `titolo` serve davvero oltre a `titolo_breve`
- Come l'app evidenzia i file modificati dall'AI
- **Ambiguità residua negli intervalli abbreviati**: quando il secondo numero è tra 01 e 12 e supera le ultime due cifre del primo, `1809-12` o `1805-10` sono letti come intervalli (1809-1812) e non come dicembre 1809 o ottobre 1805. Per Leopardi può capitare. Proposta: chi vuole un mese scrive `12/1809`; il formato ISO con mese resta ammesso solo con il giorno (`1809-12-05`) oppure quando l'intervallo non è possibile
- Gli errori di data vanno visibili anche fuori dall'editor (per esempio in un elenco di controlli), perché un'AI che scrive i file non apre la finestra di modifica
- Eliminare una scheda modifica anche le altre che la citavano: scrittura su più file, da fare in blocco e annullabile
- Quali campi si correggono in modo rapido direttamente sulla mappa
- Periodi con data di fine esplicita o dedotta dal successivo
- Dove si scrivono i collegamenti tra autori (`foscolo/ortis`) nell'interfaccia di modifica
- Collegare "Apri nell'editor" alla cartella `testi/`

Dati di prova: la mappa HTML di Leopardi (105 schede, 390 collegamenti, 10 temi, 32 voci di glossario) servirà per la demo. Le sintesi di una riga già presenti ci sono come punto di partenza, ma vanno allungate a 2-4 righe.

---

## 13. Decisioni di design: home dell'autore

Decise in Control_Room, da portare in Claude Design.

- **Mappa a corsie** come nell'HTML di Leopardi: asse del tempo, corsie, card, collegamenti
- **Barra in alto**: interruttore Mappa / Lista, ricerca, chip dei periodi, chip dei temi
- **Anteprima a destra**: compare solo quando una scheda è selezionata, e un tocco su un'altra card la aggiorna. Mostra titolo, corsia, data in forma lunga, riassunto, temi e avviso sulle trappole (solo se presente). Ha un bottone per aprire la scheda completa
- **Scheda completa al centro**: apertura sopra la mappa. Contiene riassunto, collegamenti (prima a sinistra, dopo a destra), temi, dettagli, tabella se presente, testo chiave, avviso, pagine del libro. Il testo chiave ha il ponte "Apri nell'editor"
- **Vista Lista** in ordine cronologico, con gli stessi filtri e la stessa ricerca della mappa e filtri per corsia
- **Non nella prima versione**: percorso cronologico automatico, tab Luoghi
- **Card sulla mappa**: livello medio. Fascia in alto con corsia e anno, sotto il titolo breve. Il riassunto non sta sulla card, sta nell'anteprima
- **Collegamenti sulla mappa**: visibili solo alla selezione. Toccando una card si tracciano le linee verso le collegate e le altre si attenuano
- **Corsie colorate**: ogni corsia ha un suo colore, come nell'HTML di Leopardi, per orientarsi al volo
- **Stile generale dell'app**: moderno pulito con contrasto alto. Sans-serif, superfici neutre, bordi netti da 1 px su card, pannelli e chip, testo scuro e leggibile, fascia piena di colore sulle card, selezione con contorno doppio. Tema chiaro e scuro
- **Font accessibile e regolazioni di lettura** del documento di progettazione (Atkinson Hyperlegible, alternative Lexend e OpenDyslexic, dimensione e spaziatura): valgono per tutta l'app
- **Palette delle corsie**: una tonalità per corsia, colori calcolati per tema e palette (Vivace o Sobria)
- **Densità delle corsie**: scelta fissa su "estese" (una riga per ogni sovrapposizione, altezza libera). Decisione presa: le altre due modalità presenti nel codice (card strette, fisarmonica) non si usano e non servono comandi per attivarle
- **Asse del tempo**: scala calcolata dalle date presenti, circa 46 px per anno, tacche ogni N anni, vuoti lunghi compressi, zona "Senza data" a fine asse
- **Due modalità, una schermata**: Studio (predefinita, nessun elemento di modifica visibile) e Modifica (bottone in alto a destra, bordo superiore viola, nome dell'autore modificabile). Nessun "Salva": ogni modifica è immediata
- **Scheda di modifica**: finestra centrata con tre colonne a scorrimento indipendente. Identificazione (etichetta, data con scorciatoie, categoria, pagine, fuori dal libro, avviso), Contenuto (riassunto, dettagli, approfondimenti: testo chiave e tabella), Relazioni (temi, collegamenti con filtro). Precedente e Successiva in ordine cronologico, Duplica, Elimina, Nuova
- **Tastiera**: frecce tra le schede in ordine cronologico, Invio apre la scheda completa, Esc chiude, Home e End ai capi
- **Selettori** Periodi, Temi e Categorie come pannelli a comparsa, con blocco "Gestisci" in modalità Modifica
