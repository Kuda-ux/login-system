const express = require('express');
const { getOne, getAll } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { building_id } = req.query;
    let stats = {};
    if (req.user.role === 'admin') {
      stats = await getAdminStats(building_id);
    } else {
      stats = await getOwnerStats(req.user.id, building_id);
    }
    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

async function getAdminStats(buildingId) {
  const buildingFilter = buildingId ? 'AND building_id = ?' : '';
  const params = buildingId ? [buildingId] : [];

  const totalBuildings = await getOne('SELECT COUNT(*) as count FROM buildings WHERE is_active = 1', []) || { count: 0 };
  const totalOwners = await getOne("SELECT COUNT(*) as count FROM users WHERE role = 'owner' AND is_active = 1", []) || { count: 0 };
  const totalStaff = await getOne("SELECT COUNT(*) as count FROM users WHERE role IN ('staff', 'security') AND is_active = 1", []) || { count: 0 };
  const todayVisitors = await getOne(`SELECT COUNT(*) as count FROM visitors WHERE check_in_time::date = CURRENT_DATE ${buildingFilter}`, params) || { count: 0 };
  const activeVisitors = await getOne(`SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in' ${buildingFilter}`, params) || { count: 0 };
  const totalTenants = await getOne(`SELECT COUNT(*) as count FROM tenants WHERE is_active = 1 ${buildingFilter}`, params) || { count: 0 };
  const openIncidents = await getOne(`SELECT COUNT(*) as count FROM incident_reports WHERE status IN ('open', 'under_review') ${buildingFilter}`, params) || { count: 0 };
  const activePatrols = await getOne(`SELECT COUNT(*) as count FROM patrol_rounds WHERE status = 'in_progress' ${buildingFilter}`, params) || { count: 0 };
  const guardsOnDuty = await getOne(`SELECT COUNT(*) as count FROM staff_entries WHERE status = 'inside' ${buildingFilter}`, params) || { count: 0 };
  const monthlyRevenue = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'completed' AND TO_CHAR(payment_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') ${buildingFilter}`, params) || { total: 0 };
  const pendingPayments = await getOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'pending' ${buildingFilter}`, params) || { count: 0, total: 0 };

  return {
    total_buildings: parseInt(totalBuildings.count) || 0,
    total_owners: parseInt(totalOwners.count) || 0,
    total_staff: parseInt(totalStaff.count) || 0,
    today_visitors: parseInt(todayVisitors.count) || 0,
    active_visitors: parseInt(activeVisitors.count) || 0,
    total_tenants: parseInt(totalTenants.count) || 0,
    open_incidents: parseInt(openIncidents.count) || 0,
    active_patrols: parseInt(activePatrols.count) || 0,
    guards_on_duty: parseInt(guardsOnDuty.count) || 0,
    monthly_revenue: parseFloat(monthlyRevenue.total) || 0,
    pending_payments_count: parseInt(pendingPayments.count) || 0,
    pending_payments_total: parseFloat(pendingPayments.total) || 0
  };
}

async function getOwnerStats(ownerId, buildingId) {
  const buildings = await getAll('SELECT id FROM buildings WHERE owner_id = ? AND is_active = 1', [ownerId]);
  const buildingIds = buildings.map(b => b.id);
  if (buildingIds.length === 0) {
    return { total_buildings: 0, total_owners: 0, total_staff: 0, today_visitors: 0, active_visitors: 0, total_tenants: 0, open_incidents: 0, active_patrols: 0, guards_on_duty: 0, monthly_revenue: 0, pending_payments_count: 0, pending_payments_total: 0 };
  }
  const filterIds = buildingId ? [buildingId] : buildingIds;
  const placeholders = filterIds.map(() => '?').join(',');
  const todayVisitors = await getOne(`SELECT COUNT(*) as count FROM visitors WHERE check_in_time::date = CURRENT_DATE AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const activeVisitors = await getOne(`SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in' AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const totalTenants = await getOne(`SELECT COUNT(*) as count FROM tenants WHERE is_active = 1 AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const totalStaff = await getOne(`SELECT COUNT(*) as count FROM users WHERE role IN ('staff', 'security') AND is_active = 1 AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const openIncidents = await getOne(`SELECT COUNT(*) as count FROM incident_reports WHERE status IN ('open', 'under_review') AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const activePatrols = await getOne(`SELECT COUNT(*) as count FROM patrol_rounds WHERE status = 'in_progress' AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const guardsOnDuty = await getOne(`SELECT COUNT(*) as count FROM staff_entries WHERE status = 'inside' AND building_id IN (${placeholders})`, filterIds) || { count: 0 };
  const monthlyRevenue = await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'completed' AND TO_CHAR(payment_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') AND building_id IN (${placeholders})`, filterIds) || { total: 0 };
  const pendingPayments = await getOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'pending' AND building_id IN (${placeholders})`, filterIds) || { count: 0, total: 0 };
  return {
    total_buildings: buildingIds.length,
    total_owners: 0,
    total_staff: parseInt(totalStaff.count) || 0,
    today_visitors: parseInt(todayVisitors.count) || 0,
    active_visitors: parseInt(activeVisitors.count) || 0,
    total_tenants: parseInt(totalTenants.count) || 0,
    open_incidents: parseInt(openIncidents.count) || 0,
    active_patrols: parseInt(activePatrols.count) || 0,
    guards_on_duty: parseInt(guardsOnDuty.count) || 0,
    monthly_revenue: parseFloat(monthlyRevenue.total) || 0,
    pending_payments_count: parseInt(pendingPayments.count) || 0,
    pending_payments_total: parseFloat(pendingPayments.total) || 0
  };
}

// Get recent activity
router.get('/activity', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    let buildingFilter = '';
    const params = [];
    if (req.user.role === 'owner') {
      const buildings = await getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `WHERE v.building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    }
    params.push(parseInt(limit));
    const recentVisitors = await getAll(`SELECT v.*, b.name as building_name FROM visitors v JOIN buildings b ON v.building_id = b.id ${buildingFilter} ORDER BY v.check_in_time DESC LIMIT ?`, params);
    const paymentParams = req.user.role === 'owner' ? [...params.slice(0, -1), parseInt(limit)] : [parseInt(limit)];
    const paymentFilter = buildingFilter.replace('v.building_id', 'p.building_id');
    const recentPayments = await getAll(`SELECT p.*, t.full_name as tenant_name, b.name as building_name FROM payments p JOIN tenants t ON p.tenant_id = t.id JOIN buildings b ON p.building_id = b.id ${paymentFilter} ORDER BY p.created_at DESC LIMIT ?`, paymentParams);
    res.json({ recent_visitors: recentVisitors, recent_payments: recentPayments });
  } catch (err) {
    console.error('Activity fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get visitor chart data
router.get('/charts/visitors', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { days = 7, building_id } = req.query;
    let buildingFilter = '';
    const params = [parseInt(days)];
    if (req.user.role === 'owner') {
      const buildings = await getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `AND building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    } else if (building_id) {
      buildingFilter = 'AND building_id = ?';
      params.push(building_id);
    }
    const data = await getAll(`SELECT check_in_time::date as date, COUNT(*) as count FROM visitors WHERE check_in_time::date >= CURRENT_DATE - INTERVAL '1 day' * ? ${buildingFilter} GROUP BY check_in_time::date ORDER BY date`, params);
    res.json({ data: data.map(d => ({ date: d.date, count: parseInt(d.count) || 0 })) });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get revenue chart data
router.get('/charts/revenue', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { months = 6, building_id } = req.query;
    let buildingFilter = '';
    const params = [parseInt(months)];
    if (req.user.role === 'owner') {
      const buildings = await getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        buildingFilter = `AND building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      }
    } else if (building_id) {
      buildingFilter = 'AND building_id = ?';
      params.push(building_id);
    }
    const data = await getAll(`SELECT TO_CHAR(payment_date, 'YYYY-MM') as month, SUM(amount) as total FROM payments WHERE payment_status = 'completed' AND payment_date >= CURRENT_DATE - INTERVAL '1 month' * ? ${buildingFilter} GROUP BY TO_CHAR(payment_date, 'YYYY-MM') ORDER BY month`, params);
    res.json({ data: data.map(d => ({ month: d.month, total: parseFloat(d.total) || 0 })) });
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

module.exports = router;
