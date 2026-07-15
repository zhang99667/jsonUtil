import { AI_GOVERNANCE_FAILURE_KEYS } from './aiGovernanceFailureGroupDescriptors.mjs';
import { buildMaintainabilityHotspotSummary } from './aiGovernanceMaturityScorecardHotspots.mjs';
import { buildDistributionReadinessDimension } from './aiGovernanceMaturityScorecardDistribution.mjs';
import { scorecardDimension } from './aiGovernanceMaturityScorecardScoring.mjs';

const listFailures = (report, key) => report?.failures?.[key] ?? report?.[key] ?? [];
const countFailures = (report, key) => listFailures(report, key).length;
const reportCount = (report, key, fallback = 0) => report?.counts?.[key] ?? report?.[key]?.length ?? fallback;
const evolutionReportFrom = report => report?.evolutionEvals ?? report?.evolutionEvalReport;
const evolutionBehaviorCaseCount = report => report?.counts?.behaviorCases ?? report?.counts?.cases ?? 0;
const hasGovernanceShape = report => (
  (Boolean(report?.counts) && Boolean(report?.failures))
  || (
    Array.isArray(report?.requiredFiles)
    && Array.isArray(report?.referenceRules)
    && AI_GOVERNANCE_FAILURE_KEYS.every(key => Array.isArray(report?.[key]))
  )
);
const staticStatus = (report, failureCount) => (
  hasGovernanceShape(report) ? (failureCount === 0 ? 'pass' : 'fail') : (report ? 'fail' : 'unknown')
);
const evolutionStatus = (report) => {
  if (!report) return 'unknown';
  if ((report.contractFailures?.length ?? 0) > 0) return 'unknown';
  if ((report.counts?.currentRunBehaviorFailures ?? 0) > 0) return 'fail';
  if ((report.counts?.currentRunInfrastructureInvalid ?? 0) > 0) return 'unknown';
  if ((report.counts?.currentRunComponentFailures ?? 0) > 0) return 'unknown';
  if ((report.counts?.currentRunDeliveryBlocked ?? 0) > 0) return 'warn';
  if ((report.currentRunFailures?.length ?? 0) > 0) return 'unknown';
  if (report.evidenceFreshness?.status === 'stale') return 'warn';
  if (!report.ok) return 'fail';
  if (['fail', 'partial', 'unverifiedFail', 'unverifiedPartial', 'openFeedbackSignals']
    .some(key => (report.counts?.[key] ?? 0) > 0)) return 'warn';
  if ((report.counts?.unverifiedOutcomes ?? 0) > 0) return 'warn';
  if ((report.counts?.outcomes ?? 0) === 0) return 'unknown';
  if (report.ledgerIntegrity?.status === 'unknown') return 'warn';
  if (report.ledgerChain?.status !== 'pass') return 'warn';
  return (report.coverage?.outcomes?.percent ?? 0) >= 60 ? 'pass' : 'warn';
};

export const buildAiGovernanceMaturityScorecardDimensions = ({
  governanceReport,
  budgetReport,
  distributionReport,
} = {}) => {
  const contractFailureTotal = countFailures(governanceReport, 'skillContractFailures')
    + countFailures(governanceReport, 'contractFailures');
  const hotspotSummary = buildMaintainabilityHotspotSummary(budgetReport);
  const evolutionReport = evolutionReportFrom(governanceReport);
  return [
    scorecardDimension(
      'asset-coverage',
      'AI 资产覆盖',
      staticStatus(governanceReport, countFailures(governanceReport, 'missingFiles')),
      `${reportCount(governanceReport, 'requiredFiles')} 个关键文件纳入治理`,
      '补齐缺失的 AI 协作资产文件或显式豁免'
    ),
    buildDistributionReadinessDimension(
      distributionReport ?? governanceReport?.distributionReadiness,
    ),
    scorecardDimension(
      'reference-drift',
      '规则引用漂移',
      staticStatus(governanceReport, countFailures(governanceReport, 'missingReferences')),
      `${reportCount(governanceReport, 'referenceRules')} 组引用规则可反查`,
      '同步入口文档、rules、skills 和治理引用'
    ),
    scorecardDimension(
      'contract-locks',
      '契约锁定',
      staticStatus(
        governanceReport,
        countFailures(governanceReport, 'skillContractFailures') + countFailures(governanceReport, 'contractFailures')
      ),
      `${contractFailureTotal} 个契约失败项`,
      '先处理 skill、MCP、CI、决策账本或项目事实契约失败'
    ),
    scorecardDimension(
      'behavior-quality',
      '行为评测质量',
      evolutionStatus(evolutionReport),
      evolutionReport
        ? `${evolutionReport.counts?.coveredCases ?? 0}/${evolutionBehaviorCaseCount(evolutionReport)} 个 behavior case 有已验证 outcome，${evolutionReport.counts?.componentBoundaryCases ?? 0} 个 component-boundary case 已排除，${evolutionReport.counts?.unverifiedOutcomes ?? 0} 个待验证，${evolutionReport.counts?.currentRunBehaviorFailures ?? 0} 个行为失败，${evolutionReport.counts?.currentRunComponentFailures ?? 0} 个组件失败，${evolutionReport.counts?.currentRunDeliveryBlocked ?? 0} 个交付阻断，${evolutionReport.counts?.currentRunInfrastructureInvalid ?? 0} 个基础设施无效，${evolutionReport.counts?.currentRunVerifiedOutcomes ?? 0} 个当前重放通过但待刷新，${evolutionReport.counts?.openFeedbackSignals ?? 0} 个 open signal`
        : '未提供 AI evolution eval 报告',
      evolutionReport?.nextFocus?.nextAction ?? '运行代表 case 并记录脱敏 outcome',
      evolutionReport ? { evolutionEvals: {
        counts: evolutionReport.counts,
        coverage: evolutionReport.coverage?.outcomes,
        ledgerIntegrity: evolutionReport.ledgerIntegrity,
        ledgerChain: evolutionReport.ledgerChain,
        evidenceFreshness: evolutionReport.evidenceFreshness ?? null,
        blockedFocus: evolutionReport.blockedFocus ?? null,
      } } : undefined
    ),
    scorecardDimension(
      'maintainability-headroom',
      '维护余量',
      budgetReport ? (budgetReport.ok === false ? 'fail' : (hotspotSummary.riskyCount > 0 ? 'warn' : 'pass')) : 'unknown',
      budgetReport ? `${hotspotSummary.riskyCount} 个高风险预算热点，${hotspotSummary.aiCandidateCount} 个 AI 基建候选` : '未提供可维护性预算报告',
      hotspotSummary.nextAction,
      budgetReport ? { maintainabilityHotspots: hotspotSummary } : undefined
    ),
  ];
};
