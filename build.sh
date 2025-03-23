#!/bin/bash

# Production build script with enhanced security and error handling
set -e  # Exit immediately if a command exits with non-zero status

# Configuration
LOGFILE="build_log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
ENV_FILE=".env"

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

# Clear previous log and start new one
echo "# Build log started at $TIMESTAMP" > $LOGFILE
log "Starting production build process..."

# Check for required environment variables
if [ ! -f "$ENV_FILE" ]; then
  log "WARNING: No .env file found."
  log "Please fill in the .env file with your Twitch API credentials."
  read -p "Continue without environment variables? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Build aborted. Please configure your environment variables first."
    exit 1
  fi
else
  # Source the environment file
  set -a
  source "$ENV_FILE"
  set +a

  # Check for required variables
  if [ -z "$TWITCH_CLIENT_ID" ] || [ -z "$TWITCH_CLIENT_SECRET" ]; then
    log "WARNING: Missing required environment variables in .env file"
    log "Required: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log "Build aborted. Please configure your environment variables first."
      exit 1
    fi
  else
    log "Environment variables loaded successfully"
    log "TWITCH_CLIENT_ID is set to: ${TWITCH_CLIENT_ID:0:3}...${TWITCH_CLIENT_ID: -3}"
  fi
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

# Clean previous build artifacts
log "Cleaning previous build artifacts..."
rm -rf landing/dist
check_error "Failed to clean dist directory"
mkdir -p landing/dist
check_error "Failed to create clean dist directory"

# Pull the latest images
log "Pulling latest Docker images..."
docker compose pull
check_error "Failed to pull Docker images"

# Build the landing site
log "Building landing site..."
cd landing

# Export environment variables to Docker Compose
export TWITCH_CLIENT_ID
export TWITCH_CLIENT_SECRET
export NODE_ENV=production

# Rebuild with proper caching
log "Rebuilding Docker containers..."
docker compose build build
check_error "Failed to build Docker image"

# Run the build command
log "Running build process..."
docker compose run --rm --remove-orphans build
check_error "Build process failed"

# Verify build output
log "Verifying build output..."
if [ ! -f "dist/index.html" ]; then
  log "ERROR: index.html not found in dist folder"
  exit 1
fi

# Ensure no sensitive information is leaked
log "Checking for exposed secrets..."
if grep -r "TWITCH_CLIENT_SECRET" dist/ &>/dev/null; then
  log "ERROR: Client secret was found in build files! Security risk detected."
  exit 1
fi

log "Build completed successfully"
cd ..

# Configure Nginx for production
log "Configuring Nginx for production..."

# Create required volumes if they don't exist
log "Setting up Docker volumes..."
docker volume create akane_dist_data || true
docker volume create akane_n8n_data || true

# Start production environment
log "Starting production environment..."
docker compose up -d
check_error "Failed to start production environment"

# Wait for services to come up
log "Waiting for services to start..."
sleep 10

# Check if the services are running
log "Checking if services are running..."
RUNNING_CONTAINERS=$(docker compose ps --status running --services | wc -l)
if [ "$RUNNING_CONTAINERS" -lt 3 ]; then
  log "WARNING: Not all services are running. Check the logs with: docker compose logs"
else
  log "All services are running correctly"
fi

# Final checks
log "Performing final checks..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "failed")
if [ "$HEALTH_CHECK" == "200" ]; then
  log "Health check passed successfully"
else
  log "WARNING: Health check failed with status: $HEALTH_CHECK"
  log "Check the logs with: docker compose logs"
fi

log "Build and deployment completed at $(date)"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║ Production environment is running!                            ║"
echo "║                                                               ║"
echo "║ - HTTPS: https://akane.production                             ║"
echo "║ - Admin: http://akane.production/n8n/                         ║"
echo "║                                                               ║"
echo "║ Run 'docker compose logs' to view the logs                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
