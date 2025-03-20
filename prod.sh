#!/bin/bash

# Start the full production environment
docker compose up -d

echo "Production environment started."
echo "Access points:"
echo "- Landing page: http://localhost/ (or https://akane.production/)"
echo "- n8n: http://localhost/n8n/ (or https://akane.production/n8n/)"
echo "- WordPress: http://localhost/wp/ (or https://akane.production/wp/)"