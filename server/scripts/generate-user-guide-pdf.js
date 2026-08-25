/**
 * Cherubim Security - Professional User Guide PDF Generator
 * 
 * Usage: node server/scripts/generate-user-guide-pdf.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
  black: '#0a0a0a',
  gold: '#d4ae2a',
  goldDark: '#b8960f',
  white: '#ffffff',
  gray: '#888888',
  midGray: '#666666',
  darkGray: '#333333',
  tableBorder: '#cccccc',
  tableHeader: '#1a1a1a',
  tableAlt: '#f4f4f4',
  infoBg: '#fef9e7'
};

const LEFT = 55;
const RIGHT_EDGE = 595.28 - 55; // A4 width minus right margin
const CONTENT_WIDTH = RIGHT_EDGE - LEFT;
const PAGE_BOTTOM = 841.89 - 70; // A4 height minus bottom margin
const TOP_START = 75;

const outputPath = path.join(__dirname, '../../Cherubim_Security_User_Guide.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 70, left: LEFT, right: 55 },
  bufferPages: true, // buffer so we can add headers/footers at end
  info: {
    Title: 'Cherubim Security Management System - User Guide',
    Author: 'Cherubim Security (Pvt) Ltd',
    Subject: 'System Documentation'
  }
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Track position manually
let Y = 0;

function getY() { return doc.y; }
function setY(val) { doc.y = val; Y = val; }

function spaceLeft() { return PAGE_BOTTOM - doc.y; }

function ensureSpace(needed) {
  if (doc.y + needed > PAGE_BOTTOM) {
    doc.addPage();
    setY(TOP_START);
    return true;
  }
  return false;
}

function gap(pts) {
  doc.y += pts;
}

// ── Text helpers ──

function heading1(text) {
  ensureSpace(55);
  const y = doc.y;
  // Gold accent bar
  doc.save();
  doc.rect(LEFT, y, 4, 22).fill(COLORS.gold);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(19).fillColor(COLORS.black);
  doc.text(text, LEFT + 14, y + 1, { width: CONTENT_WIDTH - 14 });
  gap(4);
  // Gold rule
  const ruleY = doc.y;
  doc.save();
  doc.moveTo(LEFT, ruleY).lineTo(RIGHT_EDGE, ruleY)
    .strokeColor(COLORS.gold).lineWidth(1).stroke();
  doc.restore();
  gap(10);
}

function heading2(text) {
  ensureSpace(35);
  gap(6);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.goldDark);
  doc.text(text, LEFT, doc.y, { width: CONTENT_WIDTH });
  gap(5);
}

function heading3(text) {
  ensureSpace(28);
  gap(4);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.darkGray);
  doc.text(text, LEFT, doc.y, { width: CONTENT_WIDTH });
  gap(4);
}

function para(text) {
  ensureSpace(20);
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.darkGray);
  doc.text(text, LEFT, doc.y, { width: CONTENT_WIDTH, lineGap: 2.5 });
  gap(5);
}

function bullet(text, indent) {
  indent = indent || 0;
  ensureSpace(16);
  const x = LEFT + 10 + indent * 14;
  const bulletX = x - 8;
  const y = doc.y;
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.gold);
  doc.text('\u2022', bulletX, y, { lineBreak: false });
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.darkGray);
  doc.text(text, x + 2, y, { width: RIGHT_EDGE - x - 2, lineGap: 2 });
  gap(2);
}

function numbered(num, text) {
  ensureSpace(16);
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.gold);
  doc.text(`${num}.`, LEFT + 10, y, { continued: false, lineBreak: false });
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.darkGray);
  doc.text(text, LEFT + 28, y, { width: RIGHT_EDGE - LEFT - 30, lineGap: 2 });
  gap(2);
}

function drawTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 20;
  const padX = 5;
  const padY = 5;

  function drawRow(cols, isHeader, isAlt) {
    // Check if we need a new page mid-table
    if (doc.y + rowH > PAGE_BOTTOM) {
      doc.addPage();
      setY(TOP_START);
      // re-draw header on new page
      drawRow(headers, true, false);
    }
    const y = doc.y;
    // background
    if (isHeader) {
      doc.save();
      doc.rect(LEFT, y, totalW, rowH).fill(COLORS.tableHeader);
      doc.restore();
    } else if (isAlt) {
      doc.save();
      doc.rect(LEFT, y, totalW, rowH).fill(COLORS.tableAlt);
      doc.restore();
    }
    // cell text
    let x = LEFT;
    cols.forEach((cell, i) => {
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(isHeader ? COLORS.gold : COLORS.darkGray);
      doc.text(String(cell), x + padX, y + padY, {
        width: colWidths[i] - padX * 2,
        height: rowH - padY,
        lineBreak: false,
        ellipsis: true
      });
      x += colWidths[i];
    });
    // bottom border
    doc.save();
    doc.moveTo(LEFT, y + rowH).lineTo(LEFT + totalW, y + rowH)
      .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
    doc.restore();
    doc.y = y + rowH;
  }

  ensureSpace(rowH * 2);  // at least header + one row
  gap(2);
  drawRow(headers, true, false);
  rows.forEach((row, i) => drawRow(row, false, i % 2 === 1));
  gap(6);
}

function infoBox(title, text) {
  ensureSpace(55);
  const boxW = CONTENT_WIDTH;
  const y = doc.y;
  // measure text height
  const textH = doc.font('Helvetica').fontSize(8.5)
    .heightOfString(text, { width: boxW - 30 });
  const boxH = textH + 32;

  doc.save();
  doc.rect(LEFT, y, boxW, boxH).fillAndStroke(COLORS.infoBg, COLORS.gold);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.goldDark);
  doc.text(title, LEFT + 12, y + 8, { width: boxW - 24 });

  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.darkGray);
  doc.text(text, LEFT + 12, y + 22, { width: boxW - 24, lineGap: 2 });

  doc.y = y + boxH + 8;
}

// ============================================================
// COVER PAGE
// ============================================================

// Full black background
doc.rect(0, 0, 595.28, 841.89).fill(COLORS.black);

// Gold border frame
const bw = 3;
doc.rect(bw, bw, 595.28 - bw * 2, 841.89 - bw * 2).lineWidth(bw).strokeColor(COLORS.gold).stroke();

// Inner decorative line
doc.rect(18, 18, 595.28 - 36, 841.89 - 36).lineWidth(0.5).strokeColor('#555555').stroke();

// Gold circle with initials
const cx = 595.28 / 2;
doc.circle(cx, 200, 45).fill(COLORS.gold);
doc.font('Helvetica-Bold').fontSize(36).fillColor(COLORS.black);
doc.text('CS', cx - 25, 180, { lineBreak: false });

// Title block
doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.gold);
doc.text('CHERUBIM SECURITY', 0, 290, { align: 'center', width: 595.28 });

doc.font('Helvetica').fontSize(13).fillColor(COLORS.white);
doc.text('MANAGEMENT SYSTEM', 0, 328, { align: 'center', width: 595.28 });

// Gold divider
doc.save();
doc.moveTo(cx - 80, 365).lineTo(cx + 80, 365)
  .strokeColor(COLORS.gold).lineWidth(2).stroke();
doc.restore();

doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.white);
doc.text('User Guide', 0, 390, { align: 'center', width: 595.28 });

doc.font('Helvetica').fontSize(11).fillColor(COLORS.gray);
doc.text('Complete System Documentation', 0, 425, { align: 'center', width: 595.28 });

// Bottom info
doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray);
doc.text('Version 2.0  |  August 2026', 0, 700, { align: 'center', width: 595.28 });

doc.font('Helvetica').fontSize(8).fillColor(COLORS.gold);
doc.text('CONFIDENTIAL \u2014 For Authorised Personnel Only', 0, 740, { align: 'center', width: 595.28 });

doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.gold);
doc.text('Cherubim Security (Pvt) Ltd', 0, 770, { align: 'center', width: 595.28 });

// ============================================================
// TABLE OF CONTENTS
// ============================================================

doc.addPage();
setY(TOP_START);

doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.black);
doc.text('Table of Contents', LEFT, doc.y, { width: CONTENT_WIDTH });
gap(6);
doc.save();
doc.moveTo(LEFT, doc.y).lineTo(RIGHT_EDGE, doc.y)
  .strokeColor(COLORS.gold).lineWidth(2).stroke();
doc.restore();
gap(18);

const tocItems = [
  ['1', 'System Overview'],
  ['2', 'Getting Started'],
  ['3', 'Admin Portal'],
  ['', '   3.1 Dashboard'],
  ['', '   3.2 Buildings Management'],
  ['', '   3.3 Staff Management'],
  ['', '   3.4 Visitors'],
  ['', '   3.5 Operations Centre'],
  ['', '   3.6 Guard Files (E-Files)'],
  ['', '   3.7 Assets'],
  ['', '   3.8 Vehicles'],
  ['', '   3.9 Weapons Management'],
  ['', '   3.10 Reports'],
  ['', '   3.11 Settings'],
  ['4', 'Security / Supervisor Portal'],
  ['5', 'Staff / Guard Portal'],
  ['6', 'Visitor Check-in System'],
  ['7', 'User Roles & Permissions'],
  ['8', 'Setting Up a New Site'],
  ['9', 'Daily Operations Guide'],
  ['10', 'Reporting & Exports'],
  ['11', 'Troubleshooting'],
  ['12', 'Security & Data Protection']
];

tocItems.forEach(([num, title]) => {
  const y = doc.y;
  const isMain = num !== '';
  const fontSize = isMain ? 11 : 9.5;
  const indent = isMain ? 0 : 15;

  if (isMain && num !== '1') gap(3);

  doc.font(isMain ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize).fillColor(COLORS.darkGray);
  if (isMain) {
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(COLORS.gold);
    doc.text(`${num}.`, LEFT, doc.y, { continued: false, lineBreak: false });
    doc.moveUp();
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(COLORS.darkGray);
    doc.text(title, LEFT + 24, doc.y);
  } else {
    doc.text(title, LEFT + indent, doc.y, { width: CONTENT_WIDTH });
  }
  gap(2);
});

// ============================================================
// SECTION 1: SYSTEM OVERVIEW
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('1. System Overview');

para('The Cherubim Security Management System is a comprehensive web-based platform that manages all aspects of security operations across your client sites. Built for professional security companies operating across multiple locations.');

para('The system consists of four portals, each designed for a different type of user:');

drawTable(
  ['Portal', 'Users', 'Purpose'],
  [
    ['Admin Portal', 'Operations managers, directors', 'Full system control & management'],
    ['Security Portal', 'Supervisors, control room', 'Monitor visitors, scan badges, incidents'],
    ['Staff Portal', 'Security guards, ground staff', 'Clock in/out, patrols, shifts'],
    ['Visitor Check-in', 'Building visitors (public)', 'Self-service QR check-in/out']
  ],
  [130, 160, CONTENT_WIDTH - 290]
);

heading2('System Architecture');
bullet('Frontend: React application hosted on Vercel (global CDN)');
bullet('Backend: Node.js / Express API hosted on Render');
bullet('Database: Neon PostgreSQL (serverless, auto-scaling)');
bullet('Security: JWT authentication, bcrypt hashing, AES encryption');
bullet('Offline Support: Progressive Web App with automatic sync');

gap(4);
heading2('Portal Access URLs');
para('After deployment, the system is accessible at these URLs (replace "your-domain" with your actual Vercel domain):');
bullet('Landing Page:  /');
bullet('Admin Login:  /admin/login');
bullet('Security Login:  /security/login');
bullet('Staff Login:  /staff/login');
bullet('Visitor Check-in:  /checkin/<building-id>');

// ============================================================
// SECTION 2: GETTING STARTED
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('2. Getting Started');

heading2('First-Time Login');
numbered(1, 'Open your browser and navigate to the Admin Login page');
numbered(2, 'Enter the administrator credentials provided to you');
numbered(3, 'After first login, go to Settings > Change Password immediately');

gap(4);
heading2('Recommended First Steps');
numbered(1, 'Change the admin password (Settings page)');
numbered(2, 'Create your buildings / client sites (Buildings page)');
numbered(3, 'Print QR codes for each building entrance');
numbered(4, 'Create supervisor accounts for site managers');
numbered(5, 'Create guard/staff accounts and assign them to buildings');
numbered(6, 'Brief your team on how to use the system');

gap(4);
infoBox(
  'IMPORTANT - CHANGE DEFAULT PASSWORD',
  'Always change the default admin password immediately after first login. Use a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.'
);

// ============================================================
// SECTION 3: ADMIN PORTAL
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('3. Admin Portal');

para('The Admin Portal is the command centre of the entire system. After logging in at /admin/login, you will see the dashboard with a sidebar navigation providing access to all management functions.');

heading2('3.1 Dashboard');
para('The dashboard provides an at-a-glance overview of your operations:');
bullet('Total Buildings \u2014 Number of active sites under management');
bullet('Total Staff \u2014 All registered staff members across all sites');
bullet("Today's Visitors \u2014 Visitors checked in today across all sites");
bullet('Active Visitors \u2014 Currently inside your buildings right now');
bullet('Open Incidents \u2014 Unresolved incident reports requiring attention');
bullet('Active Patrols \u2014 Patrol rounds currently in progress');
bullet('Guards on Duty \u2014 Staff members currently clocked in');
para('The dashboard also displays visitor trend charts and recent activity feeds to help you monitor operations at a glance.');

heading2('3.2 Buildings Management');
para('Manage all your client sites from one central location.');

heading3('Adding a Building');
numbered(1, 'Click the "Add Building" button');
numbered(2, 'Enter the building name (e.g., "First Mutual Tower")');
numbered(3, 'Enter the full street address');
numbered(4, 'Click Save');
numbered(5, 'The system automatically generates a unique QR code for visitor check-in');

gap(3);
heading3('Building QR Codes');
bullet('Each building receives a unique QR code for visitor check-in');
bullet('Download or print the QR code and display it at all entry points');
bullet('Recommended locations: reception desk, main entrance, security booth, elevator lobby');
bullet('If a QR code is compromised, use "Regenerate QR" to create a new one');

heading2('3.3 Staff Management');
para('Create and manage user accounts for your entire team.');

heading3('Creating a New Staff Member');
numbered(1, 'Go to Staff in the sidebar menu');
numbered(2, 'Click "Add Staff"');
numbered(3, 'Fill in: Full Name, Email (must be unique), Password, Phone Number');
numbered(4, 'Select Role: Staff, Security, Supervisor, or Owner');
numbered(5, 'Assign them to a specific building/site');
numbered(6, 'Click Save');

gap(3);
heading3('User Roles');
drawTable(
  ['Role', 'Description', 'Access Level'],
  [
    ['Staff', 'Security guards on the ground', 'Clock in/out, patrols, own attendance'],
    ['Security', 'Guards with scanner access', 'Staff abilities + scan badges + incidents'],
    ['Supervisor', 'Site managers', 'Security + operations + weapons + reports'],
    ['Owner', 'Building owners / clients', 'Admin-like access, limited to own buildings']
  ],
  [85, 175, CONTENT_WIDTH - 260]
);

heading3('Password Management');
bullet('Reset any staff password via the key icon next to their name');
bullet('Minimum password length is 6 characters');
bullet('Users can also change their own password via their Settings page');
bullet('Deactivating an account preserves all historical data');

heading2('3.4 Visitors');
para('View all visitor records across all your sites with powerful filtering:');
bullet('Filter by date range to view specific periods');
bullet('Filter by status: currently checked in or checked out');
bullet('Search by visitor name, phone number, or purpose of visit');
bullet('View full details including check-in/out times and visit duration');
bullet('Visitor ID numbers are encrypted in the database and decrypted only for authorised users');

heading2('3.5 Operations Centre');
para('The central hub for managing day-to-day security functions across all sites.');

heading3('Overview Cards');
bullet('Guards on duty \u2014 real-time count');
bullet('Open incidents \u2014 requiring attention');
bullet('Incomplete patrols \u2014 rounds not yet finished');
bullet('Active visitors \u2014 currently in buildings');

gap(2);
heading3('Guard Management');
para('View all guards with their clearance status, assigned sites, and key details. Click any guard to access their full personnel e-file.');

heading3('Patrol Rounds');
para('Monitor all patrol rounds: in-progress and completed. See which checkpoints were scanned, patrol duration, and overall completion rates.');

heading3('Incident Reports');
para('Log and track security incidents. Each incident includes:');
bullet('Title, detailed description, and category');
bullet('Severity level: Low, Medium, High, or Critical');
bullet('Status tracking: Open \u2192 Under Review \u2192 Resolved \u2192 Closed');
bullet('Resolution notes and complete audit trail');

heading2('3.6 Guard Files (E-Files)');
para('Maintain comprehensive personnel files for each security guard:');
bullet('Employee number and personal information');
bullet('Date of birth, residential address, emergency contact');
bullet('Clearance status: Not Cleared / Cleared / Suspended');
bullet('Profile photograph');
bullet('Uploaded documents: ID copies, certifications, contracts, training records');

infoBox(
  'CLEARANCE REQUIREMENT',
  'Guards must have their clearance status set to "Cleared" before they can be issued any weapons. Update clearance in Guard Files before attempting weapon issue.'
);

heading2('3.7 Assets');
para('Register physical assets at each site for patrol verification. Assets become patrol checkpoints \u2014 guards scan the QR code on each asset during their rounds to prove they physically visited the location.');

heading3('Adding an Asset');
numbered(1, 'Click "Add Asset"');
numbered(2, 'Select the building / site');
numbered(3, 'Enter asset name (e.g., "Fire Extinguisher \u2014 Ground Floor")');
numbered(4, 'Enter a unique asset code (e.g., "FE-GF-001")');
numbered(5, 'Set category and location description');
numbered(6, 'Save \u2014 system generates a QR code for the asset');
numbered(7, 'Print the QR code and mount it at the asset location');

heading2('3.8 Vehicles');
para('Track company vehicles across your operations:');
bullet('Register vehicles with registration number, make, model, and colour');
bullet('Assign drivers to specific vehicles');
bullet('Track GPS locations with speed and heading data');
bullet('Map view for real-time fleet visibility across all sites');

heading2('3.9 Weapons Management');
para('Manage the entire weapon lifecycle with a complete audit trail.');

heading3('Registering a Weapon');
numbered(1, 'Click "Add Weapon"');
numbered(2, 'Enter the serial number (must be unique in the system)');
numbered(3, 'Select weapon type; enter make, model, and caliber');
numbered(4, 'Assign to a building / site');
numbered(5, 'Save');

gap(3);
heading3('Issuing a Weapon to a Guard');
numbered(1, 'Select the weapon from the inventory list');
numbered(2, 'Click "Issue"');
numbered(3, 'Select the guard (must have "Cleared" clearance status)');
numbered(4, 'Record condition notes on issue');
numbered(5, 'Confirm \u2014 the transaction is logged with timestamp and issuer name');

gap(3);
heading3('Returning a Weapon');
numbered(1, 'Select the issued weapon');
numbered(2, 'Click "Return"');
numbered(3, 'Record condition on return');
numbered(4, 'Confirm \u2014 weapon status returns to "Available"');

heading2('3.10 Reports');
para('Generate reports and export data to Excel (.xlsx) format:');
bullet('Visitor Reports \u2014 visitor logs by date range and site');
bullet('Attendance Reports \u2014 staff attendance with hours worked');
bullet('Guard Log Sheets \u2014 30-day attendance analysis per guard');
bullet('Login Activity \u2014 system access audit log (admin only)');
bullet('Patrol Reports \u2014 completion rates and guard accountability');

heading2('3.11 Settings');
bullet('Profile \u2014 update your display name and phone number');
bullet('Change Password \u2014 requires your current password for verification');

// ============================================================
// SECTION 4: SECURITY PORTAL
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('4. Security / Supervisor Portal');

para('Access at: /security/login');
para('The Security Portal is designed for site supervisors and control room operators who need to monitor building access in real-time.');

heading2('4.1 Dashboard');
para('After logging in, the dashboard displays two main tabs:');

heading3('Staff Tab');
bullet('All staff members currently inside the building');
bullet('Staff who have exited today with timestamps');
bullet('Entry/exit times and calculated shift durations');

heading3('Visitors Tab');
bullet('All visitors currently checked into the building');
bullet("Today's complete visitor log with full details");
bullet('Search visitors by name, phone number, or purpose');
bullet('Manually check out visitors who forgot to scan out');

heading2('4.2 Staff QR Scanner');
para('Access via /security/scan or the scanner icon in the sidebar navigation.');

heading3('How Badge Scanning Works');
numbered(1, 'Open the QR Scanner page on your device');
numbered(2, "Point the camera at a staff member's QR badge");
numbered(3, 'The system automatically processes the scan');
numbered(4, 'If the staff member is NOT inside \u2192 registers ENTRY with timestamp');
numbered(5, 'If the staff member IS inside \u2192 registers EXIT with duration calculated');
numbered(6, 'Every scan is logged with who performed it and when');

heading2('4.3 Incident Reporting');
para('Supervisors can create and manage incident reports for their assigned building directly from the Security Portal. New incidents are visible to admins and other supervisors immediately.');

// ============================================================
// SECTION 5: STAFF PORTAL
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('5. Staff / Guard Portal');

para('Access at: /staff/login');
para('The Staff Portal is the interface for security guards and ground staff to manage their shifts and complete their assigned tasks.');

heading2('5.1 Clock In / Out');
numbered(1, 'Log in with your email and password');
numbered(2, 'The portal shows your current status and a live clock');
numbered(3, 'Tap "Clock In" when starting your shift');
numbered(4, 'Tap "Clock Out" when ending your shift');
numbered(5, 'Your total hours are automatically calculated and recorded');

gap(4);
heading2('5.2 Attendance History');
para('View your complete attendance records:');
bullet('Date of each shift worked');
bullet('Exact clock-in and clock-out times');
bullet('Total hours worked per shift');

heading2('5.3 Patrol Rounds');
para('When you are assigned a patrol at your site:');
numbered(1, 'Navigate to the Patrol page from the portal');
numbered(2, 'Start a new patrol round');
numbered(3, 'Walk to each checkpoint (asset) in the building');
numbered(4, 'Scan the QR code mounted at each checkpoint');
numbered(5, 'The system records: which asset was scanned, the time, and condition');
numbered(6, 'After scanning ALL checkpoints, mark the patrol as complete');
numbered(7, 'Your supervisor can view your patrol completion status in real-time');

gap(4);
infoBox(
  'PATROL COMPLETION',
  'All checkpoint QR codes must be scanned before a patrol can be marked as complete. Missed checkpoints will be flagged in the accountability reports reviewed by supervisors.'
);

heading2('5.4 Staff QR Badge');
bullet('Your unique QR badge is visible within the Staff Portal');
bullet('Present this QR code to your supervisor for entry/exit scanning');
bullet('The QR code is generated automatically when your account is created');

// ============================================================
// SECTION 6: VISITOR CHECK-IN
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('6. Visitor Check-in System');

heading2('How Visitors Check In');
numbered(1, 'Visitor arrives at the building entrance');
numbered(2, 'They see the printed QR code displayed at the entrance');
numbered(3, 'They scan it with their smartphone camera \u2014 no app download required');
numbered(4, 'A check-in form opens in their mobile browser automatically');
numbered(5, 'They fill in: Full Name, Phone Number, ID Number, Purpose of Visit');
numbered(6, 'They tap "Check In" and receive a confirmation on screen');
numbered(7, 'The visitor immediately appears on the Security Dashboard');

gap(6);
heading2('How Visitors Check Out');
numbered(1, 'When leaving, the visitor scans the same QR code again');
numbered(2, 'The system recognises their device automatically via fingerprinting');
numbered(3, 'A "Check Out" option is displayed');
numbered(4, 'They tap "Check Out" \u2014 visit duration is calculated and recorded');

gap(6);
heading2('Important Notes');
bullet('No app download required \u2014 works in any smartphone browser');
bullet('ID numbers are encrypted at rest using AES encryption');
bullet('Device fingerprinting enables automatic recognition for seamless check-out');
bullet('If a visitor forgets to check out, security can close the visit manually from the dashboard');
bullet('All visits are logged with timestamps, IP addresses, and device info for full auditing');

// ============================================================
// SECTION 7: ROLES & PERMISSIONS
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('7. User Roles & Permissions');

para('The system enforces role-based access control (RBAC) to ensure each user only sees features and data relevant to their position and assigned site.');

gap(4);
const pw = [150, 50, 50, 65, 60, CONTENT_WIDTH - 375];
drawTable(
  ['Feature', 'Admin', 'Owner', 'Supervisor', 'Security', 'Staff'],
  [
    ['View all buildings', 'All', 'Own', 'Assigned', 'Assigned', 'Assigned'],
    ['Create buildings', 'Yes', 'Yes', '\u2014', '\u2014', '\u2014'],
    ['Create user accounts', 'Yes', 'Limited', '\u2014', '\u2014', '\u2014'],
    ['View visitors', 'All', 'Own sites', 'Own site', 'Own site', 'Own site'],
    ['Dashboard statistics', 'Yes', 'Own sites', '\u2014', '\u2014', '\u2014'],
    ['Operations centre', 'Yes', 'Yes', 'Yes', '\u2014', '\u2014'],
    ['Guard e-files', 'Full', 'Full', 'View', '\u2014', '\u2014'],
    ['Create incidents', 'Yes', 'Yes', 'Yes', '\u2014', '\u2014'],
    ['Manage assets', 'Yes', 'Yes', 'Yes', '\u2014', '\u2014'],
    ['Start patrols', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Manage vehicles', 'Yes', 'Yes', 'View', '\u2014', '\u2014'],
    ['Register weapons', 'Yes', '\u2014', '\u2014', '\u2014', '\u2014'],
    ['Issue / return weapons', 'Yes', 'Yes', 'Yes', '\u2014', '\u2014'],
    ['Scan staff QR badges', 'Yes', 'Yes', 'Yes', 'Yes', '\u2014'],
    ['Clock in / out', '\u2014', '\u2014', '\u2014', '\u2014', 'Yes'],
    ['Export reports (Excel)', 'Yes', 'Yes', 'Yes', '\u2014', '\u2014'],
    ['View login audit logs', 'Yes', '\u2014', '\u2014', '\u2014', '\u2014'],
    ['Reset user passwords', 'Yes', '\u2014', '\u2014', '\u2014', '\u2014'],
  ],
  pw
);

// ============================================================
// SECTION 8: SETTING UP A NEW SITE
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('8. Setting Up a New Site');

para('Follow this step-by-step checklist when onboarding a new client site:');

heading2('Step 1: Create the Building');
numbered(1, 'Log into the Admin Portal');
numbered(2, 'Navigate to Buildings > Add Building');
numbered(3, 'Enter the building name and full address');
numbered(4, 'Save \u2014 a unique QR code is generated automatically');

heading2('Step 2: Print & Install QR Codes');
bullet('Download the building QR code from the Buildings page');
bullet('Print on durable material (laminated A4 or A3 recommended)');
bullet('Install at: main entrance, reception desk, security booth, all visitor entry points');

heading2('Step 3: Create Staff Accounts');
numbered(1, 'Go to Staff Management in the Admin Portal');
numbered(2, 'Create a Supervisor account for the site manager');
numbered(3, 'Create Security accounts for guards who will operate the QR scanner');
numbered(4, 'Create Staff accounts for all guards assigned to the site');
numbered(5, 'Ensure every account is assigned to the correct building');

heading2('Step 4: Register Patrol Checkpoints');
bullet('Go to Assets and add each location guards must patrol');
bullet('Examples: fire extinguishers, emergency exits, stairwells, parking areas, perimeter gates');
bullet('Print asset QR codes and mount them at each physical location');

heading2('Step 5: Register Vehicles & Weapons (if applicable)');
bullet('Add company vehicles assigned to the site and assign drivers');
bullet('Register all weapons with serial numbers and details');
bullet('Set guard clearance statuses before issuing any weapons');

heading2('Step 6: Team Briefing');
bullet('Train supervisors on the Security Portal (15 minutes)');
bullet('Train guards on clocking in/out and completing patrols (10 minutes)');
bullet('Brief reception staff on the visitor check-in process');
bullet('Distribute login credentials securely (do not share via unencrypted channels)');

heading2('Step 7: Go-Live Verification');
bullet('Test QR code scanning on multiple mobile devices');
bullet('Run a complete visitor check-in and check-out cycle');
bullet('Test staff clock-in and clock-out');
bullet('Verify all data appears correctly on the Admin Dashboard');
bullet('Test a patrol round with checkpoint scanning');

// ============================================================
// SECTION 9: DAILY OPERATIONS
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('9. Daily Operations Guide');

heading2('Morning Routine');
numbered(1, 'Site Supervisor logs into the Security Portal');
numbered(2, 'Reviews any overnight or pending incidents');
numbered(3, 'Checks which guards have clocked in for their shift');
numbered(4, 'Verifies the visitor dashboard is operational');

gap(4);
heading2('During the Day');
drawTable(
  ['Action', 'Performed By', 'How'],
  [
    ['Visitor arrives', 'Visitor', 'Scans QR code at entrance, fills check-in form'],
    ['Monitor visitors', 'Supervisor', 'Watches the Security Dashboard in real-time'],
    ['Guard shift start', 'Guard', 'Opens Staff Portal, taps "Clock In"'],
    ['Guard patrol', 'Guard', 'Walks route, scans QR at each checkpoint'],
    ['Staff entry logging', 'Security', "Scans guard's QR badge at the gate"],
    ['Incident occurs', 'Supervisor', 'Logs incident via Operations portal'],
    ['Weapon issue', 'Supervisor', 'Issues weapon via Weapons page, records condition'],
    ['Visitor leaves', 'Visitor', 'Scans QR code again, taps "Check Out"'],
    ['Guard shift end', 'Guard', 'Taps "Clock Out" in Staff Portal'],
    ['Weapon return', 'Supervisor', 'Records return with condition notes'],
  ],
  [120, 100, CONTENT_WIDTH - 220]
);

heading2('End-of-Day Checklist');
bullet('Verify all visitors have been checked out (manually close any remaining)');
bullet('Confirm all guards have clocked out');
bullet('Ensure all issued weapons have been returned and logged');
bullet('Review and update any open incident reports');
bullet('Check patrol completion reports for the day');

gap(4);
heading2('Weekly / Monthly Admin Tasks');
bullet('Export attendance and visitor reports to Excel for records');
bullet('Review patrol accountability reports (guard completion rates)');
bullet('Update guard e-files: clearances, expiring documents, new certifications');
bullet('Review and close resolved incidents; analyse trends');
bullet('Add new hires and deactivate accounts for departed staff');

// ============================================================
// SECTION 10: REPORTING
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('10. Reporting & Exports');

heading2('Available Excel Exports');
drawTable(
  ['Report', 'Format', 'Key Data Included'],
  [
    ['Visitor Log', 'Excel (.xlsx)', 'Name, phone, ID, purpose, site, check-in/out, duration, status'],
    ['Staff Attendance', 'Excel (.xlsx)', 'Staff name, email, site, work date, clock in/out, total hours'],
    ['Guard Log Sheet', 'Excel (.xlsx)', 'Guard name, site, first/last clock-in, days worked (30 days)'],
    ['Login Activity', 'Excel (.xlsx)', 'Name, email, role, login time, IP address, login status'],
  ],
  [120, 80, CONTENT_WIDTH - 200]
);

heading2('How to Export');
numbered(1, 'Go to Reports in the Admin Portal sidebar');
numbered(2, 'Select the type of report you need');
numbered(3, 'Set your filters: date range, building, status');
numbered(4, 'Click the "Export to Excel" button');
numbered(5, 'The .xlsx file downloads automatically to your device');

gap(4);
heading2('Patrol Accountability Reports');
para('The patrol reporting system provides detailed guard performance data:');
bullet('Completion rates per guard over any selected date range');
bullet('Side-by-side comparison of assigned patrols vs completed patrols');
bullet('Individual guard patrol logs with checkpoint timestamps');
bullet('Missed patrol reports identifying guards who did not complete their rounds');

heading2('Dashboard Analytics');
bullet('Visitor trend charts showing daily counts over the past 7 days');
bullet('Real-time operational statistics across all managed sites');
bullet('Activity feeds showing the most recent system events');

// ============================================================
// SECTION 11: TROUBLESHOOTING
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('11. Troubleshooting');

heading3('Page loads slowly or shows "Cannot connect to server"');
bullet('The backend may be sleeping after 15 minutes of inactivity (free hosting tier)');
bullet('The first request after sleep takes 30\u201360 seconds to wake up');
bullet('Simply refresh the page and wait for it to load');
bullet('For production, consider upgrading to paid hosting for always-on performance');

gap(3);
heading3('"Invalid credentials" error at login');
bullet('Double-check your email and password \u2014 both are case-sensitive');
bullet('Ask your administrator to reset your password if forgotten');
bullet('Verify your account has not been deactivated');

gap(3);
heading3('Visitor QR code not scanning');
bullet('Ensure the printed QR code is clean, well-lit, and undamaged');
bullet("Visitors should use their phone's built-in camera app, not a third-party scanner");
bullet('Check that the building is still active in the system');
bullet('If compromised, regenerate the QR code from the Buildings page');

gap(3);
heading3('Staff QR badge not scanning');
bullet('Increase screen brightness on the phone displaying the badge');
bullet('Grant camera permission when the browser prompts for it');
bullet("Verify the staff member's account is still active");

gap(3);
heading3('Cannot issue a weapon to a guard');
bullet('The guard must have clearance status set to "Cleared" in their e-file');
bullet('Update clearance in Guard Files before attempting to issue');

gap(3);
heading3('Patrol will not complete');
bullet('All registered checkpoint assets must be scanned before completing');
bullet('Open the patrol detail view to see which checkpoints remain');

gap(3);
heading3('Excel export downloads empty');
bullet('Check that your date range filters actually include data');
bullet('Verify records exist for the selected building and time period');

// ============================================================
// SECTION 12: SECURITY
// ============================================================

doc.addPage();
setY(TOP_START);
heading1('12. Security & Data Protection');

heading2('How Your Data is Protected');
drawTable(
  ['Security Feature', 'Description'],
  [
    ['Password Hashing', 'All passwords hashed with bcrypt \u2014 irreversible, even by admins'],
    ['Data Encryption', 'Visitor ID numbers encrypted with AES-256 before database storage'],
    ['HTTPS / TLS', 'All data transmitted over encrypted HTTPS connections'],
    ['JWT Tokens', 'Login sessions expire after 24 hours, requiring re-authentication'],
    ['Rate Limiting', '100 API requests per 15 minutes per IP address (abuse prevention)'],
    ['IP Logging', 'Every login attempt logged with IP address and device information'],
    ['Role-Based Access', 'Users only see data relevant to their role and assigned building'],
    ['Full Audit Trail', 'Weapon transactions, login events, and visit records fully tracked'],
  ],
  [140, CONTENT_WIDTH - 140]
);

heading2('Security Best Practices');
numbered(1, 'Change default passwords immediately after any account is created');
numbered(2, 'Use strong passwords \u2014 at least 8 characters mixing uppercase, lowercase, numbers, and symbols');
numbered(3, 'Never share login credentials \u2014 every user must have their own account');
numbered(4, 'Deactivate accounts promptly when any staff member leaves the company');
numbered(5, 'Review login audit logs regularly for suspicious or failed login activity');
numbered(6, 'Keep building QR codes secure \u2014 regenerate immediately if compromised');
numbered(7, 'Export and back up critical data periodically for disaster recovery');

gap(6);
heading2('Data Retention');
bullet('All visitor records, attendance data, and incident reports are stored indefinitely');
bullet('Deactivated user accounts are preserved for historical reporting but cannot log in');
bullet('The system does not automatically delete any operational data');
bullet('Contact your system administrator for any data deletion or privacy requests');

// ============================================================
// BACK COVER
// ============================================================

doc.addPage();

// Subtle background
doc.rect(0, 0, 595.28, 841.89).fill('#fafafa');

// Gold bar at top
doc.rect(0, 0, 595.28, 5).fill(COLORS.gold);
doc.rect(0, 841.89 - 5, 595.28, 5).fill(COLORS.gold);

const midY = 841.89 / 2;

// Small gold circle
doc.circle(cx, midY - 100, 30).fill(COLORS.gold);
doc.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.black);
doc.text('CS', cx - 16, midY - 113, { lineBreak: false });

doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.gold);
doc.text('CHERUBIM SECURITY', 0, midY - 50, { align: 'center', width: 595.28 });

doc.font('Helvetica').fontSize(11).fillColor(COLORS.darkGray);
doc.text('Management System  \u2014  Version 2.0', 0, midY - 22, { align: 'center', width: 595.28 });

doc.save();
doc.moveTo(cx - 60, midY + 5).lineTo(cx + 60, midY + 5)
  .strokeColor(COLORS.gold).lineWidth(1).stroke();
doc.restore();

doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.midGray);
doc.text('For support, contact your system administrator', 0, midY + 25, { align: 'center', width: 595.28 });
doc.text('or the Cherubim Security operations team.', 0, midY + 40, { align: 'center', width: 595.28 });

doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray);
doc.text('This document is confidential and intended for authorised Cherubim Security personnel only.', 0, midY + 80, { align: 'center', width: 595.28 });
doc.text('Unauthorised distribution or reproduction is strictly prohibited.', 0, midY + 94, { align: 'center', width: 595.28 });

doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.gold);
doc.text('Cherubim Security (Pvt) Ltd', 0, midY + 140, { align: 'center', width: 595.28 });
doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray);
doc.text('August 2026', 0, midY + 156, { align: 'center', width: 595.28 });

// ============================================================
// ADD HEADERS & FOOTERS TO ALL PAGES (using buffered pages)
// ============================================================

const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);

  // Skip cover page (page 0) for headers/footers
  if (i === 0) continue;

  // Header: gold line at very top
  doc.save();
  doc.rect(0, 0, 595.28, 3).fill(COLORS.gold);
  doc.restore();

  // Header: brand text (skip TOC page too for cleanliness)
  if (i > 1) {
    doc.fontSize(7).fillColor(COLORS.gray).font('Helvetica');
    doc.text('CHERUBIM SECURITY MANAGEMENT SYSTEM', 300, 10, {
      width: 240, align: 'right', lineBreak: false
    });
  }

  // Footer
  const footY = 841.89 - 35;
  doc.fontSize(7.5).fillColor(COLORS.gray).font('Helvetica');
  doc.text(`Page ${i + 1} of ${totalPages}`, 0, footY, {
    align: 'center', width: 595.28
  });

  // Skip back cover for the confidential footer
  if (i < totalPages - 1) {
    doc.fontSize(7).fillColor(COLORS.gold).font('Helvetica');
    doc.text('Cherubim Security (Pvt) Ltd  \u2014  Confidential', LEFT, footY, {
      lineBreak: false
    });
  }
}

// Finalize
doc.end();

stream.on('finish', () => {
  const size = fs.statSync(outputPath).size;
  console.log('');
  console.log('  ========================================');
  console.log('   Cherubim Security - PDF Generated');
  console.log('  ========================================');
  console.log(`   File:  ${outputPath}`);
  console.log(`   Pages: ${totalPages}`);
  console.log(`   Size:  ${(size / 1024).toFixed(1)} KB`);
  console.log('  ========================================');
  console.log('');
});
