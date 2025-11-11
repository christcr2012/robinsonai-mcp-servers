/**
 * Count 'any' type annotations in TypeScript source code
 * Uses lazy import to avoid ESM bundling issues
 */
export async function countAnyTypes(source: string): Promise<number> {
  try {
    const ts = await import("typescript");
    const sf = ts.createSourceFile(
      "x.ts",
      source,
      ts.ScriptTarget.Latest,
      true
    );
    let anyCount = 0;

    function visit(n: ts.Node) {
      if (
        ts.isKeywordTypeNode(n) &&
        n.kind === ts.SyntaxKind.AnyKeyword
      ) {
        anyCount++;
      }
      ts.forEachChild(n, visit);
    }

    visit(sf);
    return anyCount;
  } catch (error) {
    // If TypeScript is not available, return 0
    console.warn('[tsAst] TypeScript not available, skipping any type count');
    return 0;
  }
}

