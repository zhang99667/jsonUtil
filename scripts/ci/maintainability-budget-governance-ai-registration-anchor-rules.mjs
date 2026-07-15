const anchorBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationAnchorMaintainabilityBudgets = [
  anchorBudget('scripts/ci/maintainability-budget-governance-ai-registration-anchor-rules.mjs', 14, 'Registration anchor 预算子表只维护 DSSE、anchor、authorization、consumption 与 descriptor'),
  anchorBudget('scripts/ci/aiGovernanceRequiredRegistrationCanaryFiles.mjs', 30, 'Registration 必需资产子表应完整登记 packet 到外部 anchor/disclosure verifier 资产'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDsseEnvelope.mjs', 150, 'Registration DSSE helper 只维护紧凑 envelope、canonical base64、PAE、公钥指纹、稳定 proof digest 与字符串侧信道'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.mjs', 215, 'Anchor receipt verifier 只维护 checkpoint 字节绑定、唯一 key、host expected bindings、状态转换与未见证信任边界'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs', 450, 'Disclosure authorization 只维护 blind grade/checkpoint/host 投影深绑定、稳定 state key/binding、grant 与角色公钥隔离'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureConsumption.mjs', 410, 'Disclosure consumption 只维护 redemption、sender proof、expected anchor 贯穿、稳定 state key/binding、proof 观察集与未见证单次边界'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs', 30, 'Registration anchor descriptor 只映射 anchor 与 disclosure component case'),
];
