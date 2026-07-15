import { buildJsonutilsGovernanceContext } from './jsonutils-governance-context.mjs';
import { buildJsonutilsValidationPlanFromWorktree } from './jsonutils-governance-validation-plan.mjs';
import { buildJsonutilsWorktreeSnapshot } from './jsonutils-governance-worktree.mjs';

const worktreeRisks = (worktree) => [
  ...(worktree?.dirty ? [`工作区有 ${worktree.changedFileCount} 个变更文件，提交前必须确认范围`] : []),
  ...(worktree?.branch?.behind > 0 ? [`当前分支落后 ${worktree.branch.behind} 个提交，推送前需要处理远端差异`] : []),
  ...(worktree?.counts?.conflicted > 0 ? [`存在 ${worktree.counts.conflicted} 个冲突文件，先解决冲突再继续`] : []),
];

const distributionRisks = (report) => {
  if (!report) return [];
  if (report.stability?.status !== 'stable') return [`AI 资产分发取证状态为 ${report.stability?.status ?? 'unknown'}，不得宣称已就绪`];
  return [
    ...(!report.readiness?.workspaceCandidate ? [`workspace 尚有 ${report.scopes?.workspace?.counts?.failures ?? 'unknown'} 个 AI 资产未成为 Git 提交候选`] : []),
    ...(!report.readiness?.nextCommit ? [`Git index 尚有 ${report.scopes?.index?.counts?.failures ?? 'unknown'} 个 AI 资产未进入下一提交`] : []),
    ...(!report.readiness?.clone ? [`HEAD 尚有 ${report.scopes?.head?.counts?.failures ?? 'unknown'} 个 AI 资产当前版本不可由其他维护者 clone`] : []),
  ];
};

export const buildJsonutilsHandoffBrief = async ({
  top = 5,
  maxFiles = 20,
  runScript,
  runStatus,
} = {}) => {
  const [context, worktree] = await Promise.all([
    buildJsonutilsGovernanceContext({ top, runScript }),
    buildJsonutilsWorktreeSnapshot({ maxFiles, includeAllFiles: true, runStatus }),
  ]);
  const scorecard = context.maturityScorecard;
  const maintainabilityDimension = scorecard?.dimensions?.find(({ id }) => id === 'maintainability-headroom');
  const aiInfraStatus = maintainabilityDimension?.details?.maintainabilityHotspots;
  const validationPlan = buildJsonutilsValidationPlanFromWorktree(worktree);
  const { allFiles, ...publicWorktree } = worktree;
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-handoff-brief',
    ok: context.ok && worktree.ok,
    project: context.project,
    latestDecision: context.project?.latestDecision,
    governance: {
      ok: context.ok,
      score: scorecard?.score,
      status: scorecard?.status,
      nextFocus: scorecard?.nextFocus,
      ...(aiInfraStatus ? { aiInfraStatus } : {}),
      ...(context.distributionReadiness ? { distributionReadiness: context.distributionReadiness } : {}),
    },
    worktree: publicWorktree,
    validationPlan,
    risks: [...worktreeRisks(worktree), ...distributionRisks(context.distributionReadiness)],
    nextCommands: context.nextCommands,
  };
};
