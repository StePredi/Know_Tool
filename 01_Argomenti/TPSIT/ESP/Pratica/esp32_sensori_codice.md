# Sensori AHT20 e BMP280 (pratica)

Fonti: `fonti/introduzione_esp32_iot_tpsit.pdf`, `fonti/esercizi_i2c_oled_bmp_aht20.pdf`

Teoria (caratteristiche, indirizzi, modalità): `appunti/esp32_hardware_e_sensori.md`

---

## Librerie

Servono due librerie (da PlatformIO):

- **Adafruit AHTX0**
- **Adafruit BMP280**

---

## AHT20 (temperatura e umidità)

```cpp
// dichiarazione
Adafruit_AHTX0 aht;

// setup
aht.begin();

// loop
sensors_event_t humidity, temp;     // AHT20
aht.getEvent(&humidity, &temp);     // lettura dati aggiornati
Serial.print(temp.temperature);
Serial.print(humidity.relative_humidity);
```

- `sensors_event_t humidity, temp;` dichiara i tipi per la lettura di temperatura e umidità
- `aht.getEvent(&humidity, &temp);` legge temperatura e umidità
- `temp.temperature` → valore della temperatura letta
- `humidity.relative_humidity` → valore dell'umidità letta

Indirizzo I2C: `0x38`. Una misura ogni **2 secondi** al massimo.

---

## BMP280 (temperatura, pressione, altitudine)

```cpp
// dichiarazione
Adafruit_BMP280 bmp;

// setup
bmp.begin();

// loop
Serial.print(bmp.readTemperature());
Serial.print(bmp.readPressure());
Serial.print(bmp.readAltitude(1013.25));   // da regolare con la pressione locale
```

Indirizzo I2C: `0x76` (SDO libero) o `0x77` (SDO a 3,3 V).

---

## Pin I2C dell'ESP32

- **GPIO 21 = SDA**
- **GPIO 22 = SCL**

Per trovare l'indirizzo di un sensore: programma **I2C scanner** (vedi `i2c_wire_codice.md`).

---

## Lettura a basso livello del BMP280

Al posto di `Adafruit BMP280` si possono leggere i registri direttamente con `Wire.h`: passi e funzioni in `i2c_wire_codice.md`, sezione «Leggere i registri di un sensore».
