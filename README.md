# 🎓 Campus Présence — Système de Gestion des Présences par Reconnaissance Faciale

> Projet de fin d'études — Faculté des Sciences et Techniques de Marrakech (FSTG)

---

## 📌 Description

**Campus Présence** est une application complète de gestion des présences utilisant la **reconnaissance faciale par intelligence artificielle**. Le professeur prend une photo du groupe d'étudiants depuis son téléphone, l'IA détecte automatiquement les présents et absents, et les résultats sont enregistrés en base de données et consultables via une interface web.

---

## 🏗️ Architecture

```
Campus Présence
├── backend/     → API REST Spring Boot (Java)         → port 8080
├── angular/     → Interface Web Angular               → port 4200
├── mobile/      → Application Mobile React Native     → port 8081
└── IA/          → Service Reconnaissance Faciale Flask → port 5000
```

---

## ✨ Fonctionnalités

### 📱 Application Mobile (Enseignant)
- Connexion enseignant sécurisée
- Sélection de la séance du cours
- **Prise de photo du groupe** → reconnaissance faciale automatique
- Liste présents/absents avec **correction manuelle** (switch par étudiant)
- Validation et envoi des absences vers le backend
- Consultation de ses séances et absences

### 🌐 Interface Web (Angular)
- Dashboard enseignant avec accès rapide
- Prise de présence manuelle
- Liste des absences par séance avec filtres
- **Page de présences/absences par séance** (résultats du scan mobile)
- Panel administrateur : gestion étudiants, enseignants, classes
- Dashboard statistiques avec graphiques Chart.js

### 🤖 Service IA (Flask)
- Détection de visages sur photo de groupe
- Reconnaissance avec encodages multiples (5 variations par photo)
- Tolérance configurable (0.45 par défaut)
- Ajout dynamique de nouveaux étudiants au modèle

### ⚙️ Backend (Spring Boot)
- API REST complète
- Gestion : Enseignants, Étudiants, Séances, Absences, Classes, Matières
- Enregistrement automatique des absences depuis le mobile

---

## 🤖 Modèle IA

| Paramètre | Valeur |
|-----------|--------|
| Algorithme | HOG (Histogram of Oriented Gradients) |
| Bibliothèque | face_recognition + dlib ResNet-34 |
| Tolérance | 0.45 |
| Variations par photo | 5 (original, luminosité±, contraste+, miroir) |
| Précision (LFW benchmark) | ~99.38% |

---

## 🛠️ Technologies utilisées

| Couche | Technologie |
|--------|-------------|
| Backend | Java 17 + Spring Boot 3 + Spring Data JPA |
| Base de données | MySQL 8 |
| Frontend | Angular 21 + Chart.js |
| Mobile | React Native + Expo SDK 54 |
| Intelligence Artificielle | Python 3.10 + Flask + face_recognition + dlib |

---

## 🚀 Installation et lancement

### Prérequis
- Java 17+
- Node.js 18+
- Python 3.10.11
- MySQL 8
- Expo Go (sur téléphone)

---

### 1. Backend Spring Boot
```bash
cd backend
mvnw.cmd spring-boot:run
```
Créer la base de données MySQL :
```sql
CREATE DATABASE smartabsencemobile;
```
Configurer `backend/src/main/resources/application.properties` :
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartabsencemobile
spring.datasource.username=root
spring.datasource.password=
```

---

### 2. Service IA Flask
```bash
cd IA
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
> ⚠️ **Dataset non inclus** : Vous devez fournir votre propre dataset de visages.

Structure du dataset attendue :
```
IA/
└── dataset/
    ├── Prenom Nom Etudiant 1/
    │   ├── photo1.jpg
    │   └── photo2.jpg
    └── Prenom Nom Etudiant 2/
        └── photo1.jpg
```

Générer les encodages :
```bash
python encode_faces.py
```

Lancer le serveur IA :
```bash
python app.py
```

---

### 3. Frontend Angular
```bash
cd angular
npm install
npm start
```
Accès : `http://localhost:4200`

---

### 4. Application Mobile
```bash
cd mobile
npm install
npx expo start --clear
```
Scanner le QR code avec **Expo Go** sur le téléphone.

> ⚠️ **Important** : Mettre à jour l'IP WiFi dans `mobile/constants/api.ts` et `mobile/app/presence.tsx` avec l'IP de votre machine.

```bash
# Trouver votre IP WiFi
ipconfig
```

---

## 📁 Structure du projet

```
campus-presence/
├── backend/                    ← Spring Boot API
│   └── src/main/java/com/example/smartabsence/
│       ├── controller/         ← REST Controllers
│       ├── model/              ← Entités JPA
│       ├── repository/         ← Spring Data repositories
│       └── service/            ← Logique métier
│
├── angular/                    ← Frontend Web
│   └── src/app/pages/
│       ├── login/              ← Connexion enseignant
│       ├── dashboard/          ← Tableau de bord
│       ├── presences/          ← Prise de présence
│       ├── absences/           ← Liste absences
│       ├── seance-presences/   ← Résultats par séance
│       └── admin/              ← Panel admin
│
├── mobile/                     ← App React Native
│   └── app/
│       ├── index.tsx           ← Login
│       ├── home.tsx            ← Accueil
│       ├── presence.tsx        ← Scan + IA
│       ├── absences.tsx        ← Absences
│       ├── seances.tsx         ← Séances
│       └── etudiants.tsx       ← Étudiants
│
└── IA/                         ← Service Flask
    ├── app.py                  ← API Flask (4 endpoints)
    ├── encode_faces.py         ← Génération encodages
    ├── requirements.txt        ← Dépendances Python
    └── dataset/                ← ⚠️ NON INCLUS (données personnelles)
```

---

## 🔌 API Endpoints

### Backend Spring Boot (`http://localhost:8080/api`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/enseignants/login` | Connexion enseignant |
| GET | `/etudiants` | Liste étudiants |
| GET | `/etudiants/light` | Liste étudiants (sans photos) |
| GET | `/seances` | Liste séances |
| POST | `/seances` | Créer séance |
| GET | `/absences` | Liste absences |
| POST | `/absences` | Enregistrer absence |

### Service IA (`http://localhost:5000`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/scan-group` | Photo groupe → présents/absents |
| POST | `/recognize` | 1 visage → nom + confiance |
| POST | `/add-student` | Ajouter étudiant au modèle |
| GET | `/health` | Statut du service |

---

## 🎨 Design

Palette **Caramel professionnel** cohérente sur toutes les plateformes :

| Couleur | Code | Usage |
|---------|------|-------|
| Caramel foncé | `#5C3317` | Titres, headers |
| Caramel moyen | `#8B4513` | Boutons |
| Caramel doré | `#CD853F` | Accents, icônes |
| Crème | `#FAF3E0` | Fond général |
| Blanc cassé | `#FFFEF9` | Cards |

---

## ⚠️ Notes importantes

- Le **dataset de photos** n'est pas inclus dans ce dépôt (données personnelles)
- Le fichier **`encodings.pkl`** n'est pas inclus (généré depuis le dataset)
- Mettre à jour l'**adresse IP WiFi** à chaque session dans les fichiers de configuration

---

## 👨‍💻 Outils de développement

- **IntelliJ IDEA** — Backend Java
- **Visual Studio Code** — Frontend, Mobile, IA

---

*Faculté des Sciences et Techniques — Marrakech*

---

**GitHub** : [nouhaila2030](https://github.com/nouhaila2030/campus-presence)
