import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { hashDirectory, parseControllerProbeArgs, runControllerProbe } from './controller-probe.mjs';

const digest = character => character.repeat(64);
const imageDigest = digest('a');
const baseArgs = output => [
  '--docker-binary', fs.realpathSync(process.execPath),
  '--docker-host', 'unix:///tmp/absent-docker.sock',
  '--image-ref', `local/probe@sha256:${imageDigest}`,
  '--image-sha256', imageDigest,
  '--snapshot-sha256', digest('b'),
  '--topology-plan-sha256', digest('c'),
  '--trial-nonce-sha256', digest('d'),
  '--output', output,
];

test('controller probe 参数拒绝未知、重复和未绑定 image', () => {
  const output = path.join(os.tmpdir(), 'controller-probe-unused.json');
  assert.throws(() => parseControllerProbeArgs([...baseArgs(output), '--unknown']), /不支持的参数/);
  assert.throws(() => parseControllerProbeArgs([...baseArgs(output), '--output', output]), /不得重复/);
  const mismatched = baseArgs(output);
  mismatched[mismatched.indexOf('--image-sha256') + 1] = digest('e');
  assert.throws(() => parseControllerProbeArgs(mismatched), /必须按 digest 固定/);
});

test('controller probe 的 --run 必须使用 sealed snapshot', () => {
  const output = path.join(os.tmpdir(), 'controller-probe-unused-run.json');
  assert.throws(() => parseControllerProbeArgs([...baseArgs(output), '--run']), /必须提供 --snapshot/);
});

test('controller probe 在 daemon unavailable 时只写 0600 component report', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controller-probe-test-'));
  const output = path.join(root, 'report.json');
  try {
    const calls = [];
    const result = await runControllerProbe({
      argv: baseArgs(output),
      env: {},
      execFileFn: async (_file, args) => {
        calls.push(args);
        return args.includes('--version')
          ? { status: 0, stdout: 'Docker version test', stderr: '' }
          : { status: 1, stdout: '', stderr: 'unavailable' };
      },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(result.report.result.status, 'not-run');
    assert.equal(result.report.result.runtimeProbeObserved, false);
    assert.equal(result.report.result.outcomeEligible, false);
    assert.equal(result.report.execution.modelInvocations, 0);
    assert.equal(result.report.execution.automaticLedgerWrites, false);
    assert.deepEqual(result.report.result.failures, ['docker-server-unavailable']);
    assert.equal(fs.statSync(output).mode & 0o777, 0o600);
    assert.equal(fs.readFileSync(output, 'utf8'), JSON.stringify(result.report));
    assert.equal(calls.length, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('controller probe 在任何 Docker 调用前拒绝模型凭据环境', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controller-probe-key-test-'));
  const output = path.join(root, 'report.json');
  let called = false;
  try {
    await assert.rejects(() => runControllerProbe({
      argv: baseArgs(output),
      env: { CODEX_API_KEY: 'not-read' },
      execFileFn: async () => (called = true, { status: 0, stdout: '', stderr: '' }),
    }), /拒绝携带敏感环境变量/);
    assert.equal(called, false);
    assert.equal(fs.existsSync(output), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('controller probe 拒绝通过符号链接父目录把 report 写回插件', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controller-probe-link-test-'));
  const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const linkedParent = path.join(root, 'plugin-link');
  fs.symlinkSync(pluginRoot, linkedParent, 'dir');
  let called = false;
  try {
    await assert.rejects(() => runControllerProbe({
      argv: baseArgs(path.join(linkedParent, 'should-not-write.json')),
      env: {},
      execFileFn: async () => (called = true, { status: 0, stdout: '', stderr: '' }),
    }), /必须位于插件和 snapshot 外/);
    assert.equal(called, false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('controller probe 在独立审核镜像政策落地前 fail closed 拒绝 runtime', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controller-probe-runtime-gate-'));
  const snapshot = path.join(root, 'snapshot');
  const output = path.join(root, 'report.json');
  fs.mkdirSync(snapshot);
  fs.writeFileSync(path.join(snapshot, 'marker.txt'), 'sealed\n');
  const args = baseArgs(output);
  args[args.indexOf('--snapshot-sha256') + 1] = hashDirectory(snapshot);
  args.push('--run', '--snapshot', snapshot);
  const calls = [];
  try {
    const result = await runControllerProbe({
      argv: args,
      env: {},
      execFileFn: async (_file, commandArgs) => {
        calls.push(commandArgs);
        return { status: 0, stdout: commandArgs.includes('--version') ? 'Docker test' : 'present', stderr: '' };
      },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(result.report.result.status, 'not-run');
    assert.deepEqual(result.report.result.failures, ['runtime-execution-disabled']);
    assert.equal(calls.some(call => call.includes('create')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
