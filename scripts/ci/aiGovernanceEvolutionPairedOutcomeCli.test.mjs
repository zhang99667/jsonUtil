import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildEvolutionPairedBatchFixture } from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';
import {
  parsePairedOutcomeWriterArgs,
  runPairedOutcomeWriterCli,
} from './record-ai-evolution-paired-outcome.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const capture = () => {
  let value = '';
  return { stream: { write: chunk => { value += chunk; } }, value: () => value };
};

test('paired CLI 参数闭合且 --help 必须单独使用', () => {
  assert.deepEqual(parsePairedOutcomeWriterArgs([]), { write: false, json: false, help: false });
  assert.deepEqual(parsePairedOutcomeWriterArgs(['--write', '--json']), {
    write: true, json: true, help: false,
  });
  assert.throws(() => parsePairedOutcomeWriterArgs(['--trust-key', 'key.pem']), /未知参数/);
  assert.throws(() => parsePairedOutcomeWriterArgs(['--write', '--write']), /不能重复/);
  assert.throws(() => parsePairedOutcomeWriterArgs(['--help', '--json']), /不能与其它参数组合/);
});

test('paired CLI help 不读 stdin 或 ledger', () => {
  const stdout = capture();
  let read = false;
  const code = runPairedOutcomeWriterCli({
    args: ['--help'], stdout: stdout.stream, stderr: capture().stream,
    readInput: () => { read = true; return ''; },
    record: () => { throw new Error('不应调用'); },
  });
  assert.equal(code, 0);
  assert.equal(read, false);
  assert.match(stdout.value(), /项目 CLI 不接受 trust key/);
});

test('paired CLI 默认 preview，且不会向 writer 注入 caller trust policy', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const stdout = capture();
  let received;
  const code = runPairedOutcomeWriterCli({
    args: ['--json'],
    rootDir,
    stdout: stdout.stream,
    stderr: capture().stream,
    env: {},
    readInput: () => JSON.stringify(fixture.batch),
    record: input => {
      received = input;
      return {
        ok: true, mode: 'preview', status: 'proof-unverified',
        experimentId: fixture.batch.experimentRef.id, proofStatus: 'unverified',
        infrastructureEligible: true, confirmedCoverageEligible: false,
        ledgerMutationPerformed: false,
      };
    },
  });
  assert.equal(code, 0);
  assert.equal(received.write, false);
  assert.equal('pairedTrustPolicy' in received, false);
  assert.equal(received.batch.proof.checkpointEnvelope, fixture.batch.proof.checkpointEnvelope);
  assert.match(stdout.value(), /"status": "proof-unverified"/);
});

test('paired CLI 参数错误返回 2，输入或 writer 错误返回 1', () => {
  const argumentError = capture();
  assert.equal(runPairedOutcomeWriterCli({
    args: ['--unknown'], stdout: capture().stream, stderr: argumentError.stream,
  }), 2);
  assert.match(argumentError.value(), /PAIRED_OUTCOME_WRITER_ARGUMENTS_INVALID/);

  const runtimeError = capture();
  assert.equal(runPairedOutcomeWriterCli({
    args: [], stdout: capture().stream, stderr: runtimeError.stream,
    readInput: () => '{}', record: () => ({ ok: true }),
  }), 1);
  assert.match(runtimeError.value(), /paired outcome preview failed/);
});

test('paired CLI 真实进程在 CI 中拒绝 --write', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const result = spawnSync(process.execPath, [
    path.join(rootDir, 'scripts/ci/record-ai-evolution-paired-outcome.mjs'), '--write', '--json',
  ], {
    cwd: rootDir,
    env: { ...process.env, CI: '1' },
    input: JSON.stringify(fixture.batch),
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /CI\/GitHub Actions 中禁止 paired outcome --write/);
});
