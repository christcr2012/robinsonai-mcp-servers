export type Anchor = {
  text: string;            // exact literal in file
  kind: "class"|"method"|"function"|"switchCase"|"import"|"region"|"custom";
  line: number;            // 1-based line number
};

export type FileAnchors = { path: string; anchors: Anchor[] };

export type AnchorHints = {
  byFile: Record<string, { allowed: string[] }>;
};

