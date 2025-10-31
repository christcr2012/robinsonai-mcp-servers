/**
 * Prompt Builder
 * 
 * Builds optimized prompts for different tasks.
 */

export class PromptBuilder {
  /**
   * Build code generation prompt
   */
  buildGenerationPrompt(request: {
    task: string;
    context: string;
    template?: string;
  }): string {
    const { task, context, template } = request;

    let prompt = `You are an expert software engineer. Generate COMPLETE, PRODUCTION-READY code.

Task: ${task}
Context: ${context}

CRITICAL: DO NOT INVENT OR HALLUCINATE APIs!
- If the task asks for simple logic (like adding numbers), write the logic directly
- DO NOT use AWS, external services, or imaginary APIs unless explicitly required
- DO NOT add comments like "for demonstration purposes" or "imaginary service"
- Write REAL, WORKING code that actually does what the task asks

STRICT REQUIREMENTS (MANDATORY):
1. NO PLACEHOLDERS - No TODO, FIXME, PLACEHOLDER, STUB, TBD, MOCK, or "implement this later"
2. SIMPLE LOGIC FIRST - For simple tasks, write simple code. Don't overcomplicate with external APIs
3. REAL APIs ONLY - If you must use external APIs, only use real, documented ones
4. COMPLETE IMPLEMENTATIONS - Every function must have full logic, no empty bodies
5. PROPER IMPORTS - Use ES6 imports (import X from 'Y'), never require()
6. SYNTACTICALLY CORRECT - Balanced braces, brackets, parentheses
7. ERROR HANDLING - Include try/catch for async operations and external calls
8. TYPE SAFETY - Add TypeScript types for all parameters, returns, and variables
9. PRODUCTION READY - Code must compile and run without modifications

FORBIDDEN PATTERNS (WILL FAIL VALIDATION):
- throw new Error('Not implemented')
- // TODO: implement this
- // FIXME: ...
- function foo() { } // empty body
- const x = PLACEHOLDER;
- // ... (ellipsis indicating incomplete code)
- new AWS.RestifyClient() // This doesn't exist!
- "for demonstration purposes" // This means fake code!
- "imaginary service" // This means fake code!

EXAMPLE - CORRECT (simple task, simple code):
Task: "Create a function that adds two numbers"
\`\`\`typescript
export function addNumbers(a: number, b: number): number {
  return a + b;
}
\`\`\`

EXAMPLE - WRONG (overcomplicated with fake APIs):
\`\`\`typescript
import { sum } from '@aws-sdk/client-cognito-identity'; // ❌ WRONG! Not needed!
export async function addNumbers(a: number, b: number): Promise<number> {
  const result = await sum(...); // ❌ WRONG! Fake API!
  return result;
}
\`\`\`

CODE QUALITY STANDARDS:
- Write clean, maintainable code following DRY principles
- Follow best practices for the framework/language specified in context
- Add JSDoc comments for public functions/classes only
- Use meaningful variable and function names
- Keep functions focused and single-purpose

`;

    if (template && template !== 'none') {
      prompt += `Template Guide: Use the ${template} template pattern as a structural reference.\n\n`;
    }

    prompt += `Generate the COMPLETE code now. Wrap code in triple backticks with the file path as a comment:

\`\`\`typescript // path/to/file.ts
// Your complete, production-ready code here
\`\`\`

If multiple files are needed, provide each in separate code blocks with their paths.

REMEMBER: Code will be validated. Any placeholders, fake APIs, or incomplete implementations will be rejected.`;

    return prompt;
  }

  /**
   * Build code analysis prompt
   */
  buildAnalysisPrompt(request: {
    code?: string;
    files?: string[];
    question: string;
  }): string {
    const { code, files, question } = request;

    let prompt = `You are an expert code reviewer. Analyze this code for issues.

Question: ${question}

`;

    if (code) {
      prompt += `Code to analyze:
\`\`\`
${code}
\`\`\`

`;
    }

    if (files && files.length > 0) {
      prompt += `Files to analyze:
${files.map((f, i) => `${i + 1}. ${f}`).join('\n')}

`;
    }

    prompt += `Analyze for:
- Performance issues
- Security vulnerabilities
- Code smells
- Best practice violations
- Potential bugs
- Maintainability concerns

Provide detailed analysis with:
1. Summary of findings
2. Specific issues found (use format: [TYPE] (SEVERITY) location: description)
3. Recommendations for improvement

Be specific and actionable.`;

    return prompt;
  }

  /**
   * Build refactoring prompt
   */
  buildRefactorPrompt(request: {
    code: string;
    instructions: string;
    style?: string;
  }): string {
    const { code, instructions, style } = request;

    let prompt = `You are an expert software engineer. Refactor this code to PRODUCTION QUALITY.

Code to refactor:
\`\`\`
${code}
\`\`\`

Refactoring Instructions: ${instructions}

`;

    if (style) {
      prompt += `Code Style: ${style}\n\n`;
    }

    prompt += `STRICT REQUIREMENTS (MANDATORY):
1. MAINTAIN FUNCTIONALITY - Same behavior, improved structure
2. NO PLACEHOLDERS - No TODO, FIXME, STUB, or incomplete implementations
3. COMPLETE CODE - All functions must have full implementations
4. REAL APIs ONLY - Use only documented, real APIs
5. IMPROVE QUALITY - Better naming, structure, and maintainability
6. PRESERVE TESTS - Keep existing test compatibility
7. ${style || 'modern'} CODING PRACTICES - Follow industry standards

FORBIDDEN IN REFACTORED CODE:
- Empty function bodies
- Placeholder comments (TODO, FIXME, etc.)
- Fake or non-existent APIs
- throw new Error('Not implemented')
- Incomplete logic or ellipsis comments

Provide:
1. COMPLETE refactored code (in triple backticks)
2. List of changes made (bullet points starting with -)

Format:
\`\`\`typescript
// Complete refactored code here
\`\`\`

Changes made:
- Extracted UserProfile component with full implementation
- Renamed handleClick to handleUserClick for clarity
- Applied dependency injection pattern with proper types

REMEMBER: Refactored code will be validated. Any placeholders or incomplete code will be rejected.`;

    return prompt;
  }

  /**
   * Build test generation prompt
   */
  buildTestPrompt(request: {
    code: string;
    framework: string;
    coverage?: string;
  }): string {
    const { code, framework, coverage } = request;

    let prompt = `You are an expert test engineer. Generate COMPLETE, RUNNABLE tests.

Code to test:
\`\`\`
${code}
\`\`\`

Test Framework: ${framework}
Coverage Level: ${coverage || 'comprehensive'}

STRICT REQUIREMENTS (MANDATORY):
1. COMPLETE TESTS - All test cases must be fully implemented
2. NO PLACEHOLDERS - No TODO, FIXME, or "add test here" comments
3. REAL ASSERTIONS - Use actual ${framework} assertion methods (no fake APIs)
4. RUNNABLE - Tests must execute without modifications
5. PROPER SETUP - Include all necessary imports, mocks, and setup/teardown
6. DESCRIPTIVE NAMES - Use clear, specific test names (not "test1", "test2")
7. FOLLOW ${framework} BEST PRACTICES - Use framework conventions

TEST COVERAGE REQUIREMENTS:
- Test ALL public methods/functions
- Include happy path scenarios
- Include error/exception handling
- Test edge cases (null, undefined, empty, boundary values)
- Test async operations with proper await/promises
- Include setup/teardown if needed

`;

    if (coverage === 'edge-cases') {
      prompt += `EXTRA FOCUS ON EDGE CASES:
- Null and undefined inputs
- Empty arrays, objects, and strings
- Boundary values (min, max, zero, negative)
- Invalid input types
- Error conditions and exceptions
- Race conditions for async code
- Timeout scenarios

`;
    }

    prompt += `FORBIDDEN IN TESTS:
- Empty test bodies: it('should work', () => { })
- Placeholder comments: // TODO: add test
- Fake assertion methods
- Incomplete async handling

Generate the COMPLETE test file now. Wrap in triple backticks:

\`\`\`typescript
// Complete, runnable test file here
\`\`\`

REMEMBER: Tests will be validated and must be executable without modifications.`;

    return prompt;
  }

  /**
   * Build documentation prompt
   */
  buildDocPrompt(request: {
    code: string;
    style?: string;
    detail?: string;
  }): string {
    const { code, style, detail } = request;

    let prompt = `You are a technical writer. Generate clear documentation for this code.

Code to document:
\`\`\`
${code}
\`\`\`

Documentation style: ${style || 'tsdoc'}
Detail level: ${detail || 'detailed'}

`;

    if (style === 'jsdoc' || style === 'tsdoc') {
      prompt += `Requirements:
- Document all public functions/methods
- Include @param tags with types
- Include @returns tag
- Include @throws for errors
- Add @example for complex functions
- Keep descriptions clear and concise

`;
    } else if (style === 'markdown' || style === 'readme') {
      prompt += `Requirements:
- Create a README-style document
- Include overview/description
- List all functions/methods
- Provide usage examples
- Include installation/setup if applicable
- Add troubleshooting section

`;
    }

    prompt += `Generate the documentation now.`;

    return prompt;
  }
}

