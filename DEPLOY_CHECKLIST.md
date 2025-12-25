# Pre-Deployment Checklist

Use this checklist before deploying to production.

## Code Preparation

- [ ] All code committed to Git
- [ ] Code pushed to GitHub/GitLab
- [ ] `.env` files added to `.gitignore`
- [ ] Database file (`*.db`) excluded from Git
- [ ] No hardcoded API URLs or secrets
- [ ] All environment variables documented

## Configuration

### Backend
- [ ] `PORT` environment variable set
- [ ] `CORS_ORIGIN` set to frontend URL
- [ ] `NODE_ENV=production` set
- [ ] Database connection configured
- [ ] Socket.io CORS configured

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] Build command tested locally
- [ ] No console errors in production build

## Testing

- [ ] All features tested locally
- [ ] API endpoints working
- [ ] WebSocket connections working
- [ ] Map component loading
- [ ] Mission creation working
- [ ] Real-time updates working
- [ ] No console errors

## Security

- [ ] No API keys in code
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database credentials secure
- [ ] HTTPS enabled (automatic on Vercel/Railway)

## Performance

- [ ] Frontend build optimized
- [ ] Images optimized (if any)
- [ ] Database queries optimized
- [ ] No unnecessary dependencies

## Documentation

- [ ] README updated
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented

## Deployment Steps

### Backend
- [ ] Platform account created (Railway/Render/Heroku)
- [ ] Repository connected
- [ ] Root directory set to `server`
- [ ] Environment variables configured
- [ ] Deployed and tested
- [ ] Backend URL copied

### Frontend
- [ ] Platform account created (Vercel/Netlify)
- [ ] Repository connected
- [ ] Root directory set to `client`
- [ ] Build settings configured
- [ ] Environment variables configured (with backend URL)
- [ ] Deployed and tested
- [ ] Frontend URL copied

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Frontend tested with production backend
- [ ] WebSocket connections tested
- [ ] All features verified
- [ ] Domain names configured (optional)
- [ ] SSL certificates verified (automatic)

## Monitoring

- [ ] Error logging set up
- [ ] Uptime monitoring configured
- [ ] Database backups scheduled
- [ ] Performance monitoring enabled

## Rollback Plan

- [ ] Know how to rollback deployment
- [ ] Previous version tagged in Git
- [ ] Database backup available

## Final Checks

- [ ] Application accessible via public URL
- [ ] All pages loading correctly
- [ ] API responding correctly
- [ ] Real-time features working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser tested

---

## Quick Test After Deployment

1. Visit frontend URL
2. Check browser console for errors
3. Test mission creation
4. Test real-time updates
5. Check backend logs for errors

## Common Issues

- **CORS errors**: Update `CORS_ORIGIN` in backend
- **API not found**: Check `NEXT_PUBLIC_API_URL` in frontend
- **WebSocket not working**: Verify Socket.io CORS config
- **Build fails**: Check Node.js version (requires 18+)

