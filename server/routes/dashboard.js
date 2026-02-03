const express = require('express');
const { getOne, getAll } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { building_id } = req.query;
    let stats = {};
    if (req.user.role === 'admin') {
      stats = getAdminStats(building_id);
    } else {
      stats = getOwnerStats(req.user.id, building_id);
    }
    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

function getAdminStats(buildingId) {
  const buildingFilter = buildingId ? 'AND building_id = ?' : '';
  const params = buildingId ? [buildingId] : [];
  const totalBuildings = getOne('SELECT COUNT(*) as count FROM buildings WHERE is_active = 1', []) || { count: 0 };
  const totalOwners = getOne("SELECT COUNT(*) as count FROM users WHERE role = 'owner' AND is_active = 1", []) || { count: 0 };
  const todayVisitors = getOne(`SELECT COUNT(*) as count FROM visitors WHERE date(check_in_time) = date('now') ${buildingFilter}`, params) || { count: 0 };
  const activeVisitors = getOne(`SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in' ${buildingFilter}`, params) || { count: 0 };
  const totalTenants = getOne(`SELECT COUNT(*) as count FROM tenants WHERE is_active = 1 ${buildingFilter}`, params) || { count: 0 };
  const monthlyRevenue = getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'completed' AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now') ${buildingFilter}`, params) || { total: 0 };
  const pendingPayments = getOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'pending' ${buildingFilter}`, params) || { count: 0, total: 0 };
  return {
    total_buildings: totalBuildings.count,
    total_owners: totalOwners.count,
    today_visitors: todayVisitors.count,
    active_visitors: activeVisitors.count,
    total_tenants: totalTenants.count,
    monthly_revenue: monthlyRevenue.total,
    pending_payments_count: pendingPayments.count,
    pending_payments_total: pendingPayments.total
  };
}

function getOwnerStats(ownerId, buildingId) {
  const buildings = getAll('SELECT id FROM buildings WHERE owner_id = ? AND is_active = 1', [ownerId]);
  const buildingIds = buildings.map(b => b.id);
  if (buildingIds.length === 0) {
    return { total_buildings: 0, today_visitors: 0, active_visitors: 0, total_tenants: 0, monthly_revenue: 0, pending_payments_count: 0, pending_payments_total: 0 };
  }
  const filterIds = buildingId ? [buildingId] : buildingIds;
  const placeholders = filterIds.map(() => '?').join(',');
  const todayVisitors = getOne(`SELECT COUNT(*) as count FROM visitors WHERE date(check_in_time) = date('now') AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const activeVisitors = getOne(`SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in' AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const totalTenants = getOne(`SELECT COUNT(*) as count FROM tenants WHERE is_active = 1 AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const totalStaff = getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'staff' AND is_active = 1 AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const monthlyRevenue = getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'completed' AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now') AND building_id IN (${placeholders})`, filterIds) || { total: 0 };
  const pendingPayments = getOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'pending' AND building_id IN (${placeholders})`, filterIds) || { count: 0, total: 0 };
  return {
    total_buildings: buildingIds.length,
    today_visitors: todayVisitors.count,
    active_visitors: activeVisitors.count,
    total_tenants: totalTenants.count,
    total_staff: totalStaff.count,
    monthly_revenue: monthlyRevenue.total,
    pending_payments_count: pendingPayments.count,
    pending_payments_total: pendingPayments.total
  };
}

// Get recent activity
router.get('/activity', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { limit = 20 } = req.query;
    let buildingFilter = '';
    const params = [];
    if (req.user.role === 'owner') {
      const buildings = getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `WHERE v.building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    }
    params.push(parseInt(limit));
    const recentVisitors = getAll(`SELECT v.*, b.name as building_name FROM visitors v JOIN buildings b ON v.building_id = b.id ${buildingFilter} ORDER BY v.check_in_time DESC LIMIT ?`, params);
    const paymentParams = req.user.role === 'owner' ? [...params.slice(0, -1), parseInt(limit)] : [parseInt(limit)];
    const paymentFilter = buildingFilter.replace('v.building_id', 'p.building_id');
    const recentPayments = getAll(`SELECT p.*, t.full_name as tenant_name, b.name as building_name FROM payments p JOIN tenants t ON p.tenant_id = t.id JOIN buildings b ON p.building_id = b.id ${paymentFilter} ORDER BY p.created_at DESC LIMIT ?`, paymentParams);
    res.json({ recent_visitors: recentVisitors, recent_payments: recentPayments });
  } catch (err) {
    console.error('Activity fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get visitor chart data
router.get('/charts/visitors', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { days = 7, building_id } = req.query;
    let buildingFilter = '';
    const params = [parseInt(days)];
    if (req.user.role === 'owner') {
      const buildings = getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `AND building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    } else if (building_id) {
      buildingFilter = 'AND building_id = ?';
      params.push(building_id);
    }
    const data = getAll(`SELECT date(check_in_time) as date, COUNT(*) as count FROM visitors WHERE date(check_in_time) >= date('now', '-' || ? || ' days') ${buildingFilter} GROUP BY date(check_in_time) ORDER BY date`, params);
    res.json({ data });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get revenue chart data
router.get('/charts/revenue', authenticateToken, authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const { months = 6, building_id } = req.query;
    let buildingFilter = '';
    const params = [parseInt(months)];
    if (req.user.role === 'owner') {
      const buildings = getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `AND building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    } else if (building_id) {
      buildingFilter = 'AND building_id = ?';
      params.push(building_id);
    }
    const data = getAll(`SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as total FROM payments WHERE payment_status = 'completed' AND payment_date >= date('now', '-' || ? || ' months') ${buildingFilter} GROUP BY strftime('%Y-%m', payment_date) ORDER BY month`, params);
    res.json({ data });
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

module.exports = router;
