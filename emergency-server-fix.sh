#!/bin/bash

# EMERGENCY SERVER FIX - Correct endpoints and nginx
echo "🚨 EMERGENCY: Fixing server endpoints and nginx proxy..."

cd /root/ks-streaming-api

# Step 1: Check what's actually running
echo "📊 Current server status:"
pm2 status
echo "📊 Current server endpoints:"
cat server.js | grep "app\." | head -10

# Step 2: Copy the correct server file from git repo
echo "📁 Copying correct server file..."
cp /tmp/ks-offerte-chat/vps-express-server.js ./server.js

# Step 3: Restart server with correct endpoints
echo "🔄 Restarting server with correct endpoints..."
pm2 restart ks-streaming-api

# Step 4: Test the correct endpoint
echo "🧪 Testing langflow-stream endpoint..."
sleep 3
curl -X POST http://localhost:3001/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test","currentUser":{"name":"Test"}}' \
  || echo "❌ langflow-stream endpoint failed"

# Step 5: Fix nginx proxy configuration
echo "🔧 Adding nginx proxy configuration..."
if ! grep -q "location /api/" /etc/nginx/sites-available/default; then
    echo "⚠️ Adding missing /api/ proxy configuration to nginx..."
    
    # Backup original
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    # Add the location block after the existing location / block
    sed -i '/location \/ {/a\\n\t# API Proxy to VPS streaming server\n\tlocation /api/ {\n\t\tproxy_pass http://127.0.0.1:3001/;\n\t\tproxy_http_version 1.1;\n\t\tproxy_set_header Upgrade $http_upgrade;\n\t\tproxy_set_header Connection "upgrade";\n\t\tproxy_set_header Host $host;\n\t\tproxy_set_header X-Real-IP $remote_addr;\n\t\tproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\t\tproxy_set_header X-Forwarded-Proto $scheme;\n\t\tproxy_cache_bypass $http_upgrade;\n\t\tproxy_connect_timeout 300s;\n\t\tproxy_send_timeout 300s;\n\t\tproxy_read_timeout 300s;\n\t\tsend_timeout 300s;\n\t}' /etc/nginx/sites-available/default
    
    echo "✅ Added nginx proxy configuration"
else
    echo "✅ Nginx proxy configuration already exists"
fi

# Step 6: Test and reload nginx
echo "🔧 Testing and reloading nginx..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration error!"
    nginx -t
    exit 1
fi

# Step 7: Final verification
echo "🏁 Final verification..."
sleep 2

echo "Testing health endpoint..."
curl -f https://ai.dehuisraad.com/api/health && echo " ✅ Health OK" || echo " ❌ Health failed"

echo "Testing langflow-stream endpoint..."
curl -f -X POST https://ai.dehuisraad.com/api/langflow-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test","currentUser":{"name":"Test"}}' \
  && echo " ✅ Langflow-stream OK" || echo " ❌ Langflow-stream failed"

echo "🎯 Emergency fix completed!"