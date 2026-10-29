create policy "Source automation state is server only"
on public.source_import_automation
for all
to anon, authenticated
using (false)
with check (false);
