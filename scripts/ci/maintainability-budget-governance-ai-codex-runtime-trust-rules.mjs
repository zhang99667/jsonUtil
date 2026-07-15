const runtimeTrustBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCodexRuntimeTrustMaintainabilityBudgets = [
  runtimeTrustBudget('scripts/ci/maintainability-budget-governance-ai-codex-runtime-trust-rules.mjs', 16, 'Codex runtime trust 预算子表应维护 Seatbelt v2、attested preflight、policy path candidate、descriptor 与 CLI'),
  runtimeTrustBudget('scripts/ci/aiGovernanceRequiredCodexRuntimeTrustFiles.mjs', 18, 'Codex runtime trust 必需清单应完整登记 verifier、policy、descriptor、CLI 与测试'),
  runtimeTrustBudget('scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs', 240, 'Seatbelt sentinel v2 verifier 应锁 code identity、source 零变更、disposable mirror 与 component 边界'),
  runtimeTrustBudget('scripts/ci/aiGovernanceCodexExternalControllerSeatbeltReportShape.mjs', 45, 'Seatbelt report shape 应锁 observation/claim 类型、nullable digest 与有界计数'),
  runtimeTrustBudget('scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.mjs', 300, 'Attested runtime preflight verifier 应锁闭字段 host record、双签名、namespace、state 与 trust 分层'),
  runtimeTrustBudget('scripts/ci/aiGovernanceCodexExternalControllerRuntimePolicy.mjs', 160, 'External runtime policy helper 应只解析 Ed25519 policy 与 root-owned checkout 外 path candidate'),
  runtimeTrustBudget('scripts/ci/aiGovernanceCodexExternalControllerAttestedCaseDescriptors.mjs', 20, 'Attested runtime case descriptor 应只绑定版本、证据与固定测试'),
  runtimeTrustBudget('scripts/ci/check-ai-external-controller-preflight.mjs', 100, 'External runtime component CLI 应保持 bounded stdin、policy path candidate、固定 blocked exit 和脱敏错误'),
];
