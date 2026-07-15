const emptyInputSchema = { type: 'object', additionalProperties: false, properties: {} };

const boundedIntegerInputSchema = (property, max, defaultValue) => ({
  type: 'object',
  additionalProperties: false,
  properties: { [property]: { type: 'integer', minimum: 1, maximum: max, default: defaultValue } },
});

const topInputSchema = (max, defaultValue) => boundedIntegerInputSchema('top', max, defaultValue);
const jsonObjectOutputSchema = { type: 'object', additionalProperties: true };
const readOnlyAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const defineTool = (name, description, inputSchema = emptyInputSchema) => ({
  name, description, inputSchema, outputSchema: jsonObjectOutputSchema, annotations: readOnlyAnnotations,
});

const handoffInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    top: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
    maxFiles: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
};

export const governanceReportTool = defineTool('ai_governance_report', 'Run check-ai-governance and return its machine-readable JSON report.', topInputSchema(50, 35));
export const budgetReportTool = defineTool('maintainability_budget_report', 'Run check-maintainability-budgets with JSON output and a bounded top list.', topInputSchema(50, 10));
export const governanceContextTool = defineTool('ai_governance_context', 'Build a compact JSON context snapshot for AI governance onboarding.', topInputSchema(20, 5));
export const governanceScorecardTool = defineTool('ai_governance_scorecard', 'Return the current AI governance maturity scorecard and next commands.', topInputSchema(50, 35));
export const artifactFreshnessTool = defineTool('ai_governance_artifact_freshness', 'Check whether local AI governance artifacts match current live governance reports.');
export const assetInventoryTool = defineTool('ai_asset_inventory', 'Return a bounded structured inventory of registered AI collaboration assets.', boundedIntegerInputSchema('limit', 100, 20));
export const evaluationSummaryTool = defineTool('ai_evaluation_summary', 'Return bounded AI behavior eval, feedback, experiment, and outcome provenance.', boundedIntegerInputSchema('limit', 50, 10));
export const worktreeSnapshotTool = defineTool('ai_worktree_snapshot', 'Return a bounded read-only git worktree snapshot for AI handoff safety.', boundedIntegerInputSchema('maxFiles', 200, 50));
export const handoffBriefTool = defineTool('ai_handoff_brief', 'Return a compact AI handoff brief with governance focus and worktree risk.', handoffInputSchema);
export const decisionSummaryTool = defineTool('ai_decision_summary', 'Return recent AI governance decisions as bounded structured JSON.', boundedIntegerInputSchema('limit', 20, 5));
export const validationPlanTool = defineTool('ai_validation_plan', 'Return full changed-file validation commands with bounded sample coverage.', boundedIntegerInputSchema('maxFiles', 200, 50));

export const jsonutilsGovernanceTools = [
  governanceReportTool,
  budgetReportTool,
  governanceContextTool,
  governanceScorecardTool,
  artifactFreshnessTool,
  assetInventoryTool,
  evaluationSummaryTool,
  worktreeSnapshotTool,
  handoffBriefTool,
  decisionSummaryTool,
  validationPlanTool,
];
