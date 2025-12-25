# Deployment Guide

This guide covers deploying the Drone Survey Management System to production.

## Architecture

- **Frontend**: Next.js (can be deployed to Vercel, Netlify, or any Node.js host)
- **Backend**: Node.js/Express (can be deployed to Railway, Render, Heroku, or any Node.js host)
- **Database**: SQLite (can be upgraded to PostgreSQL for production)

## Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

### Frontend on Vercel

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `client`
   - Add environment variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
     ```
   - Deploy!

### Backend on Railway

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Create new project** and select "Deploy from GitHub repo"

3. **Configure the project**:
   - Set **Root Directory** to `server`
   - Add environment variables:
     ```
     PORT=5000
     NODE_ENV=production
     ```
   - Railway will auto-detect Node.js and deploy

4. **Get your Railway URL** (e.g., `https://your-app.railway.app`)

5. **Update Vercel environment variable** with your Railway URL

## Option 2: Render (Full Stack)

### Deploy Backend

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - Add environment variables:
     ```
     PORT=10000
     NODE_ENV=production
     ```

### Deploy Frontend

1. Create new **Static Site** on Render
2. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`
   - Add environment variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
     ```

## Option 3: Heroku (Full Stack)

### Setup

1. Install Heroku CLI: `brew install heroku/brew/heroku`
2. Login: `heroku login`

### Deploy Backend

```bash
cd server
heroku create your-app-backend
heroku config:set NODE_ENV=production
git subtree push --prefix server heroku main
```

### Deploy Frontend

```bash
cd client
heroku create your-app-frontend
heroku config:set NEXT_PUBLIC_API_URL=https://your-app-backend.herokuapp.com/api
git subtree push --prefix client heroku main
```

## Option 4: Self-Hosted (VPS/Docker)

### Using Docker

1. **Build and run**:
   ```bash
   docker-compose up -d
   ```

2. **Access**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Manual Setup on VPS

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Build frontend**:
   ```bash
   cd client && npm run build
   ```

3. **Start backend** (use PM2 for production):
   ```bash
   npm install -g pm2
   cd server
   pm2 start index.js --name "drone-survey-api"
   pm2 save
   pm2 startup
   ```

4. **Start frontend**:
   ```bash
   cd client
   pm2 start npm --name "drone-survey-frontend" -- start
   ```

5. **Setup Nginx reverse proxy** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

## Database Considerations

### For Production (Recommended)

Upgrade from SQLite to PostgreSQL:

1. **Install PostgreSQL driver**:
   ```bash
   cd server
   npm install pg
   ```

2. **Update database.js** to use PostgreSQL connection

3. **Set DATABASE_URL** environment variable:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

### Keep SQLite (Simple)

- SQLite works fine for small to medium deployments
- Database file is stored in `server/drone_survey.db`
- Make sure to backup this file regularly

## Post-Deployment Checklist

- [ ] Update CORS settings in `server/index.js` with production frontend URL
- [ ] Set environment variables on hosting platform
- [ ] Test API endpoints
- [ ] Test WebSocket connections
- [ ] Verify database persistence
- [ ] Set up SSL/HTTPS
- [ ] Configure domain names
- [ ] Set up monitoring/logging
- [ ] Backup database regularly

## Troubleshooting

### CORS Errors
- Update `CORS_ORIGIN` in backend environment variables
- Update `origin` in Socket.io config in `server/index.js`

### WebSocket Not Working
- Ensure WebSocket is enabled on your hosting platform
- Check firewall settings
- Verify Socket.io CORS configuration

### Database Issues
- For SQLite: Ensure write permissions on database file
- For PostgreSQL: Verify connection string and credentials

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

## Quick Deploy Scripts

### Railway + Vercel (Fastest)
```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy backend on Railway (via web UI)
# 3. Deploy frontend on Vercel (via web UI)
# 4. Update NEXT_PUBLIC_API_URL in Vercel
```

### Render (All-in-one)
```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy via Render dashboard
# - Create Web Service for backend
# - Create Static Site for frontend
```

## Support

For deployment issues, check:
- Platform-specific documentation
- Server logs in hosting dashboard
- Browser console for frontend errors
- Network tab for API errors

