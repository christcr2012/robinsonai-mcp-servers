/**
 * Template Engine
 * 
 * Scaffolds code from templates (0 AI credits after initial extraction!)
 */

import Handlebars from 'handlebars';
import { DatabaseManager } from './database.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ScaffoldOptions {
  name: string;
  variables: Record<string, any>;
  outputPath?: string;
}

export class TemplateEngine {
  private db: DatabaseManager;
  private handlebars: typeof Handlebars;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.handlebars = Handlebars;
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // PascalCase helper
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    });

    // camelCase helper
    this.handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    // kebab-case helper
    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    // snake_case helper
    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });
  }

  /**
   * Scaffold from template
   */
  async scaffold(templateName: string, options: ScaffoldOptions): Promise<{
    files: Array<{ path: string; content: string }>;
    augmentCreditsUsed: number;
    creditsSaved: number;
  }> {
    // Get template from database
    const template = this.db.getTemplate(templateName);
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Compile template
    const compiled = this.handlebars.compile(template.content);
    
    // Render with variables
    const rendered = compiled(options.variables);

    // Parse rendered content into files
    const files = this.parseRenderedContent(rendered, options.outputPath);

    // If outputPath specified, write files
    if (options.outputPath) {
      for (const file of files) {
        const fullPath = path.join(options.outputPath, file.path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf-8');
      }
    }

    return {
      files,
      augmentCreditsUsed: 0, // No AI needed!
      creditsSaved: 5000, // vs Augment generating from scratch
    };
  }

  /**
   * Extract template from existing code
   */
  async extractTemplate(
    name: string,
    type: string,
    description: string,
    files: Array<{ path: string; content: string }>,
    variables: string[]
  ): Promise<void> {
    // Combine files into single template
    let templateContent = '';

    for (const file of files) {
      templateContent += `\n// FILE: ${file.path}\n`;
      templateContent += file.content;
      templateContent += '\n';
    }

    // Replace variable values with Handlebars placeholders
    for (const variable of variables) {
      const placeholder = `{{${variable}}}`;
      // This is simplified - real implementation would be smarter
      templateContent = templateContent.replace(new RegExp(variable, 'g'), placeholder);
    }

    // Save to database
    this.db.saveTemplate({
      name,
      type,
      description,
      content: templateContent,
      variables,
    });
  }

  /**
   * List available templates
   */
  listTemplates(type?: string): any[] {
    return this.db.listTemplates(type);
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    // React Component Template
    this.db.saveTemplate({
      name: 'react-component',
      type: 'component',
      description: 'React component with TypeScript',
      content: `// FILE: {{kebabCase name}}.tsx
import React from 'react';

export interface {{pascalCase name}}Props {
  // Add props here
}

export const {{pascalCase name}}: React.FC<{{pascalCase name}}Props> = (props) => {
  return (
    <div className="{{kebabCase name}}">
      <h1>{{pascalCase name}}</h1>
    </div>
  );
};

// FILE: {{kebabCase name}}.module.css
.{{kebabCase name}} {
  /* Add styles here */
}
`,
      variables: ['name'],
    });

    // API Endpoint Template
    this.db.saveTemplate({
      name: 'api-endpoint',
      type: 'api',
      description: 'Next.js API route with TypeScript',
      content: `// FILE: app/api/{{kebabCase name}}/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement GET logic
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement POST logic
    return NextResponse.json({ message: 'Created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`,
      variables: ['name'],
    });

    // Database Schema Template
    this.db.saveTemplate({
      name: 'database-schema',
      type: 'database',
      description: 'Supabase/PostgreSQL table schema',
      content: `-- FILE: migrations/{{timestamp}}_create_{{snakeCase name}}_table.sql
CREATE TABLE {{snakeCase name}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add columns here
  
  CONSTRAINT {{snakeCase name}}_pkey PRIMARY KEY (id)
);

-- Add indexes
CREATE INDEX idx_{{snakeCase name}}_created_at ON {{snakeCase name}}(created_at);

-- Add RLS policies
ALTER TABLE {{snakeCase name}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own {{snakeCase name}}"
  ON {{snakeCase name}}
  FOR SELECT
  USING (auth.uid() = user_id);
`,
      variables: ['name', 'timestamp'],
    });

    // Test Suite Template
    this.db.saveTemplate({
      name: 'test-suite',
      type: 'test',
      description: 'Jest/Vitest test suite',
      content: `// FILE: {{kebabCase name}}.test.ts
import { describe, it, expect } from 'vitest';
import { {{pascalCase name}} } from './{{kebabCase name}}';

describe('{{pascalCase name}}', () => {
  it('should work', () => {
    // TODO: Add test
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });

  it('should handle errors', () => {
    // TODO: Add error handling tests
  });
});
`,
      variables: ['name'],
    });

    // Feature Template (multiple files)
    this.db.saveTemplate({
      name: 'feature-complete',
      type: 'feature',
      description: 'Complete feature with component, API, and tests',
      content: `// FILE: components/{{kebabCase name}}/{{pascalCase name}}.tsx
import React from 'react';

export const {{pascalCase name}}: React.FC = () => {
  return <div>{{pascalCase name}}</div>;
};

// FILE: app/api/{{kebabCase name}}/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Success' });
}

// FILE: components/{{kebabCase name}}/{{pascalCase name}}.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { {{pascalCase name}} } from './{{pascalCase name}}';

describe('{{pascalCase name}}', () => {
  it('renders', () => {
    const { container } = render(<{{pascalCase name}} />);
    expect(container).toBeTruthy();
  });
});
`,
      variables: ['name'],
    });
  }

  /**
   * Parse rendered content into separate files
   */
  private parseRenderedContent(
    content: string,
    basePath?: string
  ): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];
    const filePattern = /\/\/ FILE: (.+?)\n([\s\S]+?)(?=\/\/ FILE:|$)/g;
    
    let match;
    while ((match = filePattern.exec(content)) !== null) {
      const [, filePath, fileContent] = match;
      files.push({
        path: filePath.trim(),
        content: fileContent.trim(),
      });
    }

    // If no FILE markers, treat entire content as single file
    if (files.length === 0) {
      files.push({
        path: basePath || 'output.txt',
        content: content.trim(),
      });
    }

    return files;
  }
}

