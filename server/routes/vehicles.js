const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all vehicles (admin/owner)
router.get('/', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { building_id, status } = req.query;
    let query = `SELECT v.*, u.full_name as driver_name, b.name as site_name 
                 FROM vehicles v 
                 LEFT JOIN users u ON v.assigned_driver_id = u.id 
                 LEFT JOIN buildings b ON v.building_id = b.id 
                 WHERE 1=1`;
    const params = [];
    
    if (building_id) {
      query += ' AND v.building_id = ?';
      params.push(building_id);
    }
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY v.registration_number';
    const vehicles = await getAll(query, params);
    res.json({ vehicles });
  } catch (err) {
    console.error('Fetch vehicles error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle with tracking history
router.get('/:id', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const vehicle = await getOne(`SELECT v.*, u.full_name as driver_name, b.name as site_name 
                                  FROM vehicles v 
                                  LEFT JOIN users u ON v.assigned_driver_id = u.id 
                                  LEFT JOIN buildings b ON v.building_id = b.id 
                                  WHERE v.id = ?`, [req.params.id]);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    
    // Get recent tracking history (last 24 hours)
    const tracking = await getAll(`SELECT * FROM vehicle_tracking 
                                   WHERE vehicle_id = ? 
                                   AND recorded_at > datetime('now', '-24 hours')
                                   ORDER BY recorded_at DESC LIMIT 100`, [req.params.id]);
    
    res.json({ vehicle, tracking });
  } catch (err) {
    console.error('Fetch vehicle error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Create vehicle
router.post('/', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { registration_number, make, model, color, assigned_driver_id, building_id } = req.body;
    
    if (!registration_number) {
      return res.status(400).json({ error: 'Registration number is required' });
    }
    
    const existing = await getOne('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number]);
    if (existing) {
      return res.status(400).json({ error: 'Vehicle with this registration already exists' });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await runQuery(`INSERT INTO vehicles (id, registration_number, make, model, color, assigned_driver_id, building_id, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [id, registration_number, make || null, model || null, color || null, assigned_driver_id || null, building_id || null, now, now]);
    
    res.status(201).json({ message: 'Vehicle created', vehicle_id: id });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { registration_number, make, model, color, assigned_driver_id, building_id, status } = req.body;
    const now = new Date().toISOString();
    
    await runQuery(`UPDATE vehicles SET 
                    registration_number = COALESCE(?, registration_number),
                    make = COALESCE(?, make),
                    model = COALESCE(?, model),
                    color = COALESCE(?, color),
                    assigned_driver_id = COALESCE(?, assigned_driver_id),
                    building_id = COALESCE(?, building_id),
                    status = COALESCE(?, status),
                    updated_at = ?
                    WHERE id = ?`,
      [registration_number, make, model, color, assigned_driver_id, building_id, status, now, req.params.id]);
    
    res.json({ message: 'Vehicle updated' });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Record vehicle location (from driver app or GPS device)
router.post('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const vehicle = await getOne('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    
    const now = new Date().toISOString();
    const trackingId = uuidv4();
    
    // Record tracking point
    await runQuery(`INSERT INTO vehicle_tracking (id, vehicle_id, driver_id, latitude, longitude, speed, heading, recorded_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trackingId, req.params.id, req.user.id, latitude, longitude, speed || null, heading || null, now]);
    
    // Update vehicle's last known location
    await runQuery(`UPDATE vehicles SET last_latitude = ?, last_longitude = ?, last_location_update = ?, updated_at = ? WHERE id = ?`,
      [latitude, longitude, now, now, req.params.id]);
    
    res.json({ message: 'Location recorded' });
  } catch (err) {
    console.error('Record location error:', err);
    res.status(500).json({ error: 'Failed to record location' });
  }
});

// Get all vehicle locations (for map view)
router.get('/locations/all', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const vehicles = await getAll(`SELECT v.id, v.registration_number, v.make, v.model, v.color, v.status,
                                          v.last_latitude, v.last_longitude, v.last_location_update,
                                          u.full_name as driver_name, b.name as site_name
                                   FROM vehicles v
                                   LEFT JOIN users u ON v.assigned_driver_id = u.id
                                   LEFT JOIN buildings b ON v.building_id = b.id
                                   WHERE v.status = 'active' AND v.last_latitude IS NOT NULL`);
    res.json({ vehicles });
  } catch (err) {
    console.error('Fetch vehicle locations error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle locations' });
  }
});

module.exports = router;
