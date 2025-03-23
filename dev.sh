#!/bin/bash

# Enhanced development environment startup script with API support
LOGFILE="dev_log.txt"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Function to check for errors
check_error() {
  if [ $? -ne 0 ]; then
    log "ERROR: $1"
    exit 1
  fi
}

# Clear previous log
echo "" > $LOGFILE
log "Starting development environment..."

# Stop all running containers
log "Stopping all running containers..."
docker compose down
check_error "Failed to stop main containers"

cd landing
docker compose down
check_error "Failed to stop landing containers"
cd ..

# Clean Docker cache
log "Cleaning Docker cache..."
docker system prune -f --volumes
check_error "Failed to clean Docker cache"

# Clean Nginx cache if exists
log "Cleaning Nginx cache..."
if [ -d "./nginx/cache" ]; then
  rm -rf ./nginx/cache/*
  check_error "Failed to clean Nginx cache"
fi


# Use landing dev service
log "Starting landing development environment..."
cd landing || {
  log "ERROR: Could not change to landing directory"
  exit 1
}

# Build the containers from scratch to incorporate changes
log "Building containers from scratch..."
docker compose build --no-cache
check_error "Failed to build containers"

# Start the development environment with both API and dev servers
log "Starting development environment with API support..."
docker compose up -d api
check_error "Failed to start API server"

log "Waiting for API server to initialize..."
sleep 10

# Check if API is responding
log "Checking API health..."
curl -s http://localhost:3000/api/health || {
  log "WARNING: API health check failed, but continuing..."
}

log "Starting Vite development server..."
docker compose up dev

# Handle exit
log "Development environment stopped."