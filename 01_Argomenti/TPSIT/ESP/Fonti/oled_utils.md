# oled_utils.h — Documentazione (v2)

Libreria di funzioni per gestire **testo, layout ed elementi grafici** su display OLED **SSD1306** (128×64 o 128×32) con ESP32, basata su Adafruit SSD1306 + Adafruit GFX.

**Novità v2**
- Il testo va **a capo da solo** (a parole) e **non esce mai dallo schermo**
- Il testo invertito ha un **bordo** attorno (padding regolabile)
- Nuovi **elementi grafici**: cornice, barre, batteria, segnale, icone, indicatore a lancetta, grafico, menu, popup

---

## Indice

1. [Installazione (PlatformIO)](#1-installazione-platformio)
2. [Avvio rapido](#2-avvio-rapido)
3. [Concetti base](#3-concetti-base)
4. [Riferimento funzioni](#4-riferimento-funzioni)
   - [4.1 Base](#41-base) · [4.2 Testo](#42-testo) · [4.3 Layout](#43-layout) · [4.4 Cursore di riga](#44-cursore-di-riga) · [4.5 Misure](#45-misure)
   - [4.6 Grafica](#46-elementi-grafici) · [4.7 Icone](#47-icone) · [4.8 Menu e popup](#48-menu-e-popup)
5. [Esempi](#5-esempi)
6. [Creare un'icona](#6-creare-unicona)
7. [Note e problemi comuni](#7-note-e-problemi-comuni)

---

## 1. Installazione (PlatformIO)

```
mio_progetto/
├── platformio.ini
├── oled_utils.md         ← questa documentazione
├── include/
│   └── oled_utils.h
└── src/
    └── main.cpp
```

**platformio.ini**

```ini
[env:esp32dev]
platform      = espressif32
board         = esp32dev
framework     = arduino
monitor_speed = 115200

lib_deps =
    adafruit/Adafruit SSD1306
    adafruit/Adafruit GFX Library
```

**main.cpp**

```cpp
#include <Arduino.h>      // obbligatorio in PlatformIO
#include <Wire.h>
#include "oled_utils.h"
```

---

## 2. Avvio rapido

```cpp
#include <Arduino.h>
#include <Wire.h>
#include "oled_utils.h"

#define PIN_SDA 21
#define PIN_SCL 22

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Wire.begin(PIN_SDA, PIN_SCL);
  if (!oled_init(display)) {
    while (true) delay(10);
  }
}

void loop() {
  oled_pulisci();
  oled_titolo("STAZIONE METEO");
  oled_riga_icona(ICONA_TERMOMETRO, "21.3 \xF8" "C");
  oled_valore("Umidita'", "54 %");
  oled_barra(54);
  oled_aggiorna();
  delay(1000);
}
```

---

## 3. Concetti base

### 3.1 Dimensione dei caratteri

Font di default: 5×7 px + 1 px di spazio → ogni carattere occupa **6 × 8 px × size**.

| size | Carattere | Caratteri per riga (128 px) | Righe (64 px) |
|---|---|---|---|
| 1 | 6 × 8   | 21 | 8 |
| 2 | 12 × 16 | 10 | 4 |
| 3 | 18 × 24 | 7  | 2 |
| 4 | 24 × 32 | 5  | 2 |

### 3.2 A capo automatico

Tutte le funzioni di testo (tranne `oled_valore`, `oled_titolo`, `oled_menu` che sono a riga singola) **vanno a capo da sole**:

- spezzano sugli **spazi**, tenendo intere le parole
- una parola più lunga di una riga viene **spezzata a metà**
- `"\n"` nel testo forza un a capo
- le righe che **non entrano in verticale non vengono disegnate** (la funzione lo segnala)

Il testo a riga singola che non entra viene **accorciato**.

### 3.3 Testo invertito e padding

Il testo invertito (`inv = true`) viene disegnato in nero dentro un riquadro bianco con angoli arrotondati. Il **padding** è lo spazio tra il testo e il bordo del riquadro (default 2 px), impostabile in `oled_init` o con `oled_imposta_pad()`.

Con testo su più righe il riquadro è **uno solo**, largo quanto la riga più lunga.

### 3.4 Il cursore di riga

La libreria tiene una **y interna**. Le funzioni di layout (`oled_riga`, `oled_valore`, `oled_titolo`, `oled_riga_icona`, `oled_separatore`, `oled_barra`, `oled_menu`) scrivono a quella y e poi **scendono da sole** dello spazio occupato + interlinea.

Le funzioni a **posizione libera** (`oled_testo`, `oled_testo_allineato`, tutta la grafica `_xy`, icone, indicatore, grafico, cornice, popup) **non** spostano il cursore.

### 3.5 Coordinate

`(x, y)` indica sempre l'**angolo in alto a sinistra** dell'elemento, bordo compreso.

### 3.6 Buffer

Tutto viene disegnato nel buffer in RAM. Lo schermo cambia solo con `oled_aggiorna()`:

```
oled_pulisci()   →   disegni   →   oled_aggiorna()
```

Una sola `oled_aggiorna()` per schermata = niente sfarfallio.

---

## 4. Riferimento funzioni

Parametri tra **[ ]** = opzionali; il valore dopo `=` è il default.
I parametri opzionali vanno **in ordine**: per passare l'ultimo scrivi anche quelli prima.

```cpp
enum Allinea { SX, CENTRO, DX };
```

### 4.1 Base

#### `bool oled_init(d, [indirizzo], [interlinea], [margine], [pad])`

Inizializza il display. Va nel `setup()` **al posto di** `display.begin()`.

| Parametro | Default | Descrizione |
|---|---|---|
| `d` | — | l'oggetto `Adafruit_SSD1306` |
| `indirizzo` | `0x3C` | indirizzo I²C (alcuni moduli `0x3D`) |
| `interlinea` | `2` | px extra tra gli elementi |
| `margine` | `0` | px vuoti a sinistra e destra |
| `pad` | `2` | bordo attorno al testo invertito |

**Ritorna** `false` se il display non risponde.

| Funzione | Descrizione |
|---|---|
| `oled_pulisci()` | svuota il buffer, cursore a y = 0 |
| `oled_aggiorna()` | invia il buffer al display |
| `oled_imposta_interlinea(px)` | cambia l'interlinea |
| `oled_imposta_margine(px)` | cambia il margine |
| `oled_imposta_pad(px)` | cambia il bordo del testo invertito |

---

### 4.2 Testo

#### `bool oled_riga(testo, [size], [allinea], [inv])`

Testo con a capo automatico alla y del cursore; poi il cursore scende.

| Parametro | Default | Descrizione |
|---|---|---|
| `testo` | — | `String` o `"..."` |
| `size` | `1` | dimensione 1–4 |
| `allinea` | `SX` | `SX` / `CENTRO` / `DX` |
| `inv` | `false` | `true` = nero su riquadro bianco |

**Ritorna** `false` se qualche riga non è entrata.

```cpp
oled_riga("Testo lungo che va a capo da solo");
oled_riga("ATTENZIONE", 2, CENTRO, true);
```

#### `int16_t oled_testo(x, y, testo, [size], [inv], [larghezza])`

Testo in posizione libera. Va a capo al bordo destro dello schermo, oppure entro `larghezza` px se indicata. **Non** sposta il cursore.

| Parametro | Default | Descrizione |
|---|---|---|
| `x`, `y` | — | angolo in alto a sinistra |
| `size` | `1` | |
| `inv` | `false` | |
| `larghezza` | fino al bordo | larghezza massima del blocco |

**Ritorna** l'altezza occupata in px (utile per mettere qualcosa sotto).

#### `int16_t oled_testo_allineato(y, testo, [size], [allinea], [inv])`

Come `oled_riga` ma alla y indicata e **senza** spostare il cursore. Ritorna l'altezza occupata.

#### `bool oled_valore(etichetta, valore, [size])`

Etichetta a sinistra, valore a destra, una riga sola. Se manca spazio, l'etichetta viene accorciata. Ritorna `false` se la riga non entra in verticale.

#### `void oled_titolo(testo, [size])`

Fascia bianca a tutta larghezza con il testo centrato in nero. Puoi disegnarci sopra icone nere (`oled_batteria(..., true)`).

#### `bool oled_riga_icona(icona, testo, [size])`

Icona 8×8 a sinistra + testo sulla stessa riga.

```cpp
oled_riga_icona(ICONA_GOCCIA, "54 %");
```

---

### 4.3 Layout

| Funzione | Default | Descrizione |
|---|---|---|
| `oled_separatore([spazio])` | `2` | linea orizzontale, `spazio` px sopra e sotto |
| `oled_separatore_tratteggiato([spazio], [passo])` | `2`, `3` | linea a puntini, un punto ogni `passo` px |
| `oled_barra(perc, [altezza])` | `altezza = 7` | barra 0–100 % a tutta larghezza |

---

### 4.4 Cursore di riga

| Funzione | Descrizione |
|---|---|
| `int16_t oled_y()` | y della prossima riga |
| `oled_vai_a(y)` | sposta il cursore a una y precisa |
| `oled_spazio(px)` | aggiunge spazio (negativo = risale) |
| `int16_t oled_spazio_rimasto()` | px liberi sotto il cursore |

---

### 4.5 Misure

| Funzione | Ritorna |
|---|---|
| `oled_larghezza(testo, [size])` | larghezza visibile in px su una riga |
| `oled_altezza([size])` | altezza di una riga: `8 × size` |
| `oled_max_caratteri([size])` | caratteri che stanno in una riga |
| `oled_misura(testo, [size], [inv], [larghezza])` | altezza che occuperebbe il testo con l'a capo, **senza disegnarlo** |

```cpp
// centra verticalmente un paragrafo
int16_t h = oled_misura(msg, 1);
oled_vai_a((64 - h) / 2);
oled_riga(msg, 1, CENTRO);
```

---

### 4.6 Elementi grafici

Tutti a posizione libera, non spostano il cursore.

#### `int16_t oled_cornice(x, y, w, h, [titolo], [raggio])`

Riquadro con angoli arrotondati. Se c'è `titolo`, compare come linguetta invertita in alto a sinistra.

| Parametro | Default |
|---|---|
| `titolo` | `""` (nessuna linguetta) |
| `raggio` | `3` |

**Ritorna** la y da cui scrivere il contenuto, sotto la linguetta.

```cpp
int16_t y = oled_cornice(0, 0, 128, 64, "Rete");
oled_testo(5, y, "SSID: Casa");
```

#### `oled_barra_xy(x, y, w, h, perc)`

Barra orizzontale con bordo, 0–100 %.

#### `oled_barra_v(x, y, w, h, perc)`

Barra verticale, si riempie dal basso.

#### `oled_batteria(x, y, perc, [inv])`

Icona batteria 14 × 7 px. `inv = true` la disegna nera (per metterla dentro `oled_titolo`).

#### `oled_segnale(x, y, livello, [inv])`

Tacche di segnale 11 × 8 px, `livello` 0–4.

#### `oled_indicatore(cx, cy, r, perc)`

Semicerchio con lancetta e tacche a 0 / 25 / 50 / 75 / 100 %.

| Parametro | Descrizione |
|---|---|
| `cx`, `cy` | centro della **base** del semicerchio |
| `r` | raggio |
| `perc` | 0–100 |

Occupa da `cx - r` a `cx + r` in orizzontale e da `cy - r` a `cy + 2` in verticale.

#### `oled_grafico(x, y, w, h, valori, n, [vmin], [vmax])`

Grafico a linea dentro un riquadro.

| Parametro | Default | Descrizione |
|---|---|---|
| `valori` | — | array `float` |
| `n` | — | quanti valori |
| `vmin`, `vmax` | `0`, `0` | scala; se uguali si calcola da sola |

#### `oled_storico_aggiungi(storico, n, valore)`

Fa scorrere l'array a sinistra e mette `valore` in fondo. Usalo per lo storico del grafico.

```cpp
float storico[30];
oled_storico_aggiungi(storico, 30, temperatura);
oled_grafico(0, 0, 128, 40, storico, 30);
```

---

### 4.7 Icone

#### `oled_icona(x, y, icona, [inv])`

Disegna un'icona 8 × 8. Con `inv = true` la disegna nera su un quadrato bianco 10 × 10.

| Nome | Descrizione |
|---|---|
| `ICONA_TERMOMETRO` | temperatura |
| `ICONA_GOCCIA` | umidità |
| `ICONA_PRESSIONE` | manometro |
| `ICONA_OK` | spunta |
| `ICONA_ERRORE` | X |
| `ICONA_ATTENZIONE` | triangolo con ! |

---

### 4.8 Menu e popup

#### `oled_menu(voci, n, sel, [size])`

Lista di voci dalla y del cursore in giù. La voce `sel` è invertita. Se le voci non entrano, la lista scorre e compare una barra di scorrimento a destra.

| Parametro | Descrizione |
|---|---|
| `voci` | array `const char*` |
| `n` | numero di voci |
| `sel` | indice della voce selezionata (da 0) |
| `size` | default `1` |

```cpp
const char *voci[] = {"Misure", "Grafico", "Wi-Fi", "Info"};
oled_titolo("MENU");
oled_menu(voci, 4, selezionata);
```

#### `oled_popup(testo, [titolo])`

Finestra centrata **sopra** a quello che è già disegnato: pulisce solo la sua area. Il testo va a capo da solo ed è centrato. Il `titolo` (opzionale) è una fascia invertita.

```cpp
// prima disegni la schermata normale, poi:
oled_popup("Sensore non risponde.", "ERRORE");
oled_aggiorna();
```

---

## 5. Esempi

### Dashboard con icone di stato nel titolo

```cpp
oled_pulisci();
oled_titolo("STAZIONE METEO");
oled_segnale(2, 1, 3, true);
oled_batteria(112, 2, 70, true);
oled_riga_icona(ICONA_TERMOMETRO, String(t, 1) + " \xF8" "C");
oled_riga_icona(ICONA_GOCCIA, String(u, 0) + " %");
oled_valore("Pressione", String(p, 0) + " hPa");
oled_barra(u);
oled_aggiorna();
```

### Indicatore + grafico

```cpp
oled_pulisci();
oled_indicatore(32, 40, 28, umidita);
oled_testo(0, 46, String(umidita, 0) + "%");
oled_grafico(66, 4, 62, 40, storico, 30);
oled_testo(66, 50, "Temp");
oled_aggiorna();
```

### Valore grande centrato

```cpp
oled_pulisci();
oled_riga("Temperatura", 1, CENTRO);
oled_spazio(4);
oled_riga(String(t, 1), 3, CENTRO);
oled_aggiorna();
```

### Messaggio che non deve uscire

```cpp
if (!oled_riga(messaggio_lungo)) {
  // non è entrato tutto: riduci la size o usa una pagina in più
}
```

---

## 6. Creare un'icona

Un'icona 8 × 8 è un array di 8 byte, uno per riga. Ogni bit è un pixel; il bit più a sinistra (`0x80`) è il pixel a sinistra.

```
riga   pixel        binario      hex
 0     ...XX...     00011000     0x18
 1     ..XXXX..     00111100     0x3C
 2     .XXXXXX.     01111110     0x7E
 3     XXXXXXXX     11111111     0xFF
 4     ..XXXX..     00111100     0x3C
 5     ..XXXX..     00111100     0x3C
 6     ..XXXX..     00111100     0x3C
 7     ........     00000000     0x00
```

```cpp
static const uint8_t ICONA_FRECCIA[8] PROGMEM = {0x18,0x3C,0x7E,0xFF,0x3C,0x3C,0x3C,0x00};
oled_icona(0, 0, ICONA_FRECCIA);
```

---

## 7. Note e problemi comuni

| Problema | Causa / Soluzione |
|---|---|
| Schermo nero | Prova `0x3D` in `oled_init`. Controlla SDA/SCL e alimentazione 3.3 V. |
| `oled_init` ritorna `false` | Il display non risponde su I²C: cablaggio o indirizzo. Usa uno scanner I²C. |
| Sfarfallio | Più `oled_aggiorna()` per schermata: chiamala solo alla fine. |
| Manca il fondo del testo | Non c'era spazio in verticale: `oled_riga` ritorna `false`. Riduci size o interlinea. |
| Simbolo ° sbagliato | Scrivi `" \xF8" "C"` con le stringhe **separate**: `"\xF8C"` verrebbe letto come l'esadecimale `F8C`. |
| Lettere accentate strane | Il font non ha à è ì ò ù in UTF-8: usa `e'` oppure i codici CP437 (`"\x8A"` = è, `"\x85"` = à). |
| Errore con `SDA` / `SCL` | Il core ESP32 li definisce già: usa `PIN_SDA`, `PIN_SCL`. |
| Non usare `display.begin()` | Lo fa già `oled_init`. |
| Testo normale sopra la grafica | Lo sfondo del testo è trasparente: pulisci l'area prima (`display.fillRect(..., SSD1306_BLACK)`) se devi riscrivere un valore senza `oled_pulisci()`. |
