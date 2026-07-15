import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jsonutilsGovernanceTools } from './jsonutils-governance-tool-definitions.mjs';
const emptySchema = { type: 'object', additionalProperties: false, properties: {} };
const boundedIntegerSchema = (property, max, defaultValue) => ({
  type: 'object',
  additionalProperties: false,
  properties: { [property]: { type: 'integer', minimum: 1, maximum: max, default: defaultValue } },
});
const topSchema = (max, defaultValue) => boundedIntegerSchema('top', max, defaultValue);
const tool = (name, description, inputSchema = emptySchema) => ({
  name, description, inputSchema, outputSchema: { type: 'object', additionalProperties: true },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
});
test('MCP governance tool definitions keep fixed order, schemas, and read-only annotations', () => {
  assert.deepEqual(jsonutilsGovernanceTools, [
    tool('ai_governance_report', 'Run check-ai-governance and return its machine-readable JSON report.', topSchema(50, 35)),
    tool('maintainability_budget_report', 'Run check-maintainability-budgets with JSON output and a bounded top list.', topSchema(50, 10)),
    tool('ai_governance_context', 'Build a compact JSON context snapshot for AI governance onboarding.', topSchema(20, 5)),
    tool('ai_governance_scorecard', 'Return the current AI governance maturity scorecard and next commands.', topSchema(50, 35)),
    tool('ai_governance_artifact_freshness', 'Check whether local AI governance artifacts match current live governance reports.'),
    tool('ai_asset_inventory', 'Return a bounded structured inventory of registered AI collaboration assets.', boundedIntegerSchema('limit', 100, 20)),
    tool('ai_evaluation_summary', 'Return bounded AI behavior eval, feedback, experiment, and outcome provenance.', boundedIntegerSchema('limit', 50, 10)),
    tool('ai_worktree_snapshot', 'Return a bounded read-only git worktree snapshot for AI handoff safety.', boundedIntegerSchema('maxFiles', 200, 50)),
    tool('ai_handoff_brief', 'Return a compact AI handoff brief with governance focus and worktree risk.', {
      type: 'object',
      additionalProperties: false,
      properties: {
        top: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
        maxFiles: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    }),
    tool('ai_decision_summary', 'Return recent AI governance decisions as bounded structured JSON.', boundedIntegerSchema('limit', 20, 5)),
    tool('ai_validation_plan', 'Return full changed-file validation commands with bounded sample coverage.', boundedIntegerSchema('maxFiles', 200, 50)),
  ]);
});
