const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let pool = null;

function initNeon() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for Neon PostgreSQL');
  }
  // Use Pool for better compatibility with parameterized queries
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

function getPool() {
  if (!pool) {
    initNeon();
  }
  return pool;
}

async function runQuery(query, params = []) {
  const pool = getPool();
  try {
    // Convert ? placeholders to $1, $2, etc for PostgreSQL
    let pgQuery = query;
    let paramIndex = 0;
    pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
    
    // Pool.query returns { rows, fields, rowCount, ... }
    const result = await pool.query(pgQuery, params);
    return result.rows || [];
  } catch (err) {
    console.error('Query error:', err.message);
    console.error('Query was:', query.substring(0, 200));
    console.error('Params:', JSON.stringify(params));
    throw err;
  }
}

async function getOne(query, params = []) {
  try {
    const results = await runQuery(query, params);
    return results[0] || null;
  } catch (err) {
    console.error('getOne error:', err.message);
    console.error('Query:', query.substring(0, 200));
    throw err; // Re-throw to let route handler catch it
  }
}

async function getAll(query, params = []) {
  try {
    const results = await runQuery(query, params);
    return results;
  } catch (err) {
    console.error('Query error:', err.message);
    return [];
  }
}

async function initializeDatabase() {
  initNeon();
  const pool = getPool();

  // Create tables using PostgreSQL syntax
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    building_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    qr_code TEXT,
    entry_qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_number_encrypted TEXT NOT NULL,
    purpose TEXT NOT NULL,
    building_id TEXT NOT NULL,
    device_fingerprint TEXT,
    ip_address TEXT,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    status TEXT DEFAULT 'checked_in',
    synced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS staff_attendance (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    building_id TEXT NOT NULL,
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    ip_address TEXT,
    work_date TEXT NOT NULL,
    total_hours REAL,
    notes TEXT,
    synced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    unit_number TEXT NOT NULL,
    building_id TEXT NOT NULL,
    rent_amount REAL NOT NULL,
    rent_due_day INTEGER DEFAULT 1,
    lease_start TEXT,
    lease_end TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    building_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_date TIMESTAMP,
    rent_month TEXT NOT NULL,
    qr_code TEXT,
    notes TEXT,
    synced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0,
    synced_at TIMESTAMP
  )`);

  // Check if admin exists
  const adminCheck = await getOne("SELECT id FROM users WHERE role = $1", ['admin']);
  if (!adminCheck) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const id = uuidv4();
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO users (id, email, password, full_name, role, phone, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, 'admin@buildingms.com', hashedPassword, 'System Administrator', 'admin', '+263000000000', now, now, 1]
    );
    console.log('✅ Default admin created: admin@buildingms.com / admin123');
  }

  console.log('✅ Neon PostgreSQL database initialized successfully');
  return pool;
}

// For compatibility, also export saveDatabase as no-op
function saveDatabase() {
  // No-op for PostgreSQL - data is automatically persisted
}

module.exports = { getPool, initializeDatabase, runQuery, getOne, getAll, saveDatabase };
