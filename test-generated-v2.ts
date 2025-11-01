/**
 * Calculates factorial of a non-negative integer
 * @param n - Number to calculate factorial for
 * @returns Factorial of n
 * @throws {Error} If n is not a non-negative integer
 */
function factorial(n: number): number {
  if (!Number.isInteger(n)) {
    throw new Error(`Must be integer, got: ${n}`);
  }
  if (n < 0) {
    throw new Error(`Must be non-negative, got: ${n}`);
  }
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

export { factorial };
