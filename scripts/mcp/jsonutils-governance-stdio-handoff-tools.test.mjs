import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callGovernanceMcpTool } from '../ci/jsonutilsGovernanceMcpToolCallClient.mjs';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request } from '../ci/mcpLineDelimitedStdioClient.mjs';

test('MCP stdio serves handoff, decision and validation tools', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  await request(child, readMessage, 1, 'initialize');

  const handoff = await callGovernanceMcpTool(child, readMessage, 2, 'ai_handoff_brief', { top: 1, maxFiles: 3 }, 30000);
  assert.equal(handoff.reportType, 'jsonutils-handoff-brief');
  assert.equal(typeof handoff.governance.status, 'string');
  assert.ok(handoff.worktree.files.length <= 3);
  assert.equal(handoff.validationPlan.reportType, 'jsonutils-validation-plan');

  const decisions = await callGovernanceMcpTool(child, readMessage, 3, 'ai_decision_summary', { limit: 2 });
  assert.equal(decisions.reportType, 'jsonutils-decision-summary');
  assert.ok(decisions.decisions.length <= 2);
  assert.equal(typeof decisions.decisions[0].decision, 'string');

  const validation = await callGovernanceMcpTool(child, readMessage, 4, 'ai_validation_plan', { maxFiles: 5 });
  assert.equal(validation.reportType, 'jsonutils-validation-plan');
  assert.ok(Array.isArray(validation.commands));

  const scorecard = await callGovernanceMcpTool(child, readMessage, 5, 'ai_governance_scorecard', { top: 35 }, 30000);
  const maintainability = scorecard.maturityScorecard.dimensions.find(item => item.id === 'maintainability-headroom');
  assert.deepEqual(handoff.governance.aiInfraStatus, maintainability.details.maintainabilityHotspots);
});
