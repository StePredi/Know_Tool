# Piano di riordino delle cartelle (2026-10-16) — DA APPROVARE, nulla è stato spostato

Basato sulle decisioni dell'utente in `proposta_modifica_e_cartelle.md`: struttura **Materia / Argomento / {Fonti, Appunti, Pratica, Schemi}**, i documenti utili (come «Per situazioni») **direttamente nella cartella dell'argomento**, niente `Mappe/`, nomi delle cartelle con l'iniziale maiuscola, nomi tecnici liberi.

## Com'è adesso → come diventa

```
01_Argomenti/                                 01_Argomenti/
  informatica/                                  Informatica/
    reti/                                         Reti/
      MikroTik per situazioni/                      MikroTik/                     ← nuova cartella-argomento
                                                      MikroTik per situazioni/
  italiano/                                     Italiano/
    autori/<autore>/…                             Autori/<autore>/…               (id degli autori invariati)
    fonti/leopardi_mappa_originale.html           Fonti/leopardi_mappa_originale.html
    _condiviso/                                   _condiviso/                     (tecnica: resta)
  Matematica/ (vuota)                           Matematica/                       (invariata)
  TPSIT/MSP/                                    TPSIT/MSP/
    appunti/ fonti/ pratica/ schemi/              Appunti/ Fonti/ Pratica/ Schemi/
    MSP per situazioni/                           MSP per situazioni/             (invariata)
    _scheda.md                                    _scheda.md                      (invariata)
```

## Spostamenti (tutti `git mv`, in un solo commit)

| # | Da | A |
|---|----|---|
| 1 | `informatica` | `Informatica` |
| 2 | `Informatica/reti` | `Informatica/Reti` |
| 3 | `Informatica/Reti/MikroTik per situazioni` | `Informatica/Reti/MikroTik/MikroTik per situazioni` |
| 4 | `italiano` | `Italiano` |
| 5 | `Italiano/autori` | `Italiano/Autori` |
| 6 | `Italiano/fonti` | `Italiano/Fonti` |
| 7 | `TPSIT/MSP/appunti` | `TPSIT/MSP/Appunti` |
| 8 | `TPSIT/MSP/fonti` | `TPSIT/MSP/Fonti` |
| 9 | `TPSIT/MSP/pratica` | `TPSIT/MSP/Pratica` |
| 10 | `TPSIT/MSP/schemi` | `TPSIT/MSP/Schemi` |

Su Windows il nome cambia solo nelle maiuscole: `git mv` in due passi (`a` → `a_tmp` → `A`). I file dentro non cambiano. Nessun file viene cancellato.

## Cosa va cambiato nel codice (prima degli spostamenti, così regge sia il vecchio nome sia il nuovo)

- `main/esplora.ts`: `PROTETTI` e i controlli su `'italiano'`, `'italiano/autori'` (6 punti) → confronto senza maiuscole.
- `main/repository.ts`: `PERCORSO_AUTORI` → trova la cartella `Italiano/Autori` senza badare alle maiuscole (e poi la nuova).
- `renderer/editor/richiesta.ts`, `main/index.ts` (messaggio), `renderer/home/stato.ts` (`espansi`, percorsi dei testi/mappe).
- `main/appunti.ts`: `trovaFonte` cerca senza badare alle maiuscole (le citazioni `fonti/x.pdf` negli appunti e nelle schede continuano a funzionare anche su sistemi che distinguono le maiuscole).
- Test: ~32 riferimenti a `italiano/…` da aggiornare.
- Le nuove cartelle create dall'app prendono la maiuscola iniziale da sole.

## Testi da aggiornare dopo gli spostamenti

- Citazioni `fonti/`, `pratica/`, `schemi/` negli appunti e nelle schede di MSP → `Fonti/`, `Pratica/`, `Schemi/` (sostituzione controllata, con elenco delle righe toccate).
- Documenti: `sessione_studio.md`, `REGOLE.md`, `STATO.md`, `formato_studio_italiano.md`, `_scheda.md` di MSP (percorsi).

## Cosa può succedere

- Preferiti, recenti, schede aperte e cartelle espanse ricordati dall'app con i vecchi percorsi spariscono (l'app li scarta da sola): si rifanno in un minuto.
- La sessione di studio deve usare i nuovi nomi: si aggiorna `sessione_studio.md` prima di cambiare sessione.

## Ordine di lavoro e ritorno indietro

1. Codice a prova di maiuscole + test (nessuno spostamento).
2. Spostamenti (un commit solo).
3. Citazioni e documenti.
4. Prova con i dati veri (`dati_reali.test.ts` e apertura dell'app).
5. Ritorno indietro: `git revert` del commit degli spostamenti.
