# Prova a mano 2 — «Darwinismo sociale e teorie razziali»

Passo 3, secondo argomento. Scelto apposta **di forma opposta** al primo: lì
una catena di eventi datati, qui un insieme di idee quasi senza date.

Perché questo argomento: è l'unico dove i due libri si incrociano in modo
dichiarato. Il libro di quarta, parlando di antisemitismo, stampa il rimando
**→ VOL II · CAP. 16 · PAR. 4**, cioè proprio al capitolo di terza che Ste ha
già riassunto. Preso da solo, nessuno dei due è l'argomento intero.

Fonti usate:
- **T** = libro di terza, Cap. 16, par. 4 (positivismo, Darwin, darwinismo
  sociale, la deriva razziale)
- **Q** = libro di quarta, Cap. 1, par. 6 (colonialismo, nazionalismo,
  antisemitismo, teorie razziali) e il box «Ernst Haeckel e la deriva del
  darwinismo sociale»

---

## indice.yaml (proposta)

```yaml
titolo: Darwinismo sociale e teorie razziali
centro: Dal positivismo al razzismo

ingresso: la domanda riguarda come si è giustificato il dominio di un popolo
  su un altro, o da dove viene il razzismo "scientifico"
guida: questa idea è scienza, o è un uso politico della scienza?

fonti:
  - sigla: T
    titolo: Storia, vol. 1 — Cap. 16 par. 4
  - sigla: Q
    titolo: Storia, vol. 2 — Cap. 1 par. 6

rami:

  - id: da-dove-nasce
    nome: Da dove nasce
    ordine: true
    schede: [positivismo, darwin, cosa-dice-darwin]

  - id: lo-stravolgimento
    nome: Lo stravolgimento
    ordine: true
    schede: [darwinismo-sociale, spencer, gobineau, haeckel]

  - id: a-cosa-serve
    nome: A cosa serve, in politica
    schede: [missione-civilizzatrice, antisemitismo, eugenetica]

  - id: giudizio
    nome: Come si giudica oggi
    schede: [razze-non-esistono, darwin-contro-darwinismo]
```

I rami qui non sono fasi di tempo, sono **passaggi di un ragionamento**. Il
modello non cambia: sono rami come gli altri, con `ordine: true` dove serve.

---

## Schede

### schede/cosa-dice-darwin.yaml

```yaml
id: cosa-dice-darwin
genere: concetto
titolo: Che cosa dice davvero la selezione naturale
sigla: Selezione naturale
quando: 1859
chi: [Charles Darwin]
cosa: Gli esseri viventi si evolvono adattandosi all'ambiente; sopravvivono
  quelli con maggiore capacità di adattamento. L'ordine naturale è instabile
  e in divenire.
conta: Il punto che viene sempre tradito dopo - **il più adatto non è
  necessariamente "superiore"**. Chi lo dimentica ha già smesso di parlare di
  Darwin.
fonte: T cap. 16 par. 4
parole: [selezione naturale, adattamento, L'origine delle specie]
errore: credere che Darwin abbia parlato di razze superiori e inferiori
lega:
  - {scheda: darwinismo-sociale, tipo: deformato_in}
  - {scheda: darwin-contro-darwinismo, tipo: confronto}
```

`errore` esiste già nel modello di Matematica (scheda `regola`). Qui serve per
lo stesso motivo: è la cosa che si sbaglia tutte le volte.

### schede/darwinismo-sociale.yaml

```yaml
id: darwinismo-sociale
genere: concetto
titolo: Il darwinismo sociale
sigla: Darwinismo sociale
quando: seconda metà dell'Ottocento
cosa: Fusione, spesso impropria, di tre cose: la teoria evoluzionista, l'idea
  positivista di progresso e il nazionalismo. Ne esce la tesi che la vita in
  società funzioni per selezione naturale.
conta: Trasforma un'osservazione sulla natura in una regola di governo: se
  vince il più adatto, allora chi vince ha ragione di vincere.
fonte: [T cap. 16 par. 4, Q cap. 1 par. 6]
parole: [darwinismo sociale, progresso, competizione]
confondi:
  - {scheda: cosa-dice-darwin, differenza: Darwin descrive le specie in natura;
     il darwinismo sociale prescrive come devono stare gli uomini fra loro}
lega:
  - {scheda: spencer, tipo: formulato_da}
  - {scheda: missione-civilizzatrice, tipo: giustifica}
```

`confondi` esiste già (Matematica). Qui regge senza modifiche.

### schede/spencer.yaml

```yaml
id: spencer
genere: persona
titolo: Herbert Spencer
sigla: Spencer
quando: 1851
dove: Gran Bretagna
cosa: In *Social Statics* - **prima di Darwin** - sostiene che l'evoluzione è
  progresso, legge universale; nella società vige una competizione spietata
  che non va ostacolata con leggi a favore dei più deboli.
conta: Mostra che il darwinismo sociale non nasce da Darwin: l'idea c'era
  già, e a Darwin è stata appiccicata dopo.
fonte: T cap. 16 par. 4
parole: [Spencer, Social Statics, competizione]
```

### schede/haeckel.yaml

```yaml
id: haeckel
genere: persona
titolo: Ernst Haeckel
sigla: Haeckel
quando: 1868
dove: Germania
cosa: In *Storia naturale della creazione* classifica gerarchicamente le
  "razze" umane per grado di evoluzione: alla base alcune popolazioni
  africane e micronesiane, al vertice la romana e la germanica. Temeva che la
  medicina moderna impedisse la selezione naturale.
conta: È il passaggio dal pregiudizio alla finta prova scientifica: un
  biologo serio, con un errore di impostazione, finisce per "giustificare"
  la superiorità di un'etnia.
fonte: [T cap. 16 par. 4, Q cap. 1 box «Ernst Haeckel e la deriva del
  darwinismo sociale»]
parole: [Haeckel, albero filogenetico, razza germanica]
nota: Haeckel non considerò mai un modello da incoraggiare l'abbandono dei
  bambini malati, pur citando l'uso spartano.
lega:
  - {scheda: eugenetica, tipo: prepara}
  - {scheda: gobineau, tipo: sincronia, perche: stessi anni, strade diverse —
     Gobineau parte dalla letteratura, Haeckel dalla biologia}
```

**Qui il collegamento `sincronia` fa il suo lavoro.** Gobineau (1853-55) e
Haeckel (1868) non si parlano e non si causano: sono contemporanei e vanno
nella stessa direzione da due discipline diverse. È la riga «Sincronia» che
Ste già scrive a mano nei suoi riassunti, diventata un collegamento.

### schede/eugenetica.yaml

```yaml
id: eugenetica
genere: concetto
titolo: Le teorie eugenetiche
sigla: Eugenetica
quando: fine Ottocento - Novecento
cosa: Insieme di teorie e pratiche che vogliono selezionare le
  caratteristiche di una popolazione, favorendo la riproduzione dei soggetti
  considerati desiderabili e impedendo quella degli "indesiderabili".
conta: È il punto in cui l'idea diventa pratica di Stato. Applicata nei campi
  di sterminio nazisti, ma sostenuta e applicata nel Novecento anche in paesi
  democratici come Stati Uniti e Svezia.
fonte: Q cap. 1 par. 6 e box Haeckel
parole: [eugenetica, purezza della razza]
lega:
  - {scheda: nazismo, tipo: prosegue, perche: il filo arriva al programma
     nazista — argomento di un altro documento}
```

Nota sul collegamento in uscita: `nazismo` **non è una scheda di questo
documento**. Serve poter puntare a una scheda di un altro argomento. Nel
modello attuale `vicine` e `confondi` sono controllati e devono esistere: va
deciso come si scrive un collegamento che esce (vedi §Da decidere).

---

## La scheda di confronto

### schede/darwin-contro-darwinismo.yaml

```yaml
id: darwin-contro-darwinismo
tipo: confronto
titolo: Darwin e il darwinismo sociale
sigla: Chi dice cosa
fonte: T cap. 16 par. 4

domande:
  - di che cosa parla
  - che cosa afferma
  - che cosa ne segue
  - chi lo sostiene

casi:
  - nome: Darwin
    scheda: cosa-dice-darwin
    risposte:
      - le specie viventi in natura
      - sopravvive chi si adatta meglio all'ambiente
      - niente: descrive, non prescrive. Il più adatto non è superiore
      - Darwin, e poi Mendel per l'ereditarietà

  - nome: Darwinismo sociale
    scheda: darwinismo-sociale
    risposte:
      - gli uomini e le nazioni
      - nella società vige la stessa selezione
      - i forti hanno diritto di prevalere; i deboli non vanno protetti
      - Spencer, poi Gobineau e Haeckel in chiave razziale
```

---

## Verifica: la struttura ha retto?

**Sì, senza campi nuovi rispetto alla prova 1.** Dettaglio:

| serviva | come è stato risolto |
|---|---|
| idee senza data | `quando` lasciato vuoto o generico («seconda metà dell'Ottocento»); già previsto, come in Italiano c'è «senza data» |
| due libri sullo stesso tema | `fonte` come lista, già emerso nella prova 1 |
| «Sincronia» dei suoi appunti | collegamento `tipo: sincronia` |
| l'errore che si fa sempre | campo `errore`, già nel modello Matematica |
| distinguere due cose che si somigliano | `confondi`, già nel modello Matematica |
| confronto fra due posizioni | tipo `confronto`, già emerso nella prova 1 |
| il filo che continua altrove | collegamento in uscita — **unico punto aperto** |

Un solo campo si è aggiunto: `nota`, per la precisazione su Haeckel (ciò che
il libro dice per evitare un fraintendimento). Esiste già in «Per situazioni»
(figure) con lo stesso significato: ciò che non sta nelle fonti o che va
puntualizzato.

## Da decidere con Ste

1. **Collegamento verso un altro documento.** `eugenetica → nazismo` esce
   dall'argomento. Proposta: `{documento: totalitarismi, scheda: nazismo}`,
   non controllato finché quel documento non esiste, segnalato come avviso e
   mai come errore bloccante.
2. **`genere` è davvero utile?** Distingue evento / persona / concetto /
   processo. Non cambia i campi: serve solo per filtrare e per il ripasso
   (a una `persona` si chiede «cosa cambia con lui», a un `evento` «quando»).
   Se non serve al ripasso, si toglie.
