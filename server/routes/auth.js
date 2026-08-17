const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getOne, getAll, runQuery, saveDatabase } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);

    if (!user) {
      // Log failed login attempt
      await runQuery('INSERT INTO login_logs (id, user_id, email, full_name, role, ip_address, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'unknown', email, null, null, req.clientIP || req.ip, req.headers['user-agent'] || '', new Date().toISOString(), 'failed']);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Log failed login attempt
      await runQuery('INSERT INTO login_logs (id, user_id, email, full_name, role, ip_address, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), user.id, email, user.full_name, user.role, req.clientIP || req.ip, req.headers['user-agent'] || '', new Date().toISOString(), 'failed']);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, building_id: user.building_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await runQuery('INSERT INTO login_logs (id, user_id, email, full_name, role, ip_address, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), user.id, user.email, user.full_name, user.role, req.clientIP || req.ip, req.headers['user-agent'] || '', new Date().toISOString(), 'success']);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        building_id: user.building_id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register new user (admin/owner only)
router.post('/register', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { email, password, full_name, role, phone, building_id } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only admin can create owners
    if (role === 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create building owners' });
    }

    // Owners can only create staff or security for their buildings
    if (req.user.role === 'owner' && !['staff', 'security', 'supervisor'].includes(role)) {
      return res.status(403).json({ error: 'Owners can only create guard or supervisor accounts' });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    await runQuery(`INSERT INTO users (id, email, password, full_name, role, phone, building_id, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [userId, email, hashedPassword, full_name, role, phone || null, building_id || null, now, now]);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email, full_name, role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getOne('SELECT id, email, full_name, role, phone, building_id, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update password (self)
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await getOne('SELECT password FROM users WHERE id = ?', [req.user.id]);

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await runQuery('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hashedPassword, now, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Admin reset password for any employee
router.put('/users/:id/password', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await getOne('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await runQuery('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hashedPassword, now, id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Admin password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Get all users (admin/owner only) - includes supervisor role for staff list
router.get('/users', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.building_id, u.is_active, u.created_at, b.name as building_name 
                 FROM users u LEFT JOIN buildings b ON u.building_id = b.id WHERE u.is_active = 1`;
    const params = [];
    
    if (role) {
      const roles = role.split(',');
      query += ` AND u.role IN (${roles.map(() => '?').join(',')})`;
      params.push(...roles);
    }
    
    if (req.user.role === 'owner') {
      const buildings = await getAll('SELECT id FROM buildings WHERE owner_id = ?', [req.user.id]);
      const buildingIds = buildings.map(b => b.id);
      if (buildingIds.length > 0) {
        query += ` AND u.building_id IN (${buildingIds.map(() => '?').join(',')})`;
        params.push(...buildingIds);
      } else {
        return res.json({ users: [] });
      }
    }
    
    query += ' ORDER BY u.created_at DESC';
    const users = await getAll(query, params);
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user (admin/owner only)
router.put('/users/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, building_id } = req.body;
    
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date().toISOString();
    await runQuery(`UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), 
                    role = COALESCE(?, role), building_id = COALESCE(?, building_id), updated_at = ? WHERE id = ?`,
      [full_name, phone, role, building_id, now, id]);
    
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user (admin/owner only)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await runQuery('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const now = new Date().toISOString();
    await runQuery('UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = ? WHERE id = ?',
      [full_name, phone, now, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get login logs (admin only)
router.get('/login-logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, status, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM login_logs WHERE 1=1';
    const params = [];

    if (user_id) { query += ' AND user_id = ?'; params.push(user_id); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (start_date) { query += ' AND login_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND login_at <= ?'; params.push(new Date(new Date(end_date).getTime() + 86400000).toISOString()); }

    query += ' ORDER BY login_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const logs = await getAll(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM login_logs WHERE 1=1';
    const countParams = [];
    if (user_id) { countQuery += ' AND user_id = ?'; countParams.push(user_id); }
    if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
    if (start_date) { countQuery += ' AND login_at >= ?'; countParams.push(start_date); }
    if (end_date) { countQuery += ' AND login_at <= ?'; countParams.push(new Date(new Date(end_date).getTime() + 86400000).toISOString()); }

    const countResult = await getOne(countQuery, countParams);
    const total = countResult ? parseInt(countResult.count) : 0;

    res.json({
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Login logs error:', err);
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

module.exports = router;
