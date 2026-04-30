# EcoManage – Waste to Value Management System

A full-stack government-supported platform for waste collection management.

## Tech Stack
- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose

## Project Structure
```
waste-to-value/
├── backend/
│   ├── models/         User, Booking, Reward, Notification
│   ├── routes/         auth, bookings, admin, rewards, notifications
│   ├── middleware/     JWT auth, admin guard
│   ├── server.js       Express entry point
│   └── seed.js         Demo data seeder
└── frontend/
    └── src/
        ├── pages/      Login, Register, Dashboard, BookPickup,
        │               Bookings, Rewards, Notifications, AdminDashboard, Profile
        ├── components/ Sidebar
        ├── context/    AuthContext (JWT)
        └── utils/      api.js (Axios)
```

## Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

## Quick Start

### 1. Configure environment
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
```

### 2. Run everything
```bash
chmod +x start.sh && ./start.sh
```
Or manually:
```bash
# Terminal 1 — Backend
cd backend && npm install && node seed.js && npm run dev

# Terminal 2 — Frontend  
cd frontend && npm install && npm run dev
```

### 3. Open in browser
- Frontend: http://localhost:5173
- API:      http://localhost:5000/api

## Demo Credentials
| Role    | Email              | Password |
|---------|--------------------|----------|
| Admin   | admin@eco.gov      | admin123 |
| Citizen | citizen@test.com   | test123  |

## API Endpoints
| Method | Endpoint                          | Auth     | Description        |
|--------|-----------------------------------|----------|--------------------|
| POST   | /api/auth/register                | —        | Register user      |
| POST   | /api/auth/login                   | —        | Login              |
| GET    | /api/auth/me                      | JWT      | Current user       |
| POST   | /api/bookings                     | JWT      | Create booking     |
| GET    | /api/bookings                     | JWT      | My bookings        |
| PATCH  | /api/bookings/:id/cancel          | JWT      | Cancel booking     |
| GET    | /api/rewards                      | JWT      | Reward history     |
| POST   | /api/rewards/redeem               | JWT      | Redeem points      |
| GET    | /api/notifications                | JWT      | My notifications   |
| PATCH  | /api/notifications/:id/read       | JWT      | Mark read          |
| PATCH  | /api/notifications/read-all       | JWT      | Mark all read      |
| GET    | /api/admin/stats                  | Admin    | Platform stats     |
| GET    | /api/admin/bookings               | Admin    | All bookings       |
| PATCH  | /api/admin/bookings/:id/complete  | Admin    | Complete pickup    |
| GET    | /api/admin/users                  | Admin    | All citizens       |

## Reward Points
| Waste Type | Points Earned |
|------------|--------------|
| E-Waste    | 100 pts      |
| Plastic    | 75 pts       |
| Bio/Organic| 50 pts       |
| Dry Waste  | 40 pts       |
