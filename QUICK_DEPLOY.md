# Quick Deployment Guide

## Fastest Option: Vercel + Railway (5 minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. **CRITICAL**: Click on the service → **Settings** tab
5. Scroll to **Root Directory** and set it to: `server` ⚠️ **This is required!**
6. Add environment variables:
   - Key: `CORS_ORIGIN`
   - Value: `https://your-frontend.vercel.app` (update after frontend deploy)
   - Key: `NODE_ENV`
   - Value: `production`
7. Railway will auto-deploy
8. Copy your Railway URL (e.g., `https://your-app.railway.app`)

**⚠️ If you see "next: not found" error**: You forgot to set Root Directory to `server`. This is the most common mistake!

### Step 3: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-app.railway.app/api` (your Railway URL)
6. Click "Deploy"
7. Copy your Vercel URL

### Step 4: Update CORS

1. Go back to Railway dashboard
2. Update `CORS_ORIGIN` environment variable with your Vercel URL
3. Redeploy if needed

### Done! 🎉

Your app is now live at your Vercel URL!

---

## Alternative: Render (All-in-One)

### Deploy Backend

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Name**: drone-survey-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variable:
   - `CORS_ORIGIN`: `https://your-frontend.onrender.com`
6. Deploy

### Deploy Frontend

1. New → Static Site
2. Connect GitHub repo
3. Settings:
   - **Name**: drone-survey-frontend
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api`
5. Deploy

---

## Using Docker (Local/Server)

```bash
# Build and run
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## Environment Variables Summary

### Backend
```
PORT=5000
CORS_ORIGIN=https://your-frontend-url.com
NODE_ENV=production
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check platform-specific documentation
- Review server logs in hosting dashboard

