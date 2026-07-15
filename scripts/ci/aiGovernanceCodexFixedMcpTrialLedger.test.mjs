import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  assertCodexFixedMcpTrialLedgersStable,
  snapshotCodexFixedMcpTrialLedgers,
} from './aiGovernanceCodexFixedMcpTrialLedger.mjs';

const writeLedgers = async rootDir => {
  const directory = path.join(rootDir, 'evals/ai-governance');
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, 'outcomes.jsonl'), '{}\n'),
    writeFile(path.join(directory, 'trial-receipts.jsonl'), '{}\n'),
  ]);
  return directory;
};

test('ledger snapshot 拒绝 ancestor symlink 逃离 worktree', async (t) => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'jsonutils-ledger-root-'));
  const external = await mkdtemp(path.join(os.tmpdir(), 'jsonutils-ledger-external-'));
  t.after(() => Promise.all([rm(rootDir, { recursive: true, force: true }), rm(external, { recursive: true, force: true })]));
  await writeLedgers(external);
  await mkdir(path.join(rootDir, 'evals'));
  await symlink(path.join(external, 'evals/ai-governance'), path.join(rootDir, 'evals/ai-governance'));
  await assert.rejects(snapshotCodexFixedMcpTrialLedgers(rootDir), /ancestor symlink/);
});

test('ledger snapshot 绑定身份、权限、时间与精确字节', async (t) => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'jsonutils-ledger-stable-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const directory = await writeLedgers(rootDir);
  const before = await snapshotCodexFixedMcpTrialLedgers(rootDir);
  await chmod(path.join(directory, 'outcomes.jsonl'), 0o400);
  const after = await snapshotCodexFixedMcpTrialLedgers(rootDir);
  assert.throws(() => assertCodexFixedMcpTrialLedgersStable(before, after, 'test'), /test 改变/);
});
