const governanceAiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMaintainabilityBudgets = [
  governanceAiBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceChecks.mjs', 80, 'AI 治理缺失收集应只负责文件内容检查和 report 组装，规则构造放在独立模块'),
  governanceAiBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 55, 'AI 治理 Codex skill 契约检查应独立维护 frontmatter 与核心章节校验'),
  governanceAiBudget('scripts/ci/aiGovernanceRules.mjs', 75, 'AI 治理引用规则入口应只负责组合文档入口和 skill 引用规则'),
  governanceAiBudget('scripts/ci/aiGovernanceEntryReferenceRules.mjs', 75, 'AI 治理入口文档引用规则应集中维护入口、Playbook、README 和工具说明的关键引用'),
  governanceAiBudget('scripts/ci/aiGovernanceRequiredFiles.mjs', 35, 'AI 治理必需文件清单应独立维护基础入口和 Codex skill 展开规则'),
  governanceAiBudget('scripts/ci/aiGovernanceCodexSkillReferenceRules.mjs', 45, 'AI 治理 Codex skill 引用规则应独立维护 lint、构建、部署和子 Agent 关键字'),
  governanceAiBudget('scripts/ci/aiGovernanceReferenceGroups.mjs', 40, 'AI 治理公共引用组应独立维护，避免规则构造文件随着关键词增长而回涨'),
];
