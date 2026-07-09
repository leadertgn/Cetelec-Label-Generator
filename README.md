# Cetelec Label Generator

Outil d'**automatisation industrielle** de génération d'étiquettes électriques haute précision,
développé pour **Cetelec SA**. L'application remplace la conception manuelle des étiquettes par
une impression fidèle au millimètre (1:1), éliminant les erreurs de format.

🔗 **Démo en ligne : [cetelec-label-generator.onrender.com](https://cetelec-label-generator.onrender.com)**

> ⚠️ **Application optimisée exclusivement pour un usage sur PC** (souris/clavier) en raison des
> contraintes d'impression précise et de gestion des formats d'étiquettes.

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

---

## ✨ Points clés

- 🖨️ **Fidélité d'impression absolue (1:1)** grâce aux unités millimétriques CSS et `@media print`
- ⚡ **–70 % de temps de conception** et **zéro rebut** dû aux erreurs de format
- 🗂️ **Gestion par lots** pour uniformiser les styles d'étiquettes
- 🔖 Organisation par **projets**, **sections** et **étiquettes**

---

## 🏗️ Architecture

Monorepo npm (workspaces) avec deux applications :

```
Cetelec-Label-Generator/
├── frontend/    # SPA — React + Vite (interface de conception & impression)
└── backend/     # API REST — Node.js + Express + Prisma + PostgreSQL
```

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React · Vite · CSS Print (`@media print`, unités mm) |
| **Backend** | Node.js · Express · Prisma ORM |
| **Base de données** | PostgreSQL |

**Modèles de données** : `User`, `Project`, `Section`, `Label`.

---

## 🚀 Installation locale

### Prérequis
- Node.js et npm
- Une base PostgreSQL

### 1. Cloner et installer
```bash
git clone https://github.com/leadertgn/Cetelec-Label-Generator.git
cd Cetelec-Label-Generator
npm run install:all        # installe racine + frontend + backend
```

### 2. Configurer la base de données
Crée un fichier `backend/.env` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cetelec?schema=public"
```
Puis applique le schéma Prisma :
```bash
cd backend
npm run generate
npm run migrate
```

### 3. Lancer en développement
Depuis la racine du projet, dans deux terminaux :
```bash
npm run dev:backend        # API
npm run dev:frontend       # Interface
```

---

## 📦 Scripts (racine)

| Commande | Rôle |
|----------|------|
| `npm run install:all` | Installe toutes les dépendances (racine + workspaces) |
| `npm run dev:frontend` | Lance le frontend |
| `npm run dev:backend` | Lance le backend |
| `npm run build` | Build de production du frontend |
| `npm start` | Démarre le backend en production |

---

## 👤 Auteur

**Eméric R. S. Tognon** — Développeur Full Stack & Systèmes Embarqués
🌐 [leadertgn.me](https://leadertgn.me) · 💼 [LinkedIn](https://www.linkedin.com/in/tognon-emeric)
