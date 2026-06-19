import face_recognition
import os
import pickle
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

DATASET_PATH   = r"C:\Users\HP\Downloads\dataset"
ENCODINGS_FILE = "encodings.pkl"
TMP_FILE       = "tmp_encode.png"


def augment_image(pil_img):
    """Génère 10 variations pour maximiser la robustesse."""
    img = pil_img.convert("RGB")
    return [
        img,                                                        # 1. Original
        ImageEnhance.Brightness(img).enhance(1.4),                 # 2. Luminosité ++
        ImageEnhance.Brightness(img).enhance(0.6),                 # 3. Luminosité --
        ImageEnhance.Contrast(img).enhance(1.5),                   # 4. Contraste +
        ImageEnhance.Contrast(img).enhance(0.7),                   # 5. Contraste -
        img.transpose(Image.FLIP_LEFT_RIGHT),                      # 6. Miroir horizontal
        ImageEnhance.Sharpness(img).enhance(2.0),                  # 7. Netteté +
        ImageEnhance.Color(img).enhance(0.0),                      # 8. Niveaux de gris
        img.filter(ImageFilter.GaussianBlur(radius=1)),            # 9. Légèrement flou
        ImageEnhance.Brightness(
            img.transpose(Image.FLIP_LEFT_RIGHT)).enhance(1.2),    # 10. Miroir + luminosité
    ]


encodings = []
names     = []

print("[INFO] Lecture du dataset :", DATASET_PATH)
print("[INFO] Augmentation : 10 variations par image")
print("-" * 60)

for person_name in os.listdir(DATASET_PATH):
    person_folder = os.path.join(DATASET_PATH, person_name)
    if not os.path.isdir(person_folder):
        continue

    print(f"\n[INFO] Encodage de : {person_name}")
    total = 0

    for image_name in os.listdir(person_folder):
        if not image_name.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
            continue

        image_path = os.path.join(person_folder, image_name)

        try:
            pil_img = Image.open(image_path).convert("RGB")
            pil_img.thumbnail((1000, 1000))  # Plus grande pour meilleure qualité

            variations = augment_image(pil_img)
            encoded    = 0

            for i, var in enumerate(variations):
                try:
                    var.save(TMP_FILE)
                    image = face_recognition.load_image_file(TMP_FILE)
                    # upsample=2 pour mieux détecter les petits visages
                    locs  = face_recognition.face_locations(
                        image, number_of_times_to_upsample=2, model="hog"
                    )
                    face_encs = face_recognition.face_encodings(image, locs)

                    if len(face_encs) > 0:
                        encodings.append(face_encs[0])
                        names.append(person_name)
                        encoded += 1
                except Exception:
                    pass

            if encoded > 0:
                print(f"  [OK] {image_name} → {encoded}/10 variations encodées")
                total += encoded
            else:
                print(f"  [WARN] {image_name} — aucun visage détecté")

        except Exception as e:
            print(f"  [ERR] {image_name} — {e}")

    print(f"  → Total : {total} encodage(s) pour {person_name}")

# Nettoyer
if os.path.exists(TMP_FILE):
    os.remove(TMP_FILE)

with open(ENCODINGS_FILE, "wb") as f:
    pickle.dump({"encodings": encodings, "names": names}, f)

print("\n" + "=" * 60)
print(f"[DONE] {len(encodings)} encodage(s) sauvegardés dans {ENCODINGS_FILE}")
print(f"[DONE] Étudiants : {list(set(names))}")
print(f"[DONE] Moyenne   : {len(encodings) // max(len(set(names)), 1)} encodages/étudiant")
