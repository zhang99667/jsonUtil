import fs from 'node:fs';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildEvolutionEvalProjection } from './aiGovernanceEvolutionEvalProjection.mjs';
import { auditEvolutionLedgerIntegrity } from './aiGovernanceEvolutionLedgerIntegrity.mjs';
import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';
import { classifyEvolutionOutcomeHistory } from './aiGovernanceEvolutionOutcomeHistory.mjs';
import { replayEvolutionDeterministicOutcomes } from './aiGovernanceEvolutionOutcomeReplay.mjs';
import { verifyEvolutionTraceOutcomes } from './aiGovernanceEvolutionTraceOutcomes.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { readEvolutionTrialReceiptLedger } from './aiGovernanceEvolutionTrialReceipts.mjs';
import { normalizeEvolutionCurrentRunIssues } from './aiGovernanceEvolutionCaseFailure.mjs';

export const buildAiGovernanceEvolutionEvalReport = ({
  rootDir,
  casesPath = path.join(rootDir, 'evals/ai-governance/cases.json'),
  outcomesPath = path.join(rootDir, 'evals/ai-governance/outcomes.jsonl'),
  receiptsPath = path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'),
  maxDate = getLocalIsoDate(),
  replayDeterministic = replayEvolutionDeterministicOutcomes,
  trustedSigners = new Map(),
  pairedTrustPolicy = {},
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
  const receiptResult = readEvolutionTrialReceiptLedger(receiptsPath, {
    rootDir, maxDate, trustedSigners, pairedTrustPolicy,
  });
  const outcomeResult = readEvolutionOutcomeLedger(outcomesPath, {
    caseIds: allowedCaseIds,
    maxDate,
    rootDir,
    receiptsById: receiptResult.receiptsById,
    currentCorpusVersion: corpusResult.corpus.corpusVersion,
  });
  const contractFailures = [
    ...corpusResult.failures, ...receiptResult.failures, ...outcomeResult.failures,
    ...ledgerIntegrity.failures, ...policyRegistry.failures,
  ];
  const caseDescriptorsById = new Map(corpusResult.cases.map(item => [item?.id, {
    caseVersion: item?.caseVersion,
    subjectVersion: item?.subject?.version,
  }]));
  const history = classifyEvolutionOutcomeHistory(outcomeResult.validOutcomes, caseDescriptorsById, retiredCaseIds);
  history.futureOutcomes.forEach(() => contractFailures.push('outcomes.jsonl: caseVersion 高于当前 case，禁止预埋未来结果'));
  history.activeLatestOutcomes.filter(outcome => componentBoundaryCaseIdSet.has(outcome.caseId)).forEach(outcome => (
    contractFailures.push(`outcomes.jsonl: active outcome \`${outcome.id}\` 引用 component-boundary case \`${outcome.caseId}\`，禁止进入行为评分`)
  ));
  const receiptRefIds = outcomeResult.validOutcomes
    .filter(outcome => outcome.schemaVersion >= 2)
    .map(outcome => outcome.evidence?.receiptId)
    .filter(Boolean);
  if (new Set(receiptRefIds).size !== receiptRefIds.length) contractFailures.push('outcomes.jsonl: 可评分 outcome receipt 不能被重复引用');
  const referencedReceiptIds = new Set(receiptRefIds);
  receiptResult.validReceipts.forEach((receipt) => {
    if (!referencedReceiptIds.has(receipt.id)) contractFailures.push(`trial-receipts.jsonl: receipt \`${receipt.id}\` 没有 outcome 引用`);
  });
  const replay = contractFailures.length === 0
    ? replayDeterministic({
      rootDir,
      outcomes: history.activeLatestOutcomes,
      receiptsById: receiptResult.receiptsById,
      ...(resolveRevision ? { resolveRevision } : {}),
    })
    : { verifiedOutcomeIds: new Set(), currentRunVerifiedOutcomeIds: new Set(), failures: [], evidenceFreshness: { status: 'unavailable', staleOutcomeIds: [], staleCaseIds: [], failures: [] } };
  const currentRunFailures = replay.failures ?? [], currentRunIssues = normalizeEvolutionCurrentRunIssues(currentRunFailures, replay.currentRunIssues);
  const traceVerification = contractFailures.length + currentRunFailures.length === 0
    ? verifyEvolutionTraceOutcomes({
      outcomes: history.activeLatestOutcomes,
      receiptsById: receiptResult.receiptsById,
      casesById: new Map(corpusResult.cases.map(item => [item.id, item])),
      policiesByCaseId: policyRegistry.policiesByCaseId,
      trustedSigners,
      pairedTrustPolicy,
    })
    : {
      traceBoundOutcomeIds: new Set(), verifiedOutcomeIds: new Set(),
      unverifiedOutcomeIds: new Set(),
      registry: {
        trustedSigners: 0, signatureVerificationKeys: 0,
        trustedAdapters: 0, policies: policyRegistry.policiesByCaseId.size,
      }, failures: [],
    };
  contractFailures.push(...traceVerification.failures);
  return buildEvolutionEvalProjection({
    corpusResult,
    behaviorCaseIds,
    componentBoundaryCaseIds,
    receiptResult,
    outcomeResult,
    history,
    replay,
    currentRunFailures,
    currentRunIssues,
    traceVerification,
    policyRegistry,
    contractFailures,
    ledgerIntegrity,
  });
};
