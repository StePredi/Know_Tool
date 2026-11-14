# SPECIFICA · Modifica a moduli delle schede «Spiegazione»

Stato: approvata da Ste il 2026-11-14 («ok» dopo il mockup). Da implementare, in due passi.

## 1. Problema e utente
Le spiegazioni si modificano solo come testo YAML. Ste vuole aggiungere, spostare ed eliminare blocchi senza toccare il file.

## 2. Materiale usato
`src/shared/situazioni.ts` (blocchi: titolo, testo, punti, carte, tabella, disegno, comandi, nota, trappola), `ModificaScheda.tsx` (moduli per ricetta, prima_dopo, figura).

## 3. Unità di conoscenza
Il blocco: un elemento dell'elenco `blocchi`.

## 4. Comportamento (dal mockup)
- A sinistra l'elenco dei blocchi (tipo + riassunto) con ↑ ↓ ✕; «+ Blocco» apre i tipi e inserisce dopo quello scelto.
- A destra il modulo del blocco scelto; sotto il testo del file che si aggiorna da solo.
- Si salva solo se la scheda rispetta lo schema; errori leggibili per blocco («Blocco 3 (Punti): non può essere vuoto»). Salvataggio come per le altre schede (copia in `99_Archivio/Versioni/`).
- «Elimina» chiede conferma se il blocco non è vuoto.

## 5. Passi
1. **Passo 1**: titolo, testo, punti, nota, trappola (campi semplici) + sposta/elimina/aggiungi di tutti i tipi. Carte, tabella, disegno, comandi restano «modifica come testo» (riquadro YAML del solo blocco).
2. **Passo 2**: moduli per carte e tabella; per i disegni pile/flusso una tabella di livelli/nodi. Solo dopo che il passo 1 è stato provato su Windows.

## 6. Come si verifica
Test su funzioni pure (`spostaBlocco`, `eliminaBlocco`, `aggiungiBlocco`, `blocchiDaYaml`/`aYaml` ripetibile: YAML → blocchi → YAML = stesso testo). Typecheck; prova su Windows con la scheda di Docker.

## 7. Cosa NON fa
Trascinamento con il mouse; annulla/ripeti; modifica di più schede insieme.

## 8. Da decidere con Ste
Nessuna per il passo 1.
