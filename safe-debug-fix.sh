#!/bin/bash

# SAFE APPROACH: No more sed commands that break syntax
echo "🚨 SAFE DEBUG: Using safe environment fix without sed..."

cd /root/ks-streaming-api

echo "🔍 Checking current server syntax..."
if node -c server.js; then
    echo "✅ Server syntax is OK"
else
    echo "❌ Server syntax broken - restoring clean version"
    cp /tmp/ks-offerte-chat/vps-express-server.js ./server.js
    echo "✅ Restored clean server.js"
fi

echo "📊 Current server.js environment usage:"
grep -n "process.env" server.js | head -3

echo "🎯 DIRECT APPROACH: Testing environment variable access in Node.js"
cd /root/ks-streaming-api
echo "Testing dotenv loading:"
node -e "
require('dotenv').config();
console.log('LANGFLOW_API_URL:', process.env.LANGFLOW_API_URL ? 'EXISTS (' + process.env.LANGFLOW_API_URL.length + ' chars)' : 'UNDEFINED');
console.log('LANGFLOW_API_KEY:', process.env.LANGFLOW_API_KEY ? 'EXISTS (' + process.env.LANGFLOW_API_KEY.length + ' chars)' : 'UNDEFINED');
"

echo "🔧 Creating PM2 ecosystem file with explicit environment..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ks-streaming-api',
    script: 'server.js',
    env: {
      PORT: 3001,
      NODE_ENV: 'production',
      LANGFLOW_API_URL: 'https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07',
      LANGFLOW_API_KEY: 'sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ'
    }
  }]
};
EOF

echo "✅ Created PM2 ecosystem with hardcoded env vars"

echo "🔄 Stopping and restarting with ecosystem file..."
pm2 stop ks-streaming-api
pm2 delete ks-streaming-api
pm2 start ecosystem.config.js

echo "⏳ Waiting for server to start with new config..."
sleep 5

echo "📊 New PM2 status:"
pm2 status

echo "🧪 Testing with ecosystem environment..."
curl -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"ecosystem test","sessionId":"test123","currentUser":{"name":"Test","email":"test@test.com"}}' \
  | head -20

echo "🎯 Safe debug fix completed!"