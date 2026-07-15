const governanceAiReferenceSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceSupportMaintainabilityBudgets = [
  governanceAiReferenceSupportBudget('scripts/ci/maintainability-budget-governance-ai-reference-support-rules.mjs', 20, 'AI 治理引用支撑预算子表应独立维护资产账本、PR 模板、目录 README、章节、工具入口和必需文件预算'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceAssetRegistryReferenceRule.mjs', 20, 'AI 治理资产注册表引用规则应独立维护账本自身的关键引用'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernancePullRequestTemplateReferenceRule.mjs', 15, 'AI 治理 PR 模板引用规则应独立维护人工审计 checklist 的关键项'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceClaudeReadmeReferenceRule.mjs', 20, 'AI 治理 Claude 目录 README 引用规则应独立维护目录索引的最小治理入口'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernancePlaybookSectionRules.mjs', 35, 'AI 治理文档章节引用规则应独立维护工程/演进 Playbook 和工具索引的章节内关键词映射'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceToolEntryReferenceRules.mjs', 50, 'AI 治理工具薄入口引用规则应独立维护五类薄入口的共享基线和工具特定 peer 契约'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceRequiredFiles.mjs', 50, 'AI 治理必需文件清单应独立维护基础入口、行为评测数据与 Codex skill 展开规则'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceRequiredCheckFiles.mjs', 50, 'AI 治理检查类必需文件清单应独立维护分发与实现发现、Skill YAML、Claude adapter、CI、发布检查入口并组合 MCP 清单'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceRequiredMcpFiles.mjs', 30, 'AI 治理 MCP 必需文件清单应独立维护 MCP 配置和固定 helper 文件集合'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceRequiredMcpRuntimeFiles.mjs', 25, 'AI 治理 MCP runtime 必需文件子表应只维护常驻 controller、line framing、fresh worker 与回归入口'),
  governanceAiReferenceSupportBudget('scripts/ci/aiGovernanceCodexSkillReferenceRules.mjs', 40, 'AI 治理 Codex skill 引用规则应分层维护通用协作契约和 maintainer 运行时契约'),
];
