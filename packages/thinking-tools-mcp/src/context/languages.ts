import { promises as fs } from 'fs';
import path from 'path';

type SyntaxNode = {
  startIndex: number;
  endIndex: number;
  startPosition: { row: number; column: number };
};

type TreeSitterQuery = {
  captures(node: SyntaxNode): Array<{ name: string; node: SyntaxNode }>;
};

type TreeSitterLanguage = {
  query(source: string): TreeSitterQuery;
};

type TreeSitterParser = {
  parse(source: string): { rootNode: SyntaxNode };
  setLanguage(language: TreeSitterLanguage): void;
};

type SymbolRecordType = 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var' | 'enum';

export interface SymbolRecord {
  name: string;
  type: SymbolRecordType;
  file: string;
  line: number;
  isPublic: boolean;
  isExported: boolean;
}

type CaptureSpec = {
  type: SymbolRecordType;
  query: string;
  capture?: string;
  exported?: (name: string, node: SyntaxNode, source: string) => boolean;
  public?: (name: string, node: SyntaxNode, source: string) => boolean;
};

type LanguageConfig = {
  extensions: string[];
  loader: () => Promise<any>;
  captures: CaptureSpec[];
  fallback?: (filePath: string, repoRoot: string, source: string) => SymbolRecord[];
};

type RuntimeCapture = CaptureSpec & { compiled: TreeSitterQuery; capture: string };

type LanguageRuntime = {
  parser: TreeSitterParser;
  captures: RuntimeCapture[];
};

let ParserCtor: { new (): TreeSitterParser } | null = null;

async function getParserCtor(): Promise<{ new (): TreeSitterParser }> {
  if (!ParserCtor) {
    const mod = await import('tree-sitter');
    ParserCtor = (mod.default ?? mod) as unknown as { new (): TreeSitterParser };
  }
  return ParserCtor!;
}

const runtimeCache = new Map<LanguageConfig, Promise<LanguageRuntime>>();

async function getRuntime(config: LanguageConfig): Promise<LanguageRuntime> {
  if (!runtimeCache.has(config)) {
    runtimeCache.set(
      config,
      (async () => {
        const ParserClass = await getParserCtor();
        const languageModule = await config.loader();
        const language = (languageModule.default ?? languageModule) as TreeSitterLanguage;
        const parser = new ParserClass();
        parser.setLanguage(language);
        const captures = config.captures.map(spec => ({
          ...spec,
          capture: spec.capture ?? 'name',
          compiled: language.query(spec.query),
        }));
        return { parser, captures };
      })()
    );
  }
  return runtimeCache.get(config)!;
}

const configs: LanguageConfig[] = [
  {
    extensions: ['.py'],
    loader: () => import('tree-sitter-python'),
    captures: [
      { type: 'function', query: '(function_definition name: (identifier) @name)', exported: (name) => !name.startsWith('_'), public: (name) => !name.startsWith('_') },
      { type: 'class', query: '(class_definition name: (identifier) @name)', exported: (name) => !name.startsWith('_'), public: (name) => !name.startsWith('_') },
    ],
  },
  {
    extensions: ['.go'],
    loader: () => import('tree-sitter-go'),
    captures: [
      { type: 'function', query: '(function_declaration name: (identifier) @name)', exported: (name) => /^[A-Z]/.test(name), public: (name) => /^[A-Z]/.test(name) },
      { type: 'function', query: '(method_declaration name: (field_identifier) @name)', exported: (name) => /^[A-Z]/.test(name), public: (name) => /^[A-Z]/.test(name) },
      { type: 'type', query: '(type_spec name: (type_identifier) @name)', exported: (name) => /^[A-Z]/.test(name), public: (name) => /^[A-Z]/.test(name) },
    ],
  },
  {
    extensions: ['.java'],
    loader: () => import('tree-sitter-java'),
    captures: [
      { type: 'class', query: '(class_declaration name: (identifier) @name)', exported: (_name, node, source) => isPublic(node, source), public: (_name, node, source) => isPublic(node, source) },
      { type: 'interface', query: '(interface_declaration name: (identifier) @name)', exported: (_name, node, source) => isPublic(node, source), public: (_name, node, source) => isPublic(node, source) },
      { type: 'enum', query: '(enum_declaration name: (identifier) @name)', exported: (_name, node, source) => isPublic(node, source), public: (_name, node, source) => isPublic(node, source) },
      { type: 'function', query: '(method_declaration name: (identifier) @name)', exported: (_name, node, source) => isPublic(node, source), public: (_name, node, source) => isPublic(node, source) },
    ],
  },
  {
    extensions: ['.rs'],
    loader: () => import('tree-sitter-rust'),
    captures: [
      { type: 'function', query: '(function_item name: (identifier) @name)', exported: (name, node, source) => hasPubKeyword(node, source), public: (name, node, source) => hasPubKeyword(node, source) },
      { type: 'type', query: '(struct_item name: (type_identifier) @name)', exported: (name, node, source) => hasPubKeyword(node, source), public: (name, node, source) => hasPubKeyword(node, source) },
      { type: 'enum', query: '(enum_item name: (identifier) @name)', exported: (name, node, source) => hasPubKeyword(node, source), public: (name, node, source) => hasPubKeyword(node, source) },
      { type: 'type', query: '(trait_item name: (identifier) @name)', exported: (name, node, source) => hasPubKeyword(node, source), public: (name, node, source) => hasPubKeyword(node, source) },
    ],
  },
  {
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h', '.hh'],
    loader: () => import('tree-sitter-cpp'),
    captures: [
      { type: 'class', query: '(class_specifier name: (type_identifier) @name)', public: () => true, exported: () => true },
      { type: 'function', query: '(function_definition declarator: (function_declarator declarator: (identifier) @name))', public: () => true, exported: () => true },
      { type: 'function', query: '(function_declaration declarator: (function_declarator declarator: (identifier) @name))', public: () => true, exported: () => true },
    ],
  },
];

function isPublic(node: SyntaxNode, source: string): boolean {
  const start = Math.max(0, node.startIndex - 32);
  const prefix = source.slice(start, node.startIndex);
  return /public\s+$/.test(prefix) || /protected\s+$/.test(prefix);
}

function hasPubKeyword(node: SyntaxNode, source: string): boolean {
  const start = Math.max(0, node.startIndex - 12);
  const prefix = source.slice(start, node.startIndex);
  return /pub\s*$/.test(prefix);
}

const FALLBACK_REGEX: Record<string, Array<{ regex: RegExp; type: SymbolRecordType }>> = {
  '.py': [
    { regex: /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, type: 'function' },
    { regex: /class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/g, type: 'class' },
  ],
  '.go': [
    { regex: /func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, type: 'function' },
    { regex: /type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct/g, type: 'type' },
  ],
  '.java': [
    { regex: /class\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'class' },
    { regex: /interface\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'interface' },
    { regex: /enum\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'enum' },
  ],
  '.rs': [
    { regex: /fn\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'function' },
    { regex: /struct\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'type' },
    { regex: /enum\s+([A-Za-z_][A-Za-z0-9_]*)/g, type: 'enum' },
  ],
  '.cpp': [
    { regex: /([A-Za-z_][A-Za-z0-9_:<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, type: 'function' },
  ],
};

function fallbackSymbols(filePath: string, repoRoot: string, source: string): SymbolRecord[] {
  const ext = path.extname(filePath).toLowerCase();
  const patterns = FALLBACK_REGEX[ext];
  if (!patterns) return [];
  const relative = path.relative(repoRoot, filePath).split(path.sep).join('/');
  const symbols: SymbolRecord[] = [];

  for (const { regex, type } of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      const name = match[1] ?? match[2];
      if (!name) continue;
      const before = source.slice(0, match.index);
      const line = before.split(/\r?\n/).length;
      symbols.push({
        name,
        type,
        file: relative,
        line,
        isPublic: true,
        isExported: true,
      });
    }
  }

  return symbols;
}

function uniqueByName(symbols: SymbolRecord[]): SymbolRecord[] {
  const seen = new Map<string, SymbolRecord>();
  for (const symbol of symbols) {
    const key = `${symbol.file}:${symbol.name}:${symbol.line}`;
    if (!seen.has(key)) {
      seen.set(key, symbol);
    }
  }
  return Array.from(seen.values());
}

export async function extractSymbolsForFile(filePath: string, repoRoot: string): Promise<SymbolRecord[]> {
  const ext = path.extname(filePath).toLowerCase();
  const config = configs.find(c => c.extensions.includes(ext));
  const source = await fs.readFile(filePath, 'utf8');

  if (!config) {
    return [];
  }

  try {
    const runtime = await getRuntime(config);
    const tree = runtime.parser.parse(source);
    const relative = path.relative(repoRoot, filePath).split(path.sep).join('/');
    const out: SymbolRecord[] = [];

    for (const capture of runtime.captures) {
      const results = capture.compiled.captures(tree.rootNode);
      for (const res of results) {
        if (res.name !== capture.capture) continue;
        const node = res.node;
        const name = source.slice(node.startIndex, node.endIndex);
        if (!name) continue;
        const line = node.startPosition.row + 1;
        const isExported = capture.exported ? capture.exported(name, node, source) : true;
        const isPublic = capture.public ? capture.public(name, node, source) : isExported;

        out.push({
          name,
          type: capture.type,
          file: relative,
          line,
          isPublic,
          isExported,
        });
      }
    }

    if (!out.length && config.fallback) {
      return config.fallback(filePath, repoRoot, source);
    }

    return uniqueByName(out.length ? out : fallbackSymbols(filePath, repoRoot, source));
  } catch (error) {
    console.warn(`[extractSymbolsForFile] Tree-sitter failed for ${filePath}:`, (error as Error).message);
    return fallbackSymbols(filePath, repoRoot, source);
  }
}
