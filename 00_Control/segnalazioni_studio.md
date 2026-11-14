# SEGNALAZIONI DALLO STUDIO

Righe scritte dalla sessione di studio per la sessione di sviluppo. Formato in `sessione_studio.md`, §5.

Quando una segnalazione è stata gestita, la sposto sotto «Fatte» (non la cancello).

---

## Da fare

- 2026-10-16 · MikroTik VLAN · lo schema di rete del laboratorio (VM, router, switch, trunk, ether1-4 del PDF mikTikVlansvm.drawio.pdf) non si può mostrare: le figure supportano solo lo schema pin di una scheda elettronica; serve un modello di disegno per schemi di rete · (manca)

---

## Fatte

- 2026-11-13 · Matematica, test dei documenti: `tests/regola.test.ts` (`documentiMat`) ora cerca i documenti «per situazioni» a qualsiasi profondità sotto `Matematica/` (anche in `Biennio/`), quindi controlla anche Monomi e polinomi, Scomposizione, Frazioni algebriche, Equazioni, Disequazioni, Sistemi lineari. Nuovo `tests/albero_matematica.test.ts`: l'albero li mostra tutti come documenti «per situazioni» (anche dentro Biennio/). (testo originale: i documenti ora sono in `01_Argomenti/Matematica/Biennio/<Ar…)
- 2026-11-13 · MikroTik, `tests/situazioni.test.ts` aggiornato a 50 schede e «50 situazioni». Corretto anche `tests/repository.test.ts` (si aspettava solo Leopardi come autore: ora basta che ci sia).

- 2026-10-20 · Scheda (ricetta), copia e blocchi su più righe: sistemato. «Copia» e «Copia tutto» ora tolgono solo gli spazi a destra (il rientro a sinistra resta); un blocco su più righe in una sola riga della scheda mostra ogni riga con il suo rientro relativo (margine comune + rientro di ogni riga, a capo che riprende il rientro), con il commento e il numero di nota sull'ultima riga. Nuovo `renderer/situazioni/righe.ts` (`righeCodice`, `codiceDaCopiare`), `Scheda.tsx`, CSS `.s-bl`, `tests/righe_codice.test.ts` (4). Typecheck web pulito; non visto in Electron. (testo originale: Scheda (ricetta): il pulsante «Copia» di una fase unisce le righe con …)

- 2026-10-20 · test e percorsi sistemati: `situazioni.test.ts` ora usa `Telecomunicazioni/MikroTik/...` (43 schede, 10 rami); `sessione_studio.md` aggiornata. (era: MikroTik…)
- 2026-10-14 · controllato: le righe di codice su più righe si vedono bene (rientro e a capo mantenuti, un numero di riga per blocco, commento sull'ultima riga); anche «Prima e dopo» con più righe. Trovato e corretto: i commenti erano sempre introdotti da «#» (ora `prefissoCommento` in `indice.yaml`, per C/C++ `//`), e gli esempi nella casella di ricerca erano quelli del MikroTik (ora `esempiRicerca`). Entrambi i campi sono facoltativi.
