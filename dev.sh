#dev.sh#!/bin/bash

# Stop any running containers
docker compose down

# Use landing dev service
cd landing
docker compose up dev