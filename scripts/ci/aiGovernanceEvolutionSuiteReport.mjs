import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { buildEvolutionLearningReport } from './aiGovernanceEvolutionLearningReport.mjs';
import { buildAiGovernanceEvolutionSuiteFocus } from './aiGovernanceEvolutionSuiteFocus.mjs';
import { buildRegistrationCanaryGraderCalibrationReport } from './aiGovernanceRegistrationCanaryGraderCalibration.mjs';

export const buildAiGovernanceEvolutionSuiteReport = (options = {}) => {
  const { feedbackPath, experimentsPath, graderCalibrationPath, graderCalibrationRootDir, ...baseOptions } = options;
  const base = buildAiGovernanceEvolutionEvalReport(baseOptions);
  const learning = buildEvolutionLearningReport({
    rootDir: options.rootDir,
    actionableCaseIds: base.coverage?.outcomes?.uncoveredCaseIds ?? [],
    tracePolicyCaseIds: base.traceVerification?.policyCaseIds ?? [],
    ...(options.casesPath ? { casesPath: options.casesPath } : {}),
    ...(feedbackPath ? { feedbackPath } : {}),
    ...(experimentsPath ? { experimentsPath } : {}),
    ...(options.maxDate ? { maxDate: options.maxDate } : {}),
  });
  const graderHealth = buildRegistrationCanaryGraderCalibrationReport({
    rootDir: graderCalibrationRootDir ?? options.rootDir,
    ...(graderCalibrationPath ? { calibrationPath: graderCalibrationPath } : {}),
  });
  const graderFailures = graderHealth.failures.map(failure => `grader calibration: ${failure}`);
  const contractFailures = [...(base.contractFailures ?? base.failures), ...learning.failures, ...graderFailures];
  const currentRunFailures = base.currentRunFailures ?? [];
  const currentRunIssues = base.currentRunIssues ?? [];
  const failures = [...contractFailures, ...currentRunFailures];
  const blockedFocus = learning.ok ? learning.blockedFocus : null;
  const nextFocus = buildAiGovernanceEvolutionSuiteFocus({ base, learning, graderHealth });
  return {
    ...base,
    ok: failures.length === 0 && base.evidenceFreshness.failures.length === 0,
    counts: {
      ...base.counts,
      feedbackSignals: learning.counts.feedbackSignals,
      openFeedbackSignals: learning.counts.openFeedbackSignals,
      experiments: learning.counts.experiments,
      plannedExperimentTrials: learning.counts.plannedTrials,
      graderCalibrationSamples: graderHealth.counts.samples,
      graderCalibrationFailures: graderHealth.counts.failures,
      failures: failures.length,
      evidenceFreshnessFailures: base.evidenceFreshness.failures.length,
    },
    failures,
    contractFailures,
    currentRunFailures,
    currentRunIssues,
    learning,
    graderHealth,
    blockedFocus,
    nextFocus,
  };
};
