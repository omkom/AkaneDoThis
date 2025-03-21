#!/bin/bash

# Production startup script with enhanced error handling
LOGFILE="prod_log.txt"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Function to check container status
check_container() {
  local service=$1
  local retries=$2
  local delay=$3
  local attempt=1
  
  while [ $attempt -le $retries ]; do
    if docker compose ps | grep -q "$service.*Up"; then
      return 0
    fi
    log "Waiting for $service to start (attempt $attempt/$retries)..."
    sleep $delay
    attempt=$((attempt+1))
  done
  
  log "ERROR: $service container failed to start!"
  docker compose logs $service | tail -n 20 | tee -a $LOGFILE
  return 1
}

# Clear previous log
echo "" > $LOGFILE
log "Starting production environment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  log "WARNING: .env file not found. Creating a template .env file..."
  cat << EOF > .env
# Twitch API credentials
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# Environment settings
NODE_ENV=production
EOF
  log "Created .env file. Please edit it with your actual credentials."
  log "Continuing with startup, but services might not function correctly without proper credentials."
fi

# Check if the dist directory exists before starting
if [ ! -d "./landing/dist" ] || [ ! "$(ls -A ./landing/dist)" ]; then
  log "ERROR: The 'landing/dist' directory does not exist or is empty!"
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
sleep 5 # Initial delay to allow containers to initialize

# Check core services
check_container "nginx" 5 5 || log "WARNING: Proceeding anyway, but the application might not be accessible"
check_container "landing" 5 5 || log "WARNING: Proceeding anyway, but the landing page might not be available"
check_container "n8n" 5 5 || log "WARNING: n8n container failed to start. Automation services will not be available."

# Check if the application is accessible
log "Checking application accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|301\|302"; then
  log "✅ Application is accessible at http://localhost/"
else
  log "⚠️ Application doesn't seem to be responding correctly at http://localhost/"
  log "Check the container logs for more details:"
  log "  docker compose logs nginx"
  log "  docker compose logs landing"
fi

log "Production environment started."
log "Access points:"
log "- Landing page: http://localhost/"
log "- n8n: http://localhost/n8n/"

log "To view logs:"
log "  docker compose logs -f"
log "To stop the environment:"
log "  docker compose down"