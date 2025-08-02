# K&S Offerte Chat - VPS Deployment

🚀 **Production-ready React + Node.js streaming chat application with Langflow integration**

## 🌐 Live Application
- **Website**: https://ai.dehuisraad.com/
- **API Health**: https://ai.dehuisraad.com/api/health
- **API Endpoint**: https://ai.dehuisraad.com/api/langflow-stream

## 🏗️ Architecture

### Frontend (React)
- TypeScript React application with streaming UI
- Hosted on VPS with Nginx serving static files
- Real-time streaming animation for AI responses
- Session management and user authentication

### Backend (Node.js + Express)
- Express API server with Langflow integration
- **NO TIMEOUT LIMITS** (300s proxy timeout vs Netlify's 25s)
- SSL-secured with Let's Encrypt certificates
- PM2 process management for reliability

### Infrastructure
- **VPS**: DigitalOcean (206.189.10.152)
- **Domain**: ai.dehuisraad.com with SSL
- **Reverse Proxy**: Nginx with extended timeouts
- **Process Manager**: PM2 with auto-restart

## 🚀 Deployment

### Automatic GitHub Actions
```bash
git push origin main  # → Automatic build & deploy!
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📊 Performance

### Solved Problems
- ✅ **Timeout Issues**: No more 25s Netlify limits
- ✅ **Streaming**: Real-time AI response streaming
- ✅ **CORS**: Same-domain deployment eliminates CORS issues
- ✅ **SSL**: Professional HTTPS setup with auto-renewal

---

**🏆 Migration Complete**: Successfully migrated from Netlify Functions (25s timeout) to VPS (300s timeout) with professional domain and SSL setup.

## 🔄 Auto-Deploy Status
- ✅ GitHub Actions workflow configured
- ✅ SSH keys and secrets setup  
- ✅ VPS deployment target ready
- 🚀 **Ready for `git push` = instant deploy!**Deploy test
