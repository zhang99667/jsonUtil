import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseGitStatusSnapshot } from './jsonutils-governance-worktree-parser.mjs';

const statusBytes = (...records) => Buffer.from(`${records.join('\0')}\0`);

test('worktree parser handles NUL-framed branch metadata, rename and bounded files', () => {
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

test('worktree parser counts copy, conflict and Unicode path records', () => {
  const snapshot = parseGitStatusSnapshot(statusBytes(
    '## feature...origin/feature [ahead 12]',
    'C  copy.md',
    'source.md',
    'UU conflict.md',
    'DD deleted.md',
    '?? 中文 file.md',
  ), 10, { includeAllFiles: true });

  assert.deepEqual(snapshot.counts, { added: 0, copied: 1, deleted: 1, modified: 0, renamed: 0, untracked: 1, conflicted: 2 });
  assert.deepEqual(snapshot.allFiles[0], { status: 'C', path: 'copy.md', from: 'source.md' });
  assert.equal(snapshot.truncated, false);
});

test('worktree parser fails closed on malformed bytes, records and paths', () => {
  assert.throws(() => parseGitStatusSnapshot('## main\n M file.md\n'), /NUL 分帧/);
  assert.throws(() => parseGitStatusSnapshot(Buffer.from([0xff, 0x00])), /UTF-8|utf-8/i);
  assert.throws(() => parseGitStatusSnapshot(statusBytes(' M file.md')), /branch record/);
  assert.throws(() => parseGitStatusSnapshot(statusBytes('## main', 'R  renamed.md')), /rename/);
  assert.throws(() => parseGitStatusSnapshot(statusBytes('## main', ' M ../outside.md')), /非法路径/);
});
