# Docker (Sistemi e Reti)

**Tipo di argomento:** tecnico / pratico (virtualizzazione, container e Docker: immagini, Dockerfile, porte, volumi, reti, Compose).

---

## Cosa c'è

- `Fonti/` → materiale del corso (originali, mai modificati):
  - `container_mini_tutorial.md` → teoria: container, VM, immagini, Dockerfile, volumi, reti, comandi
  - `virtualizzazione_e_container.pdf` → slide: virtualizzazione e hypervisor, container, Docker, multi-container e Compose
  - `lab_immagini_dockerfile.pdf` → laboratorio: archivio note in Python, Dockerfile, cache dei layer, porte, volumi, save/load
  - `lab_networking_container.pdf` → laboratorio: bridge di default, rete custom, container su due reti
  - `lab_volumi_servizi.pdf` → laboratorio: nginx, pubblicazione con `-p`, bind mount, named volume, LAN, Compose

- `Docker per situazioni/` → la documentazione «Per situazioni» (si apre nell'app): 9 rami, 65 schede. Dai concetti (Capire i container) all'uso pratico (container, immagini, Dockerfile, porte, volumi, reti, Compose), in fondo il ramo trasversale «Quando non funziona»

---

## Regole specifiche

- Le fonti stanno solo in `Fonti/`: le schede le citano nel campo `fonte` (con la parte del laboratorio), non le copiano.
- I comandi vengono sempre dalle fonti. Se aggiungo qualcosa che nelle fonti non c'è, lo segno come «Nota».
- Correzioni alle fonti: il mini tutorial dice che ENTRYPOINT non si può sovrascrivere; in realtà si può con `docker run --entrypoint` (segnato come nota nella scheda `cmd-entrypoint`).
- Nuove situazioni: una scheda per volta, nel ramo giusto di `indice.yaml`; un argomento nuovo = un nuovo ramo, inserito prima di «Quando non funziona». Un gruppo ha sempre almeno 2 schede.
- Le cartelle `Appunti/`, `Pratica/` e `Schemi/` si creano solo quando c'è materiale da metterci.
