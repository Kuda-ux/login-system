/**
 * Database Reset Script for Cherubim Security Management System
 * 
 * This script clears ALL test data from the production database while
 * preserving the table schema. After clearing, it re-creates the default
 * admin account.
 * 
 * Usage:
 *   DATABASE_URL=your_neon_connection_string node server/scripts/reset-database.js
 * 
 * WARNING: This will permanently delete all data. Use with caution.
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    console.error('Usage: DATABASE_URL=your_connection_string node server/scripts/reset-database.js');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('========================================');
  console.log(' Cherubim Security - Database Reset');
  console.log('========================================\n');

  try {
    // Tables to clear (order matters due to potential references)
    const tables = [
      'patrol_scans',
      'patrol_rounds',
      'weapon_assignments',
      'weapons',
      'vehicle_tracking',
      'vehicles',
      'employee_documents',
      'incident_reports',
      'assets',
      'staff_entries',
      'staff_attendance',
      'visitors',
      'payments',
      'tenants',
      'sync_queue',
      'login_logs',
      'buildings',
      'clients',
      'users'
    ];

    console.log('Clearing all tables...\n');

    for (const table of tables) {
      try {
        const result = await pool.query(`DELETE FROM ${table}`);
        console.log(`  [OK] ${table} - ${result.rowCount} records deleted`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`  [SKIP] ${table} - table does not exist`);
        } else {
          console.log(`  [WARN] ${table} - ${err.message}`);
        }
      }
    }

    console.log('\n----------------------------------------');
    console.log('Creating default admin account...\n');

    // Create default admin
    const hashedPassword = await bcrypt.hash('Cherubim@2026', 10);
    const adminId = uuidv4();
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO users (id, email, password, full_name, role, phone, created_at, updated_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [adminId, 'admin@cherubimsecurity.co.zw', hashedPassword, 'System Administrator', 'admin', '+263000000000', now, now, 1]
    );

    console.log('  [OK] Admin account created');
    console.log('       Email: admin@cherubimsecurity.co.zw');
    console.log('       Password: Cherubim@2026');
    console.log('\n========================================');
    console.log(' Database reset complete!');
    console.log(' Please change the admin password after');
    console.log(' first login via Settings > Change Password.');
    console.log('========================================\n');

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
