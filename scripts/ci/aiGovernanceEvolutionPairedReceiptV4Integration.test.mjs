import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { collectEvolutionReceiptBindingFailures } from './aiGovernanceEvolutionOutcomeEvidence.mjs';
import {
  AI_EVOLUTION_PAIRED_RUNNER,
  AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
  AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { buildEvolutionPairedBatchFixture } from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';
import { verifyEvolutionTraceOutcomes } from './aiGovernanceEvolutionTraceOutcomes.mjs';
import {
  hashEvolutionTrialReceiptLine,
  readEvolutionTrialReceiptLedger,
} from './aiGovernanceEvolutionTrialReceipts.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evaluatedAt = '2026-07-15';

const buildReceipt = (fixture) => {
  const validation = {
    command: AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
    status: 'passed',
    evidence: AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
    checkedAt: evaluatedAt,
  };
  return {
    schemaVersion: 4,
    id: 'paired-integration-receipt',
    artifactType: 'ai-evolution-trial-receipt',
    dataClass: 'redacted',
    caseId: fixture.context.caseItem.id,
    corpusVersion: fixture.context.corpusResult.corpus.corpusVersion,
    caseVersion: fixture.context.caseItem.caseVersion,
    subjectVersion: fixture.context.caseItem.subject.version,
    evaluatedAt,
    method: 'hybrid',
    source: 'manual',
    runner: AI_EVOLUTION_PAIRED_RUNNER,
    revision: fixture.context.revision,
    aggregation: 'candidate-only-v1',
    trialResults: structuredClone(fixture.batch.trialResults),
    validations: [validation],
    ...Object.fromEntries([
      'experimentRef', 'caseRef', 'fixtureRef', 'environmentRef', 'policyRef',
      'rubricSha256', 'assignment', 'checkpoint', 'proof',
    ].map(field => [field, structuredClone(fixture.batch[field])])),
  };
};

test('ledger reader 路由 v4，OutcomeEvidence/TraceOutcomes 均拒绝仓内验签升级', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const receipt = buildReceipt(fixture);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-paired-integration-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const receiptLine = JSON.stringify(receipt);
  const ledgerPath = path.join(directory, 'trial-receipts.jsonl');
  fs.writeFileSync(ledgerPath, `${receiptLine}\n`);
  const ledger = readEvolutionTrialReceiptLedger(ledgerPath, {
    rootDir, maxDate: evaluatedAt, pairedTrustPolicy: fixture.pairedTrustPolicy,
  });
  assert.deepEqual(ledger.failures, []);
  const entry = ledger.receiptsById.get(receipt.id);
  assert.equal(entry.pairedVerification.proofVerification.status, 'signature-verified-unwitnessed');
  assert.equal(entry.pairedVerification.scoringEligible, false);

  const outcome = {
    schemaVersion: 3,
    id: 'paired-integration-outcome',
    caseId: receipt.caseId,
    corpusVersion: receipt.corpusVersion,
    caseVersion: receipt.caseVersion,
    subjectVersion: receipt.subjectVersion,
    evaluatedAt,
    verdict: 'pass',
    score: 100,
    provenance: {
      method: receipt.method, source: receipt.source, runner: receipt.runner,
      revision: receipt.revision, trials: 3,
    },
    evidence: { receiptId: receipt.id, sha256: hashEvolutionTrialReceiptLine(receiptLine) },
    writeback: { files: [], validationResults: structuredClone(receipt.validations) },
  };
  const bindingFailures = collectEvolutionReceiptBindingFailures(
    outcome, 'paired integration outcome', ledger.receiptsById,
  );
  assert.match(bindingFailures.join('\n'), /缺少仓外受保护 trust\/environment 授权/);

  const trace = verifyEvolutionTraceOutcomes({
    outcomes: [outcome],
    receiptsById: ledger.receiptsById,
    casesById: new Map([[receipt.caseId, fixture.context.caseItem]]),
    policiesByCaseId: new Map([[receipt.caseId, fixture.context.policyEntry]]),
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });
  assert.deepEqual(trace.failures, []);
  assert.deepEqual([...trace.verifiedOutcomeIds], []);
  assert.deepEqual([...trace.unverifiedOutcomeIds], [outcome.id]);
  assert.equal(trace.registry.trustedSigners, 0);
  assert.equal(trace.registry.signatureVerificationKeys, 3);
});
