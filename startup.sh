#!/bin/bash

# Log file for startup operations
LOGFILE="/var/log/akane-startup.log"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOGFILE
}

# Create log file or clear existing one
touch $LOGFILE
echo "" > $LOGFILE

# Change to the project directory
PROJECT_DIR="/home/cubilizer/AkaneDoThis"  # CHANGE THIS to your actual project directory
cd $PROJECT_DIR || {
    log "ERROR: Could not change to project directory: $PROJECT_DIR"
    exit 1
}

log "Starting Akane environment update and restart process"

# Stop any running containers
log "Stopping any running containers"
docker compose down || log "Warning: Issues stopping containers, continuing anyway"

# Pull latest changes from git
log "Pulling latest changes from git"
git pull || {
    log "ERROR: Git pull failed. Check your git repository configuration."
    exit 1
}

# Build the landing page
log "Building landing page"
cd landing || {
    log "ERROR: Could not change to landing directory"
    exit 1
}
docker compose run --rm build || {
    log "ERROR: Landing page build failed"
    exit 1
}
cd $PROJECT_DIR || {
    log "ERROR: Could not change back to project directory"
    exit 1
}

# Start the production environment
log "Starting production environment"
docker compose up -d || {
    log "ERROR: Failed to start production environment"
    exit 1
}

# Verify all services are running
log "Verifying services"
sleep 10  # Give containers time to start

# Check Nginx
if docker compose ps | grep -q "nginx.*Up"; then
    log "✅ Nginx is running"
else
    log "❌ Nginx failed to start"
fi

# Check n8n
if docker compose ps | grep -q "n8n.*Up"; then
    log "✅ n8n is running"
else
    log "❌ n8n failed to start"
fi

# Check landing page
if docker compose ps | grep -q "landing.*Up"; then
    log "✅ Landing page is running"
else
    log "❌ Landing page failed to start"
fi

# # Check WordPress
# if docker compose ps | grep -q "wordpress.*Up"; then
#     log "✅ WordPress is running"
# else
#     log "❌ WordPress failed to start"
# fi

log "Startup process completed"