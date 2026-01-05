#!/bin/bash

echo "🚀 Démarrage de l'application NestJS Chat..."

# Nettoyer les anciens conteneurs
echo "🧹 Nettoyage des anciens conteneurs..."
docker-compose down

# Construire et démarrer backend + PostgreSQL
echo "🐳 Lancement du backend et PostgreSQL..."
docker-compose up -d postgres backend

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 10

# Vérifier l'état
echo "📊 État des services:"
docker ps

echo ""
echo "✅ Backend NestJS: http://localhost:3000"
echo "✅ PostgreSQL: localhost:5433"
echo ""
echo "Pour lancer le frontend:"
echo "  cd frontend && npm start"
echo ""
echo "Le frontend sera accessible sur http://localhost:3002"
