const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery, saveDatabase } = require('../database/init');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { encrypt, decrypt, hashFingerprint } = require('../utils/encryption');

const router = express.Router();

// Check-in visitor (public endpoint)
router.post('/check-in', async (req, res) => {
  try {
    const { full_name, phone, id_number, purpose, building_id, device_fingerprint } = req.body;
    const ipAddress = req.clientIP;

    if (!full_name || !phone || !id_number || !purpose || !building_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify building exists
    const building = await getOne('SELECT id, name FROM buildings WHERE id = ? AND is_active = 1', [building_id]);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Check if visitor already checked in (same device fingerprint)
    if (device_fingerprint) {
      const hashedFingerprint = hashFingerprint(device_fingerprint);
      const existingVisit = await getOne(`SELECT id, full_name FROM visitors WHERE device_fingerprint = ? AND building_id = ? AND status = 'checked_in'`, [hashedFingerprint, building_id]);

      if (existingVisit) {
        return res.status(400).json({ 
          error: 'You are already checked in',
          existing_visit: {
            id: existingVisit.id,
            full_name: existingVisit.full_name
          },
          action: 'already_checked_in'
        });
      }
    }

    // Encrypt sensitive data
    const encryptedIdNumber = encrypt(id_number);
    const hashedFP = device_fingerprint ? hashFingerprint(device_fingerprint) : null;

    const visitorId = uuidv4();
    
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO visitors (id, full_name, phone, id_number_encrypted, purpose, building_id, device_fingerprint, ip_address, status, check_in_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'checked_in', ?, ?)`, [visitorId, full_name, phone, encryptedIdNumber, purpose, building_id, hashedFP, ipAddress, now, now]);

    res.status(201).json({
      message: 'Check-in successful',
      visitor: {
        id: visitorId,
        full_name,
        phone,
        purpose,
        building_id,
        building_name: building.name,
        check_in_time: now,
        status: 'checked_in'
      }
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Check-out visitor (public endpoint)
router.post('/check-out', async (req, res) => {
  try {
    const { building_id, device_fingerprint, visitor_id } = req.body;
    const ipAddress = req.clientIP;

    let visitor;

    // Find visitor by device fingerprint or visitor ID
    if (device_fingerprint) {
      const hashedFingerprint = hashFingerprint(device_fingerprint);
      visitor = await getOne(`SELECT id, full_name, check_in_time FROM visitors WHERE device_fingerprint = ? AND building_id = ? AND status = 'checked_in' ORDER BY check_in_time DESC LIMIT 1`, [hashedFingerprint, building_id]);
    } else if (visitor_id) {
      visitor = await getOne(`SELECT id, full_name, check_in_time FROM visitors WHERE id = ? AND status = 'checked_in'`, [visitor_id]);
    }

    if (!visitor) {
      return res.status(404).json({ error: 'No active check-in found for this device' });
    }

    // Update visitor record
    const checkOutNow = new Date().toISOString();
    await runQuery(`UPDATE visitors SET check_out_time = ?, status = 'checked_out' WHERE id = ?`, [checkOutNow, visitor.id]);

    const checkInTime = new Date(visitor.check_in_time);
    const checkOutTime = new Date();
    const durationMs = checkOutTime - checkInTime;
    const durationMinutes = Math.round(durationMs / 60000);

    res.json({
      message: 'Check-out successful',
      visitor_name: visitor.full_name,
      check_in_time: visitor.check_in_time,
      check_out_time: checkOutTime.toISOString(),
      duration_minutes: durationMinutes
    });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// Check visitor status (for QR scan)
router.post('/status', async (req, res) => {
  try {
    const { building_id, device_fingerprint } = req.body;

    if (!building_id || !device_fingerprint) {
      return res.status(400).json({ error: 'Building ID and device fingerprint required' });
    }

    const hashedFingerprint = hashFingerprint(device_fingerprint);
    const visitor = await getOne(`SELECT id, full_name, status, check_in_time FROM visitors WHERE device_fingerprint = ? AND building_id = ? AND status = 'checked_in' ORDER BY check_in_time DESC LIMIT 1`, [hashedFingerprint, building_id]);

    if (visitor) {
      res.json({
        status: 'checked_in',
        visitor: {
          id: visitor.id,
          full_name: visitor.full_name,
          check_in_time: visitor.check_in_time,
          status: visitor.status
        },
        action: 'checkout'
      });
    } else {
      res.json({
        status: 'not_checked_in',
        action: 'checkin'
      });
    }
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Get all visitors (for admins without building_id - returns all visitors)
router.get('/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    let query = 'SELECT v.*, b.name as building_name FROM visitors v LEFT JOIN buildings b ON v.building_id = b.id WHERE 1=1';
    const params = [];
    if (date) { query += " AND v.check_in_time::date = ?"; params.push(date); }
    if (status) { query += ' AND v.status = ?'; params.push(status); }
    query += ' ORDER BY v.check_in_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const visitors = await getAll(query, params);
    const decryptedVisitors = visitors.map(v => ({ ...v, id_number: decrypt(v.id_number_encrypted), id_number_encrypted: undefined }));
    
    let countQuery = 'SELECT COUNT(*) as count FROM visitors WHERE 1=1';
    const countParams = [];
    if (date) { countQuery += " AND check_in_time::date = ?"; countParams.push(date); }
    if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
    const countResult = await getOne(countQuery, countParams);
    const count = countResult ? parseInt(countResult.count) : 0;

    res.json({
      visitors: decryptedVisitors,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Fetch all visitors error:', err);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// Get all visitors for a building (admin/owner/security/staff)
router.get('/building/:buildingId', authenticateToken, authorizeRoles('admin', 'owner', 'security', 'staff'), async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { date, status, page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    let query = 'SELECT v.*, b.name as building_name FROM visitors v LEFT JOIN buildings b ON v.building_id = b.id WHERE v.building_id = ?';
    const params = [buildingId];
    if (date) { query += " AND date(check_in_time) = ?"; params.push(date); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY check_in_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const visitors = await getAll(query, params);
    const decryptedVisitors = visitors.map(v => ({ ...v, id_number: decrypt(v.id_number_encrypted), id_number_encrypted: undefined }));
    let countQuery = 'SELECT COUNT(*) as count FROM visitors WHERE building_id = ?';
    const countParams = [buildingId];
    if (date) { countQuery += " AND date(check_in_time) = ?"; countParams.push(date); }
    if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
    const countResult = await getOne(countQuery, countParams);
    const count = countResult ? countResult.count : 0;

    res.json({
      visitors: decryptedVisitors,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Fetch visitors error:', err);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// Get visitor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await getOne('SELECT * FROM visitors WHERE id = ?', [id]);
    
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({
      ...visitor,
      id_number: decrypt(visitor.id_number_encrypted),
      id_number_encrypted: undefined
    });
  } catch (err) {
    console.error('Fetch visitor error:', err);
    res.status(500).json({ error: 'Failed to fetch visitor' });
  }
});

// Sync offline visitors
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { visitors } = req.body;
    const results = [];
    for (const visitor of visitors) {
      try {
        const encryptedIdNumber = encrypt(visitor.id_number);
        const hashedFP = visitor.device_fingerprint ? hashFingerprint(visitor.device_fingerprint) : null;
        await runQuery(`INSERT OR REPLACE INTO visitors (id, full_name, phone, id_number_encrypted, purpose, building_id, device_fingerprint, ip_address, check_in_time, check_out_time, status, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [visitor.id, visitor.full_name, visitor.phone, encryptedIdNumber, visitor.purpose, visitor.building_id, hashedFP, visitor.ip_address, visitor.check_in_time, visitor.check_out_time, visitor.status]);
        results.push({ id: visitor.id, synced: true });
      } catch (err) { results.push({ id: visitor.id, synced: false, error: err.message }); }
    }

    res.json({ results });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
