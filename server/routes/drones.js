const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all drones
router.get('/', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(`
    SELECT * FROM drones
    ORDER BY name
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get drone by ID
router.get('/:id', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.get(`
    SELECT * FROM drones WHERE id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Drone not found' });
      return;
    }
    res.json(row);
  });
});

// Update drone status
router.patch('/:id/status', (req, res) => {
  const { status, battery_level, location_lat, location_lng } = req.body;
  const dbInstance = db.getDb();
  const io = req.app.get('io');

  const updates = {};
  if (status !== undefined) updates.status = status;
  if (battery_level !== undefined) updates.battery_level = battery_level;
  if (location_lat !== undefined) updates.location_lat = location_lat;
  if (location_lng !== undefined) updates.location_lng = location_lng;

  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(req.params.id);

  dbInstance.run(`
    UPDATE drones
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    dbInstance.get('SELECT * FROM drones WHERE id = ?', [req.params.id], (err, drone) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Emit real-time update
      if (io) {
        io.emit('drone-update', drone);
      }

      res.json(drone);
    });
  });
});

// Get available drones
router.get('/available/list', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(`
    SELECT * FROM drones
    WHERE status = 'available'
    ORDER BY name
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;

