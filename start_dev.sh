#!/bin/bash

# Try to load NVM if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use version from .nvmrc if available, or just try to use 20
nvm use 20 || nvm use

echo "✅ Using Node version: $(node -v)"
echo "🚀 Starting Fuel Tracker Server..."

# Run the dev server
npm run dev
