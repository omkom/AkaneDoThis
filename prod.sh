#!/bin/bash

# Improved production startup script with error handling
LOGFILE="prod_log.txt"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Clear previous log
echo "" > $LOGFILE

log "Starting production environment..."

# Check if the dist directory exists before starting
if [ ! -d "./landing/dist" ]; then
  log "ERROR: The 'landing/dist' directory does not exist!"
  log "You need to run './build.sh' first to build the application."
  exit 1
fi

# Check if nginx.conf exists
if [ ! -f "./nginx/nginx.conf" ]; then
  log "ERROR: nginx.conf is missing!"
  log "Please ensure the nginx configuration file exists at ./nginx/nginx.conf"
  exit 1
fi

# Stop any running containers
log "Stopping any existing containers..."
docker compose down

# Start the production environment
log "Starting containers..."
docker compose up -d

# Verify services started correctly
log "Verifying services..."
sleep 5 # Give containers time to start

# Check if services are running
if ! docker compose ps | grep -q "nginx.*Up"; then
  log "ERROR: Nginx container failed to start!"
  log "Container logs:"
  docker compose logs nginx | tail -n 20 | tee -a $LOGFILE
  exit 1
fi

if ! docker compose ps | grep -q "landing.*Up"; then
  log "ERROR: Landing page container failed to start!"
  log "Container logs:"
  docker compose logs landing | tail -n 20 | tee -a $LOGFILE
  exit 1
fi

if ! docker compose ps | grep -q "n8n.*Up"; then
  log "WARNING: n8n container failed to start. Some functionality may be limited."
  log "Container logs:"
  docker compose logs n8n | tail -n 20 | tee -a $LOGFILE
fi

# Check if the application is accessible
log "Checking application accessibility..."
if ! curl -s http://localhost/ > /dev/null; then
  log "WARNING: Application doesn't seem to be responding at http://localhost/"
  log "This could be due to the application still starting up, or there may be configuration issues."
  log "Check the container logs for more details:"
  log "  docker compose logs nginx"
  log "  docker compose logs landing"
else
  log "Application is responding at http://localhost/"
fi

log "Production environment started."
log "Access points:"
log "- Landing page: http://localhost/"
log "- n8n: http://localhost/n8n/"

log "To view logs:"
log "  docker compose logs -f"
log "To stop the environment:"
log "  docker compose down"