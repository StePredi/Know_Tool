# Containers

## Cos'è un container

Un **container** è un'unità software standard che impacchetta il codice di un'applicazione insieme a tutte le sue dipendenze (librerie, runtime, configurazioni) in modo che possa essere eseguita in modo rapido e affidabile su qualsiasi ambiente.

Come si vede nello schema seguente, a differenza di quanto avviene con la tecnologia di virtualizzazione basata su Virtual Machines (VMs), un sistema che utilizza i containers si basa sulla seguente **architettura**:

- alla base vi è ancora (ovviamente) l'infrastruttura **hardware**, sulla quale viene però installato il Sistema Operativo (**SO**);
- nel SO viene installato il **container engine** ovvero il software che si occupa di eseguire e gestire i containers;
- le applicazioni, ciascuna "impacchettata" in un **container** con tutte le proprie dipendenze, vengono eseguite dal *container engine* che, anzichè l'infrastruttura hardware, **virtualizza il SO**. 

```
┌─────────────────────────────────────┐
│           CONTAINER                 │
├─────────────────────────────────────┤
│  App1  │  App2  │  App3  │  App4    │
│  Libs  │  Libs  │  Libs  │  Libs    │
├─────────────────────────────────────┤
│      Container Runtime              │
│        (Docker Engine)              │
├─────────────────────────────────────┤
│         Host OS (Linux)             │
├─────────────────────────────────────┤
│         Hardware                    │
└─────────────────────────────────────┘
```

In questo tipo di architettura, essendoci una sola copia del SO, è possibile risparmiare molte risorse.

## Vantaggi dei containers

I vantaggi dei containers, se confrontati con le VMs, sono diversi:  

1. **leggerezza**: un container non include kernel, driver, servizi di sistema duplicati. Tipicamente:
   
   ```
   dimensione Ubuntu Server VM:       ~2 GB
   dimensione Ubuntu Container:       ~50 MB
   dimensione Alpine Linux Container: ~5 MB
   ```

2. **velocità** di avvio: un container non deve fare boot dell'OS, solo avviare il processo. Tipicamente:
   
   ```
   tempo di avvio di una VM:         30-120 secondi
   tempo di vvio di un container:    1-2 secondi
   ```

3. **portabilità**: 
   Il motto di Docker è: *build once, run anywhere*. Infatti, un container che funziona su:  
- laptop dello sviluppatore (Windows/macOS/Linux); 
- server di test;  
- server di produzione;  
- cloud (AWS, Azure, Google Cloud);  
  ...e funziona **esattamente allo stesso modo** ovunque!
4. **efficienza** nell'utilizzo delle risorse:
   Su un server con 16 GB RAM possono essere eseguite:
- **VM**: 5-10 macchine virtuali
- **Container**: 50-100+ container
5. **isolamento** quasi totale: utilizzando i containers si ha un isolamento a livello di processi, filesystem, network e utenti. In effetti, poichè i containers condividono il kernel, sono meno isolati rispetto alle VMs, ma questo è sufficiente per la maggior parte dei casi.
6. **scalabilità**: creare e distruggere containers è molto più semplice che farlo con le VMs;

Riassumendo:
| Caratteristica | Macchine Virtuali | Container |
|---|---|---|
| **Sistema Operativo** | OS completo per ogni VM | Condiviso con l'host |
| **Dimensioni** | GB (2-20 GB) | MB (5-500 MB) |
| **Avvio** | Minuti (30-120 sec) | Secondi (1-5 sec) |
| **Overhead** | Alto (più layer) | Minimo |
| **Isolamento** | Completo (livello HW) | Processo (livello OS) |
| **Sicurezza** | Molto alta | Alta (se configurato bene) |
| **Densità** | 5-20 per host | 50-100+ per host |
| **Performance** | Buone | Vicine al nativo |
| **Portabilità** | Media (formati diversi) | Alta (standard) |
| **OS diversi** | Sì (Win + Linux) | No (stesso kernel) |
| **Uso risorse** | Alto | Basso |
| **Ideale per** | App legacy, isolamento massimo | Microservizi, cloud-native |

## Concetti chiave della *containerizzazione*

La tecnologia dei containers si basa sui seguenti concetti di base: 

#### Immagine (Image)

L'**immagine** è un template *read-only* che contiene l'applicazione e tutte le sue dipendenze. Un'immagine ha le seguenti caratteristiche:  

- è immutabile (ovvero non è modificabile);  
- è composta da layers;  
- ne possono esistere diverse versioni;  
- può essere condivisa.

#### Container

Il **container** è l'istanza in esecuzione di un'immagine, ovvero il processo attivo che si ottiene dall'esecuzione dell'applicazione contenuta nell'immagine. Un container possiede le seguenti caratteristiche:

- è mutabile (durante la sua esecuzione può modificare dati);  
- è effimero (può essere distrutto);  
- esiste solo nello stato runtime;  
- ha un ciclo di vita.

E' importante notare che, da una stessa immagine si possono ricavare N containers.

#### Registry

Il **registry** (repository o **hub**), è un servizio che memorizza e distribuisce immagini. E' quindi possibile sia scaricare dal registry immagini già pronte, sia mantenere sul registry le proprie immagini.

# Docker

**Docker** è la piattaforma di *containerizzazione* più popolare al mondo, tanto da essere ormai divenuta lo standard *de-facto* in questo ambito tecnologico.

Docker non ha inventato i containers, ma li ha resi:

- facili da usare;  
- portabili;  
- standardizzati;  
- accessibili a tutti.

## Architettura Docker

Docker usa un'architettura **client-server** in cui:

- il **Docker daemon**, installato sul sistema host che gestisce il servizio di *containerizzazione*, è il servizio che si occupa della gestione di tutto ciò che attiene all'implementazione dei containers;
- il *daemon* mette a disposizione una API di tipo REST che viene utilizzata da un applicativo **Docker client**. Gli utenti, mediante opportuni comandi inoltrati dal client, possono richiedere al *daemon* stesso di svolgere determinate funzioni;
- il *daemon* interagisce, mediante API REST, anche il servizio **registry**, per tutto quello che riguarda il recupero o lo storage di immagini sul registry stesso.

```
┌────────────────────────────────────────────┐
│              Docker Client                 │
│  (docker CLI - Interfaccia utente)         │
│                                            │
│  $ docker run                              │
│  $ docker build                            │
│  $ docker pull                             │
└──────────────┬─────────────────────────────┘
               │ REST API
               │
┌──────────────▼─────────────────────────────┐
│           Docker Daemon                    │
│         (dockerd - Server)                 │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   Gestione Container               │    │
│  │   - Creazione                      │    │
│  │   - Avvio/Stop                     │    │
│  │   - Networking                     │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   Gestione Immagini                │    │
│  │   - Build                          │    │
│  │   - Layer cache                    │    │
│  │   - Storage                        │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   Gestione Volumi                  │    │
│  │   - Persistenza dati               │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   Gestione Network                 │    │
│  │   - Bridge, overlay, host          │    │
│  └────────────────────────────────────┘    │
└──────────────┬─────────────────────────────┘
               │
               │ Interazione
               │
┌──────────────▼─────────────────────────────┐
│         Docker Registry                    │
│         (Docker Hub, ECR, etc.)            │
│                                            │
│  📦 nginx:latest                           │
│  📦 postgres:14                            │
│  📦 node:18                                │
└────────────────────────────────────────────┘
```

## Docker objects

Nella gestione del sistema di *containerizzazione*, Docker si occupa dei seguenti oggetti: 

- **Images**: templates per creare containers;
- **Containers**: istanze in esecuzione delle immagini;
- **Networks**: infrastrutture virtuali di comunicazione tra containers;
- **Volumes**: sistemi di storage che garantiscono la persistenza dei dati gestiti dai containers anche dopo la distruzione dei containers stessi.

---

### Docker images

Come già detto, le **immagini** Docker contengono la definizione di ciò che viene ricostruito in un container in esecuzione e costituiscono la base per la distribuzione di applicazioni mediante Docker.

L'immagine può essere pensata come il *filesystem* del container e consiste in uno o più **layers** a  sola lettura (ovvero non modificabili) sovrapposti tra loro.
Tali *layers* (o strati), hanno generalmente una corrispondenza uno-a-uno con i passaggi svolti nella creazione di una immagine:

```
┌───────────────────────────────┐
│  Layer 4: COPY app.py /app/   │  (10 KB)
├───────────────────────────────┤
│  Layer 3: RUN pip install...  │  (50 MB)
├───────────────────────────────┤
│  Layer 2: COPY requirements   │  (1 KB)
├───────────────────────────────┤
│  Layer 1: FROM python:3.11    │  (200 MB)
└───────────────────────────────┘
```

Il principale vantaggio di questa "*stratificazione*", consiste nella possibilità di riutilizzare i layers condivisi tra immagini diverse, con conseguente aumento di:  

- efficienza di storage;
- velocità di build;
- velocità di download.

#### Dockerfile

Una immagine può essere creata a partire da un **Dockerfile**, un file di testo che contiene le istruzioni per costruire l'immagine stessa.

In un Dockerfile, le ISTRUZIONI sono generalmente scritte in maiuscolo, mentre i corrispondenti argomenti sono in minuscolo e i commenti sono preceduti dal carattere #.

Le principali istruzioni che si utilizzano per la composizione del Dockerfile sono:

##### FROM

questa deve **sempre** essere la prima istruzione di un Dockerfile e serve a specificare l'immagine base di partenza. Una immagine Docker, infatti, **non viene mai** creata da zero, ma sempre a partire da una immagine (minimale) esistente.
Alcuni esempi:

```dockerfile
FROM ubuntu:22.04
FROM python:3.11-slim
FROM node:18-alpine
```

##### WORKDIR

serve ad impostare la directory di lavoro: tutti i comandi successivi vengono eseguiti in tale cartella.

```dockerfile
WORKDIR /app
```

##### COPY

questa istruzione copia file e/o cartelle dal filesystem del systema host a quello dell'immagine.

```dockerfile
COPY source destination
COPY app.py /app/
COPY . .
```

Una istruzione analoga a COPY è **ADD** che, a differenza della prima, può anche estrarre archivi e scaricare da URL. Tuttavia, COPY è sempre da preferire, quando possibile.

##### RUN

questa istruzione esegue comandi durante la costruzione (*build*) dell'immagine, creando un nuovo layer nell'immagine stessa.

```dockerfile
RUN apt-get update && apt-get install -y curl
RUN pip install flask
RUN npm install
```

##### ENV

questa istruzione imposta variabili d'ambiente, che possono essere usate, ad esempio, per impostare valori configurabili all'interno dell'applicazione.

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_USER=ciccio
```

##### EXPOSE

questa istruzione serve ad indicare su quali ports è accessibile (l'eventuale) servizio implementato dall'applicazione eseguita dal container. Occorre prestare attenzione al fatto che, come verrà spiegato meglio in seguito, l'istruzione **EXPOSE non è sufficiente** a rendere il servizio containerizzato accessibile dall'esterno.

```dockerfile
EXPOSE 80
EXPOSE 443
EXPOSE 3000
```

##### CMD

questa istruzione è generalmente l'ultima del Dockerfile e serve ad indicare il comando predefinito da eseguire all'avvio del container.

```dockerfile
CMD ["python", "app.py"]
CMD ["node", "server.js"]
CMD ["nginx", "-g", "daemon off;"]
```

Il comando specificato da CMD può essere **sovrascritto** al momento dell'avvio del container.

##### ENTRYPOINT

il comando ENTRYPOINT ha la stessa funzione di CMD, con la differenza che **non può essere sovrascritto** e, per tale motivo, CMD diventa spesso argomento di ENTRYPOINT:

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
# Risultato: python app.py
```

Un esempio di Dockerfile completo è il seguente:

```Dockerfile
# Immagine base
FROM python:3.11-slim

# Informazioni sul maintainer
LABEL maintainer="tuonome@esempio.it"

# Directory di lavoro nel container
WORKDIR /app

# Copia requirements e installa dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Porta esposta
EXPOSE 5000

# Variabili d'ambiente
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Comando da eseguire all'avvio
CMD ["python", "app.py"]
```

Una volta elaborato il Dockerfile, l'immagine può essere costruita con il comando `docker build`, ad esempio:

```bash
docker build -t my-flask-app:1.0 .
```

#### Comandi Docker per la gestione delle immagini

I comandi `docker` essenziali per la gestione delle immagini sono:

```bash
# Scaricare un'immagine
docker pull nginx:latest
docker pull ubuntu:22.04

# Elencare immagini locali
docker images
docker images -a  # Include layer intermedi

# Rimuovere un'immagine
docker rmi nginx:latest
docker rmi IMAGE_ID

# Rimuovere immagini non utilizzate
docker image prune
docker image prune -a  # Rimuove tutte le immagini non usate

# Visualizzare dettagli di un'immagine
docker inspect nginx:latest

# Visualizzare la storia di un'immagine (layer)
docker history nginx:latest

# Cercare immagini su Docker Hub
docker search nginx

# Taggare un'immagine
docker tag myapp:latest myapp:1.0.0

# Salvare/caricare immagini
docker save myapp:latest > myapp.tar
docker load < myapp.tar
```

---

### Docker volumes

I container sono per loro natura **effimeri** perciò, quando vengono eliminati, tutti i dati al loro interno vengono persi.

I **volumes** risolvono questo problema, permettendo di rendere persistenti i dati gestiti dal container durante la sua esecuzione. Ciò avviene associando ad un *path* del filesystem del container una porzione dello storage (disco) del sistema host.

Esistono due tipi principali di mount:

1. **Named volumes** (consigliato);
2. **Bind mounts**.

#### **Named volumes** (consigliato):

I **Named volumes** vengono gestiti interamente da Docker e si trovano su una parte "protetta" del filesystem del sistema host (`/var/lib/docker/volumes/` su Linux): mentre Docker ha completo accesso al *volume*, i processi non-Docker non possono modificarne il contenuto.

I *volumes* possono essere creati prima o contestualmente all'avvio del container e possono anche essere "montati" su più containers contemporaneamente, così da condividere i dati tra i containers stessi.

Quando nessun container utilizza il *volume*, esso è comunque presente nel sistema host. 

I principali comandi per la gestione dei *volumes* sono:

```bash
# Creare un volume
docker volume create mio-volume

# Usare il volume
docker run -d -v mio-volume:/app/data nginx

# Elencare volumi
docker volume ls

# Ispezionare un volume
docker volume inspect mio-volume

# Rimuovere un volume
docker volume rm mio-volume

# Rimuovere volumi non utilizzati
docker volume prune
```

I vantaggi dei Named Volumes consistono nel fatto che:

- sono gestiti direttamente da docker;
- sono indipendenti dal filesystem host;
- è semplice eseguirne il *backup*;
- possono essere condivisi tra containers.

#### **Bind mounts**

Quando di utilizza un **bind mount**, un file o una cartella del sistema host viene "montato" direttamente nel container: il file o la cartella viene specificato mediante il suo *pathname* assoluto e, se non esiste già, può essere creato al momento dell'avvio del container.   

I *bind mounts* vengono in genere specificati al momento dell'avvio del container e sono riconoscibili proprio perchè specificati mediante *pathname*:

```bash
# Montare directory host nel container
docker run -d -v /percorso/host:/percorso/container nginx
docker run -d -v $(pwd):/app node:18

# Esempio pratico: sviluppo locale
docker run -d \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  -p 3000:3000 \
  my-dev-app
```

I vantaggi dei *bind mounts* consistono nel fatto che:

- i file modificati sono immediatamente visibili;
- è possibile accedere direttamente ai file da host.

Gli svantaggi, tuttavia, ne rendono sconsigliato l'utilizzo:

- il mount è dipendente dal filesystem del sistema host (il chè può generare problemi di portabilità);
- anche i processi non-Docker possono modificare i files contenuti nel *bind mount*.

---

### Docker Networks: Comunicazione tra Container

Le infrastrutture virtuali di **networking** permettono la comunicazione tra containers.

Le principali connessioni di rete previste per i containers sono:

1. **bridge** network (*default* o *custom*);
2. **host** network;
3. nessuna connessione.

Per creare le reti di tipo **bridge**, Docker utilizza un *bridge software* (ovvero un dispositivo virtuale di livello *Link Layer*). Tale dispositivo consente a tutti i containers collegati al bridge di comunicare tra loro, fornendo al contempo isolamento dai containers non connessi al bridge. In pratica, i containers collegati ad un bridge, si comportano come gli hosts appartenenti ad una stessa rete LAN. 

Al fine di garantire il corretto funzionamento delle reti bridge, Docker installa automaticamente nel firewall della macchina host, regole di *filtering* per impedire la comunicazione tra containers che si trovano su reti diverse e regole di *masquerading* per consentire l'accesso a Internet da parte dei containers.

#### **Default bridge**

Quando si installa Docker viene anche creato un bridge detto di *default* a cui, se non diversamente specificato, vengono automaticamente connessi tutti i containers che vengono avviati.

Nella rete **default bridge**, ogni container ha la propria interfaccia ethernet virtuale connessa al bridge e un proprio indirizzo IP privato assegnato da Docker all'interfaccia stessa.

Anche l'host che ospita i containers è connesso al bridge tramite una propria interfaccia denominata `docker0`: questo significa che un container connesso al bridge può comunicare anche con l'host o raggiungere Internet attraverso l'interfaccia virtuale `docker0`, che funge da *default gateway* della bridge network.

#### **Custom bridge**

Oltre a quella di *default*, Docker offre la possibilità di definire altre reti bridge, denominate **custom**. Questo tipo di rete, funziona esattamente come la precedente, ma offre alcuni significativi vantaggi che ne rendono preferibile l'utilizzo.  
In particolare, le reti *custom bridge* forniscono:

- DNS automatico per la risoluzione dei nomi dei containers con l'indirizzo IP corrispondente;
- un migliore isolamento, in quanto sono connessi alla rete solo i containers per i quali viene espressamente dichiarato;
- possibilità di connessione/disconnessione *on the fly* dei containers dal bridge; 
- una configurazione più flessibile.

Il seguente esempio illustra i comandi da utilizzare per creare e utlizzare una rete *custom bridge*:

```bash
# Creare network custom
docker network create mia-rete

# Eseguire container sulla rete custom
docker run -d --name web --network mia-rete nginx
docker run -d --name api --network mia-rete node:18

# I container possono comunicare usando i nomi
# "web" può raggiungere "api" usando http://api:3000

# Ispezionare la rete
docker network inspect mia-rete

# Rimuovere la rete
docker network rm mia-rete
```

A titolo di **esempio**, consideriamo una applicazione formata da più container correlati e connessi alla stessa rete *custom*:

```bash
# 1. Creare rete
docker network create app-network

# 2. Database
docker run -d \
  --name database \
  --network app-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# 3. Backend (può connettersi a "database:5432")
docker run -d \
  --name backend \
  --network app-network \
  -e DATABASE_URL=postgresql://postgres:secret@database:5432/myapp \
  my-backend:latest

# 4. Frontend
docker run -d \
  --name frontend \
  --network app-network \
  -p 80:80 \
  -e API_URL=http://backend:3000 \
  my-frontend:latest
```

#### **Host network**

Questa modalità viene usata solo per containers *stand-alone*, nella quale il container usa direttamente la rete dell'host. In questo modo non si ha nessun isolamento di rete ma si ottengono le massime performance.

```bash
docker run -d --network host nginx
```

#### **None**

In questo caso il container non utilizza nessuna rete e risulta completamente isolato.

```bash
docker run -d --network none nginx
```

---

### Docker containers

I comandi `docker` essenziali per la gestione dei containers sono:

```bash
# Eseguire un container
docker run nginx
docker run -d nginx                    # Detached mode (background)
docker run -d -p 8080:80 nginx         # Mappa porta 8080→80
docker run -d --name mio-nginx nginx   # Con nome custom
docker run -it ubuntu bash             # Interattivo con terminale

# Elencare container
docker ps              # Container in esecuzione
docker ps -a           # Tutti i container (anche fermati)
docker ps -q           # Solo gli ID

# Fermare un container
docker stop CONTAINER_ID
docker stop mio-nginx
docker stop $(docker ps -q)  # Ferma tutti

# Avviare un container fermato
docker start CONTAINER_ID

# Riavviare un container
docker restart CONTAINER_ID

# Rimuovere un container
docker rm CONTAINER_ID
docker rm -f CONTAINER_ID  # Forza rimozione (anche se running)
docker container prune     # Rimuove tutti i container fermati

# Eseguire comandi in un container in esecuzione
docker exec -it mio-nginx bash
docker exec mio-nginx ls /usr/share/nginx/html

# Visualizzare log di un container
docker logs CONTAINER_ID
docker logs -f CONTAINER_ID  # Follow (real-time)
docker logs --tail 100 CONTAINER_ID  # Ultime 100 righe

# Visualizzare statistiche (CPU, RAM, etc.)
docker stats
docker stats CONTAINER_ID

# Ispezionare un container
docker inspect CONTAINER_ID

# Copiare file da/verso container
docker cp file.txt CONTAINER_ID:/app/
docker cp CONTAINER_ID:/app/file.txt ./

# Visualizzare processi in un container
docker top CONTAINER_ID

# Mettere in pausa/riprendere
docker pause CONTAINER_ID
docker unpause CONTAINER_ID
```
