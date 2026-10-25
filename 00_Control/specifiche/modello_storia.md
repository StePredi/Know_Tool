# Modello «Storia» — passo 4: il modello dei file

Stato: **bozza, non approvata.** Ricavata dalle due prove a mano in
`prove/storia/`, non scritta prima di esse. Nessun codice e nessuna schermata
finché Ste non approva.

Procedura seguita: `00_Control/procedura_nuovi_documenti.md`.

---

## 1. Il problema (parole di Ste)

1. Argomenti ed eventi contemporanei ma non legati fra loro, che non si
   studiano insieme.
2. Memorizzazione: personaggi, date, nomi.
3. Non solo eventi: anche concetti, definizioni, correnti, da trattare
   diversamente da come fa la mappa di Italiano.

E una quarta cosa, detta dopo: **l'unità è l'argomento, non il capitolo.** Un
argomento può nascere dal materiale di due capitoli, anche di due libri.

## 2. Decisione di struttura

Niente motore Storia separato. Si riusa **l'albero di «Per situazioni»**, come
per Matematica: mappa a rami, schede, ricerca, modifica sicura, galleria.

- App: **Materia (Storia) → un documento per argomento.**
- Disco: `01_Argomenti/Storia/<Argomento>/<Argomento> per situazioni/` con
  `indice.yaml` + `schede/*.yaml`.
- `centro` = l'argomento. I **rami** sono i fili dentro l'argomento: fasi di
  tempo, soggetti (paesi), o passaggi di un ragionamento — a seconda
  dell'argomento. Le due prove usano entrambe le forme.

### Perché niente cronologia unica

Il problema 1 non si risolve con una linea del tempo che allinea tutto: è
proprio quella che affiancherebbe per forza cose che non si studiano insieme.
Si risolve come fanno **il libro e Ste stesso**:

- un filo per soggetto (il libro: un paragrafo per paese);
- schede-nodo dove i fili si incontrano (il libro: il paragrafo 7);
- collegamenti espliciti e volontari fra i fili (il libro: «→ PAR. 4»;
  Ste: la riga «Sincronia» nei suoi riassunti).

La cronologia resta, ma come **vista ricavata**, non come struttura.

## 2bis. Decisione di Ste (2026-10-24): schede complete

Alla domanda «quanto deve contenere una scheda» Ste ha risposto: **completa,
ma con le informazioni ben organizzate**, mantenendo i riquadri per i vari
aspetti (errore, da non confondere, nota, collegamenti). Quindi la scheda non
rimanda al libro per i dettagli: li contiene, divisi in sezioni.

Decisa anche la vista **«Copertura del libro»**, per sapere che cosa del libro
non è ancora in nessuna scheda.

## 3. Cosa si aggiunge al modello esistente

1. Nuovo tipo di scheda **`voce`** (oltre a ricetta, prima_dopo, figura, regola).
2. Nuovo tipo di scheda **`confronto`**.
3. Campo **`lega`**: collegamenti con un tipo e un perché.
4. Due campi facoltativi in `indice.yaml`: **`fonti`** (sigle dei libri) e
   `quando` sul ramo.
5. Flag **`svolta: true`** su una voce.
6. Quattro sezioni di dettaglio nella `voce`: **`svolgimento`**, **`elementi`**,
   **`numeri`**, **`citazioni`** (vedi §4bis).
7. Il campo **`da`** al posto della fonte scritta a mano, e il file di materia
   **`_libri.yaml`** (vedi §4ter).

Invariati: rami, colori, ricerca, mappa comprimibile, `ordine: true`,
salvataggio con copia di sicurezza, `errore`, `confondi`, `nota`, `vicine`.

## 4. La scheda `voce` — modello dati

I cinque campi di contenuto **non sono inventati**: sono le voci con cui il
libro apre ogni capitolo nei «nuclei fondanti» (QUANDO · DOVE · CHI · COSA ·
PERCHÉ È IMPORTANTE), e con cui chiude ogni nucleo nelle domande di
«Fissiamo il nucleo».

Campi comuni già esistenti: `id` (= nome file), `titolo`, `sigla`, `fonte`,
`parole`, `vicine`.

| campo | contenuto | obbligatorio |
|---|---|---|
| `tipo` | `voce` | sì |
| `genere` | `evento` · `persona` · `concetto` · `processo` | sì |
| `quando` | data o periodo, formato libero come in Italiano | no |
| `dove` | luogo o area | no |
| `chi` | persone o Stati coinvolti (lista) | no |
| `cosa` | che cosa è, in poche righe | sì |
| `conta` | perché è importante | sì |
| `svolta` | `true` se è un punto di svolta | no |
| `errore` | l'errore tipico | no |
| `confondi` | `{scheda, differenza}` | no |
| `nota` | precisazione che evita un fraintendimento | no |
| `lega` | `{scheda, tipo, perche}` | no |
| `storiografia` | `{autore, titolo, pagina}` | no |

## 4bis. Le quattro sezioni di dettaglio

Servono per le schede complete. Sono **quattro e fisse**: non si aggiunge un
campo nuovo per ogni argomento (è uno degli errori vietati dalla procedura).
Coprono tutto quello che si è trovato nei quattro capitoli letti.

| campo | forma | a che serve | esempio dal libro |
|---|---|---|---|
| `svolgimento` | lista di `{quando?, passo}` | i fatti in ordine | la Triplice: Tunisi 1881 → rottura → 1882 firma → 1887 rinnovo |
| `elementi` | lista di `{nome, spiega}` | le voci che il libro spiega a parte | «terre irredente», «panslavismo», «protettorato», «Fashoda» |
| `numeri` | lista di `{cosa, valore}` | i dati quantitativi | l'emancipazione degli ebrei: Francia 1791, Italia 1861… |
| `citazioni` | lista di `{testo, chi, dove}` | documenti e brani | Bismarck, «Ritratto di Guglielmo II» |

Tutte facoltative: una scheda breve non le ha, una scheda completa le riempie.
Nella schermata diventano sezioni separate, con un indice in cima alla scheda
quando sono più di due.

## 4quater. Grassetto e corsivo nei testi

I campi di prosa (`cosa`, `conta`, i `passo` dello svolgimento, gli `spiega`
dei dettagli, `errore`, `nota`, le `differenza` di `confondi`, le `risposte`
di un confronto) accettano due marcatori, gli stessi degli appunti `.md`:

- `**termine**` → **grassetto**, per i termini chiave, come li mette il libro;
- `*parola*` → *corsivo*, per le parole straniere e i titoli delle opere
  (*Mitteleuropa*, *L'origine delle specie*, *Social Statics*, *pogrom*).

Si scrivono e si correggono a occhio, senza HTML. I titoli delle schede
restano senza marcatori, perché compaiono anche nella mappa, nella cronologia
e nei collegamenti.

## 4ter. Il campo `da` e il file dei libri

Ogni scheda dichiara **da dove viene**, in forma strutturata:

```yaml
da:
  - {l: T, c: 18, p: 1}
  - {l: Q, c: 2, p: 5}
  - {l: Q, c: 1, p: 6, dove: "box «Ernst Haeckel»"}
```

A livello di materia, **non** di documento, un file
`01_Argomenti/Storia/_libri.yaml` elenca i libri con capitoli e paragrafi
(titolo e pagine), copiati una volta dall'indice del libro.

Da questi due pezzi si ricavano, senza scrivere nulla in più:

- la **fonte in chiaro** in fondo a ogni scheda («Q cap. 2 par. 5 — L'Impero
  austro-ungarico e la questione delle nazionalità»);
- la vista **Copertura del libro**: per ogni paragrafo, quante schede lo
  coprono e in quale documento stanno; i paragrafi senza nessuna scheda sono
  segnati in rosso.

La copertura risponde a una domanda che un singolo documento non può
rispondere, perché **un argomento non copre un paragrafo: un paragrafo si
distribuisce su più argomenti**.

### I tipi di `lega`

Dalle due prove, e tutti presenti a parole nel libro:

`causa` · `conseguenza` · `prosegue` · `chiude` · `sincronia` · `esempio` ·
`giustifica` · `confronto` · `usa`

**Regola d'oro: si scrive da un lato solo.** La reciprocità la calcola l'app,
come già per i collegamenti di Italiano.

## 5. La scheda `confronto` — modello dati

```
tipo: confronto
id, titolo, sigla, fonte
domande: [...]                 # le stesse per tutti i casi
casi:
  - nome: ...
    scheda: ...               # facoltativo: la voce di dettaglio
    risposte: [...]           # tante quante le domande
```

Serve per: i totalitarismi (tre casi), Monroe/Roosevelt, i due blocchi,
holding/cartello/trust, Darwin contro darwinismo sociale.

Controllo automatico: ogni caso ha tante `risposte` quante sono le `domande`.

## 6. Viste ricavate (non si scrivono)

Come il **Formulario** sta a Matematica, qui stanno:

- **Cronologia** — tutte le voci con `quando`, in ordine, su una pagina.
- **Glossario** — tutte le voci `genere: concetto`, più le `parole`.
- **Chi è chi** — tutte le voci `genere: persona`.
- **Svolte** — le voci con `svolta: true`.
- **Copertura del libro** — dal campo `da` e da `_libri.yaml`; è l'unica vista
  di materia, le altre sono di documento.

Nessuna di queste è un file: si ricavano dalle schede. Un dato, un posto.

## 7. La memorizzazione

Il ripasso di «Per situazioni» oggi sfoca il codice e lo scopre riga per riga.
Qui l'equivalente è **nascondere un campo e chiederlo**, e il campo giusto
dipende dal `genere` — è l'unica ragione per cui `genere` esiste:

| genere | cosa si nasconde |
|---|---|
| evento | `quando`, `chi` |
| persona | `cosa` (che cosa ha fatto), `quando` |
| concetto | `cosa` (la definizione) |
| processo | `conta` |
| confronto | una colonna di `risposte` |

Da decidere con Ste se farlo subito o dopo la prima prova su Windows.

## 8. Cosa NON fa

- Non sostituisce il libro né scrive i contenuti: quelli li fa la sessione di
  studio.
- Non ha una linea del tempo grafica (per ora la cronologia è un elenco).
- Non ha carte geografiche interattive: `dove` è testo. Le carte sono un
  secondo passo, con il meccanismo delle figure già esistente.
- Non importa automaticamente i riassunti in Claude Docs.

## 9. Verifica prima della schermata

- **Strutturale** (zod, come ora): campi obbligatori, `id` = nome file,
  `lega`/`confondi`/`vicine` verso schede esistenti, `casi` con tante
  risposte quante domande.
- **Date**: `quando` si legge con lo stesso lettore di date di Italiano
  (formati liberi, intervalli, testo); una data impossibile resta testo e
  diventa un avviso, mai un blocco.
- **Test**: gli esempi di questa specifica diventano file reali nei test.

## 10. Da decidere con Ste

1. **Collegamento verso un altro documento** (`eugenetica → nazismo`):
   proposta `{documento: ..., scheda: ...}`, non controllato finché l'altro
   documento non esiste, avviso e mai errore.
2. **`genere` serve davvero?** Non cambia i campi: serve solo per filtri,
   viste ricavate e ripasso. Se il ripasso non si fa, si toglie.
3. **Ripasso adesso o dopo** la prima prova su Windows.
4. **Primo documento da costruire**: le alleanze (già scritto a mano) o un
   argomento che Ste sta studiando ora?
5. **Le carte**: `dove` resta testo, o si fa subito la figura geografica?

## 11. Tappe

1. Approvazione di questa bozza.
2. Prova di tenuta sul **Capitolo 3**, che non ho ancora visto: se entra senza
   campi nuovi, il modello regge; se no, si corregge qui.
3. Schema zod + test.
4. Contenuto reale di un argomento (dal materiale vero).
5. Rendering minimo di `voce` e `confronto`.
6. Prova su Windows.
