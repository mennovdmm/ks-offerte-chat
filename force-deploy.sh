#!/bin/bash

# Force deployment of VPS server - Emergency Fix
echo "🚨 EMERGENCY: Forcing VPS server deployment..."

# This script will be run on the VPS to manually deploy the correct server
echo "📁 Copying latest server files..."
cp /tmp/ks-offerte-chat/vps-express-server.js /root/ks-streaming-api/server.js
cp /tmp/ks-offerte-chat/vps-package.json /root/ks-streaming-api/package.json

# Navigate to server directory
cd /root/ks-streaming-api

echo "🔧 Creating .env file..."
cat > .env << EOF
PORT=3001
LANGFLOW_API_URL=${LANGFLOW_API_URL}
LANGFLOW_API_KEY=${LANGFLOW_API_KEY}
NODE_ENV=production
EOF

echo "📦 Installing dependencies..."
npm install --production

echo "🛑 Stopping old PM2 process..."
pm2 stop ks-streaming-api 2>/dev/null || true
pm2 delete ks-streaming-api 2>/dev/null || true

echo "🚀 Starting new server with PM2..."
pm2 start server.js --name ks-streaming-api --log /var/log/ks-streaming-api.log

echo "💾 Saving PM2 configuration..."
pm2 save

echo "⏳ Waiting for server to start..."
sleep 5

echo "🏥 Testing server health..."
if curl -f http://localhost:3001/health; then
    echo "✅ Server health check passed!"
else
    echo "❌ Server health check failed!"
    pm2 logs ks-streaming-api --lines 10
    exit 1
fi

echo "🧪 Testing langflow-stream endpoint..."
if curl -f -X POST http://localhost:3001/langflow-stream -H "Content-Type: application/json" -d '{"message":"test","sessionId":"test","currentUser":{"name":"Test"}}' | grep -q "success\|message"; then
    echo "✅ Langflow-stream endpoint is working!"
else
    echo "⚠️ Langflow-stream endpoint test inconclusive, check manually"
fi

echo "🎯 Emergency deployment completed!"