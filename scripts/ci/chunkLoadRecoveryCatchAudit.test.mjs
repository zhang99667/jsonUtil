import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildChunkLoadRecoveryCatchReport } from './chunkLoadRecoveryCatchAudit.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-chunk-recovery-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeSource = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const auditFixture = (content, file = 'frontend/src/example.ts') => withTempRoot((rootDir) => {
  writeSource(rootDir, file, content);
  return buildChunkLoadRecoveryCatchReport(rootDir);
});

test('直接 dynamic import 的 try catch 必须接入恢复 dispatch', () => {
  const report = auditFixture([
    'export const load = async () => {',
    '  try {',
    '    await import("./panel");',
    '  } catch (error) {',
    '    console.warn(error);',
    '  }',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures.map(failure => `${failure.file}:${failure.line}:${failure.kind}`), [
    'frontend/src/example.ts:4:try-catch',
  ]);
});

test('接入 dispatch 的 dynamic import catch 通过检查', () => {
  const report = auditFixture([
    'export const load = async () => {',
    '  try {',
    '    await import("./panel");',
    '  } catch (error) {',
    '    if (dispatchChunkLoadRecoveryEvent(error)) return;',
    '    console.warn(error);',
    '  }',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures, []);
});

test('本地 dynamic import helper 的 catch 也必须接入恢复 dispatch', () => {
  const report = auditFixture([
    'const loadDriver = async () => import("driver.js");',
    'export const start = async () => {',
    '  try {',
    '    await loadDriver();',
    '  } catch (error) {',
    '    console.warn(error);',
    '  }',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures.map(failure => failure.kind), ['try-catch']);
});

test('懒加载 effect 入口的 catch 缺少 dispatch 时会失败', () => {
  const report = auditFixture([
    'export const run = async (effects) => {',
    '  try {',
    '    await effects.onLoadBackupModule();',
    '  } catch (error) {',
    '    effects.onShowError("导出失败");',
    '  }',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures.map(failure => `${failure.line}:${failure.kind}`), ['4:try-catch']);
});

test('异步转换 promise catch 缺少 dispatch 时会失败', () => {
  const report = auditFixture([
    'export const run = () => {',
    '  performTransformAsync(input, mode)',
    '    .catch(error => {',
    '      console.warn(error);',
    '    });',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures.map(failure => `${failure.line}:${failure.kind}`), ['3:promise-catch']);
});

test('普通业务请求 catch 不要求 chunk 恢复兜底', () => {
  const report = auditFixture([
    'export const ping = () => {',
    '  fetch("/api/visitor/ping").catch(() => {});',
    '};',
  ].join('\n'));

  assert.deepEqual(report.failures, []);
});

test('测试与 fixture 文件不会参与生产源码检查', () => {
  withTempRoot((rootDir) => {
    writeSource(rootDir, 'frontend/src/example.test.ts', 'import("./panel").catch(() => {});');
    writeSource(rootDir, 'frontend/src/AppTestFixture.ts', 'import("./panel").catch(() => {});');

    const report = buildChunkLoadRecoveryCatchReport(rootDir);

    assert.deepEqual(report.checkedFiles, []);
    assert.deepEqual(report.failures, []);
  });
});
