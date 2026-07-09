import { governanceAiEntryContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-rules.mjs';
import { governanceAiMcpContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-rules.mjs';
import { governanceAiProjectContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-rules.mjs';
import { governanceAiSkillContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-rules.mjs';
const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 20, 'AI 治理契约预算规则应独立维护 CI、同源入口、章节和契约子表'),
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-rules.mjs', 15, 'AI 治理 skill 契约预算子表应独立维护 Codex skill 结构、引用和命令可达性预算'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 25, 'AI 治理 CI 契约检查应只维护必需治理命令和自动化入口比对'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiCommandCollectors.mjs', 25, 'AI 治理 CI 命令收集器应独立维护 GitHub Actions run 块和本地 CI run_in_root 抽取'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiCommandDescriptors.mjs', 45, 'AI 治理 CI 命令描述符应单源维护必跑命令和自动化入口测试夹具标签'),
  governanceAiContractBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.mjs', 50, 'AI 治理定时 workflow 契约应只维护 schedule、固定命令和 artifact 上传边界'),
  governanceAiContractBudget('scripts/ci/aiGovernanceExemptAssetContract.mjs', 35, 'AI 治理显式豁免契约应只维护本机配置不得承载共享规则的边界'),
  ...governanceAiEntryContractMaintainabilityBudgets,
  ...governanceAiMcpContractMaintainabilityBudgets,
  ...governanceAiProjectContractMaintainabilityBudgets,
  ...governanceAiSkillContractMaintainabilityBudgets,
];
