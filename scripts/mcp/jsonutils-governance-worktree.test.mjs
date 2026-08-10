import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildJsonutilsWorktreeSnapshot } from './jsonutils-governance-worktree.mjs';

test('worktree snapshot reports fixed git status failures as structured errors', async () => {
  const snapshot = await buildJsonutilsWorktreeSnapshot({
    runStatus: async () => ({ exitCode: 128, error: 'hermetic Git inventory 读取失败' }),
  });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reportType, 'jsonutils-worktree-snapshot');
  assert.match(snapshot.error, /hermetic Git inventory/);
});

test('worktree snapshot converts parser failures to structured errors', async () => {
  const snapshot = await buildJsonutilsWorktreeSnapshot({
    runStatus: async () => ({ exitCode: 0, stdout: Buffer.from('## main') }),
  });
  assert.equal(snapshot.ok, false);
  assert.match(snapshot.error, /NUL terminator/);
});

test('worktree snapshot expands every nested untracked file in a real git repository', async (t) => {
  const repository = await mkdtemp(join(tmpdir(), 'jsonutils-worktree-'));
  t.after(() => rm(repository, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet'], { cwd: repository });
  await mkdir(join(repository, 'evals/ai-governance/nested'), { recursive: true });
  await Promise.all(['cases.json', 'nested/trace.json'].map(file => writeFile(join(repository, 'evals/ai-governance', file), '{}\n')));
  const snapshot = await buildJsonutilsWorktreeSnapshot({ cwd: repository, includeAllFiles: true, maxFiles: 1 });
  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.changedFileCount, 2);
  assert.equal(snapshot.truncated, true);
  assert.deepEqual(snapshot.allFiles.map(file => file.path), ['evals/ai-governance/cases.json', 'evals/ai-governance/nested/trace.json']);
  assert.equal(snapshot.allFiles.some(file => file.path.endsWith('/')), false);
});

test('real hermetic status preserves Unicode, newline, arrow and rename paths', async (t) => {
  const repository = await mkdtemp(join(tmpdir(), 'jsonutils-worktree-paths-'));
  t.after(() => rm(repository, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet'], { cwd: repository });
  execFileSync('git', ['config', 'user.name', 'JSONUtils Test'], { cwd: repository });
  execFileSync('git', ['config', 'user.email', 'jsonutils-test@example.invalid'], { cwd: repository });
  execFileSync('git', ['config', 'core.quotePath', 'true'], { cwd: repository });
  const oldName = 'old -> name.md', newName = 'new\n中文.md';
  await writeFile(join(repository, oldName), 'tracked\n');
  execFileSync('git', ['add', oldName], { cwd: repository });
  execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: repository });
  await rename(join(repository, oldName), join(repository, newName));
  execFileSync('git', ['add', '-A'], { cwd: repository });
  await writeFile(join(repository, '中文 -> untracked.md'), '{}\n');

  const snapshot = await buildJsonutilsWorktreeSnapshot({ cwd: repository, includeAllFiles: true });
  assert.equal(snapshot.ok, true);
  assert.deepEqual(snapshot.allFiles.find(file => file.status === 'R'), {
    status: 'R', path: newName, from: oldName,
  });
  assert.ok(snapshot.allFiles.some(file => file.path === '中文 -> untracked.md'));
});
