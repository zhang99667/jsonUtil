import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request } from '../ci/mcpLineDelimitedStdioClient.mjs';

test('MCP config starts governance server over stdio and serves context', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  const initialized = await request(child, readMessage, 1, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'stdio-test', version: '1.0.0' },
  });
  assert.equal(initialized.result.serverInfo.name, 'jsonutils-governance');

  const tools = await request(child, readMessage, 2, 'tools/list');
  assert.deepEqual(tools.result.tools.map(tool => tool.name), [
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

  const registry = await request(child, readMessage, 3, 'resources/read', {
    uri: 'jsonutils://ai-governance/asset-registry',
  });
  assert.match(registry.result.contents[0].text, /# AI 协作资产注册表/);

  const contextResult = await request(child, readMessage, 4, 'tools/call', {
    name: 'ai_governance_context',
    arguments: { top: 1 },
  }, 30000);
  const context = JSON.parse(contextResult.result.content[0].text);
  assert.equal(context.reportType, 'jsonutils-governance-context');
  assert.equal(context.ok, context.governance.ok && context.maintainability.ok);
  assert.equal(context.maturityScorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.ok(context.project.latestDecision?.decision);
  assert.ok(context.nextCommands.includes('node scripts/ci/check-ai-governance.mjs'));

});
