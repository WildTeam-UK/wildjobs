alter table public.employer_field_evidence
drop constraint employer_field_evidence_field_valid;

alter table public.employer_field_evidence
add constraint employer_field_evidence_field_valid check (
  field_name in (
    'website_url',
    'logo_url',
    'focus',
    'mission',
    'overview',
    'ai_summary',
    'culture',
    'locations',
    'benefits'
  )
);
