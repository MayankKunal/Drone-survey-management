const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { generateWaypoints } = require('../utils/waypointGenerator');

// Get all missions
router.get('/', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(`
    SELECT m.*, d.name as drone_name, d.model as drone_model
    FROM missions m
    LEFT JOIN drones d ON m.drone_id = d.id
    ORDER BY m.created_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => ({
      ...row,
      waypoints: row.waypoints ? JSON.parse(row.waypoints) : [],
      survey_area: row.survey_area ? JSON.parse(row.survey_area) : null
    })));
  });
});

// Get mission by ID
router.get('/:id', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.get(`
    SELECT m.*, d.name as drone_name, d.model as drone_model
    FROM missions m
    LEFT JOIN drones d ON m.drone_id = d.id
    WHERE m.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }
    
    // Get waypoints
    dbInstance.all(`
      SELECT * FROM waypoints
      WHERE mission_id = ?
      ORDER BY sequence_number
    `, [req.params.id], (err, waypoints) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        ...row,
        waypoints: waypoints,
        survey_area: row.survey_area ? JSON.parse(row.survey_area) : null
      });
    });
  });
});

// Create new mission
router.post('/', (req, res) => {
  const {
    name,
    drone_id,
    site_id,
    pattern_type,
    flight_altitude,
    overlap_percentage,
    survey_area
  } = req.body;

  console.log('Creating mission with data:', { name, pattern_type, flight_altitude, overlap_percentage, survey_area_length: survey_area?.length });

  if (!name || !survey_area) {
    return res.status(400).json({ error: 'Name and survey_area are required' });
  }

  if (!Array.isArray(survey_area) || survey_area.length < 3) {
    return res.status(400).json({ error: 'Survey area must be an array with at least 3 points' });
  }

  // Validate survey area points
  for (let i = 0; i < survey_area.length; i++) {
    const point = survey_area[i];
    if (!point.lat || !point.lng) {
      return res.status(400).json({ error: `Invalid point at index ${i}. Points must have lat and lng properties.` });
    }
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      return res.status(400).json({ error: `Invalid point at index ${i}. lat and lng must be numbers.` });
    }
  }

  const missionId = uuidv4();
  const dbInstance = db.getDb();

  // Generate waypoints based on pattern
  let waypoints;
  try {
    waypoints = generateWaypoints(survey_area, pattern_type || 'grid', {
      altitude: flight_altitude || 50,
      overlap: overlap_percentage || 70
    });

    if (!waypoints || waypoints.length === 0) {
      console.error('No waypoints generated for survey area:', survey_area);
      return res.status(400).json({ error: 'Failed to generate waypoints. Please check your survey area coordinates.' });
    }

    console.log(`Generated ${waypoints.length} waypoints`);
  } catch (error) {
    console.error('Error generating waypoints:', error);
    return res.status(500).json({ error: 'Failed to generate waypoints: ' + error.message });
  }

  // Calculate estimated duration (rough estimate: 1 minute per waypoint)
  const estimated_duration = waypoints.length * 60;

  dbInstance.run(`
    INSERT INTO missions (
      id, name, drone_id, site_id, pattern_type, flight_altitude,
      overlap_percentage, survey_area, waypoints, estimated_duration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    missionId,
    name,
    drone_id || null,
    site_id || null,
    pattern_type || 'grid',
    flight_altitude || 50,
    overlap_percentage || 70,
    JSON.stringify(survey_area),
    JSON.stringify(waypoints),
    estimated_duration
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Insert waypoints
    const stmt = dbInstance.prepare(`
      INSERT INTO waypoints (id, mission_id, sequence_number, latitude, longitude, altitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    waypoints.forEach((wp, index) => {
      stmt.run(uuidv4(), missionId, index, wp.lat, wp.lng, wp.altitude || flight_altitude || 50);
    });

    stmt.finalize((err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get the created mission
      dbInstance.get(`
        SELECT * FROM missions WHERE id = ?
      `, [missionId], (err, mission) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        dbInstance.all(`
          SELECT * FROM waypoints WHERE mission_id = ? ORDER BY sequence_number
        `, [missionId], (err, waypoints) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.status(201).json({
            ...mission,
            waypoints: waypoints,
            survey_area: JSON.parse(mission.survey_area)
          });
        });
      });
    });
  });
});

// Update mission status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const dbInstance = db.getDb();
  const io = req.app.get('io');

  const updates = { status };
  if (status === 'in-progress') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'aborted') {
    updates.completed_at = new Date().toISOString();
  }

  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(req.params.id);

  dbInstance.run(`
    UPDATE missions
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Get updated mission
    dbInstance.get(`
      SELECT m.*, d.name as drone_name
      FROM missions m
      LEFT JOIN drones d ON m.drone_id = d.id
      WHERE m.id = ?
    `, [req.params.id], (err, mission) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get waypoints
      dbInstance.all(`
        SELECT * FROM waypoints WHERE mission_id = ? ORDER BY sequence_number
      `, [req.params.id], (err, waypoints) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const missionData = {
          ...mission,
          waypoints: waypoints || [],
          survey_area: mission.survey_area ? JSON.parse(mission.survey_area) : null
        };

        // Emit real-time update
        if (io) {
          io.to(`mission-${req.params.id}`).emit('mission-update', missionData);
        }

        res.json(missionData);
      });
    });
  });
});

// Update mission progress
router.patch('/:id/progress', (req, res) => {
  const { progress, current_waypoint } = req.body;
  const dbInstance = db.getDb();
  const io = req.app.get('io');

  dbInstance.run(`
    UPDATE missions
    SET progress = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [progress || 0, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Update waypoint if provided
    if (current_waypoint !== undefined) {
      dbInstance.run(`
        UPDATE waypoints
        SET reached = 1, reached_at = CURRENT_TIMESTAMP
        WHERE mission_id = ? AND sequence_number = ?
      `, [req.params.id, current_waypoint], () => {});
    }

    // Get updated mission
    dbInstance.get(`
      SELECT m.*, d.name as drone_name
      FROM missions m
      LEFT JOIN drones d ON m.drone_id = d.id
      WHERE m.id = ?
    `, [req.params.id], (err, mission) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      dbInstance.all(`
        SELECT * FROM waypoints WHERE mission_id = ? ORDER BY sequence_number
      `, [req.params.id], (err, waypoints) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const missionData = {
          ...mission,
          waypoints: waypoints,
          survey_area: mission.survey_area ? JSON.parse(mission.survey_area) : null
        };

        // Emit real-time update
        if (io) {
          io.to(`mission-${req.params.id}`).emit('mission-update', missionData);
        }

        res.json(missionData);
      });
    });
  });
});

// Delete mission
router.delete('/:id', (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.run('DELETE FROM waypoints WHERE mission_id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    dbInstance.run('DELETE FROM missions WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Mission deleted' });
    });
  });
});

module.exports = router;

