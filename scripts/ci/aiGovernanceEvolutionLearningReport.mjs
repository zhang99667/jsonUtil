import path from 'node:path';
import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import { readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';
import { auditEvolutionLedgerIntegrity } from './aiGovernanceEvolutionLedgerIntegrity.mjs';
import { buildActionableLearningFocus, buildProtectedRuntimeBlockedFocus } from './aiGovernanceEvolutionLearningFocus.mjs';

export const buildEvolutionLearningReport = ({
  rootDir,
  casesPath = path.join(rootDir, 'evals/ai-governance/cases.json'),
  feedbackPath = path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl'),
  experimentsPath = path.join(rootDir, 'evals/ai-governance/experiments.json'),
  maxDate = getLocalIsoDate(),
  actionableCaseIds,
  tracePolicyCaseIds = [],
  trialReadyCaseIds,
} = {}) => {
  const corpus = readEvolutionEvalCorpus(casesPath, { maxDate });
  const casesById = new Map(corpus.cases.map(item => [item.id, item]));
  const feedback = readEvolutionFeedbackInbox(feedbackPath, { casesById, maxDate });
  const experiments = readEvolutionExperiments(experimentsPath, { casesById, maxDate });
  const feedbackIntegrity = auditEvolutionLedgerIntegrity({ rootDir, ledgerPaths: [feedbackPath] });
  const experimentIds = new Set(experiments.experiments.map(item => item.id));
  const failures = [...feedback.failures, ...experiments.failures, ...feedbackIntegrity.failures];
  feedback.validEvents.filter(event => event.experimentId !== null && !experimentIds.has(event.experimentId))
    .forEach(event => failures.push(`feedback-inbox.jsonl: experiment \`${event.experimentId}\` 不存在`));
  const signalIds = new Set(feedback.validEvents.map(event => event.signalId));
  experiments.experiments.filter(item => !signalIds.has(item.originSignalId)).forEach(item => failures.push(`experiments.json: origin signal \`${item.originSignalId}\` 不存在`));
  const latestSignals = [...feedback.states?.values?.() ?? []];
  const openSignalIds = latestSignals.filter(event => event.disposition === 'open').map(event => event.signalId);
  const plannedTrials = experiments.experiments.reduce((sum, item) => sum + (item.design?.trialPlan?.length ?? 0), 0);
  const blockedFocus = buildProtectedRuntimeBlockedFocus({ openSignalIds, experiments: experiments.experiments });
  const readyCaseIds = trialReadyCaseIds ?? experiments.experiments.filter(item => item.execution?.status === 'ready'
    && item.ingestion?.status === 'ready').map(item => item.caseRef?.id);
  const externalExecutionCaseIds = experiments.experiments.filter(item => item.execution?.status === 'prepared'
    && item.execution?.reasonCode === 'external-execution-required' && item.ingestion?.reasonCode === 'protected-assignment-trust-unavailable').map(item => item.caseRef?.id);
  const nextFocus = buildActionableLearningFocus({ cases: corpus.cases, blockedFocus,
    actionableCaseIds, tracePolicyCaseIds, trialReadyCaseIds: readyCaseIds, externalExecutionCaseIds });
  return {
    schemaVersion: 1,
    reportType: 'ai-evolution-learning',
    ok: failures.length === 0,
    counts: { feedbackEvents: feedback.events.length, feedbackSignals: latestSignals.length,
      openFeedbackSignals: openSignalIds.length, experiments: experiments.experiments.length,
      plannedTrials, executedTrials: 0 },
    feedbackChain: feedback.chain,
    feedbackIntegrity,
    openSignalIds,
    experiments: experiments.experiments.map(item => ({
      id: item.id,
      caseId: item.caseRef?.id,
      contractVersion: item.contractVersion ?? 1,
      status: item.execution?.status,
      repetitions: item.design?.repetitions,
      plannedTrials: item.design?.trialPlan?.length ?? 0,
      ingestionStatus: item.ingestion?.status ?? 'not-applicable',
      metricsStatus: 'unavailable',
    })),
    blockedFocus,
    nextFocus,
    failures,
  };
};
