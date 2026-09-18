#!/bin/sh
set -e

echo "[entrypoint] Running prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starting server..."
exec "$@"
