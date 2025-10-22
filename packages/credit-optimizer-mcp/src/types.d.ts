// Type declarations for modules without types

declare module 'glob' {
  export function glob(pattern: string, options?: any): Promise<string[]>;
}

declare module 'better-sqlite3' {
  export default class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): any;
    exec(sql: string): void;
    close(): void;
  }
}

declare module 'handlebars' {
  export function compile(template: string): (context: any) => string;
  export function registerHelper(name: string, fn: Function): void;
}

