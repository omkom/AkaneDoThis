#!/bin/bash

# Run the build process for the landing page
cd landing
docker compose run --rm build

echo "Build completed. You can now start the production environment with ./prod.sh"