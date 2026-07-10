import { AI_GOVERNANCE_FAILURE_KEYS } from './aiGovernanceFailureGroupDescriptors.mjs';
import { buildMaintainabilityHotspotSummary } from './aiGovernanceMaturityScorecardHotspots.mjs';
import { scorecardDimension } from './aiGovernanceMaturityScorecardScoring.mjs';

const listFailures = (report, key) => report?.failures?.[key] ?? report?.[key] ?? [];
const countFailures = (report, key) => listFailures(report, key).length;
const reportCount = (report, key, fallback = 0) => report?.counts?.[key] ?? report?.[key]?.length ?? fallback;

export const buildAiGovernanceMaturityScorecardDimensions = ({ governanceReport, budgetReport } = {}) => {
  const failureTotal = AI_GOVERNANCE_FAILURE_KEYS.reduce((sum, key) => sum + countFailures(governanceReport, key), 0);
  const hotspotSummary = buildMaintainabilityHotspotSummary(budgetReport);
  return [
    scorecardDimension(
      'asset-coverage',
      'AI 资产覆盖',
      countFailures(governanceReport, 'missingFiles') === 0 ? 'pass' : 'fail',
      `${reportCount(governanceReport, 'requiredFiles')} 个关键文件纳入治理`,
      '补齐缺失的 AI 协作资产文件或显式豁免'
    ),
    scorecardDimension(
      'reference-drift',
      '规则引用漂移',
      countFailures(governanceReport, 'missingReferences') === 0 ? 'pass' : 'fail',
      `${reportCount(governanceReport, 'referenceRules')} 组引用规则可反查`,
      '同步入口文档、rules、skills 和治理引用'
    ),
    scorecardDimension(
      'contract-locks',
      '契约锁定',
      countFailures(governanceReport, 'skillContractFailures') + countFailures(governanceReport, 'contractFailures') === 0 ? 'pass' : 'fail',
      `${failureTotal} 个治理失败项`,
      '先处理 skill、MCP、CI、决策账本或项目事实契约失败'
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
