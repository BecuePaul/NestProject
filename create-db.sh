#!/bin/bash
# Script to create the nest_chat database

echo "Creating nest_chat database..."
docker exec -it nest-chat-db psql -U postgres -c "CREATE DATABASE nest_chat;"
echo "✅ Database created successfully!"
