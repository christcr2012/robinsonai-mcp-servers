/**
 * Web Context module for Thinking Tools MCP
 * Writes artifacts under .robctx/web and returns machine-usable summaries.
 * Optional env keys: TAVILY_API_KEY, BING_SUBSCRIPTION_KEY, SERPAPI_KEY
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { request } from "undici";
import * as cheerio from "cheerio";
// @ts-ignore
import robotsParserModule from "robots-parser";
// @ts-ignore
import PQueueModule from "p-queue";
// @ts-ignore
import slugifyModule from "slugify";
// @ts-ignore
import { extract } from "@extractus/article-extractor";

// Handle default exports
const robotsParser = (robotsParserModule as any).default || robotsParserModule;
const PQueue = (PQueueModule as any).default || PQueueModule;
const slugify = (slugifyModule as any).default || slugifyModule;

type Json = Record<string, any>;

const OUT_BASE = ".robctx/web";
const UA = process.env.FETCH_UA || "Robinson-Context/1.0 (+https://example.local)";
const CONCURRENCY = Number(process.env.CTX_WEB_CONCURRENCY || "3");
const DELAY_MS = Number(process.env.CTX_WEB_DELAY_MS || "350");

function ensureDir(p: string) { return fs.mkdir(p, { recursive: true }); }
function nowIso() { return new Date().toISOString().replace(/[:.]/g,"-"); }
function safeSlug(s: string) { return slugify(s, { lower: true, strict: true }); }

async function writeArtifact(name: string, data: Json | string) {
  await ensureDir(OUT_BASE);
  const f = join(OUT_BASE, name);
  await fs.writeFile(f, typeof data === "string" ? data : JSON.stringify(data, null, 2), "utf8");
  return f;
}

async function httpGet(url: string) {
  const res = await request(url, { headers: { "user-agent": UA, "accept": "*/*" } });
  if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode} for ${url}`);
  const text = await res.body.text();
  return { text, headers: Object.fromEntries(Object.entries(res.headers).map(([k,v])=>[k, Array.isArray(v)?v.join(","):String(v)])) };
}

async function canCrawl(url: string) {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const { text } = await httpGet(robotsUrl);
    const robots = robotsParser(robotsUrl, text);
    return robots.isAllowed(url, UA) !== false;
  } catch {
    return true; // be permissive if robots fetch fails
  }
}

function pick<T>(arr: T[], n: number) { return arr.slice(0, Math.max(0, Math.min(n, arr.length))); }

async function extractLinks(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    let href = String($(el).attr("href") || "").trim();
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl).toString();
      links.add(abs);
    } catch {}
  });
  return Array.from(links);
}

/** Provider-neutral search facade (Tavily preferred for cost/quality) */
async function webSearch(query: string, maxResults: number, provider?: string) {
  provider = (provider || "").toLowerCase();
  const results: { url: string; title?: string; snippet?: string }[] = [];
  // 1) Tavily
  if (!provider || provider === "tavily") {
    const key = process.env.TAVILY_API_KEY;
    if (key) {
      const body = JSON.stringify({ query, search_depth: "advanced", max_results: maxResults });
      const res = await request("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
        body
      });
      const json = await res.body.json() as any;
      if (json?.results) {
        for (const r of json.results) results.push({ url: r.url, title: r.title, snippet: r.content });
      }
    }
  }
  // 2) Bing Web Search
  if (results.length === 0 && (!provider || provider === "bing")) {
    const key = process.env.BING_SUBSCRIPTION_KEY;
    if (key) {
      const url = new URL("https://api.bing.microsoft.com/v7.0/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", String(maxResults));
      const res = await request(url.toString(), { headers: { "Ocp-Apim-Subscription-Key": key } });
      const json = await res.body.json() as any;
      for (const w of json?.webPages?.value || []) {
        results.push({ url: w.url, title: w.name, snippet: w.snippet });
      }
    }
  }
  // 3) SerpAPI (Google)
  if (results.length === 0 && (!provider || provider === "serpapi")) {
    const key = process.env.SERPAPI_KEY;
    if (key) {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", query);
      url.searchParams.set("num", String(maxResults));
      url.searchParams.set("api_key", key);
      const res = await request(url.toString());
      const json = await res.body.json() as any;
      for (const r of json?.organic_results || []) {
        if (r.link) results.push({ url: r.link, title: r.title, snippet: r.snippet });
      }
    }
  }
  return pick(results, maxResults);
}

async function fetchAndExtract(url: string) {
  if (!(await canCrawl(url))) throw new Error(`robots.txt disallows: ${url}`);
  const { text, headers } = await httpGet(url);
  const article = await extract(url).catch(()=>null);
  const content = article?.content || "";
  const title = article?.title || "";
  const byline = article?.author || "";
  const summary = (content || text).split(/\.\s+/).slice(0, 3).join(". ") + ".";
  const links = await extractLinks(text, url);
  const slug = safeSlug((title || new URL(url).hostname).slice(0, 60));
  const ts = nowIso();

  const obj = { url, title, byline, headers, summary, content, links, fetched_at: ts };
  const jsonPath = await writeArtifact(`${slug}--${ts}.json`, obj);
  const md = `# ${title || url}\n\n**URL:** ${url}\n\n**Summary:** ${summary}\n\n---\n\n${content || ""}`;
  const mdPath = await writeArtifact(`${slug}--${ts}.md`, md);

  return { jsonPath, mdPath, links, meta: { url, title, byline, fetched_at: ts } };
}

/** Crawl step with domain constraint and politeness */
async function crawlStep(seeds: string[], opts: { maxPages: number; sameDomain?: boolean; provider?: string }) {
  const seen = new Set<string>();
  const out: any[] = [];
  const q = new PQueue({ concurrency: CONCURRENCY, interval: Math.max(DELAY_MS, 50), intervalCap: CONCURRENCY });

  const seedHosts = new Set(seeds.map(s => { try { return new URL(s).host } catch { return "" }}));

  async function enqueue(url: string) {
    if (seen.has(url) || out.length >= opts.maxPages) return;
    try {
      const u = new URL(url);
      if (opts.sameDomain && !seedHosts.has(u.host)) return;
    } catch { return; }
    seen.add(url);
    q.add(async () => {
      try {
        const item = await fetchAndExtract(url);
        out.push(item.meta);
        for (const nxt of item.links) {
          if (out.length < opts.maxPages) enqueue(nxt);
        }
      } catch {}
      await sleep(DELAY_MS);
    });
  }

  for (const s of seeds) enqueue(s);
  await q.onIdle();
  return out;
}

// ---------------- MCP tool bindings ----------------

type Tool = {
  name: string;
  description: string;
  inputSchema: Json;
  handler: (args: Json) => Promise<Json>;
};

export function getWebContextTools(): Tool[] {
  return [
    {
      name: "ctx_web_search",
      description: "Search the web and write a results file under .robctx/web",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          max_results: { type: "number", default: 8 },
          provider: { type: "string", enum: ["tavily","bing","serpapi"], nullable: true }
        },
        required: ["query"]
      },
      handler: async (args) => {
        const { query, max_results = 8, provider } = args;
        const items = await webSearch(query, Math.min(20, Number(max_results)||8), provider);
        const name = `search--${safeSlug(query).slice(0,60)}--${nowIso()}.json`;
        const path = await writeArtifact(name, { query, provider: provider||"auto", items });
        return { ok: true, results_path: path, count: items.length };
      }
    },
    {
      name: "ctx_web_fetch",
      description: "Fetch and extract a single URL into .robctx/web as JSON + MD",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"]
      },
      handler: async (args) => {
        const { url } = args;
        const res = await fetchAndExtract(url);
        return { ok: true, json_path: res.jsonPath, md_path: res.mdPath, links: res.links };
      }
    },
    {
      name: "ctx_web_crawl_step",
      description: "Crawl up to N pages from one or more seeds (same-domain optional), polite rate limits",
      inputSchema: {
        type: "object",
        properties: {
          seeds: { type: "array", items: { type: "string" } },
          max_pages: { type: "number", default: 20 },
          same_domain: { type: "boolean", default: true }
        },
        required: ["seeds"]
      },
      handler: async (args) => {
        const seeds: string[] = Array.isArray(args.seeds) ? args.seeds : [String(args.seeds)];
        const max = Math.min(100, Number(args.max_pages)||20);
        const same = Boolean(args.same_domain ?? true);
        const items = await crawlStep(seeds, { maxPages: max, sameDomain: same });
        const name = `crawl--${safeSlug(seeds[0]).slice(0,40)}--${nowIso()}.json`;
        const path = await writeArtifact(name, { seeds, max, same_domain: same, items });
        return { ok: true, crawl_path: path, count: items.length };
      }
    }
  ];
}

