# Sensori AHT20 e BMP280 (pratica)

Fonte: `fonti/introduzione_esp32_iot_tpsit.pdf`

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
