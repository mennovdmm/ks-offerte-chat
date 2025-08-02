#!/bin/bash

# EMERGENCY: Hardcode environment variables directly in server.js
echo "🚨 EMERGENCY: Hardcoding environment variables in server.js..."

cd /root/ks-streaming-api

echo "🔍 Current server.js environment loading:"
grep -n "process.env" server.js | head -5

echo "🔧 Hardcoding Langflow credentials directly in server.js..."
sed -i 's|process.env.LANGFLOW_API_URL|"https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07"|g' server.js
sed -i 's|process.env.LANGFLOW_API_KEY|"sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ"|g' server.js

echo "✅ Hardcoded credentials in server.js:"
grep -n "langflow-ogonline" server.js | head -2

echo "🔄 Restarting PM2 with hardcoded values..."
pm2 restart ks-streaming-api

echo "⏳ Waiting for server to restart..."
sleep 5

echo "🧪 Testing with hardcoded values..."
curl -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test hardcode","sessionId":"test123","currentUser":{"name":"Test","email":"test@test.com"}}' \
  | head -20

echo ""
echo "🏥 Testing public endpoint with hardcoded values..."
curl -f -X POST https://ai.dehuisraad.com/api/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test public","sessionId":"test123","currentUser":{"name":"Test","email":"test@test.com"}}' \
  && echo " ✅ SUCCESS!" || echo " ❌ Still failed"

echo "🎯 Hardcode fix completed!"