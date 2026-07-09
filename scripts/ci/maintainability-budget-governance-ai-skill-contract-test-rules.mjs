const skillContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiSkillContractTestMaintainabilityBudgets = [
  skillContractTestBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-test-rules.mjs', 15, 'AI 治理 skill 契约测试预算子表应只维护 skill fixture、命令、结构和发布契约测试条目'),
  skillContractTestBudget('scripts/ci/aiGovernanceSkillTestFixtures.mjs', 60, 'AI 治理 skill 测试 fixture 应独立维护完整 skill 文本和共享章节内容'),
  skillContractTestBudget('scripts/ci/aiGovernanceSkillCommandContract.test.mjs', 80, 'AI 治理 skill 命令契约测试应独立维护 fenced cd 和 npm run 可达性负例'),
  skillContractTestBudget('scripts/ci/aiGovernanceSkillContract.test.mjs', 185, 'AI 治理 skill 契约测试应独立维护 skill 发现、frontmatter 元数据、章节和引用可达性负例'),
  skillContractTestBudget('scripts/ci/aiGovernanceSkillReleaseContract.test.mjs', 45, 'AI 治理 skill 发布契约测试应独立维护 CHANGELOG 追踪负例'),
];
