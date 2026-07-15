import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';

import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { verifyEvolutionTraceOutcomes } from './aiGovernanceEvolutionTraceOutcomes.mjs';
import { createEvolutionTraceProof } from './aiGovernanceEvolutionTraceProof.mjs';
import { replayEvolutionDeterministicOutcomes } from './aiGovernanceEvolutionOutcomeReplay.mjs';
const REVISION = 'a'.repeat(40);
const POLICY = { id: 'mcp-fixed-tool-selection', version: '1.0.0', sha256: 'c'.repeat(64) };
const caseItem = {
  id: 'mcp-fixed-tool-selection', caseVersion: 1, mode: 'positive',
  subject: { kind: 'mcp', id: 'jsonutils-governance', version: '0.3.0' },
};
const receipt = {
  schemaVersion: 2,
  id: 'trace-receipt',
  caseId: caseItem.id,
  corpusVersion: '1.6.0',
  caseVersion: caseItem.caseVersion,
  subjectVersion: caseItem.subject.version,
  revision: REVISION,
  validations: [{ command: 'node --test fixture.test.mjs', status: 'passed' }],
  trace: {
    schemaVersion: 1,
    adapter: { id: 'host-events', version: '1.0.0' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    caseSha256: hashEvolutionTraceValue(caseItem),
    policy: POLICY,
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
};
const outcome = { schemaVersion: 3, id: 'trace-outcome', caseId: caseItem.id, evidence: { receiptId: 'trace-receipt' } };
const input = {
  outcomes: [outcome],
  receiptsById: new Map([['trace-receipt', { receipt }]]),
  casesById: new Map([[caseItem.id, caseItem]]),
};
const policyRegistry = new Map([[caseItem.id, {
  descriptor: POLICY, verify: () => ({ status: 'verified', failures: [] }),
}]]);
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const executionFacts = {
  modelId: 'gpt-5', cliVersion: '0.144.0-alpha.4', binarySha256: '1'.repeat(64), stdoutSha256: '2'.repeat(64),
  exitCode: 0, stdoutDrained: true, timedOut: false, binaryStable: true,
  execArgsSha256: '3'.repeat(64), adapterBundleSha256: '4'.repeat(64),
};
const buildSignedReceipt = (facts = executionFacts) => {
  const signed = structuredClone(receipt); signed.schemaVersion = 3;
  signed.proof = createEvolutionTraceProof({ receipt: signed, executionFacts: facts, signer: { keyid: 'ci-signer', privateKey } });
  return signed;
};
test('trace outcome 默认只进入 bound/unverified，不把自报 complete 当可信证据', () => {
  const result = verifyEvolutionTraceOutcomes(input);
  assert.deepEqual(result.failures, []);
  assert.deepEqual([...result.traceBoundOutcomeIds], [outcome.id]);
  assert.deepEqual([...result.verifiedOutcomeIds], []);
  assert.deepEqual([...result.unverifiedOutcomeIds], [outcome.id]);
});
test('receipt v2 即使 policy 通过且存在信任根也始终 unverified', () => {
  const result = verifyEvolutionTraceOutcomes({
    ...input, policiesByCaseId: policyRegistry, trustedSigners: new Map([['ci-signer', publicKey]]),
  });
  assert.deepEqual(result.failures, []);
  assert.deepEqual([...result.verifiedOutcomeIds], []);
  assert.equal(result.verificationByOutcomeId.get(outcome.id).proofVerification.status, 'unverified');
});
test('receipt v3 只有外部受信 Ed25519 proof 可评分，unknown 与篡改 fail closed', () => {
  const signed = buildSignedReceipt();
  const signedInput = { ...input, receiptsById: new Map([['trace-receipt', { receipt: signed }]]), policiesByCaseId: policyRegistry };
  const unknown = verifyEvolutionTraceOutcomes(signedInput);
  assert.deepEqual(unknown.failures, []);
  assert.equal(unknown.verificationByOutcomeId.get(outcome.id).proofVerification.status, 'unverified');
  const trusted = verifyEvolutionTraceOutcomes({ ...signedInput, trustedSigners: new Map([['ci-signer', publicKey]]) });
  assert.deepEqual([...trusted.verifiedOutcomeIds], [outcome.id]);
  const tampered = structuredClone(signed); tampered.validations[0].command = 'node --test tampered.test.mjs';
  const rejected = verifyEvolutionTraceOutcomes({ ...signedInput, receiptsById: new Map([['trace-receipt', { receipt: tampered }]]), trustedSigners: new Map([['ci-signer', publicKey]]) });
  assert.match(rejected.failures.join('\n'), /proof.*绑定不匹配/);
  assert.deepEqual([...rejected.verifiedOutcomeIds], []);
  const incomplete = buildSignedReceipt({ ...executionFacts, stdoutDrained: false });
  const incompleteResult = verifyEvolutionTraceOutcomes({
    ...signedInput, receiptsById: new Map([['trace-receipt', { receipt: incomplete }]]),
    trustedSigners: new Map([['ci-signer', publicKey]]),
  });
  assert.equal(incompleteResult.verificationByOutcomeId.get(outcome.id).executionFactsEligible, false);
  assert.deepEqual([...incompleteResult.verifiedOutcomeIds], []);
});
test('trace outcome 的固定 policy 断言失败会 fail closed', () => {
  const result = verifyEvolutionTraceOutcomes({
    ...input,
    policiesByCaseId: new Map([[caseItem.id, {
      descriptor: POLICY,
      verify: () => ({ status: 'rejected', failures: ['检测到 command.call'] }),
    }]]),
  });
  assert.match(result.failures.join('\n'), /检测到 command\.call/);
  assert.deepEqual([...result.verifiedOutcomeIds], []);
});
test('trace outcome 的 case digest 漂移会 fail closed', () => {
  const tampered = structuredClone(receipt);
  tampered.trace.caseSha256 = '0'.repeat(64);
  const result = verifyEvolutionTraceOutcomes({
    ...input,
    receiptsById: new Map([['trace-receipt', { receipt: tampered }]]),
  });
  assert.match(result.failures.join('\n'), /case digest/);
  assert.deepEqual([...result.verifiedOutcomeIds], []);
});
test('deterministic trace receipt 不会误入 fixed runner replay', () => {
  const result = replayEvolutionDeterministicOutcomes({
    rootDir: '/unused',
    outcomes: [{
      ...outcome,
      provenance: { method: 'deterministic' },
    }],
    receiptsById: input.receiptsById,
    runCases: () => assert.fail('trace receipt 不应调用 fixed runner'),
    resolveRevision: () => assert.fail('trace receipt 不应进入 fixed revision replay'),
  });
  assert.deepEqual(result.failures, []);
  assert.deepEqual([...result.verifiedOutcomeIds], []);
});
