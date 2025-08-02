#!/bin/bash

# EMERGENCY: Fix server crash caused by debug logging syntax error
echo "🚨 EMERGENCY: Fixing server crash caused by debug logging..."

cd /root/ks-streaming-api

echo "📊 Current PM2 status:"
pm2 status

echo "🔍 Checking server.js syntax..."
node -c server.js || echo "❌ Syntax error found!"

echo "📝 Showing recent PM2 logs..."
pm2 logs ks-streaming-api --lines 10

echo "🔧 Restoring clean server.js from git repo..."
cp /tmp/ks-offerte-chat/vps-express-server.js ./server.js

echo "✅ Verifying clean server syntax..."
node -c server.js && echo "✅ Syntax OK" || echo "❌ Still broken"

echo "🔄 Restarting server with clean code..."
pm2 restart ks-streaming-api

echo "⏳ Waiting for server to stabilize..."
sleep 5

echo "🧪 Testing server connection..."
curl -f http://localhost:3001/health && echo " ✅ Local health OK" || echo " ❌ Local health failed"

echo "🧪 Testing langflow-stream endpoint..."
curl -f -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test","currentUser":{"name":"Test"}}' \
  | head -20

echo ""
echo "🏥 Testing public endpoints..."
curl -f https://ai.dehuisraad.com/api/health && echo " ✅ Public health OK" || echo " ❌ Public health failed"

echo "🎯 Server crash fix completed!"