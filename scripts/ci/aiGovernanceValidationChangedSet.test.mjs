import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectAuthoritativeValidationChangedSet } from './aiGovernanceValidationChangedSet.mjs';

const gitEnvironment = {
  ...process.env,
  GIT_AUTHOR_NAME: 'JSONUtils Test',
  GIT_AUTHOR_EMAIL: 'jsonutils-test@example.invalid',
  GIT_COMMITTER_NAME: 'JSONUtils Test',
  GIT_COMMITTER_EMAIL: 'jsonutils-test@example.invalid',
};

const runGit = (rootDir, args, { input } = {}) => {
  const result = spawnSync('git', ['-C', rootDir, ...args], {
    encoding: 'utf8', env: gitEnvironment, input,
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
};

const write = (rootDir, file, contents, mode) => {
  const absolute = path.join(rootDir, ...file.split('/'));
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
  if (mode) fs.chmodSync(absolute, mode);
};

const withRepository = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-validation-set-'));
  try {
    runGit(rootDir, ['init', '-q']);
    runGit(rootDir, ['config', 'core.filemode', 'true']);
    runGit(rootDir, ['config', 'core.quotePath', 'true']);
    write(rootDir, 'base.txt', 'base\n');
    runGit(rootDir, ['add', 'base.txt']);
    runGit(rootDir, ['commit', '-qm', 'fixture']);
    run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const changesFor = (report, file) => report.allFiles.find(entry => entry.path === file)?.changes;
const issueCodes = (report, file) => report.issues
  .filter(issue => issue.path === file).map(issue => issue.code).sort();

test('authoritative changed set compares HEAD, index and raw worktree bytes and modes', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    const initial = {
      'staged.txt': 'old\n',
      'unstaged.txt': 'old\n',
      'both.txt': 'old\n',
      'staged-delete.txt': 'old\n',
      'worktree-delete.txt': 'old\n',
      'staged-mode.sh': '#!/bin/sh\n',
      'worktree-mode.sh': '#!/bin/sh\n',
    };
    Object.entries(initial).forEach(([file, contents]) => write(rootDir, file, contents, 0o644));
    runGit(rootDir, ['add', ...Object.keys(initial)]);
    runGit(rootDir, ['commit', '-qm', 'tracked fixtures']);

    write(rootDir, 'staged.txt', 'staged\n');
    runGit(rootDir, ['add', 'staged.txt']);
    write(rootDir, 'unstaged.txt', 'worktree\n');
    write(rootDir, 'both.txt', 'staged\n');
    runGit(rootDir, ['add', 'both.txt']);
    write(rootDir, 'both.txt', 'worktree\n');
    runGit(rootDir, ['rm', '-q', 'staged-delete.txt']);
    fs.unlinkSync(path.join(rootDir, 'worktree-delete.txt'));
    fs.chmodSync(path.join(rootDir, 'staged-mode.sh'), 0o755);
    runGit(rootDir, ['add', 'staged-mode.sh']);
    fs.chmodSync(path.join(rootDir, 'worktree-mode.sh'), 0o755);
    write(rootDir, 'staged-add.txt', 'new\n');
    runGit(rootDir, ['add', 'staged-add.txt']);
    const unusualPath = 'new\n中文 -> raw.txt';
    write(rootDir, unusualPath, 'untracked\n');
    runGit(rootDir, ['config', 'core.filemode', 'false']);

    const report = collectAuthoritativeValidationChangedSet(rootDir);
    assert.equal(report.ok, true);
    assert.deepEqual(changesFor(report, 'staged.txt'), ['staged-content']);
    assert.deepEqual(changesFor(report, 'unstaged.txt'), ['worktree-content']);
    assert.deepEqual(changesFor(report, 'both.txt'), ['staged-content', 'worktree-content']);
    assert.deepEqual(changesFor(report, 'staged-delete.txt'), ['staged-deleted']);
    assert.deepEqual(changesFor(report, 'worktree-delete.txt'), ['worktree-deleted']);
    assert.deepEqual(changesFor(report, 'staged-mode.sh'), ['staged-mode']);
    assert.deepEqual(changesFor(report, 'worktree-mode.sh'), ['worktree-mode']);
    assert.deepEqual(changesFor(report, 'staged-add.txt'), ['staged-added']);
    assert.deepEqual(changesFor(report, unusualPath), ['untracked']);
    assert.deepEqual(report.counts, { staged: 5, worktree: 4, untracked: 1, blocked: 0 });
    assert.equal(report.changedFileCount, 9);
    assert.match(report.stateSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(Object.keys(report).sort(), [
      'allFiles', 'changedFileCount', 'counts', 'issues', 'ok', 'reportType', 'schemaVersion', 'stateSha256',
    ]);
    assert.ok(report.allFiles.every(entry => Object.keys(entry).sort().join(',') === 'changes,path'));
  });
});

test('assume-unchanged, skip-worktree and intent-to-add flags fail closed', () => {
  withRepository((rootDir) => {
    write(rootDir, 'assume.txt', 'tracked\n');
    write(rootDir, 'skip.txt', 'tracked\n');
    runGit(rootDir, ['add', 'assume.txt', 'skip.txt']);
    runGit(rootDir, ['commit', '-qm', 'flag fixtures']);
    runGit(rootDir, ['update-index', '--assume-unchanged', 'assume.txt']);
    runGit(rootDir, ['update-index', '--skip-worktree', 'skip.txt']);
    write(rootDir, 'assume.txt', 'hidden drift\n');
    write(rootDir, 'intent.txt', 'intent\n');
    runGit(rootDir, ['add', '-N', 'intent.txt']);

    const report = collectAuthoritativeValidationChangedSet(rootDir);
    assert.equal(report.ok, false);
    assert.deepEqual(issueCodes(report, 'assume.txt'), ['assume-unchanged']);
    assert.deepEqual(issueCodes(report, 'skip.txt'), ['skip-worktree']);
    assert.deepEqual(issueCodes(report, 'intent.txt'), ['intent-to-add']);
    assert.deepEqual(changesFor(report, 'assume.txt'), ['worktree-content']);
    assert.equal(report.counts.blocked, 3);
  });
});

test('unmerged entries, gitlinks, symlinks and special worktree files are reported without reading them', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    const headOid = runGit(rootDir, ['rev-parse', 'HEAD']).stdout.trim();
    runGit(rootDir, ['update-index', '--add', '--cacheinfo', `160000,${headOid},vendor-link`]);
    fs.symlinkSync('missing-target', path.join(rootDir, 'untracked-link'));
    fs.unlinkSync(path.join(rootDir, 'base.txt'));
    const fifo = path.join(rootDir, 'base.txt');
    const fifoResult = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
    assert.equal(fifoResult.status, 0, fifoResult.stderr);

    const blobOid = runGit(rootDir, ['hash-object', '-w', '--stdin'], { input: 'conflict\n' }).stdout.trim();
    runGit(rootDir, ['update-index', '--index-info'], {
      input: `100644 ${blobOid} 1\tconflict.txt\n100644 ${blobOid} 2\tconflict.txt\n100644 ${blobOid} 3\tconflict.txt\n`,
    });

    const report = collectAuthoritativeValidationChangedSet(rootDir);
    assert.equal(report.ok, false);
    assert.deepEqual(issueCodes(report, 'vendor-link'), ['gitlink']);
    assert.deepEqual(issueCodes(report, 'untracked-link'), ['symlink']);
    assert.deepEqual(issueCodes(report, 'base.txt'), ['special-file']);
    assert.deepEqual(issueCodes(report, 'conflict.txt'), ['unmerged-index']);
    assert.deepEqual(changesFor(report, 'untracked-link'), ['untracked']);
    assert.deepEqual(changesFor(report, 'base.txt'), []);
  });
});

test('only repository .gitignore controls untracked scope and no fsmonitor or clean filter command executes', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    write(rootDir, '.gitignore', 'project-ignored.txt\nignored.txt\n');
    write(rootDir, 'filtered.txt', 'clean\n');
    runGit(rootDir, ['add', '.gitignore', 'filtered.txt']);
    runGit(rootDir, ['commit', '-qm', 'ignore and filter fixture']);
    fs.writeFileSync(path.join(rootDir, '.git/info/exclude'), 'info-hidden.txt\n');
    write(rootDir, 'local-global-exclude', 'global-hidden.txt\n');
    runGit(rootDir, ['config', 'core.excludesFile', path.join(rootDir, 'local-global-exclude')]);
    write(rootDir, 'project-ignored.txt', 'ignored\n');
    write(rootDir, 'info-hidden.txt', 'must remain visible\n');
    write(rootDir, 'global-hidden.txt', 'must remain visible\n');
    write(rootDir, 'IGNORED.txt', 'case-sensitive project path\n');
    write(rootDir, 'filtered.txt', 'raw worktree bytes\n');

    const filterMarker = path.join(rootDir, 'filter-ran');
    const filterScript = path.join(rootDir, 'filter-marker.sh');
    fs.writeFileSync(filterScript, `#!/bin/sh\ntouch ${JSON.stringify(filterMarker)}\ncat\n`);
    fs.chmodSync(filterScript, 0o755);
    runGit(rootDir, ['config', 'filter.validation.clean', filterScript]);
    fs.appendFileSync(path.join(rootDir, '.gitattributes'), 'filtered.txt filter=validation\n');

    const fsmonitorMarker = path.join(rootDir, 'fsmonitor-ran');
    const fsmonitorScript = path.join(rootDir, 'fsmonitor-marker.sh');
    fs.writeFileSync(fsmonitorScript, `#!/bin/sh\ntouch ${JSON.stringify(fsmonitorMarker)}\nexit 0\n`);
    fs.chmodSync(fsmonitorScript, 0o755);
    runGit(rootDir, ['config', 'core.fsmonitor', fsmonitorScript]);
    runGit(rootDir, ['config', 'core.ignoreCase', 'true']);
    const indexBefore = fs.readFileSync(path.join(rootDir, '.git/index'));
    const configBefore = fs.readFileSync(path.join(rootDir, '.git/config'));

    const report = collectAuthoritativeValidationChangedSet(rootDir);
    assert.equal(report.ok, true);
    assert.deepEqual(changesFor(report, 'filtered.txt'), ['worktree-content']);
    assert.deepEqual(changesFor(report, 'info-hidden.txt'), ['untracked']);
    assert.deepEqual(changesFor(report, 'global-hidden.txt'), ['untracked']);
    assert.deepEqual(changesFor(report, 'IGNORED.txt'), ['untracked']);
    assert.equal(changesFor(report, 'project-ignored.txt'), undefined);
    assert.equal(fs.existsSync(filterMarker), false);
    assert.equal(fs.existsSync(fsmonitorMarker), false);
    assert.deepEqual(fs.readFileSync(path.join(rootDir, '.git/index')), indexBefore);
    assert.deepEqual(fs.readFileSync(path.join(rootDir, '.git/config')), configBefore);
  });
});

test('state digest binds raw bytes even when the change classification is unchanged', () => {
  withRepository((rootDir) => {
    write(rootDir, 'base.txt', 'first drift\n');
    const first = collectAuthoritativeValidationChangedSet(rootDir);
    write(rootDir, 'base.txt', 'other drift\n');
    const second = collectAuthoritativeValidationChangedSet(rootDir);

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.deepEqual(changesFor(first, 'base.txt'), ['worktree-content']);
    assert.deepEqual(changesFor(second, 'base.txt'), ['worktree-content']);
    assert.notEqual(first.stateSha256, second.stateSha256);
  });
});

test('collector only accepts the exact repository top-level', () => {
  withRepository((rootDir) => {
    const subdirectory = path.join(rootDir, 'subdirectory');
    fs.mkdirSync(subdirectory);
    const report = collectAuthoritativeValidationChangedSet(subdirectory);

    assert.equal(report.ok, false);
    assert.equal(report.stateSha256, null);
    assert.deepEqual(report.issues, [{
      code: 'repository-root-required', path: null, source: 'inventory',
    }]);
  });
});

test('unsafe Git paths fail closed without echoing the path', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    write(rootDir, 'unsafe\\path.txt', 'unsafe\n');
    runGit(rootDir, ['add', 'unsafe\\path.txt']);
    const report = collectAuthoritativeValidationChangedSet(rootDir);
    assert.equal(report.ok, false);
    assert.deepEqual(report.issues, [{ code: 'unsafe-path', path: null, source: 'inventory' }]);
    assert.deepEqual(report.allFiles, []);
  });
});
