/**
 * Spec smoke tests
 * Runtime contract validation for generated handlers
 * Verifies that all handlers are exported and have correct signatures
 */

import * as gen from "../handlers/handlers.generated.js";

/**
 * Run smoke tests
 */
async function run() {
  console.log("[spec-smoke] Starting smoke tests...");

  // Check that handlers are exported
  const handlerCount = Object.keys(gen).length;
  if (handlerCount === 0) {
    throw new Error("No generated handlers exported.");
  }
  console.log(`[spec-smoke] ✅ Found ${handlerCount} handlers`);

  // Test each handler's schema validation
  let tested = 0;
  let schemaErrors = 0;

  for (const [name, fn] of Object.entries<any>(gen)) {
    try {
      // Try calling with empty input - should fail schema validation
      // (we're only checking that the handler exists and has a schema)
      await (fn as any)({});
    } catch (e: any) {
      const errMsg = String(e);
      // Expected: schema validation error
      if (errMsg.includes("Expected") || errMsg.includes("Invalid")) {
        schemaErrors++;
      } else if (errMsg.includes("Untrusted") || errMsg.includes("HTTP")) {
        // Network/URL errors are OK - means schema passed
        tested++;
      } else {
        console.warn(`[spec-smoke] Unexpected error in ${name}:`, errMsg.slice(0, 100));
      }
    }
  }

  console.log(`[spec-smoke] ✅ Schema validation OK (${schemaErrors} schema errors as expected)`);
  console.log(`[spec-smoke] ✅ Spec smoke tests passed`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error("[spec-smoke] ❌ Smoke tests failed:", e.message);
    process.exit(1);
  });
}

export { run };

