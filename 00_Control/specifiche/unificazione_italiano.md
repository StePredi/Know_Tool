# Unificare Italiano nel modello comune — proposta

Stato: **ANNULLATA il 2026-11-25.** Ste: «Italiano ha il suo schema, quindi non bisogna andarla a modificare. Lo schema italiano e Storia sono già a posto così, bisogna semplicemente integrarli meglio nel programma.» Quindi **i formati dei dati di Italiano e Storia non cambiano** e il codice vecchio non si elimina. Resta solo il lavoro di integrazione nell'app e il completamento dei dati (vedi `STATO.md`). Il testo sotto è tenuto solo come storia di cosa era stato proposto.

Procedura: `procedura_nuovi_documenti.md` (prima la proposta, poi i dati di prova, poi il codice).

---

## 1. Obiettivo

Italiano oggi ha un codice tutto suo: `main/repository.ts` (709 righe), `editor/`, `componenti/`, schede `.md` con frontmatter, mappa a corsie, home dell'autore. Le altre materie usano il modello «Per situazioni» (`indice.yaml` + `schede/*.yaml`).

Dopo l'unificazione:

- un autore è **un documento «per situazioni»** come quelli di Storia e MikroTik, con mappa, ricerca, «Segna come ripassata», «Mettiti alla prova», modifica a moduli, galleria;
- il codice vecchio di Italiano si elimina;
- **resta** l'editor dei testi (annotazioni, parafrasi, esercizi), che non esiste altrove.

## 2. Dati oggi

| Autore | File | Contenuto |
|---|---|---|
| Leopardi | 112 | 105 schede, 10 temi, 32 voci di glossario, 1 testo con annotazioni/parafrasi/esercizi |
| Verga | 87 | schede, temi, glossario, note |
| De Roberto | 14 | schede, temi, glossario |

Più `_condiviso/figure_retoriche.json` (usato dall'editor dei testi).

## 3. Come si traduce ogni pezzo

| Oggi (Italiano) | Domani (modello comune) |
|---|---|
| `autore.md` (nome, nascita, morte) | `indice.yaml`: `centro` = l'autore, con anni nel titolo |
| 6 **corsie** (Contesto, Vita, Persone, Pensiero, Canti, Prose) | 6 **rami**, uno per corsia, con il loro colore |
| scheda `.md`: Riassunto, Dettagli, Attenzione | scheda **`voce`**: `cosa` = Riassunto, `svolgimento`/`elementi` = Dettagli, `errore` = Attenzione |
| `data` (formato libero) | `quando` (stesso formato, stessa interpretazione) |
| `pagine` | `da` (libro, capitolo, pagina), con `_libri.yaml` della materia |
| `temi` (10 per autore) | **etichette** sulla scheda + filtro «per tema» nella mappa |
| `periodi` (1798 Studi, 1816 Conversione…) | vista **Cronologia** ricavata, con i periodi come fasce |
| collegamenti fra schede | `lega` con tipo e perché (si scrive da un lato solo) |
| collegamenti **fra autori** (`foscolo/ortis`) | `lega` con percorso `autore/scheda` |
| glossario | vista **Glossario** ricavata dalle schede di genere `concetto` (o file `glossario.yaml` nel documento) |
| confronti e ripasso (non ancora convertiti dall'HTML) | schede **`confronto`** e «Mettiti alla prova» già esistente |
| `testi/<id>/` + annotazioni, parafrasi, esercizi | **resta com'è**: cartella `Testi/` dell'autore e l'editor dei testi; la scheda di un testo ha un pulsante «Apri nell'editor» |
| `stato/<autore>.json` (stato dello studente) | `progresso.json` come nelle altre materie |

## 4. Cosa manca al modello comune (da aggiungere)

1. **Genere** `opera` e `autore` nelle schede `voce` (oggi: evento, persona, concetto, processo).
2. **Etichette (temi)** sulle schede e filtro nella mappa.
3. **Vista Cronologia** con periodi (Storia ha già una vista ricavata dalle date: si riusa).
4. **Vista Glossario**.
5. **Collegamenti fra documenti diversi** (da un autore all'altro).
6. **Pulsante «Apri nell'editor dei testi»** su schede di tipo opera.

## 5. Cosa si elimina

`main/repository.ts`, `editor/` (tranne l'editor dei testi), `componenti/` della mappa a corsie e della lista, `home/` dell'autore, le schede `.md`. Prima si converte tutto e si controlla che nessun dato sia perso.

## 6. Come si converte (senza perdere dati)

Script di conversione `md → yaml`, lanciato a secco prima:

- conta schede, collegamenti, temi, voci di glossario prima e dopo; **i numeri devono coincidere**;
- le schede originali vanno in `99_Archivio/Obsoleti/<data>/`, non si cancellano;
- prima Verga (87 file) come prova, poi Leopardi, poi De Roberto;
- ogni autore in un commit separato `studio:` / `app:`.

## 7. Fasi

1. **Approvazione** di questa proposta e dei punti del §8.
2. **Prova a mano**: un autore piccolo (De Roberto, 14 file) scritto a mano nel nuovo formato, aperto nell'app.
3. **Modello**: generi, etichette, collegamenti fra documenti (§4.1, 4.2, 4.5).
4. **Viste**: Cronologia e Glossario (§4.3, 4.4).
5. **Conversione** di Verga e Leopardi con controllo dei numeri.
6. **Completamento**: i dati ancora nell'HTML (confronti, ripasso, lacune e trappole, testi chiave, luoghi, 3 voci di glossario).
7. **Pulizia**: eliminare il codice vecchio, test aggiornati.

## 8. Da decidere

1. Un autore = **un documento** (consigliato) o un documento per periodo?
2. Il glossario: ricavato dalle schede `concetto` (nessun file in più) o file `glossario.yaml` a parte (come oggi)?
3. I temi: etichette libere o lista fissa per autore (come oggi, 10 temi)?
4. L'editor dei testi: resta una schermata a sé, collegata dalla scheda dell'opera (consigliato), oppure va integrato nella scheda?
5. Ordine: partire da De Roberto (piccolo) o da Verga (medio)?
