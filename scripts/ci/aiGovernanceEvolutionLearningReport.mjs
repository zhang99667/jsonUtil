import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT } from './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';
import { CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL } from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import { readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';
import { auditEvolutionLedgerIntegrity } from './aiGovernanceEvolutionLedgerIntegrity.mjs';

const REGISTRATION_SIGNAL_ID = 'mcp-project-registration-unavailable-20260711';
const REGISTRATION_EXPERIMENT_ID = 'mcp-project-registration-canary';
const buildProtectedRuntimeBlockedFocus = ({ openSignalIds, experiments }) => {
  const hasRegistrationBlocker = openSignalIds.includes(REGISTRATION_SIGNAL_ID)
    && experiments.some(item => item.id === REGISTRATION_EXPERIMENT_ID && item.execution?.status === 'blocked');
  return hasRegistrationBlocker ? {
    id: 'provision-protected-attested-verifier-launcher',
    status: 'blocked',
    blockingScope: 'external-provisioning',
    prerequisites: [
      'external-linux-admin-plane',
      'root-owned-digest-pinned-runtime',
      'non-caller-runtime-bindings',
      'external-signer-witness-state-authority',
      'zero-model-adversarial-preflight',
    ],
    nextAction: '等待 checkout 外受保护控制面完成 Linux 管理平面、固定 runtime/bindings 与外部 signer/witness；仓内继续推进不依赖该前置的 behavior coverage',
    caseIds: [...new Set([
      CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.caseId,
      CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.caseId,
      ...experiments.map(item => item.caseRef?.id).filter(Boolean),
    ])],
    blockedCaseIds: ['mcp-project-registration-discovery', 'mcp-fixed-tool-selection'],
  } : null;
};

const buildActionableLearningFocus = ({ cases, blockedFocus, actionableCaseIds }) => {
  const blockedCaseIds = new Set(blockedFocus?.blockedCaseIds ?? []);
  const behaviorCaseIds = new Set(cases
    .filter(item => item.coverageClass === 'behavior')
    .map(item => item.id));
  const candidates = actionableCaseIds ?? [...behaviorCaseIds];
  return {
    id: 'continue-repository-behavior-coverage',
    status: 'actionable',
    nextAction: '继续执行不依赖仓外受保护控制面的 behavior case，由 suite 按当前 outcome 覆盖选择顺序',
    caseIds: [...new Set(candidates.filter(caseId => (
      behaviorCaseIds.has(caseId) && !blockedCaseIds.has(caseId)
    )))].slice(0, 3),
  };
};

export const buildEvolutionLearningReport = ({
  rootDir,
  casesPath = path.join(rootDir, 'evals/ai-governance/cases.json'),
  feedbackPath = path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl'),
  experimentsPath = path.join(rootDir, 'evals/ai-governance/experiments.json'),
  maxDate = getLocalIsoDate(),
  actionableCaseIds,
} = {}) => {
  const corpus = readEvolutionEvalCorpus(casesPath, { maxDate });
  const casesById = new Map(corpus.cases.map(item => [item.id, item]));
  const feedback = readEvolutionFeedbackInbox(feedbackPath, { casesById, maxDate });
  const experiments = readEvolutionExperiments(experimentsPath, { casesById, maxDate });
  const feedbackIntegrity = auditEvolutionLedgerIntegrity({ rootDir, ledgerPaths: [feedbackPath] });
  const experimentIds = new Set(experiments.experiments.map(item => item.id));
  const failures = [...feedback.failures, ...experiments.failures, ...feedbackIntegrity.failures];
  feedback.validEvents.filter(event => !experimentIds.has(event.experimentId)).forEach(event => failures.push(`feedback-inbox.jsonl: experiment \`${event.experimentId}\` 不存在`));
  const signalIds = new Set(feedback.validEvents.map(event => event.signalId));
  experiments.experiments.filter(item => !signalIds.has(item.originSignalId)).forEach(item => failures.push(`experiments.json: origin signal \`${item.originSignalId}\` 不存在`));
  const latestSignals = [...feedback.states?.values?.() ?? []];
  const openSignalIds = latestSignals.filter(event => event.disposition === 'open').map(event => event.signalId);
  const plannedTrials = experiments.experiments.reduce((sum, item) => sum + (item.design?.trialPlan?.length ?? 0), 0);
  const blockedFocus = buildProtectedRuntimeBlockedFocus({ openSignalIds, experiments: experiments.experiments });
  const nextFocus = buildActionableLearningFocus({
    cases: corpus.cases,
    blockedFocus,
    actionableCaseIds,
  });
  return {
    schemaVersion: 1,
    reportType: 'ai-evolution-learning',
    ok: failures.length === 0,
    counts: {
      feedbackEvents: feedback.events.length,
      feedbackSignals: latestSignals.length,
      openFeedbackSignals: openSignalIds.length,
      experiments: experiments.experiments.length,
      plannedTrials,
      executedTrials: 0,
    },
    feedbackChain: feedback.chain,
    feedbackIntegrity,
    openSignalIds,
    experiments: experiments.experiments.map(item => ({
      id: item.id,
      caseId: item.caseRef?.id,
      status: item.execution?.status,
      repetitions: item.design?.repetitions,
      plannedTrials: item.design?.trialPlan?.length ?? 0,
      metricsStatus: 'unavailable',
    })),
    blockedFocus,
    nextFocus,
    failures,
  };
};
