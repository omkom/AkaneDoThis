#!/bin/bash

# Simplified development environment script with proper hot reload support

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
LOGFILE="dev_log.txt"
ENV_FILE=".env"
DEV_PORT=5174
API_PORT=3000
LOCKFILE="/tmp/akane-dev.lock"

# Check if another dev process is running
if [ -f "$LOCKFILE" ] && kill -0 "$(cat $LOCKFILE)" 2>/dev/null; then
  echo "INFO: Another development environment is already running!"
  echo "If you want to restart it, run './stop-dev.sh' first or remove $LOCKFILE"

  read -p "Do you want to view the logs of the running environment? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd landing && docker compose logs -f dev
  fi
  exit 0
fi

# Create lock file
echo $$ > "$LOCKFILE"

# Clean up on exit (but only if not following logs)
cleanup() {
  # Only remove the lock file if we're exiting the script completely
  if [ "$FOLLOWING_LOGS" != "true" ]; then
    rm -f "$LOCKFILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Development environment shutdown. Cleanup complete."
  fi
}
trap cleanup EXIT

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Clear previous log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Development environment startup" > $LOGFILE

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  log "No .env file found. Creating a template..."
  log "Please fill in the .env file with your Twitch API credentials."
  log "You can continue without them, but Twitch integration will not work."
  
  read -p "Continue without environment variables? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Development startup aborted. Please configure your environment variables first."
    exit 1
  fi
else
  # Source the environment file
  set -a
  source "$ENV_FILE"
  set +a
  
  log "Environment loaded. Using ports: DEV_PORT=$DEV_PORT, API_PORT=$API_PORT"
fi

# Check if we're in the project root
if [ ! -d "landing" ]; then
  log "ERROR: landing directory not found. Make sure you're running this script from the project root."
  exit 1
fi

# Check for port conflicts
log "Checking for port conflicts..."
PORT_CONFLICTS=""

if lsof -i:$DEV_PORT -P -n | grep LISTEN > /dev/null; then
  PORT_CONFLICTS="$PORT_CONFLICTS\n- Port $DEV_PORT (Vite dev server) is already in use"
fi

if lsof -i:$API_PORT -P -n | grep LISTEN > /dev/null; then
  PORT_CONFLICTS="$PORT_CONFLICTS\n- Port $API_PORT (API server) is already in use"
fi

if [ ! -z "$PORT_CONFLICTS" ]; then
  log "WARNING: Port conflicts detected:$PORT_CONFLICTS"
  echo
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Development startup aborted. Please free up the conflicting ports."
    exit 1
  fi
fi

# Stop all running containers
log "Stopping any running containers..."
cd landing
docker compose down --remove-orphans
cd ..

# Export environment variables to Docker Compose
export DEV_PORT
export API_PORT
export TWITCH_CLIENT_ID
export TWITCH_CLIENT_SECRET
export NODE_ENV=development

# Start the development environment
log "Starting development environment..."
cd landing
docker compose up -d dev
if [ $? -ne 0 ]; then
  log "ERROR: Failed to start development containers"
  exit 1
fi

# Wait for services to be ready with progressive backoff
log "Waiting for development server to start..."
MAX_RETRIES=20
RETRY_INTERVAL=1
RETRIES=0

while [ $RETRIES -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:$DEV_PORT > /dev/null; then
    log "✅ Vite development server is up and running"
    break
  fi
  
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -eq $MAX_RETRIES ]; then
    log "WARNING: Development server did not start in time. Check logs for issues."
  else
    RETRY_INTERVAL=$(( RETRY_INTERVAL * 2 > 5 ? 5 : RETRY_INTERVAL * 2 ))
    log "Waiting for development server (attempt $RETRIES/$MAX_RETRIES)..."
    sleep $RETRY_INTERVAL
  fi
done

# Indicate that we're about to follow logs
FOLLOWING_LOGS="true"

# Log success
log "Development environment started successfully"
log "Vite development server is running at http://localhost:$DEV_PORT"
log "API server is running at http://localhost:$API_PORT"

echo ""
echo "╔═════════════════════════════════════════════════════════════════╗"
echo "║ Development environment is ready!                               ║"
echo "║                                                                 ║"
echo "║ - Vite server: http://localhost:$DEV_PORT                       ║"
echo "║ - API server:  http://localhost:$API_PORT                       ║"
echo "║                                                                 ║"
echo "║ Press Ctrl+C to stop following logs (containers will continue)  ║"
echo "║ Run './stop-dev.sh' to completely stop the development servers  ║"
echo "╚═════════════════════════════════════════════════════════════════╝"
echo ""

# Follow logs
docker compose logs -f dev

# Handle exit
log "Stopped following logs, but development environment is still running"
log "Run './stop-dev.sh' to stop the development environment"