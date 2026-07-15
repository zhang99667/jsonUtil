import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('AI 治理进化 suite CLI 同时支持默认人读与 JSON 输出', () => {
  const run = args => spawnSync(process.execPath, ['scripts/ci/check-ai-evolution-evals.mjs', ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const human = run([]);
  const json = run(['--json']);
  const report = JSON.parse(json.stdout);
  const expectedStatus = report.ok ? 0 : 1;

  assert.equal(human.status, expectedStatus);
  assert.equal(json.status, expectedStatus);
  assert.match(human.stdout, new RegExp(`账本链：${report.ledgerChain.status}`));
  assert.match(human.stdout, new RegExp(report.nextFocus.id));
  if (report.blockedFocus) assert.match(human.stdout, new RegExp(report.blockedFocus.id));
  assert.match(`${human.stdout}\n${human.stderr}`, report.ok ? /校验通过/ : /校验失败/);
});
