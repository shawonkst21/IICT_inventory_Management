# IICT Inventory Management System - Server

Express.js backend with PostgreSQL database for the IICT Inventory Management System.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Database Migration](#database-migration)
- [Seeding Demo Data](#seeding-demo-data)
- [Running the Server](#running-the-server)
- [Available Scripts](#available-scripts)
- [Database Schema Files](#database-schema-files)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

---

## Environment Setup

1. Copy or update the `.env` file in the server root:

```bash
# Server Configuration
PORT=5000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Database Configuration
# Option 1: Unix socket (peer authentication - no password needed)
IICT_PGHOST=/var/run/postgresql
IICT_PGPORT=5432
IICT_PGUSER=kalel  # Your Unix username
IICT_PGDATABASE=iict_inventory_management
IICT_DATABASE_SSL=false

# Option 2: TCP connection (requires password)
# IICT_PGHOST=127.0.0.1
# IICT_PGPORT=5432
# IICT_PGUSER=postgres
# IICT_PGPASSWORD=your_password
# IICT_PGDATABASE=iict_inventory_management

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="IICT Inventory <your-email@gmail.com>"

# OTP Configuration
OTP_EXPIRY_MINUTES=10
APP_NAME=IICT Inventory
```

2. Install dependencies:
```bash
npm install
```

---

## Database Setup

### Step 1: Create the Database

Using Unix socket (peer authentication):
```bash
psql -c "CREATE DATABASE iict_inventory_management;"
```

Or using TCP with postgres user:
```bash
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE iict_inventory_management;"
```

---

## Database Migration

### Option 1: Complete Schema (Fresh Install)

Use the complete schema file that matches `real_database.sql`:

```bash
psql -d iict_inventory_management -f scripts/init-database.sql
```

This creates all tables with the correct structure:
- `users` - User authentication and roles (`admin`, `manager`, `user`)
- `item_categories` - Inventory categories
- `items` - Inventory items
- `item_receipts` - Incoming inventory tracking
- `item_requests` - Inventory requests
- `item_issuances` - Issued items tracking
- `tender_notices` - Procurement tenders
- `notifications` - User notifications
- `audit_logs` - System action logs

### Option 2: Migrate Existing Database

If you have an existing database with different schema or role values, use the migration scripts:

#### Migrate to Real Schema (Structure Only)
```bash
psql -d iict_inventory_management -f scripts/migrate-to-real-schema.sql
```

This updates:
- `low_stock_threshold` default to 0
- Adds `ON DELETE CASCADE` constraints
- Adds missing indexes
- Adds `updated_at` triggers

#### Migrate Role Values
```bash
psql -d iict_inventory_management -f scripts/migrate-roles-to-real-schema.sql
```

This updates role values from `('admin', 'inventory_manager', 'staff')` to `('admin', 'manager', 'user')` to match `real_database.sql`.

---

## Seeding Demo Data

After setting up the database schema, you can populate it with demo data:

```bash
npm run seed:demo
```

### Demo Credentials

After seeding, these admin accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@iict.local` | `password123` |
| Manager | `inventory@iict.local` | `password123` |
| User | `staff@iict.local` | `password123` |

### What Gets Seeded

- 3 demo users (admin, manager, user)
- 3 item categories (Electronics, Stationery, Safety)
- 3 inventory items
- Sample item receipts, requests, and issuances
- Demo tender notices
- Sample notifications
- Audit log entries

---

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with auto-reload (`node --watch`) |
| `npm start` | Start server with nodemon |
| `npm run seed:demo` | Seed database with demo data |

---

## Database Schema Files

| File | Purpose |
|------|---------|
| `scripts/init-database.sql` | Complete schema creation (matches `real_database.sql`) |
| `scripts/real_database.sql` | Original reference schema |
| `scripts/init-users-table.sql` | Users table only (legacy) |
| `scripts/migrate-users-email-otp.sql` | OTP email verification migration |
| `scripts/migrate-to-real-schema.sql` | Structure migration (CASCADE, indexes, triggers) |
| `scripts/migrate-roles-to-real-schema.sql` | Role values migration |
| `scripts/seed-demo-data.js` | Demo data seeding script |

---

## User Roles

The system uses three role levels:

| Role | Description | Permissions |
|------|-------------|--------------|
| `admin` | System administrator | Full access to all features |
| `manager` | Inventory manager | Manage inventory, approve requests |
| `user` | Staff/user | Request items, view inventory |

---

## Troubleshooting

### Database Connection Issues

**Error**: `connection to server failed: fe_sendauth: no password supplied`

**Solution**: Use Unix socket connection in `.env`:
```
IICT_PGHOST=/var/run/postgresql
IICT_PGUSER=your_unix_username
```

### Role Constraint Violation

**Error**: `new row violates check constraint "users_role_check"`

**Solution**: Ensure role values match the schema (`'admin'`, `'manager'`, `'user'`). Run the role migration:
```bash
psql -d iict_inventory_management -f scripts/migrate-roles-to-real-schema.sql
```

### Missing Tables

**Error**: `relation "table_name" does not exist`

**Solution**: Run the complete schema creation:
```bash
psql -d iict_inventory_management -f scripts/init-database.sql
```

### Email OTP Not Received

**Check**: Verify Gmail app password in `.env`:
- `EMAIL_USER` must be your Gmail address
- `EMAIL_PASS` must be a valid app password (not your regular password)
- Enable 2FA on Gmail and generate an app password

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/register/verify-otp` - Verify registration OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Admin Routes (require `admin` role)
- `GET /api/auth/admin/users` - List all users
- `GET /api/auth/admin/pending` - List pending approvals
- `PATCH /api/auth/admin/approve/:userId` - Approve user
- `PATCH /api/auth/admin/reject/:userId` - Reject user
- `PATCH /api/auth/admin/users/:userId/role` - Update user role

### Items & Categories
- `GET /api/items` - List items (admin)
- `GET /api/items/options` - Get item options (public)
- `POST /api/items` - Create item (admin)
- `PUT /api/items/:id` - Update item (admin)
- `DELETE /api/items/:id` - Delete item (admin)
- `GET /api/items/categories` - List categories

### Requests & Receipts
- `GET /api/item-requests` - List requests
- `POST /api/item-requests` - Create request
- `PATCH /api/item-requests/:id/review` - Approve/reject request
- `POST /api/item-receipts` - Record item receipt

---

## License

MIT

---

## Support

For issues and questions, please contact the development team or create an issue in the repository.
