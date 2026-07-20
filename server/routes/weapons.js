const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all weapons (admin/owner)
router.get('/', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { building_id, status } = req.query;
    let query = `SELECT w.*, u.full_name as holder_name, u.clearance_status as holder_clearance, b.name as site_name 
                 FROM weapons w 
                 LEFT JOIN users u ON w.current_holder_id = u.id 
                 LEFT JOIN buildings b ON w.building_id = b.id 
                 WHERE 1=1`;
    const params = [];
    
    if (building_id) {
      query += ' AND w.building_id = ?';
      params.push(building_id);
    }
    if (status) {
      query += ' AND w.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY w.weapon_type, w.serial_number';
    const weapons = await getAll(query, params);
    res.json({ weapons });
  } catch (err) {
    console.error('Fetch weapons error:', err);
    res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

// Get single weapon with assignment history
router.get('/:id', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const weapon = await getOne(`SELECT w.*, u.full_name as holder_name, u.clearance_status as holder_clearance, b.name as site_name 
                                 FROM weapons w 
                                 LEFT JOIN users u ON w.current_holder_id = u.id 
                                 LEFT JOIN buildings b ON w.building_id = b.id 
                                 WHERE w.id = ?`, [req.params.id]);
    if (!weapon) return res.status(404).json({ error: 'Weapon not found' });
    
    // Get assignment history
    const assignments = await getAll(`SELECT wa.*, 
                                             g.full_name as guard_name,
                                             i.full_name as issued_by_name,
                                             r.full_name as returned_to_name
                                      FROM weapon_assignments wa
                                      JOIN users g ON wa.guard_id = g.id
                                      JOIN users i ON wa.issued_by = i.id
                                      LEFT JOIN users r ON wa.returned_to = r.id
                                      WHERE wa.weapon_id = ?
                                      ORDER BY wa.issued_at DESC LIMIT 50`, [req.params.id]);
    
    res.json({ weapon, assignments });
  } catch (err) {
    console.error('Fetch weapon error:', err);
    res.status(500).json({ error: 'Failed to fetch weapon' });
  }
});

// Create weapon
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { serial_number, weapon_type, make, model, caliber, building_id, condition_notes } = req.body;
    
    if (!serial_number || !weapon_type) {
      return res.status(400).json({ error: 'Serial number and weapon type are required' });
    }
    
    const existing = await getOne('SELECT id FROM weapons WHERE serial_number = ?', [serial_number]);
    if (existing) {
      return res.status(400).json({ error: 'Weapon with this serial number already exists' });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await runQuery(`INSERT INTO weapons (id, serial_number, weapon_type, make, model, caliber, building_id, status, condition_notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?)`,
      [id, serial_number, weapon_type, make || null, model || null, caliber || null, building_id || null, condition_notes || null, now, now]);
    
    res.status(201).json({ message: 'Weapon registered', weapon_id: id });
  } catch (err) {
    console.error('Create weapon error:', err);
    res.status(500).json({ error: 'Failed to register weapon' });
  }
});

// Update weapon
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { serial_number, weapon_type, make, model, caliber, building_id, condition_notes } = req.body;
    const now = new Date().toISOString();
    
    await runQuery(`UPDATE weapons SET 
                    serial_number = COALESCE(?, serial_number),
                    weapon_type = COALESCE(?, weapon_type),
                    make = COALESCE(?, make),
                    model = COALESCE(?, model),
                    caliber = COALESCE(?, caliber),
                    building_id = COALESCE(?, building_id),
                    condition_notes = COALESCE(?, condition_notes),
                    updated_at = ?
                    WHERE id = ?`,
      [serial_number, weapon_type, make, model, caliber, building_id, condition_notes, now, req.params.id]);
    
    res.json({ message: 'Weapon updated' });
  } catch (err) {
    console.error('Update weapon error:', err);
    res.status(500).json({ error: 'Failed to update weapon' });
  }
});

// Issue weapon to guard
router.post('/:id/issue', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const { guard_id, condition_on_issue, notes } = req.body;
    
    if (!guard_id) {
      return res.status(400).json({ error: 'Guard ID is required' });
    }
    
    // Check weapon availability
    const weapon = await getOne('SELECT * FROM weapons WHERE id = ?', [req.params.id]);
    if (!weapon) return res.status(404).json({ error: 'Weapon not found' });
    if (weapon.status !== 'available') {
      return res.status(400).json({ error: 'Weapon is not available for issue' });
    }
    
    // Check guard clearance
    const guard = await getOne("SELECT id, full_name, clearance_status FROM users WHERE id = ? AND role IN ('staff', 'security') AND is_active = 1", [guard_id]);
    if (!guard) return res.status(404).json({ error: 'Guard not found' });
    if (guard.clearance_status !== 'cleared') {
      return res.status(400).json({ error: `Guard ${guard.full_name} is not cleared for weapon handling (status: ${guard.clearance_status || 'not_cleared'})` });
    }
    
    const now = new Date().toISOString();
    const assignmentId = uuidv4();
    
    // Create assignment record
    await runQuery(`INSERT INTO weapon_assignments (id, weapon_id, guard_id, issued_by, issued_at, condition_on_issue, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [assignmentId, req.params.id, guard_id, req.user.id, now, condition_on_issue || null, notes || null]);
    
    // Update weapon status
    await runQuery(`UPDATE weapons SET status = 'issued', current_holder_id = ?, issued_at = ?, updated_at = ? WHERE id = ?`,
      [guard_id, now, now, req.params.id]);
    
    res.json({ message: `Weapon issued to ${guard.full_name}`, assignment_id: assignmentId });
  } catch (err) {
    console.error('Issue weapon error:', err);
    res.status(500).json({ error: 'Failed to issue weapon' });
  }
});

// Return weapon
router.post('/:id/return', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const { condition_on_return, notes } = req.body;
    
    const weapon = await getOne('SELECT * FROM weapons WHERE id = ?', [req.params.id]);
    if (!weapon) return res.status(404).json({ error: 'Weapon not found' });
    if (weapon.status !== 'issued') {
      return res.status(400).json({ error: 'Weapon is not currently issued' });
    }
    
    const now = new Date().toISOString();
    
    // Find active assignment and close it
    const assignment = await getOne('SELECT id FROM weapon_assignments WHERE weapon_id = ? AND returned_at IS NULL ORDER BY issued_at DESC LIMIT 1', [req.params.id]);
    if (assignment) {
      await runQuery(`UPDATE weapon_assignments SET returned_at = ?, returned_to = ?, condition_on_return = ?, notes = COALESCE(?, notes) WHERE id = ?`,
        [now, req.user.id, condition_on_return || null, notes, assignment.id]);
    }
    
    // Update weapon status
    await runQuery(`UPDATE weapons SET status = 'available', current_holder_id = NULL, returned_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, req.params.id]);
    
    res.json({ message: 'Weapon returned successfully' });
  } catch (err) {
    console.error('Return weapon error:', err);
    res.status(500).json({ error: 'Failed to return weapon' });
  }
});

// Get weapons currently issued (for quick view)
router.get('/status/issued', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const weapons = await getAll(`SELECT w.*, u.full_name as holder_name, u.clearance_status as holder_clearance, b.name as site_name 
                                  FROM weapons w 
                                  JOIN users u ON w.current_holder_id = u.id 
                                  LEFT JOIN buildings b ON w.building_id = b.id 
                                  WHERE w.status = 'issued'
                                  ORDER BY w.issued_at DESC`);
    res.json({ weapons });
  } catch (err) {
    console.error('Fetch issued weapons error:', err);
    res.status(500).json({ error: 'Failed to fetch issued weapons' });
  }
});

module.exports = router;
