import "server-only";

import OpenAI from "openai";

import { requireEnvironmentValue } from "@/lib/environment";

let client: OpenAI | undefined;
let courseTaxonomyClient: OpenAI | undefined;

export function getOpenAIClient() {
  if (!client) {
    const apiKey = requireEnvironmentValue("OPENAI_API_KEY", process.env.OPENAI_API_KEY);
    client = new OpenAI({ apiKey, maxRetries: 0, timeout: 20_000 });
  }
  return client;
}

export function getCourseTaxonomyOpenAI() {
  if (process.env.OPENAI_API_KEY) {
    return { client: getOpenAIClient(), model: "gpt-6-luna" } as const;
  }

  const oidcToken = requireEnvironmentValue("VERCEL_OIDC_TOKEN", process.env.VERCEL_OIDC_TOKEN);
  if (!courseTaxonomyClient) {
    courseTaxonomyClient = new OpenAI({
      apiKey: oidcToken,
      baseURL: "https://ai-gateway.vercel.sh/v1",
      maxRetries: 0,
      timeout: 20_000,
    });
  }
  return { client: courseTaxonomyClient, model: "openai/gpt-6-luna" } as const;
}
