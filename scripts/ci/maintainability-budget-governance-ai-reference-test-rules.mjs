const governanceAiReferenceTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceTestMaintainabilityBudgets = [
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceRules.test.mjs', 55, 'AI 治理引用规则测试入口应组合主题化负例并锁定专用 skill 契约分层'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceCoreMissingCases.mjs', 125, 'AI 治理核心引用负例应独立维护发布、安全、规则进化和委派引用用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceEntryMissingCases.mjs', 15, 'AI 治理入口引用负例入口应只组合工具入口、PR 模板和 docs/AI 负例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceToolEntryMissingCases.mjs', 60, 'AI 治理工具入口引用负例应独立维护根入口、Claude README 和 Cursor 用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferencePullRequestMissingCases.mjs', 55, 'AI 治理 PR 模板引用负例应独立维护决策账本、Copilot、预算和 MCP 提醒用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceDocsMissingCases.mjs', 65, 'AI 治理 docs/AI 引用负例应独立维护配置分层、工具索引和资产注册表用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceSectionReferenceRules.test.mjs', 110, 'AI 治理章节引用规则测试应独立维护必读、安全与 fenced heading 伪造负例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceSectionReferenceDelegationRules.test.mjs', 75, 'AI 治理子 Agent 委派章节测试应独立维护委派关键词和代码块伪标题负例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceToolsSetupSectionRules.test.mjs', 40, 'AI 治理工具索引章节测试应独立维护必读顺序防漂移负例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceEvolutionPlaybookSection.test.mjs', 40, 'AI evolution Playbook 章节测试应锁定 skill A/B 隔离、快照与缺失指标边界'),
];
