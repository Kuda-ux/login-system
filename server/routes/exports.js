const express = require('express');
const ExcelJS = require('exceljs');
const { getAll, getOne } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { decrypt } = require('../utils/encryption');

const router = express.Router();

// Helper: set response headers for Excel download
function setExcelHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

// Helper: style header row
function styleHeaderRow(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
}

// =============================================
// VISITOR LOG EXPORT TO EXCEL
// =============================================
router.get('/visitors', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const { building_id, start_date, end_date, status } = req.query;

    let query = `SELECT v.*, b.name as building_name 
                 FROM visitors v 
                 LEFT JOIN buildings b ON v.building_id = b.id 
                 WHERE 1=1`;
    const params = [];

    if (building_id) { query += ' AND v.building_id = ?'; params.push(building_id); }
    if (start_date) { query += ' AND v.check_in_time >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND v.check_in_time <= ?'; params.push(new Date(new Date(end_date).getTime() + 86400000).toISOString()); }
    if (status) { query += ' AND v.status = ?'; params.push(status); }

    query += ' ORDER BY v.check_in_time DESC LIMIT 10000';
    const visitors = await getAll(query, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cherubim Security System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Visitor Log');

    worksheet.columns = [
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'ID Number', key: 'id_number', width: 18 },
      { header: 'Purpose', key: 'purpose', width: 25 },
      { header: 'Site', key: 'building_name', width: 25 },
      { header: 'Check-In Time', key: 'check_in_time', width: 22 },
      { header: 'Check-Out Time', key: 'check_out_time', width: 22 },
      { header: 'Duration (mins)', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    styleHeaderRow(worksheet);

    visitors.forEach(v => {
      let duration = '';
      if (v.check_in_time && v.check_out_time) {
        duration = Math.round((new Date(v.check_out_time) - new Date(v.check_in_time)) / 60000);
      }
      let idNumber = '';
      try { idNumber = decrypt(v.id_number_encrypted); } catch (e) { idNumber = '***'; }

      worksheet.addRow({
        full_name: v.full_name,
        phone: v.phone,
        id_number: idNumber,
        purpose: v.purpose,
        building_name: v.building_name || 'N/A',
        check_in_time: v.check_in_time ? new Date(v.check_in_time).toLocaleString() : '',
        check_out_time: v.check_out_time ? new Date(v.check_out_time).toLocaleString() : '',
        duration: duration,
        status: v.status === 'checked_in' ? 'Inside' : 'Left',
      });
    });

    // Auto-filter
    worksheet.autoFilter = { from: 'A1', to: 'I1' };

    const dateStr = new Date().toISOString().split('T')[0];
    setExcelHeaders(res, `Visitor_Log_${dateStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Visitor export error:', err);
    res.status(500).json({ error: 'Failed to export visitor log' });
  }
});

// =============================================
// STAFF ATTENDANCE LOG EXPORT TO EXCEL
// =============================================
router.get('/staff-attendance', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const { building_id, start_date, end_date, staff_id } = req.query;

    let query = `SELECT sa.*, u.full_name as staff_name, u.email, u.phone, b.name as building_name
                 FROM staff_attendance sa
                 JOIN users u ON sa.staff_id = u.id
                 LEFT JOIN buildings b ON sa.building_id = b.id
                 WHERE 1=1`;
    const params = [];

    if (building_id) { query += ' AND sa.building_id = ?'; params.push(building_id); }
    if (start_date) { query += ' AND sa.work_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND sa.work_date <= ?'; params.push(end_date); }
    if (staff_id) { query += ' AND sa.staff_id = ?'; params.push(staff_id); }

    query += ' ORDER BY sa.work_date DESC, u.full_name LIMIT 10000';
    const records = await getAll(query, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cherubim Security System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Staff Attendance');

    worksheet.columns = [
      { header: 'Staff Name', key: 'staff_name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Site', key: 'building_name', width: 25 },
      { header: 'Work Date', key: 'work_date', width: 14 },
      { header: 'Clock In', key: 'clock_in_time', width: 22 },
      { header: 'Clock Out', key: 'clock_out_time', width: 22 },
      { header: 'Total Hours', key: 'total_hours', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    styleHeaderRow(worksheet);

    records.forEach(r => {
      worksheet.addRow({
        staff_name: r.staff_name,
        email: r.email,
        phone: r.phone,
        building_name: r.building_name || 'N/A',
        work_date: r.work_date,
        clock_in_time: r.clock_in_time ? new Date(r.clock_in_time).toLocaleString() : '',
        clock_out_time: r.clock_out_time ? new Date(r.clock_out_time).toLocaleString() : '',
        total_hours: r.total_hours ? parseFloat(r.total_hours).toFixed(2) : '',
        notes: r.notes || '',
      });
    });

    worksheet.autoFilter = { from: 'A1', to: 'I1' };

    const dateStr = new Date().toISOString().split('T')[0];
    setExcelHeaders(res, `Staff_Attendance_${dateStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Staff attendance export error:', err);
    res.status(500).json({ error: 'Failed to export staff attendance' });
  }
});

// =============================================
// GUARD LOG SHEET EXPORT (Name, Site, Timestamps, Days Worked in 30 days, Status)
// =============================================
router.get('/guard-logsheet', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor'), async (req, res) => {
  try {
    const { building_id, start_date, end_date } = req.query;

    // Default to last 30 days
    const endDt = end_date || new Date().toISOString().split('T')[0];
    const startDt = start_date || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Get all guards
    let guardQuery = `SELECT u.id, u.full_name, u.email, u.phone, u.building_id, u.is_active, b.name as site_name
                      FROM users u
                      LEFT JOIN buildings b ON u.building_id = b.id
                      WHERE u.role IN ('staff', 'security') AND u.is_active = 1`;
    const guardParams = [];
    if (building_id) { guardQuery += ' AND u.building_id = ?'; guardParams.push(building_id); }
    guardQuery += ' ORDER BY b.name, u.full_name';
    const guards = await getAll(guardQuery, guardParams);

    // Get all staff entries (attendance via QR scan) within date range
    let entryQuery = `SELECT se.staff_id, se.entry_time, se.exit_time, se.status
                      FROM staff_entries se
                      WHERE se.entry_time >= ? AND se.entry_time <= ?`;
    const entryParams = [startDt, new Date(new Date(endDt).getTime() + 86400000).toISOString()];
    if (building_id) { entryQuery += ' AND se.building_id = ?'; entryParams.push(building_id); }
    entryQuery += ' ORDER BY se.entry_time DESC';
    const entries = await getAll(entryQuery, entryParams);

    // Also get clock-in/out records
    let clockQuery = `SELECT sa.staff_id, sa.clock_in_time, sa.clock_out_time, sa.work_date, sa.total_hours
                      FROM staff_attendance sa
                      WHERE sa.work_date >= ? AND sa.work_date <= ?`;
    const clockParams = [startDt, endDt];
    if (building_id) { clockQuery += ' AND sa.building_id = ?'; clockParams.push(building_id); }
    const clockRecords = await getAll(clockQuery, clockParams);

    // Group entries by guard to count unique days worked
    const guardEntries = {};
    entries.forEach(e => {
      if (!guardEntries[e.staff_id]) guardEntries[e.staff_id] = new Set();
      const day = new Date(e.entry_time).toISOString().split('T')[0];
      guardEntries[e.staff_id].add(day);
    });
    clockRecords.forEach(r => {
      if (!guardEntries[r.staff_id]) guardEntries[r.staff_id] = new Set();
      guardEntries[r.staff_id].add(r.work_date);
    });

    // Build guard log sheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cherubim Security System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Guard Log Sheet');

    worksheet.columns = [
      { header: 'Guard Name', key: 'name', width: 28 },
      { header: 'Site', key: 'site', width: 25 },
      { header: 'First Clock-In', key: 'first_timestamp', width: 22 },
      { header: 'Last Clock-In', key: 'last_timestamp', width: 22 },
      { header: 'Days Worked (30-day period)', key: 'days_worked', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    styleHeaderRow(worksheet);

    guards.forEach(g => {
      const daysSet = guardEntries[g.id] || new Set();
      const daysWorked = daysSet.size;
      const sortedDays = [...daysSet].sort();
      const firstTimestamp = sortedDays.length > 0 ? sortedDays[0] : '';
      const lastTimestamp = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : '';

      let status = 'Active';
      if (daysWorked === 0) status = 'No Activity';
      else if (daysWorked < 10) status = 'Low Attendance';
      else if (daysWorked >= 20) status = 'Good';

      worksheet.addRow({
        name: g.full_name,
        site: g.site_name || 'Unassigned',
        first_timestamp: firstTimestamp,
        last_timestamp: lastTimestamp,
        days_worked: `${daysWorked} / 30`,
        status: status,
      });
    });

    worksheet.autoFilter = { from: 'A1', to: 'F1' };

    // Summary row
    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
      name: `Report Period: ${startDt} to ${endDt}`,
      site: `Total Guards: ${guards.length}`,
      days_worked: `Avg Days: ${guards.length ? Math.round(guards.reduce((sum, g) => sum + (guardEntries[g.id]?.size || 0), 0) / guards.length) : 0}`,
    });
    summaryRow.font = { bold: true, italic: true };

    const dateStr = new Date().toISOString().split('T')[0];
    setExcelHeaders(res, `Guard_LogSheet_${dateStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Guard logsheet export error:', err);
    res.status(500).json({ error: 'Failed to export guard log sheet' });
  }
});

// =============================================
// LOGIN ACTIVITY EXPORT TO EXCEL
// =============================================
router.get('/login-logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;

    let query = 'SELECT * FROM login_logs WHERE 1=1';
    const params = [];

    if (start_date) { query += ' AND login_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND login_at <= ?'; params.push(new Date(new Date(end_date).getTime() + 86400000).toISOString()); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY login_at DESC LIMIT 10000';
    const logs = await getAll(query, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cherubim Security System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Login Activity');

    worksheet.columns = [
      { header: 'Name', key: 'full_name', width: 25 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Login Time', key: 'login_at', width: 22 },
      { header: 'IP Address', key: 'ip_address', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    styleHeaderRow(worksheet);

    logs.forEach(l => {
      worksheet.addRow({
        full_name: l.full_name || 'Unknown',
        email: l.email,
        role: l.role || 'N/A',
        login_at: l.login_at ? new Date(l.login_at).toLocaleString() : '',
        ip_address: l.ip_address || '',
        status: l.status,
      });
    });

    worksheet.autoFilter = { from: 'A1', to: 'F1' };

    const dateStr = new Date().toISOString().split('T')[0];
    setExcelHeaders(res, `Login_Activity_${dateStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Login logs export error:', err);
    res.status(500).json({ error: 'Failed to export login logs' });
  }
});

module.exports = router;
