/**
 * Prompt Builder for PAID Agent
 * 
 * Builds strict, quality-enforcing prompts for OpenAI/Claude models.
 */

export function buildStrictSystemPrompt(taskType: string, context?: string): string {
  const baseContext = context || '';
  
  const strictRequirements = `
STRICT REQUIREMENTS (MANDATORY - WILL BE VALIDATED):
1. NO PLACEHOLDERS - Absolutely no TODO, FIXME, PLACEHOLDER, STUB, TBD, MOCK, or "implement this later"
2. REAL APIs ONLY - Only use real, documented APIs from official SDKs (no hallucinated methods/classes)
3. COMPLETE IMPLEMENTATIONS - Every function must have full logic, no empty bodies
4. PROPER IMPORTS - Use ES6 imports (import X from 'Y'), never require() for ES modules
5. SYNTACTICALLY CORRECT - Balanced braces, brackets, parentheses
6. ERROR HANDLING - Include try/catch for async operations and external calls
7. TYPE SAFETY - Add TypeScript types for all parameters, returns, and variables
8. PRODUCTION READY - Code must compile and run without modifications

FORBIDDEN PATTERNS (WILL CAUSE VALIDATION FAILURE):
- throw new Error('Not implemented')
- // TODO: implement this
- // FIXME: ...
- function foo() { } // empty body
- const x = PLACEHOLDER;
- // ... (ellipsis indicating incomplete code)
- new openai.GPT4oMini() // This class doesn't exist!
- .analyzeComplexity() // This method doesn't exist!
- require('openai') // Use ES6 import instead

CODE QUALITY STANDARDS:
- Write clean, maintainable code following DRY principles
- Follow best practices for the framework/language
- Add JSDoc comments for public functions/classes only
- Use meaningful variable and function names
- Keep functions focused and single-purpose
`;

  switch (taskType) {
    case 'code_generation':
      return `You are an expert software engineer. Generate COMPLETE, PRODUCTION-READY code.

${baseContext}

${strictRequirements}

Your code will be automatically validated. Any placeholders, fake APIs, or incomplete implementations will be rejected and you will be asked to fix them.`;

    case 'code_analysis':
      return `You are an expert code reviewer. Analyze code for issues, security vulnerabilities, and performance problems.

${baseContext}

Provide detailed, actionable analysis with:
1. Summary of findings
2. Specific issues with severity levels
3. Concrete recommendations for improvement

Be specific and reference line numbers when possible.`;

    case 'refactoring':
      return `You are an expert software engineer. Refactor code to PRODUCTION QUALITY.

${baseContext}

${strictRequirements}

REFACTORING REQUIREMENTS:
- Maintain the same functionality
- Improve code quality and maintainability
- Preserve existing tests
- Document major changes

Your refactored code will be validated. No placeholders or incomplete implementations allowed.`;

    case 'test_generation':
      return `You are an expert test engineer. Generate COMPLETE, RUNNABLE tests.

${baseContext}

${strictRequirements}

TEST REQUIREMENTS:
- Test ALL public methods/functions
- Include happy path and error scenarios
- Test edge cases (null, undefined, empty, boundary values)
- Use proper assertions from the test framework
- Include necessary setup/teardown
- Use descriptive test names

FORBIDDEN IN TESTS:
- Empty test bodies: it('should work', () => { })
- Placeholder comments: // TODO: add test
- Fake assertion methods

Your tests will be validated and must be executable without modifications.`;

    case 'documentation':
      return `You are a technical writer. Generate clear, comprehensive documentation.

${baseContext}

DOCUMENTATION REQUIREMENTS:
- Document all public functions/methods
- Include parameter types and descriptions
- Include return value descriptions
- Provide usage examples
- Keep descriptions clear and concise

Use JSDoc/TSDoc format for code documentation.`;

    default:
      return `You are a ${taskType.replace('_', ' ')} expert. ${baseContext}

${strictRequirements}`;
  }
}

/**
 * Build refinement prompt when validation fails
 */
export function buildRefinementPrompt(
  originalTask: string,
  previousCode: string,
  validationIssues: string
): string {
  return `The previous code generation had quality issues. Please fix them.

ORIGINAL TASK:
${originalTask}

PREVIOUS CODE (HAD ISSUES):
\`\`\`
${previousCode}
\`\`\`

VALIDATION ISSUES FOUND:
${validationIssues}

Generate the FIXED code now. Address ALL validation issues.

STRICT REQUIREMENTS:
1. NO placeholders (TODO, FIXME, PLACEHOLDER, STUB, TBD, MOCK)
2. NO "implement this later" or "not implemented" comments
3. NO fake/non-existent APIs - only use real, documented APIs
4. NO empty function bodies - implement all logic
5. MUST be syntactically correct (balanced braces, brackets, parens)
6. MUST use proper imports (ES6 import, not require())
7. MUST be production-ready and complete

Provide ONLY the corrected code in a code block. No explanations.

\`\`\`typescript
// Fixed code here
\`\`\`
`;
}

