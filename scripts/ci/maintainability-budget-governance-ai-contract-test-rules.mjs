import { governanceAiEntryContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-test-rules.mjs';
import { governanceAiMcpContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-test-rules.mjs';
import { governanceAiProjectContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-test-rules.mjs';
import { governanceAiSkillContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-test-rules.mjs';
const governanceAiContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractTestMaintainabilityBudgets = [
  governanceAiContractTestBudget('scripts/ci/aiGovernanceCiContract.test.mjs', 105, 'AI 治理 CI 契约测试应锁必需命令、完整历史与静态禁用旁路'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceProjectCliArgs.test.mjs', 55, '项目 AI CLI 参数测试应锁 help、未知参数与冲突 scope 的退出码'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceExemptAssetContract.test.mjs', 55, 'AI 治理显式豁免契约测试应独立维护本机配置边界负例'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs', 210, 'AI 治理 workflow 测试应维护 schedule、权限隔离、action SHA、subject 和外部 trust 边界负例'),
  ...governanceAiEntryContractTestMaintainabilityBudgets,
  ...governanceAiMcpContractTestMaintainabilityBudgets,
  ...governanceAiProjectContractTestMaintainabilityBudgets,
  ...governanceAiSkillContractTestMaintainabilityBudgets,
];
