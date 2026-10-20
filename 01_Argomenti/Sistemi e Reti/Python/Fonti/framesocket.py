import socket, struct

HEADER_SIZE = 4

class FrameSocket:
    '''classe di socket in grado di inviare/ricevere frame con struttura:
        - HEADER(4B) - contiene lunghezza del payload
        - payload - messaggio vero e proprio
    '''
    def __init__(self, sock = None):
        if not sock:
            sock = socket.socket()
        self.sock = sock

    def bind(self, address):
        self.sock.bind(address)

    def listen(self, backlog = 5):
        self.sock.listen(backlog)

    def connect(self, address):
        self.sock.connect(address)

    def close(self):
        self.sock.close()

    def accept(self):
        conn, addr = self.sock.accept()
        return FrameSocket(conn), addr

    #--------------INVIO-----------------------
    def send(self, payload):
        '''metodo che costruisce il frame a partire dal payload e si assicura di spedirlo completamente'''

        payload_length = len(payload)                           #determina lunghezza payload
        header = struct.pack("!I", payload_length)      #header = lunghezza payload in formato unsigned int a 4B - rappresentazione big-endian
        frame = header + payload                                #costruisci frame concatenando header e payload

        bytes_sent = 0                                          #contatore byte inviati
        while bytes_sent < HEADER_SIZE + payload_length:        #finchè non hai spedito tutto...
            chunk = frame[:1024]                                #...prendi una porzione del frame
            n = self.sock.send(chunk)                           #...invia porzione
            bytes_sent += n                                     #incrementa contatore della quantità effettivamente inviata
            frame = frame[n:]                                   #riduci frame eliminando dati già inviati
        return bytes_sent

    #-----------RICEZIONE-------------
    def recv_exactly(self, n):
        '''metodo che riceve esattamente n byte'''

        data = []
        while len(data) < n:                                            #finchè non hai ricevuto la quantità di byte attesa...
            byte_mancanti = n - len(data)                               #...determina quantità mancante
            byte_received = self.sock.recv(min(byte_mancanti, 1024))    #...ricevi 1024 byte (o meno se la porzione mancante è più piccola)
            if not byte_received:                                       #...se il client ha chiuso la connessione...
                return None                                             #......termina
            data.append(byte_received)                                       #...aggiorna dati ricevuti
        return b''.join.(data)

    def recv(self):
        '''metodo che riceve un frame di dati'''
        header = self.recv_exactly(HEADER_SIZE)
        if not header:
            return None

        payload_length = struct.unpack("!I", header)[0]
        return self.recv_exactly(payload_length)





