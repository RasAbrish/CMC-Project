#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Ensure upload directory exists
mkdir -p "$UPLOAD_DIR"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node server.js
