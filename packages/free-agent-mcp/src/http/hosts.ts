/**
 * Trusted hosts configuration
 * Prevents hallucinated URLs by maintaining a whitelist of allowed hosts
 */

export const HOSTS = {
  apiRoot: process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud",
  qdrant: process.env.QDRANT_URL || "http://localhost:6333",
  neo4j: process.env.NEO4J_HTTP_URL || "http://localhost:7474",
  langchain: process.env.LANGCHAIN_API || "http://localhost:8080",
};

/**
 * Build set of trusted hosts from configuration
 */
const TRUSTED = new Set(
  Object.values(HOSTS).map((base) => {
    try {
      return new URL(base).host;
    } catch {
      console.warn(`[hosts] Invalid URL: ${base}`);
      return "";
    }
  }).filter(Boolean)
);

/**
 * Assert that a URL is from a trusted host
 * Throws if URL host is not in the whitelist
 */
export function assertTrustedUrl(u: string): void {
  try {
    const host = new URL(u).host;
    if (!TRUSTED.has(host)) {
      throw new Error(`Untrusted URL host: ${host}. Allowed: ${Array.from(TRUSTED).join(", ")}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Untrusted")) throw err;
    throw new Error(`Invalid URL: ${u}`);
  }
}

