#!/bin/bash
# WARNING: This script will remove ALL Docker containers, images, volumes, networks,
# and caches. Make sure you have backups or that you intend to wipe the system completely.
# Use this only when you are sure you want to perform a complete cleanup on a production machine.

set -e

echo "== Stopping all running containers =="
running_containers=$(docker ps -q)
if [ -n "$running_containers" ]; then
  docker stop $running_containers || true
else
  echo "No running containers."
fi

echo "== Removing all containers =="
all_containers=$(docker ps -aq)
if [ -n "$all_containers" ]; then
  docker rm $all_containers || true
else
  echo "No containers to remove."
fi

echo "== Removing all images =="
all_images=$(docker images -aq)
if [ -n "$all_images" ]; then
  docker rmi -f $all_images || true
else
  echo "No images to remove."
fi

echo "== Removing all volumes =="
all_volumes=$(docker volume ls -q)
if [ -n "$all_volumes" ]; then
  docker volume rm $all_volumes || true
else
  echo "No volumes to remove."
fi

echo "== Pruning unused networks =="
docker network prune -f

echo "== Pruning Docker system (caches, build cache, etc.) =="
docker system prune -a -f

echo "== Cleaning up dangling volumes =="
docker volume prune -f

echo "== Relaunching Docker Compose environment =="
docker-compose up -d

echo "Cleanup and relaunch complete."
