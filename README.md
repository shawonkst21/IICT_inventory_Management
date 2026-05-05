# IICT Inventory StockFlow System

A role-based inventory management platform for IICT labs and departments. The app combines a Next.js client with an Express + PostgreSQL backend to handle stock tracking, item requests, receipts, approvals, issuances, user administration, and public tender notices.

## What It Does

- Public landing page with published tender notices
- Authentication with registration OTP, login, forgot password, and profile updates
- Role-based access for `admin`, `manager`, and `user`
- Inventory dashboards for stock levels, receipts, requests, and issuances
- Admin tooling for users, categories, items, tender notices, and audit logs
- Manager workflow for reviewing requests and issuing approved items
- Staff workflow for submitting item requests and viewing request history

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts
- Backend: Express 5, CommonJS, PostgreSQL, Socket.IO dependency, Nodemailer, JWT, bcrypt
- UI utilities: shadcn/ui, Radix UI, Sonner, lucide-react, next-themes

## Project Structure

- `client/` - Next.js application
- `server/` - Express API and PostgreSQL database layer

## Main Areas

### Client

- Public site and tender notice feed
- Authentication screens at `/auth/login` and `/auth/register`
- Admin dashboard and management pages under `/admin`
- Inventory manager dashboard and workflows under `/inventory_manager`
- Lab assistant request flow under `/lab_Assistant`
- Shared components, UI primitives, theme context, auth context, and API helpers

### Server

- Auth routes for registration, login, OTP verification, password reset, and profile updates
- Item routes for categories, items, stock levels, and admin item management
- Item request routes for request submission, review, and issuance
- Item receipt routes for receiving stock
- Admin routes for audit logs and tender management
- System routes for health and root checks
- PostgreSQL connection bootstrap with fail-fast startup if the database is unavailable

## Roles

- `admin` - Full system administration, user approval, category/item management, tender management, and audit access
- `manager` - Inventory operations, request review, and issuance workflows
- `user` - Submit item requests and view their own workflow history

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL 12 or newer

### 1. Install Dependencies

Install the client and server dependencies separately:

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `server/` and set the database, auth, and mail settings.

Example server environment:

```env
PORT=5000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Either use DATABASE_URL...
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# ...or use individual PostgreSQL fields
IICT_PGHOST=127.0.0.1
IICT_PGPORT=5432
IICT_PGUSER=postgres
IICT_PGPASSWORD=your_password
IICT_PGDATABASE=iict_inventory_management
IICT_DATABASE_SSL=false

JWT_SECRET=change-this-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="IICT Inventory <your-email@gmail.com>"
OTP_EXPIRY_MINUTES=10
APP_NAME=IICT Inventory
ALLOWED_ORIGINS=http://localhost:3000
```

For the client, create a `.env.local` file in `client/` if you want to override the API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Create and Seed the Database

Create the database, then apply the schema:

```bash
psql -c "CREATE DATABASE iict_inventory_management;"
psql -d iict_inventory_management -f server/scripts/init-database.sql
```

Optional migration scripts are available in `server/scripts/` if you are upgrading an older schema.

To load demo data:

```bash
cd server
npm run seed:demo
```

## Running the App

Run the backend and frontend in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

By default, the client runs on `http://localhost:3000` and the server runs on `http://localhost:5000`.

## Available Scripts

### Client

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the production app
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### Server

- `npm run dev` - Start the API with `node --watch`
- `npm start` - Start the API with nodemon
- `npm run seed:demo` - Seed demo data

## Key API Areas

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in
- `POST /api/auth/forgot-password` - Start password reset
- `GET /api/items/stock-levels` - Fetch stock levels
- `GET /api/item-requests` - List item requests
- `POST /api/item-requests` - Submit a request
- `PATCH /api/item-requests/:requestId/review` - Approve or reject a request
- `POST /api/item-requests/:requestId/issue` - Issue an approved request
- `GET /api/item-receipts` - List receipts
- `POST /api/item-receipts` - Create a receipt record
- `GET /api/admin/logs` - Fetch audit logs
- `GET /api/tenders` - Manage tender notices

## Notes

- The server validates PostgreSQL connectivity before it starts listening.
- The client reads the API base URL from `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_API_URL`.
- If you deploy to multiple machines or hosts, make sure `ALLOWED_ORIGINS` and the client API URL point to the correct public address.

## License

No license file is included in this repository.