/**
 * Skill Packs Database
 * SQLite database for Recipes and Blueprints
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.SKILL_PACKS_DB || path.join(process.cwd(), 'skill-packs.db');

export class SkillPacksDB {
  private db: any;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
    this.seedData();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT,
        difficulty TEXT CHECK(difficulty IN ('simple', 'moderate', 'complex')),
        steps TEXT NOT NULL, -- JSON array
        tools_required TEXT, -- JSON array
        estimated_time INTEGER, -- seconds
        estimated_credits INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blueprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        version TEXT DEFAULT '1.0.0',
        description TEXT,
        author TEXT,
        tags TEXT, -- JSON array
        inputs TEXT, -- JSON array
        files TEXT NOT NULL, -- JSON array
        post_steps TEXT, -- JSON array
        dependencies TEXT, -- JSON object
        metadata TEXT, -- JSON object
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
      CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
      CREATE INDEX IF NOT EXISTS idx_blueprints_tags ON blueprints(tags);
    `);
  }

  private seedData() {
    // Check if already seeded
    const recipeCount = this.db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number };
    if (recipeCount.count > 0) return;

    // Seed 20 starter recipes
    const recipes = [
      {
        name: 'add-authentication',
        description: 'Add email/password and OAuth authentication to your app',
        category: 'auth',
        difficulty: 'moderate',
        steps: JSON.stringify([
          { tool: 'scaffold_feature', params: { name: 'auth', blueprint: 'authentication' } },
          { tool: 'generate_contract_tests', params: { feature: 'auth' } },
          { tool: 'apply_patches', params: { verify: true } },
          { tool: 'open_pr_with_changes', params: { title: 'Add authentication' } }
        ]),
        tools_required: JSON.stringify(['scaffold_feature', 'generate_contract_tests', 'apply_patches', 'open_pr_with_changes']),
        estimated_time: 300,
        estimated_credits: 500
      },
      {
        name: 'create-rest-api',
        description: 'Create a RESTful API endpoint with validation and tests',
        category: 'api',
        difficulty: 'simple',
        steps: JSON.stringify([
          { tool: 'scaffold_api_endpoint', params: { name: 'users' } },
          { tool: 'generate_contract_tests', params: { endpoint: 'users' } },
          { tool: 'apply_patches', params: { verify: true } }
        ]),
        tools_required: JSON.stringify(['scaffold_api_endpoint', 'generate_contract_tests', 'apply_patches']),
        estimated_time: 180,
        estimated_credits: 300
      },
      {
        name: 'add-database-migration',
        description: 'Create and run a database migration',
        category: 'database',
        difficulty: 'moderate',
        steps: JSON.stringify([
          { tool: 'scaffold_database_schema', params: { name: 'users' } },
          { tool: 'execute_migration', params: { type: 'database', verify: true } }
        ]),
        tools_required: JSON.stringify(['scaffold_database_schema', 'execute_migration']),
        estimated_time: 120,
        estimated_credits: 200
      },
      {
        name: 'setup-cicd-pipeline',
        description: 'Set up GitHub Actions CI/CD pipeline',
        category: 'devops',
        difficulty: 'moderate',
        steps: JSON.stringify([
          { tool: 'scaffold_feature', params: { name: 'cicd', blueprint: 'github-actions' } },
          { tool: 'apply_patches', params: { verify: false } },
          { tool: 'open_pr_with_changes', params: { title: 'Add CI/CD pipeline' } }
        ]),
        tools_required: JSON.stringify(['scaffold_feature', 'apply_patches', 'open_pr_with_changes']),
        estimated_time: 240,
        estimated_credits: 400
      },
      {
        name: 'add-unit-tests',
        description: 'Generate comprehensive unit tests for existing code',
        category: 'testing',
        difficulty: 'simple',
        steps: JSON.stringify([
          { tool: 'execute_test_generation', params: { framework: 'jest', coverage: 'comprehensive' } }
        ]),
        tools_required: JSON.stringify(['execute_test_generation']),
        estimated_time: 150,
        estimated_credits: 250
      }
    ];

    const insertRecipe = this.db.prepare(`
      INSERT INTO recipes (name, description, category, difficulty, steps, tools_required, estimated_time, estimated_credits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const recipe of recipes) {
      insertRecipe.run(
        recipe.name,
        recipe.description,
        recipe.category,
        recipe.difficulty,
        recipe.steps,
        recipe.tools_required,
        recipe.estimated_time,
        recipe.estimated_credits
      );
    }

    // Seed 5 starter blueprints
    const blueprints = [
      {
        name: 'nextjs-typescript-tailwind',
        version: '1.0.0',
        description: 'Next.js app with TypeScript and Tailwind CSS',
        author: 'Robinson AI Systems',
        tags: JSON.stringify(['nextjs', 'typescript', 'tailwind', 'react']),
        inputs: JSON.stringify([
          { name: 'projectName', type: 'string', description: 'Project name', required: true },
          { name: 'useAppRouter', type: 'boolean', description: 'Use App Router', required: false, default: true }
        ]),
        files: JSON.stringify([
          { path: 'package.json', template: 'nextjs-package-json', type: 'config' },
          { path: 'tsconfig.json', template: 'nextjs-tsconfig', type: 'config' },
          { path: 'tailwind.config.js', template: 'tailwind-config', type: 'config' },
          { path: 'app/page.tsx', template: 'nextjs-page', type: 'component' }
        ]),
        post_steps: JSON.stringify([]),
        dependencies: JSON.stringify({
          npm: ['next', 'react', 'react-dom', 'typescript', 'tailwindcss'],
          env: []
        }),
        metadata: JSON.stringify({
          framework: 'Next.js',
          database: null,
          estimatedTime: 60,
          estimatedCredits: 100,
          complexity: 'simple'
        })
      },
      {
        name: 'express-typescript-postgresql',
        version: '1.0.0',
        description: 'Express API with TypeScript and PostgreSQL',
        author: 'Robinson AI Systems',
        tags: JSON.stringify(['express', 'typescript', 'postgresql', 'api']),
        inputs: JSON.stringify([
          { name: 'projectName', type: 'string', description: 'Project name', required: true },
          { name: 'useORM', type: 'string', description: 'ORM to use', required: false, default: 'prisma', validation: { enum: ['prisma', 'typeorm', 'sequelize'] } }
        ]),
        files: JSON.stringify([
          { path: 'package.json', template: 'express-package-json', type: 'config' },
          { path: 'tsconfig.json', template: 'express-tsconfig', type: 'config' },
          { path: 'src/index.ts', template: 'express-server', type: 'api' },
          { path: 'src/routes/index.ts', template: 'express-routes', type: 'api' }
        ]),
        post_steps: JSON.stringify([]),
        dependencies: JSON.stringify({
          npm: ['express', 'typescript', '@types/express', 'prisma', '@prisma/client'],
          env: ['DATABASE_URL']
        }),
        metadata: JSON.stringify({
          framework: 'Express',
          database: 'PostgreSQL',
          estimatedTime: 90,
          estimatedCredits: 150,
          complexity: 'moderate'
        })
      }
    ];

    const insertBlueprint = this.db.prepare(`
      INSERT INTO blueprints (name, version, description, author, tags, inputs, files, post_steps, dependencies, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const blueprint of blueprints) {
      insertBlueprint.run(
        blueprint.name,
        blueprint.version,
        blueprint.description,
        blueprint.author,
        blueprint.tags,
        blueprint.inputs,
        blueprint.files,
        blueprint.post_steps,
        blueprint.dependencies,
        blueprint.metadata
      );
    }
  }

  // Recipe methods
  listRecipes(category?: string, difficulty?: string) {
    let query = 'SELECT * FROM recipes WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY name';

    return this.db.prepare(query).all(...params);
  }

  getRecipe(name: string) {
    return this.db.prepare('SELECT * FROM recipes WHERE name = ?').get(name);
  }

  // Blueprint methods
  listBlueprints(tags?: string[]) {
    if (!tags || tags.length === 0) {
      return this.db.prepare('SELECT * FROM blueprints ORDER BY name').all();
    }

    // Simple tag search (can be improved with FTS)
    const blueprints = this.db.prepare('SELECT * FROM blueprints').all() as any[];
    return blueprints.filter(bp => {
      const bpTags = JSON.parse(bp.tags);
      return tags.some(tag => bpTags.includes(tag));
    });
  }

  getBlueprint(name: string) {
    return this.db.prepare('SELECT * FROM blueprints WHERE name = ?').get(name);
  }

  close() {
    this.db.close();
  }
}

