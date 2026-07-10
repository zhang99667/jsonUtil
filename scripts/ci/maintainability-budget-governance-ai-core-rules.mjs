import { governanceAiDiscoveryMaintainabilityBudgets } from './maintainability-budget-governance-ai-discovery-rules.mjs';
import { governanceAiReportMaintainabilityBudgets } from './maintainability-budget-governance-ai-report-rules.mjs';

const governanceAiCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreMaintainabilityBudgets = [
  governanceAiCoreBudget('scripts/ci/maintainability-budget-governance-ai-core-rules.mjs', 20, 'AI 治理核心预算子表应只组合报告子表、发现子表和核心治理基础预算'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceAiSafetyEvidence.mjs', 65, 'AI 治理 AI 修复安全证据 helper 应只维护关键测试文件、证据片段和 skip/todo 反查'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceChecks.mjs', 65, 'AI 治理缺失收集应只负责文件内容检查，report 组装和规则构造放在独立模块'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceIsoDate.mjs', 20, 'AI 治理 ISO 日期 helper 应独立维护格式和真实日历日期校验'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDateBounds.mjs', 25, 'AI 治理日期边界 helper 应独立维护当前日期和未来日期失败文案'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceScriptReachability.mjs', 40, 'AI 治理脚本可达性 helper 应独立维护生产链路和测试支撑失败判定'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceLocalImportGraph.mjs', 40, 'AI 治理本地 import 图 helper 应独立维护 CI 文件枚举、本地 import 解析和可达文件收集'),
  ...governanceAiDiscoveryMaintainabilityBudgets,
  ...governanceAiReportMaintainabilityBudgets,
];
