const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateEntryQRCode } = require('../utils/qrcode');

const router = express.Router();

// Create building
router.post('/', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { name, address } = req.body;
    let ownerId = req.body.owner_id;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    // If user is owner, they create building for themselves
    // If user is admin and no owner_id provided, admin becomes the owner
    if (req.user.role === 'owner') {
      ownerId = req.user.id;
    } else if (req.user.role === 'admin' && !ownerId) {
      ownerId = req.user.id;
    }

    const buildingId = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const entryQRCode = await generateEntryQRCode(buildingId, baseUrl);
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO buildings (id, name, address, owner_id, entry_qr_code, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`, [buildingId, name, address, ownerId, entryQRCode, now, now]);
    const building = await getOne('SELECT * FROM buildings WHERE id = ?', [buildingId]);

    res.status(201).json({
      message: 'Building created successfully',
      building
    });
  } catch (err) {
    console.error('Create building error:', err);
    res.status(500).json({ error: 'Failed to create building' });
  }
});

// Get all buildings (admin sees all, owner sees theirs)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let buildings;
    if (req.user.role === 'admin') {
      buildings = await getAll(`SELECT b.*, u.full_name as owner_name, u.email as owner_email FROM buildings b JOIN users u ON b.owner_id = u.id WHERE b.is_active = 1 ORDER BY b.name`, []);
    } else if (req.user.role === 'owner') {
      buildings = await getAll(`SELECT * FROM buildings WHERE owner_id = ? AND is_active = 1 ORDER BY name`, [req.user.id]);
    } else {
      buildings = req.user.building_id ? await getAll(`SELECT id, name, address FROM buildings WHERE id = ? AND is_active = 1`, [req.user.building_id]) : [];
    }
    res.json({ buildings });
  } catch (err) {
    console.error('Fetch buildings error:', err);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// Get building by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const building = await getOne(`SELECT b.*, u.full_name as owner_name, u.email as owner_email FROM buildings b JOIN users u ON b.owner_id = u.id WHERE b.id = ?`, [id]);
    if (!building) { return res.status(404).json({ error: 'Building not found' }); }
    const visitorCount = await getOne(`SELECT COUNT(*) as count FROM visitors WHERE building_id = ?`, [id]) || { count: 0 };
    const tenantCount = await getOne(`SELECT COUNT(*) as count FROM tenants WHERE building_id = ? AND is_active = 1`, [id]) || { count: 0 };
    const staffCount = await getOne(`SELECT COUNT(*) as count FROM users WHERE building_id = ? AND role = 'staff' AND is_active = 1`, [id]) || { count: 0 };

    res.json({
      building,
      stats: {
        visitors_today: visitorCount.count,
        total_tenants: tenantCount.count,
        total_staff: staffCount.count
      }
    });
  } catch (err) {
    console.error('Fetch building error:', err);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
});

// Get building info (public - for visitor check-in)
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    const building = await getOne(`SELECT id, name, address FROM buildings WHERE id = ? AND is_active = 1`, [id]);

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    res.json({ building });
  } catch (err) {
    console.error('Fetch building error:', err);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
});

// Update building
router.put('/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const building = await getOne('SELECT * FROM buildings WHERE id = ?', [id]);
    if (!building) { return res.status(404).json({ error: 'Building not found' }); }
    if (req.user.role === 'owner' && building.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this building' });
    }
    const now = new Date().toISOString();
    await runQuery(`UPDATE buildings SET name = COALESCE(?, name), address = COALESCE(?, address), updated_at = ? WHERE id = ?`, [name, address, now, id]);
    const updatedBuilding = await getOne('SELECT * FROM buildings WHERE id = ?', [id]);

    res.json({
      message: 'Building updated successfully',
      building: updatedBuilding
    });
  } catch (err) {
    console.error('Update building error:', err);
    res.status(500).json({ error: 'Failed to update building' });
  }
});

// Regenerate QR code
router.post('/:id/regenerate-qr', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const building = await getOne('SELECT * FROM buildings WHERE id = ?', [id]);
    if (!building) { return res.status(404).json({ error: 'Building not found' }); }
    if (req.user.role === 'owner' && building.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const entryQRCode = await generateEntryQRCode(id, baseUrl);
    const now = new Date().toISOString();
    await runQuery('UPDATE buildings SET entry_qr_code = ?, updated_at = ? WHERE id = ?', [entryQRCode, now, id]);

    res.json({
      message: 'QR code regenerated successfully',
      qr_code: entryQRCode
    });
  } catch (err) {
    console.error('Regenerate QR error:', err);
    res.status(500).json({ error: 'Failed to regenerate QR code' });
  }
});

// Deactivate building
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const building = await getOne('SELECT * FROM buildings WHERE id = ?', [id]);
    if (!building) { return res.status(404).json({ error: 'Building not found' }); }
    if (req.user.role === 'owner' && building.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const now = new Date().toISOString();
    await runQuery('UPDATE buildings SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);

    res.json({ message: 'Building deactivated successfully' });
  } catch (err) {
    console.error('Deactivate building error:', err);
    res.status(500).json({ error: 'Failed to deactivate building' });
  }
});

module.exports = router;
