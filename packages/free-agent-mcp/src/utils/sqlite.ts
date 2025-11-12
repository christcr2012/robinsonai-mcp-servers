let cachedModule: any | null = null;
let cachedError: Error | null = null;

export function loadBetterSqlite() {
  if (cachedModule !== null || cachedError !== null) {
    return { Database: cachedModule, error: cachedError };
  }

  // CJS has require built-in
  try {
    const mod = require('better-sqlite3');
    cachedModule = mod?.default ?? mod;
    return { Database: cachedModule, error: null };
  } catch (error: any) {
    cachedError = error instanceof Error ? error : new Error(String(error));
    return { Database: null, error: cachedError };
  }
}
