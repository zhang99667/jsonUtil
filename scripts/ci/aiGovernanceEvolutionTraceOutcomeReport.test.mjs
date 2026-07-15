import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { createEvolutionTraceProof } from './aiGovernanceEvolutionTraceProof.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));
const caseItem = corpus.cases.find(item => item.id === 'mcp-newline-version-negotiation');
const componentBoundaryCaseItem = corpus.cases.find(item => item.id === 'codex-exec-jsonl-adapter-boundary');
const REVISION = 'a'.repeat(40);
const COMMAND_FILES = [
  'scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs',
  'scripts/mcp/jsonutils-governance-runtime-freshness.test.mjs',
  'scripts/mcp/jsonutils-governance-cancellation.test.mjs',
  'scripts/mcp/jsonutils-governance-cancellation-stdio.test.mjs',
];
const COMMAND = `node --test ${COMMAND_FILES.join(' ')}`;

const buildReceipt = (method, selectedCase = caseItem) => ({
  schemaVersion: 2,
  id: `receipt-trace-report-${method}`,
  artifactType: 'ai-evolution-trial-receipt',
  dataClass: 'redacted',
  caseId: selectedCase.id,
  corpusVersion: corpus.corpusVersion,
  caseVersion: selectedCase.caseVersion,
  subjectVersion: selectedCase.subject.version,
  evaluatedAt: '2026-07-11',
  method,
  source: 'local',
  runner: 'host-events',
  revision: REVISION,
  aggregation: 'all-pass',
  trialResults: [{
    trial: 1, verdict: 'pass', score: 100, gradeTarget: 'trace',
    evidence: '只记录脱敏 observable trace 结论',
  }],
  validations: [{ command: COMMAND, status: 'passed', evidence: '固定验证通过', checkedAt: '2026-07-11' }],
  trace: {
    schemaVersion: 1,
    adapter: { id: 'host-events', version: '1.0.0' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    caseSha256: hashEvolutionTraceValue(selectedCase),
    policy: { id: selectedCase.id, version: '1.0.0', sha256: 'c'.repeat(64) },
    beforeRevision: REVISION,
    afterRevision: REVISION,
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      { sequence: 2, type: 'validation.start', actorId: 'root', validationIndex: 1, status: 'started' },
      { sequence: 3, type: 'validation.finish', actorId: 'root', validationIndex: 1, status: 'passed' },
      { sequence: 4, type: 'response.finish', actorId: 'root', sha256: 'd'.repeat(64), status: 'passed' },
      { sequence: 5, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
});

const buildOutcome = receipt => ({
  schemaVersion: 2,
  id: `outcome-trace-report-${receipt.method}`,
  caseId: receipt.caseId,
  corpusVersion: receipt.corpusVersion,
  caseVersion: receipt.caseVersion,
  subjectVersion: receipt.subjectVersion,
  evaluatedAt: receipt.evaluatedAt,
  verdict: 'pass',
  score: 100,
  provenance: {
    method: receipt.method, source: receipt.source, runner: receipt.runner,
    revision: receipt.revision, trials: 1,
  },
  evidence: {
    receiptId: receipt.id,
    sha256: createHash('sha256').update(JSON.stringify(receipt), 'utf8').digest('hex'),
  },
  writeback: {
    files: COMMAND_FILES,
    validationResults: structuredClone(receipt.validations),
  },
});

const withReport = (method, options, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-trace-report-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    for (const relativePath of COMMAND_FILES) {
      const evidenceFile = path.join(rootDir, relativePath);
      fs.mkdirSync(path.dirname(evidenceFile), { recursive: true });
      fs.writeFileSync(evidenceFile, "import { test } from 'node:test';\ntest('fixture', () => {});\n");
    }
    const selectedCase = options.selectedCase ?? caseItem;
    let receipt = buildReceipt(method, selectedCase);
    let trustedSigners = new Map();
    if (options.signed === true) {
      const { privateKey, publicKey } = generateKeyPairSync('ed25519');
      receipt = { ...receipt, schemaVersion: 3 };
      receipt.proof = createEvolutionTraceProof({
        receipt,
        executionFacts: {
          modelId: 'gpt-5.4', cliVersion: '0.144.0-alpha.4', binarySha256: 'a'.repeat(64),
          stdoutSha256: 'b'.repeat(64), exitCode: 0, stdoutDrained: true, timedOut: false,
          binaryStable: true, execArgsSha256: 'e'.repeat(64), adapterBundleSha256: 'f'.repeat(64),
        },
        signer: { keyid: 'protected-host', privateKey },
      });
      trustedSigners = new Map([['protected-host', publicKey]]);
    }
    const outcome = buildOutcome(receipt);
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus)}\n`);
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), `${JSON.stringify(receipt)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), `${JSON.stringify(outcome)}\n`);
    const { signed: _signed, selectedCase: _selectedCase, ...reportOptions } = options;
    return run(buildAiGovernanceEvolutionEvalReport({
      rootDir, maxDate: '2026-07-15', trustedSigners, ...reportOptions,
    }), { receipt, outcome });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('trace-bound model/human/hybrid pass 默认 valid-but-unverified 且零覆盖', () => {
  for (const method of ['model', 'human', 'hybrid']) withReport(method, {}, (report, { outcome }) => {
    assert.equal(report.ok, true, method);
    assert.equal(report.counts.traceBoundOutcomes, 1);
    assert.equal(report.counts.traceVerifiedOutcomes, 0);
    assert.equal(report.counts.unverifiedOutcomes, 1);
    assert.equal(report.counts.coveredCases, 0);
    assert.deepEqual(report.unverifiedOutcomeIds, [outcome.id]);
    assert.equal(report.nextFocus.id, 'verify-agent-trace');
    assert.deepEqual(report.traceVerification, {
      status: 'unavailable', trustedSigners: 0, signatureVerificationKeys: 0,
      trustedAdapters: 0, policies: 0, policyCaseIds: [],
    });
  });
});

test('只有外部受信 signer 的 v3 proof 通过后才合并进入 confirmed coverage', () => {
  withReport('human', {
    signed: true,
    tracePolicyRegistry: {
      failures: [],
      policiesByCaseId: new Map([[caseItem.id, {
        descriptor: { id: caseItem.id, version: '1.0.0', sha256: 'c'.repeat(64) },
        verify: () => ({ status: 'verified', failures: [] }),
      }]]),
    },
  }, (report, { outcome }) => {
    assert.equal(report.ok, true);
    assert.equal(report.counts.traceVerifiedOutcomes, 1);
    assert.equal(report.counts.outcomes, 1);
    assert.equal(report.counts.coveredCases, 1);
    assert.deepEqual(report.traceVerifiedOutcomeIds, [outcome.id]);
    assert.deepEqual(report.traceVerification, {
      status: 'configured', trustedSigners: 1, signatureVerificationKeys: 1,
      trustedAdapters: 1, policies: 1,
      policyCaseIds: [caseItem.id],
    });
  });
});

test('只有固定 policy 时报告为 policy-ready，仍不提升覆盖', () => {
  withReport('human', {
    tracePolicyRegistry: {
      failures: [],
      policiesByCaseId: new Map([[caseItem.id, {
        descriptor: { id: caseItem.id, version: '1.0.0', sha256: 'c'.repeat(64) },
        verify: () => ({ status: 'verified', failures: [] }),
      }]]),
    },
  }, (report) => {
    assert.equal(report.counts.traceVerifiedOutcomes, 0);
    assert.equal(report.counts.coveredCases, 0);
    assert.deepEqual(report.traceVerification, {
      status: 'policy-ready', trustedSigners: 0, signatureVerificationKeys: 0,
      trustedAdapters: 0, policies: 1,
      policyCaseIds: [caseItem.id],
    });
  });
});

test('component-boundary case 一旦出现 active outcome 就 fail closed', () => {
  withReport('human', { selectedCase: componentBoundaryCaseItem }, (report) => {
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /active outcome .*component-boundary case.*禁止进入行为评分/);
    assert.equal(report.counts.outcomes, 0);
    assert.equal(report.counts.coveredCases, 0);
    assert.equal(report.coverage.outcomes.totalCases, 18);
    assert.ok(report.coverage.outcomes.excluded.caseIds.includes(componentBoundaryCaseItem.id));
  });
});
