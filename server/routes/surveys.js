const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// Get all surveys
router.get('/', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(`
    SELECT s.*, m.name as mission_name, d.name as drone_name
    FROM surveys s
    LEFT JOIN missions m ON s.mission_id = m.id
    LEFT JOIN drones d ON s.drone_id = d.id
    ORDER BY s.completed_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get survey by ID
router.get('/:id', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.get(`
    SELECT s.*, m.name as mission_name, d.name as drone_name
    FROM surveys s
    LEFT JOIN missions m ON s.mission_id = m.id
    LEFT JOIN drones d ON s.drone_id = d.id
    WHERE s.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }
    res.json(row);
  });
});

// Create survey from completed mission
router.post('/', (req, res) => {
  const {
    mission_id,
    drone_id,
    duration,
    distance_covered,
    coverage_area
  } = req.body;

  if (!mission_id) {
    return res.status(400).json({ error: 'mission_id is required' });
  }

  const surveyId = uuidv4();
  const dbInstance = db.getDb();

  dbInstance.run(`
    INSERT INTO surveys (
      id, mission_id, drone_id, duration, distance_covered, coverage_area
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    surveyId,
    mission_id,
    drone_id || null,
    duration || 0,
    distance_covered || 0,
    coverage_area || 0
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    dbInstance.get('SELECT * FROM surveys WHERE id = ?', [surveyId], (err, survey) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(survey);
    });
  });
});

// Get analytics/statistics
router.get('/analytics/overview', (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.get(`
    SELECT 
      COUNT(*) as total_surveys,
      SUM(duration) as total_duration,
      SUM(distance_covered) as total_distance,
      SUM(coverage_area) as total_coverage,
      AVG(duration) as avg_duration,
      AVG(distance_covered) as avg_distance
    FROM surveys
    WHERE status = 'completed'
  `, (err, stats) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Get surveys by month
    dbInstance.all(`
      SELECT 
        strftime('%Y-%m', completed_at) as month,
        COUNT(*) as count,
        SUM(duration) as total_duration
      FROM surveys
      WHERE status = 'completed'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, (err, monthly) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        overview: stats,
        monthly_stats: monthly
      });
    });
  });
});

module.exports = router;

