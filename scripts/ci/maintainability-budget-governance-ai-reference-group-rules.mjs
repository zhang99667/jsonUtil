const governanceAiReferenceGroupBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceGroupMaintainabilityBudgets = [
  governanceAiReferenceGroupBudget('scripts/ci/maintainability-budget-governance-ai-reference-group-rules.mjs', 20, 'AI 治理引用组预算规则应独立维护协作、安全、发布和运行时引用组预算'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceReferenceGroups.mjs', 15, 'AI 治理公共引用组入口应只负责聚合领域引用组'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceCollaborationReferenceGroups.mjs', 10, 'AI 治理协作引用组入口应只聚合委派、安全边界和规则进化关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceDelegationReferenceGroup.mjs', 20, 'AI 治理子 Agent 委派引用组应独立维护任务边界和输出契约关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceDelegationOutputReferenceGroup.mjs', 15, 'AI 治理子 Agent 输出模板引用组应独立维护回传字段关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceAiBoundaryReferenceGroups.mjs', 10, 'AI 治理 AI 边界引用组入口应只聚合安全证据和规则进化关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceSafetyReferenceGroup.mjs', 15, 'AI 治理安全引用组应独立维护模型使用边界和证据形态关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceEvolutionReferenceGroup.mjs', 20, 'AI 治理进化引用组应独立维护规则沉淀质量门槛关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceReleaseReferenceGroups.mjs', 35, 'AI 治理发布引用组应独立维护部署、版本和公网资源巡检关键词'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceEntryCoreReferenceGroups.mjs', 30, 'AI 治理入口核心引用组应独立维护核心入口、入口治理和代码规范引用'),
  governanceAiReferenceGroupBudget('scripts/ci/aiGovernanceRuntimeReferenceGroups.mjs', 35, 'AI 治理运行时引用组应统一维护入口文档和 Codex skill 共享的验证闭环'),
];
