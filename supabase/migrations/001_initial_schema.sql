-- SupplyScope initial PostgreSQL schema for Supabase.
create extension if not exists pgcrypto;
create type public.app_role as enum ('org_admin','org_manager','supplier_user');
create type public.questionnaire_status as enum ('draft','published');
create type public.assignment_status as enum ('pending','in_progress','submitted','overdue');
create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.suppliers (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, contact_name text, email text, status text not null default 'active' check(status in ('active','inactive')), created_at timestamptz not null default now());
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, organization_id uuid references public.organizations(id) on delete cascade, supplier_id uuid references public.suppliers(id) on delete cascade, full_name text not null, role public.app_role not null, created_at timestamptz not null default now(), check ((role='supplier_user' and supplier_id is not null) or (role<>'supplier_user' and organization_id is not null)));
create table public.products (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, category text, sku text, created_at timestamptz not null default now());
create table public.supplier_products (supplier_id uuid not null references public.suppliers(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, primary key(supplier_id,product_id));
create table public.questionnaires (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, title text not null, description text, status public.questionnaire_status not null default 'draft', current_version integer not null default 1, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.questionnaire_versions (id uuid primary key default gen_random_uuid(), questionnaire_id uuid not null references public.questionnaires(id) on delete cascade, version integer not null, published_at timestamptz, created_at timestamptz not null default now(), unique(questionnaire_id,version));
create table public.questions (id uuid primary key default gen_random_uuid(), questionnaire_version_id uuid not null references public.questionnaire_versions(id) on delete cascade, title text not null, description text, question_type text not null check(question_type in ('short_text','long_text','yes_no','single_choice','multiple_choice','number','date','rating','file')), required boolean not null default false, options jsonb not null default '[]'::jsonb, condition jsonb, position integer not null, created_at timestamptz not null default now());
create table public.assignments (id uuid primary key default gen_random_uuid(), questionnaire_version_id uuid not null references public.questionnaire_versions(id), supplier_id uuid not null references public.suppliers(id), product_id uuid not null references public.products(id), deadline date not null, status public.assignment_status not null default 'pending', created_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(questionnaire_version_id,supplier_id,product_id));
create table public.responses (id uuid primary key default gen_random_uuid(), assignment_id uuid not null unique references public.assignments(id) on delete cascade, submitted_by uuid not null references public.profiles(id), status text not null default 'draft' check(status in ('draft','submitted')), submitted_at timestamptz, updated_at timestamptz not null default now());
create table public.answers (id uuid primary key default gen_random_uuid(), response_id uuid not null references public.responses(id) on delete cascade, question_id uuid not null references public.questions(id), value jsonb, created_at timestamptz not null default now(), unique(response_id,question_id));
create table public.notifications (id uuid primary key default gen_random_uuid(), recipient_user_id uuid not null references public.profiles(id) on delete cascade, assignment_id uuid references public.assignments(id) on delete cascade, title text not null, message text not null, read_at timestamptz, created_at timestamptz not null default now());
create index assignments_supplier_status_idx on public.assignments(supplier_id,status);
create index assignments_deadline_idx on public.assignments(deadline);
create index answers_response_idx on public.answers(response_id);

-- Security helpers. SECURITY DEFINER avoids recursive profile RLS evaluation.
create or replace function public.current_app_role() returns public.app_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;
create or replace function public.current_org_id() returns uuid language sql stable security definer set search_path=public as $$ select organization_id from public.profiles where id=auth.uid() $$;
create or replace function public.current_supplier_id() returns uuid language sql stable security definer set search_path=public as $$ select supplier_id from public.profiles where id=auth.uid() $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.supplier_products enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questionnaire_versions enable row level security;
alter table public.questions enable row level security;
alter table public.assignments enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.notifications enable row level security;

create policy "organization members read own organization" on public.organizations for select using (id=public.current_org_id());
create policy "users read own profile" on public.profiles for select using (id=auth.uid() or (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')));
create policy "organization staff manage suppliers" on public.suppliers for all using (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')) with check (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'));
create policy "supplier user reads own supplier" on public.suppliers for select using (id=public.current_supplier_id());
create policy "organization staff manage products" on public.products for all using (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')) with check (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'));
create policy "supplier users read linked products" on public.products for select using (exists(select 1 from public.supplier_products sp where sp.product_id=id and sp.supplier_id=public.current_supplier_id()));
create policy "staff manage supplier product links" on public.supplier_products for all using (exists(select 1 from public.suppliers s where s.id=supplier_id and s.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'))) with check (exists(select 1 from public.suppliers s where s.id=supplier_id and s.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')));
create policy "supplier reads own product links" on public.supplier_products for select using (supplier_id=public.current_supplier_id());
create policy "staff manage questionnaires" on public.questionnaires for all using (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')) with check (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'));
create policy "staff read versions" on public.questionnaire_versions for select using (exists(select 1 from public.questionnaires q where q.id=questionnaire_id and q.organization_id=public.current_org_id()));
create policy "supplier reads assigned versions" on public.questionnaire_versions for select using (exists(select 1 from public.assignments a where a.questionnaire_version_id=id and a.supplier_id=public.current_supplier_id()));
create policy "staff manage versions" on public.questionnaire_versions for all using (exists(select 1 from public.questionnaires q where q.id=questionnaire_id and q.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'))) with check (exists(select 1 from public.questionnaires q where q.id=questionnaire_id and q.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')));
create policy "staff read questions" on public.questions for select using (exists(select 1 from public.questionnaire_versions v join public.questionnaires q on q.id=v.questionnaire_id where v.id=questionnaire_version_id and q.organization_id=public.current_org_id()));
create policy "supplier reads assigned questions" on public.questions for select using (exists(select 1 from public.assignments a where a.questionnaire_version_id=questionnaire_version_id and a.supplier_id=public.current_supplier_id()));
create policy "staff manage questions" on public.questions for all using (exists(select 1 from public.questionnaire_versions v join public.questionnaires q on q.id=v.questionnaire_id where v.id=questionnaire_version_id and q.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'))) with check (exists(select 1 from public.questionnaire_versions v join public.questionnaires q on q.id=v.questionnaire_id where v.id=questionnaire_version_id and q.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')));
create policy "staff manage assignments" on public.assignments for all using (exists(select 1 from public.suppliers s where s.id=supplier_id and s.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'))) with check (exists(select 1 from public.suppliers s where s.id=supplier_id and s.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager')));
create policy "supplier reads own assignments" on public.assignments for select using (supplier_id=public.current_supplier_id());
create policy "supplier updates own assignment status" on public.assignments for update using (supplier_id=public.current_supplier_id() and status in ('pending','in_progress')) with check (supplier_id=public.current_supplier_id() and status in ('in_progress','submitted'));
create policy "staff read responses" on public.responses for select using (exists(select 1 from public.assignments a join public.suppliers s on s.id=a.supplier_id where a.id=assignment_id and s.organization_id=public.current_org_id()));
create policy "supplier manages own response" on public.responses for all using (exists(select 1 from public.assignments a where a.id=assignment_id and a.supplier_id=public.current_supplier_id())) with check (exists(select 1 from public.assignments a where a.id=assignment_id and a.supplier_id=public.current_supplier_id()));
create policy "staff read answers" on public.answers for select using (exists(select 1 from public.responses r join public.assignments a on a.id=r.assignment_id join public.suppliers s on s.id=a.supplier_id where r.id=response_id and s.organization_id=public.current_org_id()));
create policy "supplier manages own answers" on public.answers for all using (exists(select 1 from public.responses r join public.assignments a on a.id=r.assignment_id where r.id=response_id and a.supplier_id=public.current_supplier_id())) with check (exists(select 1 from public.responses r join public.assignments a on a.id=r.assignment_id where r.id=response_id and a.supplier_id=public.current_supplier_id()));
create policy "users read own notifications" on public.notifications for select using (recipient_user_id=auth.uid());
create policy "users update own notifications" on public.notifications for update using (recipient_user_id=auth.uid()) with check (recipient_user_id=auth.uid());

-- Storage bucket for supplier evidence. Configure private bucket and policies before production use.
insert into storage.buckets (id,name,public) values ('supplier-evidence','supplier-evidence',false) on conflict (id) do nothing;
