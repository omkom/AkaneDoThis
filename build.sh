#!/bin/bash
# Enhanced build script with proper error handling and environment variable checking

set -e  # Exit on first error

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

# Check if running as root (avoid permission issues)
if [ "$EUID" -eq 0 ]; then
  log "WARNING: Running as root is not recommended. Consider using a non-root user."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Build aborted by user."
    exit 1
  fi
fi

# Clear previous log and start new one
echo "# Build log started at $TIMESTAMP" > $LOGFILE
log "Starting build process..."

# Check for required environment variables
if [ ! -f "$ENV_FILE" ]; then
  log "WARNING: No .env file found. Creating a template..."
  echo "# Twitch API credentials" > $ENV_FILE
  echo "TWITCH_CLIENT_ID=" >> $ENV_FILE
  echo "TWITCH_CLIENT_SECRET=" >> $ENV_FILE
  log "Please fill in the .env file with your Twitch API credentials."
  read -p "Continue without environment variables? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Build aborted. Please configure your environment variables first."
    exit 1
  fi
else
  # Source the environment file
  source $ENV_FILE
  
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

cd landing
docker compose down
check_error "Failed to stop landing containers"
cd ..

# Remove volumes to clean locked resources
docker volume rm akane_landing_dist_data || true

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

# Export environment variables to Docker Compose
export TWITCH_CLIENT_ID
export TWITCH_CLIENT_SECRET

# Build the Docker image
log "Building Docker image..."
docker compose build --no-cache build
check_error "Failed to rebuild Docker image"

# Run the build command to generate the dist directory
log "Running build process..."
docker compose run --rm build
check_error "Build process failed"

# Verify build output
log "Verifying build output..."
if [ ! -f "dist/index.html" ]; then
  log "ERROR: Build failed - index.html not found in dist folder"
  exit 1
fi

# Verify client secret is not in client assets
if grep -q "TWITCH_CLIENT_SECRET" dist/*.js; then
  log "ERROR: Client secret found in built JavaScript! Fix this before deploying."
  exit 1
fi

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

# Verify the application is running
log "Waiting for application to be accessible..."
sleep 10

# Attempt to access the health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "failed")

if [ "$HEALTH_STATUS" = "200" ]; then
  log "Success! Application is accessible and healthy."
elif [ "$HEALTH_STATUS" = "failed" ]; then
  log "WARNING: Could not connect to the application."
  log "Check logs with: docker compose logs"
else
  log "WARNING: Application returned unexpected status code: $HEALTH_STATUS"
  log "Check logs with: docker compose logs"
fi

log "Build and deployment completed at $(date)"
log "Twitch integration is configured with Client ID: ${TWITCH_CLIENT_ID:0:3}...${TWITCH_CLIENT_ID: -3}"