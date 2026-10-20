import socket

sock = socket.socket()

sock.connect(("192.168.14.77", 5173))

while True:
    messaggio = input("inserisci un messaggio per il server (q per uscire)")

    if messaggio == "q":
        break

    sock.send(messaggio.encode())
    data = sock.recv(1024)

    print(f"messaggio di ritorno {data}")

sock.close()
