/**
 * Ollama client for embeddings and LLM calls
 */

import { Ollama } from 'ollama';
import { config } from './config.js';

export class OllamaClient {
  private client: Ollama;

  constructor() {
    this.client = new Ollama({ host: config.ollamaBaseUrl });
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string, model?: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings({
        model: model || config.defaultEmbedModel,
        prompt: text,
      });
      return response.embedding;
    } catch (error: any) {
      console.error(`Ollama embedding error:`, error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[], model?: string): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embed(text, model);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  /**
   * Generate text completion (for summaries, classification, etc.)
   */
  async generate(prompt: string, model: string = 'qwen2.5-coder:1.5b', options?: any): Promise<string> {
    try {
      const response = await this.client.generate({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
          ...options,
        },
      });
      return response.response;
    } catch (error: any) {
      console.error(`Ollama generation error:`, error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Classify page content (e.g., documentation, blog, code, etc.)
   */
  async classifyPage(title: string, snippet: string): Promise<string> {
    const prompt = `Classify this web page into ONE category: [docs, blog, code, api-reference, tutorial, other]

Title: ${title}
Snippet: ${snippet.substring(0, 500)}

Category (one word only):`;

    const response = await this.generate(prompt, 'qwen2.5-coder:1.5b', { num_predict: 10 });
    return response.trim().toLowerCase();
  }

  /**
   * Summarize directory contents for repo analysis
   */
  async summarizeDirectory(dirPath: string, fileList: string[]): Promise<string> {
    const prompt = `Summarize the purpose of this directory in 1-2 sentences:

Directory: ${dirPath}
Files: ${fileList.slice(0, 20).join(', ')}${fileList.length > 20 ? '...' : ''}

Summary:`;

    return await this.generate(prompt, 'qwen2.5-coder:1.5b', { num_predict: 100 });
  }

  /**
   * Extract key topics from text
   */
  async extractTopics(text: string, maxTopics: number = 5): Promise<string[]> {
    const prompt = `Extract ${maxTopics} key topics from this text (comma-separated):

${text.substring(0, 1000)}

Topics:`;

    const response = await this.generate(prompt, 'qwen2.5-coder:1.5b', { num_predict: 50 });
    return response
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, maxTopics);
  }
}

export const ollamaClient = new OllamaClient();

