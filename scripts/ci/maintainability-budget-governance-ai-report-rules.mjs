const governanceAiReportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReportMaintainabilityBudgets = [
  governanceAiReportBudget('scripts/ci/maintainability-budget-governance-ai-report-rules.mjs', 15, 'AI 治理报告预算子表应独立维护 CLI、报告组装和失败分组预算'),
  governanceAiReportBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiReportBudget('scripts/ci/aiGovernanceCliOutput.mjs', 45, 'AI 治理 CLI 输出 helper 应独立维护人读报告和 JSON 摘要格式'),
  governanceAiReportBudget('scripts/ci/aiGovernanceContractFailures.mjs', 45, 'AI 治理契约失败聚合器应独立维护非引用类治理契约分组'),
  governanceAiReportBudget('scripts/ci/aiGovernanceReport.mjs', 25, 'AI 治理报告组装应只组合上下文与失败列表'),
  governanceAiReportBudget('scripts/ci/aiGovernanceReportContext.mjs', 20, 'AI 治理报告上下文应独立维护 skill、required files、reference rules 和 governed files 构造'),
  governanceAiReportBudget('scripts/ci/aiGovernanceReportFailures.mjs', 45, 'AI 治理报告失败收集应独立维护文件缺失、skill 契约和引用缺失列表'),
  governanceAiReportBudget('scripts/ci/write-ai-governance-artifacts.mjs', 100, 'AI 治理产物脚本应只写固定 JSON 报告、context 快照和 summary'),
];
