const anchorTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationAnchorTestMaintainabilityBudgets = [
  anchorTestBudget('scripts/ci/maintainability-budget-governance-ai-registration-anchor-test-rules.mjs', 16, 'Registration anchor 测试预算子表只维护 fixture、observation、receipt、commitment 与 disclosure 状态链测试，并保留受控增量余量'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs', 260, 'Anchor 测试 fixture 只构造六条 packet/grade/host record、expected bindings 与临时测试签名链'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryReceiptObservation.test.mjs', 55, 'Receipt observation 直接测试锁固定种类、集合上限、malformed、proof identity、signer 优选、顺序与分叉诊断'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs', 200, 'Anchor receipt 测试锁精确字节、签名、唯一 key、expected bindings、有界无值诊断、共享 observation 接线与零写入，并为安全负例保留受控余量'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureCommitment.test.mjs', 60, 'Disclosure commitment 直接测试锁排序脱敏 ref、checkpoint/host digest、host record 漂移和旧路径同引用兼容'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.test.mjs', 225, 'Disclosure authorization 集成测试锁 expected anchor、角色 key、状态链、proof 顺序、双授权/消费、跨批和零写入'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureRedteam.test.mjs', 200, 'Disclosure 红队测试锁投影嫁接、真实公钥、sender constraint、稳定 state key、凭据值和 transport digest'),
];
