
import requests

url = "http://localhost:5000/add-student"

image_path = r"C:\Users\HP\Downloads\image\22.jpeg"

with open(image_path, "rb") as f:

    r = requests.post(url, 

        data={"name": "Nouhaila elhamal", "filiere": "INFO"}, 

        files={"image": f})

print(r.json())

