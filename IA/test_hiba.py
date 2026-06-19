import requests
image_path = r"C:/Users/HP/Downloads/dataset/hiba hajouji/1.jpeg"
with open(image_path, "rb") as f:
    r = requests.post("http://localhost:5000/scan-group", files={"image": f})
print(r.json())
