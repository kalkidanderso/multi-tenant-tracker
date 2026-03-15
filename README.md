# Mini SaaS: Multi-Tenant Issue Tracker

A robust, production-ready multi-tenant issue tracking application built with Next.js 16, Prisma, PostgreSQL, and custom JWT authentication.

## Architecture Overview

The system follows a strict, layered monolithic architecture leveraging the Next.js App Router for both backend API routes and frontend React nodes. 

### Multi-Tenancy Strategy (SaaS Isolation)
We implement **Row-Level Tenant Isolation** via a shared database schema. Every major entity (`Project`, `Issue`, `User`, `Tag`, `Comment`) has a direct foreign-key relationship (`organizationId`) enforcing the tenant bounds. 

Rather than relying on subdomains initially, tenancy is scoped by the **Active JWT Payload**:
1. When a user authenticates, their tenant `organizationId` is embedded into their cryptographic JWT payload.
2. Every request to `/api/*` extracts this `organizationId` from the Authorization header via the `@/lib/auth.ts` middleware validation.
3. Database queries *always* use the shape `{ where: { organizationId: authUser.organizationId, ... } }`, preventing cross-tenant data leaks natively in Prisma.

### Security Considerations
1. **JWT & Secret Management**: Sessions are strictly stateless using short-lived JWTs. Secrets are securely retrieved from `.env`.
2. **Password Hashing**: User passwords utilize `bcryptjs` for brute-force resistance.
3. **Role-Based Access Control (RBAC)**: Users hold a `Role` enum (OWNER, ADMIN, MEMBER). Mutation endpoints actively verify that nested operations (like creating a Project) check the `role` enum in the request context before committing changes natively.
4. **Validation Bounds**: All API inputs run through explicit JSON constraints using `Zod` (e.g. `CreateIssueSchema`), terminating bad requests early before they can pollute the database drivers.
5. **Exception Handling**: A wrapper function (`withErrorHandler`) swallows stack traces, maps Prisma Constraint errors to standard HTTP status codes (400, 403, 404, 409), and logs the internal traces privately.

## Getting Started

Ensure you have a PostgreSQL database available.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Establish Database Variables:
   Update your `.env` connection string to your PostgreSQL instance. 

3. Migrate and Seed:
   The database ships with a demo script to bootstrap the initial organization, owner user, default statuses, and sample hardware anomaly logs.
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   npx prisma db seed
   ```

4. Run the Dev Server:
   ```bash
   npm run dev
   ```

## 🔐 Demo Credentials (Seeded)
If you run the seed script, you can log in using:
- **Tenant ID (Slug)**: `rudratek-hq`
- **Email**: `admin@rudratek.co.in`
- **Passcode**: `root`
