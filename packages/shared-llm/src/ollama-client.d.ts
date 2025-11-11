export declare const BASE: string;
export declare function pingOllama(timeoutMs?: number): Promise<boolean>;
export declare function ollamaGenerate(opts: {
    model: string;
    prompt: string;
    format?: 'json' | 'text';
    timeoutMs?: number;
    retries?: number;
}): Promise<any>;
export declare function warmModels(models: string[]): Promise<void>;
//# sourceMappingURL=ollama-client.d.ts.map