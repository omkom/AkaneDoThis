#!/bin/bash

# Script to rebuild and redeploy the website
LOGFILE="build_log.txt"

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
log "Starting rebuild process..."

# Check if we're in the project root
if [ ! -d "landing" ]; then
  log "ERROR: landing directory not found. Make sure you're running this script from the project root."
  exit 1
fi

# Stop all running containers
log "Stopping all running containers..."
docker compose down
check_error "Failed to stop main containers"

cd landing
docker compose down
check_error "Failed to stop landing containers"
cd ..

# Clean previous build artifacts
log "Cleaning previous build artifacts..."
rm -rf landing/dist
check_error "Failed to clean dist directory"
mkdir -p landing/dist
check_error "Failed to create clean dist directory"

# Clean Docker cache
log "Cleaning Docker cache..."
docker builder prune -f
check_error "Failed to clean Docker builder cache"

# Remove any dangling images
log "Removing dangling images..."
docker image prune -f
check_error "Failed to remove dangling images"

# Rebuild landing Docker image from scratch
log "Rebuilding landing image from scratch..."
cd landing
docker compose build --no-cache build
check_error "Failed to rebuild landing image"
docker compose run --rm build npm ci
check_error "Failed to install dependencies"

docker compose run --rm build
check_error "Build process failed"

# Verify build output
docker compose run --rm build sh -c "[ -f /app/dist/index.html ]"
if [ $? -ne 0 ]; then
  log "ERROR: Build failed - index.html not found in container's dist folder"
  exit 1
fi
log "Build files verified in container"

log "Build completed successfully"
cd ..

# Clear Nginx cache if exists
if [ -d "/var/cache/nginx" ]; then
  log "Clearing Nginx cache..."
  sudo rm -rf /var/cache/nginx/*
  check_error "Failed to clear Nginx cache"
fi

# Start production environment
log "Starting production environment..."
docker compose up -d
check_error "Failed to start production environment"

# Check if website is accessible
log "Waiting for website to be accessible..."
sleep 10
curl -s -o /dev/null -w "%{http_code}" http://localhost | grep 200 > /dev/null
if [ $? -ne 0 ]; then
  log "WARNING: Website doesn't appear to be responding with HTTP 200"
  log "Check logs with: docker compose logs"
else
  log "Success! Website is accessible at http://localhost"
fi

log "Rebuild completed at $(date)"