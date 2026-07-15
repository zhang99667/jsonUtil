import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { buildEvolutionLearningReport } from './aiGovernanceEvolutionLearningReport.mjs';

const buildActionableFocus = (base, blockedFocus) => {
  if (base.nextFocus?.id !== 'increase-outcome-coverage' || !blockedFocus) return base.nextFocus;
  const blockedCaseIds = new Set(blockedFocus.blockedCaseIds ?? []);
  const candidates = [
    ...(base.nextFocus.caseIds ?? []),
    ...(base.coverage?.outcomes?.uncoveredCaseIds ?? []),
  ];
  return {
    ...base.nextFocus,
    caseIds: [...new Set(candidates.filter(caseId => !blockedCaseIds.has(caseId)))].slice(0, 3),
  };
};

export const buildAiGovernanceEvolutionSuiteReport = (options = {}) => {
  const { feedbackPath, experimentsPath, ...baseOptions } = options;
  const base = buildAiGovernanceEvolutionEvalReport(baseOptions);
  const learning = buildEvolutionLearningReport({
    rootDir: options.rootDir,
    actionableCaseIds: base.coverage?.outcomes?.uncoveredCaseIds ?? [],
    ...(options.casesPath ? { casesPath: options.casesPath } : {}),
    ...(feedbackPath ? { feedbackPath } : {}),
    ...(experimentsPath ? { experimentsPath } : {}),
    ...(options.maxDate ? { maxDate: options.maxDate } : {}),
  });
  const failures = [...base.failures, ...learning.failures];
  const blockedFocus = learning.ok ? learning.blockedFocus : null;
  const actionableFocus = buildActionableFocus(base, blockedFocus);
  return {
    ...base,
    ok: failures.length === 0,
    counts: {
      ...base.counts,
      feedbackSignals: learning.counts.feedbackSignals,
      openFeedbackSignals: learning.counts.openFeedbackSignals,
      experiments: learning.counts.experiments,
      plannedExperimentTrials: learning.counts.plannedTrials,
      failures: failures.length,
    },
    failures,
    learning,
    blockedFocus,
    nextFocus: learning.failures.length > 0 ? {
      id: 'fix-learning-contract', nextAction: '修复 feedback/experiment 数据契约', caseIds: [],
    } : base.failures.length > 0 ? base.nextFocus : actionableFocus,
  };
};
