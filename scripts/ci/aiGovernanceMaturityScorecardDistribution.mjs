import { scorecardDimension } from './aiGovernanceMaturityScorecardScoring.mjs';

const SCOPE_NAMES = ['workspace', 'index', 'head'];
const count = value => Number.isInteger(value) && value >= 0;
const validScope = (scope, assetCount) => Boolean(scope)
  && typeof scope.ok === 'boolean'
  && scope.counts?.assets === assetCount
  && count(scope.counts?.failures)
  && scope.ok === (scope.counts.failures === 0)
  && Array.isArray(scope.failureSample)
  && scope.failureSample.length === Math.min(3, scope.counts.failures)
  && scope.failureSample.every(item => typeof item === 'string')
  && scope.truncated === (scope.counts.failures > 3);

const validReport = (report) => {
  if (report?.schemaVersion !== 1 || report.reportType !== 'ai-asset-distribution-readiness'
    || !count(report.counts?.assets) || report.counts.assets === 0
    || !count(report.counts?.failedScopes) || !report.stability || !report.readiness || !report.scopes) return false;
  const assetCount = report.counts.assets;
  if (!SCOPE_NAMES.every(scope => validScope(report.scopes[scope], assetCount))) return false;
  const failedScopes = SCOPE_NAMES.filter(scope => !report.scopes[scope].ok).length;
  const { sourceDrift, gitInventoryDrift, sourceReadErrors, gitInventoryErrors } = report.stability;
  if (![sourceDrift, gitInventoryDrift, sourceReadErrors, gitInventoryErrors].every(count)) return false;
  const stabilityStatus = sourceDrift + gitInventoryDrift > 0
    ? 'drift' : sourceReadErrors + gitInventoryErrors > 0 ? 'unavailable' : 'stable';
  const stable = stabilityStatus === 'stable';
  return report.stability.status === stabilityStatus
    && report.counts.failedScopes === failedScopes
    && report.ok === (stable && failedScopes === 0)
    && report.readiness.workspaceCandidate === (stable && report.scopes.workspace.ok)
    && report.readiness.nextCommit === (stable && report.scopes.index.ok)
    && report.readiness.clone === (stable && report.scopes.head.ok);
};

const compactDetails = report => ({
  workspaceCandidate: report.readiness.workspaceCandidate,
  nextCommit: report.readiness.nextCommit,
  clone: report.readiness.clone,
  assetCount: report.counts.assets,
  workspaceFailures: report.scopes.workspace.counts.failures,
  indexFailures: report.scopes.index.counts.failures,
  headFailures: report.scopes.head.counts.failures,
  stabilityStatus: report.stability.status,
  sourceDrift: report.stability.sourceDrift,
  gitInventoryDrift: report.stability.gitInventoryDrift,
});

export const buildDistributionReadinessDimension = (report) => {
  if (!report) return scorecardDimension(
    'distribution-readiness', '项目分发就绪', 'unknown',
    '未提供 AI 资产分发就绪报告', '运行 AI 资产 workspace/index/HEAD 分发就绪聚合',
  );
  if (!validReport(report)) return scorecardDimension(
    'distribution-readiness', '项目分发就绪', 'fail',
    'AI 资产分发就绪报告结构非法', '修复分发报告结构或证据读取后重新聚合',
  );
  const details = compactDetails(report);
  const evidence = `${details.assetCount} 个 AI 资产：workspace ${details.workspaceFailures}、index ${details.indexFailures}、HEAD ${details.headFailures} 个分发失败；稳定性 ${details.stabilityStatus}`;
  const failed = report.stability.status !== 'stable' || !report.scopes.workspace.ok;
  const status = failed ? 'fail'
    : report.scopes.index.ok && report.scopes.head.ok ? 'pass' : 'warn';
  const nextAction = failed
    ? '修复 workspace 资产或扫描漂移后重新聚合'
    : '维护者复核范围后完成 Git 晋级，并依次复验 --index 与 --head';
  return scorecardDimension(
    'distribution-readiness', '项目分发就绪', status, evidence, nextAction,
    { distributionReadiness: details },
  );
};
