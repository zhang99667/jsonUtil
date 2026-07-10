import assert from 'node:assert/strict';
import { test } from 'node:test';

import { listJsonutilsGovernanceTools } from './jsonutils-governance-server.mjs';

test('MCP server lists governance tools', () => {
  assert.deepEqual(listJsonutilsGovernanceTools().tools.map(tool => tool.name), [
    'ai_governance_report',
    'maintainability_budget_report',
    'ai_governance_context',
    'ai_governance_scorecard',
    'ai_governance_artifact_freshness',
    'ai_asset_inventory',
    'ai_worktree_snapshot',
    'ai_handoff_brief',
    'ai_decision_summary',
    'ai_validation_plan',
  ]);
});
