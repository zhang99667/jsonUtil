import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callGovernanceMcpTool } from '../ci/jsonutilsGovernanceMcpToolCallClient.mjs';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request } from '../ci/mcpLineDelimitedStdioClient.mjs';

test('MCP stdio serves focused scorecard and worktree tools', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  await request(child, readMessage, 1, 'initialize');

  const scorecard = await callGovernanceMcpTool(child, readMessage, 2, 'ai_governance_scorecard', { top: 35 }, 30000);
  assert.equal(scorecard.reportType, 'jsonutils-governance-scorecard');
  assert.equal(scorecard.maturityScorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.equal(typeof scorecard.maturityScorecard.nextFocus.id, 'string');

  const freshness = await callGovernanceMcpTool(child, readMessage, 3, 'ai_governance_artifact_freshness', {}, 30000);
  assert.equal(freshness.reportType, 'ai-governance-artifact-freshness'); assert.equal(typeof freshness.ok, 'boolean');

  const assets = await callGovernanceMcpTool(child, readMessage, 4, 'ai_asset_inventory', { limit: 3 });
  assert.equal(assets.reportType, 'jsonutils-asset-inventory');
  assert.ok(assets.assets.length <= 3);

  const evaluations = await callGovernanceMcpTool(child, readMessage, 5, 'ai_evaluation_summary', { limit: 3 });
  assert.equal(evaluations.reportType, 'jsonutils-evaluation-summary');
  assert.ok(evaluations.recentOutcomes.length <= 3);

  const worktree = await callGovernanceMcpTool(child, readMessage, 6, 'ai_worktree_snapshot', { maxFiles: 5 });
  assert.equal(worktree.reportType, 'jsonutils-worktree-snapshot');
  assert.equal(typeof worktree.branch.current, 'string');
  assert.ok(worktree.files.length <= 5);
});
