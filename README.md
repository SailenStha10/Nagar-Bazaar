# Nagar Bazaar

An integrated e-commerce and e-governance platform for local markets. Citizens shop from verified local sellers, file and track complaints, and read government notices — all in one place. Government officers and admins get dedicated tools to verify sellers, resolve complaints, monitor market pricing, and manage the platform end to end.

## 1. Project Overview

Nagar Bazaar bridges two things that are usually separate: a local marketplace and the civic oversight that keeps it trustworthy.

- **Citizens** browse and buy from local sellers, track orders, file complaints about pricing/quality/sellers, and read official notices.
- **Sellers** register a shop (pending government verification), manage their product catalog and inventory, and fulfill orders.
- **Government officers** verify sellers, investigate and resolve citizen complaints, monitor prices for overcharging, and publish public notices.
- **Admins** have full system-wide visibility and control: users, sellers, products, categories, officers, complaints (including assigning them to officers), and notices, all from one dashboard.

## 2. Features Summary

- Product catalog with search, filtering, sorting, and a dedicated "local products" showcase
- Cart → checkout → order tracking with a visual status timeline
- Seller storefronts with product management and an order fulfillment queue
- Citizen complaint system with categorization, attachments, and a status timeline
- Government seller-verification workflow (approve / reject / request review) with a full audit history
- Market price monitoring with deviation alerts against the category average
- Government notices (public feed + officer/admin publishing tools)
- Role-specific dashboards (customer, seller, officer, admin) with charts built on real aggregated data
- A central admin panel: user management, seller oversight, product moderation, category CRUD, officer account management, and one-click complaint-to-officer assignment
- JWT authentication with role-based access control enforced on every protected route

## 3. Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19
- Tailwind CSS 4
- [Recharts](https://recharts.org/) for dashboard charts
- [Lucide React](https://lucide.dev/) for icons
- Axios for API calls
- Jest + React Testing Library for component/hook/page tests

**Backend**
- Node.js + Express 4
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) for authentication, `bcryptjs` for password hashing
- `express-validator` for request validation
- `helmet`, `express-mongo-sanitize`, `express-rate-limit`, `compression`, `cors` for security/performance
- Jest + Supertest + `mongodb-memory-server` for backend tests (isolated, no real database touched)

## 4. Installation Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local instance or a MongoDB Atlas connection string)
- npm

### Clone and install
```bash
git clone <repository-url>
cd "Nagar Bazar"

cd backend && npm install
cd ../frontend && npm install
```

## 5. Configuration (Environment Variables)

### Backend — `backend/.env`
Copy `backend/.env.example` to `backend/.env` and fill in real values:

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/nagar_bazaar` |
| `PORT` | Port the API listens on | `5000` |
| `JWT_SECRET` | Secret used to sign JWTs — **use a long random string**, never commit a real one | `change_this_to_a_long_random_secret` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins (enforced only when `NODE_ENV=production`) | `http://localhost:3000` |

### Frontend — `frontend/.env.local`
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the frontend calls for the API | `http://localhost:5000/api` |

## 6. Running the Project

**Terminal 1 — Backend**
```bash
cd backend
npm run dev          # nodemon, auto-restarts on file changes
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

### Seeding demo data
With the backend running in development mode, seed a full set of demo sellers, products, customers, an officer account, notices, and market prices:
```bash
cd backend
npm run seed
```
This also creates a demo admin account (see `backend/utils/seedDatabase.js` for the seeded credentials — do not use these in a real deployment). All seeded accounts use the same demo password; check the script for the exact value before sharing it anywhere.

### Creating your own admin account
Registration only allows `customer`/`seller` roles by design (admin and officer accounts are provisioned deliberately, not self-served). To create or promote an admin:
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateOne({ email: 'YOUR_EMAIL' }, { role: 'admin' });
  process.exit(0);
});
"
```
Then sign in at `/admin` (a dedicated admin login page, separate from the regular `/login`).

## 7. API Documentation (Summary)

Full endpoint-by-endpoint reference: **[BACKEND_API.md](./BACKEND_API.md)**

Quick map of resource areas and their base paths:

| Base path | Covers |
|---|---|
| `/api/auth` | Register, login, profile |
| `/api/products` | Public product listing, detail, search |
| `/api/categories` | Public category list; admin CRUD |
| `/api/cart` | Authenticated cart operations |
| `/api/orders` | Checkout, order history, tracking |
| `/api/sellers` | Public seller directory; seller's own store/products/orders/dashboard |
| `/api/complaints` | File, list, assign, update, resolve complaints |
| `/api/notices` | Public notice feed; officer/admin publishing |
| `/api/verification` | Officer/admin seller-verification workflow |
| `/api/market-monitoring` | Officer/admin price monitoring |
| `/api/officers` | Officer dashboard, officer directory |
| `/api/customers` | Customer dashboard |
| `/api/admin` | Admin dashboard, user/product/officer management |
| `/api/uploads` | Authenticated file upload (complaint attachments etc.) |
| `/api/seed` | Development-only database seeding |

## 8. Project Structure

```
Nagar Bazar/
├── backend/
│   ├── app.js                # Express app (routes, middleware) — no side effects, used by tests
│   ├── server.js              # Connects to MongoDB and starts the app.js server
│   ├── config/db.js           # Mongoose connection helper
│   ├── models/                 # Mongoose schemas (User, Product, Order, Complaint, ...)
│   ├── controllers/            # Route handlers, grouped by resource/role
│   ├── routes/                 # Express routers, one per resource
│   ├── middleware/             # auth (JWT), authorize (RBAC), validate, upload
│   ├── utils/                  # auth helpers, seed scripts, sanitize helper
│   └── __tests__/              # Jest + Supertest API tests (in-memory MongoDB)
│
├── frontend/
│   ├── app/                    # Next.js App Router pages, one folder per route
│   │   ├── (public pages)      # /, /products, /local-products, /notices, /login, /register
│   │   ├── customer/           # Customer dashboard, cart, checkout, orders, complaints
│   │   ├── seller/              # Seller dashboard, products, orders
│   │   ├── government/          # Officer/admin-shared verification, complaints, notices, monitoring
│   │   └── admin/               # Central admin panel (dashboard + management pages)
│   ├── components/              # Shared presentational components (ProductCard, forms, timelines...)
│   ├── hooks/                   # useAuth, useCart
│   ├── context/                 # AuthContext, CartContext
│   ├── utils/api.js             # Axios instance (auth header injection, 401 auto-logout)
│   └── __tests__/               # Jest + React Testing Library tests
│
├── README.md                    # This file
├── BACKEND_API.md               # Full API reference
└── FRONTEND_GUIDE.md             # Frontend architecture guide
```

## 9. Key Features by Role

**Customer** — browse/search products, local-products showcase, cart & checkout, order tracking with a timeline, file and track complaints, view government notices, a dashboard with spending/order charts.

**Seller** — store profile with government verification status, product CRUD with stock/local-product details, order queue with status updates, a sales dashboard (this month vs last month, top products, low-stock alerts).

**Government Officer** — shared "civic oversight" area: review and approve/reject/request-review seller applications, manage assigned complaints through a status timeline, monitor and flag overpriced products, publish notices, a personal workload dashboard.

**Admin** — everything an officer can do, plus: user management (block/unblock any account), full seller/product moderation, category CRUD, officer account provisioning, and a one-click "assign complaint to officer" panel right on the main dashboard — the single control point for the whole platform.

## 10. Testing Instructions

**Backend** (Jest + Supertest, against an in-memory MongoDB — never touches your real database):
```bash
cd backend
npm test
```

**Frontend** (Jest + React Testing Library):
```bash
cd frontend
npm test
```

Both suites are safe to run at any time — the backend suite spins up its own throwaway MongoDB instance per run, and the frontend suite mocks all network calls.

## 11. Deployment Instructions

1. Set `NODE_ENV=production` and a real `JWT_SECRET`/`MONGODB_URI`/`CORS_ORIGIN` in the backend environment.
2. Build the frontend: `cd frontend && npm run build`, then `npm run start` (or deploy to a Next.js-compatible host).
3. Run the backend with a process manager (`pm2`, systemd, or your platform's equivalent) via `node server.js` — do not use `nodemon` in production.
4. Point `NEXT_PUBLIC_API_URL` at the deployed backend's public URL and set `CORS_ORIGIN` on the backend to the deployed frontend's origin.
5. Ensure MongoDB is reachable from the backend host and that `backend/uploads/` is on persistent (not ephemeral) storage, or swap it for object storage before going live.

## 12. Contributing Guidelines

1. Branch from `main`, keep changes scoped to one feature/fix per branch.
2. Run both test suites (`npm test` in `backend/` and `frontend/`) before opening a PR.
3. Match the existing code style — no added dependencies without a clear reason, no unrelated refactors bundled into a feature PR.
4. Keep controllers/components consistent with the existing patterns in the same directory (e.g. new admin endpoints follow the `adminXController.js` naming and response-shape conventions already in place).

## 13. License

This is a university project built for educational purposes. No license has been formally assigned — check with the project owner before reusing it elsewhere.

## 14. Contact / Support

For questions about this codebase, see `NAGAR_BAZAAR_DEVELOPMENT_PROMPT.md` for the full sprint-by-sprint development history, or open an issue in the project repository.
