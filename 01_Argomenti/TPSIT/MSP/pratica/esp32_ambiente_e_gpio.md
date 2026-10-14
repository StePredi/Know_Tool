# ESP32: ambiente di lavoro e GPIO (pratica)

Fonti: `fonti/introduzione_esp32_iot_tpsit.pdf`, `fonti/esp32_gpio_timer_slide.pptx`

Teoria collegata: `appunti/esp32_hardware_e_sensori.md`

---

## Ambiente: Visual Studio Code + PlatformIO

**PlatformIO** è un ecosistema open source per progetti IoT. Il cuore (PlatformIO Core, scritto in Python) integra:

- sistema di compilazione cross-platform
- gestore di librerie e dipendenze
- monitor seriale

Si usa come **estensione di Visual Studio Code**.

### Nuovo progetto

1. Apri Visual Studio Code.
2. Estensioni → cerca **PlatformIO** → installa.
3. **Home** di PlatformIO → *New Project*.
4. Scegli nome e destinazione.
5. Board: **DOIT ESP32 DevKit V1**.
6. Framework: **Arduino**.

### I pulsanti

- **BUILD** → compila, mostra errori e warning con il tipo
- **UPLOAD** → carica il programma sul device. Controlla che la **porta seriale** sia quella giusta e **tieni premuto il pulsante BOOT** durante la connessione.
- **MONITOR SERIALE** → mostra i `printf` e tutto ciò che arriva dal device
- **HOME** → torna alla finestra iniziale

### Prima prova

Far lampeggiare il LED della scheda: serve a verificare che tutto funzioni.

---

## Problemi

**La porta seriale non vede l'ESP** (Linux). Dal prompt:

```
sudo chmod 666 /dev/ttyUSB0
```

oppure:

```
systemctl stop brltty-udev.service
sudo systemctl mask brltty-udev.service
systemctl stop brltty.service
systemctl disable brltty.service
```

**Nel monitor seriale vedi simboli strani:** aggiungi in `platformio.ini`:

```
monitor_speed = 115200
```

**Codici d'errore:** per interpretarli c'è `esp_err.h` di ESP-IDF  
https://github.com/espressif/esp-idf/blob/a7e8d87d3/components/esp_common/include/esp_err.h

---

## GPIO: uscita digitale

```cpp
pinMode(pin, OUTPUT);
digitalWrite(pin, state);   // state: HIGH o LOW
```

## GPIO: ingresso digitale

```cpp
pinMode(pin, mode);   // INPUT, INPUT_PULLUP, INPUT_PULLDOWN
digitalRead(pin);
```

## Esempio del corso

GPIO22 ingresso con pull-up, GPIO23 uscita:

```cpp
pinMode(22, INPUT_PULLUP);
pinMode(23, OUTPUT);
digitalWrite(23, HIGH);
```

---

Interrupt e timer: `esp32_interrupt_e_timer.md`
