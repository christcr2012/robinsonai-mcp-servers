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

    let prompt = `You are an expert software engineer. Generate production-ready code.

Task: ${task}
Context: ${context}

Requirements:
- Write clean, maintainable code
- Follow best practices for the framework/language
- Include proper error handling
- Add TypeScript types (if applicable)
- Add comments for complex logic only
- Make code production-ready

`;

    if (template && template !== 'none') {
      prompt += `Use the ${template} template as a guide.\n\n`;
    }

    prompt += `Generate the code now. Wrap code in triple backticks with the file path as a comment:

\`\`\`typescript // path/to/file.ts
// Your code here
\`\`\`

If multiple files are needed, provide each in separate code blocks.`;

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

    let prompt = `You are an expert software engineer. Refactor this code according to the instructions.

Code to refactor:
\`\`\`
${code}
\`\`\`

Instructions: ${instructions}

`;

    if (style) {
      prompt += `Code style: ${style}\n\n`;
    }

    prompt += `Requirements:
- Maintain the same functionality
- Improve code quality and maintainability
- Follow ${style || 'modern'} coding practices
- Preserve existing tests (if any)
- Add comments explaining major changes

Provide:
1. Refactored code (in triple backticks)
2. List of changes made (use bullet points starting with -)

Example format:
\`\`\`typescript
// Refactored code here
\`\`\`

Changes made:
- Extracted UserProfile component
- Renamed handleClick to handleUserClick
- Applied dependency injection pattern`;

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

    let prompt = `You are an expert test engineer. Generate comprehensive tests for this code.

Code to test:
\`\`\`
${code}
\`\`\`

Test framework: ${framework}
Coverage level: ${coverage || 'comprehensive'}

Requirements:
- Test all public methods/functions
- Include edge cases
- Test error handling
- Use descriptive test names
- Follow ${framework} best practices
- Include setup/teardown if needed

`;

    if (coverage === 'edge-cases') {
      prompt += `Focus heavily on edge cases:
- Null/undefined inputs
- Empty arrays/objects
- Boundary values
- Error conditions
- Race conditions (if applicable)

`;
    }

    prompt += `Generate the test file now. Wrap in triple backticks.`;

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

