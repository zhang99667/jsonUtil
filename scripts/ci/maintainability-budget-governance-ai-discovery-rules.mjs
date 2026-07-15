const governanceAiDiscoveryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDiscoveryMaintainabilityBudgets = [
  governanceAiDiscoveryBudget('scripts/ci/maintainability-budget-governance-ai-discovery-rules.mjs', 15, 'AI 治理发现预算子表应独立维护资产发现来源、模式和发现器预算'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceAssetFileCollector.mjs', 25, 'AI 治理资产文件收集器应独立维护递归文件收集和路径归一化'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceAssetDistribution.mjs', 65, 'AI 治理资产分发契约应只编排 workspace/index/HEAD 的原始证据对照'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceAssetDistributionGitEvidence.mjs', 75, 'AI 资产 Git evidence helper 应独立维护普通文件、blob OID、mode/type 和 formatted record 契约'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceAssetDistributionFiles.mjs', 55, 'AI 资产分发全集应单源维护协作资产、实现 namespace、eval data 与 CI/local control plane'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceDiscoveryEntries.mjs', 15, 'AI 治理精确入口清单应独立维护自定义 AI 入口和 MCP 配置文件'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceDiscoveryPatterns.mjs', 15, 'AI 治理资产发现模式应独立维护按目录匹配的协作资产入口'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceDiscoverySources.mjs', 35, 'AI 治理资产发现来源应独立维护根入口、工具目录和显式豁免清单'),
  governanceAiDiscoveryBudget('scripts/ci/aiGovernanceDiscoveredAssets.mjs', 60, 'AI 治理资产发现应独立维护助手入口目录扫描、显式豁免和未治理资产报告'),
];
