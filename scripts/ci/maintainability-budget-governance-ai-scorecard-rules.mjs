const governanceAiScorecardBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiScorecardMaintainabilityBudgets = [
  governanceAiScorecardBudget('scripts/ci/maintainability-budget-governance-ai-scorecard-rules.mjs', 12, 'AI 治理成熟度 scorecard 预算子表应独立维护主 scorecard、热点和 scoring helper 预算'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecard.mjs', 35, 'AI 治理成熟度 scorecard 应只维护 schema 组装、分数、状态和 nextFocus'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardDimensions.mjs', 70, 'AI 治理成熟度 scorecard dimensions helper 应独立维护维度状态、证据摘要和 action 文案'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardHotspots.mjs', 35, 'AI 治理成熟度 scorecard 热点 helper 应独立维护预算热点、AI 基建候选和下一步焦点派生'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardScoring.mjs', 30, 'AI 治理成熟度 scorecard scoring helper 应独立维护状态排序、维度封装和分数计算'),
];
