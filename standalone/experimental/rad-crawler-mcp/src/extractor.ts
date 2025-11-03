/**
 * Content extraction and processing
 */

import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import crypto from 'crypto';
import { encoding_for_model } from 'tiktoken';
import type { ExtractedContent, ChunkMeta } from './types.js';
import { config } from './config.js';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export class ContentExtractor {
  private tokenizer: any;

  constructor() {
    // Use cl100k_base encoding (GPT-3.5/4 tokenizer)
    this.tokenizer = encoding_for_model('gpt-3.5-turbo');
  }

  /**
   * Extract readable content from HTML
   */
  extractFromHtml(html: string, url: string): ExtractedContent {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .advertisement, .ads').remove();

    // Extract metadata
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const h1 = $('h1').first().text().trim();
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;
    const lang = $('html').attr('lang') || this.detectLanguage($('body').text());

    // Extract h2 path for context
    const h2Path: string[] = [];
    $('h2').each((_, el) => {
      h2Path.push($(el).text().trim());
    });

    // Extract anchors
    const anchors: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#')) {
        anchors.push(href);
      }
    });

    // Convert to markdown for better structure preservation
    const bodyHtml = $('body').html() || '';
    const markdown = turndownService.turndown(bodyHtml);

    // Clean up the text
    const text = this.cleanText(markdown);

    return {
      text,
      title,
      h1,
      h2Path,
      anchors: [...new Set(anchors)].slice(0, 50), // Dedupe and limit
      lang,
      canonicalUrl,
    };
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Detect language (simple heuristic)
   */
  private detectLanguage(text: string): string {
    // Very simple detection - can be improved
    const sample = text.substring(0, 1000).toLowerCase();
    if (/[а-яё]/.test(sample)) return 'ru';
    if (/[一-龯]/.test(sample)) return 'zh';
    if (/[ぁ-ゔ]/.test(sample)) return 'ja';
    return 'en';
  }

  /**
   * Compute SHA1 hash of content
   */
  computeHash(content: string): string {
    return crypto.createHash('sha1').update(content).digest('hex');
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string): number {
    try {
      const tokens = this.tokenizer.encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback to rough estimate
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Chunk text into overlapping segments
   */
  chunkText(text: string, h2Path: string[] = []): Array<{ text: string; meta: ChunkMeta }> {
    const chunks: Array<{ text: string; meta: ChunkMeta }> = [];
    const lines = text.split('\n');
    
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let currentH2Path = [...h2Path];

    for (const line of lines) {
      // Track h2 headers for context
      if (line.startsWith('## ')) {
        const h2 = line.substring(3).trim();
        if (!currentH2Path.includes(h2)) {
          currentH2Path.push(h2);
        }
      }

      const lineTokens = this.countTokens(line);
      
      // If adding this line would exceed chunk size, save current chunk
      if (currentTokens + lineTokens > config.chunkSize && currentChunk.length > 0) {
        const chunkText = currentChunk.join('\n');
        chunks.push({
          text: chunkText,
          meta: {
            h2_path: [...currentH2Path],
            tokens: currentTokens,
          },
        });

        // Start new chunk with overlap
        const overlapLines = Math.ceil(currentChunk.length * (config.chunkOverlap / config.chunkSize));
        currentChunk = currentChunk.slice(-overlapLines);
        currentTokens = this.countTokens(currentChunk.join('\n'));
      }

      currentChunk.push(line);
      currentTokens += lineTokens;
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        meta: {
          h2_path: [...currentH2Path],
          tokens: currentTokens,
        },
      });
    }

    return chunks;
  }

  /**
   * Extract code from file content
   */
  extractCodeChunks(content: string, filePath: string, language?: string): Array<{ text: string; meta: ChunkMeta }> {
    const chunks: Array<{ text: string; meta: ChunkMeta }> = [];
    const lines = content.split('\n');
    
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const line of lines) {
      const lineTokens = this.countTokens(line);
      
      if (currentTokens + lineTokens > config.chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n'),
          meta: {
            file_path: filePath,
            language,
            tokens: currentTokens,
          },
        });

        // Overlap for code
        const overlapLines = Math.ceil(currentChunk.length * 0.2);
        currentChunk = currentChunk.slice(-overlapLines);
        currentTokens = this.countTokens(currentChunk.join('\n'));
      }

      currentChunk.push(line);
      currentTokens += lineTokens;
    }

    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        meta: {
          file_path: filePath,
          language,
          tokens: currentTokens,
        },
      });
    }

    return chunks;
  }

  /**
   * Detect programming language from file extension
   */
  detectCodeLanguage(filePath: string): string | undefined {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
    };
    return ext ? langMap[ext] : undefined;
  }

  cleanup() {
    this.tokenizer.free();
  }
}

export const contentExtractor = new ContentExtractor();

