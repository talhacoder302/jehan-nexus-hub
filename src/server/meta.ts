import "server-only";
import { createHmac } from "node:crypto";
import { features, serverEnv } from "@/lib/env";
import {
  backoffMs,
  isRetryableMetaError,
  normalizeAdAccountId,
  type MetaInsightRow,
} from "@/lib/meta-mapper";

/**
 * Minimal typed client for the Meta Graph / Marketing API. Uses a system user token from the
 * environment, sent as an Authorization header (never in URLs or logs, never sent to the browser),
 * with appsecret_proof when META_APP_SECRET is set.
 */

const DEFAULT_VERSION = "v24.0";
const GRAPH = "https://graph.facebook.com";

export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
    readonly subcode?: number,
    readonly fbtraceId?: string,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
  get retryable() {
    return isRetryableMetaError(this.code, this.status);
  }
}

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
}

interface Paged<T> {
  data: T[];
  paging?: { next?: string; cursors?: { after?: string } };
}

export function isMetaConfigured() {
  return features().meta;
}

function credentials() {
  const env = serverEnv();
  if (!env.META_SYSTEM_USER_TOKEN) throw new Error("Meta is not configured");
  const token = env.META_SYSTEM_USER_TOKEN;
  const proof = env.META_APP_SECRET
    ? createHmac("sha256", env.META_APP_SECRET).update(token).digest("hex")
    : undefined;
  return { token, proof, version: env.META_API_VERSION ?? DEFAULT_VERSION };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with retries on rate limits and transient errors. `deadline` (epoch ms) stops retrying
 * early so a serverless invocation never runs past its time limit.
 */
async function graphGet<T>(url: URL, opts: { deadline: number; maxRetries?: number }): Promise<T> {
  const { token, proof } = credentials();
  if (proof && !url.searchParams.has("appsecret_proof"))
    url.searchParams.set("appsecret_proof", proof);
  const maxRetries = opts.maxRetries ?? 4;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) return (await res.json()) as T;

    const body = (await res.json().catch(() => ({}))) as GraphErrorBody;
    const err = new MetaApiError(
      body.error?.message ?? `Meta API request failed (${res.status})`,
      res.status,
      body.error?.code,
      body.error?.error_subcode,
      body.error?.fbtrace_id,
    );
    const wait = backoffMs(attempt);
    if (!err.retryable || attempt >= maxRetries || Date.now() + wait > opts.deadline) throw err;
    await sleep(wait);
  }
}

const INSIGHT_FIELDS = [
  "campaign_id",
  "campaign_name",
  "spend",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "action_values",
  "purchase_roas",
].join(",");

/**
 * Daily campaign-level insights for one ad account, following pagination.
 * `since`/`until` are inclusive YYYY-MM-DD dates in the ad account's timezone.
 */
export async function fetchCampaignInsights(
  adAccountId: string,
  since: string,
  until: string,
  deadline: number,
): Promise<MetaInsightRow[]> {
  const { version } = credentials();
  let url: URL | null = new URL(
    `${GRAPH}/${version}/act_${normalizeAdAccountId(adAccountId)}/insights`,
  );
  url.searchParams.set("level", "campaign");
  url.searchParams.set("fields", INSIGHT_FIELDS);
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("limit", "500");

  const rows: MetaInsightRow[] = [];
  let pages = 0;
  while (url) {
    const page: Paged<MetaInsightRow> = await graphGet<Paged<MetaInsightRow>>(url, { deadline });
    rows.push(...page.data);
    pages++;
    url = page.paging?.next && pages < 50 ? new URL(page.paging.next) : null;
  }
  return rows;
}
