# Cherubim Security Management System

A comprehensive **security operations platform** for managing buildings, visitors, staff, patrols, incidents, assets, vehicles, and weapons. Built for professional security companies operating across multiple sites.

## Features

### Building & Site Management
- Multi-building management from a single admin dashboard
- QR code generation for visitor entry at each building
- Building-specific staff assignments

### Visitor Management
- QR code-based check-in/check-out at building entrances
- No app required - visitors use their smartphone camera
- Device fingerprinting for seamless check-out
- ID number encryption for data security
- IP address logging for audit trail
- Offline capability with automatic sync

### Staff & Attendance
- Digital clock-in/clock-out with automatic hour calculation
- QR badge scanning for staff entry/exit tracking
- Attendance history and reports
- Guard personnel files (e-files) with document management

### Patrol Management
- Create patrol rounds with asset checkpoints
- Guards scan QR codes on assets to verify patrol completion
- Accountability reports: completed vs missed patrols
- Individual guard patrol logs

### Incident Reporting
- Log incidents with severity levels (low, medium, high, critical)
- Track incident status (open, under review, resolved, closed)
- Resolution notes and audit trail

### Asset Management
- Register and track building assets
- QR code-based asset verification during patrols
- Asset condition tracking

### Vehicle Tracking
- Register company vehicles with driver assignments
- GPS location tracking with speed and heading
- Map view for real-time vehicle positions

### Weapons Management
- Weapon registry with serial number tracking
- Issue/return workflow with guard clearance validation
- Complete assignment history and audit trail

### Reporting & Exports
- Dashboard analytics with charts and statistics
- Excel export for visitors, attendance, guard logs, and login activity
- Patrol accountability reports
- Revenue and payment tracking

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: Neon PostgreSQL (production) / SQLite (development)
- **Security**: JWT authentication, bcrypt password hashing, AES encryption
- **Hosting**: Vercel (frontend) + Render (backend API)

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies
npm run install-all

# Start development servers (backend + frontend)
npm run dev
```

## Project Structure

```
├── server/                 # Backend API
│   ├── database/          # Database initialization (Neon + SQLite)
│   ├── middleware/        # JWT authentication middleware
│   ├── routes/            # API route handlers
│   ├── scripts/           # Database reset & utilities
│   └── utils/             # Encryption, QR generation
├── client/                 # React frontend
│   ├── public/            # Static files, PWA manifest
│   └── src/
│       ├── components/    # Reusable components (Layout)
│       ├── context/       # Auth & Offline contexts
│       ├── pages/         # Page components by portal
│       │   ├── admin/     # Admin portal pages
│       │   ├── security/  # Security portal pages
│       │   ├── staff/     # Staff portal pages
│       │   └── visitor/   # Visitor check-in
│       └── utils/         # API client utilities
└── docs/                   # Documentation
```

## Environment Variables

### Server (.env)
```
PORT=5000
NODE_ENV=production
JWT_SECRET=<random-32-char-string>
ENCRYPTION_KEY=<random-32-char-string>
DATABASE_URL=<neon-postgresql-connection-string>
FRONTEND_URL=<vercel-deployment-url>
```

### Client (.env)
```
REACT_APP_API_URL=<render-backend-url>/api
```

## Security Features

- **JWT Authentication** with 24-hour token expiry
- **bcrypt Password Hashing** (10 salt rounds)
- **AES Encryption** for sensitive data (visitor ID numbers)
- **IP Logging** on all login attempts and visitor check-ins
- **Rate Limiting** (100 requests per 15 minutes per IP)
- **Helmet.js** security headers
- **Role-Based Access Control** (admin, owner, supervisor, security, staff)

## License

Proprietary - Cherubim Security (Pvt) Ltd.
