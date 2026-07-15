import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildUnverifiedTraceObservation,
  UNVERIFIED_TRACE_CASE_ID,
  UNVERIFIED_TRACE_REVISION,
} from './aiGovernanceEvolutionUnverifiedTraceOutcomeWriterTestFixtures.mjs';
import { runUnverifiedTraceOutcomeWriterCli } from './record-ai-evolution-unverified-trace-outcome.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sink = () => {
  let value = '';
  return { stream: { write: chunk => { value += chunk; } }, read: () => value };
};

test('CLI help 不读 stdin，未知参数为 2，输入错误为 1', () => {
  const help = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--help'], stdout: help.stream, stderr: sink().stream,
    readInput: () => { throw new Error('help must not read stdin'); },
  }), 0);
  assert.match(help.read(), /^Usage:/);

  const usage = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--unknown'], stdout: sink().stream, stderr: usage.stream,
    readInput: () => { throw new Error('invalid args must not read stdin'); },
  }), 2);
  assert.match(usage.read(), /UNVERIFIED_TRACE_OUTCOME_WRITER_ARGUMENTS_INVALID/);

  const invalid = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: [], stdout: sink().stream, stderr: invalid.stream, readInput: () => '{}',
  }), 1);
  assert.match(invalid.read(), /failed/);

  const output = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--json'], stdout: output.stream, stderr: sink().stream,
    readInput: () => JSON.stringify(buildUnverifiedTraceObservation()),
    record: ({ observation }) => ({
      ok: observation.caseId === UNVERIFIED_TRACE_CASE_ID,
      mode: 'preview', status: 'ready', caseId: UNVERIFIED_TRACE_CASE_ID,
      evidenceStatus: 'trace-bound-unverified', revision: UNVERIFIED_TRACE_REVISION,
      candidate: { outcomeId: 'candidate' }, confirmedCoverageEligible: false,
    }),
  }), 0);
  assert.match(output.read(), /"evidenceStatus": "trace-bound-unverified"/);
});

test('CLI 从原始 stdin 字节拒绝非法 UTF-8', () => {
  const input = Buffer.concat([Buffer.from('{"x":"'), Buffer.from([0x80]), Buffer.from('"}')]);
  const result = spawnSync(process.execPath, [
    'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', '--json',
  ], { cwd: PROJECT_ROOT, input, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /trace observation stdin 必须是合法 UTF-8/);
  assert.equal(result.stdout.includes('�'), false);
});
