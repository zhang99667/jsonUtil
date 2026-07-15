import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';

import {
  AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE,
  AI_EVOLUTION_TRACE_PROOF_PREDICATE_TYPE,
  AI_EVOLUTION_TRACE_PROOF_STATEMENT_TYPE,
  buildEvolutionTraceProofStatement,
  createDssePreAuthEncoding,
  createEvolutionTraceProof,
  verifyEvolutionTraceProof,
} from './aiGovernanceEvolutionTraceProof.mjs';

const hashJson = value => createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));

const buildReceipt = () => ({
  schemaVersion: 3,
  id: 'receipt-proof-one',
  artifactType: 'ai-evolution-trial-receipt',
  dataClass: 'redacted',
  caseId: 'mcp-fixed-tool-selection',
  corpusVersion: '1.6.0',
  caseVersion: 1,
  subjectVersion: '0.2.0',
  evaluatedAt: '2026-07-11',
  method: 'model',
  source: 'ci',
  runner: 'codex-fixed-mcp-trial',
  revision: `worktree-${'a'.repeat(64)}`,
  aggregation: 'all-pass',
  trialResults: [{ trial: 1, verdict: 'pass', score: 100, gradeTarget: 'trace', evidence: '脱敏证据' }],
  validations: [{ command: 'fixed-validation-id', status: 'passed', evidence: '已验证', checkedAt: '2026-07-11' }],
  trace: {
    schemaVersion: 1,
    adapter: { id: 'codex-exec-jsonl', version: '1.0.0' },
    capture: { status: 'complete', sampling: 'all', droppedEvents: 0, droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded' },
    caseSha256: 'b'.repeat(64),
    policy: { id: 'mcp-fixed-tool-selection', version: '1.0.0', sha256: 'c'.repeat(64) },
    beforeRevision: `worktree-${'d'.repeat(64)}`,
    afterRevision: `worktree-${'a'.repeat(64)}`,
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      { sequence: 2, type: 'response.finish', actorId: 'root', sha256: 'e'.repeat(64), status: 'passed' },
      { sequence: 3, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
});

const executionFacts = Object.freeze({
  modelId: 'gpt-5.4',
  cliVersion: '0.144.0-alpha.4',
  binarySha256: '1'.repeat(64),
  stdoutSha256: '2'.repeat(64),
  exitCode: 0,
  stdoutDrained: true,
  timedOut: false,
  binaryStable: true,
  execArgsSha256: '3'.repeat(64),
  adapterBundleSha256: '4'.repeat(64),
});

const proofFromStatement = ({ statement, keyid, privateKey, pretty = false }) => {
  const payloadBytes = Buffer.from(pretty ? JSON.stringify(statement, null, 2) : JSON.stringify(statement), 'utf8');
  const pae = createDssePreAuthEncoding(AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE, payloadBytes);
  return {
    schemaVersion: 1,
    envelope: {
      payloadType: AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE,
      payload: payloadBytes.toString('base64'),
      signatures: [{ keyid, sig: sign(null, pae, privateKey).toString('base64') }],
    },
  };
};

const signReceipt = ({ receipt = buildReceipt(), keyid = 'ci-proof-key', keyPair = generateKeyPairSync('ed25519') } = {}) => {
  receipt.proof = createEvolutionTraceProof({
    receipt,
    executionFacts,
    signer: { keyid, privateKey: keyPair.privateKey },
  });
  return { receipt, keyid, ...keyPair };
};

test('DSSE PAE 使用类型与 payload 字节长度', () => {
  assert.equal(
    createDssePreAuthEncoding('text/plain', 'abc').toString('utf8'),
    'DSSEv1 10 text/plain 3 abc',
  );
  assert.equal(
    createDssePreAuthEncoding('text/plain', '你好').toString('utf8'),
    'DSSEv1 10 text/plain 6 你好',
  );
});

test('Statement 精确绑定 receipt sans proof、trace、stdout、binary 与执行事实', () => {
  const receipt = buildReceipt();
  const statement = buildEvolutionTraceProofStatement({ receipt, executionFacts });

  assert.equal(statement._type, AI_EVOLUTION_TRACE_PROOF_STATEMENT_TYPE);
  assert.equal(statement.predicateType, AI_EVOLUTION_TRACE_PROOF_PREDICATE_TYPE);
  assert.deepEqual(statement.subject, [
    { name: 'ai-evolution-trial-receipt', digest: { sha256: hashJson(receipt) } },
    { name: 'observable-trace', digest: { sha256: hashJson(receipt.trace) } },
    { name: 'codex-exec-jsonl-stdout', digest: { sha256: executionFacts.stdoutSha256 } },
    { name: 'codex-cli-binary', digest: { sha256: executionFacts.binarySha256 } },
  ]);
  assert.deepEqual(statement.predicate, {
    receiptId: receipt.id,
    case: {
      id: receipt.caseId,
      corpusVersion: receipt.corpusVersion,
      caseVersion: receipt.caseVersion,
      subjectVersion: receipt.subjectVersion,
      sha256: receipt.trace.caseSha256,
    },
    adapter: receipt.trace.adapter,
    policy: receipt.trace.policy,
    revisions: {
      before: receipt.trace.beforeRevision,
      after: receipt.trace.afterRevision,
      receipt: receipt.revision,
    },
    model: executionFacts.modelId,
    cliVersion: executionFacts.cliVersion,
    exitCode: 0,
    stdoutDrained: true,
    timedOut: false,
    binaryStable: true,
    execArgsSha256: executionFacts.execArgsSha256,
    adapterBundleSha256: executionFacts.adapterBundleSha256,
  });
  assert.throws(
    () => buildEvolutionTraceProofStatement({ receipt, executionFacts: { ...executionFacts, extra: true } }),
    /executionFacts.extra/,
  );
});

test('Ed25519 DSSE 对外部 trustedSigners 验证，未知 signer 保持 unverified', () => {
  const { receipt, keyid, publicKey } = signReceipt();
  const verified = verifyEvolutionTraceProof(receipt, { trustedSigners: new Map([[keyid, publicKey]]) });
  assert.equal(verified.status, 'verified');
  assert.deepEqual(verified.failures, []);
  assert.equal(verified.signerKeyId, keyid);

  const unknown = verifyEvolutionTraceProof(receipt, { trustedSigners: new Map() });
  assert.equal(unknown.status, 'unverified');
  assert.deepEqual(unknown.failures, []);

  const missingTrust = verifyEvolutionTraceProof(receipt);
  assert.equal(missingTrust.status, 'rejected');
  assert.match(missingTrust.failures.join('\n'), /trustedSigners.*Map/);
});

test('keyid 只是查找 hint，错误公钥或损坏签名均 rejected', () => {
  const first = signReceipt();
  const secondPair = generateKeyPairSync('ed25519');
  const wrongHint = clone(first.receipt);
  wrongHint.proof.envelope.signatures[0].keyid = 'other-ci-key';
  let result = verifyEvolutionTraceProof(wrongHint, {
    trustedSigners: new Map([
      [first.keyid, first.publicKey],
      ['other-ci-key', secondPair.publicKey],
    ]),
  });
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /签名验证失败/);

  const damaged = clone(first.receipt);
  const signature = Buffer.from(damaged.proof.envelope.signatures[0].sig, 'base64');
  signature[0] ^= 1;
  damaged.proof.envelope.signatures[0].sig = signature.toString('base64');
  result = verifyEvolutionTraceProof(damaged, { trustedSigners: new Map([[first.keyid, first.publicKey]]) });
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /签名验证失败/);
});

test('即使受信 signer 重签，Statement 与 receipt/trace 绑定不符仍 rejected', () => {
  const signed = signReceipt();
  const statement = clone(verifyEvolutionTraceProof(signed.receipt, {
    trustedSigners: new Map([[signed.keyid, signed.publicKey]]),
  }).statement);
  statement.predicate.case.id = 'different-case';
  signed.receipt.proof = proofFromStatement({
    statement,
    keyid: signed.keyid,
    privateKey: signed.privateKey,
  });

  const result = verifyEvolutionTraceProof(signed.receipt, {
    trustedSigners: new Map([[signed.keyid, signed.publicKey]]),
  });
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /receipt\/trace 绑定不匹配/);
});

test('proof、envelope、Statement 和 predicate 都拒绝额外字段', () => {
  const signed = signReceipt();
  const trust = { trustedSigners: new Map([[signed.keyid, signed.publicKey]]) };
  const extraProof = clone(signed.receipt);
  extraProof.proof.extra = true;
  assert.match(verifyEvolutionTraceProof(extraProof, trust).failures.join('\n'), /proof.extra/);

  const extraEnvelope = clone(signed.receipt);
  extraEnvelope.proof.envelope.extra = true;
  assert.match(verifyEvolutionTraceProof(extraEnvelope, trust).failures.join('\n'), /proof.envelope.extra/);

  const statement = clone(verifyEvolutionTraceProof(signed.receipt, trust).statement);
  statement.predicate.extra = true;
  const extraPredicate = clone(signed.receipt);
  extraPredicate.proof = proofFromStatement({ statement, keyid: signed.keyid, privateKey: signed.privateKey });
  assert.match(verifyEvolutionTraceProof(extraPredicate, trust).failures.join('\n'), /statement.predicate.extra/);

  const nonObject = clone(signed.receipt);
  nonObject.proof = proofFromStatement({ statement: null, keyid: signed.keyid, privateKey: signed.privateKey });
  assert.match(verifyEvolutionTraceProof(nonObject, trust).failures.join('\n'), /statement 必须是对象/);
});

test('verifier 拒绝非 canonical base64、非紧凑 Statement 和多签名', () => {
  const signed = signReceipt();
  const trust = { trustedSigners: new Map([[signed.keyid, signed.publicKey]]) };
  const nonCanonical = clone(signed.receipt);
  nonCanonical.proof.envelope.signatures[0].sig = nonCanonical.proof.envelope.signatures[0].sig.replace(/=+$/, '');
  let result = verifyEvolutionTraceProof(nonCanonical, trust);
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /canonical base64/);

  const statement = clone(verifyEvolutionTraceProof(signed.receipt, trust).statement);
  const pretty = clone(signed.receipt);
  pretty.proof = proofFromStatement({ statement, keyid: signed.keyid, privateKey: signed.privateKey, pretty: true });
  result = verifyEvolutionTraceProof(pretty, trust);
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /精确紧凑 JSON/);

  const multiple = clone(signed.receipt);
  multiple.proof.envelope.signatures.push(clone(multiple.proof.envelope.signatures[0]));
  result = verifyEvolutionTraceProof(multiple, trust);
  assert.equal(result.status, 'rejected');
  assert.match(result.failures.join('\n'), /精确包含一个签名/);
});

test('builder 不生成密钥且只接受外部 Ed25519 私钥', () => {
  const receipt = buildReceipt();
  const { publicKey } = generateKeyPairSync('ed25519');
  assert.throws(
    () => createEvolutionTraceProof({ receipt, executionFacts, signer: { keyid: 'ci-proof-key', privateKey: publicKey } }),
    /Ed25519 私钥/,
  );
});
