# SmartAbsence — Service IA Reconnaissance Faciale

## Structure

```
IA/
├── encode_faces.py   ← lancer UNE SEULE FOIS pour générer encodings.pkl
├── app.py            ← serveur Flask
├── requirements.txt
├── encodings.pkl     ← généré automatiquement (ignoré par git)
└── dataset/          ← photos des étudiants (ignoré par git)
    └── Nouhaila elhamal/
        ├── photo1.jpg
        └── ...
```

## Installation

```bash
pip install cmake
pip install dlib
pip install face_recognition flask flask-cors numpy Pillow
```

## Utilisation

### Étape 1 — Générer les encodages (une seule fois)
```bash
python encode_faces.py
```

### Étape 2 — Lancer le serveur
```bash
python app.py
```

## Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/recognize` | 1 visage → nom + confiance |
| POST | `/scan-group` | Plusieurs visages → présent/absent |
| POST | `/add-student` | Ajouter étudiant dynamiquement |
| GET | `/health` | Statut du service |

## Exemples

### POST /scan-group
```json
{
  "present": ["Nouhaila elhamal"],
  "absent": [],
  "total_detected": 1
}
```

### POST /add-student
```
name=Etudiant1
filiere=INFO
image=<fichier>
```

### POST /recognize
```json
{
  "name": "Nouhaila elhamal",
  "confidence": 0.90
}
```
