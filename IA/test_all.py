import requests
import os

dataset = r"C:/Users/HP/Downloads/dataset"

for person in os.listdir(dataset):
    person_folder = os.path.join(dataset, person)
    first_image = os.listdir(person_folder)[0]
    image_path = os.path.join(person_folder, first_image)
    with open(image_path, "rb") as f:
        r = requests.post("http://localhost:5000/recognize", files={"image": f})
    result = r.json()
    print(f"{person} → {result}")
