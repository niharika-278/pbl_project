# pbl_project
# Retail Inventory & Sales Intelligence System

Role-based retail management platform with JWT auth, inventory, checkout, CSV ingestion, and analytics.

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Auth:** JWT, bcrypt, role-based (Admin / Seller)

## Project structure
```
pbl_project/
├── backend/
│   ├── database/
│   │   └── schema.sql          # MySQL schema
│   ├── src/
│   │   ├── config/             # DB, app config
│   │   ├── controllers/        # Auth, analytics, checkout, ingestion
│   │   ├── middleware/        # Auth, validation
│   │   ├── routes/             # API routes
│   │   ├── services/           # Checkout transaction logic
│   │   ├── scripts/
│   │   │   └── seedAdmin.js    # Seed default admin
│   │   ├── app.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/            # AuthContext
│   │   ├── layouts/
│   │   ├── pages/              # Login, Dashboard, DataIngestion, Checkout, Forgot/Reset password
│   │   ├── services/           # API client
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    └── API.md                  # API reference
```

## Setup

### 1. Database

- Install MySQL and create the database:

```bash
mysql -u root -p < backend/database/schema.sql
```

Or run the contents of `backend/database/schema.sql` in your MySQL client.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DB_*, JWT_SECRET, FRONTEND_URL
npm install
node src/scripts/seedAdmin.js   # Creates admin@retail.com / Admin@123
npm run dev
```

Server runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173` and proxies `/api` to the backend.

## Default login

- **Email:** admin@retail.com  
- **Password:** Admin@123  
- **Role:** Admin (select in login form)

## Features

- **Auth:** Login with role (Admin/Seller), forgot password, reset by token, JWT protection
- **Dashboard:** KPIs (revenue, orders, customers, low stock, expiry), pie (categories), bar (sales by day), line (revenue trend)
- **Data ingestion:** CSV upload for customers, inventory, sales with validation and summary
- **Checkout:** Customer search/new, product search, cart, live subtotal/tax/total, place order with transaction and stock deduction

## API overview

See [docs/API.md](docs/API.md) for full endpoint list and request/response shapes.

## Security

- Passwords hashed with bcrypt
- JWT for sessions; protected and role-checked routes
- Input validation (express-validator)
- Prepared statements for MySQL (SQL injection protection)
