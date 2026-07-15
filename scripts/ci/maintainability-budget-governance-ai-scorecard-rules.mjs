const governanceAiScorecardBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiScorecardMaintainabilityBudgets = [
  governanceAiScorecardBudget('scripts/ci/maintainability-budget-governance-ai-scorecard-rules.mjs', 12, 'AI 治理成熟度 scorecard 预算子表应独立维护主 scorecard、热点和 scoring helper 预算'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecard.mjs', 35, 'AI 治理成熟度 scorecard 应只维护 schema 组装、分数、状态和 nextFocus'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardDistribution.mjs', 85, 'AI 治理分发就绪维度应独立维护报告闭包校验、状态和紧凑证据投影'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardDimensions.mjs', 110, 'AI 治理成熟度 scorecard dimensions helper 应 fail closed 维护静态、行为与维护余量维度语义'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardHotspots.mjs', 90, 'AI 治理成熟度 scorecard 热点 helper 应独立维护预算热点、容量/职责分类和结构化下一步焦点派生'),
  governanceAiScorecardBudget('scripts/ci/aiGovernanceMaturityScorecardScoring.mjs', 30, 'AI 治理成熟度 scorecard scoring helper 应独立维护状态排序、维度封装和分数计算'),
];
