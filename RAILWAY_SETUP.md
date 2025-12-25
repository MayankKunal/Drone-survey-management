# Railway Deployment Setup

## Important: Root Directory Configuration

When deploying the **backend** on Railway, you **must** set the **Root Directory** to `server` in the Railway dashboard.

## Step-by-Step Railway Setup

### 1. Create New Project
- Go to [railway.app](https://railway.app)
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

### 2. Configure Service Settings

**CRITICAL**: In the service settings:

1. Click on the service
2. Go to **Settings** tab
3. Scroll to **Root Directory**
4. Set it to: `server`
5. Save

### 3. Environment Variables

Add these environment variables in Railway:

```
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

**Note**: Update `CORS_ORIGIN` after you deploy the frontend.

### 4. Build Settings

Railway should auto-detect:
- **Build Command**: `npm install` (or leave empty, it will auto-detect)
- **Start Command**: `node index.js` (or leave empty)

### 5. Deploy

Railway will automatically:
1. Install dependencies from `server/package.json`
2. Start the server with `node index.js`

## Troubleshooting

### Error: "next: not found"
- **Cause**: Railway is building from root instead of `server` directory
- **Fix**: Set **Root Directory** to `server` in Railway settings

### Error: "Cannot find module"
- **Cause**: Dependencies not installed
- **Fix**: Ensure Root Directory is set to `server`

### Error: "Port already in use"
- **Cause**: PORT environment variable conflict
- **Fix**: Set `PORT=5000` in environment variables (Railway auto-assigns, but you can override)

## Verification

After deployment, check:
1. Railway provides a URL (e.g., `https://your-app.railway.app`)
2. Test: `https://your-app.railway.app/api/health`
3. Should return: `{"status":"ok"}`

## Next Steps

1. Copy your Railway URL
2. Deploy frontend on Vercel
3. Set `NEXT_PUBLIC_API_URL` in Vercel to `https://your-app.railway.app/api`
4. Update `CORS_ORIGIN` in Railway to your Vercel URL

