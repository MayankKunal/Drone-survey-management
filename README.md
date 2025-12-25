# Drone Survey Management System

A scalable, full-stack application for planning, managing, and monitoring autonomous drone surveys across multiple global sites. This system provides comprehensive mission management, real-time monitoring, fleet coordination, and survey reporting capabilities.

## Features

### 🎯 Mission Planning and Configuration
- Define survey areas by drawing polygons on an interactive map
- Configure flight paths with multiple pattern types:
  - **Grid Pattern**: Systematic grid coverage for comprehensive area mapping
  - **Crosshatch Pattern**: Diagonal crosshatch for enhanced coverage
  - **Perimeter Pattern**: Boundary-focused surveys
- Set mission parameters:
  - Flight altitude (10-120 meters)
  - Overlap percentage (50-90%)
  - Waypoint generation based on pattern and parameters

### 🚁 Fleet Visualization and Management
- Real-time dashboard showing all drones in the fleet
- Status monitoring (available, in-mission, maintenance)
- Battery level tracking with visual indicators
- Location tracking for each drone
- Real-time updates via WebSocket

### 📊 Real-time Mission Monitoring
- Live map visualization of drone flight paths
- Real-time progress tracking (% complete)
- Mission status updates (planned, in-progress, paused, completed, aborted)
- Mission control actions:
  - Start mission
  - Pause/Resume mission
  - Abort mission
- Waypoint tracking with reached/pending status

### 📈 Survey Reporting and Analytics
- Comprehensive survey summaries
- Individual flight statistics:
  - Duration
  - Distance covered
  - Coverage area
- Organization-wide analytics:
  - Total surveys completed
  - Total flight time
  - Total distance covered
  - Average mission duration
- Monthly statistics with visual charts

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (easily switchable to PostgreSQL)
- **Socket.io** for real-time WebSocket communication
- RESTful API architecture

### Frontend
- **Next.js 14** with React
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive UI
- **Leaflet** for interactive map visualization
- **Recharts** for data visualization
- **Socket.io Client** for real-time updates

## Project Structure

```
fly/
├── server/                 # Backend API
│   ├── routes/            # API route handlers
│   │   ├── missions.js    # Mission management endpoints
│   │   ├── drones.js     # Fleet management endpoints
│   │   └── surveys.js    # Survey reporting endpoints
│   ├── utils/             # Utility functions
│   │   └── waypointGenerator.js  # Flight pattern algorithms
│   ├── database.js        # Database setup and models
│   └── index.js          # Express server and WebSocket setup
│
├── client/                # Frontend Next.js app
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Dashboard
│   │   ├── fleet/        # Fleet management page
│   │   ├── missions/     # Mission pages
│   │   │   ├── page.tsx  # Mission list
│   │   │   ├── new/      # Create mission
│   │   │   └── [id]/     # Mission detail/monitoring
│   │   └── reports/       # Analytics and reporting
│   ├── components/       # React components
│   │   └── MapComponent.tsx  # Interactive map component
│   └── lib/              # Utilities
│       └── api.ts        # API client configuration
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd fly
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This will install dependencies for the root, server, and client directories.

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both the backend server (port 5000) and frontend Next.js app (port 3000).

   Alternatively, you can run them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## Usage Guide

### Creating a Mission

1. Navigate to **Missions** → **Create Mission**
2. Click on the map to define your survey area (minimum 3 points)
3. Click the first point again to close the polygon
4. Fill in mission details:
   - Mission name
   - Select a drone (optional)
   - Choose flight pattern (Grid, Crosshatch, or Perimeter)
   - Set flight altitude
   - Adjust overlap percentage
5. Click **Create Mission**

### Monitoring a Mission

1. Navigate to **Missions** and click on a mission
2. View real-time progress on the map
3. Use mission control buttons to:
   - Start the mission
   - Pause/Resume during execution
   - Abort if needed
4. Watch waypoints being reached in real-time

### Viewing Fleet Status

1. Navigate to **Fleet** to see all drones
2. Monitor:
   - Battery levels
   - Current status
   - Location coordinates
3. Status updates are received in real-time via WebSocket

### Accessing Reports

1. Navigate to **Reports** for analytics
2. View:
   - Overview statistics
   - Monthly survey trends
   - Individual survey history
   - Performance metrics

## API Endpoints

### Missions
- `GET /api/missions` - Get all missions
- `GET /api/missions/:id` - Get mission details
- `POST /api/missions` - Create new mission
- `PATCH /api/missions/:id/status` - Update mission status
- `PATCH /api/missions/:id/progress` - Update mission progress
- `DELETE /api/missions/:id` - Delete mission

### Drones
- `GET /api/drones` - Get all drones
- `GET /api/drones/:id` - Get drone details
- `GET /api/drones/available/list` - Get available drones
- `PATCH /api/drones/:id/status` - Update drone status

### Surveys
- `GET /api/surveys` - Get all surveys
- `GET /api/surveys/:id` - Get survey details
- `POST /api/surveys` - Create survey record
- `GET /api/surveys/analytics/overview` - Get analytics

## WebSocket Events

### Client → Server
- `subscribe-mission` - Subscribe to mission updates

### Server → Client
- `mission-update` - Real-time mission status/progress updates
- `drone-update` - Real-time drone status updates

## Database Schema

The system uses SQLite with the following tables:
- **drones**: Drone inventory and status
- **missions**: Mission configurations and status
- **waypoints**: Flight path waypoints
- **surveys**: Completed survey records
- **sites**: Site/location information

## Development Notes

### Mission Progress Simulation
The system includes a simulation feature that automatically updates mission progress when a mission is in "in-progress" status. This demonstrates real-time updates and can be replaced with actual drone telemetry in production.

### Waypoint Generation
The system automatically generates waypoints based on:
- Survey area polygon
- Selected pattern type
- Flight altitude
- Overlap percentage

Algorithms are optimized for efficient coverage while minimizing flight time.

## Deployment

The application is ready for deployment! See deployment guides:

- **Quick Start**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for fastest deployment (5 minutes)
- **Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment options

### Recommended Hosting

- **Frontend**: Vercel (free, automatic SSL, CDN)
- **Backend**: Railway or Render (free tier available)
- **Alternative**: Docker Compose for self-hosting

### Quick Deploy Commands

```bash
# Push to GitHub
git push origin main

# Then deploy via:
# - Vercel dashboard (frontend)
# - Railway dashboard (backend)
```

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step instructions.

## Production Considerations

For production deployment:

1. **Database**: Switch from SQLite to PostgreSQL or MySQL (see DEPLOYMENT.md)
2. **Environment Variables**: Configure via hosting platform dashboard
3. **Authentication**: Add user authentication and authorization
4. **Error Handling**: Enhanced error handling already included
5. **Testing**: Add unit and integration tests
6. **Deployment**: Ready for Vercel (frontend) and Railway/Render (backend)
7. **Real Drone Integration**: Replace simulation with actual drone API integration
8. **SSL/HTTPS**: Automatically handled by Vercel/Railway
9. **Monitoring**: Set up logging and error tracking

## License

MIT

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

