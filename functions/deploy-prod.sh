#!/bin/bash

# Quick deployment scripts for dev and prod environments

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying functions to PROD environment (ee-prod-apps)..."
cd "$SCRIPT_DIR"
./deploy-with-config.sh prod