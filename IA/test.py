
import requests

import time

url_base = "http://localhost:5000"

image_path = r"C:/Users/HP/Downloads/dataset/Nouhaila elhamal/7.jpeg"

print("=" * 50)

print("TEST 1 - /recognize")

print("=" * 50)

start = time.time()

with open(image_path, "rb") as f:

    r = requests.post(url_base + "/recognize", files={"image": f})

print("Temps   :", round(time.time() - start, 2), "s")

print("Reponse :", r.json())

print("=" * 50)

print("TEST 2 - /scan-group")

print("=" * 50)

start = time.time()

with open(image_path, "rb") as f:

    r = requests.post(url_base + "/scan-group", files={"image": f})

print("Temps   :", round(time.time() - start, 2), "s")

print("Reponse :", r.json())

print("=" * 50)

print("TEST 3 - /health")

print("=" * 50)

r = requests.get(url_base + "/health")

print("Reponse :", r.json())

