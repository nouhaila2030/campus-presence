"""
Script de diagnostic pour Hajar elasri.
Lance : python test_hajar.py
"""
import face_recognition
import pickle
import numpy as np
from PIL import Image
import os

ENCODINGS_FILE = "encodings.pkl"

# Charger les encodages
with open(ENCODINGS_FILE, "rb") as f:
    data = pickle.load(f)

known_encodings = data["encodings"]
known_names     = data["names"]

# Compter les encodages par personne
from collections import Counter
counts = Counter(known_names)
print("=== Encodages par personne ===")
for name, count in counts.items():
    print(f"  {name}: {count} encodages")

# Tester chaque photo de Hajar
print("\n=== Test reconnaissance Hajar ===")
hajar_folder = r"C:\Users\HP\Downloads\dataset\Hajar elasri"
if os.path.exists(hajar_folder):
    for img_name in os.listdir(hajar_folder):
        if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        img_path = os.path.join(hajar_folder, img_name)
        try:
            img = face_recognition.load_image_file(img_path)
            locs = face_recognition.face_locations(img, model="hog")
            encs = face_recognition.face_encodings(img, locs)
            if not encs:
                print(f"  {img_name}: ❌ Aucun visage détecté")
                continue
            enc = encs[0]
            distances = face_recognition.face_distance(known_encodings, enc)
            best_idx  = int(np.argmin(distances))
            best_dist = float(distances[best_idx])
            confidence = round(1 - best_dist, 2)
            name = known_names[best_idx]
            ok = "✅" if name == "Hajar elasri" else "❌"
            print(f"  {img_name}: {ok} → {name} (conf={confidence}, dist={round(best_dist,3)})")
        except Exception as e:
            print(f"  {img_name}: ERREUR {e}")

# Afficher les distances moyennes de Hajar vs les autres
print("\n=== Distance moyenne Hajar vs autres ===")
hajar_encs = [enc for enc, name in zip(known_encodings, known_names) if name == "Hajar elasri"]
other_names = [n for n in counts if n != "Hajar elasri"]

for other in other_names:
    other_encs = [enc for enc, name in zip(known_encodings, known_names) if name == other]
    dists = []
    for h in hajar_encs[:5]:  # 5 premiers encodages de Hajar
        for o in other_encs[:5]:
            dists.append(face_recognition.face_distance([o], h)[0])
    avg = round(float(np.mean(dists)), 3)
    print(f"  Hajar vs {other}: distance moyenne = {avg} {'⚠️ TROP PROCHE' if avg < 0.5 else '✅ OK'}")
