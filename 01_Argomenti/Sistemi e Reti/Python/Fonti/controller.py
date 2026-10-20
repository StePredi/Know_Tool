import paho.mqtt.client as mqtt
import json, threading, logging, time
from datetime import datetime
from pathlib import Path

#--------Variabili costanti-----------------------
_ROOT    = Path(__file__).resolve().parent.parent
LOG_FILE = _ROOT / 'logs' / 'controller.log'

BROKER_HOST = 'mqtt.ssh.edu.it'
BROKER_PORT = 1883

TOPIC_DATI   = 'allarme/dati/sp'
TOPIC_ALERT  = 'allarme/alert/sp'
TOPIC_STATO  = 'allarme/stato/sp'
TOPIC_CMD    = 'allarme/cmd/sp'
TOPIC_CONFIG = 'allarme/config/sp'

#file_handler = logging.FileHandler(LOG_FILE)
#file_handler.setLevel(logging.DEBUG)
#console_handler = logging.StreamHandler()
#console_handler.setLevel(logging.WARNING)  # protegge il menu
#logging.basicConfig(
#    level=logging.DEBUG,
#    format="[%(asctime)s] [%(name)s] %(levelname)s: %(message)s",
#    datefmt="%H:%M:%S",
#    handlers=[file_handler, console_handler]
#)
#--------------------------------------------------------------------

#--------Client MQTT per il Controller-----------------------
class Client_MQTT(mqtt.Client):
    #Costruttore
    def __init__(self, broker, port):
        super().__init__(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.broker = broker
        self.port = port
        self.is_connected = False
        self.logger = logging.getLogger("ClientMQTT")
        self.stato_sistema = {}  # aggiornato da on_message

    #Callback di connessione
    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            self.logger.info("connesso al broker")
            self.subscribe(TOPIC_STATO, qos=1)
            self.logger.debug(f"iscritto a {TOPIC_STATO}")
        else:
            self.logger.error(f"connessione fallita, result code: {rc}")
    
    #Callback di disconnessione
    def on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        self.is_connected = False
        if rc != 0:
            self.logger.warning(f"disconnessione inaspettata, result code: {rc}")
        else:
            self.logger.info("disconnesso dal broker")

    #Callback di ricezione messaggi
    def on_message(self, client, userdata, message):
        try:
            self.stato_sistema = json.loads(message.payload.decode('utf-8'))
            self.logger.debug(f"stato aggiornato: {self.stato_sistema}")
        except json.JSONDecodeError as e:
            self.logger.error(f"errore parsing JSON: {e}")

    #Funzione per connettersi al broker
    def connect_to_broker(self):
        try:
            self.connect(self.broker, self.port, keepalive=60)
            self.loop_start()
        except Exception as e:
            self.logger.error(f"errore connessione: {e}")

    #Funzione per pubblicare messaggi
    def publish_message(self, topic, payload, qos=0, retain=False):
        if self.is_connected:
            self.publish(topic, payload=json.dumps(payload), qos=qos, retain=retain)
            self.logger.debug(f"pubblicato su {topic}: {payload}")
        else:
            self.logger.warning("impossibile pubblicare — non connesso")

    #Funzione per disconnettersi dal broker
    def disconnect_from_broker(self):
        self.loop_stop()
        self.disconnect()
#-------------------------------------------------------------------------------------------------

#------------------------------Controller------------------------------
class Controller:
    #Costruttore    
    def __init__(self):
        self.logger = logging.getLogger("Controller")
        self.client = Client_MQTT(BROKER_HOST, BROKER_PORT)

    #Funzione per stampare lo stato corrente del sistema
    def stampa_stato(self):
        s = self.client.stato_sistema
        if s:
            print(f"\n  Stato:    {s.get('stato', '---')}")
            print(f"  Sorgente: {s.get('src', '---')}")
            print(f"  Temp:     {s.get('temp', '---')}°C")
            print(f"  Soglia:   {s.get('th', '---')}°C")
            print(f"  Mute:     {'SI' if s.get('mute') else 'NO'}")
        else:
            print("\n  Stato non ancora ricevuto dal broker")
    
    #Funzione per inviare comandi al sistema
    def invia_comando(self, cmd):
        payload = {'cmd': cmd, 'from': 'controllerSP'}
        self.client.publish_message(TOPIC_CMD, payload, qos=1)
        self.logger.info(f"comando inviato: {cmd}")
        print(f"  → comando '{cmd}' inviato")

    #Funzione per impostare la soglia di temperatura
    def imposta_soglia(self):
        try:
            valore = float(input("  Nuova soglia (20.0 - 50.0): "))
            if 20.0 <= valore <= 50.0:
                payload = {'th': valore}
                self.client.publish_message(TOPIC_CONFIG, payload, qos=1, retain=True)
                self.logger.info(f"soglia impostata: {valore}")
                print(f"  → soglia impostata a {valore}°C")
            else:
                print("  ✗ valore fuori range")
        except ValueError:
            print("  ✗ valore non valido")

    #Funzione per impostare l'intervallo di campionamento
    def imposta_intervallo(self):
        try:
            valore = int(input("  Nuovo intervallo in ms (100 - 5000): "))
            if 100 <= valore <= 5000:
                payload = {'interval': valore}
                self.client.publish_message(TOPIC_CONFIG, payload, qos=1, retain=True)
                self.logger.info(f"intervallo impostato: {valore}")
                print(f"  → intervallo impostato a {valore}ms")
            else:
                print("  ✗ valore fuori range")
        except ValueError:
            print("  ✗ valore non valido")

    #Funzione per costruire le righe da stampare nella dashboard
    def menu(self):
        comandi = {
            '1': ('ALARM:ON',    'Attiva allarme da remoto'),
            '2': ('ALARM:OFF',   'Disattiva allarme'),
            '3': ('SET:MUTE:ON', 'Attiva MUTE'),
            '4': ('SET:MUTE:OFF','Disattiva MUTE'),
            '5': ('PING',        'Test connessione MCU'),
        }
        while True:
            print("\n── Pannello di controllo allarme ──")
            self.stampa_stato()
            print("\n  Comandi disponibili:")
            for k, (cmd, desc) in comandi.items():
                print(f"    {k}) {desc}")
            print("    6) Imposta soglia temperatura")
            print("    7) Imposta intervallo campionamento")
            print("    0) Esci")
            scelta = input("\n  Scelta: ").strip()
            if scelta in comandi:
                self.invia_comando(comandi[scelta][0])
            elif scelta == '6':
                self.imposta_soglia()
            elif scelta == '7':
                self.imposta_intervallo()
            elif scelta == '0':
                break
            else:
                print("✗ scelta non valida")

    #Funzione per avviare il controller
    def avvia(self):
        self.client.connect_to_broker()
        self.logger.info("controller avviato")
        time.sleep(0.5)  # attende retained message da TOPIC_STATO
        self.menu()

    #Funzione per chiudere il controller (ClientMQTT)
    def chiudi(self):
        self.client.disconnect_from_broker()
        self.logger.info("controller chiuso")
#------------------------------------------------------------------------------------------

#------------------------------Main------------------------------
if __name__ == "__main__":
    file_handler = logging.FileHandler(LOG_FILE)
    file_handler.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    logging.basicConfig(
        level=logging.DEBUG,
        format="[%(asctime)s] [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
        handlers=[file_handler, console_handler]
    )
    controller = Controller()
    try:
        controller.avvia()
    except KeyboardInterrupt:
        pass
    finally:
        controller.chiudi()
        print("\n  Controller chiuso")
#------------------------------------------------------------------------------------------