import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callGovernanceMcpTool } from '../ci/jsonutilsGovernanceMcpToolCallClient.mjs';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request } from '../ci/mcpContentLengthStdioClient.mjs';

test('MCP stdio serves focused scorecard and worktree tools', async (t) => {
  const { child, readFrame } = startGovernanceMcpServer(t);
  await request(child, readFrame, 1, 'initialize');

  const scorecard = await callGovernanceMcpTool(child, readFrame, 2, 'ai_governance_scorecard', { top: 35 }, 30000);
  assert.equal(scorecard.reportType, 'jsonutils-governance-scorecard');
  assert.equal(scorecard.maturityScorecard.reportType, 'ai-governance-maturity-scorecard');

  const freshness = await callGovernanceMcpTool(child, readFrame, 3, 'ai_governance_artifact_freshness', {}, 30000);
  assert.equal(freshness.reportType, 'ai-governance-artifact-freshness'); assert.equal(typeof freshness.ok, 'boolean');

  const assets = await callGovernanceMcpTool(child, readFrame, 4, 'ai_asset_inventory', { limit: 3 });
  assert.equal(assets.reportType, 'jsonutils-asset-inventory');
  assert.ok(assets.assets.length <= 3);

  const worktree = await callGovernanceMcpTool(child, readFrame, 5, 'ai_worktree_snapshot', { maxFiles: 5 });
  assert.equal(worktree.reportType, 'jsonutils-worktree-snapshot');
  assert.equal(typeof worktree.branch.current, 'string');
  assert.ok(worktree.files.length <= 5);
});
