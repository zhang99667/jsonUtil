import { governanceAiEntryContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-test-rules.mjs';
import { governanceAiMcpContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-test-rules.mjs';
import { governanceAiProjectContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-test-rules.mjs';
import { governanceAiSkillContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-test-rules.mjs';
const governanceAiContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractTestMaintainabilityBudgets = [
  governanceAiContractTestBudget('scripts/ci/aiGovernanceExemptAssetContract.test.mjs', 55, 'AI 治理显式豁免契约测试应独立维护本机配置边界负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs', 75, 'AI 治理定时 workflow 测试应独立维护 schedule、命令和 artifact 负例'),
  ...governanceAiEntryContractTestMaintainabilityBudgets,
  ...governanceAiMcpContractTestMaintainabilityBudgets,
  ...governanceAiProjectContractTestMaintainabilityBudgets,
  ...governanceAiSkillContractTestMaintainabilityBudgets,
];
