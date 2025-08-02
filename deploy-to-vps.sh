#!/bin/bash

# VPS Deployment Script for K&S Offerte Chat
echo "🚀 Starting VPS deployment..."

# Create VPS API directory if it doesn't exist
sudo mkdir -p /root/ks-streaming-api
cd /root/ks-streaming-api

# Copy server files
echo "📁 Copying server files..."
cp /tmp/ks-offerte-chat/vps-express-server.js ./
cp /tmp/ks-offerte-chat/langflow-chat-for-vps.js ./
cp /tmp/ks-offerte-chat/vps-package.json ./package.json

# Create .env file with environment variables
echo "🔧 Creating .env file..."
cat > .env << EOF
PORT=3001
LANGFLOW_API_URL=${LANGFLOW_API_URL}
LANGFLOW_API_KEY=${LANGFLOW_API_KEY}
NODE_ENV=production
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Stop existing PM2 process if it exists
echo "🛑 Stopping existing PM2 processes..."
pm2 stop ks-streaming-api 2>/dev/null || true
pm2 delete ks-streaming-api 2>/dev/null || true

# Start the server with PM2
echo "🚀 Starting server with PM2..."
pm2 start vps-express-server.js --name ks-streaming-api --log /var/log/ks-streaming-api.log

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test server health
echo "🏥 Testing server health..."
if curl -f http://localhost:3001/api/health; then
    echo "✅ Server health check passed!"
else
    echo "❌ Server health check failed!"
    pm2 logs ks-streaming-api --lines 20
    exit 1
fi

echo "✅ VPS deployment completed successfully!"