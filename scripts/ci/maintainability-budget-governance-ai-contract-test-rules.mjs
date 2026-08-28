import { governanceAiEntryContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-test-rules.mjs';
import { governanceAiMcpContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-test-rules.mjs';
import { governanceAiProjectContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-test-rules.mjs';
import { governanceAiSkillContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-test-rules.mjs';
const governanceAiContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractTestMaintainabilityBudgets = [
  governanceAiContractTestBudget('scripts/ci/aiGovernanceAutomationCommandContract.test.mjs', 125, 'AI 治理自动化命令契约测试应锁 command 源顺序、公开安全 API 重导出、完整历史 mapping 归属与失败全序'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceOutcomeWriterAutomationContract.test.mjs', 45, 'Outcome writer 自动化契约测试应锁兼容重导出、三类 writer 与静态 shell 参数边界'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceCiContract.test.mjs', 90, 'AI 治理 CI 契约测试应锁 required command 可达性、失败旁路与自动 outcome 写账禁令'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceCiEntrySource.test.mjs', 90, 'AI 治理 CI 入口 source 测试应锁目录、非法 UTF-8、symlink、hardlink 与 1 MiB 字节边界'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceCiContractTestFixtures.mjs', 60, 'AI 治理 CI 契约 fixture 应直接消费权威 descriptor 并单源维护 workflow/local-ci、writer 与 job/step 控制脚手架'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceProjectCliArgs.test.mjs', 70, '项目 AI CLI 参数测试应锁 help、未知参数、冲突 scope 与安装报告 trust=false 契约'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceExemptAssetContract.test.mjs', 95, 'AI 治理显式豁免契约测试应锁定私有正文不读取、Git index/HEAD 跟踪与 inventory fail-closed 边界'),
  governanceAiContractTestBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs', 205, 'AI 治理 scheduled workflow 测试应维护 schedule、权限隔离、action SHA、subject、policy fail-closed 和外部 trust 边界负例'),
  ...governanceAiEntryContractTestMaintainabilityBudgets,
  ...governanceAiMcpContractTestMaintainabilityBudgets,
  ...governanceAiProjectContractTestMaintainabilityBudgets,
  ...governanceAiSkillContractTestMaintainabilityBudgets,
];
