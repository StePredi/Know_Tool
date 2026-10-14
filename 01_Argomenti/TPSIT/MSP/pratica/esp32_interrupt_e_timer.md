# ESP32: interrupt e timer (pratica)

Fonte: `fonti/esp32_gpio_timer_slide.pptx`  
Link citati nelle slide:

- https://lastminuteengineers.com/handling-esp32-gpio-interrupts-tutorial/
- https://techtutorialsx.com/2017/10/07/esp32-arduino-timer-interrupts/
- https://circuitdigest.com/microcontroller-projects/esp32-interrupt
- https://espressif-docs.readthedocs-hosted.com/projects/arduino-esp32/en/latest/api/timer.html (tutte le funzioni dei timer)

Teoria: `appunti/esp32_hardware_e_sensori.md`

---

## Interrupt su un pin GPIO

```cpp
attachInterrupt(GPIOPin, ISR, Mode);
```

- `GPIOPin` → numero del pin
- `ISR` → funzione chiamata a ogni interrupt
- `Mode` → quando scatta: `LOW`, `HIGH`, `CHANGE`, `FALLING`, `RISING`

### ISR

```cpp
void IRAM_ATTR ISR() {
    Statements;
}
```

- nessun parametro, nessun valore di ritorno
- il più **breve** possibile
- con `IRAM_ATTR` (codice in RAM interna)

### Staccare l'interrupt

```cpp
detachInterrupt(GPIOPin);
```

### Pin touch

```cpp
touchAttachInterrupt(GPIOPin, ISR, Threshold);
```

Soglia: libero > 100, toccato < 60 circa.

### Esempio completo

Il pulsante (GPIO 0) inverte il LED (GPIO 25) a ogni pressione:

```cpp
#include <Arduino.h>

#define LED 25
#define BUTTON 0

void IRAM_ATTR isr() {
  digitalWrite(LED, !digitalRead(LED));
}

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  attachInterrupt(BUTTON, isr, FALLING);
}

void loop() {

}
```

---

## Timer

### 1. Dichiarare il timer

```cpp
hw_timer_t * timer = NULL;
```

### 2. Inizializzarlo

```cpp
timer = timerBegin(0, 80, true);
```

- `0` → numero del timer (0, 1, 2 o 3)
- `80` → prescaler
- `true` → il contatore **incrementa** (false = decrementa)

### 3. Collegare la ISR

```cpp
timerAttachInterrupt(timer, &onTimer, true);
```

- `timer` → la variabile globale
- `&onTimer` → indirizzo della ISR
- `true` → interrupt generato dal **fronte** (edge); false = dal livello

### 4. Impostare il valore di allarme

```cpp
timerAlarmWrite(timer, 1000000, true);
```

- `1000000` → valore del contatore a cui scatta l'interrupt
- `true` → ricarica automatica dopo l'interrupt

Con prescaler 80: f_timer = 80·10⁶ / 80 = 1 MHz → T_timer = 1 µs → T_irq = 10⁻⁶ · 1 000 000 = **1 s**.

### 5. Abilitarlo

```cpp
timerAlarmEnable(timer);
```

### Esempio completo

Il LED (GPIO 25) cambia stato ogni secondo:

```cpp
#include <Arduino.h>

#define LED 25
hw_timer_t *timer0 = NULL;

void IRAM_ATTR onTimer() {
  digitalWrite(LED, !digitalRead(LED));
}

void setup() {
  pinMode(LED, OUTPUT);
  timer0 = timerBegin(0, 80, true);
  timerAttachInterrupt(timer0, &onTimer, true);
  timerAlarmWrite(timer0, 1000000, true);
  timerAlarmEnable(timer0);
}

void loop() {

}
```

> **Nota (non dalle slide):** queste funzioni sono quelle del core Arduino-ESP32 versione 2.x. Nella versione 3.x l'API dei timer è cambiata: se `timerBegin` non compila, controlla la versione del core.
