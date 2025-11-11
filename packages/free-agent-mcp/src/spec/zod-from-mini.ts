/**
 * Mini schema → Zod converter
 * Converts simple string-based type definitions to Zod validators
 */

import { z } from "zod";

type Mini =
  | "string"
  | "string:min1"
  | "string:opt"
  | "url"
  | "number"
  | "number:int"
  | `number:int:${string}`
  | "array:any"
  | "array:any:opt"
  | "record:any"
  | "record:any:opt"
  | `enum:${string}`;

/**
 * Convert mini schema to Zod validator
 */
export function toZod(m: any): z.ZodTypeAny {
  if (typeof m === "string") return leaf(m);
  if (m?.type === "object") {
    const props = Object.fromEntries(
      Object.entries(m.props || {}).map(([k, v]) => [k, toZod(v)])
    );
    return z.object(props);
  }
  if (m?.type === "array") return z.array(toZod(m.items));
  return z.any();
}

/**
 * Convert leaf type to Zod
 */
function leaf(k: Mini): z.ZodTypeAny {
  switch (true) {
    case k === "string":
      return z.string();
    case k === "string:min1":
      return z.string().min(1);
    case k === "string:opt":
      return z.string().min(1).optional();
    case k === "url":
      return z.string().url();
    case k === "number":
      return z.number();
    case k === "number:int":
      return z.number().int();
    case /^number:int:\d+-\d+(:opt)?$/.test(k): {
      const parts = k.replace("number:int:", "").split(":");
      const min = Number(parts[0]);
      const max = Number(parts[1]);
      const opt = parts[2] === "opt";
      let s = z.number().int().min(min).max(max);
      return opt ? s.optional() : s;
    }
    case k === "array:any":
      return z.array(z.any());
    case k === "array:any:opt":
      return z.array(z.any()).optional();
    case k === "record:any":
      return z.record(z.any());
    case k === "record:any:opt":
      return z.record(z.any()).optional();
    case /^enum:/.test(k): {
      const values = k.replace("enum:", "").split(",") as [string, ...string[]];
      return z.enum(values);
    }
    default:
      return z.any();
  }
}

