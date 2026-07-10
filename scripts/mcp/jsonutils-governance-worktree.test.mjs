import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildJsonutilsWorktreeSnapshot,
  parseGitStatusSnapshot,
} from './jsonutils-governance-worktree.mjs';

test('worktree snapshot parses branch metadata and bounded files', () => {
  const snapshot = parseGitStatusSnapshot([
    '## main...origin/main [ahead 2, behind 1]',
    ' M docs/AI-TOOLS-SETUP.md',
    'A  scripts/mcp/new-tool.mjs',
    'R  old-name.mjs -> new-name.mjs',
    '?? scratch.md',
  ].join('\n'), 2);

  assert.deepEqual(snapshot.branch, { current: 'main', upstream: 'origin/main', ahead: 2, behind: 1 });
  assert.equal(snapshot.dirty, true);
  assert.equal(snapshot.changedFileCount, 4);
  assert.equal(snapshot.truncated, true);
  assert.deepEqual(snapshot.counts, { added: 1, copied: 0, deleted: 0, modified: 1, renamed: 1, untracked: 1, conflicted: 0 });
  assert.deepEqual(snapshot.files, [
    { status: 'M', path: 'docs/AI-TOOLS-SETUP.md' },
    { status: 'A', path: 'scripts/mcp/new-tool.mjs' },
  ]);
});

test('worktree snapshot reports fixed git status failures as structured errors', async () => {
  const snapshot = await buildJsonutilsWorktreeSnapshot({
    runStatus: async () => ({ exitCode: 128, stdout: '', stderr: 'not a git repository' }),
  });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reportType, 'jsonutils-worktree-snapshot');
  assert.match(snapshot.error, /not a git repository/);
});
