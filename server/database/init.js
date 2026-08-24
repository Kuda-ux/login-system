// Database initialization - supports both SQLite (local) and Neon PostgreSQL (production)

// Check if we should use Neon PostgreSQL
if (process.env.DATABASE_URL) {
  // Use Neon PostgreSQL for production
  module.exports = require('./neon');
} else {
  // Use SQLite for local development
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

    for (const column of [
      'staff_qr_code TEXT', 'employee_number TEXT', 'date_of_birth TEXT', 'address TEXT',
      'emergency_contact TEXT', "clearance_status TEXT DEFAULT 'not_cleared'", 'profile_photo TEXT', 'client_id TEXT'
    ]) {
      try { db.run(`ALTER TABLE users ADD COLUMN ${column}`); } catch (err) {}
    }

    try { db.run('ALTER TABLE buildings ADD COLUMN client_id TEXT'); } catch (err) {}

    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_name TEXT, contact_phone TEXT,
      contact_email TEXT, address TEXT, is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS employee_documents (
      id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, document_type TEXT NOT NULL,
      document_name TEXT NOT NULL, document_url TEXT NOT NULL, expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS incident_reports (
      id TEXT PRIMARY KEY, building_id TEXT NOT NULL, reported_by TEXT NOT NULL,
      title TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL,
      description TEXT NOT NULL, people_involved TEXT, actions_taken TEXT,
      status TEXT DEFAULT 'open', occurred_at TEXT NOT NULL, resolved_at TEXT,
      resolution_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY, building_id TEXT NOT NULL, name TEXT NOT NULL,
      asset_code TEXT UNIQUE NOT NULL, category TEXT, location TEXT, description TEXT,
      status TEXT DEFAULT 'active', qr_code TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS patrol_rounds (
      id TEXT PRIMARY KEY, building_id TEXT NOT NULL, guard_id TEXT NOT NULL,
      supervisor_id TEXT, status TEXT DEFAULT 'in_progress', started_at TEXT NOT NULL,
      completed_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS patrol_scans (
      id TEXT PRIMARY KEY, patrol_round_id TEXT NOT NULL, asset_id TEXT NOT NULL,
      scanned_by TEXT NOT NULL, scanned_at TEXT NOT NULL, condition_status TEXT DEFAULT 'verified',
      notes TEXT, UNIQUE(patrol_round_id, asset_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS staff_entries (
      id TEXT PRIMARY KEY, staff_id TEXT NOT NULL, building_id TEXT NOT NULL,
      entry_time TEXT DEFAULT CURRENT_TIMESTAMP, exit_time TEXT,
      status TEXT DEFAULT 'inside', scanned_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vehicle tracking tables
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, registration_number TEXT UNIQUE NOT NULL,
      make TEXT, model TEXT, color TEXT, assigned_driver_id TEXT, building_id TEXT,
      status TEXT DEFAULT 'active', last_latitude REAL, last_longitude REAL,
      last_location_update TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vehicle_tracking (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, driver_id TEXT,
      latitude REAL NOT NULL, longitude REAL NOT NULL, speed REAL, heading REAL,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Weapons management tables
    db.run(`CREATE TABLE IF NOT EXISTS weapons (
      id TEXT PRIMARY KEY, serial_number TEXT UNIQUE NOT NULL, weapon_type TEXT NOT NULL,
      make TEXT, model TEXT, caliber TEXT, status TEXT DEFAULT 'available',
      building_id TEXT, current_holder_id TEXT, issued_at TEXT, returned_at TEXT,
      condition_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS weapon_assignments (
      id TEXT PRIMARY KEY, weapon_id TEXT NOT NULL, guard_id TEXT NOT NULL,
      issued_by TEXT NOT NULL, issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      returned_at TEXT, returned_to TEXT, condition_on_issue TEXT, condition_on_return TEXT, notes TEXT
    )`);

    // Check if admin exists
    const adminCheck = getOne("SELECT id FROM users WHERE role = 'admin'");
    if (!adminCheck) {
      const hashedPassword = await bcrypt.hash('Cherubim@2026', 10);
      const id = uuidv4();
      const now = new Date().toISOString();
      db.run(`INSERT INTO users (id, email, password, full_name, role, phone, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, 'admin@cherubimsecurity.co.zw', hashedPassword, 'System Administrator', 'admin', '+263000000000', now, now, 1]);
      console.log('✅ Default admin created');
    }

    saveDatabase();
    console.log('✅ Database initialized successfully');
    return db;
  }

  module.exports = { getDb, initializeDatabase, runQuery, getOne, getAll, saveDatabase };
}
