#!/bin/bash

# Development environment startup script
LOGFILE="dev_log.txt"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Clear previous log
echo "" > $LOGFILE
log "Starting development environment..."

# Check if .env file exists, create it if not
if [ ! -f ".env" ]; then
  log "Creating .env file with default values..."
  cat << EOF > .env
# Twitch API credentials
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# Environment settings
NODE_ENV=development
EOF
  log "Created .env file. Please edit it with your actual credentials."
fi

# Stop any running containers
log "Stopping any existing containers..."
docker compose down

# Use landing dev service
log "Starting landing development environment..."
cd landing || {
  log "ERROR: Could not change to landing directory"
  exit 1
}

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  docker compose run --rm dev npm install
fi

# Start dev environment
docker compose up dev

# Handle exit
log "Development environment stopped."