#!/bin/bash

# EMERGENCY: Fix environment variables for VPS server
echo "🚨 EMERGENCY: Fixing environment variables..."

cd /root/ks-streaming-api

echo "📁 Current directory contents:"
ls -la

echo "🔧 Creating .env file with correct Langflow credentials..."
cat > .env << 'EOF'
PORT=3001
LANGFLOW_API_URL=https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07
LANGFLOW_API_KEY=sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ
NODE_ENV=production
EOF

echo "✅ Created .env file:"
cat .env

echo "🔄 Restarting PM2 with updated environment..."
pm2 restart ks-streaming-api --update-env

echo "⏳ Waiting for server to restart..."
sleep 3

echo "🧪 Testing langflow-stream endpoint with environment fix..."
curl -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test123","currentUser":{"name":"Test","email":"test@test.com"}}' \
  | head -20

echo ""
echo "🏥 Testing public health endpoint..."
curl -f https://ai.dehuisraad.com/api/health && echo " ✅ Health OK" || echo " ❌ Health failed"

echo "🧪 Testing public langflow-stream endpoint..."
curl -f -X POST https://ai.dehuisraad.com/api/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test123","currentUser":{"name":"Test","email":"test@test.com"}}' \
  && echo " ✅ Langflow-stream OK" || echo " ❌ Langflow-stream failed"

echo "🎯 Environment fix completed!"