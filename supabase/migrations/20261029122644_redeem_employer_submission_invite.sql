create or replace function public.redeem_employer_submission_invite(
  p_token_hash text,
  p_contact_name text,
  p_contact_email text,
  p_organisation_name text,
  p_role_title text,
  p_salary_text text,
  p_closing_date date,
  p_location_text text,
  p_workplace_type text,
  p_role_summary text,
  p_application_url text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  invitation public.submission_invites%rowtype;
  submission_id bigint;
begin
  select submission_invites.*
  into invitation
  from public.submission_invites
  where submission_invites.token_hash = p_token_hash
  for update;

  if invitation.id is null
    or invitation.used_at is not null
    or invitation.revoked_at is not null
    or invitation.expires_at <= now()
    or lower(btrim(invitation.invitee_email)) <> lower(btrim(p_contact_email))
  then
    return null;
  end if;

  insert into public.employer_submissions (
    invite_id,
    matched_employer_id,
    contact_name,
    contact_email,
    organisation_name,
    role_title,
    salary_text,
    closing_date,
    location_text,
    workplace_type,
    role_summary,
    application_url,
    authority_confirmed_at,
    completeness_score
  )
  values (
    invitation.id,
    invitation.employer_id,
    btrim(p_contact_name),
    lower(btrim(invitation.invitee_email)),
    btrim(p_organisation_name),
    btrim(p_role_title),
    btrim(p_salary_text),
    p_closing_date,
    btrim(p_location_text),
    p_workplace_type,
    btrim(p_role_summary),
    btrim(p_application_url),
    now(),
    100
  )
  returning id into submission_id;

  update public.submission_invites
  set used_at = now()
  where id = invitation.id;

  return submission_id;
end;
$$;

revoke all on function public.redeem_employer_submission_invite(
  text, text, text, text, text, text, date, text, text, text, text
) from public, anon, authenticated;

grant execute on function public.redeem_employer_submission_invite(
  text, text, text, text, text, text, date, text, text, text, text
) to service_role;
