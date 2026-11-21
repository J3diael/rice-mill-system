# 🏭 Rice Mill Management System

A full-stack web app for small rice mills in the Philippines. It tracks palay and supplies, records each milling run with its recovery rate, sells milled rice through a point-of-sale screen with printable receipts, and shows the day's numbers on a dashboard.

**🔗 Live demo:** https://rice-mill-system-o37c.onrender.com
(free hosting: the first load can take up to a minute while the server wakes up. Demo login available on request.)

**Stack:** React 19 + Vite · Node.js + Express 5 · PostgreSQL · JWT auth · Chart.js

![Dashboard](docs/screenshots/dashboard.png)

## Features

| Module | What it does |
|---|---|
| **Point of Sale** | Tap products to build an order, take Cash, GCash or Credit (utang) payments, calculate change, and print an 80 mm receipt. |
| **Milling** | Record palay in → milled rice out. Stock moves automatically, and the recovery rate (e.g. 65%) is calculated and flagged when it looks unusual. |
| **Raw materials** | Stock in / stock out for palay, sacks, diesel, etc., with a full movement history showing who did what and when. |
| **Products** | Prices, stock and reorder levels for milled rice, bran (darak) and other finished goods. |
| **Dashboard** | Sales today, 7-day sales chart, milling this month, and items that need restocking. |
| **Users & roles** | Admin and staff accounts. Staff handle daily operations; only admins can change prices, items and users. |

<p>
  <img src="docs/screenshots/pos.png" width="49%" alt="Point of sale" />
  <img src="docs/screenshots/receipt.png" width="49%" alt="Receipt" />
</p>

## Engineering highlights

- **Data you can trust:** every sale and milling run is a single database transaction with row locks (`SELECT … FOR UPDATE`). Stock can never go negative, and two cashiers selling the last sack at the same time can't both succeed.
- **Server-side pricing:** the POS sends only product IDs and quantities. Prices and totals are calculated on the server, so they can't be changed from the browser.
- **Security:** passwords are hashed with bcrypt, routes are protected with JWT plus role checks, all secrets live in `.env`, and every query is parameterized against SQL injection.
- **Tested:** integration tests run the real API against a real PostgreSQL database (`npm test`).
- **Clean structure:** routes → services → database, with central validation and error handling.

## Project structure

```
backend/
  db/schema.sql        tables and constraints
  db/seed.sql          sample materials and products
  scripts/initDb.js    creates tables, sample data and the first admin
  src/routes/          REST endpoints
  src/services/        business logic (inventory, milling, sales, dashboard)
  src/middleware/      auth and error handling
  tests/               API integration tests
frontend/
  src/pages/           Dashboard, POS, Sales, Milling, Inventory, Products, Users
  src/components/      shared UI and the receipt
```

## Running it locally

**Requirements:** Node.js 20+ and PostgreSQL 14+.

```bash
# 1. Database
createdb rice_mill_db

# 2. Backend
cd backend
cp .env.example .env        # then edit DATABASE_URL, JWT_SECRET and ADMIN_*
npm install
npm run db:init             # creates tables, sample data and your admin account
npm run dev                 # API on http://localhost:5000/api

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # app on http://localhost:3000 (calls the API through a proxy)
```

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in `backend/.env`.

### Running the tests

```bash
createdb rice_mill_test
cd backend
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/rice_mill_test npm test
```

The tests wipe and rebuild the test database, so never point them at your real data. They refuse to run unless the database name contains `test`.

## Deployment

In production the Express server also serves the built React app, so the whole system runs as **one web service with one URL**.

- `npm run build` (repo root): installs both parts and builds the frontend
- `npm start` (repo root): starts the API and serves the app
- `render.yaml` sets this up on [Render](https://render.com) as a Blueprint. Pair it with a free PostgreSQL database (e.g. [Neon](https://neon.tech)) and set `DATABASE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The database tables are created automatically on each deploy.

## API overview

All routes are under `/api`. Everything except login requires an `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/login` | Log in, returns a token |
| GET | `/dashboard` | Summary numbers |
| GET / POST | `/materials` | List / add raw materials (add: admin) |
| GET / POST | `/transactions` | Stock movement history / stock in-out |
| GET / POST / PUT | `/products` | List / add / edit products (add, edit: admin) |
| GET / POST | `/milling` | Milling batches |
| GET / POST | `/sales`, GET `/sales/:id` | Sales and receipts |
| GET / POST | `/users` | Manage accounts (admin) |

## Roadmap

- Customer accounts and payment tracking for credit (utang) balances
- Daily / monthly PDF and Excel reports
- Palay buying module (purchases from farmers by weight and moisture)

## Author

**Prince Jediael Rance**, BSIT (Web & Mobile Development), Pangasinan State University
[GitHub](https://github.com/J3diael) · p.jediaelrance@gmail.com

## License

MIT
