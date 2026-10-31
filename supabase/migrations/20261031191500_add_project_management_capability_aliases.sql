insert into public.capability_aliases (capability_id, alias, provenance)
select capabilities.id, aliases.alias, 'staff'
from public.capabilities
cross join (
  values
    ('programme delivery'),
    ('programme management'),
    ('project coordination')
) as aliases(alias)
where capabilities.slug = 'project-management'
on conflict (normalised_alias) do nothing;
