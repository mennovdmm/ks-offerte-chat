module.exports = {
  apps: [{
    name: 'ks-mobile-chat',
    script: 'express-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      PORT: 3001,
      LANGFLOW_API_URL: 'https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07',
      LANGFLOW_API_KEY: 'sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ',
      NODE_ENV: 'production'
    }
  }]
};