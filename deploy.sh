#!/usr/bin/env bash
# Build and deploy PartRig to the production server (https://partrig.onegame.ai).
# Usage: bash deploy.sh   (requires passwordless SSH to the server)
set -euo pipefail

SERVER=${SERVER:-root@43.133.247.163}
REMOTE_DIR=${REMOTE_DIR:-/www/wwwroot/partrig.onegame.ai}

cd "$(dirname "$0")"
npm run build
tar -C dist -czf - . | ssh "$SERVER" "tar -xzf - -C $REMOTE_DIR && chown -R www:www $REMOTE_DIR"
echo "Deployed to https://partrig.onegame.ai"
