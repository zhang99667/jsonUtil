import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  collectEvolutionWorktreeRevisionFailures,
  resolveEvolutionWorktreeRevision,
} from './aiGovernanceEvolutionWorktreeRevision.mjs';

test('worktree revision 只绑定过滤后源状态，不受 ledger-only HEAD 或 Git 阶段变化影响', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-revision-'));
  const git = args => spawnSync('git', ['-C', rootDir, ...args], { encoding: 'utf8' });
  try {
    assert.equal(git(['init', '-q']).status, 0);
    fs.mkdirSync(path.join(rootDir, 'evals/ai-governance'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'tracked.txt'), 'one');
    fs.writeFileSync(path.join(rootDir, 'evals/ai-governance/outcomes.jsonl'), '{}\n');
    fs.writeFileSync(path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'), '{}\n');
    assert.equal(git(['add', '.']).status, 0);
    assert.equal(git([
      '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
      'commit', '-q', '--no-gpg-sign', '-m', 'fixture',
    ]).status, 0);
    const first = resolveEvolutionWorktreeRevision(rootDir);

    fs.appendFileSync(path.join(rootDir, 'evals/ai-governance/outcomes.jsonl'), '{}\n');
    assert.equal(git(['add', 'evals/ai-governance/outcomes.jsonl']).status, 0);
    assert.equal(git([
      '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
      'commit', '-q', '--no-gpg-sign', '-m', 'ledger-only',
    ]).status, 0);
    assert.equal(resolveEvolutionWorktreeRevision(rootDir), first);

    fs.writeFileSync(path.join(rootDir, 'tracked.txt'), 'two');
    const changed = resolveEvolutionWorktreeRevision(rootDir);
    assert.notEqual(changed, first);
    assert.equal(git(['add', 'tracked.txt']).status, 0);
    assert.equal(resolveEvolutionWorktreeRevision(rootDir), changed);
    assert.equal(git([
      '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
      'commit', '-q', '--no-gpg-sign', '-m', 'source-state',
    ]).status, 0);
    assert.equal(resolveEvolutionWorktreeRevision(rootDir), changed);

    fs.appendFileSync(path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'), '{}\n');
    assert.equal(resolveEvolutionWorktreeRevision(rootDir), changed);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('active outcome revision 必须匹配当前 worktree manifest', () => {
  const failures = collectEvolutionWorktreeRevisionFailures({
    rootDir: '.',
    outcomes: [{ id: 'forged-revision', provenance: { revision: 'worktree-forged' } }],
    resolveRevision: () => 'worktree-current',
  });
  assert.deepEqual(failures, [
    'outcomes.jsonl: outcome `forged-revision` revision 未绑定当前 worktree manifest',
  ]);
});
