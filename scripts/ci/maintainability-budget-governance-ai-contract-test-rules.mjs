import { governanceAiMcpContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-test-rules.mjs';
import { governanceAiProjectContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-test-rules.mjs';
import { governanceAiSkillContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-test-rules.mjs';
const governanceAiContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractTestMaintainabilityBudgets = [
  governanceAiContractTestBudget('scripts/ci/aiGovernanceExemptAssetContract.test.mjs', 55, 'AI 治理显式豁免契约测试应独立维护本机配置边界负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceMirroredEntryContract.test.mjs', 90, 'AI 治理同源入口契约测试应独立维护章节和共享片段漂移负例'),
  ...governanceAiMcpContractTestMaintainabilityBudgets,
  ...governanceAiProjectContractTestMaintainabilityBudgets,
  ...governanceAiSkillContractTestMaintainabilityBudgets,
];
