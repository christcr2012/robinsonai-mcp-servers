// packages/thinking-tools-mcp/src/tools/ctx_web_crawl_step.ts
import { request } from "undici";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import crypto from "crypto";
import { promises as fs } from "fs";
import { resolve } from "path";
import { normalize, resolveWorkspaceRoot } from "../lib/workspace.js";

type CrawlInput = { url: string };

export async function ctx_web_crawl_step({ url }: CrawlInput) {
  const r = await request(url);
  const html = await r.body.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  const text = (article?.textContent || "").trim();
  const title = article?.title || url;
  const id = crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);

  const root = resolveWorkspaceRoot();
  const dir = resolve(root, ".robctx/web");
  await fs.mkdir(dir, { recursive: true });
  const file = resolve(dir, `${id}.md`);
  await fs.writeFile(
    file,
    `# ${title}\n\n> ${url}\n\n${text}\n`,
    "utf8"
  );

  return { ok: true, url, file: normalize(file), title, chars: text.length };
}

