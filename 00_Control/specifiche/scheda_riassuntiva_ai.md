# Scheda riassuntiva generata dall'AI: design (2026-10-11)

Stato: **progettata, da costruire** (in attesa di conferma dell'utente).

## Decisioni dell'utente

- **Chi genera**: Claude, nella cartella. L'app non ha chiave API e non chiama l'AI: prepara la richiesta pronta da incollare.
- **Scheda già esistente (o modificata dall'utente)**: l'AI **propone**, l'utente **conferma** sezione per sezione. Nulla cambia senza «Applica».
- **Contenuto**: riassunto, struttura e metrica (già decisi) + **contesto del testo**, **citazioni chiave**, **domande da interrogazione**.
- Parole chiave: non si riscrivono, si ricavano dalle annotazioni `parola_chiave` del testo (un dato in un posto solo).
- Figure retoriche e parafrasi restano nell'editor, non nella scheda.

## Flusso

1. **Editor del testo → «Scheda riassuntiva»** (barra in alto). Finestra «Chiedi a Claude»: scelta delle sezioni (riassunto e struttura/metrica sempre; contesto, citazioni, domande attive di default), scheda di destinazione (quella già collegata, oppure «nuova» con categoria) e pulsante **«Copia la richiesta»**. La richiesta contiene già id del testo, percorso dei file e regole.
2. L'utente la incolla a Claude. Claude legge `testo.md`, `annotazioni.json`, `parafrasi.json`, `esercizi.json` e scrive **solo** `testi/<id>/proposta_scheda.md`.
3. L'app vede il file (watcher) e il pulsante diventa **«Proposta pronta»**. La finestra mostra, per ogni sezione, **Ora | Proposta** con una casella: nuove (badge «nuova»), cambiate, uguali (non selezionabili).
4. **Applica** scrive le sezioni scelte nella scheda (se non esiste, la crea e collega `scheda:` del testo). **Scarta** sposta la proposta in `99_Archivio/proposte_scartate/` (non si cancella).
5. Dopo l'applicazione: avviso «Scheda aggiornata · Apri» e la card sulla mappa si evidenzia.

## Formato

`proposta_scheda.md` ha la sintassi di una scheda, più:

```
---
id: silvia            # se la scheda esiste; altrimenti id proposto
origine: analisi      # il contenuto nasce dal testo, non dal manuale
generata: 2026-10-11
corsia: canti
data: "1828"          # solo se ricavabile da testo.md (anno); altrimenti omessa
temi: [morte, ricordo]   # solo id esistenti in temi.md
---
## Riassunto
## Struttura e metrica
## Contesto
## Citazioni chiave
- «Questo è il verso» (v. 12): perché conta
## Domande
- Domanda probabile?
  Risposta breve.
```

Nuove sezioni facoltative della scheda: `Struttura e metrica`, `Contesto`, `Citazioni chiave`, `Domande`. La scheda completa le mostra in ordine e aggiunge le parole chiave ricavate dalle annotazioni.

## Regole per l'AI

- Usa solo ciò che è nel testo e nelle annotazioni; il resto va in `note/lacune.md`.
- La **data** la ricava dal testo, mai la indovina: se manca, la lascia vuota e l'utente la scrive nell'anteprima.
- Cita solo temi e schede esistenti; non cambia `id`; non scrive campi calcolati; non tocca `stato/` né altri file.
- Le citazioni chiave devono essere copiate **parola per parola** dal testo (l'app lo verifica e segnala quelle che non ci sono).

## Costruzione (passi)

1. Formato: lettura di `proposta_scheda.md`, nuove sezioni della scheda, controlli.
2. Scheda completa: mostra le nuove sezioni e le parole chiave.
3. Finestra «Scheda riassuntiva» (richiesta + confronto + applica/scarta) e generazione della richiesta.
4. Test: applicazione per sezioni, scheda nuova, citazioni non trovate, scarto in archivio.
