import { governanceAiContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-contract-rules.mjs';
import { governanceAiDecisionMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-rules.mjs';
import { governanceAiReferenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-rules.mjs';
import { governanceAiRegistryMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-rules.mjs';
import { governanceAiTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-test-rules.mjs';

const governanceAiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMaintainabilityBudgets = [
  governanceAiBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceChecks.mjs', 65, 'AI 治理缺失收集应只负责文件内容检查，report 组装和规则构造放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceReport.mjs', 45, 'AI 治理报告组装应独立维护 required files、引用规则和各类失败列表汇总'),
  ...governanceAiRegistryMaintainabilityBudgets,
  ...governanceAiContractMaintainabilityBudgets,
  ...governanceAiDecisionMaintainabilityBudgets,
  ...governanceAiTestMaintainabilityBudgets,
  ...governanceAiReferenceMaintainabilityBudgets,
  governanceAiBudget('scripts/ci/aiGovernanceAssetFileCollector.mjs', 25, 'AI 治理资产文件收集器应独立维护递归文件收集和路径归一化'),
  governanceAiBudget('scripts/ci/aiGovernanceDiscoveredAssets.mjs', 60, 'AI 治理资产发现应独立维护助手入口目录扫描、显式豁免和未治理资产报告'),
];
