begin;
select no_plan();
set local role service_role;
insert into public.career_guide_revisions(guide_slug,input_hash,content,evidence)
select slug,'sector-catalogue-test-'||slug,'{}','{}'
from unnest(array['carbon-climate-energy','ecology','environmental-education','environmental-management','food-farming-horticulture','marine-conservation','policy-campaigning','rivers-water-hydrology','sustainability','sustainable-transport']) as slug;
select is((select count(*) from public.career_guide_revisions where input_hash like 'sector-catalogue-test-%'),10::bigint,'Every remaining sector supports a private evidence draft');
reset role;
set local role anon;
select is((select count(*) from public.career_guide_revisions where input_hash like 'sector-catalogue-test-%'),0::bigint,'New sector drafts remain private');
select throws_ok($$select public.publish_career_guide(1,'test')$$,'42501',null,'Visitors cannot approve a sector guide');
reset role;
set local role service_role;
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='sector-catalogue-test-ecology'),'sector-catalogue-test-ecology'),true,'The existing atomic review action publishes a sector guide');
reset role;
set local role anon;
select is((select count(*) from public.career_guide_revisions where input_hash like 'sector-catalogue-test-%'),1::bigint,'Only the approved new sector is public');
reset role;
select * from finish();
rollback;
