import paho.mqtt.client as mqtt
import json, os, time, logging
from datetime import datetime
from collections import deque
from pathlib import Path
from colorama import init, Fore, Style
init()

# -------Variabili costanti---------------------------------
_ROOT    = Path(__file__).resolve().parent.parent
LOG_FILE = _ROOT / 'logs' / 'monitor.log'

BROKER_HOST  = 'mqtt.ssh.edu.it'
BROKER_PORT  = 1883
TOPIC_DATI   = 'allarme/dati/sp'
TOPIC_ALERT  = 'allarme/alert/sp'
TOPIC_STATO  = 'allarme/stato/sp'

ROSSO     = Fore.LIGHTRED_EX
VERDE     = Fore.LIGHTGREEN_EX
GIALLO    = Fore.LIGHTYELLOW_EX
CIANO     = Fore.LIGHTCYAN_EX
GRASSETTO = Style.BRIGHT
RESET     = Style.RESET_ALL
#------------------------------------------------------------

#--------------------------Client MQTT per il Monitor-----------------------
class Client_MQTT(mqtt.Client):
    #Costruttore
    def __init__(self, broker, port, monitor):
        super().__init__(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.broker  = broker
        self.port    = port
        self.monitor = monitor
        self.logger  = logging.getLogger("ClientMQTT")

    #Callback di connessione
    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.logger.info("connesso al broker")
            self.subscribe(TOPIC_DATI,  qos=0)
            self.subscribe(TOPIC_ALERT, qos=1)
            self.subscribe(TOPIC_STATO, qos=1)
        else:
            self.logger.error(f"connessione fallita, result code: {rc}")

    #Callback di disconnessione
    def on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        if rc != 0:
            self.logger.warning(f"disconnessione inaspettata, result code: {rc}")
        else:
            self.logger.info("disconnesso dal broker")

    #Callback di ricezione messaggi
    def on_message(self, client, userdata, message):
        try:
            payload = json.loads(message.payload.decode('utf-8'))
            self.logger.debug(f"messaggio ricevuto su {message.topic}")
            if message.topic == TOPIC_DATI:
                self.monitor.aggiorna_dati(payload)
            elif message.topic == TOPIC_ALERT:
                self.monitor.aggiorna_alert(payload)
            elif message.topic == TOPIC_STATO:
                self.monitor.aggiorna_stato(payload)
        except json.JSONDecodeError as e:
            self.logger.error(f"errore parsing JSON: {e}")

    #Funzione per connettersi al broker
    def connect_to_broker(self):
        try:
            self.connect(self.broker, self.port, keepalive=60)
        except Exception as e:
            self.logger.error(f"errore connessione: {e}")

    #Funzione per disconnettersi dal broker
    def disconnect_from_broker(self):
        self.loop_stop()
        self.disconnect()
#---------------------------------------------------------------------------------

#-----------------------------------Monitor--------------------------------
class Monitor:
    #Costruttore
    def __init__(self):
        self.logger = logging.getLogger("Monitor")
        self.client = Client_MQTT(BROKER_HOST, BROKER_PORT, self)
        self.dato_corrente = {}
        self.stat = {
            'n_campioni': 0,
            'temp_max':   -999.0,
            'temp_min':    999.0,
            'n_allarmi':   0,
            'avvio':       datetime.now()
        }
        self.eventi = deque(maxlen=10)

    #Funzione per aggiornare i dati correnti e le statistiche
    def aggiorna_dati(self, payload):
        self.dato_corrente = payload
        temp = payload.get('temp', 0)
        self.stat['n_campioni'] += 1
        if temp > self.stat['temp_max']:
            self.stat['temp_max'] = temp
        if temp < self.stat['temp_min']:
            self.stat['temp_min'] = temp
        self.logger.debug(f"dati aggiornati: {payload}")

    #Funzione per aggiornare la lista degli eventi e il contatore allarmi
    def aggiorna_alert(self, payload):
        self.eventi.appendleft(payload)
        if payload.get('evento') == 'ALARM_ON':
            self.stat['n_allarmi'] += 1
        self.logger.info(f"alert ricevuto: {payload.get('evento')}")

    #Funzione per aggiornare lo stato corrente del sistema
    def aggiorna_stato(self, payload):
        self.dato_corrente = payload
        self.logger.debug(f"stato aggiornato: {payload}")

    #Funzione per colorare lo stato ON/OFF
    def colore_stato(self, stato):
        if stato == 'ON':
            return f"{ROSSO}{GRASSETTO}ON{RESET}"
        return f"{VERDE}{GRASSETTO}OFF{RESET}"

    #Funzione per formattare l'uptime in ore:minuti:secondi
    def formatta_uptime(self):
        delta = datetime.now() - self.stat['avvio']
        ore, resto = divmod(int(delta.total_seconds()), 3600)
        minuti, secondi = divmod(resto, 60)
        return f"{ore:02d}:{minuti:02d}:{secondi:02d}"

    #Funzione per formattare un evento in una riga colorata
    def formatta_evento(self, evento):
        ts         = evento.get('ts', '')[:19].replace('T', ' ')
        tipo       = evento.get('evento', '---')
        src        = evento.get('src', '---')
        temp       = evento.get('temp', '---')
        durata     = evento.get('durata')
        colore     = ROSSO if tipo == 'ALARM_ON' else VERDE
        durata_str = f"  ({durata:.0f}s)" if durata is not None else ''
        return f"  {CIANO}{ts}{RESET}  {colore}{tipo:<10}{RESET}  {src:<8}  {temp}°C{durata_str}"

    #Funzione per costruire le righe da stampare nella dashboard
    def costruisci_righe(self):
        stato = self.dato_corrente.get('stato', '---')
        src   = self.dato_corrente.get('src',   '---')
        temp  = self.dato_corrente.get('temp',  '---')
        th    = self.dato_corrente.get('th',    '---')
        mute  = self.dato_corrente.get('mute',  False)
        righe = [
            f"{GRASSETTO}{'':=<42}{RESET}",
            f"{GRASSETTO}{'MONITOR ALLARME TEMPERATURA':^42}{RESET}",
            f"{GRASSETTO}{'':=<42}{RESET}",
            f"  Temperatura:  {GIALLO}{temp}°C{RESET}",
            f"  Stato:        {self.colore_stato(stato)}",
            f"  Sorgente:     {src}",
            f"  Soglia:       {th}°C",
            f"  Mute:         {'SI' if mute else 'NO'}",
            f"{'':─<42}",
            f"{GRASSETTO}  Statistiche{RESET}",
            f"  Campioni:     {self.stat['n_campioni']}",
            f"  Temp max:     {self.stat['temp_max']}°C",
            f"  Temp min:     {self.stat['temp_min']}°C",
            f"  Allarmi:      {self.stat['n_allarmi']}",
            f"  Uptime:       {self.formatta_uptime()}",
            f"{'':─<42}",
            f"{GRASSETTO}  Ultimi eventi{RESET}",
        ]
        if self.eventi:
            for evento in self.eventi:
                righe.append(self.formatta_evento(evento))
        else:
            righe.append("  Nessun evento")
        n_padding = 10 - max(len(self.eventi), 1)
        for _ in range(n_padding):
            righe.append("")
        righe.append(f"{GRASSETTO}{'':=<42}{RESET}")
        return righe

    #Funzione per stampare la dashboard
    def stampa_dashboard(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        for riga in self.costruisci_righe():
            print(riga)

    #Funzione per avviare il monitor
    def avvia(self):
        self.logger.info("monitor avviato")
        self.client.connect_to_broker()
        self.client.loop_start()
        try:
            while True:
                self.stampa_dashboard()
                time.sleep(0.5)
        except KeyboardInterrupt:
            pass
        finally:
            self.client.disconnect_from_broker()
            self.logger.info("monitor chiuso")
            print(f"\n{RESET}monitor chiuso")
#--------------------------------------------------------------------------

#---------------------------Main--------------------------------------
if __name__ == '__main__':
    logging.basicConfig(
        level=logging.DEBUG,
        format="[%(asctime)s] [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding='utf-8')
        ]
    )
    monitor = Monitor()
    monitor.avvia()
#---------------------------------------------------------------------
