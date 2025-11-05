import fs from 'fs/promises';
import { BehaviorMemory } from './behavior.js';
import type { StyleMemory } from './types.js';

const IDENTIFIER_REGEX = /[A-Za-z_][A-Za-z0-9_-]{3,}/g;

function isCamelCase(id: string): boolean {
  return /^[a-z]+[A-Za-z0-9]*$/.test(id) && /[A-Z]/.test(id);
}

function isSnakeCase(id: string): boolean {
  return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(id);
}

function isPascalCase(id: string): boolean {
  return /^[A-Z][A-Za-z0-9]+$/.test(id) && /[a-z]/.test(id);
}

function isKebabCase(id: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)+$/.test(id);
}

export class StyleLearner {
  constructor(private readonly behavior: BehaviorMemory) {}

  async analyze(files: string[]): Promise<StyleMemory | null> {
    if (!files.length) return null;

    const sampleSize = Math.min(files.length, parseInt(process.env.RCE_STYLE_SAMPLE ?? '180', 10));
    const sample = files.slice(0, sampleSize);

    const counts = { camel: 0, snake: 0, pascal: 0, kebab: 0 };
    const examples = {
      camel: new Set<string>(),
      snake: new Set<string>(),
      pascal: new Set<string>(),
      kebab: new Set<string>(),
    } as Record<'camel' | 'snake' | 'pascal' | 'kebab', Set<string>>;

    let singleQuotes = 0;
    let doubleQuotes = 0;
    let tabIndents = 0;
    let spaceIndents = 0;
    const indentSizes = new Map<number, number>();
    let relativeImports = 0;
    let absoluteImports = 0;

    for (const file of sample) {
      try {
        const text = await fs.readFile(file, 'utf8');
        const trimmed = text.slice(0, 8000);

        const identifiers = trimmed.match(IDENTIFIER_REGEX) ?? [];
        for (const id of identifiers.slice(0, 60)) {
          if (isCamelCase(id)) {
            counts.camel++;
            if (examples.camel.size < 12) examples.camel.add(id);
          } else if (isSnakeCase(id)) {
            counts.snake++;
            if (examples.snake.size < 12) examples.snake.add(id);
          } else if (isPascalCase(id)) {
            counts.pascal++;
            if (examples.pascal.size < 12) examples.pascal.add(id);
          } else if (isKebabCase(id)) {
            counts.kebab++;
            if (examples.kebab.size < 12) examples.kebab.add(id);
          }
        }

        singleQuotes += (trimmed.match(/'/g) || []).length;
        doubleQuotes += (trimmed.match(/"/g) || []).length;

        const lines = trimmed.split(/\r?\n/).slice(0, 220);
        for (const line of lines) {
          const leading = line.match(/^[\t ]+/);
          if (!leading) continue;
          if (leading[0].includes('\t')) {
            tabIndents++;
          } else {
            spaceIndents++;
            const size = leading[0].length;
            if (size > 0 && size <= 8) {
              indentSizes.set(size, (indentSizes.get(size) ?? 0) + 1);
            }
          }

          if (/\bimport\b/.test(line) || /require\(/.test(line) || /from\s+['".]/.test(line)) {
            if (line.includes('../') || line.includes('./')) {
              relativeImports++;
            } else if (line.includes("'@") || line.includes('"@') || line.includes(' from ')) {
              absoluteImports++;
            }
          }
        }
      } catch {
        // Ignore unreadable files
      }
    }

    const totalIdentifiers = counts.camel + counts.snake + counts.pascal + counts.kebab;
    let namingPreference: StyleMemory['namingPreference'] = 'unknown';
    let namingConfidence = 0;
    let identifierExamples: string[] = [];

    const ranking: Array<{ key: 'camel' | 'snake' | 'pascal' | 'kebab'; count: number }> = [
      { key: 'camel' as const, count: counts.camel },
      { key: 'snake' as const, count: counts.snake },
      { key: 'pascal' as const, count: counts.pascal },
      { key: 'kebab' as const, count: counts.kebab },
    ].sort((a, b) => b.count - a.count);

    if (totalIdentifiers > 0 && ranking[0].count > 0) {
      namingPreference =
        ranking[0].key === 'camel'
          ? 'camelCase'
          : ranking[0].key === 'snake'
            ? 'snake_case'
            : ranking[0].key === 'pascal'
              ? 'pascalCase'
              : 'kebab-case';
      namingConfidence = ranking[0].count / totalIdentifiers;
      if (namingConfidence < 0.35) {
        namingPreference = 'mixed';
      }
      identifierExamples = Array.from(examples[ranking[0].key]).slice(0, 8);
    }

    let indentStyle: StyleMemory['indentStyle'] = 'mixed';
    if (tabIndents > spaceIndents * 1.2) {
      indentStyle = 'tabs';
    } else if (spaceIndents >= tabIndents) {
      indentStyle = spaceIndents === 0 ? 'mixed' : 'spaces';
    }

    let indentSize: number | undefined;
    if (indentStyle === 'spaces' && indentSizes.size) {
      const [size] = Array.from(indentSizes.entries()).sort((a, b) => b[1] - a[1])[0];
      indentSize = size;
    }

    let quoteStyle: StyleMemory['quoteStyle'] = 'unknown';
    if (singleQuotes === 0 && doubleQuotes === 0) {
      quoteStyle = 'unknown';
    } else if (singleQuotes > doubleQuotes * 1.1) {
      quoteStyle = 'single';
    } else if (doubleQuotes > singleQuotes * 1.1) {
      quoteStyle = 'double';
    } else {
      quoteStyle = 'mixed';
    }

    let importStyle: StyleMemory['importStyle'];
    if (relativeImports === 0 && absoluteImports === 0) {
      importStyle = undefined;
    } else if (relativeImports > absoluteImports * 1.2) {
      importStyle = 'relative';
    } else if (absoluteImports > relativeImports * 1.2) {
      importStyle = 'absolute';
    } else {
      importStyle = 'mixed';
    }

    const keywords = identifierExamples.slice(0, 6);

    const style: StyleMemory = {
      namingPreference,
      namingConfidence,
      identifierExamples,
      indentStyle,
      indentSize,
      quoteStyle,
      importStyle,
      keywords,
      updatedAt: new Date().toISOString(),
    };

    this.behavior.updateStyle(style);
    return style;
  }
}
