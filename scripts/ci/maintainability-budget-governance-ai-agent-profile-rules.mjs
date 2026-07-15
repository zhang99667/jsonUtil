const agentProfileBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiAgentProfileMaintainabilityBudgets = [
  agentProfileBudget('scripts/ci/maintainability-budget-governance-ai-agent-profile-rules.mjs', 12, 'Agent profile 预算子表应只维护 profile 与跨客户端 adapter 契约预算'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentProfiles.mjs', 160, 'Codex agent profile 契约应锁通用角色、专项 auditor、sandbox、职责和回传模板'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentCaseDescriptors.mjs', 20, 'Codex agent profile case descriptor 应只绑定 component-only case 与固定测试'),
  agentProfileBudget('scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs', 140, 'Codex agent profile 测试应锁缺失、多余、symlink、字段扩权、sandbox 和职责负例'),
  agentProfileBudget('scripts/ci/aiGovernanceProjectAiInfraAuditor.mjs', 160, '跨客户端 auditor renderer 应只维护路由边界、固定模板与普通文件契约'),
  agentProfileBudget('scripts/ci/aiGovernanceProjectAiInfraAuditor.test.mjs', 180, '跨客户端 auditor 测试应锁缺失、symlink、字节漂移、工具扩权和触发边界'),
];
