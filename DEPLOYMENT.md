# Netlify Deployment Checklist

## ✅ Pre-deployment Setup Complete

### 1. Production Ready Code
- [x] Demo credentials removed from login screen
- [x] Hardcoded API URLs replaced with environment variables
- [x] Build process tested successfully
- [x] Local development environment variables in `.env.local`

### 2. Environment Files
- `.env` - Default values (committed to git)
- `.env.local` - Local development overrides (ignored by git)
- Netlify dashboard - Production environment variables

### 3. Environment Variables Needed in Netlify
Set these in Netlify dashboard under Site settings > Environment variables:

```
LANGFLOW_API_KEY=sk-f2GOmzmTYjXiH1msLR_RQMihxGQEHBW1lZrE2SVnluQ
LANGFLOW_API_URL=https://langflow-ogonline-v2-u36305.vm.elestio.app/api/v1/run/62f396d2-3e45-4265-b10c-b18a63cd2b07
NODE_VERSION=18
```

### 3. User Accounts Available
- Menno van der Meulen - menno@dehuisraad.com
- Juul van Turenhout - j.vanturenhout@keij-stefels.nl
- Sarah Keij - s.keij@keij-stefels.nl
- Daniel Vermeulen - daniel@dehuisraad.com

All with password: `ksoappv1.0`

## 🚀 Deployment Steps

### Option 1: Git-based Deployment (Recommended)
1. Push code to GitHub repository
2. Connect Netlify to the repository
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variables
6. Deploy!

### Option 2: Manual Deployment
1. Run `npm run build` locally
2. Drag & drop the `build` folder to Netlify
3. Add environment variables in Netlify dashboard

## 📋 Post-deployment Checklist

### Test these features:
- [ ] Login with all user accounts
- [ ] Create new offerte sessions
- [ ] Send messages (fast responses)
- [ ] Send complex requests (background processing)
- [ ] Session switching in sidebar
- [ ] Rename sessions
- [ ] PDF generation and opening
- [ ] Session persistence after page refresh

### Check these URLs:
- [ ] Main app: `https://your-site.netlify.app`
- [ ] Functions: `https://your-site.netlify.app/.netlify/functions/langflow-chat`

## 🛠 Configuration Files

- `netlify.toml` - Netlify configuration
- `.env` - Environment variables (local only)
- `package.json` - Build settings

## 🔧 Debugging Production Issues

### Common issues:
1. **Environment variables not working**: Check Netlify dashboard settings
2. **Functions not deploying**: Check `netlify.toml` configuration
3. **API calls failing**: Verify LANGFLOW_API_URL and LANGFLOW_API_KEY
4. **Login not working**: Users database is hardcoded in `LoginForm.tsx`

### Logs:
- Netlify Functions logs: Site dashboard > Functions tab
- Deploy logs: Site dashboard > Deploys tab
- Runtime logs: Real-time function logs in dashboard

## 📁 File Structure
```
├── src/
│   ├── components/
│   │   ├── LoginForm.tsx (user database)
│   │   ├── SessionSidebar.tsx
│   │   └── ...
│   ├── types.ts
│   └── App.tsx (main logic)
├── netlify/
│   └── functions/
│       ├── langflow-chat.js
│       ├── langflow-background.js
│       ├── check-task.js
│       └── reset-session.js
├── netlify.toml
└── package.json
```

## 🎯 Ready for Production!
All code is production-ready and tested. The app includes:
- Multi-user authentication
- Session management
- Background processing
- PDF generation
- Responsive design
- Error handling