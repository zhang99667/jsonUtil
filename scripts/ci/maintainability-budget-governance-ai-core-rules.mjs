const governanceAiCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreMaintainabilityBudgets = [
  governanceAiCoreBudget('scripts/ci/maintainability-budget-governance-ai-core-rules.mjs', 20, 'AI 治理核心预算子表应独立维护 CLI、报告和资产发现基础预算'),
  governanceAiCoreBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceChecks.mjs', 65, 'AI 治理缺失收集应只负责文件内容检查，report 组装和规则构造放在独立模块'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceReport.mjs', 25, 'AI 治理报告组装应只组合上下文与失败列表'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceReportContext.mjs', 20, 'AI 治理报告上下文应独立维护 skill、required files、reference rules 和 governed files 构造'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceReportFailures.mjs', 45, 'AI 治理报告失败收集应独立维护文件缺失、skill 契约和引用缺失列表'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceAssetFileCollector.mjs', 25, 'AI 治理资产文件收集器应独立维护递归文件收集和路径归一化'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoveryPatterns.mjs', 15, 'AI 治理资产发现模式应独立维护按目录匹配的协作资产入口'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoverySources.mjs', 35, 'AI 治理资产发现来源应独立维护根入口、工具目录和显式豁免清单'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoveredAssets.mjs', 60, 'AI 治理资产发现应独立维护助手入口目录扫描、显式豁免和未治理资产报告'),
];
