import { createRequire } from 'module';

let cachedModule: any | null = null;
let cachedError: Error | null = null;

export function loadBetterSqlite() {
  if (cachedModule !== null || cachedError !== null) {
    return { Database: cachedModule, error: cachedError };
  }

  const require = createRequire(import.meta.url);
  try {
    const mod = require('better-sqlite3');
    cachedModule = mod?.default ?? mod;
    return { Database: cachedModule, error: null };
  } catch (error: any) {
    cachedError = error instanceof Error ? error : new Error(String(error));
    return { Database: null, error: cachedError };
  }
}
