# Supabase setup for SupplyScope

## 1. Configure the project

In Supabase, create a project and copy its **Project URL** and **anon/publishable key**. In the project root, create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

Never put the `service_role` key in a `NEXT_PUBLIC_` variable or in browser code. The application does not need it at runtime.

## 2. Apply migrations

Open **SQL Editor** and run these files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_and_permissions_hardening.sql`

If you already ran the original version of migration 001, run migration 002 after it. It fixes the supplier question-scope policy and adds server-side assignment/response guards.

## 3. Create the first organization administrator

For this MVP, create users in **Authentication → Users → Add user**. Enable email confirmation for the account (or confirm it manually in the dashboard). Copy the user's UUID.

In SQL Editor, create the organization and link the auth user to it. Replace the sample values:

```sql
insert into public.organizations (name)
values ('Example Organization')
returning id;

-- Use the returned organization UUID and the Auth user's UUID:
insert into public.profiles (id, organization_id, full_name, role)
values (
  'AUTH-USER-UUID',
  'ORGANIZATION-UUID',
  'Organization Admin',
  'org_admin'
);
```

Use `org_manager` for a manager account. Organization accounts must have `organization_id` and must leave `supplier_id` null.

## 4. Add suppliers and supplier users

Create the supplier from SQL Editor (or later from the organization UI when supplier CRUD is wired to the database):

```sql
insert into public.suppliers (organization_id, name, contact_name, email)
values ('ORGANIZATION-UUID', 'Example Supplier', 'Supplier Contact', 'contact@example.com')
returning id;
```

Create the supplier's Auth user under **Authentication → Users**, then link it:

```sql
insert into public.profiles (id, supplier_id, full_name, role)
values ('SUPPLIER-AUTH-USER-UUID', 'SUPPLIER-UUID', 'Supplier Contact', 'supplier_user');
```

Create products and link them to suppliers:

```sql
insert into public.products (organization_id, name, category, sku)
values ('ORGANIZATION-UUID', 'Example Product', 'Home appliances', 'EX-001')
returning id;

insert into public.supplier_products (supplier_id, product_id)
values ('SUPPLIER-UUID', 'PRODUCT-UUID');
```

## 5. Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login` and sign in with the Auth user email/password. The profile's `role`, `organization_id`, and `supplier_id` determine the workspace. The demo role switcher is disabled whenever both Supabase environment variables are configured.

## 6. Verify isolation with two accounts

Use separate browser profiles/incognito sessions:

- Organization admin/manager: should see only their organization's suppliers, products, questionnaires, assignments, responses and analytics.
- Supplier user A: should see only assignments and questionnaire versions for supplier A, and only their own notifications and responses.
- Supplier user B: should not be able to read supplier A's assignments, products (unless separately linked), notifications, responses or answers.
- Try to change a submitted response, alter an assignment's supplier/product/deadline, or answer a question from another questionnaire version. The database triggers should reject these operations.

RLS is the security boundary; hiding UI elements is not authorization. Never expose a service-role key to the browser.

## Current integration scope

Supabase Auth, cookie-backed session refresh, profile-based role selection, RLS-scoped reads, questionnaire creation/versioning, assignment creation, supplier response drafts/submission, and in-app notifications are connected. Supplier/product administration screens still need their create/edit forms wired to database mutations. Email delivery and real file uploads to the private Storage bucket are not yet connected.
