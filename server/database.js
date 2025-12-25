const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'drone_survey.db');

let db;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drones table
      db.run(`CREATE TABLE IF NOT EXISTS drones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        model TEXT,
        status TEXT DEFAULT 'available',
        battery_level INTEGER DEFAULT 100,
        location_lat REAL,
        location_lng REAL,
        site_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Missions table
      db.run(`CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        drone_id TEXT,
        site_id TEXT,
        status TEXT DEFAULT 'planned',
        pattern_type TEXT DEFAULT 'grid',
        flight_altitude REAL DEFAULT 50,
        overlap_percentage REAL DEFAULT 70,
        survey_area TEXT,
        waypoints TEXT,
        progress REAL DEFAULT 0,
        estimated_duration INTEGER,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drone_id) REFERENCES drones(id)
      )`);

      // Waypoints table
      db.run(`CREATE TABLE IF NOT EXISTS waypoints (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        reached BOOLEAN DEFAULT 0,
        reached_at DATETIME,
        FOREIGN KEY (mission_id) REFERENCES missions(id),
        UNIQUE(mission_id, sequence_number)
      )`);

      // Surveys table
      db.run(`CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        drone_id TEXT,
        duration INTEGER,
        distance_covered REAL,
        coverage_area REAL,
        status TEXT DEFAULT 'completed',
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mission_id) REFERENCES missions(id),
        FOREIGN KEY (drone_id) REFERENCES drones(id)
      )`);

      // Sites table
      db.run(`CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`PRAGMA foreign_keys = ON`, (err) => {
        if (err) reject(err);
        else {
          seedInitialData().then(resolve).catch(reject);
        }
      });
    });
  });
};

const seedInitialData = () => {
  return new Promise((resolve, reject) => {
    // Check if data already exists
    db.get("SELECT COUNT(*) as count FROM drones", (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        resolve();
        return;
      }

      // Seed sample drones
      const drones = [
        { id: uuidv4(), name: 'Drone Alpha-01', model: 'DJI Phantom 4 Pro', status: 'available', battery_level: 95, location_lat: 37.7749, location_lng: -122.4194 },
        { id: uuidv4(), name: 'Drone Beta-02', model: 'DJI Mavic 3', status: 'available', battery_level: 87, location_lat: 40.7128, location_lng: -74.0060 },
        { id: uuidv4(), name: 'Drone Gamma-03', model: 'DJI Inspire 2', status: 'available', battery_level: 100, location_lat: 34.0522, location_lng: -118.2437 },
        { id: uuidv4(), name: 'Drone Delta-04', model: 'DJI Mini 3 Pro', status: 'in-mission', battery_level: 65, location_lat: 25.7617, location_lng: -80.1918 },
      ];

      const stmt = db.prepare("INSERT INTO drones (id, name, model, status, battery_level, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?, ?)");
      
      drones.forEach(drone => {
        stmt.run(drone.id, drone.name, drone.model, drone.status, drone.battery_level, drone.location_lat, drone.location_lng);
      });
      
      stmt.finalize((err) => {
        if (err) reject(err);
        else {
          console.log('Initial data seeded');
          resolve();
        }
      });
    });
  });
};

const getDb = () => db;

const close = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  init,
  getDb,
  close
};

