#!/bin/bash

# Simplified script to rebuild and redeploy the website
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

# Clean previous build artifacts
log "Cleaning previous build artifacts..."
rm -rf dist
check_error "Failed to clean dist directory"
mkdir -p dist
check_error "Failed to create clean dist directory"

# Run the build container to generate the dist
log "Building static assets..."
docker compose run --rm build
check_error "Failed to build static assets"

# Verify build output
if [ ! -f "dist/index.html" ]; then
  log "ERROR: Build failed - index.html not found in dist folder"
  exit 1
fi
log "Build files verified successfully"

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