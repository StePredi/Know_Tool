# ESP32: pin, touch e I/O integrati

Fonti: `fonti/introduzione_esp32_iot_tpsit.pdf` (pagine 12–16), `fonti/esp32_gpio_timer_slide.pptx` (slide 6)

Schemi originali in `schemi/`:

- `esp32_pinout_devkit_v1.png` → lo schema dei pin
- `esp32_specifiche_devkit_v1.png` → tabella delle specifiche
- `esp32_schema_a_blocchi.png` → cosa c'è dentro il chip
- `esp32_led_integrati.png` → i LED sulla scheda

Versione **cliccabile** dello schema dei pin: `schemi/esp32_pinout_interattivo.html` (si apre nel browser).

> **Come leggere queste note.** Quello che viene dalle fonti non ha segni. Quello che ho aggiunto io, perché serve a usare i pin ma nelle fonti non c'è, è segnato come **Nota**.

---

## La scheda: DOIT ESP32 DevKit V1

| Caratteristica | Valore |
|---|---|
| Core | 2 (dual core) |
| Architettura | 32 bit |
| Clock | fino a 240 MHz |
| RAM | 512 KB |
| Wi-Fi | 2,4 GHz, fino a 150 Mbit/s |
| Bluetooth | BLE (Low Energy) e Bluetooth classico |
| Pin | 30 |
| Periferiche | touch capacitivo, ADC, DAC, I2C, UART, CAN 2.0, SPI, I2S, RMII, PWM… |

---

## Dentro il chip (schema a blocchi)

**Periferiche** (colonna di sinistra dello schema):

- SPI, I2C, I2S, SDIO, UART, CAN, ETH, IR, PWM
- **sensore di temperatura**
- **sensore touch**
- DAC, ADC

**Radio:** Bluetooth (link controller e baseband), Wi-Fi (MAC e baseband), parte RF (ricezione, trasmissione, generatore di clock).

**Core e memoria:** 2 microprocessori **Xtensa LX6 a 32 bit**, ROM, SRAM.

**Accelerazione crittografica in hardware:** SHA, RSA, AES, RNG (generatore di numeri casuali).

**RTC** (la parte che resta accesa a basso consumo): PMU (gestione alimentazione), **coprocessore ULP** (ultra low power), memoria di recupero.

Dalle slide: ci sono anche i sensori **Hall**, l'interfaccia per **SD card** e **Ethernet**.

---

## Lo schema dei pin

I 30 pin sono 15 per lato. Nello schema originale ogni pin ha delle etichette colorate:

| Colore | Significato |
|---|---|
| rosso | alimentazione (Power) |
| nero | massa (GND) |
| marrone | controllo (Control) |
| azzurro | nome «Arduino» (SCL, SDA, MOSI, MISO, SCK, CS…) |
| arancione | ADC (convertitore analogico-digitale) |
| giallo | DAC (convertitore digitale-analogico) |
| viola | GPIO |
| blu scuro | SPI |
| verde | UART |
| verde acqua | touch |
| azzurro chiaro | EN |
| **linea ondulata** | PWM |

I numeri nei riquadri grigi sono i numeri dei piedini del **modulo** (non dei GPIO).

Il numero GPIO è quello che si scrive nel codice: `pinMode(23, OUTPUT)` usa il **GPIO23**, che sulla scheda è serigrafato `D23`.

### Lato sinistro (dall'alto)

| Scritta sulla scheda | GPIO | Funzioni nello schema | Cosa significa |
|---|---|---|---|
| EN | — | EN | abilita il chip: portato a massa lo riavvia |
| VP | 36 | ADC1_0, SensVP | ingresso analogico |
| VN | 39 | ADC1_3, SensVN | ingresso analogico |
| D34 | 34 | ADC1_6 | ingresso analogico |
| D35 | 35 | ADC1_7 | ingresso analogico |
| D32 | 32 | Touch9, ADC1_4, XTAL32 | touch, analogico; collegato al quarzo a 32 kHz |
| D33 | 33 | Touch8, ADC1_5, XTAL32 | touch, analogico; collegato al quarzo a 32 kHz |
| D25 | 25 | **DAC1**, ADC2_8 | uscita analogica |
| D26 | 26 | **DAC2**, ADC2_9 | uscita analogica |
| D27 | 27 | Touch7, ADC2_7 | touch, analogico |
| D14 | 14 | Touch6, HSPI_CLK, ADC2_6 | touch, clock dell'SPI «H» |
| D12 | 12 | Touch5, HSPI_Q, ADC2_5 | touch, dati in uscita SPI «H» |
| D13 | 13 | Touch4, HSPI_ID, ADC2_4 | touch, dati in ingresso SPI «H» |
| GND | — | GND | massa |
| VIN | — | VIN | alimentazione in ingresso |

### Lato destro (dall'alto)

| Scritta sulla scheda | GPIO | Funzioni nello schema | Cosa significa |
|---|---|---|---|
| D23 | 23 | MOSI, V_SPI_D | SPI «V»: dati verso lo slave |
| D22 | 22 | **SCL**, V_SPI_WP, U0_RTS | **clock I2C** |
| TX0 | 1 | CLK3, U0_TXD | trasmissione della seriale 0 (USB) |
| RX0 | 3 | CLK2, U0_RXD | ricezione della seriale 0 (USB) |
| D21 | 21 | **SDA**, V_SPI_HD | **dati I2C** |
| D19 | 19 | MISO, V_SPI_Q, U0_CTS | SPI «V»: dati dallo slave |
| D18 | 18 | SCK, V_SPI_CLK | SPI «V»: clock |
| D5 | 5 | V_SPI_CS0 | SPI «V»: selezione dello slave |
| TX2 | 17 | U2_TXD | trasmissione della seriale 2 |
| RX2 | 16 | U2_RXD | ricezione della seriale 2 |
| D4 | 4 | ADC2_0, HSPI_HD, Touch0 | touch, analogico |
| D2 | 2 | CS, ADC2_2, HSPI_WP, Touch2 | touch, analogico; **LED integrato** |
| D15 | 15 | ADC2_3, HSPI_CS0, Touch3 | touch, selezione SPI «H» |
| GND | — | GND | massa |
| 3.3V | — | 3.3V | uscita a 3,3 V |

### Le famiglie di funzioni

**GPIO digitali:** ingressi/uscite generici (`pinMode`, `digitalRead`, `digitalWrite`). Vedi `appunti/esp32_hardware_e_sensori.md`.

**ADC (analogico → digitale):** 18 canali. Sono divisi in due gruppi: **ADC1** (GPIO 36, 39, 34, 35, 32, 33) e **ADC2** (GPIO 4, 2, 15, 13, 12, 14, 27, 25, 26).

**DAC (digitale → analogico):** 2 canali, **DAC1 = GPIO25**, **DAC2 = GPIO26**.

**PWM:** 16 canali di uscita; nello schema sono segnati con la linea ondulata.

**I2C:** `SDA = GPIO21`, `SCL = GPIO22` (default della libreria Wire).

**UART:** tre seriali. Le due che escono sulla scheda sono **UART0** (`TX0 = GPIO1`, `RX0 = GPIO3`) e **UART2** (`TX2 = GPIO17`, `RX2 = GPIO16`).

**SPI:** due gruppi di pin.

| Segnale | «V» (VSPI) | «H» (HSPI) |
|---|---|---|
| clock | GPIO18 | GPIO14 |
| dati in uscita (MOSI) | GPIO23 | GPIO13 |
| dati in ingresso (MISO) | GPIO19 | GPIO12 |
| selezione (CS) | GPIO5 | GPIO15 |

Dallo schema: `HSPI_ID` è sul GPIO13 e `HSPI_Q` sul GPIO12; **Nota:** ID è il MOSI e Q il MISO.

### Nota: cose da sapere prima di scegliere un pin

Non sono nelle slide, ma sono le trappole più comuni con questa scheda.

- **GPIO34, 35, 36, 39 sono solo ingressi.** Non si possono usare come uscite, e non hanno le resistenze di pull-up e pull-down interne (`INPUT_PULLUP` non funziona).
- **I pin «di avvio» (strapping):** GPIO0, 2, 5, 12 e 15. Il livello che hanno **mentre la scheda si accende** influisce sull'avvio. Meglio non collegarci circuiti che li tengono forzati alti o bassi all'accensione. Il GPIO12 è il più delicato: se è alto all'avvio può impedire l'avvio.
- **GPIO1 e GPIO3** sono la seriale usata da USB e monitor seriale: usarli per altro disturba `Serial`.
- **ADC2 e Wi-Fi:** quando il Wi-Fi è acceso i pin dell'ADC2 non si possono leggere con `analogRead`. Con il Wi-Fi conviene usare l'ADC1.
- **Pin 6–11** sono collegati alla memoria flash del modulo e sulla scheda non sono disponibili.

---

## Touch (sensori capacitivi)

Dalle fonti: **10 GPIO** sono sensibili al tocco, e a ciascuno si può associare un interrupt.

Con i nove che compaiono nello schema:

| Canale | GPIO |
|---|---|
| Touch0 | 4 |
| Touch2 | 2 |
| Touch3 | 15 |
| Touch4 | 13 |
| Touch5 | 12 |
| Touch6 | 14 |
| Touch7 | 27 |
| Touch8 | 33 |
| Touch9 | 32 |

**Nota:** il decimo canale, **Touch1**, è il **GPIO0**, cioè il pulsante BOOT. Non è sui pin della scheda e nello schema non compare.

### Come si comporta

Il valore letto **scende** quando il dito si avvicina:

- pin **libero** → valore **> 100**
- pin **toccato** → valore **< 60 circa**

Va quindi scelta una **soglia** fra i due (per esempio 80). Il valore preciso dipende dalla scheda e dal cavo collegato: conviene misurarlo.

### Come si gestisce

Dalle slide, con un interrupt:

```cpp
touchAttachInterrupt(GPIOPin, ISR, Threshold);
```

- `GPIOPin` → il pin touch
- `ISR` → funzione chiamata a ogni interrupt
- `Threshold` → soglia: l'interrupt scatta quando il valore va sotto la soglia

Le regole della ISR sono le stesse dei GPIO (breve, `IRAM_ATTR`, nessun parametro): vedi `pratica/esp32_interrupt_e_timer.md`.

**Nota:** per **leggere** il valore e trovare la soglia si usa `touchRead(pin)` e si stampa sul monitor seriale. Nel core Arduino-ESP32 ci sono anche le costanti `T0`…`T9` al posto del numero GPIO.

---

## I/O già integrati sulla scheda

Sono i componenti che non bisogna collegare: ci sono già.

| Cosa | Dove | A cosa serve |
|---|---|---|
| **LED rosso** | **GPIO2** | si comanda come un'uscita digitale: ideale per la prova «blink» |
| **LED di alimentazione** | non programmabile | indica che la scheda è alimentata |
| **Pulsante BOOT** | **GPIO0** | si tiene premuto durante l'upload; si può anche leggere come pulsante (alto a riposo, basso se premuto) |
| **Pulsante EN** | pin EN | riavvia la scheda |
| **Quarzo a 32 kHz** | GPIO32 e GPIO33 | usano i pin segnati `XTAL32`: se serve il quarzo, quei pin non sono liberi |
| **Sensore di temperatura** | dentro il chip | non ha un pin |
| **Sensore Hall** | dentro il chip | non ha un pin |

Dalle slide: l'esempio completo dell'interrupt usa `BUTTON 0`, cioè proprio il pulsante BOOT, con `INPUT_PULLUP` e `FALLING`.

> **Nota:** nelle slide l'esempio con il LED usa il GPIO25 (un LED esterno). Il LED che sta già sulla scheda è sul **GPIO2**.

---

## Dove si fa pratica

Nel documento `MSP per situazioni`:

- ramo **Pin e I/O della scheda** → leggere lo schema, scegliere il pin, LED e pulsante integrati
- ramo **Touch** → quali pin, leggere, scegliere la soglia, interrupt
- ramo **Analogico e seriali** → ADC, DAC, PWM, UART, SPI
