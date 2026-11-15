-- Keep supplier evidence private and limit uploads to common assessment files.
update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg']
where id = 'supplier-evidence';

drop policy if exists "suppliers upload files for own file questions" on storage.objects;
create policy "suppliers upload files for own file questions"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'supplier-evidence'
  and exists (
    select 1
    from public.assignments a
    join public.questions q
      on q.questionnaire_version_id = a.questionnaire_version_id
    where a.id::text = (storage.foldername(storage.objects.name))[1]
      and q.id::text = (storage.foldername(storage.objects.name))[2]
      and q.question_type = 'file'
      and a.supplier_id = public.current_supplier_id()
      and a.status in ('pending', 'in_progress')
  )
);

drop policy if exists "users read authorized supplier evidence" on storage.objects;
create policy "users read authorized supplier evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'supplier-evidence'
  and exists (
    select 1
    from public.assignments a
    join public.suppliers s on s.id = a.supplier_id
    join public.questions q
      on q.questionnaire_version_id = a.questionnaire_version_id
    where a.id::text = (storage.foldername(storage.objects.name))[1]
      and q.id::text = (storage.foldername(storage.objects.name))[2]
      and q.question_type = 'file'
      and (
        a.supplier_id = public.current_supplier_id()
        or (
          s.organization_id = public.current_org_id()
          and public.current_app_role() in ('org_admin', 'org_manager')
        )
      )
  )
);