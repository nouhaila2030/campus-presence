import requests

url = "http://localhost:5000/add-student"
image_path = r"C:/Users/HP/Downloads/dataset/hiba hajouji/1.jpeg"

with open(image_path, "rb") as f:
    r = requests.post(url, data={"name": "Test Etudiant", "filiere": "INFO"}, files={"image": f})

print(r.json())
