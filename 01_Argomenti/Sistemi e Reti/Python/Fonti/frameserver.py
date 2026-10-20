from framesocket import FrameSocket
import threading

def gestisci_client(conn, addr):
    print(f"[SERVER] new client @{addr} connected!")
    while True:
        data = conn.recv()
        if not data:
            conn.close()
            return
        print(f"[SERVER] received: {len(data)}B")
        conn.send(data)

server = FrameSocket()
server.bind(('', 5000))
server.listen()

try:
    while True:
        conn, addr = server.accept()
        t = threading.Thread(target = gestisci_client, args=(conn, addr), daemon = True)
        t.start()
except KeyboardInterrupt:
    server.close()