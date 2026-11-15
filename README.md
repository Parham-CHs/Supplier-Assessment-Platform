# SupplyScope — Supplier Assessment Platform

Next.js 15 + TypeScript supplier questionnaire and assessment application. It includes organization and supplier workspaces, supplier/product relationships, conditional questionnaires, assignments, supplier submissions, notifications and analytics.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Without Supabase credentials, the app opens in local demo mode and stores demo state in browser `localStorage`. To use real accounts and shared database state, configure Supabase as described in [`supabase/SETUP.md`](supabase/SETUP.md).

## Supabase integration

- Supabase Auth email/password sign-in with cookie-backed sessions via `@supabase/ssr`.
- Middleware refreshes the session and redirects unauthenticated users to `/login`.
- `public.profiles` determines the role and organization/supplier scope; users cannot select their own role in the UI.
- Workspace reads and writes use the browser Supabase client and are restricted by PostgreSQL RLS.
- Questionnaire versions are preserved when editing a published questionnaire; assignments retain their original version and question snapshot.
- Supplier response drafts and submissions, assignment status changes and in-app notifications are stored in PostgreSQL.
- Database triggers validate supplier/product/questionnaire organization scope, required visible answers, question/version matching and immutability after submission.

See [`supabase/SETUP.md`](supabase/SETUP.md) for migrations, first-admin provisioning, supplier setup and permission tests.

## Roles

- `org_admin`: organization workspace access.
- `org_manager`: organization workspace access.
- `supplier_user`: access to assignments and data for the supplier linked to their profile.

The demo role switcher is only available when Supabase is not configured. In Supabase mode, role and scope come from the authenticated user's `profiles` row and database RLS policies.

## Included features

- Supplier directory and product catalog with many-to-many supplier/product links.
- Questionnaire builder with nine question types and conditional visibility.
- Assignments for supplier/product combinations and deadlines.
- Supplier response drafts, required-field validation and final submission.
- In-app notifications and analytics dashboards.

## Not yet connected

Supplier/product creation is connected; edit/archive workflows, supplier-user invitation management, email notifications, private Storage uploads for evidence files, and production deployment hardening remain follow-up work. The current environment could not download npm packages during integration, so run `npm install`, `npm run typecheck` and `npm run build` locally before submission.
