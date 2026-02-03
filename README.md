# Building Management & Visitor Tracking System

An **Offline-First Progressive Web App (PWA)** for building security, visitor management, staff attendance, and tenant rent collection.

## Features

### 🚪 Visitor Management
- QR code-based check-in/check-out at building entrances
- Automatic IP address capture for security auditing
- Device fingerprinting for seamless check-out (no data re-entry)
- Offline capability - data syncs when connection restored

### 👷 Staff Attendance
- Digital clock-in/clock-out system
- Working hours calculation
- Attendance history and reports

### 💰 Rent Collection
- Payment QR code generation
- Support for EcoCash, InBucks, Mastercard, and cash
- Payment tracking and status management
- Monthly revenue reports

### 🏢 Multi-Building Support
- Manage multiple buildings from single admin dashboard
- Building-specific QR codes for visitor entry
- Role-based access (Admin, Owner, Staff)

### 📱 Offline-First Architecture
- Progressive Web App (PWA) - installable on mobile
- IndexedDB for local data storage
- Automatic sync when online
- Works without internet connection

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React 18, React Router v6
- **PWA**: Service Workers, IndexedDB (idb)
- **Security**: JWT, bcrypt, AES encryption
- **UI**: Custom CSS, Lucide Icons

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install-all

# Start development servers (backend + frontend)
npm run dev
```

### Default Login
- **Email**: admin@buildingms.com
- **Password**: admin123

## Project Structure

```
├── server/                 # Backend API
│   ├── database/          # SQLite initialization
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── utils/             # Encryption, QR generation
├── client/                 # React PWA frontend
│   ├── public/            # Static files, service worker
│   └── src/
│       ├── components/    # Reusable components
│       ├── context/       # Auth & Offline contexts
│       ├── pages/         # Page components
│       └── utils/         # API utilities
└── data/                   # SQLite database (auto-created)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin/owner)
- `GET /api/auth/me` - Get current user profile

### Visitors
- `POST /api/visitors/check-in` - Visitor check-in (public)
- `POST /api/visitors/check-out` - Visitor check-out (public)
- `POST /api/visitors/status` - Check visitor status
- `GET /api/visitors/building/:id` - Get building visitors

### Staff
- `POST /api/staff/clock-in` - Staff clock-in
- `POST /api/staff/clock-out` - Staff clock-out
- `GET /api/staff/status` - Get attendance status
- `GET /api/staff/history` - Get attendance history

### Tenants & Payments
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/building/:id` - Get building tenants
- `POST /api/payments/generate` - Generate payment QR
- `POST /api/payments/manual` - Record manual payment
- `GET /api/payments/building/:id` - Get building payments

### Buildings
- `POST /api/buildings` - Create building
- `GET /api/buildings` - List buildings
- `GET /api/buildings/:id/public` - Public building info

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Data Encryption** - AES encryption for sensitive data (ID numbers)
- **IP Logging** - Automatic capture for security auditing
- **Rate Limiting** - Protection against abuse
- **Helmet.js** - Security headers

## Payment Integration

The system includes placeholders for payment gateway integration:

- **EcoCash** - Mobile money (Zimbabwe)
- **InBucks** - Mobile payments
- **Mastercard** - Card payments

To integrate actual payment gateways, update `/server/routes/payments.js`:

```javascript
// Replace simulatePaymentGateway() with actual API calls
async function processEcoCash(amount, phone) {
  // EcoCash API integration
}
```

## Environment Variables

Create `.env` file in root:

```env
PORT=5000
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-char-encryption-key
NODE_ENV=development
```

## License

MIT License
