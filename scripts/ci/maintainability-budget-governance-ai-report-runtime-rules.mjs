import { governanceAiReportCliMaintainabilityBudgets } from './maintainability-budget-governance-ai-report-cli-rules.mjs';
const governanceAiReportRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiReportRuntimeMaintainabilityBudgets = [
  governanceAiReportRuntimeBudget('scripts/ci/maintainability-budget-governance-ai-report-runtime-rules.mjs', 25, 'AI 治理报告 runtime 预算子表应组合 CLI、报告组装、失败分组和产物脚本预算'),
  ...governanceAiReportCliMaintainabilityBudgets,
  governanceAiReportRuntimeBudget('scripts/ci/aiGovernanceContractFailures.mjs', 45, 'AI 治理契约失败聚合器应独立维护非引用类治理契约分组'),
  governanceAiReportRuntimeBudget('scripts/ci/aiGovernanceCodexProjectContractFailures.mjs', 25, 'Codex 项目契约失败 helper 应只聚合 profile、command rules、hook、项目 MCP 与 skill 唯一源码契约'),
  governanceAiReportRuntimeBudget('scripts/ci/aiGovernanceReport.mjs', 30, 'AI 治理报告组装应只组合上下文、失败列表、分发就绪度与同源 scorecard'),
  governanceAiReportRuntimeBudget('scripts/ci/aiGovernanceReportContext.mjs', 20, 'AI 治理报告上下文应独立维护 skill、required files、reference rules 和 governed files 构造'),
  governanceAiReportRuntimeBudget('scripts/ci/aiGovernanceReportFailures.mjs', 45, 'AI 治理报告失败收集应独立维护文件缺失、skill 契约和引用缺失列表'),
  governanceAiReportRuntimeBudget('scripts/ci/writeAiGovernanceArtifactFreshness.mjs', 85, 'AI 治理 artifact freshness helper 应维护语义比较、generatedAt 剥离和 artifact/ledger subject 字节绑定'),
  governanceAiReportRuntimeBudget('scripts/ci/writeAiGovernanceArtifactPayloads.mjs', 80, 'AI 治理 artifact payload helper 应组装报告、context、scorecard、summary 和 detached attestation subject'),
  governanceAiReportRuntimeBudget('scripts/ci/writeAiGovernanceAttestationSubject.mjs', 60, 'AI 治理 attestation subject helper 应只维护固定报告/账本字节摘要与 component-only 信任边界'),
  governanceAiReportRuntimeBudget('scripts/ci/writeAiGovernanceArtifactSummary.mjs', 20, 'AI 治理 artifact summary helper 应独立维护 Step Summary 文本和生成时间证据'),
  governanceAiReportRuntimeBudget('scripts/ci/write-ai-governance-artifacts.mjs', 115, 'AI 治理产物脚本应只写固定 JSON 报告、context 快照、summary 和 freshness JSON'),
];
