// Test file path extraction

const task1 = "Convert Vercel tools from multi-line to single-line format in packages/robinsons-toolkit-mcp/src/index.ts (lines 643-1100). DIRECTLY EDIT THE FILE.";
const task2 = "Convert Vercel tools from multi-line to single-line format in packages/robinsons-toolkit-mcp/src/index.ts lines 643-700";

console.log("Task 1:", task1);
console.log("Task 2:", task2);

// Pattern 1: "in packages/..." or "file packages/..."
const pattern1 = /(?:in|file|path:?)\s+([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i;
const match1_1 = task1.match(pattern1);
const match1_2 = task2.match(pattern1);

console.log("\nPattern 1 results:");
console.log("Task 1 match:", match1_1);
console.log("Task 2 match:", match1_2);

// Pattern 2: Just look for any path with file extension
const pattern2 = /([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i;
const match2_1 = task1.match(pattern2);
const match2_2 = task2.match(pattern2);

console.log("\nPattern 2 results:");
console.log("Task 1 match:", match2_1);
console.log("Task 2 match:", match2_2);

