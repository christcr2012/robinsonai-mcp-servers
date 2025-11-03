/**
 * Worker Manager
 * 
 * Manages worker threads for heavy operations (Playwright, etc.)
 * Provides a simple async interface that hides worker complexity
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private messageId = 0;
  private pendingMessages: Map<number, { resolve: Function; reject: Function }> = new Map();

  /**
   * Get or create a worker for a specific task type
   */
  private getWorker(workerType: 'playwright'): Worker {
    if (!this.workers.has(workerType)) {
      const workerPath = join(__dirname, `${workerType}-worker.js`);
      const worker = new Worker(workerPath);

      worker.on('message', (message) => {
        const { id, success, result, error } = message;
        const pending = this.pendingMessages.get(id);
        
        if (pending) {
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
          this.pendingMessages.delete(id);
        }
      });

      worker.on('error', (error) => {
        console.error(`Worker ${workerType} error:`, error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${workerType} exited with code ${code}`);
        }
        this.workers.delete(workerType);
      });

      this.workers.set(workerType, worker);
    }

    return this.workers.get(workerType)!;
  }

  /**
   * Send a message to a worker and wait for response
   */
  private async sendMessage(workerType: 'playwright', action: string, params?: any): Promise<any> {
    const worker = this.getWorker(workerType);
    const id = this.messageId++;

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      
      // Timeout after 60 seconds
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error(`Worker ${workerType} timeout for action ${action}`));
      }, 60000);

      this.pendingMessages.get(id)!.resolve = (result: any) => {
        clearTimeout(timeout);
        resolve(result);
      };

      this.pendingMessages.get(id)!.reject = (error: any) => {
        clearTimeout(timeout);
        reject(error);
      };

      worker.postMessage({ id, action, params });
    });
  }

  /**
   * Playwright operations
   */
  async playwrightLaunch(): Promise<void> {
    await this.sendMessage('playwright', 'launch');
  }

  async playwrightNavigate(url: string): Promise<{ url: string }> {
    return await this.sendMessage('playwright', 'navigate', { url });
  }

  async playwrightScreenshot(type?: 'png' | 'jpeg', fullPage?: boolean): Promise<{ screenshot: string }> {
    return await this.sendMessage('playwright', 'screenshot', { type, fullPage });
  }

  async playwrightClick(selector: string): Promise<void> {
    await this.sendMessage('playwright', 'click', { selector });
  }

  async playwrightType(selector: string, text: string): Promise<void> {
    await this.sendMessage('playwright', 'type', { selector, text });
  }

  async playwrightEvaluate(script: string): Promise<any> {
    const result = await this.sendMessage('playwright', 'evaluate', { script });
    return result.result;
  }

  async playwrightClose(): Promise<void> {
    await this.sendMessage('playwright', 'close');
  }

  /**
   * Cleanup all workers
   */
  async cleanup(): Promise<void> {
    for (const [type, worker] of this.workers.entries()) {
      await worker.terminate();
      this.workers.delete(type);
    }
  }
}

