# Quick Setup Guide

## Prerequisites
- Node.js 18 or higher
- npm or yarn

## Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend app on http://localhost:3000

## First Run

1. Open your browser and navigate to http://localhost:3000
2. You'll see the dashboard with sample data (4 drones pre-seeded)
3. Navigate to "Missions" → "Create Mission" to create your first mission
4. Click on the map to define a survey area (minimum 3 points)
5. Configure mission parameters and create the mission

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Set `PORT` environment variable (e.g., `PORT=5001 npm run server`)
- Frontend: Next.js will automatically use the next available port

### Database Issues
The SQLite database is created automatically on first run. If you need to reset:
- Delete `server/drone_survey.db`
- Restart the server

### Socket.io Connection Issues
Make sure both servers are running. The frontend connects to `http://localhost:5000` by default.

## Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

