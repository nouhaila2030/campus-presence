
import requests

url = "http://localhost:5000/scan-group"

image_path = r"C:\Users\HP\Pictures\Camera Roll/1Z.jpg"

with open(image_path, "rb") as f:

    r = requests.post(url, files={"image": f})

print(r.json())

