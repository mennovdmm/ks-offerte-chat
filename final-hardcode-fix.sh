#!/bin/bash

# FINAL HARDCODE FIX: Replace process.env with working URLs
echo "🎯 FINAL FIX: Hardcoding working Langflow credentials..."

cd /root/ks-streaming-api

echo "🔍 Current server.js environment usage:"
grep -n "process.env.LANGFLOW" server.js

echo "🔧 DIRECT REPLACEMENT: Hardcoding working URLs in server.js..."
# Replace process.env.LANGFLOW_API_URL with hardcoded URL
sed -i 's|process\.env\.LANGFLOW_API_URL|"https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07"|g' server.js

# Replace process.env.LANGFLOW_API_KEY with hardcoded key  
sed -i 's|process\.env\.LANGFLOW_API_KEY|"sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ"|g' server.js

echo "✅ Hardcoded URLs in server.js:"
grep -n "langflow-ogonline" server.js

echo "🔍 Checking server.js syntax after hardcoding..."
if node -c server.js; then
    echo "✅ Syntax OK - proceeding with restart"
else
    echo "❌ Syntax error detected!"
    exit 1
fi

echo "🔄 Restarting PM2 with hardcoded credentials..."
pm2 restart ks-streaming-api

echo "⏳ Waiting for server to restart..."
sleep 5

echo "🧪 Testing hardcoded version..."
curl -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"HARDCODE TEST","sessionId":"test123","currentUser":{"name":"Test User","email":"test@test.com"}}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "🎯 Final hardcode fix completed - should work now!"