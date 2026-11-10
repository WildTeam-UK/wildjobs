import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, expect, it } from "vitest";
import { postingCard } from "../lib/source-posting";

const db = new PGlite();
const migration = (name: string) =>
  readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
beforeAll(async () => {
  await db.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema private;create table auth.users(id uuid primary key);create table public.employers(name text,logo_url text);",
  );
  const base = await migration("20261101135945_create_feed_directory");
  await db.exec(base.split("create table public.directory_saved_jobs")[0]);
  await db.exec(
    "create table public.directory_saved_jobs(user_id uuid,job_id bigint,saved_at timestamptz default now(),primary key(user_id,job_id));alter table public.directory_jobs add column closes_at timestamptz;",
  );
  await db.exec(await migration("20261101224153_self_service_directory_sources"));
  await db.exec(await migration("20261101225639_duplicate_advert_location_matching"));
  await db.exec(await migration("20261109141022_career_page_sources"));
  // Baseline grants normally follow the directory tables in the original full migration.
  await db.exec(
    "grant all on public.directory_jobs,public.directory_organisations,public.directory_settings,public.directory_runs,public.directory_saved_jobs to service_role;grant usage,select on all sequences in schema public to service_role;",
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
async function saved(name: string) {
  const result = await db.query<{ id: number }>("select public.save_directory_source($1,$2,$3) as id", [
    `https://${name}.example.org/jobs`,
    name,
    JSON.stringify({ kind: "html", intervalHours: 12 }),
  ]);
  return result.rows[0].id;
}
async function enable(id: number) {
  await db.query('select public.record_directory_source_check($1,1,\'{"complete":true,"count":1}\')', [id]);
  await db.query("select public.change_directory_source($1,'resume',null,true)", [id]);
}
const card = postingCard({
  url: "https://employer.example.org/jobs/1",
  title: "Ecologist",
  organisation: "Nature Trust",
  description: "Survey woodland habitats and lead a team of volunteers.",
  location: "London",
});
card.source_content_kind = "advert";
async function imported(
  id: number,
  revision: number,
  items = [card],
  check: object = { complete: true, count: items.length },
) {
  const result = await db.query<{ result: Record<string, unknown> }>(
    "select public.import_directory_source($1,$2,$3,$4) as result",
    [id, revision, JSON.stringify(items), JSON.stringify(check)],
  );
  return result.rows[0].result;
}
it("keeps sources and audit history inaccessible to anonymous and ordinary authenticated clients", async () => {
  const permissions = await db.query<{ rls: boolean; readable: boolean; callable: boolean }>(
    "select relrowsecurity as rls,has_table_privilege('authenticated','public.directory_source_events','SELECT') as readable,has_function_privilege('anon','public.import_directory_source(bigint,integer,jsonb,jsonb)','EXECUTE') as callable from pg_class where oid='public.directory_source_events'::regclass",
  );
  expect(permissions.rows[0]).toEqual({ rls: true, readable: false, callable: false });
});

it("allows the existing automation role to use the invoker functions without public access", async () => {
  await db.exec("set role service_role");
  try {
    const id = await saved("service-role");
    await enable(id);
    expect(await imported(id, 2)).toMatchObject({ seen: 1 });
    const pending = await db.query<{ jobs: { source_content_kind: string; feed_text: string }[] }>(
      "select public.directory_pending_source_jobs() as jobs",
    );
    expect(pending.rows[0].jobs[0]).toMatchObject({
      source_content_kind: "advert",
      feed_text: card.feed_text,
    });
  } finally {
    await db.exec("reset role");
  }
});
it("saves untested sources paused and requires both a successful check and source review", async () => {
  const id = await saved("unreviewed");
  await expect(db.query("select public.change_directory_source($1,'resume')", [id])).rejects.toThrow(
    "Check the source successfully",
  );
  await db.query('select public.record_directory_source_check($1,1,\'{"complete":true,"count":1}\')', [id]);
  await expect(db.query("select public.change_directory_source($1,'resume')", [id])).rejects.toThrow(
    "Confirm the source access",
  );
  const result = await imported(id, 1);
  expect(result.superseded).toBe(true);
});
it("rejects incomplete snapshots, preserves job IDs and dates, and ignores outdated configuration revisions", async () => {
  const id = await saved("complete");
  await enable(id);
  expect(await imported(id, 2)).toMatchObject({ seen: 1, changed: 1 });
  const original = (
    await db.query<{ id: number; posted_at: Date }>(
      "select id,posted_at from public.directory_jobs where is_active",
    )
  ).rows[0];
  await expect(imported(id, 2, [], { complete: false, count: 0 })).rejects.toThrow("Only complete");
  await expect(imported(id, 2, [], { complete: true })).rejects.toThrow("Only complete");
  await expect(
    db.query("select public.import_directory_source($1,2,'null','{\"complete\":true,\"count\":0}')", [id]),
  ).rejects.toThrow("Only complete");
  expect(await imported(id, 2)).toMatchObject({ changed: 0 });
  expect(
    (await db.query("select id,posted_at from public.directory_jobs where id=$1", [original.id])).rows[0],
  ).toEqual(original);
  await db.query("select public.save_directory_source($1,'Changed',$2,'',$3)", [
    "https://complete.example.org/new-jobs",
    JSON.stringify({ kind: "html", intervalHours: 24 }),
    id,
  ]);
  expect((await imported(id, 2, [])).superseded).toBe(true);
  expect(
    (await db.query("select is_active from public.directory_jobs where id=$1", [original.id])).rows[0],
  ).toEqual({ is_active: true });
});
it("requires a second spaced empty observation and preserves a job supplied by another source", async () => {
  const a = await saved("empty-a"),
    b = await saved("empty-b");
  await enable(a);
  await enable(b);
  await imported(a, 2);
  await imported(b, 2);
  expect(await imported(a, 2, [])).toMatchObject({ awaiting_empty_confirmation: true });
  await db.query("update public.directory_sources set checked_at=now()-interval '16 minutes' where id=$1", [
    a,
  ]);
  expect(await imported(a, 2, [])).toMatchObject({ seen: 0 });
  const result = await db.query<{ present: boolean; active: boolean }>(
    "select l.is_present as present,j.is_active as active from public.directory_source_jobs l join public.directory_jobs j on j.id=l.job_id where l.source_id=$1",
    [b],
  );
  expect(result.rows[0]).toEqual({ present: true, active: true });
});
