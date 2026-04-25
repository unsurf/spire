#!/bin/sh
set -e

echo "Running Drizzle migrations..."
node migrate.mjs

echo "Starting Spire..."
exec node server.js
