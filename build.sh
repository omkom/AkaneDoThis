#!/bin/bash

# Improved build script with error logging
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
log "Starting build process..."

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
  log "Created .env file. Please edit it with your actual credentials before deploying to production."
fi

# Ensure the dist directory exists in landing
mkdir -p landing/dist
check_error "Failed to create dist directory"

# Run the build process for the landing page
cd landing || {
  log "ERROR: Could not change to landing directory"
  exit 1
}

# Ensure we have the latest dependencies
log "Verifying dependencies..."
docker compose run --rm build npm ci
check_error "Failed to install dependencies"

# Build the application
log "Building the application..."
docker compose run --rm build
check_error "Build process failed"

# Verify that the build output exists
if [ ! "$(ls -A dist)" ]; then
  log "ERROR: Build completed but dist directory is empty!"
  log "Check the Docker logs for more details: docker compose logs build"
  exit 1
fi

# List what was built
log "Build output files:"
ls -la dist | tee -a ../$LOGFILE

cd ..

log "Build completed successfully."
log "You can now start the production environment with ./prod.sh"
log "If you encounter any issues, check $LOGFILE for details"