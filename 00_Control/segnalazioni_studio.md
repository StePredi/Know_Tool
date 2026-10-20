# SEGNALAZIONI DALLO STUDIO

Righe scritte dalla sessione di studio per la sessione di sviluppo. Formato in `sessione_studio.md`, §5.

Quando una segnalazione è stata gestita, la sposto sotto «Fatte» (non la cancello).

---

## Da fare

- 2026-10-16 · MikroTik VLAN · lo schema di rete del laboratorio (VM, router, switch, trunk, ether1-4 del PDF mikTikVlansvm.drawio.pdf) non si può mostrare: le figure supportano solo lo schema pin di una scheda elettronica; serve un modello di disegno per schemi di rete · (manca)

---
- 2026-10-20 · Scheda (ricetta): il pulsante «Copia» di una fase unisce le righe con `r.codice.trim()` (`Scheda.tsx`, `testoFase`), quindi il codice copiato perde il rientro (in Python cambia il significato). Serve non fare il `trim()` a sinistra, solo a destra. Inoltre un blocco su più righe dentro una sola riga si vede con le righe successive spostate a destra (il rientro è calcolato una volta sola sulla prima riga): per ora ogni riga di codice è una riga della scheda.

## Fatte

- 2026-10-20 · test e percorsi sistemati: `situazioni.test.ts` ora usa `Telecomunicazioni/MikroTik/...` (43 schede, 10 rami); `sessione_studio.md` aggiornata. (era: MikroTik…)
- 2026-10-14 · controllato: le righe di codice su più righe si vedono bene (rientro e a capo mantenuti, un numero di riga per blocco, commento sull'ultima riga); anche «Prima e dopo» con più righe. Trovato e corretto: i commenti erano sempre introdotti da «#» (ora `prefissoCommento` in `indice.yaml`, per C/C++ `//`), e gli esempi nella casella di ricerca erano quelli del MikroTik (ora `esempiRicerca`). Entrambi i campi sono facoltativi.
