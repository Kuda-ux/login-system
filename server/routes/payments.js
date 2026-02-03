const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generatePaymentQRCode } = require('../utils/qrcode');

const router = express.Router();

// Create payment request / Generate payment QR
router.post('/generate', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { tenant_id, amount, rent_month, notes } = req.body;

    if (!tenant_id || !amount || !rent_month) {
      return res.status(400).json({ error: 'Tenant ID, amount, and rent month are required' });
    }

    const tenant = getOne(`SELECT t.*, b.name as building_name FROM tenants t JOIN buildings b ON t.building_id = b.id WHERE t.id = ?`, [tenant_id]);
    if (!tenant) { return res.status(404).json({ error: 'Tenant not found' }); }
    const paymentId = uuidv4();
    const qrData = { payment_id: paymentId, tenant_name: tenant.full_name, unit: tenant.unit_number, building: tenant.building_name, amount: amount, month: rent_month, reference: `RENT-${paymentId.substring(0, 8).toUpperCase()}` };
    const qrCode = await generatePaymentQRCode(qrData);
    const now = new Date().toISOString();
    runQuery(`INSERT INTO payments (id, tenant_id, building_id, amount, payment_method, rent_month, qr_code, notes, payment_status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'pending', ?, ?)`, [paymentId, tenant_id, tenant.building_id, amount, rent_month, qrCode, notes || null, now, now]);
    const payment = getOne('SELECT * FROM payments WHERE id = ?', [paymentId]);

    res.status(201).json({
      message: 'Payment request created',
      payment,
      qr_code: qrCode,
      payment_reference: qrData.reference
    });
  } catch (err) {
    console.error('Generate payment error:', err);
    res.status(500).json({ error: 'Failed to generate payment' });
  }
});

// Process payment (simulated gateway integration)
router.post('/process', async (req, res) => {
  try {
    const { payment_id, payment_method, payment_reference } = req.body;

    if (!payment_id || !payment_method) {
      return res.status(400).json({ error: 'Payment ID and method are required' });
    }

    const validMethods = ['ecocash', 'inbucks', 'mastercard', 'cash', 'other'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const payment = getOne('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (!payment) { return res.status(404).json({ error: 'Payment not found' }); }
    if (payment.payment_status === 'completed') { return res.status(400).json({ error: 'Payment already completed' }); }
    const paymentResult = simulatePaymentGateway(payment_method, payment.amount);
    const now = new Date().toISOString();
    if (paymentResult.success) {
      runQuery(`UPDATE payments SET payment_method = ?, payment_reference = ?, payment_status = 'completed', payment_date = ?, updated_at = ? WHERE id = ?`, [payment_method, payment_reference || paymentResult.reference, now, now, payment_id]);
      const updatedPayment = getOne('SELECT * FROM payments WHERE id = ?', [payment_id]);
      res.json({ message: 'Payment processed successfully', payment: updatedPayment });
    } else {
      runQuery(`UPDATE payments SET payment_method = ?, payment_status = 'failed', updated_at = ? WHERE id = ?`, [payment_method, now, payment_id]);
      res.status(400).json({ error: 'Payment failed', reason: paymentResult.reason });
    }
  } catch (err) {
    console.error('Process payment error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Simulated payment gateway
function simulatePaymentGateway(method, amount) {
  // In production, replace with actual API calls to:
  // - EcoCash: POST to EcoCash merchant API
  // - InBucks: POST to InBucks payment API
  // - Mastercard: POST to Mastercard Gateway API
  
  return {
    success: true,
    reference: `${method.toUpperCase()}-${Date.now()}`,
    transaction_id: uuidv4()
  };
}

// Record manual payment
router.post('/manual', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { tenant_id, amount, payment_method, rent_month, payment_reference, notes } = req.body;

    if (!tenant_id || !amount || !payment_method || !rent_month) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tenant = getOne('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    if (!tenant) { return res.status(404).json({ error: 'Tenant not found' }); }
    const paymentId = uuidv4();
    const now = new Date().toISOString();
    runQuery(`INSERT INTO payments (id, tenant_id, building_id, amount, payment_method, payment_reference, payment_status, payment_date, rent_month, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)`, [paymentId, tenant_id, tenant.building_id, amount, payment_method, payment_reference || null, now, rent_month, notes || null, now, now]);
    const payment = getOne('SELECT * FROM payments WHERE id = ?', [paymentId]);

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (err) {
    console.error('Manual payment error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Get payments for a building
router.get('/building/:buildingId', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { buildingId } = req.params;
    const { status, month, tenant_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT p.*, t.full_name as tenant_name, t.unit_number FROM payments p JOIN tenants t ON p.tenant_id = t.id WHERE p.building_id = ?`;
    const params = [buildingId];
    if (status) { query += ' AND p.payment_status = ?'; params.push(status); }
    if (month) { query += ' AND p.rent_month = ?'; params.push(month); }
    if (tenant_id) { query += ' AND p.tenant_id = ?'; params.push(tenant_id); }
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const payments = getAll(query, params);
    const totals = getOne(`SELECT SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_collected, SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as total_pending, COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count, COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count FROM payments WHERE building_id = ?`, [buildingId]) || { total_collected: 0, total_pending: 0, completed_count: 0, pending_count: 0 };

    res.json({ payments, totals });
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const payment = getOne(`SELECT p.*, t.full_name as tenant_name, t.unit_number, t.phone as tenant_phone, b.name as building_name FROM payments p JOIN tenants t ON p.tenant_id = t.id JOIN buildings b ON p.building_id = b.id WHERE p.id = ?`, [id]);
    if (!payment) { return res.status(404).json({ error: 'Payment not found' }); }

    res.json({ payment });
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Get payment status (public - for payment confirmation)
router.get('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const payment = getOne(`SELECT id, amount, payment_status, payment_method, rent_month, payment_date FROM payments WHERE id = ?`, [id]);
    if (!payment) { return res.status(404).json({ error: 'Payment not found' }); }

    res.json({ payment });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Update payment status
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const now = new Date().toISOString();
    const paymentDate = status === 'completed' ? now : null;
    runQuery(`UPDATE payments SET payment_status = ?, notes = COALESCE(?, notes), payment_date = COALESCE(?, payment_date), updated_at = ? WHERE id = ?`, [status, notes, paymentDate, now, id]);
    const payment = getOne('SELECT * FROM payments WHERE id = ?', [id]);

    res.json({
      message: 'Payment status updated',
      payment
    });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Sync offline payments
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { payments } = req.body;
    const results = [];
    for (const payment of payments) {
      try {
        runQuery(`INSERT OR REPLACE INTO payments (id, tenant_id, building_id, amount, payment_method, payment_reference, payment_status, payment_date, rent_month, notes, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [payment.id, payment.tenant_id, payment.building_id, payment.amount, payment.payment_method, payment.payment_reference, payment.payment_status, payment.payment_date, payment.rent_month, payment.notes]);
        results.push({ id: payment.id, synced: true });
      } catch (err) { results.push({ id: payment.id, synced: false, error: err.message }); }
    }

    res.json({ results });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
