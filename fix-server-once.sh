#!/bin/bash

echo "🚨 FINAL FIX - Deploy Correct Server Once"

# STEP 1: Stop ALL existing processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# STEP 2: Clean directories
rm -rf /root/ks-streaming-api/* 2>/dev/null || true
mkdir -p /root/ks-streaming-api

# STEP 3: Copy CORRECT server files
cd /tmp/ks-offerte-chat
cp server/express-server.js /root/ks-streaming-api/server.js
cp server/package.json /root/ks-streaming-api/package.json

# STEP 4: Install dependencies
cd /root/ks-streaming-api
npm install

# STEP 5: Start with hardcoded environment
PM2_HOME=/root/.pm2 PORT=3001 LANGFLOW_API_URL='https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07' LANGFLOW_API_KEY='sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ' pm2 start server.js --name ks-chat-api

# STEP 6: Save PM2 config
pm2 save

# STEP 7: Test endpoints
echo "🧪 Testing endpoints..."
sleep 3
echo "Health check:"
curl http://localhost:3001/api/health

echo -e "\nChat endpoint test:"
curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"message":"final test"}'

echo -e "\n✅ Server deployment complete!"