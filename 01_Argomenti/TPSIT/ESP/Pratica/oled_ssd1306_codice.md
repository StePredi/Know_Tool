# Display OLED SSD1306 (pratica)

Fonte: `fonti/display_oled_ssd1306_slide.pptx`

Teoria (caratteristiche del display): `appunti/esp32_hardware_e_sensori.md`

Documentazione della libreria: https://adafruit.github.io/Adafruit_SSD1306/html/class_adafruit___s_s_d1306.html

---

## Installazione della libreria

In PlatformIO:

1. voce **Libraries** del menu
2. digita `adafruit` nella casella di ricerca
3. scorri i risultati fino a **Adafruit SSD 1306**
4. selezionala e **aggiungila al progetto** in cui vuoi usare il display

---

## Configurazione di base

### Include

```cpp
#include <Adafruit_SSD1306.h>
#include <Wire.h>              // gestisce I2C
```

### Define

I pin I2C della nostra scheda non sono standard per questa libreria, quindi vanno definiti. Bisogna anche dire che il display ha **128 colonne** e **64 righe**.

```cpp
#define OLED_SDA 21   // pin SDA
#define OLED_SCL 22   // pin SCL
#define OLED_RST -1   // RESET OLED
#define ROW 64        // numero righe
#define COL 128       // numero colonne
```

### Istanza

Per usare il display si dichiara un'istanza della classe `Adafruit_SSD1306` indicandone le caratteristiche:

```cpp
Adafruit_SSD1306 display = Adafruit_SSD1306(COL, ROW, &Wire, OLED_RST);
```

### Inizializzazione (nel `setup()`)

```cpp
Wire.begin(OLED_SDA, OLED_SCL);                 // impostazioni I2C
display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
```

- `Wire.begin(SDA, SCL)` imposta i pin I2C.
- `display.begin(...)` riceve la **sorgente di alimentazione** del display (`SSD1306_SWITCHCAPVCC`) e il suo **indirizzo I2C** (`0x3C`).

---

## Funzioni di base

| Istruzione | Cosa fa |
|---|---|
| `display.clearDisplay();` | cancella il display |
| `display.setTextColor(SSD1306_WHITE);` | colore del testo: bianco su nero |
| `display.setTextSize(1);` | dimensione del testo: intero positivo, più è grande più il testo cresce |
| `display.setCursor(0, 0);` | posizione iniziale del testo (x, y) |
| `display.print(const char *);` | stampa il testo |
| `display.println(const string &s);` | stampa il testo e va a capo |
| `display.display();` | **trasferisce il buffer sul display** |

Le coordinate `0,0` sono l'**angolo in alto a sinistra**: x cresce verso destra, y verso il basso.

---

## Attenzione: il buffer

Testo ed elementi grafici vengono scritti in un **buffer di memoria** e diventano visibili solo dopo:

```cpp
display.display();
```

Se manca, sul display non compare niente.

---

## Esempio completo (slide 11)

Trascritto dall'immagine della slide: due righe di testo con due dimensioni diverse.

```cpp
#include <Arduino.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

#define OLED_SDA 21
#define OLED_SCL 22
#define OLED_RST -1
#define ROW 64
#define COL 128

Adafruit_SSD1306 display = Adafruit_SSD1306(COL, ROW, &Wire, OLED_RST);

void setup() {
  Wire.begin(OLED_SDA, OLED_SCL);
  while (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
  {
    printf("display initialization failed");
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Piccolo");
  display.setTextSize(2);
  display.println("Grande");
  display.display();
}

void loop() {
  // put your main code here, to run repeatedly:
}
```

Cosa si vede: «Piccolo» in dimensione 1, poi, andando a capo, «Grande» in dimensione 2.

> **Nota** (non nella slide): nell'esempio il colore è scritto `WHITE`, nel testo della slide 7 è `SSD1306_WHITE`. Nella libreria `WHITE` è un alias di `SSD1306_WHITE`.

> **Nota** (non nella slide): `display.begin(...)` restituisce `false` se il display non risponde. Nell'esempio il `while` ripete il tentativo e stampa il messaggio finché non riesce. Se il messaggio compare di continuo, controlla indirizzo (`0x3C`) e collegamento SDA/SCL.
