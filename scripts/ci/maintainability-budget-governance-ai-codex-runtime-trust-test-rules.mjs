const runtimeTrustTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCodexRuntimeTrustTestMaintainabilityBudgets = [
  runtimeTrustTestBudget('scripts/ci/maintainability-budget-governance-ai-codex-runtime-trust-test-rules.mjs', 10, 'Codex runtime trust 测试预算子表应维护 Seatbelt v2 与 attested preflight 负例'),
  runtimeTrustTestBudget('scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.test.mjs', 320, 'Seatbelt sentinel v2 测试应锁恶意 Codex、source 零变更、mirror、路径、output、cleanup 与 code identity'),
  runtimeTrustTestBudget('scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.test.mjs', 370, 'Attested runtime preflight 测试应锁双签名、policy、binding、namespace、state、pre-runtime 注入、过度声明与 CLI 脱敏'),
];
