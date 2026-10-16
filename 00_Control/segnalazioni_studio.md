# SEGNALAZIONI DALLO STUDIO

Righe scritte dalla sessione di studio per la sessione di sviluppo. Formato in `sessione_studio.md`, §5.

Quando una segnalazione è stata gestita, la sposto sotto «Fatte» (non la cancello).

---

## Da fare

- 2026-10-16 · MikroTik · la documentazione è ora in `Telecomunicazioni/MikroTik/MikroTik per situazioni` (prima `Informatica/Reti/MikroTik/...`): `02_App/tests/situazioni.test.ts` usa ancora il vecchio percorso (righe 10, 16, 37) e fallirà; anche l'esempio di percorso in `00_Control/sessione_studio.md` §3 è da aggiornare · (bug)
- 2026-10-16 · MikroTik VLAN · lo schema di rete del laboratorio (VM, router, switch, trunk, ether1-4 del PDF mikTikVlansvm.drawio.pdf) non si può mostrare: le figure supportano solo lo schema pin di una scheda elettronica; serve un modello di disegno per schemi di rete · (manca)

---

## Fatte

- 2026-10-14 · controllato: le righe di codice su più righe si vedono bene (rientro e a capo mantenuti, un numero di riga per blocco, commento sull'ultima riga); anche «Prima e dopo» con più righe. Trovato e corretto: i commenti erano sempre introdotti da «#» (ora `prefissoCommento` in `indice.yaml`, per C/C++ `//`), e gli esempi nella casella di ricerca erano quelli del MikroTik (ora `esempiRicerca`). Entrambi i campi sono facoltativi.
