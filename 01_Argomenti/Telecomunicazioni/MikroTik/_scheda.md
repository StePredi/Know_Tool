# MikroTik

**Tipo di argomento:** tecnico / pratico (Telecomunicazioni, configurazione dei router MikroTik nel laboratorio di reti).

---

## Cosa c'è

- `Fonti/` → documenti e schemi del corso (originali, mai modificati):
  - `vlan_filtering.docx` → teoria del VLAN filtering nel bridge
  - `configurazione_switch_routervm.docx` → traccia passo passo della configurazione
  - `spiegazione_esperienza_vm.docx` → descrizione dell'esperienza con due VLAN
  - `schema_vlan_vm.drawio.pdf` → schema di rete e consegne
  - `configurazione_intervlanRouting.docx` → traccia dello scenario switch S1 + router di frontiera R1 (interfacce VLAN sul trunk, DHCP, NAT)
  - `mikTikVlansRoutingPaov.3.drawio.pdf` → schema InterVlanRouting con piano di indirizzamento e note sul laboratorio con due CHR
- `MikroTik per situazioni/` → la documentazione «Per situazioni» (si apre nell'app): 10 rami, 51 schede: prima i rami per costruire la rete (dalle Basi alle VLAN), in fondo i due rami trasversali «Salvare e ripristinare» e «Quando non funziona»

---

## Regole specifiche

- Le fonti stanno solo in `Fonti/`: le schede le citano nel campo `fonte`, non le copiano.
- Le cartelle `Appunti/`, `Pratica/` e `Schemi/` si creano solo quando c'è materiale da metterci (stessa struttura di MSP).
- I comandi vengono sempre dalle fonti. Se aggiungo qualcosa che nelle fonti non c'è, lo segno come «nota».
- Nuove situazioni: una scheda per volta, nel ramo giusto di `indice.yaml`; un argomento nuovo = un nuovo ramo, inserito prima dei due rami trasversali. Un gruppo ha sempre almeno 2 schede.
