# Modello «Matematica» — specifica (bozza 1)

> **PROVVISORIA (2026-10-20).** Nata dalla schermata e senza materiale dell'utente; non rispetta `procedura_nuovi_documenti.md`. La progettazione riparte dal materiale vero; questo file resta come storico dei prototipi e non va seguito per nuovo codice.

Stato: **fase 1 e 2 fatte** (2026-10-20): motore, schermata e collegamento all'app sono scritti e testati in copia di prova; **non ancora provati in Electron/Windows**. Progettato e provato su prototipi interattivi in chat (non salvati) su due argomenti noti a Ste: **Scomposizione dei polinomi** e **Disequazioni e sistemi**. Elenco completo argomenti: `matematica_argomenti.md`.

## 1. Problema da risolvere
Ste non ricorda/riconosce la teoria e, davanti a un esercizio, non sa **cosa fare**; usa formulari sparsi. Il tool parte quindi **dall'esercizio** («cosa vedo → cosa faccio»), non dall'indice della teoria. Tre usi: capire la teoria, allenarsi sugli esercizi, ripassare prima delle verifiche.

## 2. Principi
1. Il **riconoscitore**: ogni argomento risponde a «cosa vedo?» e porta alla regola giusta.
2. Formule scritte con la **tastiera normale** (testo semplice, niente LaTeX), mostrate in forma leggibile.
3. **Grafici** dove servono, motore proprio leggero (nessuna libreria pesante).
4. I file restano la fonte di verità; mai cancellare dati (archivio in `99_Archivio/`); salvataggio sicuro come in `main/modifica.ts`.
5. Dentro Know_Tool, come nuovo modello della galleria «+ Nuovo» (`home/modelli.ts`).
6. Argomenti solo economici per ultimi. Nessuna fonte esterna: si parte da teoria standard scritta da Claude e **corretta da Ste**.

## 3. Notazione delle formule (testo → resa)
| Si scrive | Si vede |
|---|---|
| `x^2`, `x_1` | apice, pedice |
| `sqrt(x)` | radice con barra |
| `(a)/(b)` | frazione impilata |
| `pi`, `>=`, `<=`, `->`, `!=`, `+-`, `inf` | π, ≥, ≤, →, ≠, ±, ∞ |
- Una barra di **simboli** nell'editor inserisce questi testi con un clic (per chi non ricorda la sintassi).
- Parser unico (TypeScript, con test) usato da: resa grafica, Radiografia, grafici, allenamento (controllo risposte).
- Per ora: variabile `x`, polinomi, frazioni algebriche, funzioni elementari. Più variabili/parametri nelle fasi successive.

## 4. Le tre viste di un argomento
1. **Scheda di regola** (una per regola/caso): *Come la riconosci* · *Cosa fai* · *Formula* · *Esempio svolto* · *Errore tipico* · *Da non confondere con* · figura/grafico interattivo se serve.
2. **Riconoscitore** dell'argomento: la forma sceglie come si presenta (vedi §5).
3. **Ripasso**: scheda con formula sfocata da svelare; elenco di «da non confondere»; ordine per ciò che si sbaglia.

Modalità: *Radiografia* (incolli un'espressione → scatole annidate, l'operazione più esterna decide la regola, «piano d'attacco» da fuori a dentro), *Tavola delle forme* (tutte le forme a colpo d'occhio), *Allenamento a riconoscere* (vedi espressione, scegli il passo), *Ripasso*.

## 5. Forme del riconoscitore (validate)
| Ingresso | Forma | Argomento di prova |
|---|---|---|
| E espressione/equazione | **lista di controllo in ordine**: domande fisse, ✓/✗ con motivo, si evidenzia «fai questo» (primo passo valido), poi si ripete sui fattori | Scomposizione |
| E con regione | **linea dei segni** costruita un fattore alla volta: riga per fattore (continua = positivo, tratteggiata = negativo), frase del perché, riga risultato, soluzione come disuguaglianze unite da ∨; punti pieni/vuoti, denominatore sempre escluso | Disequazioni |
| E generico | a scatole annidate (Radiografia) | Derivate, espressioni |
| T testo problema | a domande guida | Combinatorio, probabilità, percentuali (da provare) |
| F figura | figura con elementi cliccabili | Geometria euclidea (da provare) |
| D dati | a dati | Statistica (da provare) |
| P / R | parametri / regione nel piano | Programmazione lineare (da provare) |
Esito prove: la **stessa scheda** regge forme diverse, cambia solo il pezzo centrale. Feedback di Ste: la lista di controllo «sì, da provare»; la tabella dei segni era **troppo fitta** → sostituita dalla linea dei segni passo per passo (da riconfermare). Il grafico delle disequazioni sta in un pulsante a parte, non in vista.

### Regole logiche già collaudate (da riscrivere in TS con test)
- Scomposizione, ordine: raccoglimento totale → differenza di quadrati → somma/differenza di cubi → trinomio 2º grado (Δ quadrato perfetto) → raccoglimento parziale → Ruffini; si ripete sui fattori. Esempi: `6x^3-12x^2+6x → 6x(x-1)^2`; `x^4-16 → (x-2)(x+2)(x^2+4)`; `x^3-6x^2+11x-6 → (x-1)(x-2)(x-3)`.
- Disequazioni: secondo membro deve essere 0 (altrimenti «porta tutto a sinistra»); fattori fino al 2º grado; numeratore/denominatore; `(x^2-4)/(x-1)>=0 → −2 ≤ x < 1 ∨ x ≥ 2`; `(x-2)^2<=0 → x = 2`; `x^2+1>0 → per ogni x`.

## 6. File (come sono fatti davvero)
Una cartella per argomento in `01_Argomenti/Matematica/<Argomento>/` (qualsiasi cartella di studio, non Italiano):
- `argomento.yaml` — `modello: matematica`, `titolo`, `introduzione`, `motore` (`scomposizione` | `disequazioni`, facoltativo), `ordine` (id delle regole), `esempi` (da provare con un clic), `bozza` (true = scritto da Claude, da correggere).
- `regole/<id>.yaml` — `id` (= nome del file), `nome`, `riconosci`, `fai`, `formula`, `esempi` (`da`, `passi`, `risultato`), `errore`, `confondi` (`con`, `differenza`), `controllo` (quale controllo del calcolatore è questa regola).
- `progresso.json` — `{ "ripassate": [id…] }`, scritto in modo sicuro (file temporaneo + rinomina).
Le formule nel testo stanno tra apici inversi (`` `x^2-9` ``) e vengono disegnate. Lettura con zod (`shared/matematica.ts`), errori leggibili, avvisi che non bloccano l'apertura (regola citata e mancante, regola fuori ordine, id diverso dal nome del file).

## 6b. Schermata
Si apre in una scheda dell'app come «Per situazioni» (icona Σ). Tre viste: **Riconosci** (con `motore`: lista di controllo per la scomposizione, linea dei segni passo per passo per le disequazioni, con grafico a richiesta; senza: elenco «cosa vedo → cosa faccio»), **Regole** (scheda completa con formula, esempi, errore tipico, «da non confondere con»), **Ripasso** (formula sfocata da svelare, «L'ho ricordata» salva il progresso). Voce «Matematica» nella galleria «+ Nuovo» (consigliata dentro la materia Matematica).
Dati di prova scritti da Claude (bozza): `Scomposizione dei polinomi` (6 regole) e `Disequazioni e sistemi` (7 regole).

**Regola tecnica:** niente file che differiscono solo per maiuscole nella stessa cartella (`formula.ts` e `Formula.tsx` sulla stessa cartella): su Windows l'import sbaglia file. Logica in `formula.ts`, componente in `FormulaVista.tsx`.

## 7. Fasi di costruzione
1. ~~Motore~~ **fatto**: parser, resa formule, grafico, scomposizione, disequazioni; test vitest.
2. ~~Scheda + Riconoscitore + Ripasso~~ **fatto** con due argomenti d'esempio e voce nella galleria (da provare in Electron).
3. **Allenamento** (esercizio → scegli la regola/il passo → verifica) e sistemi di disequazioni.
4. Barra simboli nell'editor `.md`; proposte di schede da Claude (revisione di Ste).
5. Prove delle forme T/D/F su argomenti noti (percentuali, statistica descrittiva, Pitagora/Talete/Euclide), poi gli altri; economici per ultimi.

## 8. Da decidere con Ste
- Conferma della linea dei segni al posto della tabella.
- Quanto sia grande il «Ripasso» a regola vs a argomento.
- Come rappresentare le soluzioni dei **sistemi** di disequazioni (intersezione di più linee).
- Dove stanno le schede nell'albero (una voce «Matematica» già esistente o nuova).


## 9. Schermata v2 (dopo la prova di Ste, 2026-10-20)

- Griglia di regole (una card colorata per regola, formula in grande) → dentro la regola una **bento grid** di 4 card espandibili: **Capisci** (da zero, in ordine, con disegno animato dove serve), **Riconosci** (domande, ognuna con il suo disegno: figure `pezzi`, `quadrati`, `segno`, `fattori`, `nessuna`), **Fai e prova** (esempio svolto + esercizi a scelta con il perché di ogni errore), **Ripassa** (formula sfocata, errore tipico, da non confondere).
- Colori con significato: fase (verde acqua / blu / verde / rosa), tipo di informazione (formula viola, errore rosso, da non confondere ambra), regola (un colore ciascuna, campo `colore` opzionale).
- Campi regola nuovi (tutti opzionali, le regole vecchie funzionano): `colore`, `capisci[]`, `animazione`, `riconosciEsempi[]`, `esercizi[]`.
- Il calcolatore (checklist, linea dei segni) resta nella scheda «Prova su un esercizio».
- Da fare: vista a griglia di tutti gli argomenti, regole restanti nel nuovo formato, sistemi di disequazioni, Allenamento.
