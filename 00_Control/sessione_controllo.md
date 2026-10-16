# SESSIONE DI CONTROLLO (sviluppo dell'app)

Questa guida è per una sessione di Claude che **lavora sull'app** (`02_App/`) e tiene in ordine il progetto. La sessione di studio, in parallelo, usa l'app come se fosse finita e lavora solo in `01_Argomenti/` (guida: `sessione_studio.md`).

---

## 1. Divisione dei compiti

**Sessione di controllo** (questa):

- modifica `02_App/`, le specifiche in `00_Control/specifiche/` e i documenti di controllo;
- legge `segnalazioni_studio.md` (bug e idee dalla sessione di studio) e le gestisce: quando una è fatta, la sposta sotto «Fatte», non la cancella;
- aggiorna `LOG.md`, `STATO.md` e (se cambia qualcosa che l'utente deve provare) `modifiche_app.md`;
- **non scrive contenuti di studio** (appunti, schede, mappe) se non per dati di prova.

**Sessione di studio**: solo `01_Argomenti/`; mai `02_App/`.

---

## 2. Prima di cominciare

Leggo, in questo ordine:

1. `00_Control/REGOLE.md`
2. `00_Control/STATO.md` (cosa è fatto, cosa resta, punti aperti)
3. gli ultimi punti di `00_Control/LOG.md`
4. `00_Control/segnalazioni_studio.md` (sezione «Da fare»)
5. la specifica della parte su cui lavoro (`00_Control/specifiche/`)

Poi dico in una riga cosa sto per fare.

---

## 3. Com'è fatta l'app

Electron + electron-vite, React 18, TypeScript rigoroso, Tailwind 4, zustand, zod, yaml, chokidar, vitest. Si lancia con `npm run dev` da `02_App/` (Windows). Controlli: `npm run typecheck`, `npm test`, `npm run build`.

```
02_App/src/
  main/        processo principale: accesso ai file, mai logica di interfaccia
    esplora.ts      albero di 01_Argomenti; crea / rinomina / archivia (creaNodo, creaAppunto, creaSituazioni)
    situazioni.ts   legge un documento «Per situazioni» (indice.yaml + schede/*.yaml + progresso.json)
    appunti.ts      legge appunti .md, trova e apre le fonti citate (senza badare alle maiuscole)
    modifica.ts     salvataggio sicuro: leggiSorgente, salvaSorgente, creaFile, archiviaFile
    repository.ts   autori di italiano (Italiano/Autori/<id>/…): schede, testi, scrittura immediata, watcher
    index.ts        i canali IPC (un handler per ogni funzione di window.api)
  preload/     ponte: index.ts (invoke) + tipi in shared/types.ts (interfaccia Api)
  shared/      codice puro, testabile: modelli e zod (situazioni.ts, modello.ts), markdown.ts, mdedit.ts,
               modelloScheda.ts, percorsi.ts, layout.ts…
  renderer/
    home/        Home generale: albero, schede (tab) in stile browser, Galleria «+ Nuovo» (modelli.ts)
    situazioni/  «Per situazioni»: mappa ad albero (layout.ts + MappaSit.tsx), scheda, Figura,
                 ModificaScheda.tsx, ModificaMappa.tsx
    appunti/     VistaAppunto.tsx (lettura), ModificaAppunto.tsx (barra di formattazione + anteprima)
    editor/      editor dei testi di italiano (annotazioni, parafrasi, esercizi, scheda riassuntiva AI)
    componenti/  Icona.tsx (icone SVG uniche), Mappa.tsx…
    index.css    stili (classi per area: .s- mappa, .m- modifica, .md- appunti, .gal- galleria, .hm- home)
02_App/tests/  vitest (i test sui dati veri leggono 01_Argomenti: saltano da soli se manca)
```

Regole di costruzione che sono già nel codice e vanno mantenute:

- **Mai cancellare dati dell'utente**: archiviare in `99_Archivio/` (`Archiviati/`, `cartelle_archiviate/`, `Versioni/`).
- **Salvataggio sicuro** (`modifica.ts`): solo `.md`/`.yaml` dentro `01_Argomenti`, mai nomi riservati (`_`, `.`, `99_`); copia della versione precedente (ultime 10); file temporaneo + rinomina; avviso se il file è cambiato sul disco; il contenuto si valida prima di scrivere.
- **I file sono la fonte di verità**: l'app li legge dal disco e si aggiorna da sola; gli errori di lettura diventano avvisi, mai blocchi.
- **Percorsi**: le cartelle hanno l'iniziale maiuscola, ma i confronti non badano alle maiuscole (`shared/percorsi.ts`). Italiano è fisso: `Italiano/Autori/<autore>/`.
- **Testo sempre per intero**: nelle caselle della mappa il testo va a capo e le caselle crescono, mai puntini.

---

## 4. Come lavoro

- Scrivo in italiano, con formattazione ben spaziata (`REGOLE.md`). L'utente ama le spiegazioni visive e ben distanziate; risposte brevi, risultato per primo.
- **Un passo per volta**, con un controllo alla fine di ognuno: `npm run typecheck`, `npm test`, `npm run build`. Per le interfacce provo anche nel browser (Playwright con dati finti) e guardo uno screenshot.
- **Dico sempre cosa non ho provato**: finché l'utente non ha aperto l'app su Windows, scrivo «provato solo nel browser/nei test, non in Electron/Windows».
- Per le cose grandi o ambigue **prima si progetta insieme** (specifica in `specifiche/`, decisioni dell'utente scritte lì), poi si costruisce. Per le cose piccole e chiare si va direttamente.
- Prima di spostare o riscrivere dati dell'utente: elenco di cosa cambia, ok dell'utente, un solo commit, ritorno indietro possibile con `git revert`.
- A ogni funzione finita aggiorno: `LOG.md` (una voce datata: cosa, file toccati, quanti test, cosa non provato), `STATO.md` (Fatto / Da fare), e la specifica se cambia il formato.
- **Commit**: messaggio in italiano, una riga che dice cosa è cambiato, poi le righe di attribuzione richieste dall'ambiente.
- Non aggiungo funzioni non chieste. Se vedo un'idea utile la propongo in una riga.

### Note pratiche sul computer dell'utente

- Se lavoro da una sessione con collegamento al computer, la cartella è `Know_Tool` (ramo `main`). Cancellare file lì richiede il permesso dell'utente: git lascia quindi dei `.lock` in `.git` dopo ogni comando che scrive. Si spostano con `mv .git/HEAD.lock .git/stale-<data>-HEAD.lock` (mai con `rm`, mai se git è in esecuzione).
- Per portare codice: pacchetto `.tgz` con **nome nuovo** in `99_Archivio/`, estratto sul posto; i `.tgz` vecchi li cancella l'utente.
- Se il collegamento cade ("Workspace still starting" o "not connected"): aspetto 45-60 secondi e riprovo una volta; se non torna, lo dico e lascio il pacchetto da copiare.

---

## 5. Cosa è stato provato e cosa no

Tutto lo sviluppo recente è provato **solo nel browser e con i test** (97 test, typecheck e build ok), non in Electron su Windows. Da provare con l'utente su Windows (`npm run dev`):

- Home generale (schede, albero, galleria «+ Nuovo», nuova materia/cartella/appunto/documento, rinomina, archivia);
- «Per situazioni»: mappa ad albero (apri/chiudi, occhio, fuoco, testi a capo), «Modifica mappa», modifica scheda, nuova scheda, archivia scheda;
- appunti: lettura, modifica con barra di formattazione, apertura delle fonti con l'app del sistema (PDF, pptx);
- il riordino delle cartelle (preferiti e schede aperte vecchi si perdono);
- editor dei testi di italiano e scheda riassuntiva con una proposta vera di Claude.

---

## 6. Da fare (in ordine proposto)

1. **Prova su Windows** di tutto quanto sopra e correzioni.
2. «Verifica fonti»: comando ripetibile che controlla le citazioni degli appunti e delle schede contro i file e le pagine reali, con elenco dei problemi.
3. Pannello unico dei problemi (avvisi di lettura, fonti, collegamenti rotti).
4. Proposte di Claude con «Applica / Scarta» anche per i documenti «Per situazioni».
5. Figure a moduli (disegno della scheda con i pin) e figure nelle schede di altri documenti.
6. Modifica: importare o spostare file dall'app; nuovo autore (e quindi «Mappa cronologica» in galleria).
7. Altri documenti «Per situazioni»: Git e Python (nello stesso formato di MikroTik e MSP).
8. Nuovi modelli in galleria, uno alla volta, progettati insieme (flashcard: non per ora).
9. Home: ricerca nei contenuti, spostare con trascinamento.
10. **A fine app**: importazione PDF e installer `.exe` (electron-builder). Restano per ultimi, per scelta dell'utente.

---

## 7. Messaggio da incollare per cominciare

> Sei la sessione di controllo di Know_Tool. Leggi `00_Control/sessione_controllo.md` e segui l'ordine di lettura del §2. Poi dimmi in poche righe a che punto siamo e cosa propone il §6, e aspetta il mio via.
