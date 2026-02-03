const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../data/building_management.db');
const dataDir = path.join(__dirname, '../../data');

let db = null;
let SQL = null;

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  return db;
}

function runQuery(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

function getOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    console.error('Query error:', err.message);
    return null;
  }
}

function getAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Query error:', err.message);
    return [];
  }
}

async function initializeDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    full_name TEXT NOT NULL, role TEXT NOT NULL, phone TEXT, building_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, is_active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, owner_id TEXT NOT NULL,
    qr_code TEXT, entry_qr_code TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP, is_active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone TEXT NOT NULL, id_number_encrypted TEXT NOT NULL,
    purpose TEXT NOT NULL, building_id TEXT NOT NULL, device_fingerprint TEXT, ip_address TEXT,
    check_in_time TEXT DEFAULT CURRENT_TIMESTAMP, check_out_time TEXT, status TEXT DEFAULT 'checked_in',
    synced INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS staff_attendance (
    id TEXT PRIMARY KEY, staff_id TEXT NOT NULL, building_id TEXT NOT NULL, clock_in_time TEXT,
    clock_out_time TEXT, ip_address TEXT, work_date TEXT NOT NULL, total_hours REAL, notes TEXT,
    synced INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT, phone TEXT NOT NULL, unit_number TEXT NOT NULL,
    building_id TEXT NOT NULL, rent_amount REAL NOT NULL, rent_due_day INTEGER DEFAULT 1,
    lease_start TEXT, lease_end TEXT, is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, building_id TEXT NOT NULL, amount REAL NOT NULL,
    payment_method TEXT NOT NULL, payment_reference TEXT, payment_status TEXT DEFAULT 'pending',
    payment_date TEXT, rent_month TEXT NOT NULL, qr_code TEXT, notes TEXT, synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY, table_name TEXT NOT NULL, record_id TEXT NOT NULL, action TEXT NOT NULL,
    data TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, synced INTEGER DEFAULT 0, synced_at TEXT
  )`);

  // Check if admin exists
  const adminCheck = getOne("SELECT id FROM users WHERE role = 'admin'");
  if (!adminCheck) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(`INSERT INTO users (id, email, password, full_name, role, phone, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, 'admin@buildingms.com', hashedPassword, 'System Administrator', 'admin', '+263000000000', now, now, 1]);
    console.log('✅ Default admin created: admin@buildingms.com / admin123');
  }

  saveDatabase();
  console.log('✅ Database initialized successfully');
  return db;
}

module.exports = { getDb, initializeDatabase, runQuery, getOne, getAll, saveDatabase };
