/**
 * Type declarations for external packages without types
 */

declare module 'robots-parser' {
  function robotsParser(url: string, contents: string): {
    isAllowed(url: string, userAgent?: string): boolean;
    getCrawlDelay(userAgent?: string): number | undefined;
    getSitemaps(): string[];
  };
  export = robotsParser;
}

declare module 'bottleneck' {
  export default class Bottleneck {
    constructor(options?: {
      maxConcurrent?: number;
      minTime?: number;
      highWater?: number;
      strategy?: any;
      reservoir?: number;
    });
    schedule<T>(fn: () => Promise<T>): Promise<T>;
    stop(): Promise<void>;
  }
}

