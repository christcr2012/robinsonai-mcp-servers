```typescript // path/to/factorial.ts
export function factorial(n: number): number {
  if (n < 0) {
    throw new Error('Input must be a non-negative integer.');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export async function factorialAsync(n: number): Promise<number> {
  try {
    if (n < 0) {
      throw new Error('Input must be a non-negative integer.');
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred.');
  }
}
```