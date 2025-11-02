// packages/thinking-tools-mcp/src/tools/ctx_web_search.ts
import { request } from "undici";
import { stripHtml } from "string-strip-html";

type SearchInput = {
  q: string;
  limit?: number;
};

export async function ctx_web_search({ q, limit = 5 }: SearchInput) {
  // Provider: Brave (BRAVE_API_KEY) or Serper (SERPER_API_KEY). Fallback: DuckDuckGo HTML
  const brave = process.env.BRAVE_API_KEY;
  if (brave) {
    const r = await request(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${limit}`, {
      headers: { "X-Subscription-Token": brave },
    });
    const json: any = await r.body.json();
    const items =
      json?.web?.results?.slice(0, limit).map((it: any) => ({
        title: it.title,
        url: it.url,
        snippet: stripHtml(it.description || "").result,
      })) || [];
    return { ok: true, provider: "brave", items };
  }

  const serper = process.env.SERPER_API_KEY;
  if (serper) {
    const r = await request("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serper, "content-type": "application/json" },
      body: JSON.stringify({ q, num: limit }),
    });
    const json: any = await r.body.json();
    const items =
      json?.organic?.slice(0, limit).map((it: any) => ({
        title: it.title,
        url: it.link,
        snippet: stripHtml(it.snippet || "").result,
      })) || [];
    return { ok: true, provider: "serper", items };
  }

  // Fallback (very basic)
  return { ok: false, provider: "none", items: [], message: "No web search provider configured." };
}

