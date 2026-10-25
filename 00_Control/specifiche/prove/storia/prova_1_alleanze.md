# Prova a mano 1 — «Le alleanze europee (1879-1914)»

Passo 3 della `procedura_nuovi_documenti.md`. Scritta a mano, in testo
semplice, **prima** di qualunque schermata e prima del modello definitivo.

Perché questo argomento: è il caso più difficile che il materiale offra.
Attraversa quattro paragrafi del Cap. 2 di quarta, pesca dal Cap. 18 di terza,
copre trent'anni, e **nessun paragrafo lo contiene tutto**. È anche una domanda
vera del libro: «Come si arriva alla formazione di due blocchi di alleanze
contrapposte? Spiegalo in una mappa concettuale» (Fissiamo il nucleo 1, p. 53).

Fonti usate:
- **Q** = libro di quarta, Unità 1, Cap. 2, par. 2, 4, 5, 6, 7 (pp. 36-53)
- **T** = libro di terza, Cap. 18, par. 1 (la Triplice del 1882 vista dall'Italia)

---

## indice.yaml (proposta)

```yaml
titolo: Le alleanze europee
centro: Alleanze 1879-1914

ingresso: la domanda riguarda chi sta con chi in Europa prima della guerra
guida: chi si sente accerchiato in questo momento, e da chi?

fonti:
  - sigla: Q
    titolo: Storia, vol. 2 — Unità 1, Cap. 2
  - sigla: T
    titolo: Storia, vol. 1 — Cap. 18

rami:

  - id: sistema-bismarck
    nome: Il sistema di Bismarck
    ordine: true            # le voci si leggono in sequenza
    quando: 1879-1890
    schede: [duplice-1879, triplice-1882, equilibri-bismarck]

  - id: svolta-guglielmo
    nome: La svolta di Guglielmo II
    ordine: true
    quando: 1888-1908
    schede: [caduta-bismarck-1890, weltpolitik, kruger-1896, bosnia-1908]

  - id: nasce-intesa
    nome: La risposta: nasce l'Intesa
    ordine: true
    quando: 1891-1907
    schede: [francia-russia-1891, entente-1904, gb-russia-1907, triplice-intesa]

  - id: prove-di-forza
    nome: Le prove di forza
    quando: 1905-1913
    schede: [marocco-1905, agadir-1911, balcaniche-1912, polveriera]

  - id: quadro
    nome: Il quadro d'insieme
    schede: [due-blocchi]
```

Nota: `ordine: true` **esiste già** nel modello di Matematica (aggiunta 1).
Qui serve per lo stesso motivo: sono passi in sequenza, non casi alternativi.

---

## Schede

### schede/duplice-1879.yaml

```yaml
id: duplice-1879
genere: evento
titolo: Il patto Germania-Austria
sigla: Duplice 1879
quando: 1879
dove: Europa centrale
chi: [Germania, Austria-Ungheria]
cosa: Patto in chiave antirussa fra l'Impero tedesco e l'Austria-Ungheria.
conta: È il primo mattone del sistema di Bismarck: lega l'Austria alla Germania
  e isola la Russia, che aveva ambizioni sui Balcani.
fonte: Q cap. 2 par. 5
parole: [Duplice, Bismarck, antirussa]
lega:
  - {scheda: triplice-1882, tipo: prosegue, perche: tre anni dopo vi entra l'Italia}
```

### schede/triplice-1882.yaml

```yaml
id: triplice-1882
genere: evento
titolo: La Triplice alleanza
sigla: Triplice 1882
quando: 1882
dove: Europa
chi: [Germania, Austria-Ungheria, Italia]
cosa: L'Italia entra nel patto austro-tedesco. Militare e solo difensivo.
conta: Rovescia le alleanze italiane: la Francia, che era stata fra gli
  "sponsor" dell'unità d'Italia, diventa avversaria; l'Austria, nemica per
  decenni, diventa alleata — e il problema delle terre irredente
  (Trento, Trieste, Istria) resta aperto.
fonte: [T cap. 18 par. 1, Q cap. 2 par. 5]
parole: [Triplice alleanza, irredentismo, terre irredente]
lega:
  - {scheda: tunisi-1881, tipo: causa, perche: l'Italia si avvicina alle potenze
     centrali per non restare isolata dopo lo smacco di Tunisi}
  - {scheda: due-blocchi, tipo: confronto}
```

**Il punto da notare.** Questa scheda ha due fonti: il *perché* l'Italia entra
nella Triplice sta nel libro di terza (la Francia occupa la Tunisia nel 1881),
il *cosa comporta per l'Europa* sta nel libro di quarta. Nessuno dei due da
solo basta. `fonte` accetta quindi una lista.

### schede/caduta-bismarck-1890.yaml

```yaml
id: caduta-bismarck-1890
genere: evento
svolta: true
titolo: Le dimissioni di Bismarck
sigla: Cade Bismarck
quando: 18/03/1890
dove: Germania
chi: [Otto von Bismarck, Guglielmo II]
cosa: Dopo vent'anni, il cancelliere è costretto a dimettersi dal nuovo
  imperatore, salito al trono nel 1888 e deciso ad accentrare il potere.
conta: Con lui finisce la politica degli equilibri. Da qui in poi la Germania
  diventa aggressiva e spinge, senza volerlo, i suoi avversari a cercarsi.
fonte: Q cap. 2 par. 2
parole: [Bismarck, Guglielmo II, cancelliere]
lega:
  - {scheda: weltpolitik, tipo: conseguenza}
  - {scheda: equilibri-bismarck, tipo: chiude}
```

### schede/weltpolitik.yaml

```yaml
id: weltpolitik
genere: concetto
titolo: La Weltpolitik
sigla: Weltpolitik
quando: dal 1890
dove: Germania
chi: [Guglielmo II]
cosa: Letteralmente "politica mondiale". Politica estera aggressiva,
  alimentata dal militarismo, per dare alla Germania un posto di rilievo
  fra le potenze imperialiste.
conta: Non conquista molto, ma rompe il sistema di pesi e contrappesi di
  Bismarck: urtando Londra e Parigi insieme, le fa avvicinare fra loro.
fonte: Q cap. 2 par. 2
parole: [Weltpolitik, militarismo, flotta]
storiografia:
  - {autore: Michael Stürmer, titolo: "Che cosa fu la Weltpolitik tedesca?", pagina: 69}
lega:
  - {scheda: kruger-1896, tipo: esempio}
  - {scheda: entente-1904, tipo: causa, perche: l'attivismo tedesco rende
     impensabile che Londra resti isolata}
```

### schede/entente-1904.yaml

```yaml
id: entente-1904
genere: evento
titolo: L'Entente cordiale
sigla: Entente 1904
quando: 1904
dove: Africa
chi: [Gran Bretagna, Francia]
cosa: Accordo con cui le due potenze risolvono i contrasti coloniali in
  Africa: ai britannici l'Egitto, ai francesi via libera sul Marocco.
conta: Due rivali di ieri si accordano. La Gran Bretagna esce
  dall'isolamento in cui stava dai tempi della regina Vittoria, e lo fa in
  funzione antitedesca.
fonte: Q cap. 2 par. 4
parole: [Entente cordiale, isolamento, Egitto, Marocco]
lega:
  - {scheda: boeri-1899, tipo: causa, perche: la guerra anglo-boera mostra a
     Londra di essere vulnerabile e la spinge a cercare alleati}
  - {scheda: marocco-1905, tipo: conseguenza, perche: la Germania, rimasta
     fuori dall'accordo sul Marocco, reagisce}
  - {scheda: gb-russia-1907, tipo: prosegue}
```

### schede/polveriera.yaml

```yaml
id: polveriera
genere: processo
svolta: true
titolo: I Balcani diventano una polveriera
sigla: La polveriera
quando: 1913
dove: Balcani
chi: [Serbia, Austria-Ungheria, Russia]
cosa: Le guerre balcaniche, invece di stabilizzare l'area, radicano
  nazionalismi, risentimenti e desideri di vendetta. La Serbia esce
  ingrandita e persegue il progetto di una Grande Serbia; l'Austria la teme.
conta: Serbia e Austria hanno entrambe alleati pronti a soccorrerle: basta
  una scintilla locale perché scatti un effetto domino europeo. È così che si
  precipita nella guerra mondiale.
fonte: Q cap. 2 par. 7 (riquadro «Punti di svolta»)
parole: [polveriera, effetto domino, Grande Serbia]
lega:
  - {scheda: bosnia-1908, tipo: causa}
  - {scheda: due-blocchi, tipo: usa, perche: l'effetto domino funziona solo
     perché i due blocchi esistono già}
```

---

## La scheda di confronto

### schede/due-blocchi.yaml

```yaml
id: due-blocchi
tipo: confronto
titolo: Triplice alleanza e Triplice intesa
sigla: I due blocchi
fonte: Q cap. 2 par. 5, 7

domande:
  - chi ne fa parte
  - quando si forma
  - cosa tiene insieme
  - punto debole

casi:
  - nome: Triplice alleanza
    scheda: triplice-1882
    risposte:
      - Germania, Austria-Ungheria, Italia
      - 1879 il nucleo, 1882 con l'Italia
      - contenere la Russia nei Balcani; per l'Italia, non restare isolata
      - l'Italia rivendica terre all'Austria, che è sua alleata

  - nome: Triplice intesa
    scheda: triplice-intesa
    risposte:
      - Francia, Russia, Gran Bretagna
      - 1891 Francia-Russia, 1904 Entente, 1907 GB-Russia
      - arginare la potenza tedesca
      - nata da accordi separati, non da un patto unico
```

Qui il tipo di scheda **cambia davvero**: non ha `cosa`/`conta`, ha domande e
casi. Serve per ogni confronto del programma — e i totalitarismi, più avanti,
sono esattamente questo con tre casi invece di due.

---

## Cosa si ricava e non si scrive

- **Cronologia** dell'argomento: tutte le schede con `quando`, in ordine. Non
  esiste un file cronologia.
- **Glossario**: tutte le schede `genere: concetto`, più le `parole`.
- **Carta**: tutte le schede con `dove`.
- **Reciprocità**: se A è `causa` di B, su B compare «conseguenza di A». Si
  scrive da un lato solo, come già in Italiano.

## Come risponde alla domanda del libro

«Come si arriva a due blocchi contrapposti?» → si apre il ramo
*La risposta: nasce l'Intesa*, che è in ordine, e si legge la catena:
1891 → 1904 → 1907, con i collegamenti `causa` che agganciano ogni passo alla
Weltpolitik. La mappa concettuale richiesta dall'esercizio **è** quel ramo.

## Cosa ha richiesto questo argomento

1. `ordine: true` sui rami → **esiste già** (Matematica, aggiunta 1).
2. `fonte` come lista → piccola estensione.
3. `lega` con un tipo e un perché → **nuovo**.
4. `svolta: true` → **nuovo**, ma è un flag, non un tipo.
5. Tipo di scheda `confronto` → **nuovo**.
6. Campi `quando / dove / chi / cosa / conta` → **nuovi**, ma sono le cinque
   voci dei nuclei del libro, non un'invenzione.
