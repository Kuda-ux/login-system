const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Staff clock in
router.post('/clock-in', authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const staffId = req.user.id;
    const buildingId = req.user.building_id;
    const ipAddress = req.clientIP;
    const today = new Date().toISOString().split('T')[0];

    if (!buildingId) {
      return res.status(400).json({ error: 'Staff not assigned to any building' });
    }

    // Check if already clocked in today
    const existingRecord = await getOne(`SELECT id, clock_in_time FROM staff_attendance WHERE staff_id = ? AND work_date = ? AND clock_out_time IS NULL`, [staffId, today]);

    if (existingRecord) {
      return res.status(400).json({ 
        error: 'Already clocked in today',
        clock_in_time: existingRecord.clock_in_time
      });
    }

    const attendanceId = uuidv4();
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO staff_attendance (id, staff_id, building_id, clock_in_time, ip_address, work_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [attendanceId, staffId, buildingId, now, ipAddress, today, now]);
    const record = await getOne('SELECT * FROM staff_attendance WHERE id = ?', [attendanceId]);

    res.status(201).json({
      message: 'Clock-in successful',
      attendance: record
    });
  } catch (err) {
    console.error('Clock-in error:', err);
    res.status(500).json({ error: 'Clock-in failed' });
  }
});

// Staff clock out
router.post('/clock-out', authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const staffId = req.user.id;
    const { notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Find today's clock-in record
    const record = await getOne(`SELECT id, clock_in_time FROM staff_attendance WHERE staff_id = ? AND work_date = ? AND clock_out_time IS NULL`, [staffId, today]);

    if (!record) {
      return res.status(400).json({ error: 'No active clock-in found for today' });
    }

    // Calculate total hours
    const clockInTime = new Date(record.clock_in_time);
    const clockOutTime = new Date();
    const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);

    const clockOutNow = new Date().toISOString();
    await runQuery(`UPDATE staff_attendance SET clock_out_time = ?, total_hours = ?, notes = ? WHERE id = ?`, [clockOutNow, totalHours.toFixed(2), notes || null, record.id]);
    const updatedRecord = await getOne('SELECT * FROM staff_attendance WHERE id = ?', [record.id]);

    res.json({
      message: 'Clock-out successful',
      attendance: updatedRecord
    });
  } catch (err) {
    console.error('Clock-out error:', err);
    res.status(500).json({ error: 'Clock-out failed' });
  }
});

// Get staff attendance status
router.get('/status', authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const record = await getOne(`SELECT * FROM staff_attendance WHERE staff_id = ? AND work_date = ? ORDER BY clock_in_time DESC LIMIT 1`, [staffId, today]);

    if (!record) {
      return res.json({ status: 'not_clocked_in', action: 'clock_in' });
    }

    if (!record.clock_out_time) {
      return res.json({ 
        status: 'clocked_in', 
        action: 'clock_out',
        clock_in_time: record.clock_in_time
      });
    }

    res.json({ 
      status: 'clocked_out', 
      action: 'done',
      attendance: record
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Get staff attendance history
router.get('/history', authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const staffId = req.user.id;
    const { start_date, end_date, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM staff_attendance WHERE staff_id = ?';
    const params = [staffId];
    if (start_date) { query += ' AND work_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND work_date <= ?'; params.push(end_date); }
    query += ' ORDER BY work_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const records = await getAll(query, params);

    res.json({ attendance: records });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get all staff attendance for a building (admin/owner)
router.get('/building/:buildingId', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { date, start_date, end_date, staff_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT sa.*, u.full_name as staff_name, u.email as staff_email FROM staff_attendance sa JOIN users u ON sa.staff_id = u.id WHERE sa.building_id = ?`;
    const params = [buildingId];
    if (date) { query += ' AND sa.work_date = ?'; params.push(date); }
    if (start_date) { query += ' AND sa.work_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND sa.work_date <= ?'; params.push(end_date); }
    if (staff_id) { query += ' AND sa.staff_id = ?'; params.push(staff_id); }
    query += ' ORDER BY sa.work_date DESC, sa.clock_in_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const records = await getAll(query, params);
    let countQuery = 'SELECT COUNT(*) as count FROM staff_attendance WHERE building_id = ?';
    const countParams = [buildingId];
    if (date) { countQuery += ' AND work_date = ?'; countParams.push(date); }
    const countResult = await getOne(countQuery, countParams);
    const count = countResult ? countResult.count : 0;

    res.json({
      attendance: records,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Fetch attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get staff members for a building
router.get('/members/:buildingId', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { buildingId } = req.params;
    const staff = await getAll(`SELECT id, email, full_name, phone, created_at, is_active FROM users WHERE building_id = ? AND role = 'staff'`, [buildingId]);

    res.json({ staff });
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Sync offline attendance
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { attendance } = req.body;
    const results = [];
    for (const record of attendance) {
      try {
        await runQuery(`INSERT OR REPLACE INTO staff_attendance (id, staff_id, building_id, clock_in_time, clock_out_time, ip_address, work_date, total_hours, notes, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [record.id, record.staff_id, record.building_id, record.clock_in_time, record.clock_out_time, record.ip_address, record.work_date, record.total_hours, record.notes]);
        results.push({ id: record.id, synced: true });
      } catch (err) { results.push({ id: record.id, synced: false, error: err.message }); }
    }

    res.json({ results });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
