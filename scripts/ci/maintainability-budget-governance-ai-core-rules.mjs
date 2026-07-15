import { governanceAiDiscoveryMaintainabilityBudgets } from './maintainability-budget-governance-ai-discovery-rules.mjs';
import { governanceAiEvolutionMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-rules.mjs';
import { governanceAiReportMaintainabilityBudgets } from './maintainability-budget-governance-ai-report-rules.mjs';

const governanceAiCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreMaintainabilityBudgets = [
  governanceAiCoreBudget('scripts/ci/maintainability-budget-governance-ai-core-rules.mjs', 30, 'AI 治理核心预算子表应只组合报告、发现、行为评测与核心治理基础预算'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceAiSafetyEvidence.mjs', 65, 'AI 治理 AI 修复安全证据 helper 应只维护关键测试文件、证据片段和 skip/todo 反查'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceChecks.mjs', 65, 'AI 治理缺失收集应只负责文件内容检查，report 组装和规则构造放在独立模块'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceIsoDate.mjs', 20, 'AI 治理 ISO 日期 helper 应独立维护格式和真实日历日期校验'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceDateBounds.mjs', 25, 'AI 治理日期边界 helper 应独立维护当前日期和未来日期失败文案'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceJsonAuthority.mjs', 50, 'AI 治理 JSON authority 叶子应只负责 fatal UTF-8 与任意层唯一解码 key'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceJsonAuthority.test.mjs', 35, 'JSON authority 直接测试应锁重复 key、字符串语法、BOM 与非法 UTF-8'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceSemver.mjs', 55, 'AI 治理 SemVer 叶子应精确实现解析、大数字和 precedence'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceSemver.test.mjs', 50, 'SemVer 直接测试应锁官方 precedence、前导零、空 identifier 与 build 语义'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceScriptReachability.mjs', 40, 'AI 治理脚本可达性 helper 应独立维护生产链路和测试支撑失败判定'),
  governanceAiCoreBudget('scripts/ci/aiGovernanceLocalImportGraph.mjs', 40, 'AI 治理本地 import 图 helper 应独立维护 CI 文件枚举、本地 import 解析和可达文件收集'),
  ...governanceAiEvolutionMaintainabilityBudgets,
  ...governanceAiDiscoveryMaintainabilityBudgets,
  ...governanceAiReportMaintainabilityBudgets,
];
