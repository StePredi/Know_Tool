from framesocket import FrameSocket

s = FrameSocket()
s.connect(("localhost", 5000))
payload = "hello world " * 10000

s.send(payload.encode())
data = s.recv()
print(f"[CLIENT] received: {len(data)}B")