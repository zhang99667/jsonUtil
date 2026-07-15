import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildJsonutilsWorktreeSnapshot, parseGitStatusSnapshot } from './jsonutils-governance-worktree.mjs';

const statusBytes = (...records) => Buffer.from(`${records.join('\0')}\0`);

test('worktree snapshot parses NUL-framed branch metadata, rename and bounded files', () => {
  const snapshot = parseGitStatusSnapshot(statusBytes(
    '## main...origin/main [ahead 2, behind 1]',
    ' M docs/AI-TOOLS-SETUP.md',
    'A  scripts/mcp/new-tool.mjs',
    'R  new\nname.mjs',
    'old -> name.mjs',
    '?? scratch.md',
  ), 2, { includeAllFiles: true });

  assert.deepEqual(snapshot.branch, { current: 'main', upstream: 'origin/main', ahead: 2, behind: 1 });
  assert.equal(snapshot.dirty, true);
  assert.equal(snapshot.changedFileCount, 4);
  assert.equal(snapshot.truncated, true);
  assert.deepEqual(snapshot.counts, { added: 1, copied: 0, deleted: 0, modified: 1, renamed: 1, untracked: 1, conflicted: 0 });
  assert.deepEqual(snapshot.files, [
    { status: 'M', path: 'docs/AI-TOOLS-SETUP.md' },
    { status: 'A', path: 'scripts/mcp/new-tool.mjs' },
  ]);
  assert.deepEqual(snapshot.allFiles[2], { status: 'R', path: 'new\nname.mjs', from: 'old -> name.mjs' });
});

test('worktree snapshot reports fixed git status failures as structured errors', async () => {
  const snapshot = await buildJsonutilsWorktreeSnapshot({
    runStatus: async () => ({ exitCode: 128, error: 'hermetic Git inventory 读取失败' }),
  });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reportType, 'jsonutils-worktree-snapshot');
  assert.match(snapshot.error, /hermetic Git inventory/);
});

test('worktree snapshot fails closed on text framing, invalid UTF-8 and missing rename origin', async () => {
  assert.throws(() => parseGitStatusSnapshot('## main\n M file.md\n'), /NUL 分帧/);
  assert.throws(() => parseGitStatusSnapshot(Buffer.from([0xff, 0x00])), /UTF-8|utf-8/i);
  assert.throws(() => parseGitStatusSnapshot(statusBytes('## main', 'R  renamed.md')), /rename/);
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
