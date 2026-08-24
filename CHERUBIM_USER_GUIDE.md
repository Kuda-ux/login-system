# Cherubim Security Management System
# Complete User Guide

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started](#2-getting-started)
3. [Admin Portal](#3-admin-portal)
4. [Security/Supervisor Portal](#4-securitysupervisor-portal)
5. [Staff/Guard Portal](#5-staffguard-portal)
6. [Visitor Check-in System](#6-visitor-check-in-system)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Setting Up a New Site](#8-setting-up-a-new-site)
9. [Daily Operations Guide](#9-daily-operations-guide)
10. [Reporting & Exports](#10-reporting--exports)
11. [Troubleshooting](#11-troubleshooting)
12. [Security & Data Protection](#12-security--data-protection)

---

## 1. System Overview

The Cherubim Security Management System is a web-based platform that manages all aspects of security operations across your client sites. It consists of four portals, each designed for a different type of user:

| Portal | Who Uses It | What It Does |
|--------|-------------|--------------|
| **Admin Portal** | Operations managers, company directors | Full system control - manage sites, staff, reports, everything |
| **Security Portal** | Site supervisors, security control room | Monitor visitors, scan staff badges, manage incidents |
| **Staff Portal** | Security guards, ground staff | Clock in/out, view shifts, complete patrols |
| **Visitor Check-in** | Building visitors (public) | Self-service check-in/out via QR code at entrances |

### System URLs

| Page | URL |
|------|-----|
| Landing Page | `https://your-domain.vercel.app/` |
| Admin Login | `https://your-domain.vercel.app/admin/login` |
| Security Login | `https://your-domain.vercel.app/security/login` |
| Staff Login | `https://your-domain.vercel.app/staff/login` |
| Visitor Check-in | `https://your-domain.vercel.app/checkin/<building-id>` |

---

## 2. Getting Started

### First-Time Login

1. Open your browser and go to the **Admin Login** page
2. Enter the administrator credentials provided to you
3. After first login, immediately go to **Settings > Change Password** to set your own secure password

### Recommended First Steps

1. **Change the admin password** (Settings page)
2. **Create your buildings/sites** (Buildings page)
3. **Print QR codes** for each building entrance
4. **Create supervisor accounts** for your site managers
5. **Create guard accounts** and assign them to buildings
6. **Brief your team** on how to use the system

---

## 3. Admin Portal

The Admin Portal is the command centre of the entire system. After logging in at `/admin/login`, you'll see the dashboard with a sidebar navigation.

### 3.1 Dashboard

The dashboard provides an at-a-glance overview of your operations:

- **Total Buildings** - Number of active sites
- **Total Staff** - All registered staff members
- **Today's Visitors** - Visitors checked in today across all sites
- **Active Visitors** - Currently inside your buildings
- **Open Incidents** - Unresolved incident reports
- **Active Patrols** - Patrols currently in progress
- **Guards on Duty** - Staff currently clocked in

Charts show visitor trends and activity over time.

### 3.2 Buildings

Manage all your client sites from one place.

**Adding a Building:**
1. Click **"Add Building"**
2. Enter the building name (e.g., "First Mutual Tower")
3. Enter the address
4. Click **Save**
5. The system automatically generates a unique **QR code** for visitor check-in

**Building QR Code:**
- Each building gets a unique QR code that visitors scan at the entrance
- Download or print the QR code and display it prominently at all entry points
- If the QR code is compromised, use **"Regenerate QR"** to create a new one

### 3.3 Staff Management

Create and manage user accounts for your entire team.

**Creating a New Staff Member:**
1. Go to **Staff** in the sidebar
2. Click **"Add Staff"**
3. Fill in:
   - **Full Name** - Staff member's full name
   - **Email** - Their login email (must be unique)
   - **Password** - Initial password (they should change it after first login)
   - **Phone** - Contact number
   - **Role** - Select from: Staff (guard), Security (guard with scanner access), Supervisor, or Owner
   - **Building** - Assign them to a specific site
4. Click **Save**

**Roles Explained:**

| Role | What They Can Do |
|------|------------------|
| **Staff** | Clock in/out, view own attendance, complete patrols |
| **Security** | Everything Staff can do + scan staff badges + view incidents |
| **Supervisor** | Everything Security can do + manage operations, guards, incidents, weapons |
| **Owner** | Like Admin but limited to their own buildings |

**Resetting a Password:**
- Click the key icon next to any staff member
- Enter a new password (minimum 6 characters)
- Inform the staff member of their new password

**Deactivating a Staff Member:**
- Click the delete icon next to the staff member
- This deactivates their account (they can no longer log in)
- Their historical data (attendance, patrols) is preserved

### 3.4 Visitors

View all visitor records across all your sites.

- **Filter by date** to view specific days
- **Filter by status** (checked in / checked out)
- **Search** by visitor name, phone, or purpose
- View full details including check-in/out times and duration
- Visitor ID numbers are encrypted in the database and decrypted only when viewed by authorised users

### 3.5 Operations

The operations centre for managing day-to-day security functions.

**Overview Cards:**
- Guards on duty
- Open incidents
- Incomplete patrols
- Active visitors

**Tabs:**

**Guard Management** - View all guards, their clearance status, and assigned sites. Click on a guard to view their e-file.

**Patrol Rounds** - View all patrols (in-progress and completed). See which checkpoints were scanned and patrol completion rates.

**Incident Reports** - Log and track security incidents. Each incident has:
- Title and description
- Category and severity (low/medium/high/critical)
- Status tracking (open > under review > resolved > closed)
- Resolution notes

### 3.6 Guard Files (E-Files)

Maintain comprehensive personnel files for each guard:

- **Employee Number**
- **Date of Birth**
- **Address**
- **Emergency Contact**
- **Clearance Status** (Not Cleared / Cleared / Suspended)
- **Profile Photo**
- **Documents** (ID copies, certifications, contracts, etc.)

Clearance status is important: guards must be marked as **"Cleared"** before they can be issued weapons.

### 3.7 Incidents

Full incident reporting system:

**Creating an Incident:**
1. Click **"New Incident"**
2. Select the **site** where it occurred
3. Enter **title** and **description**
4. Set **category** and **severity**
5. Record **date/time** of occurrence
6. Note any **people involved** and **actions taken**
7. Click **Submit**

**Managing Incidents:**
- Update status as investigation progresses
- Add resolution notes when closing
- Filter by site, status, or date

### 3.8 Assets

Register physical assets at each site for patrol verification:

**Adding an Asset:**
1. Click **"Add Asset"**
2. Select the **building**
3. Enter **asset name** (e.g., "Fire Extinguisher - Ground Floor")
4. Enter a unique **asset code** (e.g., "FE-GF-001")
5. Set category and location
6. Click **Save**

Assets become **patrol checkpoints** - guards scan asset QR codes during their rounds to prove they physically visited each location.

### 3.9 Vehicles

Track company vehicles across your operations:

- **Register vehicles** with registration number, make, model, and colour
- **Assign drivers** to vehicles
- **Track locations** with GPS coordinates
- **View on map** for real-time fleet visibility

### 3.10 Weapons

Manage the entire weapon lifecycle:

**Registering a Weapon:**
1. Click **"Add Weapon"**
2. Enter **serial number** (must be unique)
3. Select **weapon type**
4. Enter make, model, caliber
5. Assign to a building
6. Click **Save**

**Issuing a Weapon:**
1. Select the weapon from the list
2. Click **"Issue"**
3. Select the guard to receive it
4. The guard must have **"Cleared"** clearance status
5. Record condition notes
6. Click **Confirm Issue**

**Returning a Weapon:**
1. Select the issued weapon
2. Click **"Return"**
3. Record condition on return
4. Click **Confirm Return**

All issue/return transactions are logged with who performed the action and when.

### 3.11 Reports

Generate reports and export data:

- **Visitor Reports** - Visitor logs by date range and site
- **Attendance Reports** - Staff attendance with hours worked
- **Guard Log Sheets** - 30-day attendance analysis per guard
- **Login Activity** - Who logged into the system and when
- **Patrol Reports** - Patrol completion rates and accountability

All reports can be **exported to Excel** (.xlsx format).

### 3.12 Settings

- **Profile** - Update your name and phone number
- **Change Password** - Update your login password
- **System Info** - View system version and status

---

## 4. Security/Supervisor Portal

Access at: `/security/login`

The Security Portal is designed for site supervisors and control room operators.

### 4.1 Dashboard

After logging in, the dashboard shows:

**Staff Tab:**
- All staff currently inside the building
- Staff who have exited
- Entry/exit times and durations

**Visitors Tab:**
- All visitors currently checked in
- Today's visitor log
- Ability to manually check out visitors who forgot

### 4.2 Staff QR Scanner

Access via `/security/scan` or the scanner icon in the sidebar.

**How it Works:**
1. Open the QR Scanner page
2. Point the camera at a staff member's QR badge
3. The system automatically:
   - **Registers entry** if the staff member is not inside
   - **Registers exit** if the staff member is inside
4. Entry/exit time is logged with who performed the scan

### 4.3 Incident Reports

Supervisors can create and manage incident reports for their assigned building.

---

## 5. Staff/Guard Portal

Access at: `/staff/login`

### 5.1 Clock In/Out

1. Log in with your email and password
2. The portal shows your current status and a live clock
3. Tap **"Clock In"** when starting your shift
4. Tap **"Clock Out"** when ending your shift
5. Your hours are automatically calculated

### 5.2 Attendance History

View your past attendance records:
- Date of each shift
- Clock in and clock out times
- Total hours worked

### 5.3 Patrol Rounds

When assigned a patrol:

1. Go to the **Patrol** page (`/patrol`)
2. Start a new patrol round
3. Walk to each checkpoint (asset) in the building
4. Scan the QR code on each asset
5. The system records:
   - Which asset was scanned
   - What time it was scanned
   - The condition status
6. After scanning all checkpoints, complete the patrol
7. Supervisors can see your patrol completion status

### 5.4 Staff QR Badge

- View your unique QR badge in the portal
- Your supervisor scans this badge to log your entry/exit
- The QR code is generated automatically when your account is created

---

## 6. Visitor Check-in System

### How Visitors Check In

1. Visitor arrives at the building entrance
2. They see the QR code displayed at the entrance
3. They scan it with their smartphone camera
4. A check-in form opens in their browser (no app needed)
5. They fill in:
   - Full Name
   - Phone Number
   - ID Number (National ID or Passport)
   - Purpose of Visit
6. They tap **"Check In"**
7. Confirmation is shown on their screen
8. The visitor immediately appears on the Security Dashboard

### How Visitors Check Out

1. When leaving, the visitor scans the same QR code again
2. The system recognises their device
3. It shows a **"Check Out"** option
4. They tap **"Check Out"** and their visit is complete
5. Duration is automatically calculated

### Important Notes

- **No app download required** - works in any smartphone browser
- **ID numbers are encrypted** - stored securely, not visible in plain text
- **Device fingerprinting** allows automatic recognition for check-out
- If a visitor doesn't check out, security can manually close their visit from the dashboard

---

## 7. User Roles & Permissions

| Feature | Admin | Owner | Supervisor | Security | Staff |
|---------|:-----:|:-----:|:----------:|:--------:|:-----:|
| View all buildings | Yes | Own only | Assigned only | Assigned only | Assigned only |
| Create buildings | Yes | Yes | No | No | No |
| Create user accounts | Yes | Yes (limited) | No | No | No |
| View all visitors | Yes | Own buildings | Own building | Own building | Own building |
| View dashboard stats | Yes | Own buildings | No | No | No |
| Manage operations | Yes | Yes | Yes | No | No |
| Manage guard files | Yes | Yes | View only | No | No |
| Create incidents | Yes | Yes | Yes | No | No |
| Manage assets | Yes | Yes | Yes | No | No |
| Start patrols | Yes | Yes | Yes | Yes | Yes |
| Manage vehicles | Yes | Yes | View only | No | No |
| Manage weapons | Yes | No | Issue/Return | No | No |
| Register weapons | Yes | No | No | No | No |
| Scan staff QR badges | Yes | Yes | Yes | Yes | No |
| Clock in/out | No | No | No | No | Yes |
| View own attendance | No | No | No | No | Yes |
| Export reports | Yes | Yes | Yes | No | No |
| Change own password | Yes | Yes | Yes | Yes | Yes |
| View login logs | Yes | No | No | No | No |
| Reset user passwords | Yes | No | No | No | No |

---

## 8. Setting Up a New Site

Follow this checklist when onboarding a new client site:

### Step 1: Create the Building
1. Log into Admin Portal
2. Go to **Buildings > Add Building**
3. Enter the building name and address
4. Save - a QR code is automatically generated

### Step 2: Print and Install QR Codes
1. Download the building QR code
2. Print on durable material (laminated A4 or A3)
3. Mount at:
   - Main entrance / reception desk
   - Security booth / guard post
   - Any additional entry points

### Step 3: Create Staff Accounts
1. Go to **Staff Management**
2. Create a **Supervisor** account for the site manager
3. Create **Security** accounts for guards who will scan badges
4. Create **Staff** accounts for all guards assigned to the site
5. Assign all accounts to the correct building

### Step 4: Register Assets (For Patrol Verification)
1. Go to **Assets**
2. Add each checkpoint where guards should patrol
3. Examples: fire extinguishers, emergency exits, stairwells, parking areas
4. Print asset QR codes and mount them at each location

### Step 5: Register Vehicles (If applicable)
1. Go to **Vehicles**
2. Add company vehicles assigned to this site
3. Assign drivers

### Step 6: Register Weapons (If applicable)
1. Go to **Weapons**
2. Register each weapon with serial number and details
3. Ensure guards have "Cleared" clearance status before issuing

### Step 7: Brief Your Team
- Show supervisors how to use the Security Portal
- Show guards how to clock in/out and complete patrols
- Explain the visitor check-in system
- Distribute login credentials securely

### Step 8: Go Live
- Verify QR codes are scanning correctly
- Test a visitor check-in/check-out cycle
- Test staff clock in/out
- Confirm data appears on the admin dashboard

---

## 9. Daily Operations Guide

### Morning Routine

1. **Site Supervisor** logs into the Security Portal
2. Reviews any overnight incidents
3. Checks which guards have clocked in
4. Verifies visitor dashboard is working

### During the Day

| Action | Who Does It | How |
|--------|-------------|-----|
| Visitor arrives | Visitor | Scans QR code at entrance, fills check-in form |
| Monitor visitors | Supervisor / Security | Watches Security Dashboard for real-time updates |
| Guard shift start | Guard | Logs into Staff Portal, taps "Clock In" |
| Guard patrol | Guard | Goes to Patrol page, scans QR at each checkpoint |
| Staff entry logging | Security | Scans guard's QR badge at gate |
| Incident occurs | Supervisor | Logs incident via Operations or Security portal |
| Weapon issue | Supervisor | Issues weapon via Weapons page, records condition |
| Visitor leaves | Visitor | Scans QR code again, taps "Check Out" |
| Guard shift end | Guard | Taps "Clock Out" in Staff Portal |
| Weapon return | Supervisor | Records weapon return with condition notes |

### End of Day

1. Check all visitors have been checked out (manually check out any remaining)
2. Verify all guards have clocked out
3. Ensure all weapons have been returned
4. Review and update any open incidents
5. Check patrol completion reports

### Weekly/Monthly Admin Tasks

- **Review Reports** - Export attendance and visitor data
- **Patrol Accountability** - Check which guards completed their rounds
- **Guard Files** - Update clearance statuses, add new documents
- **Incident Review** - Close resolved incidents, review trends
- **Update Staff** - Add new hires, deactivate departed staff

---

## 10. Reporting & Exports

### Available Reports

| Report | Format | Includes |
|--------|--------|----------|
| **Visitor Log** | Excel (.xlsx) | Name, phone, ID, purpose, site, check-in/out times, duration, status |
| **Staff Attendance** | Excel (.xlsx) | Staff name, email, phone, site, work date, clock in/out, total hours |
| **Guard Log Sheet** | Excel (.xlsx) | Guard name, site, first/last clock-in, days worked (30 days), attendance status |
| **Login Activity** | Excel (.xlsx) | Name, email, role, login time, IP address, status (success/failed) |

### How to Export

1. Go to **Reports** in the Admin Portal
2. Select the report type
3. Set your filters (date range, building, etc.)
4. Click **"Export to Excel"**
5. The file downloads automatically

### Dashboard Charts

- **Visitor Trends** - Daily visitor counts over the past 7 days
- **Revenue Chart** - Monthly revenue over the past 6 months (if using payments)

---

## 11. Troubleshooting

### Common Issues

**"Cannot connect to server" or blank pages**
- The backend server may be sleeping (free tier wakes up after 30-60 seconds)
- Refresh the page and wait for it to load
- Check your internet connection

**"Invalid credentials" at login**
- Double-check email and password (case-sensitive)
- Ask your admin to reset your password if forgotten
- Ensure your account has not been deactivated

**QR code not scanning for visitors**
- Ensure the QR code is clearly printed and not damaged
- Visitor should use their phone's built-in camera app
- Check that the building is still active in the system
- If compromised, regenerate the QR code from Buildings page

**Staff QR badge not scanning**
- Ensure brightness is high on the phone displaying the QR code
- The scanner needs camera permission - allow it when prompted
- Check that the staff member's account is active

**Visitor shows as "still inside" but has left**
- Security can manually check them out from the Security Dashboard
- Click on the visitor and select "Check Out"

**Guard patrol won't complete**
- All checkpoint assets must be scanned before completing
- Check which checkpoints are remaining in the patrol detail view

**Cannot issue weapon to guard**
- Guard must have clearance status set to **"Cleared"**
- Update their clearance in Guard Files before issuing

**Excel export is empty**
- Check your date range filters
- Ensure there is data for the selected period and building

### System Performance

- The backend runs on Render's free tier which sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Subsequent requests are fast
- For production use, consider upgrading to a paid Render plan for always-on service
- Alternatively, use UptimeRobot to ping the server every 5 minutes to keep it awake

---

## 12. Security & Data Protection

### How Your Data is Protected

| Feature | Description |
|---------|-------------|
| **Password Security** | All passwords are hashed with bcrypt (industry standard) - even admins cannot see passwords |
| **Data Encryption** | Visitor ID numbers are encrypted with AES before storage |
| **Secure Connections** | All data transmitted over HTTPS (SSL/TLS encryption) |
| **JWT Authentication** | Login tokens expire after 24 hours, requiring re-authentication |
| **Rate Limiting** | Maximum 100 API requests per 15 minutes per IP to prevent abuse |
| **IP Logging** | All login attempts logged with IP address and device information |
| **Role-Based Access** | Users can only see data relevant to their role and assigned building |
| **Audit Trail** | Weapon transactions, login events, and visitor records are fully tracked |

### Security Best Practices

1. **Change default passwords immediately** after account creation
2. **Use strong passwords** - minimum 8 characters with letters, numbers, and symbols
3. **Do not share credentials** - each user should have their own account
4. **Deactivate accounts promptly** when staff members leave the company
5. **Review login logs regularly** for suspicious activity
6. **Keep QR codes secure** - regenerate if compromised
7. **Export and backup data** periodically for safekeeping

### Data Retention

- All visitor records, attendance data, and incident reports are stored indefinitely
- Deactivated user accounts are retained for historical records but cannot log in
- The system does not automatically delete any data

---

## Appendix: API Reference

For technical integrations, the system provides a REST API at your backend URL.

### Base URL
```
https://your-backend.onrender.com/api
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/auth/me` | GET | Current user profile |
| `/buildings` | GET/POST | Building management |
| `/visitors/check-in` | POST | Visitor check-in (public) |
| `/visitors/check-out` | POST | Visitor check-out (public) |
| `/staff/clock-in` | POST | Staff clock in |
| `/staff/clock-out` | POST | Staff clock out |
| `/staff/scan` | POST | Scan staff QR badge |
| `/operations/incidents` | GET/POST | Incident management |
| `/operations/patrols` | GET/POST | Patrol management |
| `/operations/assets` | GET/POST | Asset management |
| `/vehicles` | GET/POST | Vehicle management |
| `/weapons` | GET/POST | Weapon management |
| `/dashboard/stats` | GET | Dashboard statistics |
| `/exports/visitors` | GET | Export visitor log |
| `/exports/staff-attendance` | GET | Export attendance |
| `/health` | GET | System health check |

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

---

**System Version:** 2.0 - Cherubim Security Edition
**Last Updated:** August 2026

*Cherubim Security (Pvt) Ltd - Professional Security Management*
