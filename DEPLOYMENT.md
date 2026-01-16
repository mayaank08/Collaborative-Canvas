# Deployment Guide

## 🚀 Quick Deploy

### 1. Deploy Server to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `collaborative-canvas-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Create Web Service"**
6. Wait for deployment (2-3 minutes)
7. Copy your server URL (e.g., `https://collaborative-canvas-server.onrender.com`)

### 2. Deploy Client to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as `.` (vercel.json handles it)
   - **Environment Variables**:
     - **Name**: `VITE_SERVER_URL`
     - **Value**: `https://YOUR-RENDER-URL.onrender.com` (from step 1)
5. Click **"Deploy"**
6. Wait for deployment (1-2 minutes)
7. Visit your URL: `https://your-app.vercel.app`

## 🔧 Local Development After Setup

```bash
# Create .env file in client/
cd client
cp .env.example .env
# Edit .env to set VITE_SERVER_URL=http://localhost:3000

# Run as normal
cd ..
npm start
```

## ✅ Verify Deployment

1. Open your Vercel URL in 2 browser tabs
2. Draw in one tab → should appear in other tab
3. Check performance metrics
4. Test room system
5. Verify undo/redo works globally

## 🐛 Troubleshooting

**Client can't connect to server:**
- Check CORS settings in `server/src/server.ts`
- Verify `VITE_SERVER_URL` environment variable in Vercel
- Check Render server logs

**Server keeps sleeping (Render free tier):**
- First request may be slow (15-30s) as server wakes up
- Consider keeping it warm with a ping service or upgrade to paid tier
