from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import pickle
import numpy as np
import os
from PIL import Image, ImageEnhance
import io

app = Flask(__name__)
CORS(app)

ENCODINGS_FILE = "encodings.pkl"
TOLERANCE      = 0.45
MAX_IMAGE_SIZE = 1200

def load_encodings():
    if not os.path.exists(ENCODINGS_FILE):
        print("[ERROR] encodings.pkl introuvable. Lancez encode_faces.py d'abord.")
        return [], []
    with open(ENCODINGS_FILE, "rb") as f:
        data = pickle.load(f)
    print(f"[INFO] {len(data['encodings'])} encodage(s) charge(s)")
    print(f"[INFO] Etudiants : {list(set(data['names']))}")
    return data["encodings"], data["names"]

known_encodings, known_names = load_encodings()


def augment_image(pil_img):
    return [
        pil_img,
        ImageEnhance.Brightness(pil_img).enhance(1.3),
        ImageEnhance.Brightness(pil_img).enhance(0.7),
        ImageEnhance.Contrast(pil_img).enhance(1.3),
        pil_img.transpose(Image.FLIP_LEFT_RIGHT),
    ]


def prepare_image(img_bytes, max_size=None):
    tmp = "tmp_fr.png"
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    if max_size and (pil_img.width > max_size or pil_img.height > max_size):
        pil_img.thumbnail((max_size, max_size), Image.LANCZOS)
    pil_img.save(tmp, quality=95)
    image = face_recognition.load_image_file(tmp)
    if os.path.exists(tmp):
        os.remove(tmp)
    return image


def pil_to_face_recognition(pil_img):
    tmp = "tmp_aug.png"
    pil_img.save(tmp)
    image = face_recognition.load_image_file(tmp)
    if os.path.exists(tmp):
        os.remove(tmp)
    return image


# ── Endpoint 1 : Reconnaissance simple (1 visage) ───────────────────────────
@app.route("/recognize", methods=["POST"])
def recognize():
    if "image" not in request.files:
        return jsonify({"error": "Aucune image recue"}), 400

    try:
        image          = prepare_image(request.files["image"].read(), max_size=MAX_IMAGE_SIZE)
        face_locations = face_recognition.face_locations(image, model="hog")
        face_encodings = face_recognition.face_encodings(image, face_locations)

        if len(face_encodings) == 0:
            return jsonify({"name": "unknown", "confidence": 0.0,
                            "message": "Aucun visage detecte"})

        enc       = face_encodings[0]
        matches   = face_recognition.compare_faces(known_encodings, enc, tolerance=TOLERANCE)
        distances = face_recognition.face_distance(known_encodings, enc)

        if len(distances) == 0:
            return jsonify({"name": "unknown", "confidence": 0.0})

        best_idx   = int(np.argmin(distances))
        best_dist  = float(distances[best_idx])
        confidence = round(1 - best_dist, 2)

        if matches[best_idx] and best_dist <= TOLERANCE:
            return jsonify({"name": known_names[best_idx], "confidence": confidence})
        return jsonify({"name": "unknown", "confidence": confidence})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint 2 : Scan de groupe (plusieurs visages) ─────────────────────────
@app.route("/scan-group", methods=["POST"])
def scan_group():
    if "image" not in request.files:
        return jsonify({"error": "Aucune image recue"}), 400

    try:
        img_data = request.files["image"].read()
        print(f"[DEBUG] Image recue : {len(img_data)} bytes")

        with open("debug_group.jpg", "wb") as f:
            f.write(img_data)
        print("[DEBUG] Photo sauvegardee dans debug_group.jpg")

        image          = prepare_image(img_data, max_size=1600)
        face_locations = face_recognition.face_locations(image, model="hog", number_of_times_to_upsample=2)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        print(f"[DEBUG] Visages detectes : {len(face_encodings)}")

        detected_names = []

        for enc in face_encodings:
            matches   = face_recognition.compare_faces(known_encodings, enc, tolerance=TOLERANCE)
            distances = face_recognition.face_distance(known_encodings, enc)

            if len(distances) > 0:
                best_idx  = int(np.argmin(distances))
                best_dist = float(distances[best_idx])

                if matches[best_idx] and best_dist <= TOLERANCE:
                    detected_names.append(known_names[best_idx])

        all_students = list(set(known_names))
        present      = list(set(detected_names))
        absent       = [s for s in all_students if s not in present]

        return jsonify({
            "present":        present,
            "absent":         absent,
            "total_detected": len(face_encodings)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint 3 : Ajouter un etudiant ────────────────────────────────────────
@app.route("/add-student", methods=["POST"])
def add_student():
    global known_encodings, known_names

    name    = request.form.get("name")
    filiere = request.form.get("filiere", "")

    if "image" not in request.files or not name:
        return jsonify({"error": "Donnees manquantes (name + image requis)"}), 400

    try:
        img_bytes = request.files["image"].read()
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        pil_img.thumbnail((800, 800))

        student_dir = os.path.join("dataset", name)
        os.makedirs(student_dir, exist_ok=True)
        existing = len([f for f in os.listdir(student_dir)
                        if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        pil_img.save(os.path.join(student_dir, f"photo_{existing + 1}.jpg"))

        variations = augment_image(pil_img)
        encoded    = 0

        for i, var in enumerate(variations):
            try:
                image = pil_to_face_recognition(var)
                locs  = face_recognition.face_locations(
                    image, number_of_times_to_upsample=2, model="hog"
                )
                face_encs = face_recognition.face_encodings(image, locs)

                if len(face_encs) > 0:
                    known_encodings.append(face_encs[0])
                    known_names.append(name)
                    encoded += 1
                    print(f"  [OK] Variation {i+1}/5 encodee")
                else:
                    print(f"  [WARN] Variation {i+1}/5 — aucun visage detecte")

            except Exception as ve:
                print(f"  [ERR] Variation {i+1}/5 — {ve}")

        if encoded == 0:
            return jsonify({"error": "Aucun visage detecte dans la photo"}), 400

        with open(ENCODINGS_FILE, "wb") as f:
            pickle.dump({"encodings": known_encodings, "names": known_names}, f)

        print(f"[INFO] Etudiant ajoute : {name} | {encoded} encodings | Filiere : {filiere}")

        return jsonify({
            "status":          "ok",
            "student":         name,
            "filiere":         filiere,
            "encodings_added": encoded,
            "total_students":  len(set(known_names))
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint 4 : Sante du service ───────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":           "ok",
        "model":            "HOG",
        "encodings_loaded": len(known_encodings),
        "students":         list(set(known_names)),
        "confidence_min":   round(1 - TOLERANCE, 2),
        "tolerance":        TOLERANCE,
        "max_image_size":   MAX_IMAGE_SIZE
    })


if __name__ == "__main__":
    print("[INFO] SmartAbsence — Service IA Reconnaissance Faciale")
    print(f"[INFO] Seuil confidence minimum : {round(1 - TOLERANCE, 2)}")
    print(f"[INFO] Taille image max : {MAX_IMAGE_SIZE}px")
    print("[INFO] Modele : HOG (rapide)")
    print("[INFO] Augmentation : 5 variations par photo ajoutee")
    print("[INFO] Endpoints :")
    print("       POST /recognize    → 1 visage → nom + confiance")
    print("       POST /scan-group   → plusieurs visages → present/absent")
    print("       POST /add-student  → 1 photo → 5 encodings auto")
    print("       GET  /health       → statut du service")
    app.run(debug=False, host="0.0.0.0", port=5000)