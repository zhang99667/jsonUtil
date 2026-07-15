const anchorBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationAnchorMaintainabilityBudgets = [
  anchorBudget('scripts/ci/maintainability-budget-governance-ai-registration-anchor-rules.mjs', 18, 'Registration anchor 预算子表只维护 DSSE、observation、anchor、commitment、authorization、consumption 与 descriptor，并保留受控增量余量'),
  anchorBudget('scripts/ci/aiGovernanceRequiredRegistrationCanaryFiles.mjs', 45, 'Registration 必需资产子表是 packet 到外部 anchor/disclosure verifier 的单一有序聚合表，保留约 20% 受控余量而不机械拆表'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDsseEnvelope.mjs', 180, 'Registration DSSE helper 只维护紧凑 envelope、canonical base64、PAE、公钥指纹、稳定 proof digest 与有界无值字符串扫描，并为安全负例保留受控余量'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryReceiptObservation.mjs', 50, 'Receipt observation helper 只维护固定种类、集合上限、proof 一致性、preferred signer 与确定性 transport 选择'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.mjs', 215, 'Anchor receipt verifier 只维护 checkpoint 字节绑定、唯一 key、host expected bindings、状态转换、共享 observation 接线与未见证信任边界'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureCommitment.mjs', 250, 'Disclosure commitment 只维护 blind grade/checkpoint 与 Agent/grader/host 投影深绑定、排序脱敏 ref 和确定性 digest'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs', 340, 'Disclosure authorization 只消费纯 commitment，维护稳定 state key/binding、grant、audience/action、DSSE 与角色公钥隔离'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureConsumption.mjs', 410, 'Disclosure consumption 只维护 redemption、sender proof、expected anchor 贯穿、稳定 state key/binding、共享 observation 接线与未见证单次边界'),
  anchorBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs', 35, 'Registration anchor descriptor 只映射 anchor 与 disclosure component case，并为固定测试路径保留受控余量'),
];
