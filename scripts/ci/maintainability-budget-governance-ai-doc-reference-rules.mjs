const governanceAiDocReferenceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDocReferenceMaintainabilityBudgets = [
  governanceAiDocReferenceBudget('scripts/ci/maintainability-budget-governance-ai-doc-reference-rules.mjs', 10, 'AI 治理 docs/AI 引用预算子表应独立维护配置分层和工具索引引用项预算'),
  governanceAiDocReferenceBudget('scripts/ci/aiGovernanceDocReferenceRules.mjs', 15, 'AI 治理 docs/AI 文档引用规则应只组合文档路径与引用项清单'),
  governanceAiDocReferenceBudget('scripts/ci/aiGovernanceDocReferenceItems.mjs', 25, 'AI 治理 docs/AI 配置分层引用项应独立维护配置说明的关键引用并兼容导出工具索引清单'),
  governanceAiDocReferenceBudget('scripts/ci/aiGovernanceToolsSetupReferenceItems.mjs', 25, 'AI 治理工具索引引用项应独立维护工具入口、配置说明和 JSON 报告关键引用'),
];
