#!/bin/bash

# Improved build script with error logging
LOGFILE="build_log.txt"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Clear previous log
echo "" > $LOGFILE
log "Starting build process..."

# Run the build process for the landing page with better error capturing
cd landing || {
  log "ERROR: Could not change to landing directory"
  exit 1
}

log "Running Docker Compose build..."
docker compose run --rm build 2>&1 | tee -a ../$LOGFILE

# Check if the build was successful
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  log "ERROR: Build process failed. Check the log for details."
  log "Hint: Common issues include:"
  log "  - Missing node modules or TypeScript errors"
  log "  - Docker networking issues"
  log "  - Insufficient permissions"
  log "Run 'docker compose logs build' for more details"
  exit 1
else
  log "Build completed successfully."
  
  # Verify that the build output directory exists
  if [ ! -d "dist" ]; then
    log "WARNING: Build completed but 'dist' directory is missing!"
    log "This suggests that the build process did not create output files."
    exit 1
  fi
  
  # List what was built
  log "Build output files:"
  ls -la dist | tee -a ../$LOGFILE
fi

cd ..

log "Build completed. You can now start the production environment with ./prod.sh"
log "If you encounter any issues, check $LOGFILE for details"