import { governanceAiReferenceGroupMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-group-rules.mjs';
const governanceAiReferenceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiReferenceMaintainabilityBudgets = [
  governanceAiReferenceBudget('scripts/ci/maintainability-budget-governance-ai-reference-rules.mjs', 20, 'AI 治理引用预算规则应独立维护引用规则并聚合引用组预算'),
  ...governanceAiReferenceGroupMaintainabilityBudgets,
  governanceAiReferenceBudget('scripts/ci/aiGovernanceRules.mjs', 75, 'AI 治理引用规则入口应只负责组合文档入口和 skill 引用规则'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceEntryReferenceRules.mjs', 45, 'AI 治理入口文档引用规则应集中维护根入口、Playbook 和目录 README 的关键引用'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceDocReferenceRules.mjs', 15, 'AI 治理 docs/AI 文档引用规则应只组合文档路径与引用项清单'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceDocReferenceItems.mjs', 40, 'AI 治理 docs/AI 文档引用项应独立维护配置分层和工具索引的关键引用'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceAssetRegistryReferenceRule.mjs', 20, 'AI 治理资产注册表引用规则应独立维护账本自身的关键引用'),
  governanceAiReferenceBudget('scripts/ci/aiGovernancePullRequestTemplateReferenceRule.mjs', 15, 'AI 治理 PR 模板引用规则应独立维护人工审计 checklist 的关键项'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceClaudeReadmeReferenceRule.mjs', 20, 'AI 治理 Claude 目录 README 引用规则应独立维护目录索引的最小治理入口'),
  governanceAiReferenceBudget('scripts/ci/aiGovernancePlaybookSectionRules.mjs', 25, 'AI 治理文档章节引用规则应独立维护 Playbook 和工具索引的章节内关键词映射'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceToolEntryReferenceRules.mjs', 50, 'AI 治理工具薄入口引用规则应独立维护五类薄入口的共享基线和工具特定 peer 契约'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceRequiredFiles.mjs', 35, 'AI 治理必需文件清单应独立维护基础入口和 Codex skill 展开规则'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceRequiredCheckFiles.mjs', 25, 'AI 治理检查类必需文件清单应独立维护 CI、发布和 MCP 检查入口'),
  governanceAiReferenceBudget('scripts/ci/aiGovernanceCodexSkillReferenceRules.mjs', 25, 'AI 治理 Codex skill 引用规则应独立维护 lint、构建、部署和子 Agent 关键字'),
];
