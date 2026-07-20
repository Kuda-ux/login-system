const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const managementRoles = ['admin', 'owner', 'supervisor'];

async function canAccessSite(user, buildingId) {
  if (user.role === 'admin') return true;
  if (['security', 'staff', 'supervisor'].includes(user.role)) return user.building_id === buildingId;
  if (user.role === 'owner') return Boolean(await getOne('SELECT id FROM buildings WHERE id = ? AND owner_id = ?', [buildingId, user.id]));
  return false;
}

async function requireSiteAccess(req, res, buildingId) {
  if (await canAccessSite(req.user, buildingId)) return true;
  res.status(403).json({ error: 'You are not authorized for this client site' });
  return false;
}

router.get('/summary', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const siteFilter = req.user.role === 'admin' ? '' : ' WHERE building_id = ?';
    const params = req.user.role === 'admin' ? [] : [req.user.building_id];
    if (req.user.role === 'owner') {
      const sites = await getAll('SELECT id FROM buildings WHERE owner_id = ? AND is_active = 1', [req.user.id]);
      const ids = sites.map(site => site.id);
      if (!ids.length) return res.json({ guards_on_duty: 0, open_incidents: 0, incomplete_patrols: 0, active_visitors: 0 });
      const placeholders = ids.map(() => '?').join(',');
      const [guards, incidents, patrols, visitors] = await Promise.all([
        getOne(`SELECT COUNT(*) as count FROM staff_entries WHERE status = 'inside' AND building_id IN (${placeholders})`, ids),
        getOne(`SELECT COUNT(*) as count FROM incident_reports WHERE status IN ('open', 'under_review') AND building_id IN (${placeholders})`, ids),
        getOne(`SELECT COUNT(*) as count FROM patrol_rounds WHERE status = 'in_progress' AND building_id IN (${placeholders})`, ids),
        getOne(`SELECT COUNT(*) as count FROM visitors WHERE status = 'checked_in' AND building_id IN (${placeholders})`, ids)
      ]);
      return res.json({ guards_on_duty: Number(guards?.count || 0), open_incidents: Number(incidents?.count || 0), incomplete_patrols: Number(patrols?.count || 0), active_visitors: Number(visitors?.count || 0) });
    }
    const [guards, incidents, patrols, visitors] = await Promise.all([
      getOne(`SELECT COUNT(*) as count FROM staff_entries${siteFilter}${siteFilter ? " AND" : ' WHERE'} status = 'inside'`, params),
      getOne(`SELECT COUNT(*) as count FROM incident_reports${siteFilter}${siteFilter ? " AND" : ' WHERE'} status IN ('open', 'under_review')`, params),
      getOne(`SELECT COUNT(*) as count FROM patrol_rounds${siteFilter}${siteFilter ? " AND" : ' WHERE'} status = 'in_progress'`, params),
      getOne(`SELECT COUNT(*) as count FROM visitors${siteFilter}${siteFilter ? " AND" : ' WHERE'} status = 'checked_in'`, params)
    ]);
    res.json({ guards_on_duty: Number(guards?.count || 0), open_incidents: Number(incidents?.count || 0), incomplete_patrols: Number(patrols?.count || 0), active_visitors: Number(visitors?.count || 0) });
  } catch (err) {
    console.error('Operations summary error:', err);
    res.status(500).json({ error: 'Failed to load operations summary' });
  }
});

router.get('/guards', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    let query = "SELECT u.id, u.email, u.full_name, u.phone, u.building_id, u.employee_number, u.date_of_birth, u.address, u.emergency_contact, u.clearance_status, u.profile_photo, u.is_active, b.name AS site_name FROM users u LEFT JOIN buildings b ON u.building_id = b.id WHERE u.role IN ('staff', 'security')";
    const params = [];
    if (req.user.role === 'supervisor') { query += ' AND u.building_id = ?'; params.push(req.user.building_id); }
    if (req.user.role === 'owner') {
      const sites = await getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      if (!sites.length) return res.json({ guards: [] });
      query += ` AND u.building_id IN (${sites.map(() => '?').join(',')})`;
      params.push(...sites.map(site => site.id));
    }
    query += ' ORDER BY u.full_name';
    res.json({ guards: await getAll(query, params) });
  } catch (err) {
    console.error('Guard list error:', err);
    res.status(500).json({ error: 'Failed to load guards' });
  }
});

router.get('/guards/:id', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const guard = await getOne("SELECT u.id, u.email, u.full_name, u.phone, u.building_id, u.employee_number, u.date_of_birth, u.address, u.emergency_contact, u.clearance_status, u.profile_photo, u.is_active, b.name AS site_name FROM users u LEFT JOIN buildings b ON u.building_id = b.id WHERE u.id = ? AND u.role IN ('staff', 'security')", [req.params.id]);
    if (!guard) return res.status(404).json({ error: 'Guard not found' });
    if (!await requireSiteAccess(req, res, guard.building_id)) return;
    const documents = await getAll('SELECT id, document_type, document_name, document_url, expires_at, created_at FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC', [guard.id]);
    res.json({ guard, documents });
  } catch (err) {
    console.error('Guard profile error:', err);
    res.status(500).json({ error: 'Failed to load guard profile' });
  }
});

router.put('/guards/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const guard = await getOne("SELECT id, building_id FROM users WHERE id = ? AND role IN ('staff', 'security')", [req.params.id]);
    if (!guard) return res.status(404).json({ error: 'Guard not found' });
    if (!await requireSiteAccess(req, res, guard.building_id)) return;
    const { employee_number, date_of_birth, address, emergency_contact, clearance_status, profile_photo } = req.body;
    const allowedClearances = ['not_cleared', 'cleared', 'suspended'];
    if (clearance_status && !allowedClearances.includes(clearance_status)) return res.status(400).json({ error: 'Invalid clearance status' });
    await runQuery('UPDATE users SET employee_number = COALESCE(?, employee_number), date_of_birth = COALESCE(?, date_of_birth), address = COALESCE(?, address), emergency_contact = COALESCE(?, emergency_contact), clearance_status = COALESCE(?, clearance_status), profile_photo = COALESCE(?, profile_photo), updated_at = ? WHERE id = ?', [employee_number, date_of_birth, address, emergency_contact, clearance_status, profile_photo, new Date().toISOString(), guard.id]);
    res.json({ message: 'Guard e-file updated' });
  } catch (err) {
    console.error('Guard update error:', err);
    res.status(500).json({ error: 'Failed to update guard e-file' });
  }
});

router.post('/guards/:id/documents', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { document_type, document_name, document_url, expires_at } = req.body;
    if (!document_type || !document_name || !document_url) return res.status(400).json({ error: 'Document type, name, and secure document URL are required' });
    const guard = await getOne("SELECT id, building_id FROM users WHERE id = ? AND role IN ('staff', 'security')", [req.params.id]);
    if (!guard) return res.status(404).json({ error: 'Guard not found' });
    if (!await requireSiteAccess(req, res, guard.building_id)) return;
    await runQuery('INSERT INTO employee_documents (id, employee_id, document_type, document_name, document_url, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [uuidv4(), guard.id, document_type, document_name, document_url, expires_at || null, new Date().toISOString()]);
    res.status(201).json({ message: 'Document recorded successfully' });
  } catch (err) {
    console.error('Document record error:', err);
    res.status(500).json({ error: 'Failed to record document' });
  }
});

router.post('/incidents', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const { building_id, title, category, severity, description, people_involved, actions_taken, occurred_at } = req.body;
    if (!building_id || !title || !category || !severity || !description) return res.status(400).json({ error: 'Site, title, category, severity, and description are required' });
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) return res.status(400).json({ error: 'Invalid severity' });
    if (!await requireSiteAccess(req, res, building_id)) return;
    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery('INSERT INTO incident_reports (id, building_id, reported_by, title, category, severity, description, people_involved, actions_taken, status, occurred_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, building_id, req.user.id, title, category, severity, description, people_involved || null, actions_taken || null, 'open', occurred_at || now, now, now]);
    res.status(201).json({ message: 'Incident report submitted', incident_id: id });
  } catch (err) {
    console.error('Incident create error:', err);
    res.status(500).json({ error: 'Failed to submit incident report' });
  }
});

router.get('/incidents', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const { building_id, status } = req.query;
    let query = 'SELECT i.*, b.name AS site_name, u.full_name AS reporter_name FROM incident_reports i JOIN buildings b ON i.building_id = b.id JOIN users u ON i.reported_by = u.id WHERE 1 = 1';
    const params = [];
    const requestedSite = building_id || (req.user.role === 'supervisor' ? req.user.building_id : null);
    if (requestedSite) { if (!await requireSiteAccess(req, res, requestedSite)) return; query += ' AND i.building_id = ?'; params.push(requestedSite); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    query += ' ORDER BY i.occurred_at DESC LIMIT 100';
    res.json({ incidents: await getAll(query, params) });
  } catch (err) {
    console.error('Incident list error:', err);
    res.status(500).json({ error: 'Failed to load incidents' });
  }
});

router.put('/incidents/:id/status', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    if (!['open', 'under_review', 'resolved', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid incident status' });
    const incident = await getOne('SELECT building_id FROM incident_reports WHERE id = ?', [req.params.id]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    if (!await requireSiteAccess(req, res, incident.building_id)) return;
    const resolvedAt = ['resolved', 'closed'].includes(status) ? new Date().toISOString() : null;
    await runQuery('UPDATE incident_reports SET status = ?, resolution_notes = COALESCE(?, resolution_notes), resolved_at = COALESCE(?, resolved_at), updated_at = ? WHERE id = ?', [status, resolution_notes, resolvedAt, new Date().toISOString(), req.params.id]);
    res.json({ message: 'Incident status updated' });
  } catch (err) {
    console.error('Incident update error:', err);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

router.post('/assets', authenticateToken, authorizeRoles(...managementRoles), async (req, res) => {
  try {
    const { building_id, name, asset_code, category, location, description } = req.body;
    if (!building_id || !name || !asset_code) return res.status(400).json({ error: 'Site, asset name, and asset code are required' });
    if (!await requireSiteAccess(req, res, building_id)) return;
    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery('INSERT INTO assets (id, building_id, name, asset_code, category, location, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, building_id, name, asset_code, category || null, location || null, description || null, 'active', now, now]);
    res.status(201).json({ asset: { id, building_id, name, asset_code, category, location, description, status: 'active' }, qr_value: `asset:${id}` });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Asset code already exists' });
    console.error('Asset create error:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

router.get('/assets/:buildingId', authenticateToken, async (req, res) => {
  try {
    if (!await requireSiteAccess(req, res, req.params.buildingId)) return;
    const assets = await getAll("SELECT * FROM assets WHERE building_id = ? AND status != 'retired' ORDER BY location, name", [req.params.buildingId]);
    res.json({ assets: assets.map(asset => ({ ...asset, qr_value: `asset:${asset.id}` })) });
  } catch (err) {
    console.error('Asset list error:', err);
    res.status(500).json({ error: 'Failed to load assets' });
  }
});

router.post('/patrols', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor', 'security', 'staff'), async (req, res) => {
  try {
    const { building_id, guard_id, notes } = req.body;
    const assignedGuard = guard_id || req.user.id;
    if (!building_id) return res.status(400).json({ error: 'Client site is required' });
    if (!await requireSiteAccess(req, res, building_id)) return;
    if (['security', 'staff'].includes(req.user.role) && assignedGuard !== req.user.id) return res.status(403).json({ error: 'Guards can only start their own patrols' });
    const guard = await getOne("SELECT id FROM users WHERE id = ? AND building_id = ? AND role IN ('staff', 'security') AND is_active = 1", [assignedGuard, building_id]);
    if (!guard) return res.status(400).json({ error: 'Guard is not active at this client site' });
    const existing = await getOne("SELECT id FROM patrol_rounds WHERE building_id = ? AND guard_id = ? AND status = 'in_progress'", [building_id, assignedGuard]);
    if (existing) return res.status(400).json({ error: 'This guard already has an active patrol', patrol_id: existing.id });
    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery('INSERT INTO patrol_rounds (id, building_id, guard_id, supervisor_id, status, started_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, building_id, assignedGuard, managementRoles.includes(req.user.role) ? req.user.id : null, 'in_progress', now, notes || null, now]);
    res.status(201).json({ patrol_id: id, message: 'Patrol started' });
  } catch (err) {
    console.error('Patrol start error:', err);
    res.status(500).json({ error: 'Failed to start patrol' });
  }
});

router.get('/patrols/:id', authenticateToken, async (req, res) => {
  try {
    const patrol = await getOne('SELECT p.*, b.name AS site_name, u.full_name AS guard_name FROM patrol_rounds p JOIN buildings b ON p.building_id = b.id JOIN users u ON p.guard_id = u.id WHERE p.id = ?', [req.params.id]);
    if (!patrol) return res.status(404).json({ error: 'Patrol not found' });
    if (!await requireSiteAccess(req, res, patrol.building_id)) return;
    const [assets, scans] = await Promise.all([
      getAll("SELECT id, name, asset_code, category, location FROM assets WHERE building_id = ? AND status = 'active' ORDER BY location, name", [patrol.building_id]),
      getAll('SELECT asset_id, scanned_at, condition_status, notes FROM patrol_scans WHERE patrol_round_id = ?', [patrol.id])
    ]);
    const scanMap = Object.fromEntries(scans.map(scan => [scan.asset_id, scan]));
    res.json({ patrol, checkpoints: assets.map(asset => ({ ...asset, scan: scanMap[asset.id] || null })), progress: { required: assets.length, scanned: scans.length, remaining: Math.max(assets.length - scans.length, 0) } });
  } catch (err) {
    console.error('Patrol detail error:', err);
    res.status(500).json({ error: 'Failed to load patrol' });
  }
});

router.post('/patrols/:id/scans', authenticateToken, authorizeRoles('admin', 'owner', 'supervisor', 'security', 'staff'), async (req, res) => {
  try {
    const { asset_qr, condition_status, notes } = req.body;
    const patrol = await getOne("SELECT * FROM patrol_rounds WHERE id = ? AND status = 'in_progress'", [req.params.id]);
    if (!patrol) return res.status(404).json({ error: 'Active patrol not found' });
    if (!await requireSiteAccess(req, res, patrol.building_id)) return;
    if (['security', 'staff'].includes(req.user.role) && patrol.guard_id !== req.user.id) return res.status(403).json({ error: 'Guards can only scan for their own patrol' });
    
    // Support multiple QR formats: "asset:<uuid>", "<uuid>", or "<asset_code>"
    const rawValue = String(asset_qr || '').trim();
    const assetId = rawValue.replace(/^asset:/, '');
    
    // Try to find asset by ID first, then by asset_code
    let asset = await getOne("SELECT id FROM assets WHERE id = ? AND building_id = ? AND status = 'active'", [assetId, patrol.building_id]);
    if (!asset) {
      // Try matching by asset_code (case-insensitive)
      asset = await getOne("SELECT id FROM assets WHERE LOWER(asset_code) = LOWER(?) AND building_id = ? AND status = 'active'", [assetId, patrol.building_id]);
    }
    if (!asset) return res.status(400).json({ error: 'This asset does not belong to the patrol site or is inactive' });
    
    const scan = await getOne('SELECT id FROM patrol_scans WHERE patrol_round_id = ? AND asset_id = ?', [patrol.id, asset.id]);
    if (scan) return res.status(400).json({ error: 'This asset has already been verified on this patrol' });
    await runQuery('INSERT INTO patrol_scans (id, patrol_round_id, asset_id, scanned_by, scanned_at, condition_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [uuidv4(), patrol.id, asset.id, req.user.id, new Date().toISOString(), condition_status || 'verified', notes || null]);
    res.status(201).json({ message: 'Asset verified' });
  } catch (err) {
    console.error('Patrol scan error:', err);
    res.status(500).json({ error: 'Failed to verify asset' });
  }
});

router.post('/patrols/:id/complete', authenticateToken, async (req, res) => {
  try {
    const patrol = await getOne("SELECT * FROM patrol_rounds WHERE id = ? AND status = 'in_progress'", [req.params.id]);
    if (!patrol) return res.status(404).json({ error: 'Active patrol not found' });
    if (!await requireSiteAccess(req, res, patrol.building_id)) return;
    if (['security', 'staff'].includes(req.user.role) && patrol.guard_id !== req.user.id) return res.status(403).json({ error: 'Guards can only complete their own patrol' });
    const [assetCount, scanCount] = await Promise.all([
      getOne("SELECT COUNT(*) as count FROM assets WHERE building_id = ? AND status = 'active'", [patrol.building_id]),
      getOne('SELECT COUNT(*) as count FROM patrol_scans WHERE patrol_round_id = ?', [patrol.id])
    ]);
    const required = Number(assetCount?.count || 0);
    const scanned = Number(scanCount?.count || 0);
    if (scanned < required) return res.status(400).json({ error: 'All active assets must be verified before completing this patrol', required, scanned });
    await runQuery("UPDATE patrol_rounds SET status = 'completed', completed_at = ? WHERE id = ?", [new Date().toISOString(), patrol.id]);
    res.json({ message: 'Patrol completed', required, scanned });
  } catch (err) {
    console.error('Patrol completion error:', err);
    res.status(500).json({ error: 'Failed to complete patrol' });
  }
});

module.exports = router;
