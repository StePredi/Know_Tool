import socket

SERVER_ADDRESS = ('localhost', 5000)

server_sock = socket.socket()


server_sock.bind(SERVER_ADDRESS)
server_sock.listen(5)

conn, addr = server_sock.accept()
print(f"nuovo client connesso con indirizzo: {addr}")

while True:
    data = conn.recv(1024)
    if not data:
        break
    conn.send(data)
conn.close()
