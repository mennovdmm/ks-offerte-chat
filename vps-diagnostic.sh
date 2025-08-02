#!/bin/bash

echo "🔍 VPS DIAGNOSTIC REPORT - Complete Server Analysis"
echo "=================================================="
echo "Timestamp: $(date)"
echo "Server: $(hostname -f 2>/dev/null || echo 'Unknown')"
echo ""

echo "📊 1. PM2 PROCESS STATUS"
echo "------------------------"
pm2 list
echo ""
pm2 status
echo ""

echo "📁 2. SERVER DIRECTORIES & FILES"
echo "--------------------------------"
echo "🔍 /root/ks-streaming-api/ contents:"
ls -la /root/ks-streaming-api/ 2>/dev/null || echo "Directory not found"
echo ""

echo "🔍 /root/ks-mobile-chat/ contents:"
ls -la /root/ks-mobile-chat/ 2>/dev/null || echo "Directory not found"
echo ""

echo "📄 3. ACTUAL RUNNING SERVER CODE"
echo "--------------------------------"
echo "🔍 Current server.js (first 100 lines):"
if [ -f "/root/ks-streaming-api/server.js" ]; then
    echo "--- /root/ks-streaming-api/server.js ---"
    head -100 /root/ks-streaming-api/server.js
else
    echo "❌ /root/ks-streaming-api/server.js not found"
fi
echo ""

if [ -f "/root/ks-mobile-chat/server.js" ]; then
    echo "--- /root/ks-mobile-chat/server.js ---"
    head -100 /root/ks-mobile-chat/server.js
else
    echo "❌ /root/ks-mobile-chat/server.js not found"
fi
echo ""

echo "🔧 4. ENVIRONMENT VARIABLES"
echo "---------------------------"
echo "🔍 Environment from PM2:"
pm2 env 0 2>/dev/null || echo "No PM2 environment found"
echo ""

echo "🔍 .env files:"
echo "--- /root/ks-streaming-api/.env ---"
cat /root/ks-streaming-api/.env 2>/dev/null || echo "❌ No .env file found"
echo ""
echo "--- /root/ks-mobile-chat/.env ---"
cat /root/ks-mobile-chat/.env 2>/dev/null || echo "❌ No .env file found"
echo ""

echo "🌐 5. NGINX CONFIGURATION"
echo "-------------------------"
echo "🔍 Nginx sites-available:"
cat /etc/nginx/sites-available/ai.dehuisraad.com 2>/dev/null || echo "❌ Nginx config not found"
echo ""

echo "🔍 Nginx test:"
nginx -t 2>&1
echo ""

echo "📋 6. PACKAGE.JSON FILES"
echo "-----------------------"
echo "--- /root/ks-streaming-api/package.json ---"
cat /root/ks-streaming-api/package.json 2>/dev/null || echo "❌ No package.json found"
echo ""
echo "--- /root/ks-mobile-chat/package.json ---"
cat /root/ks-mobile-chat/package.json 2>/dev/null || echo "❌ No package.json found"
echo ""

echo "🧪 7. ENDPOINT TESTING"
echo "---------------------"
echo "🔍 Testing localhost endpoints:"
echo "Health check:"
curl -s http://localhost:3001/health | head -5 || echo "❌ Health endpoint failed"
echo ""

echo "API chat test:"
curl -s -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"message":"diagnostic test"}' | head -5 || echo "❌ API chat endpoint failed"
echo ""

echo "Langflow-stream test:"
curl -s -X POST http://localhost:3001/langflow-stream -H "Content-Type: application/json" -d '{"message":"diagnostic test"}' | head -5 || echo "❌ Langflow-stream endpoint failed"
echo ""

echo "📊 8. SYSTEM RESOURCES"
echo "---------------------"
echo "🔍 Memory usage:"
free -h
echo ""
echo "🔍 Disk usage:"
df -h
echo ""
echo "🔍 Port 3001 usage:"
lsof -i :3001 2>/dev/null || echo "❌ Port 3001 not in use"
echo ""

echo "📝 9. RECENT PM2 LOGS"
echo "--------------------"
echo "🔍 Last 20 lines of PM2 logs:"
pm2 logs --lines 20 2>/dev/null || echo "❌ No PM2 logs available"
echo ""

echo "🏁 10. SUMMARY"
echo "-------------"
echo "✅ Diagnostic complete!"
echo "📋 This report shows exactly what's running on the VPS"
echo "💡 Use this info to reproduce the setup locally"
echo "🔧 Claude Desktop can use this to debug and fix issues"
echo ""
echo "=================================================="
echo "🎯 END OF VPS DIAGNOSTIC REPORT"
echo "=================================================="