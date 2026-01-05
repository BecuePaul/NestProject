# NestChat - Application de Chat en Temps Réel

Application de messagerie instantanée développée avec NestJS (backend) et React (frontend).

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose installés
- Ports 3000, 5432 et 8080 disponibles

### Lancer l'application

```bash
docker compose up --build
```

L'application sera accessible à l'adresse : **http://localhost:8080**

### Arrêter l'application

```bash
docker compose down
```

## 📝 Fonctionnalités

- ✅ Inscription et connexion des utilisateurs
- ✅ Messagerie en temps réel (WebSocket)
- ✅ Création de salons privés
- ✅ Invitation de membres aux salons
- ✅ Réactions emoji sur les messages
- ✅ Indicateur de saisie en cours
- ✅ Personnalisation du profil (nom et couleur)
- ✅ Gestion de l'accès à l'historique des messages

## 🛠️ Technologies

- **Backend** : NestJS, PostgreSQL, Socket.io, TypeORM, JWT
- **Frontend** : React, TypeScript, TailwindCSS, Socket.io-client
- **Infrastructure** : Docker, Docker Compose

## 📦 Architecture

```
├── backend/          # API NestJS
├── frontend/         # Application React
└── docker-compose.yml
```

---

Développé par Paul Becue
