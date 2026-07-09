const governanceAiContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractTestMaintainabilityBudgets = [
  governanceAiContractTestBudget('scripts/ci/aiGovernanceExemptAssetContract.test.mjs', 55, 'AI 治理显式豁免契约测试应独立维护本机配置边界负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceMirroredEntryContract.test.mjs', 90, 'AI 治理同源入口契约测试应独立维护章节和共享片段漂移负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceProjectFactsContract.test.mjs', 75, 'AI 治理项目事实契约测试应独立维护数据库事实漂移负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceProjectVersionFactsContract.test.mjs', 90, 'AI 治理项目版本事实契约测试应独立维护前后端版本和 lock 漂移负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceSkillTestFixtures.mjs', 60, 'AI 治理 skill 测试 fixture 应独立维护完整 skill 文本和共享章节内容'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceSkillCommandContract.test.mjs', 80, 'AI 治理 skill 命令契约测试应独立维护 fenced cd 和 npm run 可达性负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceSkillContract.test.mjs', 185, 'AI 治理 skill 契约测试应独立维护 skill 发现、frontmatter 元数据、章节和引用可达性负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceSkillReleaseContract.test.mjs', 45, 'AI 治理 skill 发布契约测试应独立维护 CHANGELOG 追踪负例'),
];
