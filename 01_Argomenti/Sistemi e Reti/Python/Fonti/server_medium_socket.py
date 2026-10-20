import socket, threading

class Gestore_Client(threading.Thread):
    def __init__(self, conn, addr):
        super.__init__(daemon = True)
        self.conn = conn
        self.addr = addr

    def run(self):
        while True:
            data = self.conn.recv(1024)
            if not data:
                print(f"client {self.addr} disconesso")
                break
            self.conn.send(data)
        self.conn.close()

SERVER_ADDRESS = ('localhost', 5000)

server_sock = socket.socket()
server_sock.bind(SERVER_ADDRESS)
server_sock.listen(5)

print("Server in ascolto")

try:
    while True:
        conn, addr = server_sock.accept()
        print(f"Nuovo Client connesso: {addr}")
        t = Gestore_Client(conn, addr)
        t.start()
except KeyboardInterrupt:
    server_sock