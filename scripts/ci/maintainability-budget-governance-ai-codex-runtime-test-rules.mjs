import { governanceAiCodexRuntimeTrustTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-runtime-trust-test-rules.mjs';
const runtimeTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiCodexRuntimeTestMaintainabilityBudgets = [
  runtimeTestBudget('scripts/ci/maintainability-budget-governance-ai-codex-runtime-test-rules.mjs', 8, 'Codex runtime 测试预算子表应只维护 topology、legacy probe 与 trust 测试子表'),
  runtimeTestBudget('scripts/ci/aiGovernanceCodexExternalControllerTopology.test.mjs', 190, '外部 controller topology 测试应锁闭字段、host binding、隔离与不可信证据边界'),
  runtimeTestBudget('scripts/ci/aiGovernanceCodexExternalControllerRuntimeProbe.test.mjs', 200, '外部 controller runtime probe 测试应锁三 workload 子集、隔离负例、脱敏与 component-only 边界'),
  ...governanceAiCodexRuntimeTrustTestMaintainabilityBudgets,
];
