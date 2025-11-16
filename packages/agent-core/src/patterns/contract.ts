export type WrapperRule = { name: string; importFrom: string; mustUse?: boolean };
export type ContainerRule = { kind: "class" | "module"; name: string; file: string; methodStyle: "instance" | "static" | "func" };
export type LayoutRule = { baseDir: string; fileSuffix?: string; testDir?: string };
export type ImportRule = { preferPath: string; disallow?: string[] };

export type PatternContract = {
  language: "ts" | "js" | "other";
  layout: LayoutRule;
  containers: ContainerRule[];
  wrappers: WrapperRule[];
  imports: ImportRule[];
  naming: { methodCase: "camel" | "snake" | "pascal"; fileCase: "kebab" | "snake" | "camel" };
  forbid: string[];
  baseDir?: string;
};

