# ESP32 e sensori: hardware

Fonti: `fonti/introduzione_esp32_iot_tpsit.pdf`, `fonti/esp32_gpio_timer_slide.pptx`

---

## ESP32-WROOM-32

I **GPIO** sono i «piedini» dell'ESP32. Nelle immagini del pinout, la numerazione in grigio è quella dei piedini della **scheda** che contiene l'ESP32 e altro.

La scheda del corso ha **30 pin** (board: *DOIT ESP32 DevKit V1*).

### Periferiche

- 18 canali ADC (Analog-to-Digital Converter)
- 10 GPIO a sensibilità capacitiva (touch)
- 3 interfacce UART
- 3 interfacce SPI
- **2 interfacce I2C**
- 16 canali PWM in uscita
- 2 DAC (Digital-to-Analog Converter)
- 2 interfacce I2S

Altre periferiche: sensori Hall, interfaccia SD card, Ethernet.

### CPU

- **Due core**, controllabili separatamente.
- Clock regolabile da **80 a 240 MHz**.
- Si può spegnere la CPU e usare il **coprocessore a basso consumo** per controllare di continuo le periferiche (variazioni o soglie superate).

---

## GPIO: ingressi e uscite digitali

Un pin può essere:

- **ingresso** digitale (leggere un pulsante)
- **uscita** digitale (comandare un LED)
- **richiesta di interrupt**

Modi di ingresso: `INPUT`, `INPUT_PULLUP`, `INPUT_PULLDOWN`.

Esempio dal corso: GPIO22 ingresso con pull-up, GPIO23 uscita.

Pratica in `pratica/esp32_ambiente_e_gpio.md`.

---

## Interrupt

Un pin configurato come richiesta di interrupt chiama una **funzione di servizio (ISR)** quando cambia il livello logico.

Modi in cui può scattare: `LOW`, `HIGH`, `CHANGE`, `FALLING`, `RISING`.

La **ISR**:

- non ha parametri e non restituisce nulla
- deve essere **brevissima**, perché blocca il programma normale
- ha l'attributo `IRAM_ATTR`: il codice sta nella **RAM interna** invece che nella Flash (molto più lenta)

### Pin touch

Alcuni GPIO sentono il tocco. Si associa un interrupt con una **soglia**:

- libero → valore **> 100**
- toccato → valore **< 60 circa**

---

## Timer

L'ESP32 ha **4 timer a 64 bit** con **prescaler a 16 bit**.

Schema: il clock della CPU (80 MHz) passa dal **prescaler** (divide per il valore), poi entra nel contatore a 64 bit. Un **comparatore** confronta il contatore con il **valore di soglia**: quando sono uguali scatta l'interrupt e il contatore riparte da zero.

Si cambia l'intervallo cambiando il valore di soglia.

### Calcolo

Con prescaler 80:

- f_timer = f_clock / prescaler = 80·10⁶ / 80 = **1 MHz**
- T_timer = 1 / f_timer = **1 µs**
- T_irq = T_timer · contatore = 10⁻⁶ · 1 000 000 = **1 s**

---

## I2C sull'ESP32

Pin di default (libreria Wire, Arduino IDE):

- **GPIO 21 = SDA**
- **GPIO 22 = SCL**

Teoria del protocollo in `i2c_teoria.md`.

---

## Sensori

Tutti usano I2C.

### BME280 e BMP280

- Alimentazione 1,8–5 V
- Pressione barometrica con precisione assoluta ±1 hPa; si può usare come **altimetro** (±1 m)
- Temperatura da −40 a +85 °C
- Pressione 300–1100 hPa
- Interfaccia: I2C (fino a 3,4 MHz) oppure SPI (fino a 10 MHz)
- BME280: temperatura ±1,0 °C e **umidità** 0–100 %
- BMP280: temperatura con risoluzione ±0,01 °C, **niente umidità**

hPa = unità di pressione, 100 N/m². **1 hPa = 1 millibar.**

**Indirizzo I2C del BMP280**

- pin 6 (SDO) **non collegato** → `0x76`
- pin 6 (SDO) a Vcc (3,3 V) → `0x77`

**Tre modalità di funzionamento**

- **SLEEP**: nessuna misura
- **NORMAL**: il sensore alterna da solo misura e pausa (tempo di standby `t_standby`)
- **FORCED**: una sola misura su richiesta, poi torna in sleep. Per la misura dopo bisogna selezionare di nuovo forced.

**Lettura dati:** dopo una conversione conviene fare una **burst read** (lettura di blocco), non registro per registro. Così non si mescolano byte di misure diverse e c'è meno traffico sul bus.

### AHT20

- Temperatura −40…85 °C (±0,3 °C)
- Umidità relativa 0–100 % (±2 %)
- Alimentazione 3,3–5 V
- **Indirizzo I2C: `0x38`**
- Rileva l'umidità misurando la resistenza elettrica fra due elettrodi (la conduttività sale con l'umidità)

**Sequenza di funzionamento**

1. Attendere 40 ms dopo l'accensione. Leggere la parola di stato (si invia `0x71`): se il **bit 3** non è 1, mandare `0xBE` con parametri `0x08` e `0x00`, poi attendere 10 ms.
2. Mandare `0xAC` (avvia la misura).
3. Attendere 80 ms. Se il **bit 7** dello stato è 0 la misura è finita: si leggono **6 byte** di fila. Altrimenti si continua ad aspettare.

**Limiti**

- Con umidità > 80 % per 60 ore può avere errore +3 % RH; torna normale in condizioni normali. L'uso prolungato in condizioni estreme lo deteriora.
- L'accuratezza dell'umidità dipende dalla temperatura di lavoro.
- Misure troppo frequenti **riscaldano il sensore** e falsano la misura. Per tenere il riscaldamento sotto 0,1 °C il tempo di attività deve stare sotto il **10 %**: si consiglia **una misura ogni 2 secondi**.

Codice in `pratica/esp32_sensori_codice.md`.
