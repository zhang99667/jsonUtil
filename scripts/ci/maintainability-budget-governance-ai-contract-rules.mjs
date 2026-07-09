import { governanceAiMcpContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-rules.mjs';
import { governanceAiSkillContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-rules.mjs';
const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 20, 'AI 治理契约预算规则应独立维护 CI、同源入口、章节和 skill 契约子表'),
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-rules.mjs', 15, 'AI 治理 skill 契约预算子表应独立维护 Codex skill 结构、引用和命令可达性预算'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 25, 'AI 治理 CI 契约检查应只维护必需治理命令和自动化入口比对'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiCommandCollectors.mjs', 25, 'AI 治理 CI 命令收集器应独立维护 GitHub Actions run 块和本地 CI run_in_root 抽取'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiCommandDescriptors.mjs', 45, 'AI 治理 CI 命令描述符应单源维护必跑命令和自动化入口测试夹具标签'),
  governanceAiContractBudget('scripts/ci/aiGovernanceExemptAssetContract.mjs', 35, 'AI 治理显式豁免契约应只维护本机配置不得承载共享规则的边界'),
  governanceAiContractBudget('scripts/ci/aiGovernanceMirroredEntryContracts.mjs', 75, 'AI 治理同源入口契约应独立维护镜像章节和共享片段漂移检查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSharedEntryAuthorityContract.mjs', 30, 'AI 治理共享薄入口片段权威来源契约应独立维护来源文件和锚点反查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceProjectFactsContract.mjs', 85, 'AI 治理项目事实契约应独立维护真实配置到入口文档的事实漂移检查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceProjectVersionFactsContract.mjs', 65, 'AI 治理项目版本事实契约应独立维护依赖和 lock 版本到入口文档的漂移检查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSharedEntrySnippets.mjs', 45, 'AI 治理工具入口共享片段应独立维护跨工具核心规则、权威来源和覆盖文件清单'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSectionReferences.mjs', 50, 'AI 治理章节引用检查应独立维护 Markdown 章节抽取和章节内关键词校验'),
  ...governanceAiMcpContractMaintainabilityBudgets,
  ...governanceAiSkillContractMaintainabilityBudgets,
];
