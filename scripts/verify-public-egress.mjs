import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

// Entirely synthetic Supabase. No credentials, requests or writes reach production.
// Rebuild normally after this check: Next inlines this fixture's public URL.
const apiPort = 3111;
const appPort = 3112;
const base = `http://127.0.0.1:${appPort}`;
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${apiPort}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_fixture",
  SUPABASE_SECRET_KEY: "sb_secret_local_fixture",
  OPENAI_API_KEY: "local-fixture-never-used",
  AUTOMATION_SECRET: "local-egress-verification",
  NEXT_PUBLIC_GTM_ID: "",
  VERCEL_ENV: "preview",
  VERCEL_DEPLOYMENT_ID: `egress-fixture-${Date.now()}`,
  NODE_ENV: "production",
};
let reads = 0;
let writes = 0;
let failRun = false;
let title = "Egress fixture ecologist";
const now = new Date();
const jobs = Array.from({ length: 201 }, (_, index) => ({
  id: index + 1,
  slug: `fixture-${index + 1}`,
  title: index ? `Fixture ranger ${index + 1}` : title,
  organisation_name: "Fixture Nature Trust",
  summary: "Restore habitats and monitor wildlife.",
  summary_source: "source",
  location_text: "Exeter",
  locality: "Exeter",
  region: "Devon",
  country_code: "GB",
  workplace: "On-site",
  hours_type: "Full time",
  contract_type: "Permanent",
  engagement_type: "Paid",
  salary_text: "£30,000 per year",
  sector_slugs: ["conservation-wildlife"],
  course_slugs: [],
  skill_slugs: [],
  benefit_slugs: [],
  posted_at: new Date(now.valueOf() - index * 60_000).toISOString(),
  first_seen_at: now.toISOString(),
  updated_at: now.toISOString(),
  closes_at: new Date(now.valueOf() + 86400_000).toISOString(),
  is_active: true,
  merged_into: null,
  source_name: "Fixture source",
  source_url: `https://example.invalid/jobs/${index + 1}`,
  feed_text: "Full time ecologist monitoring species and restoring habitats.",
  feed_hash: "fixture-hash",
  salary_full_time_evidence: true,
  salary_evidence_hash: "fixture-hash",
}));
const api = createServer(async (request, response) => {
  const url = new URL(request.url, env.NEXT_PUBLIC_SUPABASE_URL);
  let data = [];
  if (request.method === "GET" || request.method === "HEAD") {
    reads++;
    if (url.pathname === "/rest/v1/directory_jobs") {
      data = jobs.map((job, index) => ({ ...job, title: index ? job.title : title }));
    } else if (url.pathname === "/rest/v1/directory_organisations") {
      data = [{ name: "Fixture Nature Trust", logo_url: null, website_url: null }];
    } else if (url.pathname === "/rest/v1/career_areas") {
      data = [
        {
          id: 1,
          slug: "conservation-wildlife",
          title: "Wildlife Conservation",
          description: "Conservation work",
          display_order: 1,
        },
      ];
    }
    const idFilter = url.searchParams.get("id");
    if (idFilter?.startsWith("in.(")) {
      const ids = new Set(idFilter.slice(4, -1).split(",").map(Number));
      data = data.filter((row) => ids.has(row.id));
    } else if (idFilter?.startsWith("eq.")) data = data.filter((row) => row.id === Number(idFilter.slice(3)));
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? data.length);
    data = data.slice(offset, offset + limit);
    if (url.searchParams.get("select")) {
      const fields = url.searchParams.get("select").split(",");
      if (!fields.includes("*"))
        data = data.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
    }
    if (request.headers.accept?.includes("vnd.pgrst.object")) data = data[0] ?? null;
  } else {
    writes++;
    // Drain the request body without forwarding or logging it.
    for await (const _chunk of request) {
      /* local fixture only */
    }
    if (url.pathname === "/rest/v1/rpc/claim_directory_run") data = true;
    else if (url.pathname === "/rest/v1/directory_runs" && request.method === "POST") data = { id: 1 };
    else if (url.pathname === "/rest/v1/rpc/directory_pending_source_jobs") {
      if (failRun) {
        response
          .writeHead(500, { "content-type": "application/json" })
          .end(JSON.stringify({ code: "57014", message: "Fixture failure after partial import" }));
        return;
      }
      data = [];
    } else data = null;
  }
  response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(data));
});

function command(args) {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return child;
}
await new Promise((resolve, reject) => {
  api.once("error", reject);
  api.listen(apiPort, "127.0.0.1", resolve);
});
let app;
let logs = "";
try {
  const build = command(["build"]);
  let buildOutput = "";
  for (const stream of [build.stdout, build.stderr])
    stream.on("data", (chunk) => {
      buildOutput += chunk;
    });
  const buildCode = await new Promise((resolve) => build.on("exit", resolve));
  assert.equal(buildCode, 0, buildOutput.slice(-6000));
  app = command(["start", "--hostname", "127.0.0.1", "--port", String(appPort)]);
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (chunk) => {
      logs += chunk;
    });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(`${base}/robots.txt`);
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.ok(ready, logs);
  const first = await fetch(base);
  assert.equal(first.status, 200, logs);
  assert.match(await first.text(), /Egress fixture ecologist/);
  const baseline = reads;
  for (let visit = 0; visit < 20; visit++) {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Egress fixture ecologist/);
  }
  assert.equal(reads, baseline, logs);
  console.log(JSON.stringify({ check: "20_warm_home_visits", additionalDatabaseReads: reads - baseline }));

  const guide = `${base}/conservation-career-guides/ecologist`;
  const firstGuide = await fetch(guide);
  assert.equal(firstGuide.status, 200, logs);
  const guideBody = await firstGuide.text();
  assert.match(guideBody, /Ecologist/);
  assert.match(guideBody, /Egress fixture ecologist/);
  assert.match(guideBody, /Apply via Fixture source/);
  const guideReads = reads;
  for (let visit = 0; visit < 10; visit++) {
    const response = await fetch(guide);
    assert.equal(response.status, 200);
    await response.text();
  }
  assert.equal(reads, guideReads, logs);
  console.log(JSON.stringify({ check: "10_warm_guide_visits", additionalDatabaseReads: reads - guideReads }));

  const unauthorized = await fetch(`${base}/api/automation/feed`, { method: "POST" });
  assert.equal(unauthorized.status, 401);
  assert.equal(writes, 0);
  title = "Updated fixture ecologist";
  const run = await fetch(`${base}/api/automation/feed`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.AUTOMATION_SECRET}` },
  });
  assert.equal(run.status, 200, await run.text());
  const afterImport = await fetch(base);
  assert.match(await afterImport.text(), /Updated fixture ecologist/);
  console.log(JSON.stringify({ check: "automation_invalidates_public_data", productionWrites: 0 }));

  title = "Recovered partial import ecologist";
  failRun = true;
  const partial = await fetch(`${base}/api/automation/feed`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.AUTOMATION_SECRET}` },
  });
  assert.equal(partial.status, 500);
  assert.match(await (await fetch(base)).text(), /Recovered partial import ecologist/);
  assert.doesNotMatch(logs, /invariant|Failed to set|cache invalidation failed/i);
  console.log(JSON.stringify({ check: "partial_run_also_invalidates", productionWrites: 0 }));
} finally {
  app?.kill("SIGTERM");
  api.closeAllConnections();
  await new Promise((resolve) => api.close(resolve));
}
