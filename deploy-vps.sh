#!/bin/bash

# Clean VPS Deployment Script for K&S Mobile Chat
echo "🚀 CLEAN VPS DEPLOYMENT: Starting mobile-first deployment..."

# Set up directories
echo "📁 Setting up VPS directories..."
sudo mkdir -p /var/www/ai.dehuisraad.com
sudo mkdir -p /root/ks-mobile-chat
sudo chown -R www-data:www-data /var/www/ai.dehuisraad.com

# Copy server files to VPS location (OVERWRITE OLD SERVER)
echo "📋 Copying NEW mobile server files..."
sudo mkdir -p /root/ks-mobile-chat
cp server/express-server.js /root/ks-mobile-chat/server.js
cp server/package.json /root/ks-mobile-chat/package.json

# CRITICAL: Stop old ks-streaming-api process
echo "🛑 Stopping old ks-streaming-api process..."
pm2 delete ks-streaming-api 2>/dev/null || true

# CRITICAL: Remove old server directory
echo "🗑️ Cleaning old server files..."
sudo rm -f /root/ks-streaming-api/server.js 2>/dev/null || true

# Install server dependencies
echo "📦 Installing server dependencies..."
cd /root/ks-mobile-chat
npm install --production

# Build React app (if not already built)
echo "🏗️ Building React app..."
cd /tmp/ks-offerte-mobile-clean
npm ci
npm run build

# Deploy React build to web directory
echo "🚀 Deploying React build..."
sudo rm -rf /var/www/ai.dehuisraad.com/*
sudo cp -r build/* /var/www/ai.dehuisraad.com/
sudo chown -R www-data:www-data /var/www/ai.dehuisraad.com

# Setup PM2 configuration
echo "⚙️ Setting up PM2..."
cd /root/ks-mobile-chat

# Create PM2 ecosystem file with hardcoded Langflow credentials
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ks-mobile-chat',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      LANGFLOW_API_URL: 'https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07',
      LANGFLOW_API_KEY: 'sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ'
    }
  }]
};
EOF

# Stop ALL existing PM2 processes
echo "🛑 Stopping ALL existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start new PM2 process
echo "▶️ Starting new PM2 process..."
pm2 start ecosystem.config.js
pm2 save

# Test server
echo "🧪 Testing server..."
sleep 3

if curl -f http://localhost:3001/health; then
    echo "✅ Server health check passed!"
else
    echo "❌ Server health check failed!"
    pm2 logs ks-mobile-chat --lines 10
    exit 1
fi

# Setup nginx configuration (force update)
echo "🌐 Setting up nginx configuration..."
echo "⚠️ Updating nginx API proxy configuration..."

# Remove old API proxy configuration if exists
sudo sed -i '/# API Proxy/,/^    }/d' /etc/nginx/sites-available/ai.dehuisraad.com 2>/dev/null || true

# Add corrected API proxy location block
sudo tee -a /etc/nginx/sites-available/ai.dehuisraad.com > /dev/null << 'EOF'

    # API Proxy for mobile chat
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
EOF
    
    # Test and reload nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configuration updated and reloaded"
    else
        echo "❌ Nginx configuration error!"
        exit 1
    fi
else
    echo "✅ Nginx API proxy already configured"
fi

# Final verification
echo "🏁 Final verification..."
sleep 2

echo "Testing public health endpoint..."
if curl -f https://ai.dehuisraad.com/api/health; then
    echo "✅ Public health check passed!"
else
    echo "❌ Public health check failed!"
    exit 1
fi

echo "🧪 Testing NEW chat endpoint..."
if curl -X POST https://ai.dehuisraad.com/api/chat -H "Content-Type: application/json" -d '{"message":"production deployment test"}'; then
    echo "✅ Chat endpoint working!"
else
    echo "❌ Chat endpoint failed!"
    exit 1
fi

echo "🎉 Clean VPS deployment completed!"
echo "🌐 App available at: https://ai.dehuisraad.com"
echo "🔍 API health: https://ai.dehuisraad.com/api/health"