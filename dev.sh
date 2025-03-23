#!/bin/bash

# Simplified development environment startup script
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

cd landing || {
  log "ERROR: Could not change to landing directory"
  exit 1
}
docker compose down
check_error "Failed to stop landing containers"

# Start the combined development environment
log "Starting combined development environment..."
docker compose up -d dev
check_error "Failed to start development services"

# Follow logs
log "Development environment started. Following logs..."
docker compose logs -f

# Handle exit
log "Development environment stopped."