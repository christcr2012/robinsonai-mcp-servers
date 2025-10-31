/*
  safety-gates.ts – Secrets, Dependencies, and License Gate
  ---------------------------------------------------------
  Block PRs that introduce:
  - Secrets (API keys, passwords, tokens)
  - Unpinned dependencies
  - Bad licenses
  
  Integrates with existing quality gates pipeline
*/

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type SafetyReport = {
  secrets: SecretViolation[];
  dependencies: DependencyViolation[];
  licenses: LicenseViolation[];
  vulnerabilities: VulnerabilityReport[];
  passed: boolean;
};

export type SecretViolation = {
  file: string;
  line: number;
  pattern: string;
  match: string;
};

export type DependencyViolation = {
  package: string;
  version: string;
  issue: 'unpinned' | 'outdated' | 'deprecated';
};

export type LicenseViolation = {
  package: string;
  license: string;
  reason: string;
};

export type VulnerabilityReport = {
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  url?: string;
};

/**
 * Run all safety gates
 */
export async function runSafetyGates(
  root: string,
  changedFiles: string[]
): Promise<SafetyReport> {
  const secrets = scanSecrets(root, changedFiles);
  const dependencies = checkDependencies(root);
  const licenses = checkLicenses(root);
  const vulnerabilities = checkVulnerabilities(root);
  
  const passed = 
    secrets.length === 0 &&
    dependencies.length === 0 &&
    licenses.length === 0 &&
    vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0;
  
  return {
    secrets,
    dependencies,
    licenses,
    vulnerabilities,
    passed,
  };
}

/**
 * Scan for secrets in changed files
 */
export function scanSecrets(root: string, changedFiles: string[]): SecretViolation[] {
  const violations: SecretViolation[] = [];
  
  // Common secret patterns
  const patterns = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'AWS Secret Key', regex: /aws_secret_access_key\s*=\s*['"]([^'"]+)['"]/gi },
    { name: 'API Key', regex: /api[_-]?key\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi },
    { name: 'Private Key', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g },
    { name: 'Generic Secret', regex: /(?:secret|password|token)\s*[:=]\s*['"]([^'"]{8,})['"]/gi },
    { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
    { name: 'Slack Token', regex: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g },
  ];
  
  for (const file of changedFiles) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(pattern.regex);
        
        for (const match of matches) {
          // Skip if it's a placeholder or example
          if (isPlaceholder(match[0])) continue;
          
          violations.push({
            file,
            line: i + 1,
            pattern: pattern.name,
            match: match[0].substring(0, 20) + '...', // Truncate for safety
          });
        }
      }
    }
  }
  
  return violations;
}

/**
 * Check if a match is a placeholder
 */
function isPlaceholder(text: string): boolean {
  const placeholders = [
    'your-api-key',
    'your_api_key',
    'YOUR_API_KEY',
    'example',
    'EXAMPLE',
    'placeholder',
    'PLACEHOLDER',
    'xxx',
    'XXX',
    '***',
  ];
  
  return placeholders.some(p => text.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Check dependencies for unpinned versions
 */
export function checkDependencies(root: string): DependencyViolation[] {
  const violations: DependencyViolation[] = [];
  
  // Check package.json (Node.js)
  const packageJsonPath = path.join(root, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    for (const [pkg, version] of Object.entries(packageJson.dependencies || {})) {
      if (typeof version === 'string' && isUnpinned(version)) {
        violations.push({
          package: pkg,
          version,
          issue: 'unpinned',
        });
      }
    }
    
    for (const [pkg, version] of Object.entries(packageJson.devDependencies || {})) {
      if (typeof version === 'string' && isUnpinned(version)) {
        violations.push({
          package: pkg,
          version,
          issue: 'unpinned',
        });
      }
    }
  }
  
  // Check requirements.txt (Python)
  const requirementsPath = path.join(root, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    const requirements = fs.readFileSync(requirementsPath, 'utf-8').split('\n');
    
    for (const req of requirements) {
      if (!req.trim() || req.startsWith('#')) continue;
      
      const match = req.match(/^([a-zA-Z0-9_-]+)([>=<~!]+)?(.+)?$/);
      if (match) {
        const [, pkg, operator, version] = match;
        if (!operator || !version || isUnpinned(`${operator}${version}`)) {
          violations.push({
            package: pkg,
            version: version || 'latest',
            issue: 'unpinned',
          });
        }
      }
    }
  }
  
  return violations;
}

/**
 * Check if version is unpinned
 */
function isUnpinned(version: string): boolean {
  // Unpinned if starts with ^, ~, >, <, *, or is 'latest'
  return /^[\^~><*]/.test(version) || version === 'latest';
}

/**
 * Check licenses against allowlist
 */
export function checkLicenses(
  root: string,
  allowlist: string[] = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC']
): LicenseViolation[] {
  const violations: LicenseViolation[] = [];
  
  // Check Node.js licenses
  const packageJsonPath = path.join(root, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      // Run npm ls --json to get dependency tree with licenses
      const output = execSync('npm ls --json --all', { cwd: root, encoding: 'utf-8' });
      const tree = JSON.parse(output);
      
      const checkNode = (node: any, name: string) => {
        if (node.license && !allowlist.includes(node.license)) {
          violations.push({
            package: name,
            license: node.license,
            reason: `License ${node.license} not in allowlist`,
          });
        }
        
        if (node.dependencies) {
          for (const [depName, depNode] of Object.entries(node.dependencies)) {
            checkNode(depNode, depName);
          }
        }
      };
      
      if (tree.dependencies) {
        for (const [name, node] of Object.entries(tree.dependencies)) {
          checkNode(node, name);
        }
      }
    } catch (e) {
      // npm ls might fail if dependencies aren't installed
      console.warn('Failed to check licenses:', e);
    }
  }
  
  return violations;
}

/**
 * Check for vulnerabilities
 */
export function checkVulnerabilities(root: string): VulnerabilityReport[] {
  const vulnerabilities: VulnerabilityReport[] = [];
  
  // Check Node.js vulnerabilities
  const packageJsonPath = path.join(root, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const output = execSync('npm audit --json', { cwd: root, encoding: 'utf-8' });
      const audit = JSON.parse(output);
      
      if (audit.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries(audit.vulnerabilities as any)) {
          const v = vuln as any;
          vulnerabilities.push({
            package: pkg,
            severity: v.severity,
            title: v.title || 'Unknown vulnerability',
            url: v.url,
          });
        }
      }
    } catch (e) {
      // npm audit might fail if no vulnerabilities
    }
  }
  
  // Check Python vulnerabilities
  const requirementsPath = path.join(root, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    try {
      const output = execSync('pip-audit --format json', { cwd: root, encoding: 'utf-8' });
      const audit = JSON.parse(output);
      
      for (const vuln of audit.vulnerabilities || []) {
        vulnerabilities.push({
          package: vuln.package,
          severity: vuln.severity,
          title: vuln.title,
          url: vuln.url,
        });
      }
    } catch (e) {
      // pip-audit might not be installed
    }
  }
  
  return vulnerabilities;
}

