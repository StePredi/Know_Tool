# DECISIONI — indice

Per ogni parte del progetto, qual è il file che vale.

---

## Dove guardare

| Parte | File che vale | Demo |
|---|---|---|
| Come si progetta un nuovo tipo di documento | `procedura_nuovi_documenti.md` | — |
| Formato dei file di studio (Italiano) | `specifiche/formato_studio_italiano.md` (fonte principale) | — |
| Home dell'autore | `specifiche/decisioni_home_autore.md` e `specifiche/specifica_home_autore.md` | `03_Demo/home_autore/` |
| Editor del testo | `specifiche/decisioni_editor_testo.md` | `03_Demo/editor_testo/` |
| Home generale (schede, albero, cartelle) | `specifiche/home_generale.md` | — |
| Galleria «+ Nuovo» | `specifiche/galleria_modelli.md` | — |
| Modello «Per situazioni» | `specifiche/modello_per_situazioni.md` | — |
| Scheda riassuntiva dell'AI | `specifiche/scheda_riassuntiva_ai.md` | — |
| Matematica | `specifiche/modello_matematica.md` (approvata 2026-10-20: Matematica dentro «Per situazioni») e `specifiche/matematica_argomenti.md` (elenco del programma) | Mockup in `03_Demo/matematica_per_situazioni/` |
| Cartelle e nomi | `REGOLE.md` §3 e §5 | — |
| Lavoro di sviluppo / di studio | `sessione_controllo.md` / `sessione_studio.md` | — |

---

## Regola in caso di contraddizioni

- Se una demo e un documento si contraddicono, **vale il documento**.
- Se due documenti si contraddicono, **vale quello più in alto in questa tabella per quella parte**; per l'Italiano vale `formato_studio_italiano.md`.
- I documenti in `specifiche/_storico/` sono superati: non si seguono, servono solo per capire com'è andata.

---

## Matematica: stato (2026-10-21)

Decisione di Ste: Materia (Matematica) → un documento «Per situazioni» per argomento, con lo stesso albero degli altri. Aggiunte al modello: scheda `regola`, rami a passi (`ordine`), `ingresso`/`guida`, `esercizi.yaml`, disposizione **Formulario**, controllo numerico degli esempi. Derivate è il documento di riferimento. Il resto degli argomenti lo scrive una sessione di studio (vedi `sessione_studio.md`, sezione Matematica). Il primo codice Matematica (motore polinomi, schermata dedicata) è archiviato in `99_Archivio/Obsoleti/2026-10-21/matematica_prima_versione/`.
