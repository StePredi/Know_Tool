# IoT: introduzione

Fonte: `fonti/introduzione_esp32_iot_tpsit.pdf`

---

## Cos'è l'IoT

**IoT** = *Internet of Things*, «internet delle cose».

Il termine è stato usato per la prima volta da **Kevin Ashton** (MIT, dove è stato trovato lo standard per RFID e altri sensori).

È un insieme di tecnologie che collegano a Internet qualunque tipo di apparato per:

- monitorare
- controllare
- trasferire informazioni
- svolgere azioni conseguenti

La fase **pre-IoT** è la sensoristica «semplice» (raccolta dati sempre più precisa).

Il passaggio dalla sensoristica all'IoT è la **connessione in rete**.

---

## Le fasi dell'IoT

1. Dispositivi in rete che rilevano dati e li comunicano.
2. Rilevano **più tipi** di dati e li trasferiscono.
3. Fanno un primo livello di **elaborazione locale** (selezione) e trasferiscono solo i dati che servono.
4. Raccolgono, selezionano e **agiscono** in base alle indicazioni ricevute.
5. Rilevano, selezionano, trasmettono solo il necessario, agiscono su indicazioni **e** hanno capacità di elaborazione locale.

---

## Parole collegate

- **IPv6**: successore di IPv4, semplifica configurazione e gestione delle reti IP.
- **Cloud computing**: i dati stanno su un cloud virtuale, raggiungibili senza una macchina fisica.
- **Big Data**: la grande quantità di dati prodotta dagli oggetti connessi. Solleva dubbi su privacy e dati sensibili.

**IoT, Analytics e Big Data**

- IoT → sistema hardware per acquisire e inviare i dati
- Analytics → software per conservare (database) ed elaborare i dati
- Big Data → grande quantità di dati; conta soprattutto **come si usano** per ricavare informazioni

---

## IoE: Internet of Everything

Interconnessione e coordinamento autonomo di sensori, entità, **persone, processi e dati** attraverso Internet.

Tre categorie insieme: **People, Data, Things**.

Una persona può non solo ricevere feedback dai dispositivi, ma anche **delegare compiti** all'AI.

---

## Sicurezza nell'IoT

Ogni dispositivo IoT che entra in rete è un **nuovo punto di attacco possibile**. Va protetto prima di collegarlo alla rete.

I sette punti irrinunciabili:

1. **Autenticazione** dei device (ogni nuovo device autenticato e autorizzato)
2. **Cifratura** dei dati condivisi
3. **Archiviazione** protetta come i sistemi di produzione
4. **Aggiornamento** di tutte le componenti software
5. **Analisi dei possibili attacchi** e protezioni su misura
6. **Rischio di sabotaggi**: device sempre monitorati
7. **Suddivisione in aree** della rete: una falla non danneggia tutto, si riduce la superficie d'attacco

---

## IoT e 5G

Il 5G «chiude il cerchio» per l'IoT: molti più device collegati, con latenza e affidabilità migliori.

**Network slicing**: più reti logiche virtualmente indipendenti sulla stessa infrastruttura fisica (stessi principi di SDN e NFV). Una sola rete fisica viene «affettata» in più reti virtuali, ciascuna per un tipo di servizio.

Per collegare gli oggetti al 5G: progetti come le **SIM virtuali** di Arm.

---

## IoT e Wi-Fi 7

- Standard **802.11be**, bande 2,4 / 5 / 6 GHz.
- Gestisce più dispositivi senza perdere prestazioni: meno latenza.
- Usa la modulazione **4K QAM**: più dati nello stesso canale.

---

## Il nostro percorso nel corso

Sistemi **embedded** = hardware + software.

- **HW**: microcontrollore ESP32, scheda LoRa, display OLED SSD1306, sensori BMP280 e AHT20, connessione wireless (Wi-Fi, LoRaWAN)
- **SW**: firmware che «gira» sul microcontrollore, sistema operativo **FreeRTOS**

Continua in `esp32_hardware_e_sensori.md`.
