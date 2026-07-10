const skillContractTestCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiSkillContractTestCoreMaintainabilityBudgets = [
  skillContractTestCoreBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-test-rules.mjs', 15, 'AI 治理 skill 契约测试预算父表应只组合核心和 frontmatter 测试预算子表'),
  skillContractTestCoreBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-test-core-rules.mjs', 20, 'AI 治理 skill 契约核心测试预算子表应独立维护 fixture、命令、结构、章节和发布契约测试条目'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillTestFixtures.mjs', 35, 'AI 治理 skill 测试 fixture 应独立维护测试文件路径和 skill 文本拼装'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillSectionTestFixtures.mjs', 40, 'AI 治理 skill 章节测试 fixture 应独立维护完整 skill 章节正文'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillReleaseTestFixtures.mjs', 30, 'AI 治理 skill 发布测试 fixture 应独立维护发布追踪用 skill 和 CHANGELOG 脚手架'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillCommandContract.test.mjs', 80, 'AI 治理 skill 命令契约测试应独立维护 fenced cd 和 npm run 可达性负例'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillContract.test.mjs', 75, 'AI 治理 skill 契约测试应独立维护 skill 发现和引用可达性负例'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillSectionContract.test.mjs', 75, 'AI 治理 skill 章节契约测试应独立维护核心章节和关键内容负例'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillSectionPseudoTitle.test.mjs', 35, 'AI 治理 skill 章节伪标题测试应独立维护正文伪章节标题边界负例'),
  skillContractTestCoreBudget('scripts/ci/aiGovernanceSkillReleaseContract.test.mjs', 45, 'AI 治理 skill 发布契约测试应独立维护 CHANGELOG 追踪负例'),
];
