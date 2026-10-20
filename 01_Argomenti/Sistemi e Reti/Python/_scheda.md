# Python (Sistemi e Reti)

**Tipo di argomento:** tecnico / pratico (programmazione di rete in Python: socket, socketserver, thread, MQTT, seriale).

---

## Cosa c'è

- `Fonti/` → codice ed esercizi del corso (originali, mai modificati):
  - socket: `client_simple.py`, `server_simple_socket.py`, `server_medium_socket.py`
  - framing: `framesocket.py`, `frameserver.py`, `frameclient.py`
  - `socketserver.ipynb` → il modulo `socketserver` (teoria, esempi, 5 esercizi)
  - `gateway.py`, `controller.py`, `monitor.py` → codice con MQTT (paho), thread, code, seriale, logging

---

## Regole specifiche

- **Niente progetti**: la documentazione è fatta di **moduli singoli** (un tema = un documento). I file «progetto» servono solo come fonte di esempi per i singoli temi.
- Le fonti stanno solo in `Fonti/`: le schede le citano nel campo `fonte`, non le copiano.
- Il codice viene sempre dalle fonti. Gli errori che ci sono nelle fonti (per esempio in `framesocket.py` e `server_medium_socket.py`) non si correggono nel file: nella scheda si mostra la versione giusta segnata come «nota».
- Le cartelle `Appunti/`, `Pratica/` e `Schemi/` si creano solo quando c'è materiale da metterci.
