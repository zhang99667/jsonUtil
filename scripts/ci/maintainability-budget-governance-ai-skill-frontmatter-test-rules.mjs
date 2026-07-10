const skillFrontmatterTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiSkillFrontmatterTestMaintainabilityBudgets = [
  skillFrontmatterTestBudget('scripts/ci/maintainability-budget-governance-ai-skill-frontmatter-test-rules.mjs', 12, 'AI 治理 skill frontmatter 测试预算子表应独立维护 frontmatter 缺失、格式和 name 负例预算'),
  skillFrontmatterTestBudget('scripts/ci/aiGovernanceSkillFrontmatterContract.test.mjs', 35, 'AI 治理 skill frontmatter 测试应独立维护元数据格式负例'),
  skillFrontmatterTestBudget('scripts/ci/aiGovernanceSkillFrontmatterMissing.test.mjs', 50, 'AI 治理 skill frontmatter missing 测试应独立维护 frontmatter 缺失和字段缺失负例'),
  skillFrontmatterTestBudget('scripts/ci/aiGovernanceSkillFrontmatterName.test.mjs', 35, 'AI 治理 skill frontmatter name 测试应独立维护目录名一致性负例'),
];
