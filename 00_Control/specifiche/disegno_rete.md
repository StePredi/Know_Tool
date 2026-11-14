# SPECIFICA · Disegno «rete» (schemi di rete nelle schede «figura»)

Stato: approvata da Ste il 2026-11-14 («ok» dopo il mockup `03_Demo/per_situazioni/mockup_rete_e_modifica_spiegazioni.html`). Da implementare.

## 1. Problema e utente
Lo schema di rete del laboratorio (router, switch, VM, trunk, porte ether) non si può mostrare: le figure supportano solo `scheda_pin`. Segnalazione MikroTik del 2026-10-16.

## 2. Materiale usato (e cosa manca)
- `Telecomunicazioni/MikroTik/Fonti/mikTikVlansRoutingPaov.3.drawio.pdf` (InterVlanRouting: internet, R1, S1, 3 dispositivi, VLAN 10/20/30).
- `schema_vlan_vm.drawio.pdf` (secondo caso, con VM e hAP ac lite): **da provare a mano** prima del codice (vedi §5).

## 3. Unità di conoscenza
Una `figura` con `disegno.modello: rete`: nodi disposti in righe (dall'alto in basso) e cavi fra due nodi, con le porte e la VLAN.

## 4. Modello dei file
```yaml
disegno:
  modello: rete
  vlan:                      # facoltativo
    - { id: 10, nome: ufficio, colore: blu, rete: 172.18.n.0/24 }
  nodi:                      # una riga = una lista, dall'alto in basso
    - [ { id: net, nome: internet, tipo: nuvola } ]
    - [ { id: r1, nome: R1 (CHR), tipo: router, sotto: dhcp-server } ]
  cavi:
    - { da: net, a: r1, porta_a: ether1 }
    - { da: r1, a: s1, porta_da: ether2, porta_a: ether1, trunk: [10, 20, 30] }
    - { da: s1, a: p10, porta_da: ether2, access: 10 }
  nota: ''
```
- `tipo` nodo: `nuvola | router | switch | pc | vm` (default `pc`).
- Cavo: senza `trunk`/`access` = grigio; `access` = una VLAN, senza tag; `trunk` = elenco VLAN, una striscia per VLAN.
- `colore`: gli stessi `COLORI_RAMO` già usati; se manca, uno per VLAN in ordine.
- `ip_da` / `ip_a` (facoltativi, testo): l'indirizzo scritto vicino a ciascun capo del cavo (per esempio `".254"`, `".10+N"`; fra virgolette, perché `.254` da solo è un numero).
- `rete` di una VLAN è solo testo: può contenere N, non si calcola.
- I cavi collegano nodi di righe vicine (controllo nello schema).
- Posizioni decise dal codice dalle righe (nessuna coordinata nel file).

## 5. Prove fatte (2026-11-14)
`specifiche/prove/rete/`: (1) InterVlanRouting entra così com'è; (2) `schema_vlan_vm` (VM, l1Switch, mkRouter, hAP) entra con due aggiunte: indirizzo per capo del cavo (`ip_da`/`ip_a`) e formule con N nella `rete`. Il PDF disegna due studenti: se ne disegna uno solo, l'altro è la stessa scheda con N diverso.

## 6. Come si verifica
Schema zod con avvisi leggibili; test: ogni `da/a` esiste, id nodi unici, VLAN citate esistono, nessun nodo senza cavo (avviso). Un test di resa dell'SVG per il caso (a).

## 7. Cosa NON fa
Spostamento dei nodi con il mouse; onde Wi-Fi; più cavi fra gli stessi due nodi; diagrammi a più di ~12 nodi; modifica a moduli del disegno (si scrive nel file; modulo = scheda «Modifica come testo»).

## 8. Da decidere con Ste
- Etichette dei cavi (es. «tagged frames») oltre alle porte: sì/no.
- Mostrare l'indirizzamento sotto il nodo (`sotto`) o in una tabella a parte.
