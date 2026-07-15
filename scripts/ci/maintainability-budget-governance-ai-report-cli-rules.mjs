const governanceAiReportCliBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReportCliMaintainabilityBudgets = [
  governanceAiReportCliBudget('scripts/ci/maintainability-budget-governance-ai-report-cli-rules.mjs', 15, 'AI 治理报告 CLI 预算子表应独立维护 CLI 入口、JSON 输出和失败分组描述符预算'),
  governanceAiReportCliBudget('scripts/ci/check-ai-governance.mjs', 45, 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块'),
  governanceAiReportCliBudget('scripts/ci/check-ai-asset-distribution.mjs', 50, 'AI 资产分发 CLI 应只解析三种 scope/help 并输出固定结构化报告'),
  governanceAiReportCliBudget('scripts/ci/aiGovernanceCliOutput.mjs', 15, 'AI 治理 CLI 输出门面应只兼容导出 JSON 和人读报告 helper'),
  governanceAiReportCliBudget('scripts/ci/aiGovernanceJsonReport.mjs', 30, 'AI 治理 JSON 报告 helper 应独立维护 schema、counts、failures 和 maturity scorecard 输出'),
  governanceAiReportCliBudget('scripts/ci/aiGovernanceHumanReport.mjs', 30, 'AI 治理人读报告 helper 应独立维护通过摘要和失败分组 console 输出'),
  governanceAiReportCliBudget('scripts/ci/aiGovernanceFailureGroupDescriptors.mjs', 15, 'AI 治理失败分组描述符应单源维护 JSON 和人读输出的分组顺序与标题'),
];
