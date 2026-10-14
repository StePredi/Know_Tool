# I2C con la libreria Wire (pratica)

Fonti: `fonti/i2c_protocollo_crivellaro.pdf` (§5), `fonti/i2c_protocollo_bartolo.pdf`

Teoria: `appunti/i2c_teoria.md`

> Gli esempi delle fonti sono per **Arduino UNO** (SDA = A4, SCL = A5). Sull'ESP32 i pin di default sono **GPIO 21 (SDA)** e **22 (SCL)**.

---

## Collegamento di due schede

- SDA con SDA
- SCL con SCL
- GND con GND
- **una pull-up** (es. 2,2 kΩ) da SDA a VDD e **una** da SCL a VDD

Basta alimentare una scheda: i collegamenti alimentano anche l'altra.

---

## Funzioni della libreria Wire

`#include <Wire.h>` (M = master, S = slave)

| Funzione | Chi | Cosa fa |
|---|---|---|
| `begin()` | M | inizializza come **master** (nel `setup()`) |
| `begin(address)` | S | inizializza come **slave** con quell'indirizzo |
| `requestFrom(address, quantity)` | M | chiede `quantity` byte allo slave; termina con STOP |
| `requestFrom(address, quantity, stop)` | M | `stop` TRUE → STOP; FALSE → **restart** (Sr) |
| `available()` | M, S | numero di byte nella coda in arrivo |
| `read()` | M, S | legge un byte dalla coda |
| `beginTransmission(address)` | M | inizia la trasmissione verso quello slave |
| `write(value)` / `write(string)` / `write(data, length)` | M, S | mette byte in coda (master) o li invia (slave) |
| `endTransmission()` | M | invia i byte in coda e uno STOP |
| `endTransmission(stop)` | M | TRUE → STOP; FALSE → restart |
| `onRequest(handler)` | S | funzione chiamata quando il master chiede dati |
| `onReceive(handler)` | S | funzione chiamata quando il master invia dati |

`available()` e `read()` lavorano su una coda **FIFO**: `available()` dice quanti byte ci sono, `read()` prende il primo arrivato.

### Valore restituito da `endTransmission()`

- `0` → successo
- `1` → dati troppo lunghi per il buffer
- `2` → **NACK** sull'indirizzo
- `3` → **NACK** sui dati
- `4` → altro errore

---

## I2C scanner

Per i sensori bisogna conoscere l'**indirizzo**. Si carica un programma «I2C Scanner» (link nelle fonti: pagina Arduino). Aprendo il monitor seriale compare ogni dispositivo trovato, con l'indirizzo in **esadecimale**.

Si possono cambiare cavi e dispositivi mentre lo scanner gira.

---

## Master reader (il master chiede, lo slave risponde)

Master (indirizzo slave = 5):

```cpp
#include <Wire.h>

int slaveAddress = 5;

void setup() {
  Wire.begin();
  Serial.begin(9600);
}

void loop() {
  Wire.requestFrom(slaveAddress, 2);   // chiede 2 byte

  while (Wire.available()) {           // lo slave potrebbe inviare meno
    char c = Wire.read();
    Serial.print(c);
  }

  delay(100);
}
```

Slave:

```cpp
#include <Wire.h>

int slaveAddress = 5;

void setup() {
  Wire.begin(slaveAddress);
  Wire.onRequest(requestEvent);
}

void loop() {
  delay(100);
}

void requestEvent() {
  Wire.write("Hi");   // 2 byte, come richiesto dal master
}
```

Il master non dice allo slave quanti byte vuole: nell'esempio il numero è scritto nel codice dello slave. In un caso reale andrebbe comunicato con una trasmissione apposita.

Versione Bartolo (stesso schema): slave a indirizzo 3, `Wire.write("ciao")`, master `Wire.requestFrom(3, 4)`.

---

## Master writer (il master invia, lo slave riceve)

Master (indirizzo slave = 4):

```cpp
#include <Wire.h>

int slaveAddress = 4;

void setup() {
  Wire.begin();
}

void loop() {
  Wire.beginTransmission(slaveAddress);
  Wire.write("x=");
  Wire.write(17);
  Wire.endTransmission();

  delay(500);
}
```

Slave:

```cpp
#include <Wire.h>

int slaveAddress = 4;

void setup() {
  Wire.begin(slaveAddress);
  Wire.onReceive(receiveEvent);
  Serial.begin(9600);
}

void loop() {
  delay(100);
}

void receiveEvent(int howMany) {
  while (Wire.available() > 1) {   // tutti i byte tranne l'ultimo
    char c = Wire.read();
    Serial.print(c);
  }
  int x = Wire.read();             // l'ultimo byte
  Serial.println(x);
}
```

Schema tipico:

```cpp
Wire.beginTransmission(indirizzo);
Wire.write(...);
Wire.endTransmission();
```

---

## Esercizi (dal PDF di Crivellaro)

1. Interpretare sequenze I2C, indicando il significato dei gruppi di bit e chi li ha inviati:
   - a) `S 001101010110011001 P`
   - b) `S 010001100011000110 P`
   - c) `S 100001011 P`
   - d) `S 001010001 P`
   - e) `S 010000110011101110110011001 P`
   - f) `S 000111100100100100011101010 P`
2. Master che invia `S 0001010 R` e, se lo slave risponde con ACK, legge 5 byte.
3. Slave che risponde al master dell'esercizio 2 con 5 numeri casuali tra 0 e 255.
4. Due schede: il master chiede un numero; lo slave risponde con un casuale tra 0 e 127; il master calcola il doppio e lo rinvia; lo slave lo mostra sul monitor seriale.
5. Due schede: il master chiede un numero; lo slave risponde con un byte casuale; il master invia la stringa «pari» o «dispari»; lo slave la mostra sul monitor seriale.
6. Master con pulsante e LED, slave (indirizzo 20) con un interruttore. A ogni pressione del pulsante il master chiede lo stato dell'interruttore e accende o spegne il LED.
7. Un master e due slave (indirizzi 72 e 73), ciascuno con un trimmer. Il master, collegato al PC, riceve `a` → chiede un byte allo slave 72 e lo stampa; `b` → stessa cosa con 73; altro carattere → «Carattere non valido». Il byte dello slave dipende dalla tensione del trimmer (255 = 5 V, 0 = 0 V).
8. Master e slave con **8 registri** (un array di 8 elementi). Il master invia l'indirizzo del registro (0–7); lo slave risponde con il byte contenuto.

Le risposte non sono nelle fonti: da svolgere.
