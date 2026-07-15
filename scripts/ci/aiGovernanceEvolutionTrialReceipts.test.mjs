import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { getAiGovernanceEvolutionCaseCommands } from './aiGovernanceEvolutionCaseRunner.mjs';
import {
  hashEvolutionTrialReceiptLine,
  readEvolutionTrialReceiptLedger,
} from './aiGovernanceEvolutionTrialReceipts.mjs';
import { createEvolutionTraceProof } from './aiGovernanceEvolutionTraceProof.mjs';

const FIXED_DATE = '2026-07-10';
const FIXED_CASES = {
  'mcp-readonly-shell-rejection': { caseVersion: 1, subjectVersion: '0.3.0' },
  'mcp-fixed-tool-selection': { caseVersion: 1, subjectVersion: '0.3.0' },
  'rule-project-ai-asset-ownership': { caseVersion: 5, subjectVersion: '2026-07-13.1' },
  'validation-change-matrix': { caseVersion: 1, subjectVersion: '2026-07-10' },
};

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-trial-receipts-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    const ciDir = path.join(rootDir, 'scripts/ci');
    fs.mkdirSync(evalDir, { recursive: true });
    fs.mkdirSync(ciDir, { recursive: true });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify({
      schemaVersion: 1,
      corpusVersion: '1.1.0',
      cases: Object.entries(FIXED_CASES).map(([id, item]) => ({
        id,
        caseVersion: item.caseVersion,
        subject: { version: item.subjectVersion },
      })),
    })}\n`);
    for (const file of ['alpha.test.mjs', 'zeta.test.mjs']) {
      fs.writeFileSync(path.join(ciDir, file), '');
    }
    return run(rootDir, path.join(evalDir, 'trial-receipts.jsonl'));
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const buildReceipt = (rootDir, overrides = {}) => {
  const caseId = overrides.caseId ?? 'mcp-readonly-shell-rejection';
  const fixedCase = FIXED_CASES[caseId];
  return {
    schemaVersion: 1,
    id: 'receipt-deterministic-one',
    artifactType: 'ai-evolution-trial-receipt',
    dataClass: 'redacted',
    caseId,
    corpusVersion: '1.1.0',
    caseVersion: fixedCase.caseVersion,
    subjectVersion: fixedCase.subjectVersion,
    evaluatedAt: FIXED_DATE,
    method: 'deterministic',
    source: 'local',
    runner: 'ai-evolution-case-runner',
    revision: 'a'.repeat(40),
    aggregation: 'all-pass',
    trialResults: [{
      trial: 1,
      verdict: 'pass',
      score: 100,
      gradeTarget: 'outcome',
      evidence: '固定 case runner 返回通过',
    }],
    validations: getAiGovernanceEvolutionCaseCommands({ rootDir, caseId }).map(command => ({
      command,
      status: 'passed',
      evidence: '子进程退出码为 0',
      checkedAt: FIXED_DATE,
    })),
    ...overrides,
  };
};
const buildTrace = receipt => ({
  schemaVersion: 1, adapter: { id: 'test-adapter', version: '1.0.0' },
  capture: { status: 'complete', sampling: 'all', droppedEvents: 0, droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded' },
  caseSha256: 'b'.repeat(64), policy: { id: 'observable-trace-v1', version: '1.0.0', sha256: 'c'.repeat(64) },
  beforeRevision: 'd'.repeat(40), afterRevision: receipt.revision,
  events: [
    { sequence: 1, type: 'session.start', actorId: 'root' },
    ...receipt.validations.flatMap((validation, index) => [
      { sequence: index * 2 + 2, type: 'validation.start', actorId: 'root', validationIndex: index + 1, status: 'started' },
      { sequence: index * 2 + 3, type: 'validation.finish', actorId: 'root', validationIndex: index + 1, status: validation.status },
    ]),
    { sequence: receipt.validations.length * 2 + 2, type: 'response.finish', actorId: 'root', sha256: 'e'.repeat(64), status: 'passed' },
    { sequence: receipt.validations.length * 2 + 3, type: 'session.finish', actorId: 'root', status: 'passed' },
  ],
});
const TRACE_EXECUTION_FACTS = Object.freeze({
  modelId: 'gpt-5.4', cliVersion: '0.144.0-alpha.4', binarySha256: '1'.repeat(64),
  stdoutSha256: '2'.repeat(64), exitCode: 0, stdoutDrained: true, timedOut: false,
  binaryStable: true, execArgsSha256: '3'.repeat(64), adapterBundleSha256: '4'.repeat(64),
});
const buildV3Receipt = (rootDir, id = 'receipt-v3-proof') => {
  const receipt = buildReceipt(rootDir, {
    id, schemaVersion: 3, method: 'human', runner: 'codex-fixed-mcp-trial',
  });
  receipt.trialResults[0].gradeTarget = 'trace';
  receipt.trace = buildTrace(receipt);
  const { privateKey } = generateKeyPairSync('ed25519');
  receipt.proof = createEvolutionTraceProof({
    receipt,
    executionFacts: TRACE_EXECUTION_FACTS,
    signer: { keyid: 'unknown-ci-proof-key', privateKey },
  });
  return receipt;
};
const readLines = (rootDir, filePath, lines) => {
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
  return readEvolutionTrialReceiptLedger(filePath, { rootDir, maxDate: FIXED_DATE });
};

test('trial receipt ledger 接受精确紧凑 deterministic receipt', () => {
  withTempRoot((rootDir, filePath) => {
    const receipt = buildReceipt(rootDir);
    const line = JSON.stringify(receipt);
    const result = readLines(rootDir, filePath, [line]);

    assert.deepEqual(result.failures, []);
    assert.equal(result.validReceipts.length, 1);
    assert.equal(result.receiptsById.get(receipt.id).sha256, hashEvolutionTrialReceiptLine(line));
  });
});

test('trial receipt hash 对精确行内容保持稳定', () => {
  const line = '{"id":"receipt-one"}';
  assert.equal(hashEvolutionTrialReceiptLine(line), '8397d43840be376ab44fdaabe5f3aa71bcf722ac53b5f4d555dd045aec77ee0e');
  assert.notEqual(hashEvolutionTrialReceiptLine(line), hashEvolutionTrialReceiptLine(`${line}\n`));
});

test('trial receipt ledger 拒绝非紧凑 JSON 与重复 id', () => {
  withTempRoot((rootDir, filePath) => {
    const receipt = buildReceipt(rootDir);
    const nonCompact = JSON.stringify(receipt).replace('{"schemaVersion"', '{ "schemaVersion"');
    let result = readLines(rootDir, filePath, [nonCompact]);
    assert.match(result.failures.join('\n'), /精确紧凑 JSON/);

    const compactLine = JSON.stringify(receipt);
    result = readLines(rootDir, filePath, [compactLine, compactLine]);
    assert.match(result.failures.join('\n'), /receipt id 必须唯一/);
    assert.equal(result.invalidReceiptCount, 2);
  });
});

test('trial receipt ledger 拒绝敏感字段名与凭据形态的值', () => {
  withTempRoot((rootDir, filePath) => {
    const sensitiveField = buildReceipt(rootDir, { id: 'receipt-sensitive-field', rawPrompt: 'redacted' });
    const sensitiveValue = buildReceipt(rootDir, {
      id: 'receipt-sensitive-value',
      trialResults: [{
        trial: 1,
        verdict: 'pass',
        score: 100,
        gradeTarget: 'both',
        evidence: 'Bearer abcdefghijklmnop',
      }],
    });
    const result = readLines(rootDir, filePath, [JSON.stringify(sensitiveField), JSON.stringify(sensitiveValue)]);

    assert.match(result.failures.join('\n'), /禁止敏感字段名/);
    assert.match(result.failures.join('\n'), /禁止疑似凭据值/);
  });
});

test('trial receipt ledger 要求 trial 连续且 pass 的 validation 全部通过', () => {
  withTempRoot((rootDir, filePath) => {
    const discontinuous = buildReceipt(rootDir, {
      id: 'receipt-discontinuous-trials',
      trialResults: [
        { trial: 1, verdict: 'pass', score: 100, gradeTarget: 'both', evidence: 'trial one passed' },
        { trial: 3, verdict: 'pass', score: 100, gradeTarget: 'both', evidence: 'trial three passed' },
      ],
    });
    const failedValidation = buildReceipt(rootDir, { id: 'receipt-failed-validation' });
    failedValidation.validations[0].status = 'failed';
    const result = readLines(rootDir, filePath, [JSON.stringify(discontinuous), JSON.stringify(failedValidation)]);

    assert.match(result.failures.join('\n'), /trial 必须从 1 连续递增/);
    assert.match(result.failures.join('\n'), /聚合 verdict 为 pass 时所有 validations 必须 passed/);
  });
});

test('deterministic receipt 拒绝伪 runner 与 component-only case', () => {
  withTempRoot((rootDir, filePath) => {
    const fakeRunner = buildReceipt(rootDir, {
      id: 'receipt-fake-runner',
      runner: 'fake-deterministic-runner',
    });
    const componentOnly = buildReceipt(rootDir, {
      id: 'receipt-component-only',
      caseId: 'mcp-fixed-tool-selection',
    });
    const multiTrial = buildReceipt(rootDir, { id: 'receipt-multi-trial' });
    multiTrial.trialResults.push({ trial: 2, verdict: 'pass', score: 100, gradeTarget: 'outcome', evidence: '复制 trial' });
    const traceTarget = buildReceipt(rootDir, { id: 'receipt-trace-target' });
    traceTarget.trialResults[0].gradeTarget = 'trace';
    const result = readLines(rootDir, filePath, [fakeRunner, componentOnly, multiTrial, traceTarget].map(JSON.stringify));

    assert.match(result.failures.join('\n'), /runner 必须为 ai-evolution-case-runner/);
    assert.match(result.failures.join('\n'), /deterministic receipt 只能引用 deterministic-case/);
    assert.match(result.failures.join('\n'), /deterministic receipt 必须精确记录 1 次 trial/);
    assert.match(result.failures.join('\n'), /gradeTarget 只能为 outcome/);
  });
});

test('deterministic receipt 按固定 runner 的精确命令顺序校验', () => {
  withTempRoot((rootDir, filePath) => {
    const expected = buildReceipt(rootDir, {
      id: 'receipt-exact-order',
      caseId: 'rule-project-ai-asset-ownership',
    });
    let result = readLines(rootDir, filePath, [JSON.stringify(expected)]);
    assert.doesNotMatch(result.failures.join('\n'), /精确命令顺序/);

    const reversed = { ...expected, id: 'receipt-reversed-order', validations: [...expected.validations].reverse() };
    result = readLines(rootDir, filePath, [JSON.stringify(reversed)]);
    assert.match(result.failures.join('\n'), /精确命令顺序/);
  });
});
test('deterministic receipt 不用当前 runner 追溯改写历史 case 版本', () => {
  withTempRoot((rootDir, filePath) => {
    const historical = buildReceipt(rootDir, {
      id: 'receipt-historical-runner', caseId: 'rule-project-ai-asset-ownership', caseVersion: 3,
      validations: [{ command: 'node --test scripts/ci/legacy.test.mjs', status: 'passed', evidence: '历史固定 runner 已通过', checkedAt: FIXED_DATE }],
    });
    const result = readLines(rootDir, filePath, [JSON.stringify(historical)]);
    assert.doesNotMatch(result.failures.join('\n'), /精确命令顺序/);
  });
});
test('trial receipt ledger 保持 v1 兼容并锁定 v2 trace 契约', () => {
  withTempRoot((rootDir, filePath) => {
    const v2 = buildReceipt(rootDir, { id: 'receipt-v2-trace', schemaVersion: 2, method: 'human', runner: 'observable-trace-grader' });
    v2.trialResults[0].gradeTarget = 'trace'; v2.trace = buildTrace(v2);
    let result = readLines(rootDir, filePath, [JSON.stringify(v2)]);
    assert.deepEqual(result.failures, []);
    assert.equal(result.validReceipts.length, 1); assert.equal(result.receiptsById.get(v2.id).traceVerification.completeness.status, 'complete');
    assert.equal(result.receiptsById.get(v2.id).traceVerification.scoringEligible, false);
    const missing = buildReceipt(rootDir, { id: 'receipt-v2-missing', schemaVersion: 2, method: 'human' });
    const outcome = buildReceipt(rootDir, { id: 'receipt-v2-outcome', schemaVersion: 2, method: 'human' });
    const multiple = buildReceipt(rootDir, { id: 'receipt-v2-multiple', schemaVersion: 2, method: 'human' });
    outcome.trace = buildTrace(outcome); multiple.trialResults = [
      { trial: 1, verdict: 'pass', score: 100, gradeTarget: 'trace', evidence: 'first' },
      { trial: 2, verdict: 'pass', score: 100, gradeTarget: 'trace', evidence: 'second' },
    ]; multiple.trace = buildTrace(multiple);
    result = readLines(rootDir, filePath, [missing, outcome, multiple].map(JSON.stringify));
    assert.match(result.failures.join('\n'), /v2.*trace/); assert.match(result.failures.join('\n'), /gradeTarget.*trace 或 both/);
    assert.match(result.failures.join('\n'), /精确记录 1 次 trial/);
  });
});

test('v3 receipt 允许未知 signer 保持 unverified，但 proof 必须与 receipt 精确绑定', () => {
  withTempRoot((rootDir, filePath) => {
    const receipt = buildV3Receipt(rootDir);
    let result = readLines(rootDir, filePath, [JSON.stringify(receipt)]);
    assert.deepEqual(result.failures, []);
    assert.equal(result.validReceipts.length, 1);
    assert.equal(result.receiptsById.get(receipt.id).proofVerification.status, 'unverified');

    receipt.trialResults[0].evidence = '签名后被改写的证据';
    result = readLines(rootDir, filePath, [JSON.stringify(receipt)]);
    assert.equal(result.validReceipts.length, 0);
    assert.match(result.failures.join('\n'), /Statement 与 receipt\/trace 绑定不匹配/);
  });
});

test('v3 receipt 拒绝缺失或开放字段的 proof', () => {
  withTempRoot((rootDir, filePath) => {
    const missing = buildReceipt(rootDir, {
      id: 'receipt-v3-missing-proof', schemaVersion: 3, method: 'human', runner: 'codex-fixed-mcp-trial',
    });
    missing.trialResults[0].gradeTarget = 'trace'; missing.trace = buildTrace(missing);
    const malformed = buildV3Receipt(rootDir, 'receipt-v3-malformed-proof');
    malformed.proof.envelope.signatures = [];
    const open = buildV3Receipt(rootDir, 'receipt-v3-open-proof');
    open.proof.extra = true;

    const result = readLines(rootDir, filePath, [missing, malformed, open].map(JSON.stringify));
    assert.equal(result.validReceipts.length, 0);
    assert.match(result.failures.join('\n'), /proof 必须是对象/);
    assert.match(result.failures.join('\n'), /精确包含一个签名/);
    assert.match(result.failures.join('\n'), /proof\.extra/);
  });
});
