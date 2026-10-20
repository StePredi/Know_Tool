# Python (Sistemi e Reti)

**Tipo di argomento:** tecnico / pratico (programmazione di rete in Python: socket, socketserver, thread, MQTT, seriale).

---

## Cosa c'è

- `Fonti/` → codice ed esercizi del corso (originali, mai modificati):
  - socket: `client_simple.py`, `server_simple_socket.py`, `server_medium_socket.py`
  - framing: `framesocket.py`, `frameserver.py`, `frameclient.py`
  - `socketserver.ipynb` → il modulo `socketserver` (teoria, esempi, 5 esercizi)
  - asyncio: `asyncio_intro_2627.ipynb`, `asyncio_guide_2627.ipynb`, `01_echo_server.py`, `02_echo_client.py`, `04_chat_server.py`, `05_chat_client.py`, `06_server_dati.py`, `07_client_letture.py` (manca il file 03 nella numerazione)
  - `gateway.py`, `controller.py`, `monitor.py` → codice con MQTT (paho), thread, code, seriale, logging

- Documenti «Per situazioni» (si aprono nell'app), uno per area tematica:
  - `Socket per situazioni/` → socket TCP/UDP, più client, framing, `socketserver`, errori (6 rami, 23 schede)
  - `Thread, code e log per situazioni/` → thread, `queue`, coordinamento, logging (6 rami, 21 schede; con Lock/RLock ed Event)
  - `MQTT per situazioni/` → client paho, ricevere, pubblicare, topic e messaggi (6 rami, 17 schede)
  - `Seriale per situazioni/` → pyserial: aprire, leggere, scrivere, decodificare (4 rami, 8 schede)
  - `Basi di Python per situazioni/` → valori e testo, if/for/while, funzioni, moduli, liste/tuple/set/dizionari, classi, errori (7 rami, 37 schede)
  - `Asyncio per situazioni/` → coroutine, await, task, gather, timeout, errori, quando usarlo (6 rami, 18 schede)
  - `Server e client asyncio per situazioni/` → start_server, open_connection, letture del reader, chat con più client (6 rami, 20 schede)
  - `File per situazioni/` → open/with, lettura, scrittura, JSON, pathlib, errori (6 rami, 23 schede)

---

## Regole specifiche

- **Niente progetti**: la documentazione è fatta di **moduli singoli** (un tema = un documento). I file «progetto» servono solo come fonte di esempi per i singoli temi.
- Basi, File e le aggiunte ai thread (Lock, Event) hanno come fonte la **documentazione ufficiale Python** (tutorial e libreria standard): ogni scheda indica la sezione nel campo `fonte`.
- Le fonti stanno solo in `Fonti/`: le schede le citano nel campo `fonte`, non le copiano.
- Il codice viene sempre dalle fonti. Gli errori che ci sono nelle fonti (per esempio in `framesocket.py` e `server_medium_socket.py`) non si correggono nel file: nella scheda si mostra la versione giusta segnata come «nota».
- Le cartelle `Appunti/`, `Pratica/` e `Schemi/` si creano solo quando c'è materiale da metterci.
