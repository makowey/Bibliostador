#!/bin/bash
# Start local development with WebSocket server + SvelteKit

echo "🚀 Starting Bibliostador Local Development"
echo "📡 WebSocket server + SvelteKit frontend"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "vite dev" 2>/dev/null
sleep 1

# Start both servers concurrently
echo "🎮 Starting game servers..."
npm run dev:all