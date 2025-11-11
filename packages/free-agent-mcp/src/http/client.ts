/**
 * HTTP client with trusted URL validation
 * All requests go through assertTrustedUrl to prevent hallucinated endpoints
 */

import { assertTrustedUrl } from "./hosts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpOptions {
  method?: HttpMethod;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  base: string,
  path: string,
  query?: Record<string, any>
): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  const baseUrl = base.endsWith("/") ? base : base + "/";
  const u = new URL(p, baseUrl);

  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null) {
      u.searchParams.set(k, String(v));
    }
  }

  const fullUrl = u.toString();
  assertTrustedUrl(fullUrl);
  return fullUrl;
}

/**
 * Make HTTP request with validation and error handling
 */
export async function http(
  base: string,
  path: string,
  opts: HttpOptions = {}
): Promise<any> {
  const url = buildUrl(base, path, opts.query);
  const method = opts.method || (opts.body ? "POST" : "GET");
  const timeoutMs = opts.timeoutMs ?? 30000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        ...(opts.headers || {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText} @ ${url}\n${text.slice(0, 1800)}`
      );
    }

    return data;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`HTTP ${method} ${url} failed: ${err.message}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

