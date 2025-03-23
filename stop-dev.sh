#!/bin/bash

# Script to safely stop the development environment
LOCKFILE="/tmp/akane-dev.lock"

echo "Stopping development environment..."

# Get Docker Compose command (support both v1 and v2)
if command -v docker compose &> /dev/null; then
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker compose"
fi

# Stop containers in landing directory
if [ -d "landing" ]; then
  cd landing && $COMPOSE_CMD down --remove-orphans
  cd ..
else
  echo "WARNING: landing directory not found. Skipping this step."
fi

# Stop containers in root directory
$COMPOSE_CMD down --remove-orphans

# Remove lock file
if [ -f "$LOCKFILE" ]; then
  rm -f "$LOCKFILE"
  echo "Lock file removed."
fi

echo "Development environment stopped successfully."