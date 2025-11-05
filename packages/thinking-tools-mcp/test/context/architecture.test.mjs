import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ArchitectureMemory } from '../../dist/context/architecture.js';

function createSymbol(name, file) {
  return {
    name,
    type: 'class',
    file,
    line: 1,
    language: 'typescript',
    isPublic: true,
    isExported: true,
  };
}

export default async function testArchitectureMemory() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'arch-root-'));
  const symbolIndex = {
    symbols: [
      createSymbol('UserController', 'src/controllers/UserController.ts'),
      createSymbol('AdminController', 'src/controllers/AdminController.ts'),
      createSymbol('UserService', 'src/services/UserService.ts'),
      createSymbol('AuditService', 'src/services/AuditService.ts'),
      createSymbol('UserRepository', 'src/repositories/UserRepository.ts'),
      createSymbol('AppComponent', 'src/components/AppComponent.tsx'),
      createSymbol('DashboardComponent', 'src/components/DashboardComponent.tsx'),
      createSymbol('FooterComponent', 'src/components/FooterComponent.tsx'),
      createSymbol('useDashboard', 'src/hooks/useDashboard.ts'),
      createSymbol('AppContext', 'src/context/AppContext.ts'),
      createSymbol('OrderDomainService', 'src/domain/orders/OrderDomainService.ts'),
      createSymbol('OrderApplicationService', 'src/application/orders/OrderApplicationService.ts'),
      createSymbol('OrderInfrastructureService', 'src/infrastructure/orders/OrderInfrastructureService.ts'),
      createSymbol('McpRegistry', 'packages/mcp/server.ts'),
      createSymbol('ContextEngine', 'src/engine/ContextEngine.ts'),
      createSymbol('ContextIndexerEngine', 'src/engine/ContextIndexerEngine.ts'),
    ],
    files: [
      path.join(root, 'src/controllers/UserController.ts'),
      path.join(root, 'src/controllers/AdminController.ts'),
      path.join(root, 'src/services/UserService.ts'),
      path.join(root, 'src/services/AuditService.ts'),
      path.join(root, 'src/repositories/UserRepository.ts'),
      path.join(root, 'src/components/AppComponent.tsx'),
      path.join(root, 'src/components/DashboardComponent.tsx'),
      path.join(root, 'src/components/FooterComponent.tsx'),
      path.join(root, 'src/hooks/useDashboard.ts'),
      path.join(root, 'src/context/AppContext.ts'),
      path.join(root, 'src/domain/orders/OrderDomainService.ts'),
      path.join(root, 'src/application/orders/OrderApplicationService.ts'),
      path.join(root, 'src/infrastructure/orders/OrderInfrastructureService.ts'),
      path.join(root, 'packages/mcp/server.ts'),
      path.join(root, 'src/engine/ContextEngine.ts'),
      path.join(root, 'src/engine/ContextIndexerEngine.ts'),
    ],
    byName: new Map(),
    byFile: new Map(),
  };

  const graph = [
    { from: 'src/controllers/UserController.ts', to: 'src/services/UserService.ts' },
    { from: 'src/controllers/AdminController.ts', to: 'src/services/AuditService.ts' },
    { from: 'src/services/UserService.ts', to: 'src/repositories/UserRepository.ts' },
  ];

  const memory = new ArchitectureMemory(root);
  await memory.refresh(symbolIndex, graph);

  const summary = memory.summary();
  const ids = summary.patterns.map(p => p.id);
  ['layered-services', 'react-component-system', 'domain-driven-design', 'mcp-server-bundle', 'context-engine-core'].forEach(id => {
    assert(ids.includes(id));
  });

  const annotated = memory.annotateResults('service controller architecture', [
    { uri: 'src/controllers/UserController.ts', score: 0.5, meta: {} },
  ])[0];

  assert(Array.isArray(annotated.meta.architecture));
  assert(annotated.meta.architecture.some(tag => tag.id === 'layered-services'));
  assert(annotated.score > 0.5);

  await fs.rm(root, { recursive: true, force: true });
}
