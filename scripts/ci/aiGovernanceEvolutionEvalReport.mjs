import fs from 'node:fs';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildEvolutionNextFocus, countEvolutionVerdicts } from './aiGovernanceEvolutionEvalFocus.mjs';
import { auditEvolutionLedgerIntegrity } from './aiGovernanceEvolutionLedgerIntegrity.mjs';
import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';
import { classifyEvolutionOutcomeHistory } from './aiGovernanceEvolutionOutcomeHistory.mjs';
import { replayEvolutionDeterministicOutcomes } from './aiGovernanceEvolutionOutcomeReplay.mjs';
import { verifyEvolutionTraceOutcomes } from './aiGovernanceEvolutionTraceOutcomes.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { readEvolutionTrialReceiptLedger } from './aiGovernanceEvolutionTrialReceipts.mjs';

export const buildAiGovernanceEvolutionEvalReport = ({
  rootDir,
  casesPath = path.join(rootDir, 'evals/ai-governance/cases.json'),
  outcomesPath = path.join(rootDir, 'evals/ai-governance/outcomes.jsonl'),
  receiptsPath = path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'),
  maxDate = getLocalIsoDate(),
  replayDeterministic = replayEvolutionDeterministicOutcomes,
  trustedSigners = new Map(),
  tracePoliciesPath = path.join(rootDir, 'evals/ai-governance/trace-policies.json'),
  tracePolicyRegistry,
  resolveRevision,
}) => {
  const policyRegistry = tracePolicyRegistry ?? (fs.existsSync(tracePoliciesPath)
    ? buildEvolutionTracePolicyRegistry({ rootDir, policiesPath: tracePoliciesPath })
    : { policiesByCaseId: new Map(), failures: [] });
  const ledgerIntegrity = auditEvolutionLedgerIntegrity({ rootDir, ledgerPaths: [outcomesPath, receiptsPath] });
  const corpusResult = readEvolutionEvalCorpus(casesPath, { maxDate });
  const caseIds = new Set(corpusResult.cases.map(item => item?.id).filter(Boolean));
  const behaviorCaseIds = new Set(corpusResult.cases.filter(item => item?.coverageClass === 'behavior').map(item => item.id));
  const componentBoundaryCaseIds = corpusResult.cases.filter(item => item?.coverageClass === 'component-boundary').map(item => item.id);
  const componentBoundaryCaseIdSet = new Set(componentBoundaryCaseIds);
  const retiredCaseIds = new Set(corpusResult.retiredCaseIds);
  const allowedCaseIds = new Set([...caseIds, ...retiredCaseIds]);
  const receiptResult = readEvolutionTrialReceiptLedger(receiptsPath, { rootDir, maxDate, trustedSigners });
  const outcomeResult = readEvolutionOutcomeLedger(outcomesPath, {
    caseIds: allowedCaseIds,
    maxDate,
    rootDir,
    receiptsById: receiptResult.receiptsById,
    currentCorpusVersion: corpusResult.corpus.corpusVersion,
  });
  const failures = [
    ...corpusResult.failures, ...receiptResult.failures, ...outcomeResult.failures,
    ...ledgerIntegrity.failures, ...policyRegistry.failures,
  ];
  const caseDescriptorsById = new Map(corpusResult.cases.map(item => [item?.id, {
    caseVersion: item?.caseVersion,
    subjectVersion: item?.subject?.version,
  }]));
  const history = classifyEvolutionOutcomeHistory(outcomeResult.validOutcomes, caseDescriptorsById, retiredCaseIds);
  history.futureOutcomes.forEach(() => failures.push('outcomes.jsonl: caseVersion 高于当前 case，禁止预埋未来结果'));
  history.activeLatestOutcomes.filter(outcome => componentBoundaryCaseIdSet.has(outcome.caseId)).forEach(outcome => (
    failures.push(`outcomes.jsonl: active outcome \`${outcome.id}\` 引用 component-boundary case \`${outcome.caseId}\`，禁止进入行为评分`)
  ));
  const receiptRefIds = outcomeResult.validOutcomes
    .filter(outcome => outcome.schemaVersion >= 2)
    .map(outcome => outcome.evidence?.receiptId)
    .filter(Boolean);
  if (new Set(receiptRefIds).size !== receiptRefIds.length) failures.push('outcomes.jsonl: 可评分 outcome receipt 不能被重复引用');
  const referencedReceiptIds = new Set(receiptRefIds);
  receiptResult.validReceipts.forEach((receipt) => {
    if (!referencedReceiptIds.has(receipt.id)) failures.push(`trial-receipts.jsonl: receipt \`${receipt.id}\` 没有 outcome 引用`);
  });
  const replay = failures.length === 0
    ? replayDeterministic({
      rootDir,
      outcomes: history.activeLatestOutcomes,
      receiptsById: receiptResult.receiptsById,
      ...(resolveRevision ? { resolveRevision } : {}),
    })
    : { verifiedOutcomeIds: new Set(), failures: [] };
  failures.push(...replay.failures);
  const traceVerification = failures.length === 0
    ? verifyEvolutionTraceOutcomes({
      outcomes: history.activeLatestOutcomes,
      receiptsById: receiptResult.receiptsById,
      casesById: new Map(corpusResult.cases.map(item => [item.id, item])),
      policiesByCaseId: policyRegistry.policiesByCaseId,
      trustedSigners,
    })
    : {
      traceBoundOutcomeIds: new Set(), verifiedOutcomeIds: new Set(),
      unverifiedOutcomeIds: new Set(),
      registry: {
        trustedSigners: 0, trustedAdapters: 0, policies: policyRegistry.policiesByCaseId.size,
      }, failures: [],
    };
  failures.push(...traceVerification.failures);
  const verifiedOutcomeIds = new Set([
    ...replay.verifiedOutcomeIds,
    ...traceVerification.verifiedOutcomeIds,
  ]);
  const activeOutcomes = history.activeLatestOutcomes.filter(outcome => verifiedOutcomeIds.has(outcome.id));
  const unverifiedOutcomeIds = new Set([
    ...traceVerification.unverifiedOutcomeIds,
    ...history.activeLatestOutcomes.filter(outcome => (
      outcome.schemaVersion >= 2 && outcome.provenance?.method !== 'deterministic'
      && !verifiedOutcomeIds.has(outcome.id)
    )).map(outcome => outcome.id),
  ]);
  const unverifiedOutcomes = history.activeLatestOutcomes.filter(outcome => unverifiedOutcomeIds.has(outcome.id));
  const traceBoundUnverifiedOutcomes = history.activeLatestOutcomes.filter(outcome => (
    traceVerification.unverifiedOutcomeIds.has(outcome.id)
  ));
  const coveredCaseIds = new Set(activeOutcomes.map(item => item.caseId).filter(id => behaviorCaseIds.has(id)));
  const uncoveredCaseIds = [...behaviorCaseIds].filter(id => !coveredCaseIds.has(id));
  const counts = {
    cases: corpusResult.cases.length,
    behaviorCases: behaviorCaseIds.size,
    componentBoundaryCases: componentBoundaryCaseIds.length,
    outcomes: activeOutcomes.length,
    totalOutcomes: outcomeResult.outcomes.length,
    validOutcomes: outcomeResult.validOutcomes.length,
    activeLatestOutcomes: activeOutcomes.length,
    recordedActiveOutcomes: history.activeLatestOutcomes.length,
    fixedReplayVerifiedOutcomes: replay.verifiedOutcomeIds.size,
    traceBoundOutcomes: traceVerification.traceBoundOutcomeIds.size,
    traceVerifiedOutcomes: traceVerification.verifiedOutcomeIds.size,
    traceBoundUnverifiedOutcomes: traceVerification.unverifiedOutcomeIds.size,
    unverifiedOutcomes: unverifiedOutcomes.length,
    legacyOutcomes: history.legacyOutcomes.length,
    staleOutcomes: history.staleOutcomes.length,
    retiredOutcomes: history.retiredOutcomes.length,
    supersededOutcomes: history.supersededOutcomes,
    historyOutcomes: outcomeResult.validOutcomes.length - activeOutcomes.length,
    invalidOutcomes: outcomeResult.invalidOutcomeCount + history.invalidOutcomes,
    trialReceipts: receiptResult.receipts.length,
    validTrialReceipts: receiptResult.validReceipts.length,
    invalidTrialReceipts: receiptResult.invalidReceiptCount,
    chainedOutcomes: outcomeResult.ledgerChain.chainedOutcomes,
    openFeedback: outcomeResult.ledgerChain.openFeedback,
    resolvedFeedback: outcomeResult.ledgerChain.resolvedFeedback,
    pass: countEvolutionVerdicts(activeOutcomes, 'pass'),
    partial: countEvolutionVerdicts(activeOutcomes, 'partial'),
    fail: countEvolutionVerdicts(activeOutcomes, 'fail'),
    unverifiedPass: countEvolutionVerdicts(unverifiedOutcomes, 'pass'),
    unverifiedPartial: countEvolutionVerdicts(unverifiedOutcomes, 'partial'),
    unverifiedFail: countEvolutionVerdicts(unverifiedOutcomes, 'fail'),
    coveredCases: coveredCaseIds.size,
    uncoveredCases: uncoveredCaseIds.length,
    failures: failures.length,
  };
  const coverage = {
    corpus: corpusResult.coverage,
    outcomes: {
      coveredCases: coveredCaseIds.size,
      totalCases: behaviorCaseIds.size,
      percent: behaviorCaseIds.size === 0 ? 0 : Math.round((coveredCaseIds.size / behaviorCaseIds.size) * 100),
      uncoveredCaseIds,
      excluded: {
        coverageClass: 'component-boundary', totalCases: componentBoundaryCaseIds.length,
        caseIds: componentBoundaryCaseIds,
      },
      activeLatestOutcomes: activeOutcomes.length,
      staleOutcomes: history.staleOutcomes.length,
      retiredOutcomes: history.retiredOutcomes.length,
    },
  };
  return {
    schemaVersion: 1,
    reportType: 'ai-governance-evolution-evals',
    ok: failures.length === 0,
    counts,
    coverage,
    failures,
    ledgerIntegrity,
    ledgerChain: outcomeResult.ledgerChain,
    traceVerification: {
      status: traceVerification.registry.trustedSigners > 0 && traceVerification.registry.policies > 0
        ? 'configured'
        : traceVerification.registry.policies > 0 ? 'policy-ready' : 'unavailable',
      ...traceVerification.registry,
    },
    nextFocus: buildEvolutionNextFocus({
      failures, outcomes: activeOutcomes, unverifiedOutcomes, traceBoundUnverifiedOutcomes, uncoveredCaseIds,
      tracePolicyCaseIds: [...policyRegistry.policiesByCaseId.keys()].filter(id => behaviorCaseIds.has(id)),
      ledgerChain: outcomeResult.ledgerChain,
    }),
    scoredOutcomeIds: activeOutcomes.map(outcome => outcome.id),
    fixedReplayVerifiedOutcomeIds: [...replay.verifiedOutcomeIds],
    traceVerifiedOutcomeIds: [...traceVerification.verifiedOutcomeIds],
    traceBoundOutcomeIds: [...traceVerification.traceBoundOutcomeIds],
    unverifiedOutcomeIds: unverifiedOutcomes.map(outcome => outcome.id),
  };
};
