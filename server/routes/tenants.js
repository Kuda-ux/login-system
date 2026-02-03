const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Create tenant
router.post('/', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { full_name, email, phone, unit_number, building_id, rent_amount, rent_due_day, lease_start, lease_end } = req.body;

    if (!full_name || !phone || !unit_number || !building_id || !rent_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const building = await getOne('SELECT id FROM buildings WHERE id = ?', [building_id]);
    if (!building) { return res.status(404).json({ error: 'Building not found' }); }
    const existingTenant = await getOne(`SELECT id FROM tenants WHERE building_id = ? AND unit_number = ? AND is_active = 1`, [building_id, unit_number]);
    if (existingTenant) { return res.status(400).json({ error: 'Unit is already occupied' }); }
    const tenantId = uuidv4();
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO tenants (id, full_name, email, phone, unit_number, building_id, rent_amount, rent_due_day, lease_start, lease_end, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [tenantId, full_name, email || null, phone, unit_number, building_id, rent_amount, rent_due_day || 1, lease_start || null, lease_end || null, now, now]);
    const tenant = await getOne('SELECT * FROM tenants WHERE id = ?', [tenantId]);

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant
    });
  } catch (err) {
    console.error('Create tenant error:', err);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Get all tenants for a building
router.get('/building/:buildingId', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { active_only = 'true' } = req.query;

    let query = 'SELECT * FROM tenants WHERE building_id = ?';
    const params = [buildingId];
    if (active_only === 'true') { query += ' AND is_active = 1'; }
    query += ' ORDER BY unit_number';
    const tenants = await getAll(query, params);

    res.json({ tenants });
  } catch (err) {
    console.error('Fetch tenants error:', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get tenant by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getOne(`SELECT t.*, b.name as building_name FROM tenants t JOIN buildings b ON t.building_id = b.id WHERE t.id = ?`, [id]);
    if (!tenant) { return res.status(404).json({ error: 'Tenant not found' }); }
    const payments = await getAll(`SELECT * FROM payments WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10`, [id]);

    res.json({ tenant, payments });
  } catch (err) {
    console.error('Fetch tenant error:', err);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Update tenant
router.put('/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, unit_number, rent_amount, rent_due_day, lease_start, lease_end, is_active } = req.body;

    const tenant = await getOne('SELECT * FROM tenants WHERE id = ?', [id]);
    if (!tenant) { return res.status(404).json({ error: 'Tenant not found' }); }
    const now = new Date().toISOString();
    await runQuery(`UPDATE tenants SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone), unit_number = COALESCE(?, unit_number), rent_amount = COALESCE(?, rent_amount), rent_due_day = COALESCE(?, rent_due_day), lease_start = COALESCE(?, lease_start), lease_end = COALESCE(?, lease_end), is_active = COALESCE(?, is_active), updated_at = ? WHERE id = ?`, [full_name, email, phone, unit_number, rent_amount, rent_due_day, lease_start, lease_end, is_active, now, id]);
    const updatedTenant = await getOne('SELECT * FROM tenants WHERE id = ?', [id]);

    res.json({
      message: 'Tenant updated successfully',
      tenant: updatedTenant
    });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Deactivate tenant
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await runQuery('UPDATE tenants SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);

    res.json({ message: 'Tenant deactivated successfully' });
  } catch (err) {
    console.error('Deactivate tenant error:', err);
    res.status(500).json({ error: 'Failed to deactivate tenant' });
  }
});

// Get tenant payment summary
router.get('/:id/payment-summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getOne('SELECT * FROM tenants WHERE id = ?', [id]);
    if (!tenant) { return res.status(404).json({ error: 'Tenant not found' }); }
    const totalPaid = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE tenant_id = ? AND payment_status = 'completed'`, [id]) || { total: 0 };
    const pendingPayments = await getAll(`SELECT * FROM payments WHERE tenant_id = ? AND payment_status = 'pending'`, [id]);
    const recentPayments = await getAll(`SELECT * FROM payments WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`, [id]);

    res.json({
      tenant,
      total_paid: totalPaid.total,
      pending_payments: pendingPayments,
      recent_payments: recentPayments
    });
  } catch (err) {
    console.error('Payment summary error:', err);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

module.exports = router;
