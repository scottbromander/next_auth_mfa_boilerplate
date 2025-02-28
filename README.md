This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Next.js AuthN + MFA + AuthZ Example

This repository demonstrates a **Next.js 13** application with:

- **Authentication (AuthN)** using JWT tokens
- **Role-based Authorization (AuthZ)** (Basic or Advanced)
- **Multi-Factor Authentication (MFA)** using Valkey (Redis-compatible)
- **PostgreSQL** for user data storage

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/scottbromander/nextjs-authn-mfa-example.git
cd nextjs-authn-mfa-example
```

### 2. Install Dependancies

```bash
npm install
# or
yarn
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a file called `.env.local` in the project root:

```bash
# PostgreSQL
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/next_auth_demo

# JWT
JWT_SECRET=your_random_jwt_secret

# Valkey (Redis-compatible)
VALKEY_URL=valkey://localhost:6379

# (Optional) SMTP (for sending MFA OTPs via email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```

Replace the placeholders (`your_user`, `your_password`, etc.) with actual credentials.

### 4. Configure PostgreSQL

1. Install **PostgreSQL** (e.g., `brew install postgresql` on macOS or `sudo apt install postgresql postgresql-contrib` on Ubuntu).

2. Create a database for this project:

```sql
CREATE DATABASE next_auth_demo;
```

3. Initialize the users table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'basic',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Set Up Valkey (Redis-Compatible)

You can run Valkey in Docker:

```bash
docker run --name valkey -d -p 6379:6379 valkey/valkey
```

This starts Valkey on port 6379. Update VALKEY_URL in .env.local if you’re using a custom port or host.

If you prefer local installation, ensure valkey-cli ping returns `PONG` before proceeding.

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Then open http://localhost:3000 to view the app.

## Project Structure

- app/ → Next.js 13 App Router for pages, with:
  - auth/login → Login flow
  - auth/register → Registration flow
  - dashboard → Protected dashboard view
- app/api/auth/ → Various route handlers for:
  - login
  - logout
  - register
  - verify-otp
  - etc.
- lib/valkey.ts → Valkey (Redis) connection
- hooks/useUser.ts → Custom hook for fetching user data
- services/userService.ts → Example for abstracting fetch logic

## Key Features

1. **Register** - Users can create accounts (/auth/register).
2. **Login** - Authenticates with JWT; optionally triggers MFA if user has MFA enabled.
3. **Dashboard** - Protected route that checks for a valid token. Displays user role & protected data from /api/protected.
4. **Logout** - Invalidates session in Valkey + removes local token.

## Deployment

We recommend deploying via Vercel for an optimized Next.js experience.

1. Set your environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.) on Vercel.
2. Connect your repo & deploy.
3. Make sure your Valkey (Redis) & Postgres instances are accessible by your deployment (e.g., managed hosting).
