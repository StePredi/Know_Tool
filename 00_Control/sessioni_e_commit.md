# SESSIONI E COMMIT

Questa è **l'unica fonte** per come si lavora in più sessioni (sviluppo e studio, anche su due PC) e per come si committa. Se un altro documento dice altro, vale questo.

Scritta il 2026-11-24, dopo aver trovato 141 modifiche non committate di diverse settimane, una rinomina (`MSP` → `ESP`) mai committata e uno `STATO.md` che descriveva contenuti non ancora nel repository.

---

## 1. Chi tocca cosa

| Parte | Sessione di sviluppo | Sessione di studio |
|---|---|---|
| `02_App/`, `03_Demo/` | scrive | **mai** |
| `00_Control/specifiche/`, `modifiche_app.md`, `sessione_*.md`, `sessioni_e_commit.md`, `REGOLE.md`, `DECISIONI.md` | scrive | legge |
| `01_Argomenti/` | solo dati di prova | scrive |
| `segnalazioni_studio.md` | gestisce («Fatte») | aggiunge righe in «Da fare» |
| `LOG.md`, `STATO.md` | aggiunge le sue righe | aggiunge le sue righe |
| `99_Archivio/` | sposta qui i temporanei | sposta qui i temporanei |

`LOG.md` e `STATO.md` sono condivisi: ognuno aggiunge **solo le proprie righe** e le committa insieme al proprio lavoro.

---

## 2. Quando si committa

> **Una unità di lavoro finita = un commit, nella stessa sessione.**

Unità di lavoro: un documento o un ramo di schede finito, una funzione dell'app finita, una rinomina o uno spostamento di cartelle.

- **Non si chiude una sessione con modifiche proprie non committate.** Se non si può finire, si committa a metà con il messaggio che dice «in corso».
- **Rinominare o spostare cartelle** si fa solo se Ste lo chiede, si aggiornano subito i riferimenti (indici, test, `STATO.md`) e si committa nella stessa sessione.
- `STATO.md` non descrive mai contenuti che non sono ancora in un commit.

---

## 3. Come si committa

- **Solo i propri percorsi**, scritti per esteso: `git add 01_Argomenti/Storia 00_Control/LOG.md`. Mai `git add .` e mai `git add -A` sull'intero repository.
- Su una cartella propria si può usare `git add -A <cartella>`: serve a registrare anche rinomine e file tolti.
- **Prefisso** nel messaggio, per capire a colpo d'occhio di chi è il commit:
  - `app:` codice dell'app e test
  - `studio:` contenuti di `01_Argomenti/`
  - `doc:` documenti di controllo e specifiche
- Messaggio in italiano, prima riga corta che dice cosa è cambiato. Poi, se serve, un elenco di 2-4 punti. Poi le righe di attribuzione richieste dall'ambiente.
- **Un commit = una cosa sola.** Codice e contenuti non vanno nello stesso commit.
- Prima di committare codice: `npm run typecheck` e i test che toccano quel codice. Prima di committare contenuti: i test dei dati (`situazioni`, `regola`, `albero_*`) se la sessione può eseguirli; altrimenti nel `LOG.md` si scrive «non verificato».

---

## 4. Inizio sessione

1. Leggere `REGOLE.md`, `STATO.md`, `DECISIONI.md`, ultime righe di `LOG.md` e questo file.
2. `git status` e `git log --oneline -5`.
3. Se c'è un repository remoto: `git pull --rebase` (con i due PC è obbligatorio).
4. Se ci sono modifiche **non mie**: non le tocco e non le committo. Se sono di più di un giorno fa, lo dico a Ste in una riga e chiedo se farle committare alla sessione che le ha scritte o se lo faccio io (con prefisso giusto, dopo aver guardato cosa sono).

---

## 5. Fine sessione

1. Test o controlli del punto 3.
2. Riga in `LOG.md` (e in `STATO.md` se cambia qualcosa che l'utente deve sapere).
3. Commit dei propri percorsi.
4. `git status` sui propri percorsi: **deve essere vuoto**.
5. Se c'è un repository remoto: `git push`.
6. Nell'ultimo messaggio a Ste: l'hash del commit, cosa non ho provato, cosa resta da cancellare a mano.

---

## 6. Due PC

- **Un PC alla volta.** Si lascia un PC solo dopo `git push`; si comincia sull'altro con `git pull --rebase`.
- Ogni PC ha la sua cartella clonata e il suo `npm install` in `02_App` (i programmi di Windows non si copiano).
- Il collegamento al repository remoto (privato) lo fa Ste la prima volta; finché non c'è, vale solo la parte locale di queste regole.

---

## 7. File di blocco e temporanei

- La shell sul PC di Ste non può cancellare file: dopo un commit restano `tmp_obj_*` in `.git/objects/` (innocui) e a volte un `.git/*.lock`.
- Un `.lock` lasciato da un comando mio lo rinomino: `mv .git/HEAD.lock .git/stale-HEAD-lock-<ora>`. Non tocco mai quelli di un git in esecuzione.
- I pacchetti e i file temporanei vanno in `99_Archivio/Obsoleti/<data>/` e li cancella Ste.

---

## 8. Messaggi fra sessioni

- **Studio → sviluppo:** `segnalazioni_studio.md`, una riga per segnalazione (formato in `sessione_studio.md` §5).
- **Sviluppo → Ste:** `modifiche_app.md`, quello che c'è da provare su Windows.
- Se una sessione trova lavoro altrui incompleto o incoerente (per esempio un indice che cita schede che non ci sono), lo scrive in `segnalazioni_studio.md` e non lo sistema da sola.
