import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { listJsonutilsGovernanceTools } from './jsonutils-governance-server.mjs';
import { createMessageReader, request } from '../ci/mcpLineDelimitedStdioClient.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('MCP server lists governance tools', () => {
  assert.deepEqual(listJsonutilsGovernanceTools().tools.map(tool => tool.name), [
    'ai_governance_report',
    'maintainability_budget_report',
    'ai_governance_context',
    'ai_governance_scorecard',
    'ai_governance_artifact_freshness',
    'ai_asset_inventory',
    'ai_evaluation_summary',
    'ai_worktree_snapshot',
    'ai_handoff_brief',
    'ai_decision_summary',
    'ai_validation_plan',
  ]);
});

test('project plugin launcher starts governance server over stdio', async (t) => {
  const child = spawn(
    process.execPath,
    [path.join(rootDir, 'plugins/jsonutils-governance-mcp/scripts/server.mjs')],
    { cwd: rootDir, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString('utf8');
  });
  t.after(() => child.kill());

  const readMessage = createMessageReader(child.stdout, () => stderr);
  const response = await request(child, readMessage, 1, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'project-plugin-launcher-test', version: '1.0.0' },
  });

  assert.equal(response.result.serverInfo.name, 'jsonutils-governance');
  assert.equal(response.result.serverInfo.version, '0.3.0');
});
