import ts from "typescript";

/**
 * Count 'any' type annotations in TypeScript source code
 */
export function countAnyTypes(source: string): number {
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
}

