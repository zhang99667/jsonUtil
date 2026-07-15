const anchorTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationAnchorTestMaintainabilityBudgets = [
  anchorTestBudget('scripts/ci/maintainability-budget-governance-ai-registration-anchor-test-rules.mjs', 10, 'Registration anchor 测试预算子表只维护 fixture、receipt 与 disclosure 状态链测试'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs', 260, 'Anchor 测试 fixture 只构造六条 packet/grade/host record、expected bindings 与临时测试签名链'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs', 180, 'Anchor receipt 测试锁精确字节、签名、唯一 key、expected bindings、proof 去重/顺序、malformed 输入与零写入'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.test.mjs', 210, 'Disclosure 测试锁 commitment、expected anchor、角色 key、状态链、proof 顺序、双授权/消费、跨批和零写入'),
  anchorTestBudget('scripts/ci/aiGovernanceRegistrationCanaryDisclosureRedteam.test.mjs', 200, 'Disclosure 红队测试锁投影嫁接、真实公钥、sender constraint、稳定 state key、凭据值和 transport digest'),
];
