-- Original academic files stay private to the account whose UUID prefixes the path.
insert into storage.buckets (id, name, public, file_size_limit)
values ('academic-originals', 'academic-originals', false, 52428800)
on conflict (id) do nothing;

create policy "academic_originals_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'academic-originals' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "academic_originals_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'academic-originals' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "academic_originals_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'academic-originals' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'academic-originals' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "academic_originals_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'academic-originals' and (storage.foldername(name))[1] = (select auth.uid())::text);
