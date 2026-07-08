const governanceAiReferenceTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceTestMaintainabilityBudgets = [
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceRules.test.mjs', 35, 'AI 治理引用规则测试入口应只组合主题化负例并执行统一断言'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceCoreMissingCases.mjs', 125, 'AI 治理核心引用负例应独立维护发布、安全、规则进化和委派引用用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceReferenceEntryMissingCases.mjs', 125, 'AI 治理入口引用负例应独立维护入口文档、PR 模板、docs/AI 和注册表用例'),
  governanceAiReferenceTestBudget('scripts/ci/aiGovernanceSectionReferenceRules.test.mjs', 135, 'AI 治理章节引用规则测试应独立维护章节定位和代码块伪标题负例'),
];
