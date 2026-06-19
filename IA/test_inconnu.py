
import requests

url = "http://localhost:5000/scan-group"

image_path = r"C:\Users\HP\Downloads\image/11.jpeg"

with open(image_path, "rb") as f:

    r = requests.post(url, files={"image": f})

print(r.json())

