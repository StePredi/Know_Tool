# ESP32: touch, I/O integrati, analogico e seriali (pratica)

Teoria e schemi: `appunti/esp32_pin_touch_io.md`, `schemi/esp32_pinout_interattivo.html`

> **Cosa viene dalle slide e cosa no.**
> Quello che nelle fonti c'è davvero: `touchAttachInterrupt`, le soglie del touch (libero > 100, toccato < 60), il LED sul GPIO2, il pulsante BOOT sul GPIO0 con `INPUT_PULLUP`, i pin di I2C, UART e SPI.
> Le funzioni segnate con **(nota)** non sono nelle slide: sono quelle standard del core Arduino-ESP32 versione 2.x.

---

## LED integrato (GPIO2)

```cpp
#define LED 2

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(1000);
  digitalWrite(LED, LOW);
  delay(1000);
}
```

---

## Pulsante BOOT (GPIO0)

```cpp
pinMode(0, INPUT_PULLUP);

if (digitalRead(0) == LOW) {
  // premuto
}
```

Con un interrupt (come nelle slide):

```cpp
attachInterrupt(0, isr, FALLING);
```

---

## Touch

### Leggere il valore (nota)

```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println(touchRead(T0));   // T0 = GPIO4
  delay(200);
}
```

Libero → valore **> 100**. Toccato → valore **< 60 circa**.

### Interrupt (dalle slide)

```cpp
touchAttachInterrupt(GPIOPin, ISR, Threshold);
```

### Esempio completo (composto con la sintassi delle slide)

La ISR è brevissima: alza solo un flag. Si stampa nel `loop()`.

```cpp
volatile bool toccato = false;

void IRAM_ATTR gotTouch() {
  toccato = true;
}

void setup() {
  Serial.begin(115200);
  touchAttachInterrupt(T0, gotTouch, 80);
}

void loop() {
  if (toccato) {
    Serial.println("Toccato");
    toccato = false;
  }
}
```

---

## ADC: leggere una tensione (nota)

```cpp
int v = analogRead(34);   // 0 … 4095
```

- Ingresso massimo **3,3 V**.
- Pin ADC1 (36, 39, 34, 35, 32, 33): sempre ok.
- Pin ADC2 (4, 2, 15, 13, 12, 14, 27, 25, 26): non si leggono con il Wi-Fi acceso.

---

## DAC: produrre una tensione (nota)

```cpp
dacWrite(25, 128);   // 0 … 255, circa metà di 3,3 V
```

Solo GPIO25 (DAC1) e GPIO26 (DAC2).

---

## PWM (nota)

```cpp
ledcSetup(0, 5000, 8);   // canale 0, 5 kHz, 8 bit
ledcAttachPin(25, 0);    // il pin 25 usa il canale 0
ledcWrite(0, 128);       // duty 0 … 255
```

16 canali (0–15).

---

## Seconda seriale (nota)

```cpp
Serial2.begin(9600, SERIAL_8N1, 16, 17);   // RX2 = 16, TX2 = 17
Serial2.print("ciao");
```

RX va collegato al TX dell'altro dispositivo e TX all'RX.

---

## I2C con altri pin (nota)

```cpp
Wire.begin();          // default: SDA = 21, SCL = 22
Wire.begin(sda, scl);  // altri pin
```

---

## Pin SPI

| Segnale | «V» (VSPI) | «H» (HSPI) |
|---|---|---|
| clock | 18 | 14 |
| MOSI | 23 | 13 |
| MISO | 19 | 12 |
| CS | 5 | 15 |
