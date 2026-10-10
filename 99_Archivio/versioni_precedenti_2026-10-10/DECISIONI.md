# DECISIONI

Decisioni già prese sul progetto.

---

## Control_Room

- La Control_Room è una chat di Claude (progetto "School_tool").
- Lì si decide e si scrivono i prompt.

---

## Prodotto

- App **desktop (Electron)** unica con moduli.
- Un tool per materia solo quando serve, progettato a partire da un bisogno reale.

---

## Dati

- File in una cartella collegata all'app (non un database).
- Markdown con frontmatter e JSON, ID leggibili (slug).
- L'AI modifica gli stessi file; cartella sotto git per annullare.

---

## Primo tool: Italiano

- Unisce lo studio dell'autore (mappa a corsie) e l'editor dei testi.
- Specifica: `00_Control/specifiche/formato_studio_italiano.md`.
- Specifica della home dell'autore: `00_Control/specifiche/specifica_home_autore.md` (prevale dove differisce).

---

## Home dell'autore

**Design chiuso.**

- Stile moderno pulito con contrasto alto.
- Corsie colorate.
- Densità "estese": scelta fissa, non si cambia.
- Due modalità: Studio e Modifica.
- Demo in `03_Demo/home_autore/`.

---

## Data della scheda

- Un solo campo libero, interpretato dall'app (vedi §4 della specifica).
- Ordine a parità di data: per `id`.

---

## Prossimo passo

- Editor dei testi.

---

## Lista d'attesa

- Modulo Inglese (diagnosi fatta)
- Sistemi e Reti (documentazione)
- Matematica
- Storia
- Altre materie
