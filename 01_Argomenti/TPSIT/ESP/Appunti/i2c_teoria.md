# Il protocollo I2C: teoria

Fonti: `fonti/i2c_protocollo_crivellaro.pdf` (la più completa), `fonti/i2c_trasmissione_tpsit.pdf`, `fonti/i2c_protocollo_bartolo.pdf`

La parte pratica (codice Wire) è in `pratica/i2c_wire_codice.md`.

---

## Che cos'è un protocollo

Un insieme di **regole** che permette la comunicazione tra dispositivi (come le regole di una conversazione: stessa lingua, non parlare insieme, chiedere di ripetere).

Un protocollo semplice, per capire:

- una **sequenza di start** segna l'inizio del pacchetto
- un numero dice **quanti dati** seguono
- il pacchetto (frame) ha **payload** (dati utili) e **metadata** (informazioni di contorno, non accessorie)

Esempi noti: USB, HTTP, TCP/IP, Ethernet.

---

## I2C in breve

- **I2C** = *Inter-Integrated Circuit*, detto anche **TWI** (*2-wire interface*). Creato da **Philips** nel 1982.
- Un **bus**: canale di comunicazione usabile da più di due attori.
- Pensato per far parlare circuiti integrati sullo **stesso circuito stampato**: **breve distanza**.
- **Sincrono**: c'è un clock comune.
- **Half duplex**: non si trasmette in entrambe le direzioni contemporaneamente.

### Le linee

- **SDA** (*Serial DAta*): i dati, in entrambe le direzioni. Non sono TX e RX.
- **SCL** (*Serial CLock*): il clock, generato dal master (come un metronomo).
- **GND**: la massa, comune a tutti.

A riposo le linee sono **alte (1)**; un dispositivo le abbassa (0) per iniziare uno scambio.

### Vantaggi

1. Fino a **128 dispositivi** sulla stessa coppia di fili (schema master-slave).
2. Lascia **libera la seriale** (utile su Arduino UNO, che ne ha una sola, condivisa con l'USB).
3. È più veloce della seriale classica.

---

## Master e slave

Il **master** è il dispositivo che controlla il bus **in un certo istante**: genera il clock e i segnali di **START** e **STOP**.

Gli **slave** «ascoltano» il bus: ricevono dal master o inviano quando il master lo chiede.

Solo il master può **iniziare** la comunicazione. Per distinguere gli slave usa l'**indirizzo**.

**Quattro modi di operare**

- master trasmette: controlla il clock, invia dati agli slave
- master riceve: controlla il clock, riceve dati dallo slave
- slave trasmette: non controlla il clock, invia dati al master
- slave riceve: non controlla il clock, riceve dati dal master

**Multi-master:** più dispositivi possono comandare il bus in tempi diversi. Serve sincronizzare i clock e fare **arbitraggio** del bus. Non è trattato nelle fonti: si studia solo il **master singolo**, il più usato (memorie, ADC, DAC, RTC, display).

---

## Caratteristiche fisiche

- Le due linee sono **bidirezionali**.
- Le uscite sono **open-collector / open-drain** (non tri-state) e le linee sono tenute alte da un **resistore di pull-up** per linea.
- Se un dispositivo forza il livello basso, **tutti** vedono il basso: per il livello alto tutti devono smettere di «tirare giù». Questo è un **wired-AND**.

**Pull-up**

- Valori intorno a **2 kΩ** (negli esempi 2,2 kΩ) vanno bene nella maggior parte dei casi.
- Troppo bassi → correnti troppo alte (specie a 5 V).
- Troppo alti → con bus ad alta capacità il segnale sale troppo lentamente.
- Resistori in serie (es. 300 Ω) proteggono dagli **spike**.

**Capacità del bus:** i due fili sono come le armature di un condensatore. Un gradino di tensione diventa «smussato» (transitorio esponenziale). Più aumentano Rp e Cp, più si limita la **frequenza massima del clock**. Cp cresce con la lunghezza dei fili: **connessioni più corte possibile**.

**Pull-up interne di Arduino:** la libreria le attiva, ma valgono oltre 20 kΩ e possono impedire alte velocità.

**Tensioni:** VDD tipicamente 3,3 o 5 V. Se tutti i dispositivi tollerano la tensione, collegamento diretto; altrimenti servono **adattatori di livello**: due MOSFET a canale N (con VDD1 ≤ VDD2) oppure moduli già pronti 5–3,3 V.

---

## Clock

| Modalità | Frequenza | Dal |
|---|---|---|
| Standard | 0–100 kHz | origine |
| Fast-mode | fino a 400 kHz | 1992 |
| High speed | fino a 3,4 MHz | 1998 |

**Clock stretching:** uno slave lento può forzare **SCL basso** per fermare il master. Il master deve aspettare finché lo slave rilascia SCL.

---

## Indirizzi

- Indirizzo a **7 bit** (il più comune) + un ottavo bit **R/W**.
- 2⁷ = **128** indirizzi, ma **16 sono riservati**: ne restano **112**.
- Esiste anche l'indirizzamento a 10 bit.
- Alcuni dispositivi hanno uno o due bit **variabili** (pin di configurazione): così si collegano più dispositivi uguali con indirizzi diversi.
- L'indirizzo di fabbrica si cambia di solito con una sequenza descritta nel datasheet.

---

## Sequenza di trasferimento

1. **START** (S) dal master
2. **Indirizzo** dello slave (ADDR) dal master
3. Bit **R/W**: **R = 1**, **W = 0**
4. **ACK**
5. Byte di **DATA**
6. **ACK**
7. **STOP** (P) dal master

I passi 5 e 6 si ripetono per più byte.

### START e STOP

Regola fondamentale: **SDA può cambiare solo mentre SCL è basso**. Il valore si legge sul fronte di SCL.

Se SDA cambia **mentre SCL è alto**, non è un dato:

- **START**: SDA scende con SCL alto. Prima dello start entrambe le linee sono alte.
- **STOP**: SDA sale con SCL alto.

### Inviare e ricevere un bit

- **Master invia:** imposta SDA mentre SCL è basso, alza SCL, poi lo riabbassa.
- **Master riceve:** rilascia SDA; con SCL basso lo slave mette il suo valore su SDA; il master alza SCL, **legge** SDA, abbassa SCL.

### ACK e NACK

Chi riceve un byte risponde con un bit:

- **ACK** = SDA tenuta **bassa** (ricevuto bene)
- **NACK** = SDA **alta**

Se il master non riceve ACK può terminare con uno STOP o ricominciare con un nuovo START.

### Master → slave (scrittura)

`S ADDR W A DATA A … P`

Caso semplice: scrivere 1 byte in un registro = **3 byte**: (1) indirizzo + R/W, (2) numero del registro (*subaddress*), (3) valore. Dopo ogni byte lo slave manda ACK; senza ACK il master sospende.

### Slave → master (lettura)

Come sopra con **R**. Dopo ogni byte è il **master** a mandare l'ACK. Quando non vuole altri dati manda **NACK**: lo slave libera il bus e il master può mandare lo STOP.

### Repeated START (Sr)

Invece di `S ADDR DATA A P` per ogni operazione:

`S ADDR (R/W) DATA A Sr ADDR (R/W) DATA A P`

Si può ripetere all'infinito. Evita di liberare il bus tra due operazioni.

### Nessuno risponde

Se lo slave non c'è, nessuno manda ACK (= NACK): `S ADDR R NACK P`.

---

## Esempio analizzato (Crivellaro, fig. 11)

Master chiede 2 byte allo slave di indirizzo 5; risponde «Hi».

`S` · `0000101` (= 5) · `R` · `ACK` (slave) · `01001000` (= 72, ASCII **H**) · `ACK` (master) · `01101001` (= 105, ASCII **i**) · `NACK` (master) · `P`

Il master non dice quanti byte aspetta: lo slave deve già saperlo.

---

## Correzioni sulle fonti

Le fonti hanno qualche imprecisione. Qui le segno per non impararle sbagliate.

- **STOP:** nel PDF «Trasmissione I2C» si scrive «fronte di salita di SDA con SCL=0». La regola giusta (Crivellaro) è: SDA sale mentre **SCL è alto**.
- **`Wire.endTransmission(indirizzo)`:** nel PDF Bartolo ha un argomento «indirizzo». Nella libreria è `endTransmission()` oppure `endTransmission(stop)`, dove `stop` è TRUE/FALSE (vedi Crivellaro).
- **Bartolo, analisi `Wire.begin(3)`:** il commento «richiedi 4 byte all'indirizzo 3» è sbagliato: significa «inizializza come slave con indirizzo 3».
- **Bartolo, `onRequest`:** «appena ricevi una richiesta da parte dello slave» va letto «da parte del **master**».
- **Bartolo, 128 dispositivi:** il numero reale utilizzabile è 112 (16 indirizzi riservati).

---

## Appendici (Crivellaro)

- **A – Struttura interna:** ogni dispositivo ha un transistor open-collector che può solo portare la linea a 0; il livello alto lo fa la pull-up.
- **B – Capacità del bus:** con Rp = 10 kΩ e Cp = 300 pF a 100 kHz il segnale sale lentamente; con Rp = 2 kΩ il transitorio è più breve.
- **C – Adattatore di livello a 2 MOSFET:** tre casi. (1) Nessuno abbassa la linea: i due lati restano alti, ognuno alla sua tensione. (2) Un dispositivo a bassa tensione abbassa la linea: il MOS conduce, anche il lato alto va a zero. (3) Un dispositivo ad alta tensione abbassa la linea: il diodo del MOS porta il source a circa 0,7 V, VGS ≈ 2,6 V, il MOS conduce. Il livello logico passa quindi in **entrambi i versi**.

**Wired-AND:** con tre dispositivi la linea è 1 solo se **tutti** e tre sono a 1.
