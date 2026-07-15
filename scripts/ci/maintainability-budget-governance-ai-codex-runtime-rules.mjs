import { governanceAiCodexRuntimeTrustMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-runtime-trust-rules.mjs';
const runtimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiCodexRuntimeMaintainabilityBudgets = [
  runtimeBudget('scripts/ci/maintainability-budget-governance-ai-codex-runtime-rules.mjs', 9, 'Codex runtime 预算子表应只维护必需清单、topology、legacy probe 与 trust 子表'),
  runtimeBudget('scripts/ci/aiGovernanceRequiredCodexRuntimeFiles.mjs', 14, 'Codex runtime 必需资产子表应完整登记 verifier 与对应测试'),
  runtimeBudget('scripts/ci/aiGovernanceCodexExternalControllerTopology.mjs', 210, '外部 controller topology verifier 应只校验闭字段 dry-run 计划与隔离不变量'),
  runtimeBudget('scripts/ci/aiGovernanceCodexExternalControllerRuntimeProbe.mjs', 240, '外部 controller runtime probe verifier 应只校验三 workload 子集的闭字段、独立绑定与固定负声明'),
  ...governanceAiCodexRuntimeTrustMaintainabilityBudgets,
];
