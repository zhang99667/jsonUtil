import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runJsonutilsGovernanceToolWorker } from './jsonutils-governance-tools.mjs';

const createTempRoot = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-mcp-worker-freshness-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  return rootDir;
};

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const waitForFile = async (file) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (fs.existsSync(file) && fs.statSync(file).size > 0) return;
    await delay(20);
  }
  assert.fail('worker descendant did not start');
};

export const registerJsonutilsGovernanceToolWorkerFreshnessTestCases = () => {
  test('tool worker reloads transitive ESM implementation on every request', async (t) => {
    const rootDir = createTempRoot(t);
    const runtimeFile = path.join(rootDir, 'runtime.mjs');
    const workerFile = path.join(rootDir, 'worker.mjs');
    fs.writeFileSync(runtimeFile, "export const version = 'v1';\n");
    fs.writeFileSync(workerFile, [
      "import { version } from './runtime.mjs';",
      "const request = JSON.parse(Buffer.from(process.argv[2], 'base64url').toString('utf8'));",
      "const result = { content: [{ type: 'text', text: JSON.stringify({ version }) }], structuredContent: { version, name: request.name }, isError: false };",
      "process.stdout.write(`${JSON.stringify({ schemaVersion: 1, result })}\\n`);",
      '',
    ].join('\n'));

    const first = await runJsonutilsGovernanceToolWorker(
      { name: 'fixture', args: {} },
      { workerScript: workerFile, cwd: rootDir, timeoutMs: 2_000 },
    );
    fs.writeFileSync(runtimeFile, "export const version = 'v2';\n");
    const second = await runJsonutilsGovernanceToolWorker(
      { name: 'fixture', args: {} },
      { workerScript: workerFile, cwd: rootDir, timeoutMs: 2_000 },
    );

    assert.equal(first.structuredContent.version, 'v1');
    assert.equal(second.structuredContent.version, 'v2');
  });

  test('tool worker rejects non-closed output without leaking its payload', async (t) => {
    const rootDir = createTempRoot(t);
    const workerFile = path.join(rootDir, 'worker.mjs');
    fs.writeFileSync(workerFile, [
      "const result = { content: [{ type: 'text', text: '{}' }], structuredContent: {}, isError: false };",
      "process.stdout.write(`${JSON.stringify({ schemaVersion: 1, result, privateMarker: 'do-not-leak' })}\\n`);",
      '',
    ].join('\n'));

    await assert.rejects(
      runJsonutilsGovernanceToolWorker(
        { name: 'fixture', args: {} },
        { workerScript: workerFile, cwd: rootDir, timeoutMs: 2_000 },
      ),
      (error) => {
        assert.equal(error?.name, 'JsonutilsGovernanceToolWorkerError');
        assert.doesNotMatch(error.message, /privateMarker|do-not-leak|worker\.mjs/);
        return true;
      },
    );
  });

  test('worker stop paths force-kill SIGTERM-resistant POSIX descendants', {
    skip: process.platform === 'win32',
  }, async (t) => {
    for (const scenario of [
      { name: 'abort', mode: 'idle', timeoutMs: 2_000, errorName: 'AbortError' },
      { name: 'timeout', mode: 'idle', timeoutMs: 120, errorName: 'JsonutilsGovernanceToolWorkerError' },
      { name: 'stdout limit', mode: 'stdout', timeoutMs: 2_000, errorName: 'JsonutilsGovernanceToolWorkerError' },
      { name: 'stderr limit', mode: 'stderr', timeoutMs: 2_000, errorName: 'JsonutilsGovernanceToolWorkerError' },
    ]) await t.test(scenario.name, async (t) => {
      const rootDir = createTempRoot(t);
      const markerFile = path.join(rootDir, 'heartbeat');
      const workerFile = path.join(rootDir, 'worker.mjs');
      fs.writeFileSync(workerFile, [
        "import { spawn } from 'node:child_process';",
        "const request = JSON.parse(Buffer.from(process.argv[2], 'base64url').toString('utf8'));",
        "spawn(process.execPath, ['-e', \"const fs=require('node:fs');process.on('SIGTERM',()=>{});setInterval(()=>fs.appendFileSync(process.argv[1],'x'),20)\", request.args.marker], { stdio: 'ignore' });",
        "setTimeout(() => { if (request.args.mode === 'stdout') process.stdout.write(Buffer.alloc(1024 * 1024)); if (request.args.mode === 'stderr') process.stderr.write(Buffer.alloc(1024 * 1024)); }, 80);",
        'setInterval(() => {}, 1000);',
        '',
      ].join('\n'));
      const controller = new AbortController();
      const pending = runJsonutilsGovernanceToolWorker(
        { name: 'fixture', args: { marker: markerFile, mode: scenario.mode } },
        { workerScript: workerFile, cwd: rootDir, timeoutMs: scenario.timeoutMs, signal: controller.signal },
      );
      pending.catch(() => {});
      await waitForFile(markerFile);
      if (scenario.name === 'abort') controller.abort();
      await assert.rejects(pending, error => error?.name === scenario.errorName);
      await delay(350);
      const stoppedSize = fs.statSync(markerFile).size;
      await delay(160);
      assert.equal(fs.statSync(markerFile).size, stoppedSize);
    });
  });
};
