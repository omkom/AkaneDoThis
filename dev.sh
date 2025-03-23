#!/bin/bash

# Enhanced development environment script with proper hot reload support
# and improved error handling

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
LOGFILE="dev_log.txt"
ENV_FILE=".env"
DEV_PORT=5174
API_PORT=3000

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
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Development environment startup" > $LOGFILE

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  log "No .env file found. Creating a template..."
  log "Please fill in the .env file with your Twitch API credentials."
  log "You can continue without them, but Twitch integration will not work."
fi

# Check if we're in the project root
if [ ! -d "landing" ]; then
  log "ERROR: landing directory not found. Make sure you're running this script from the project root."
  exit 1
fi

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
cd ..

# Make sure we have the latest Docker images
log "Checking for Docker image updates..."
docker compose pull
check_error "Failed to pull Docker images"

# Build containers if necessary (with cache)
log "Building development containers..."
cd landing
docker compose build dev
check_error "Failed to build development containers"

# Set up port forward for proper hot reload with websocket support
HOST_IP=$(hostname -I | awk '{print $1}')
log "Using host IP: $HOST_IP"

# Check if ports are available
if lsof -i:$DEV_PORT > /dev/null; then
  log "WARNING: Port $DEV_PORT is already in use. Development server may not work correctly."
fi

if lsof -i:$API_PORT > /dev/null; then
  log "WARNING: Port $API_PORT is already in use. API server may not work correctly."
fi

# Export environment variables to Docker Compose
export DEV_PORT
export API_PORT
export HOST_IP

# Create required volumes if they don't exist
log "Setting up Docker volumes..."
docker volume create akane_dist_data || true
docker volume create akane_n8n_data || true

# Start the combined development environment
log "Starting development environment..."
docker compose up -d dev
check_error "Failed to start development containers"

# Wait for services to be ready
log "Waiting for development server to start..."
for i in {1..30}; do
  if curl -s http://localhost:$DEV_PORT > /dev/null; then
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    log "WARNING: Development server did not start in time. Check logs for issues."
  fi
done

# Follow logs
log "Development environment started successfully"
log "Vite development server is running at http://localhost:$DEV_PORT"
log "API server is running at http://localhost:$API_PORT"
log "Following logs (Ctrl+C to stop following, but keep containers running)..."

echo ""
echo "╔═════════════════════════════════════════════════════════════════╗"
echo "║ Development environment is ready!                               ║"
echo "║                                                                 ║"
echo "║ - Vite server: http://localhost:$DEV_PORT                          ║"
echo "║ - API server:  http://localhost:$API_PORT                          ║"
echo "║                                                                 ║"
echo "║ Press Ctrl+C to stop following logs (containers will continue) ║"
echo "║ Run './stop-dev.sh' to completely stop the development servers ║"
echo "╚═════════════════════════════════════════════════════════════════╝"
echo ""

# Follow logs without blocking further commands
docker compose logs -f dev

# Handle exit
log "Stopped following logs, but development environment is still running"
log "Run './stop-dev.sh' to stop the development environment"