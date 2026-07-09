import { governanceAiReportMaintainabilityBudgets } from './maintainability-budget-governance-ai-report-rules.mjs';

const governanceAiCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreMaintainabilityBudgets = [
  governanceAiCoreBudget('scripts/ci/maintainability-budget-governance-ai-core-rules.mjs', 20, 'AI 治理核心预算子表应只组合报告子表、AI 安全证据和资产发现基础预算'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceAiSafetyEvidence.mjs', 65, 'AI 治理 AI 修复安全证据 helper 应只维护关键测试文件、证据片段和 skip/todo 反查'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceChecks.mjs', 65, 'AI 治理缺失收集应只负责文件内容检查，report 组装和规则构造放在独立模块'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceIsoDate.mjs', 20, 'AI 治理 ISO 日期 helper 应独立维护格式和真实日历日期校验'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDateBounds.mjs', 25, 'AI 治理日期边界 helper 应独立维护当前日期和未来日期失败文案'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceScriptReachability.mjs', 55, 'AI 治理脚本可达性 helper 应独立维护生产链路和测试支撑 import 图检查'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceAssetFileCollector.mjs', 25, 'AI 治理资产文件收集器应独立维护递归文件收集和路径归一化'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoveryPatterns.mjs', 15, 'AI 治理资产发现模式应独立维护按目录匹配的协作资产入口'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoverySources.mjs', 35, 'AI 治理资产发现来源应独立维护根入口、工具目录和显式豁免清单'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDiscoveredAssets.mjs', 60, 'AI 治理资产发现应独立维护助手入口目录扫描、显式豁免和未治理资产报告'),
  ...governanceAiReportMaintainabilityBudgets,
];
