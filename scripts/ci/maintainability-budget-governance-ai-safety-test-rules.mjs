const governanceAiSafetyTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiSafetyTestMaintainabilityBudgets = [
  governanceAiSafetyTestBudget('scripts/ci/maintainability-budget-governance-ai-safety-test-rules.mjs', 15, 'AI 治理 AI 安全测试预算子表应独立维护安全证据测试预算条目'),
  governanceAiSafetyTestBudget('scripts/ci/aiGovernanceAiSafetyEvidence.test.mjs', 45, 'AI 治理 AI 修复安全证据测试应独立维护关键测试证据清单和完整证据通过场景'),
  governanceAiSafetyTestBudget('scripts/ci/aiGovernanceAiSafetyEvidenceMissing.test.mjs', 45, 'AI 治理 AI 修复安全证据缺失测试应独立维护缺证据和缺文件负例'),
  governanceAiSafetyTestBudget('scripts/ci/aiGovernanceAiSafetyEvidenceSkipped.test.mjs', 35, 'AI 治理 AI 修复安全证据跳过测试应独立维护 skip/todo 负例'),
  governanceAiSafetyTestBudget('scripts/ci/aiGovernanceAiSafetyEvidenceTestFixtures.mjs', 25, 'AI 治理 AI 修复安全证据测试 fixture 应独立维护证据文件写入和 snippet 查询脚手架'),
];
