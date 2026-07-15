import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runCodexJsonCommand } from './aiGovernanceProjectPluginLifecycle.mjs';

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

test('Codex shim 以 127 退出时返回固定 binary-unavailable 诊断', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => true;
    queueMicrotask(() => child.emit('close', 127));
    return child;
  };
  await assert.rejects(runCodexJsonCommand({
    binary: 'codex', args: ['plugin', 'list', '--available', '--json'], cwd: process.cwd(), spawnImpl,
  }), /CODEX_COMMAND_BINARY_UNAVAILABLE/);
});

const assertDescendantStopped = async (t, scenario) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-plugin-command-'));
  const heartbeat = path.join(root, 'heartbeat');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const descendantSource = [
    "import fs from 'node:fs';",
    'const file = process.argv[1];',
    "const beat = () => fs.appendFileSync(file, 'x');",
    'beat();',
    'const timer = setInterval(beat, 15);',
    'setTimeout(() => { clearInterval(timer); process.exit(0); }, 1200);',
  ].join('');
  const parentSource = [
    "import { spawn } from 'node:child_process';",
    'const [file, source] = process.argv.slice(1);',
    "spawn(process.execPath, ['--input-type=module', '-e', source, file], { stdio: 'ignore' });",
    'await new Promise(resolve => setTimeout(resolve, 120));',
    scenario.parentTail,
  ].join('');
  await assert.rejects(runCodexJsonCommand({
    binary: process.execPath,
    args: ['--input-type=module', '-e', parentSource, heartbeat, descendantSource],
    cwd: root,
    outputLimit: scenario.outputLimit,
    timeoutMs: scenario.timeoutMs,
  }), scenario.expectedFailure);
  await delay(120);
  const firstSize = fs.statSync(heartbeat).size;
  await delay(180);
  assert.equal(fs.statSync(heartbeat).size, firstSize);
};

for (const scenario of [
  {
    name: '输出超限',
    parentTail: "process.stdout.write('x'.repeat(4096));setInterval(() => {}, 1000);",
    outputLimit: 128,
    timeoutMs: 2_000,
    expectedFailure: /CODEX_COMMAND_OUTPUT_LIMIT/,
  },
  {
    name: 'leader 非零退出',
    parentTail: 'process.exit(2);',
    outputLimit: 1024,
    timeoutMs: 2_000,
    expectedFailure: /CODEX_COMMAND_FAILED/,
  },
  {
    name: '命令超时',
    parentTail: 'setInterval(() => {}, 1000);',
    outputLimit: 1024,
    timeoutMs: 180,
    expectedFailure: /CODEX_COMMAND_TIMEOUT/,
  },
]) test(`Codex CLI ${scenario.name}后回收同一 POSIX 进程组的后代`, {
  skip: process.platform === 'win32',
}, t => assertDescendantStopped(t, scenario));
