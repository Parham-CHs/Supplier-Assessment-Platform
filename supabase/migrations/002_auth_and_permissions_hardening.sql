-- Apply after 001_initial_schema.sql if that migration has already been run.
-- Fix the supplier question scope predicate (the original comparison was tautological).
drop policy if exists "supplier reads assigned questions" on public.questions;
create policy "supplier reads assigned questions" on public.questions for select
using (exists(select 1 from public.assignments a where a.questionnaire_version_id=questions.questionnaire_version_id and a.supplier_id=public.current_supplier_id()));

-- Scope assigned questionnaire versions to the authenticated supplier.
drop policy if exists "supplier reads assigned versions" on public.questionnaire_versions;
create policy "supplier reads assigned versions" on public.questionnaire_versions for select
using (exists(select 1 from public.assignments a where a.questionnaire_version_id=questionnaire_versions.id and a.supplier_id=public.current_supplier_id()));

-- Suppliers must be able to read the questionnaire title attached to their assignments.
drop policy if exists "supplier reads assigned questionnaires" on public.questionnaires;
create policy "supplier reads assigned questionnaires" on public.questionnaires for select
using (exists(select 1 from public.questionnaire_versions v join public.assignments a on a.questionnaire_version_id=v.id where v.questionnaire_id=questionnaires.id and a.supplier_id=public.current_supplier_id()));

-- Organization staff may resolve supplier-user IDs only inside their own organization.
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (
  id=auth.uid()
  or (organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager'))
  or (role='supplier_user' and public.current_app_role() in ('org_admin','org_manager') and exists(select 1 from public.suppliers s where s.id=profiles.supplier_id and s.organization_id=public.current_org_id()))
);

-- Assignment notifications are created by organization staff for supplier users.
drop policy if exists "staff create assignment notifications" on public.notifications;
create policy "staff create assignment notifications" on public.notifications for insert
with check (exists(select 1 from public.assignments a join public.suppliers s on s.id=a.supplier_id where a.id=assignment_id and s.organization_id=public.current_org_id() and public.current_app_role() in ('org_admin','org_manager') and exists(select 1 from public.profiles p where p.id=recipient_user_id and p.supplier_id=a.supplier_id and p.role='supplier_user')));

create or replace function public.question_is_visible(p_question_id uuid,p_response_id uuid) returns boolean
language plpgsql stable security definer set search_path=public as $$
declare c jsonb; parent_value jsonb; parent_text text; expected text; op text; numeric_parent numeric; numeric_expected numeric;
begin
  select condition into c from public.questions where id=p_question_id;
  if c is null then return true; end if;
  select value into parent_value from public.answers where response_id=p_response_id and question_id=(c->>'dependsOn')::uuid;
  if parent_value is null then return false; end if;
  parent_text := coalesce(parent_value #>> '{}', parent_value::text); expected := c->>'value'; op := c->>'operator';
  if op='equals' then return parent_text=expected or lower(parent_text)=lower(expected);
  elsif op='not_equals' then return not (parent_text=expected or lower(parent_text)=lower(expected));
  elsif op='contains' then return parent_value::text ilike '%'||expected||'%';
  elsif op in ('greater_than','less_than') then
    begin numeric_parent := parent_text::numeric; numeric_expected := expected::numeric; exception when others then return false; end;
    if op='greater_than' then return numeric_parent>numeric_expected; else return numeric_parent<numeric_expected; end if;
  end if;
  return false;
end; $$;
create or replace function public.guard_supplier_response() returns trigger
language plpgsql security definer set search_path=public as $$
declare assignment_supplier uuid; existing_status text; target_assignment uuid;
begin
  target_assignment := case when tg_op='DELETE' then old.assignment_id else new.assignment_id end;
  select supplier_id into assignment_supplier from public.assignments where id=target_assignment;
  if public.current_app_role()='supplier_user' and assignment_supplier is distinct from public.current_supplier_id() then raise exception 'You cannot modify another supplier response.'; end if;
  if tg_op in ('UPDATE','DELETE') then
    select status into existing_status from public.responses where id=old.id;
    if existing_status='submitted' and public.current_app_role()='supplier_user' then raise exception 'Submitted responses cannot be edited or deleted.'; end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  if new.status='submitted' then
    if exists(select 1 from public.questions q join public.assignments a on a.questionnaire_version_id=q.questionnaire_version_id where a.id=new.assignment_id and q.required=true and public.question_is_visible(q.id,new.id) and not exists(select 1 from public.answers an where an.response_id=new.id and an.question_id=q.id and an.value is not null and an.value <> 'null'::jsonb and an.value <> '""'::jsonb)) then
      raise exception 'Please answer all required questions that apply to this assignment.';
    end if;
    new.submitted_at=coalesce(new.submitted_at,now());
  end if;
  return new;
end; $$;
create trigger responses_guard before insert or update on public.responses for each row execute function public.guard_supplier_response();

create or replace function public.guard_supplier_answer() returns trigger
language plpgsql security definer set search_path=public as $$
declare response_status text; response_owner uuid; assigned_version uuid; question_version uuid; target_response uuid;
begin
  target_response := case when tg_op='DELETE' then old.response_id else new.response_id end;
  select r.status,a.supplier_id,a.questionnaire_version_id into response_status,response_owner,assigned_version
    from public.responses r join public.assignments a on a.id=r.assignment_id where r.id=target_response;
  if public.current_app_role()='supplier_user' and response_owner is distinct from public.current_supplier_id() then raise exception 'You cannot modify another supplier response.'; end if;
  if tg_op<>'DELETE' then
    select questionnaire_version_id into question_version from public.questions where id=new.question_id;
    if question_version is distinct from assigned_version then raise exception 'Answer question does not belong to the assigned questionnaire version.'; end if;
  end if;
  if public.current_app_role()='supplier_user' and response_status='submitted' then raise exception 'Submitted answers cannot be changed.'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end; $$;
create trigger answers_guard before insert or update or delete on public.answers for each row execute function public.guard_supplier_answer();

-- Prevent assignments from pairing a supplier and product that are not linked within the same organization.

-- Published questionnaire versions are immutable, preserving the exact form assigned to each supplier.
create or replace function public.guard_published_question_version() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if tg_op='DELETE' then
    if old.published_at is not null or exists(select 1 from public.assignments where questionnaire_version_id=old.id) then raise exception 'Published or assigned questionnaire versions cannot be deleted.'; end if;
    return old;
  end if;
  if old.published_at is not null and (new.published_at is distinct from old.published_at or new.questionnaire_id is distinct from old.questionnaire_id or new.version is distinct from old.version) then raise exception 'Published questionnaire versions are immutable.'; end if;
  return new;
end; $$;
drop trigger if exists questionnaire_versions_lock on public.questionnaire_versions;
create trigger questionnaire_versions_lock before update or delete on public.questionnaire_versions for each row execute function public.guard_published_question_version();

create or replace function public.guard_published_question() returns trigger
language plpgsql security definer set search_path=public as $$
declare version_id uuid; published_at timestamptz;
begin
  version_id := case when tg_op='DELETE' then old.questionnaire_version_id else new.questionnaire_version_id end;
  select v.published_at into published_at from public.questionnaire_versions v where v.id=version_id;
  if published_at is not null or exists(select 1 from public.assignments where questionnaire_version_id=version_id) then raise exception 'Questions in published or assigned versions cannot be changed.'; end if;
  if tg_op='UPDATE' then select v.published_at into published_at from public.questionnaire_versions v where v.id=old.questionnaire_version_id; if published_at is not null or exists(select 1 from public.assignments where questionnaire_version_id=old.questionnaire_version_id) then raise exception 'Questions in published or assigned versions cannot be moved.'; end if; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end; $$;
drop trigger if exists questions_lock on public.questions;
create trigger questions_lock before insert or update or delete on public.questions for each row execute function public.guard_published_question();
create or replace function public.validate_assignment_scope() returns trigger
language plpgsql security definer set search_path=public as $$
declare supplier_org uuid; product_org uuid; version_org uuid; version_published timestamptz; questionnaire_state public.questionnaire_status; linked boolean;
begin
  select organization_id into supplier_org from public.suppliers where id=new.supplier_id;
  select organization_id into product_org from public.products where id=new.product_id;
  select q.organization_id,v.published_at,q.status into version_org,version_published,questionnaire_state from public.questionnaire_versions v join public.questionnaires q on q.id=v.questionnaire_id where v.id=new.questionnaire_version_id;
  select exists(select 1 from public.supplier_products where supplier_id=new.supplier_id and product_id=new.product_id) into linked;
  if supplier_org is null or product_org is null or version_org is null or supplier_org <> product_org or supplier_org <> version_org or not linked or version_published is null or questionnaire_state <> 'published' then raise exception 'The selected product is not linked to this supplier in the same organization.'; end if;
  return new;
end; $$;
drop trigger if exists assignments_validate_scope on public.assignments;
create or replace function public.guard_supplier_assignment_update() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if public.current_app_role()='supplier_user' then
    if old.supplier_id is distinct from new.supplier_id or old.product_id is distinct from new.product_id or old.questionnaire_version_id is distinct from new.questionnaire_version_id or old.deadline is distinct from new.deadline or old.created_by is distinct from new.created_by then
      raise exception 'Supplier users cannot change assignment details.';
    end if;
    if old.status not in ('pending','in_progress') or new.status not in ('in_progress','submitted') then
      raise exception 'This assignment can no longer be updated.';
    end if;
    if new.status='submitted' and not exists(select 1 from public.responses r where r.assignment_id=new.id and r.status='submitted') then raise exception 'Submit the response before completing this assignment.'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists assignments_supplier_guard on public.assignments;
create trigger assignments_supplier_guard before update on public.assignments for each row execute function public.guard_supplier_assignment_update();
create trigger assignments_validate_scope before insert or update of supplier_id,product_id on public.assignments for each row execute function public.validate_assignment_scope();


-- Supabase API permissions: authenticated sessions may reach the tables, while RLS controls every row.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
