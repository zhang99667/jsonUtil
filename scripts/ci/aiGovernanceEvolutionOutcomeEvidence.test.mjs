import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { collectEvolutionEvidenceEligibilityFailures } from './aiGovernanceEvolutionOutcomeEvidence.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultCorpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));
const CASE_ID = 'mcp-newline-version-negotiation';
const EVALUATED_AT = '2026-07-10';
const MAX_DATE = '2026-07-13';
const RUNNER_TEST_FILE = 'scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs';
const CANONICAL_COMMAND = `node --test ${RUNNER_TEST_FILE}`;
const REVISION_A = 'a'.repeat(40);
const REVISION_B = 'b'.repeat(40);

const receiptHash = receipt => createHash('sha256')
  .update(JSON.stringify(receipt), 'utf8')
  .digest('hex');

const createValidation = (evidence = '固定 runner 验证通过') => ({
  command: CANONICAL_COMMAND,
  status: 'passed',
  evidence,
  checkedAt: EVALUATED_AT,
});

const createReceipt = (options = {}) => {
  const corpus = options.corpus ?? defaultCorpus;
  const caseItem = corpus.cases.find(item => item.id === CASE_ID);
  const method = options.method ?? 'deterministic';
  return {
    schemaVersion: 1,
    id: options.id ?? 'receipt-valid-v2',
    artifactType: 'ai-evolution-trial-receipt',
    dataClass: 'redacted',
    caseId: CASE_ID,
    corpusVersion: options.corpusVersion ?? corpus.corpusVersion,
    caseVersion: options.caseVersion ?? caseItem.caseVersion,
    subjectVersion: options.subjectVersion ?? caseItem.subject.version,
    evaluatedAt: EVALUATED_AT,
    method,
    source: options.source ?? (method === 'deterministic' ? 'local' : 'manual'),
    runner: options.runner ?? (method === 'deterministic' ? 'ai-evolution-case-runner' : `${method}-grader`),
    revision: options.revision ?? REVISION_A,
    aggregation: 'all-pass',
    trialResults: [{
      trial: 1,
      verdict: 'pass',
      score: 100,
      gradeTarget: 'outcome',
      evidence: '脱敏 trial 证据满足预期',
    }],
    validations: options.validations ?? [createValidation()],
  };
};

const createOutcome = (receipt, options = {}) => ({
  schemaVersion: 2,
  id: options.id ?? `${receipt.id}-outcome`,
  caseId: receipt.caseId,
  corpusVersion: options.corpusVersion ?? receipt.corpusVersion,
  caseVersion: options.caseVersion ?? receipt.caseVersion,
  subjectVersion: options.subjectVersion ?? receipt.subjectVersion,
  evaluatedAt: receipt.evaluatedAt,
  verdict: 'pass',
  score: 100,
  provenance: {
    method: receipt.method,
    source: receipt.source,
    runner: receipt.runner,
    revision: options.revision ?? receipt.revision,
    trials: receipt.trialResults.length,
  },
  evidence: {
    receiptId: receipt.id,
    sha256: options.sha256 ?? receiptHash(receipt),
  },
  writeback: {
    files: options.files ?? [RUNNER_TEST_FILE],
    validationResults: options.validationResults ?? structuredClone(receipt.validations),
  },
});

const createLegacyOutcome = (corpus = defaultCorpus) => {
  const caseItem = corpus.cases.find(item => item.id === CASE_ID);
  return {
    schemaVersion: 1,
    id: 'legacy-forged-pass',
    caseId: CASE_ID,
    corpusVersion: corpus.corpusVersion,
    caseVersion: caseItem.caseVersion,
    subjectVersion: caseItem.subject.version,
    evaluatedAt: EVALUATED_AT,
    verdict: 'pass',
    score: 100,
    provenance: {
      method: 'deterministic',
      source: 'local',
      runner: 'legacy-unverified-runner',
      revision: 'legacy-fixture',
      trials: 1,
    },
    writeback: {
      files: [RUNNER_TEST_FILE],
      validationResults: [createValidation('旧格式自报通过')],
    },
  };
};

const writeJsonLines = values => (values.length > 0 ? `${values.map(JSON.stringify).join('\n')}\n` : '');

const withTempEvalRoot = ({
  corpus = defaultCorpus,
  outcomes = [],
  receipts = [],
  runnerStatus = 'passed',
}, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-evidence-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    const runnerTestPath = path.join(rootDir, RUNNER_TEST_FILE);
    fs.mkdirSync(evalDir, { recursive: true });
    fs.mkdirSync(path.dirname(runnerTestPath), { recursive: true });
    const testBody = runnerStatus === 'passed'
      ? "test('fixture runner passes', () => {});"
      : "test('fixture runner rejects forged pass', () => { throw new Error('expected replay failure'); });";
    fs.writeFileSync(runnerTestPath, `import { test } from 'node:test';\n${testBody}\n`);
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), writeJsonLines(outcomes));
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), writeJsonLines(receipts));
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const buildReport = (rootDir, options = {}) => buildAiGovernanceEvolutionEvalReport({
  rootDir,
  maxDate: MAX_DATE,
  ...options,
});

test('合法 v2 receipt 只有通过 replay 验证后才计入覆盖', () => {
  const receipt = createReceipt();
  const outcome = createOutcome(receipt);
  let replayCalls = 0;
  const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, rootDir => (
    buildAiGovernanceEvolutionEvalReport({
      rootDir,
      maxDate: MAX_DATE,
      replayDeterministic: (input) => {
        replayCalls += 1;
        assert.equal(input.rootDir, rootDir);
        assert.deepEqual(input.outcomes.map(item => item.id), [outcome.id]);
        assert.equal(input.receiptsById.has(receipt.id), true);
        return { verifiedOutcomeIds: new Set([outcome.id]), failures: [] };
      },
    })
  ));

  assert.equal(replayCalls, 1);
  assert.equal(report.ok, true);
  assert.deepEqual(
    Object.fromEntries(['outcomes', 'activeLatestOutcomes', 'pass', 'coveredCases'].map(key => [key, report.counts[key]])),
    { outcomes: 1, activeLatestOutcomes: 1, pass: 1, coveredCases: 1 }
  );
});

test('model、human 与 hybrid pass 使用 v1 receipt 时仍被拒绝', () => {
  for (const method of ['model', 'human', 'hybrid']) {
    const receipt = createReceipt({ id: `receipt-${method}`, method });
    const outcome = createOutcome(receipt);
    const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);
    assert.equal(report.ok, false, method);
    assert.equal(report.counts.coveredCases, 0, method);
    assert.match(report.failures.join('\n'), /model\/human\/hybrid pass 在真实 trace verifier 建成前不可评分/);
  }
});

test('schema v3 只有绑定 v2/v3 trace receipt 才能越过旧非确定性 hard fail', () => {
  for (const method of ['model', 'human', 'hybrid']) {
    const receipt = createReceipt({ id: `receipt-v3-${method}`, method });
    const outcome = { schemaVersion: 3, caseId: CASE_ID, verdict: 'pass', provenance: { method }, evidence: { receiptId: receipt.id } };
    const failures = collectEvolutionEvidenceEligibilityFailures(outcome, 'v3 fixture', new Map([[receipt.id, { receipt }]]));
    assert.match(failures.join('\n'), /真实 trace verifier 建成前不可评分/, method);
  }
  for (const schemaVersion of [2, 3]) {
    const traceReceipt = { id: `receipt-v${schemaVersion}-trace`, schemaVersion };
    const traceFailures = collectEvolutionEvidenceEligibilityFailures({
      schemaVersion: 3, caseId: CASE_ID, verdict: 'pass', provenance: { method: 'human' }, evidence: { receiptId: traceReceipt.id },
    }, `v${schemaVersion} trace fixture`, new Map([[traceReceipt.id, { receipt: traceReceipt }]]));
    assert.deepEqual(traceFailures, []);
  }
  const fixedReceipt = createReceipt({ id: 'receipt-non-executable' });
  const nonExecutable = collectEvolutionEvidenceEligibilityFailures({
    schemaVersion: 3, caseId: 'rule-read-before-write', verdict: 'pass', provenance: { method: 'deterministic' }, evidence: { receiptId: fixedReceipt.id },
  }, 'v3 fixture', new Map([[fixedReceipt.id, { receipt: fixedReceipt }]]));
  assert.match(nonExecutable.join('\n'), /deterministic pass 只能用于 deterministic-case/);
});

test('schema v1 自报 pass 只进入 legacy history，不计 active coverage', () => {
  const report = withTempEvalRoot({ outcomes: [createLegacyOutcome()] }, buildReport);

  assert.equal(report.ok, true);
  assert.deepEqual(
    Object.fromEntries(['totalOutcomes', 'validOutcomes', 'legacyOutcomes', 'outcomes', 'coveredCases'].map(key => [key, report.counts[key]])),
    { totalOutcomes: 1, validOutcomes: 1, legacyOutcomes: 1, outcomes: 0, coveredCases: 0 }
  );
});

test('可评分 outcome 必须提供并引用真实 receipt', () => {
  const receipt = createReceipt();
  const missingEvidence = createOutcome(receipt, { id: 'missing-evidence-outcome' });
  delete missingEvidence.evidence;
  const noEvidenceReport = withTempEvalRoot({ outcomes: [missingEvidence] }, buildReport);
  assert.match(noEvidenceReport.failures.join('\n'), /evidence 必须引用可评分 outcome receipt/);

  const missingReceipt = createOutcome(receipt, { id: 'missing-receipt-outcome' });
  const missingReceiptReport = withTempEvalRoot({ outcomes: [missingReceipt] }, buildReport);
  assert.match(missingReceiptReport.failures.join('\n'), /receiptId 未指向有效 receipt/);
  assert.equal(missingReceiptReport.counts.coveredCases, 0);
});

test('v2 outcome 的 receipt hash 必须绑定精确 JSON 行', () => {
  const receipt = createReceipt();
  const outcome = createOutcome(receipt, { sha256: '0'.repeat(64) });
  const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);

  assert.equal(report.ok, false);
  assert.match(report.failures.join('\n'), /evidence\.sha256 与 receipt 精确 JSON 行不一致/);
  assert.equal(report.counts.coveredCases, 0);
});

test('v2 receipt 必须与 outcome 的版本和 revision lineage 完全一致', () => {
  const fixtures = [
    ['corpusVersion', createReceipt({ id: 'receipt-lineage-corpus', corpusVersion: '1.0.0' }), { corpusVersion: defaultCorpus.corpusVersion }],
    ['caseVersion', createReceipt({ id: 'receipt-lineage-case', caseVersion: 2 }), { caseVersion: 1 }],
    ['subjectVersion', createReceipt({ id: 'receipt-lineage-subject', subjectVersion: '0.2.1' }), { subjectVersion: '0.2.0' }],
    ['revision', createReceipt({ id: 'receipt-lineage-revision', revision: REVISION_B }), { revision: REVISION_A }],
  ];

  for (const [field, receipt, outcomeOptions] of fixtures) {
    const outcome = createOutcome(receipt, outcomeOptions);
    const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);
    assert.equal(report.ok, false, field);
    assert.match(report.failures.join('\n'), new RegExp(`receipt\\.${field} 不一致`));
    assert.equal(report.counts.coveredCases, 0, field);
  }
});

test('v2 outcome validationResults 必须与 receipt 完全一致', () => {
  const receipt = createReceipt();
  const validationResults = structuredClone(receipt.validations);
  validationResults[0].evidence = 'outcome 单方面改写的证据';
  const outcome = createOutcome(receipt, { validationResults });
  const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);

  assert.equal(report.ok, false);
  assert.match(report.failures.join('\n'), /writeback\.validationResults 必须与 receipt 完全一致/);
  assert.equal(report.counts.coveredCases, 0);
});

test('v2 outcome 不能预埋高于当前 corpus 的结果', () => {
  const receipt = createReceipt({ corpusVersion: '9.0.0' });
  const outcome = createOutcome(receipt);
  const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);

  assert.equal(report.ok, false);
  assert.match(report.failures.join('\n'), /corpusVersion 不能高于当前 corpus/);
  assert.equal(report.counts.coveredCases, 0);
});

test('v2 writeback 拒绝仓库外与上跳路径', () => {
  for (const file of ['../outside.md', '/tmp/outside.md']) {
    const receipt = createReceipt({ id: `receipt-dangerous-${file.startsWith('/') ? 'absolute' : 'parent'}` });
    const outcome = createOutcome(receipt, { files: [file] });
    const report = withTempEvalRoot({ outcomes: [outcome], receipts: [receipt] }, buildReport);
    assert.equal(report.ok, false, file);
    assert.match(report.failures.join('\n'), /仓库内真实存在的安全相对文件路径/);
    assert.equal(report.counts.coveredCases, 0, file);
  }
});

test('v2 writeback 拒绝最终与中间目录 symlink 逃逸', () => {
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-outside-'));
  try {
    fs.writeFileSync(path.join(outsideDir, 'outside.md'), 'outside');
    const report = withTempEvalRoot({}, (rootDir) => {
      fs.symlinkSync(path.join(outsideDir, 'outside.md'), path.join(rootDir, 'outside-link.md'));
      fs.symlinkSync(outsideDir, path.join(rootDir, 'outside-dir'));
      const receipts = ['final', 'directory'].map(kind => createReceipt({ id: `receipt-symlink-${kind}` }));
      const outcomes = [
        createOutcome(receipts[0], { files: ['outside-link.md'] }),
        createOutcome(receipts[1], { files: ['outside-dir/outside.md'] }),
      ];
      fs.writeFileSync(path.join(rootDir, 'evals/ai-governance/outcomes.jsonl'), writeJsonLines(outcomes));
      fs.writeFileSync(path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'), writeJsonLines(receipts));
      return buildReport(rootDir);
    });
    assert.equal(report.counts.coveredCases, 0);
    assert.match(report.failures.join('\n'), /仓库内真实存在的安全相对文件路径/);
  } finally {
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test('生产默认 replay 会执行固定 runner，伪造 deterministic pass 不计覆盖', () => {
  const receipt = createReceipt({ id: 'receipt-forged-replay' });
  const outcome = createOutcome(receipt);
  const report = withTempEvalRoot({
    outcomes: [outcome],
    receipts: [receipt],
    runnerStatus: 'failed',
  }, (rootDir) => {
    assert.match(fs.readFileSync(path.join(rootDir, RUNNER_TEST_FILE), 'utf8'), /expected replay failure/);
    const nodeTestContext = process.env.NODE_TEST_CONTEXT;
    // Node 自测进程会阻止递归 --test；临时清除后才能验证生产 replay 的真实子进程。
    delete process.env.NODE_TEST_CONTEXT;
    try {
      return buildReport(rootDir, { resolveRevision: () => receipt.revision });
    } finally {
      if (nodeTestContext === undefined) delete process.env.NODE_TEST_CONTEXT;
      else process.env.NODE_TEST_CONTEXT = nodeTestContext;
    }
  });

  assert.equal(report.ok, false);
  assert.equal(report.counts.validOutcomes, 1);
  assert.equal(report.counts.validTrialReceipts, 1);
  assert.equal(report.counts.outcomes, 0);
  assert.equal(report.counts.coveredCases, 0);
  assert.match(report.failures.join('\n'), /未通过固定 runner 即时重放或 receipt 精确比对/);
});
