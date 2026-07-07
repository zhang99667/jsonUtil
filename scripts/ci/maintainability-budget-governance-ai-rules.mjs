const governanceAiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMaintainabilityBudgets = [
  governanceAiBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceChecks.mjs', 80, 'AI 治理缺失收集应只负责文件内容检查和 report 组装，规则构造放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 55, 'AI 治理 Codex skill 契约检查应独立维护 frontmatter 与核心章节校验'),
  governanceAiBudget('scripts/ci/aiGovernanceCodexSkillSectionContract.mjs', 50, 'AI 治理 Codex skill 章节内容契约应独立维护每个核心章节的最小关键引用'),
  governanceAiBudget('scripts/ci/aiGovernanceRules.mjs', 75, 'AI 治理引用规则入口应只负责组合文档入口和 skill 引用规则'),
  governanceAiBudget('scripts/ci/aiGovernanceEntryReferenceRules.mjs', 60, 'AI 治理入口文档引用规则应集中维护入口、Playbook、README 和工具说明的关键引用'),
  governanceAiBudget('scripts/ci/aiGovernanceToolEntryReferenceRules.mjs', 30, 'AI 治理工具薄入口引用规则应独立维护 Cursor 和 Comate 的同源入口契约'),
  governanceAiBudget('scripts/ci/aiGovernanceRequiredFiles.mjs', 35, 'AI 治理必需文件清单应独立维护基础入口和 Codex skill 展开规则'),
  governanceAiBudget('scripts/ci/aiGovernanceCodexSkillReferenceRules.mjs', 25, 'AI 治理 Codex skill 引用规则应独立维护 lint、构建、部署和子 Agent 关键字'),
  governanceAiBudget('scripts/ci/aiGovernanceReferenceGroups.mjs', 15, 'AI 治理公共引用组入口应只负责聚合领域引用组'),
  governanceAiBudget('scripts/ci/aiGovernanceCollaborationReferenceGroups.mjs', 10, 'AI 治理协作引用组入口应只聚合委派、安全边界和规则进化关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceDelegationReferenceGroup.mjs', 20, 'AI 治理子 Agent 委派引用组应独立维护任务边界和输出契约关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceDelegationOutputReferenceGroup.mjs', 15, 'AI 治理子 Agent 输出模板引用组应独立维护回传字段关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceAiBoundaryReferenceGroups.mjs', 10, 'AI 治理 AI 边界引用组入口应只聚合安全证据和规则进化关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceSafetyReferenceGroup.mjs', 15, 'AI 治理安全引用组应独立维护模型使用边界和证据形态关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceEvolutionReferenceGroup.mjs', 20, 'AI 治理进化引用组应独立维护规则沉淀质量门槛关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceReleaseReferenceGroups.mjs', 35, 'AI 治理发布引用组应独立维护部署、版本和公网资源巡检关键词'),
  governanceAiBudget('scripts/ci/aiGovernanceRuntimeReferenceGroups.mjs', 45, 'AI 治理运行时引用组应统一维护入口文档和 Codex skill 共享的验证闭环'),
];
