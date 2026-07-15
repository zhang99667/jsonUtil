import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES,
  discoverAiGovernanceImplementationFiles,
} from './aiGovernanceImplementationFiles.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('AI implementation universe 覆盖 namespace、eval data 与控制面', () => {
  const files = discoverAiGovernanceImplementationFiles(rootDir);
  const fileSet = new Set(files);
  assert.equal(fileSet.size, files.length);
  assert.deepEqual(files, [...files].sort());
  [
    'scripts/ci/aiGovernanceRules.mjs',
    'scripts/ci/aiGovernanceCiContract.test.mjs',
    'scripts/mcp/jsonutils-governance-server.test.mjs',
    'scripts/ci/manage-project-plugins.mjs',
    'scripts/ci/mcpLineDelimitedStdioClient.test.mjs',
    'evals/ai-governance/experiments.json',
  ].forEach(file => assert.ok(fileSet.has(file), file));
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES.forEach(file => assert.ok(fileSet.has(file), file));
  [
    'frontend/src/services/aiService.ts',
    'scripts/ci/check-backend-api-matrix.mjs',
    'scripts/ci/maintainability-budget-app-rules.mjs',
    '.github/workflows/deploy.yml',
  ].forEach(file => assert.equal(fileSet.has(file), false, file));
});
