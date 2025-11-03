// packages/thinking-tools-mcp/src/lib/websearch.ts
import * as cheerio from "cheerio";

export type WebHit = { title: string; url: string; snippet?: string; score?: number };

async function searchDuckDuckGo(q: string): Promise<WebHit[]> {
  const res = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
    headers: { "user-agent": "Mozilla/5.0" }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const out: WebHit[] = [];
  $("a.result__a").each((_, a) => {
    const title = $(a).text();
    const url = $(a).attr("href") || "";
    const snippet = $(a).parent().find(".result__snippet").text();
    if (url) out.push({ title, url, snippet, score: 0.5 });
  });
  return out.slice(0, 10);
}

async function searchBrave(q: string): Promise<WebHit[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return [];
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}`, {
    headers: { "Accept": "application/json", "X-Subscription-Token": key }
  });
  if (!r.ok) return [];
  const j:any = await r.json();
  return (j.web?.results || []).map((x:any)=>({ title:x.title, url:x.url, snippet:x.description, score:x.languageScore ?? 0.7 })).slice(0,10);
}

async function searchBing(q: string): Promise<WebHit[]> {
  const key = process.env.BING_V7_KEY;
  const endpoint = process.env.BING_V7_ENDPOINT || "https://api.bing.microsoft.com/v7.0/search";
  if (!key) return [];
  const r = await fetch(`${endpoint}?q=${encodeURIComponent(q)}&textDecorations=false&answerCount=10`, {
    headers: { "Ocp-Apim-Subscription-Key": key }
  });
  if (!r.ok) return [];
  const j:any = await r.json();
  return (j.webPages?.value || []).map((x:any)=>({ title:x.name, url:x.url, snippet:x.snippet, score: x.rank ?? 0.8 })).slice(0,10);
}

async function searchSerpAPI(q: string): Promise<WebHit[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];
  const r = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&num=10&api_key=${key}`);
  if (!r.ok) return [];
  const j:any = await r.json();
  return (j.organic_results || []).map((x:any)=>({ title:x.title, url:x.link, snippet:x.snippet, score: x.position ? 1 - x.position/10 : 0.6 }));
}

export async function webSearchAll(q: string): Promise<WebHit[]> {
  const sources = await Promise.all([
    searchBrave(q),
    searchBing(q),
    searchSerpAPI(q)
  ]);
  const paid = sources.flat().slice(0, 10);
  if (paid.length) return paid;
  return await searchDuckDuckGo(q); // free fallback
}

