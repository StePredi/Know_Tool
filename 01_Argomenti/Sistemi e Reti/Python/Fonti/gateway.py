import paho.mqtt.client as mqtt
import json, threading, logging, serial, time, queue
from datetime import datetime
from pathlib import Path

#--------Variabili costanti-----------------------
_ROOT     = Path(__file__).resolve().parent.parent
LOG_FILE  = _ROOT / 'logs' / 'gateway.log'
DATA_FILE = _ROOT / 'data' / 'log.jsonl'

SERIAL_PORT = 'COM12'
SERIAL_BAUD = 9600
BROKER_HOST = 'mqtt.ssh.edu.it'
BROKER_PORT = 1883

TOPIC_DATI   = 'allarme/dati/sp'
TOPIC_ALERT  = 'allarme/alert/sp'
TOPIC_STATO  = 'allarme/stato/sp'
TOPIC_CMD    = 'allarme/cmd/sp'
TOPIC_CONFIG = 'allarme/config/sp'
#-------------------------------------------------

#--------Client MQTT per il Gateway--------------------------------------------------
class Client_MQTT(mqtt.Client):
    #Costruttore
    def __init__(self, broker, port, coda_mqtt_out):
        super().__init__(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.broker = broker
        self.port = port
        self.coda_mqtt_out = coda_mqtt_out
        self.is_connected = False
        self.logger = logging.getLogger("ClientMQTT")

    #Callback di connessione
    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            self.logger.info("Connesso al broker")
            self.subscribe(TOPIC_CMD, qos=1)
            self.subscribe(TOPIC_CONFIG, qos=1)
            self.logger.debug(f"Iscritto a {TOPIC_CMD} e {TOPIC_CONFIG}")
        else:
            self.logger.error(f"Connessione fallita, result code: {rc}")
    
    #Callback di disconnessione
    def on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        self.is_connected = False
        if rc != 0:
            self.logger.warning(f"Disconnessione inaspettata, result code: {rc}")
        else:
            self.logger.info("Disconnesso dal broker")

    #Callback di messaggio
    def on_message(self, client, userdata, message):
        try:
            payload = json.loads(message.payload.decode('utf-8'))
            self.logger.debug(f"Messaggio ricevuto su {message.topic}: {payload}")
            if message.topic == TOPIC_CMD:
                cmd = payload.get('cmd')
                if cmd:
                    self.coda_mqtt_out.put(cmd + '\n')
                    self.logger.debug(f"Comando in coda: {cmd}")
            elif message.topic == TOPIC_CONFIG:
                th = payload.get('th')
                interval = payload.get('interval')
                if th is not None:
                    self.coda_mqtt_out.put(f"SET:TH:{int(th)}\n")
                    self.logger.debug(f"Soglia in coda: {th}")
                if interval is not None:
                    self.coda_mqtt_out.put(f"SET:INT:{int(interval)}\n")
                    self.logger.debug(f"Intervallo in coda: {interval}")
        except json.JSONDecodeError as e:
            self.logger.error(f"Errore parsing JSON: {e}")
    
    #Callback di pubblicazione
    def on_publish(self, client, userdata, mid, reason_code, properties=None):
        self.logger.debug(f"Messaggio {mid} pubblicato")
    
    #Callback di iscrizione
    def on_subscribe(self, client, userdata, mid, granted_qos, properties=None):
        self.logger.debug(f"Iscritto con QoS {granted_qos}")

    #Funzione per connettersi al broker
    def connect_to_broker(self):
        try:
            self.connect(self.broker, self.port, keepalive=60)
            self.loop_start()
        except Exception as e:
            self.logger.error(f"Errore connessione: {e}")

    #Funzione per pubblicare un messaggio
    def publish_message(self, topic, payload, qos=0, retain=False):
        if self.is_connected:
            self.publish(topic, payload=json.dumps(payload), qos=qos, retain=retain)
        else:
            self.logger.warning("Impossibile pubblicare — non connesso")
    
    #Funzione per disconnettersi dal broker
    def disconnect_from_broker(self):
        self.loop_stop()
        self.disconnect()
#---------------------------------------------------------------------------------------

#--------Thread per la scrittura su file-----------------------------------
class Scrittura(threading.Thread):
    #Costruttore
    def __init__(self, coda_log, log_file):
        super().__init__(name="Scrittura", daemon=True)
        self.coda_log = coda_log # coda da cui leggere i record da scrivere
        self.log_file = log_file
        self.logger = logging.getLogger("Scrittura") 

    #Funzione principale del thread
    def run(self):
        self.logger.debug("thread avviato")
        while True:
            try:
                record = self.coda_log.get(timeout=1) 
                try:
                    with open(self.log_file, 'a') as f: #apere in modalità append
                        f.write(json.dumps(record) + '\n')
                    self.logger.debug(f"record scritto: {record}")
                except IOError as e:
                    self.logger.error(f"errore scrittura: {e}")
            except queue.Empty: #nel caso in cui la coda sia vuota, si ignora e si continua ad aspettare
                pass
#----------------------------------------------------------------------------------------------------------

#--------Thread per la comunicazione MQTT----------------------------------------------------
class MQTTComunicazione(threading.Thread):
    #Costruttore
    def __init__(self, broker, port, coda_mqtt, coda_mqtt_out):
        super().__init__(name="MQTT", daemon=True)
        self.coda_mqtt = coda_mqtt
        self.logger = logging.getLogger("MQTT")
        self.client = Client_MQTT(broker, port, coda_mqtt_out)

    #Funzione principale del thread
    def run(self):
        self.logger.debug("thread avviato")
        self.client.connect_to_broker()
        while True:
            try:
                dato = self.coda_mqtt.get(timeout=1)
                self.pubblica(dato)
            except queue.Empty:
                pass

    #Funzione per pubblicare un dato su MQTT
    def pubblica(self, dato):
        tipo = dato.get('tipo')
        if tipo == 'dati':
            self.client.publish_message(TOPIC_DATI, dato, qos=0)
            self.client.publish_message(TOPIC_STATO, dato, qos=1, retain=True)
        elif tipo == 'alert':
            self.client.publish_message(TOPIC_ALERT, dato, qos=1)

    #Funzione per chiudere la connessione MQTT
    def chiudi(self):
        self.client.disconnect_from_broker()
        self.logger.info("Disconnesso dal broker")
#------------------------------------------------------------------------------------------

#--------Thread per la comunicazione seriale--------------------------------
class SerialeComunicazione(threading.Thread):
    #Costruttore
    def __init__(self, port, baud, coda_seriale, coda_mqtt_out):
        super().__init__(name="Seriale", daemon=True)
        self.coda_seriale = coda_seriale
        self.coda_mqtt_out = coda_mqtt_out
        self.logger = logging.getLogger("Seriale")
        try:
            self.port = serial.Serial(port, baud, timeout=1)
            self.logger.info(f"Connesso su {port}")
        except serial.SerialException as e:
            self.logger.error(f"Errore apertura porta: {e}")
            self.port = None
    
    #Funzione per decodificare una riga ricevuta dalla seriale
    def decodifica_riga(self, riga):
        try:
            campi = riga.strip().split(',')
            if len(campi) < 3 or len(campi) > 4:
                self.logger.warning(f"Riga malformata: {riga}")
                return None
            record = {
                'ts': datetime.now().isoformat(),
                'temp': float(campi[0]),
                'stato': campi[1],
                'src': campi[2],
                'mute': len(campi) == 4 and campi[3] == 'MUTE'
            }
            return record
        except ValueError as e:
            self.logger.error(f"errore parsing: {e}")
            return None

    #Funzione principale del thread
    def run(self):
        if self.port is None:
            self.logger.error("porta non disponibile — thread terminato")
            return
        self.logger.debug("thread avviato")
        while True:
            try:
                # lettura dalla seriale
                if self.port.is_open and self.port.in_waiting > 0:
                    riga = self.port.readline().decode('ascii', errors='ignore')
                    self.logger.debug(f"RX <- {riga.strip()}")
                    record = self.decodifica_riga(riga)
                    if record:
                        self.coda_seriale.put(record)
                # invio comandi all'MSP
                try:
                    cmd = self.coda_mqtt_out.get_nowait()
                    self.port.write(cmd.encode('ascii'))
                    self.logger.debug(f"TX -> {cmd.strip()}")
                except queue.Empty:
                    pass
            except serial.SerialException as e:
                self.logger.error(f"errore seriale: {e}")
                break

    #Funzione per chiudere la connessione seriale
    def chiudi(self):
        if self.port and self.port.is_open:
            self.port.close()
            self.logger.info("porta seriale chiusa")
#------------------------------------------------------------------------------------------

#--------Thread principale che smista ed elabora i vari dati----------------------
class Gateway(threading.Thread):
    #Costruttore
    def __init__(self):
        super().__init__(name="Gateway", daemon=True)
        self.logger = logging.getLogger("Gateway")
        # code di comunicazione
        self.coda_seriale = queue.Queue() # coda da cui leggere i record ricevuti dalla seriale
        self.coda_mqtt = queue.Queue() # coda da cui caricare i record da pubblicare su MQTT
        self.coda_mqtt_out = queue.Queue() # coda da cui leggere i comandi ricevuti da MQTT da inviare alla seriale
        self.coda_log = queue.Queue() # coda da cui leggere i record da scrivere sul file
        # stato condiviso
        self.stato = {
            'stato': 'OFF',
            'src': '---',
            'th': 30.0,
            'alarm_start': None
        }
        #thread
        self.seriale = SerialeComunicazione(
            SERIAL_PORT, SERIAL_BAUD,
            self.coda_seriale,
            self.coda_mqtt_out
        )
        self.mqtt = MQTTComunicazione(
            BROKER_HOST, BROKER_PORT,
            self.coda_mqtt,
            self.coda_mqtt_out
        )
        self.scrittura = Scrittura(
            self.coda_log,
            DATA_FILE
        )

    #Funzione principale del thread
    def run(self):
        self.logger.debug("gateway avviato")
        self.seriale.start()
        self.mqtt.start()
        self.scrittura.start()
        while True:
            try:
                record = self.coda_seriale.get(timeout=1)
                self.gestisci_record(record)
            except queue.Empty:
                pass

    #Funzione per gestire un record ricevuto dalla seriale
    def gestisci_record(self, record):
        record['th'] = self.stato['th']

        # record normale → TOPIC_DATI
        record['tipo'] = 'dati'
        self.coda_log.put(record)
        self.coda_mqtt.put(record)

        # alert → TOPIC_ALERT + TOPIC_STATO
        alert = self.gestisci_alert(record)
        if alert:
            alert['tipo'] = 'alert'
            self.coda_mqtt.put(alert)

    #Funzione per gestire un alert e aggiornare lo stato del sistema
    def gestisci_alert(self, record):
        stato_nuovo = record['stato']
        stato_vecchio = self.stato['stato']
        if stato_nuovo == stato_vecchio:
            return None
        alert = {
            'ts': record['ts'],
            'temp': record['temp'],
        }
        if stato_nuovo == 'ON':
            alert['evento'] = 'ALARM_ON'
            alert['src'] = record['src']
            alert['durata'] = None
            self.stato['alarm_start'] = datetime.now()
            self.logger.info(f"allarme ON — sorgente: {record['src']}")
        elif stato_nuovo == 'OFF':
            alert['evento'] = 'ALARM_OFF'
            alert['src'] = record['src']
            if self.stato['alarm_start']:
                durata = (datetime.now() - self.stato['alarm_start']).total_seconds()
                alert['durata'] = durata
                self.logger.info(f"allarme OFF — durata: {durata:.1f}s")
            else:
                alert['durata'] = None
        # aggiorna stato
        self.stato['stato'] = stato_nuovo
        self.stato['src'] = record['src']
        # aggiorna th se arriva da config
        if 'th' in record:
            self.stato['th'] = record['th']
        return alert

    #Funzione per chiudere il gateway
    def chiudi(self):
        self.logger.info("chiusura gateway")
        self.seriale.chiudi()
        self.mqtt.chiudi()
#------------------------------------------------------------------------------------------

#------------------------------Main------------------------------------
if __name__ == '__main__':
    # Configurazione logging, scrive su file e console
    logging.basicConfig(
        level=logging.DEBUG,
        format="[%(asctime)s] [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler() 
        ]
    )
    gateway = Gateway()
    gateway.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        gateway.chiudi()
        logging.info("programma terminato")
#---------------------------------------------------------------------