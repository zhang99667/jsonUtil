const agentProfileBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiAgentProfileMaintainabilityBudgets = [
  agentProfileBudget('scripts/ci/maintainability-budget-governance-ai-agent-profile-rules.mjs', 10, 'Codex agent profile 预算子表应只维护 profile 契约和负例预算'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentProfiles.mjs', 150, 'Codex agent profile 契约应锁固定角色、canonical TOML、sandbox、职责和回传模板'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentCaseDescriptors.mjs', 20, 'Codex agent profile case descriptor 应只绑定 component-only case 与固定测试'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs', 140, 'Codex agent profile 测试应锁缺失、多余、symlink、字段扩权、sandbox 和职责负例'),
];
