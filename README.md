# SupplyScope — Supplier Assessment Platform

A Next.js + TypeScript supplier questionnaire and assessment MVP. It demonstrates organization and supplier workspaces, product/supplier relationships, a conditional questionnaire builder, assignments, supplier submissions, notifications and analytics.

## Quick start (demo mode)

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Choose Organization or Supplier demo access on the welcome screen. Changes are persisted in browser `localStorage`.

### Switch roles

Use the **View as** selector in the top bar:
- Organization admin — organization workspace.
- Organization manager — organization workspace.
- Supplier user — supplier portal (demo supplier: Samsung Electronics / Minji Park).

This role switcher is for demonstrating the UI only. It is not authentication or a security boundary.

## Supabase setup

1. Create a Supabase project.
2. In SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
3. Create an organization, supplier records and product records; connect supplier/product rows.
4. Create Supabase Auth users and matching `profiles` rows. Organization users need `organization_id`; supplier users need `supplier_id`.
5. Copy Project URL and anon/publishable key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The SQL migration includes the relational schema, questionnaire version snapshots, answers as JSONB, notification records and starter RLS policies, including supplier read access scoped to assigned questionnaire versions. The UI in this MVP currently uses the local demo data adapter; the Supabase schema and client are included as the backend integration foundation. Before using real accounts, wire page data/actions to Supabase queries and verify every RLS policy using separate organization and supplier accounts. Do not treat demo role switching as production auth.

## Features

- Role-aware organization and supplier navigation.
- Supplier directory and product catalog with many-to-many supplier/product relationships.
- Questionnaire builder with nine question types: short text, long text, yes/no, single choice, multiple choice, number, date, rating and file.
- Conditional visibility with equals, not-equals, contains, greater-than and less-than operators.
- Conditions can refer to earlier questions; hidden answers are pruned when a parent answer changes.
- Assignment creation for supplier/product combinations and due dates.
- In-app notification records and read state.
- Supplier response experience with draft save, required-field validation and submission.
- Analytics for completion, supplier performance and yes/no answer distribution.
- Questionnaire versions represented in the SQL schema; published questionnaires are read-only in the demo UI.

## Important demo limitations

- Demo mode is local to one browser and is not shared between users/devices.
- Demo file questions store the filename only. Configure Supabase Storage and upload validation for real files.
- Supplier portal demo identity is Samsung. The demo role selector is not a substitute for server-side authorization.
- Email delivery, automated reminders, PDF/Excel exports, and production-grade version cloning are not included.
- The schema is a solid starting point, but production deployment requires connecting the UI to Supabase and testing RLS thoroughly.

## Commands

```bash
npm run dev       # local development
npm run typecheck # TypeScript check
npm run build     # production build
npm start         # run production build
```

## Suggested production hardening

- Use `@supabase/ssr` with middleware/cookie-based auth and server-side session validation.
- Move all writes to server actions or route handlers and enforce role/supplier scope on the server.
- Validate submitted answer values against the assigned questionnaire version on the server; never trust client visibility alone.
- Add private Storage bucket policies and signed upload URLs for evidence documents.
- Add immutable questionnaire version snapshots at publish time.
- Add email notifications via a provider such as Resend and scheduled deadline reminders.
- Add audit logs for questionnaire publication, assignment and submission changes.
