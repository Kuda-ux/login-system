# Building Management System - Complete Workflow Guide

## 🏢 System Overview

BuildingMS is a complete **Building Access Platform** with 4 distinct interfaces designed for different user roles. The system works offline-first and syncs automatically when internet is restored.

---

## 🔄 How The System Works In Real Life

### Step 1: Initial Setup (Admin)

1. **Admin logs into** → `http://localhost:3000/admin/login`
   - Default credentials: `admin@buildingms.com` / `admin123`

2. **Admin creates a building**
   - Navigate to Buildings → Add Building
   - Enter building name, address, and details
   - System generates a unique **QR Code** for the building

3. **Admin creates user accounts**
   - Create **Owner** accounts (can manage their buildings)
   - Create **Security** accounts (for guards)
   - Create **Staff** accounts (for employees)

4. **Admin prints the QR code**
   - Download the building QR code
   - Print and mount at building entrance

---

### Step 2: Daily Operations

#### 🚶 Visitor Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISITOR JOURNEY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ARRIVAL                                                     │
│     ┌──────────┐                                                │
│     │ QR Code  │  ← Visitor scans with phone camera            │
│     │ at Door  │                                                │
│     └────┬─────┘                                                │
│          │                                                      │
│          ▼                                                      │
│  2. CHECK-IN FORM (Mobile Web - No App Needed)                  │
│     ┌──────────────────────────────────┐                        │
│     │  • Full Name                     │                        │
│     │  • Phone Number                  │                        │
│     │  • ID Number (encrypted)         │                        │
│     │  • Purpose of Visit              │                        │
│     └────────────┬─────────────────────┘                        │
│                  │                                              │
│                  ▼                                              │
│  3. SYSTEM AUTOMATICALLY CAPTURES                               │
│     • Device fingerprint                                        │
│     • IP address                                                │
│     • Timestamp                                                 │
│                  │                                              │
│                  ▼                                              │
│  4. VISITOR ENTERS BUILDING                                     │
│     (Security can see them in real-time dashboard)              │
│                  │                                              │
│                  ▼                                              │
│  5. DEPARTURE - Visitor scans QR again                          │
│     System recognizes device → Instant checkout                 │
│     (No form needed - automatic)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🛡️ Security Guard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOGIN                                                       │
│     Guard opens → security.yourbuilding.com                     │
│     (or localhost:3000/security/login)                          │
│                                                                 │
│  2. DASHBOARD VIEW                                              │
│     ┌──────────────────────────────────────────────┐            │
│     │  Currently Inside: 12 visitors               │            │
│     │  Checked Out Today: 45                       │            │
│     │  Total Today: 57                             │            │
│     └──────────────────────────────────────────────┘            │
│                                                                 │
│  3. REAL-TIME VISITOR LIST                                      │
│     • See all visitors currently inside                         │
│     • Search by name, phone, or purpose                         │
│     • Manual checkout if visitor forgets                        │
│                                                                 │
│  4. STAFF BADGE SCANNING (Optional)                             │
│     • Scan staff QR badges                                      │
│     • System logs attendance automatically                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 👷 Staff Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        STAFF WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOGIN                                                       │
│     Staff opens → staff.yourbuilding.com                        │
│     (or localhost:3000/staff/login)                             │
│                                                                 │
│  2. CLOCK IN                                                    │
│     ┌──────────────────────────────────────────────┐            │
│     │  📍 Current Time: 08:00 AM                   │            │
│     │                                              │            │
│     │  ┌────────────────────────────────────┐      │            │
│     │  │        🟢 CLOCK IN                 │      │            │
│     │  └────────────────────────────────────┘      │            │
│     └──────────────────────────────────────────────┘            │
│                                                                 │
│  3. WORKING (Timer Running)                                     │
│     • See elapsed time                                          │
│     • View today's status                                       │
│                                                                 │
│  4. CLOCK OUT                                                   │
│     • Press Clock Out button                                    │
│     • System calculates total hours                             │
│                                                                 │
│  5. VIEW HISTORY                                                │
│     • See past attendance records                               │
│     • Total hours per day/week/month                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🏠 Admin/Owner Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUILDINGS                                                      │
│  ├── Add new buildings                                          │
│  ├── Generate QR codes                                          │
│  ├── View building stats                                        │
│  └── Manage building settings                                   │
│                                                                 │
│  VISITORS                                                       │
│  ├── View all visitor logs                                      │
│  ├── Filter by date/building                                    │
│  ├── Export reports                                             │
│  └── Search visitor history                                     │
│                                                                 │
│  TENANTS                                                        │
│  ├── Add/manage tenants                                         │
│  ├── Assign to units                                            │
│  ├── View payment status                                        │
│  └── Generate rent QR codes                                     │
│                                                                 │
│  PAYMENTS                                                       │
│  ├── View all payments                                          │
│  ├── Record manual payments                                     │
│  ├── Generate payment QR codes                                  │
│  └── Payment reports                                            │
│                                                                 │
│  STAFF                                                          │
│  ├── View attendance records                                    │
│  ├── Manage staff accounts                                      │
│  └── Generate attendance reports                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 URL Structure

| Interface | URL | Purpose |
|-----------|-----|---------|
| Landing Page | `/` | Portal selection hub |
| Visitor Check-In | `/checkin/:buildingId` | Public visitor registration |
| Security Login | `/security/login` | Guard authentication |
| Security Dashboard | `/security` | Real-time visitor monitoring |
| Staff Login | `/staff/login` | Staff authentication |
| Staff Portal | `/staff` | Clock in/out, attendance |
| Admin Login | `/admin/login` | Admin authentication |
| Admin Dashboard | `/admin` | Full management access |

---

## 📱 Deployment for Real Buildings

### Option A: Single Building

```
yourbuilding.com/           → Landing page
yourbuilding.com/checkin/1  → Visitor check-in (QR points here)
yourbuilding.com/security   → Security portal
yourbuilding.com/staff      → Staff portal
yourbuilding.com/admin      → Admin dashboard
```

### Option B: Multi-Tenant SaaS

```
buildingA.buildingms.co.zw  → Building A
buildingB.buildingms.co.zw  → Building B
admin.buildingms.co.zw      → Super admin
```

---

## 🔌 Offline Functionality

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHEN ONLINE:                                                   │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │  User   │ ──► │   API   │ ──► │   DB    │                   │
│  │ Action  │     │ Server  │     │ SQLite  │                   │
│  └─────────┘     └─────────┘     └─────────┘                   │
│                                                                 │
│  WHEN OFFLINE:                                                  │
│  ┌─────────┐     ┌─────────────┐                               │
│  │  User   │ ──► │  IndexedDB  │  (Local storage)              │
│  │ Action  │     │  + Cache    │                               │
│  └─────────┘     └──────┬──────┘                               │
│                         │                                       │
│                         ▼                                       │
│  WHEN BACK ONLINE:      │                                       │
│  ┌─────────────┐     ┌──┴──────┐     ┌─────────┐               │
│  │  IndexedDB  │ ──► │  Sync   │ ──► │   DB    │               │
│  │   Queue     │     │ Engine  │     │ Server  │               │
│  └─────────────┘     └─────────┘     └─────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm run install:all

# Start development (both servers)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build
```

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@buildingms.com | admin123 |

---

## 📋 Implementation Checklist for New Building

- [ ] Create building in admin dashboard
- [ ] Download and print QR code
- [ ] Mount QR at entrance
- [ ] Create security guard accounts
- [ ] Create staff accounts
- [ ] Train security (10 minutes)
- [ ] Issue staff badges (optional)
- [ ] Add tenants (if applicable)
- [ ] Configure payment methods (if applicable)

---

## 🛠️ Technical Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: SQLite (sql.js - pure JavaScript)
- **PWA**: Service Workers, IndexedDB
- **Security**: JWT, bcrypt, AES encryption

---

*BuildingMS v1.0 - Built for Zimbabwe 🇿🇼*
