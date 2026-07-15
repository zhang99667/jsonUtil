import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectAuthoritativeValidationChangedSet } from './aiGovernanceValidationChangedSet.mjs';
import { checkAiGovernanceValidationWhitespace } from './aiGovernanceValidationWhitespace.mjs';
import { runAiValidationWhitespaceCli } from './check-ai-validation-whitespace.mjs';

const git = (rootDir, args) => execFileSync('git', ['-C', rootDir, ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const createRepository = (t, files) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-whitespace-test-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  git(rootDir, ['init', '--quiet']);
  git(rootDir, ['config', 'user.email', 'jsonutils@example.invalid']);
  git(rootDir, ['config', 'user.name', 'JSONUtils Test']);
  Object.entries(files).forEach(([file, bytes]) => {
    const target = path.join(rootDir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  });
  git(rootDir, ['add', '--all']);
  git(rootDir, ['commit', '--quiet', '-m', 'baseline']);
  return rootDir;
};

const check = rootDir => checkAiGovernanceValidationWhitespace({ rootDir });

test('三视图检查同时拦截 staged、worktree 和 untracked 空白错误且不泄露路径正文', async (t) => {
  const rootDir = createRepository(t, {
    'staged-secret.txt': 'ok\n',
    'worktree-secret.txt': 'ok\n',
  });
  fs.writeFileSync(path.join(rootDir, 'staged-secret.txt'), 'STAGED-TOP-SECRET \n');
  git(rootDir, ['add', '--', 'staged-secret.txt']);
  fs.writeFileSync(path.join(rootDir, 'worktree-secret.txt'), ' \tWORKTREE-TOP-SECRET\n');
  fs.writeFileSync(path.join(rootDir, 'untracked-secret.txt'), 'UNTRACKED-TOP-SECRET\n\n');

  const report = await check(rootDir);

  assert.equal(report.ok, false);
  assert.deepEqual(report.blockers, [{ code: 'WHITESPACE_VIOLATIONS', count: 3 }]);
  assert.deepEqual(report.checks, {
    staged: { checked: 1, affectedComparisons: 1, binarySkipped: 0 },
    worktree: { checked: 1, affectedComparisons: 1, binarySkipped: 0 },
    untracked: { checked: 1, affectedComparisons: 1, binarySkipped: 0 },
  });
  assert.deepEqual(Object.keys(report), [
    'schemaVersion', 'reportType', 'profile', 'ok', 'status', 'evidenceScope',
    'outcomeEligible', 'changedSet', 'checks', 'blockers', 'claims',
  ]);
  assert.deepEqual(report.claims, {
    applicableRawComparisonsCompleted: true,
    launcherShellUsed: false,
    repositoryFiltersExecuted: false,
    commandOutputReported: false,
    behaviorValidated: false,
  });
  const serialized = JSON.stringify(report);
  for (const secret of ['staged-secret.txt', 'worktree-secret.txt', 'untracked-secret.txt', 'TOP-SECRET']) {
    assert.equal(serialized.includes(secret), false);
  }
});

test('检查固定 whitespace 语义且不执行仓库 clean/smudge filter', async (t) => {
  const rootDir = createRepository(t, {
    '.gitattributes': '*.txt filter=hostile\n',
    'filtered.txt': 'ok\n',
  });
  const marker = path.join(rootDir, 'filter-executed');
  const filter = path.join(rootDir, 'hostile-filter.sh');
  fs.writeFileSync(filter, `#!/bin/sh\ntouch "${marker}"\ncat\n`, { mode: 0o700 });
  git(rootDir, ['config', 'filter.hostile.clean', filter]);
  git(rootDir, ['config', 'filter.hostile.smudge', filter]);
  git(rootDir, ['config', 'core.whitespace', '-blank-at-eol,-blank-at-eof,-space-before-tab']);
  fs.writeFileSync(path.join(rootDir, 'filtered.txt'), 'FILTER-MUST-NOT-RUN \n');

  const report = await check(rootDir);

  assert.equal(report.ok, false);
  assert.equal(report.checks.worktree.affectedComparisons, 1);
  assert.equal(fs.existsSync(marker), false);
  assert.equal(report.claims.repositoryFiltersExecuted, false);
});

test('二进制转换跳过空白判定，CRLF 中回车不隐藏行尾空格', async (t) => {
  const rootDir = createRepository(t, {
    'binary.bin': Buffer.from([0, 1, 2, 10]),
    'crlf.txt': 'ok\r\n',
  });
  fs.writeFileSync(path.join(rootDir, 'binary.bin'), Buffer.from([0, 0x62, 0x61, 0x64, 0x20, 0x0a]));
  fs.writeFileSync(path.join(rootDir, 'crlf.txt'), 'bad \r\n');

  const report = await check(rootDir);

  assert.equal(report.ok, false);
  assert.deepEqual(report.checks.worktree, {
    checked: 2,
    affectedComparisons: 1,
    binarySkipped: 1,
  });
  assert.deepEqual(report.blockers, [{ code: 'WHITESPACE_VIOLATIONS', count: 1 }]);
});

test('无新增空白错误时通过，不把普通内容改动当作失败', async (t) => {
  const rootDir = createRepository(t, { 'clean.txt': 'before\n' });
  fs.writeFileSync(path.join(rootDir, 'clean.txt'), 'after\n');
  fs.writeFileSync(path.join(rootDir, 'new.txt'), 'clean\r\n');

  const report = await check(rootDir);

  assert.equal(report.ok, true);
  assert.equal(report.status, 'passed');
  assert.deepEqual(report.blockers, []);
  assert.equal(report.checks.worktree.checked, 1);
  assert.equal(report.checks.untracked.checked, 1);
});

test('固定 Git 与仓外临时根不受 ambient PATH/TMPDIR/HOME 劫持', {
  skip: process.platform === 'win32',
}, async (t) => {
  const rootDir = createRepository(t, {
    '.gitignore': 'ambient/\n',
    'tracked.txt': 'before\n',
  });
  const ambient = path.join(rootDir, 'ambient');
  const hostileBin = path.join(ambient, 'bin');
  const hostileTmp = path.join(ambient, 'tmp');
  const hostileHome = path.join(ambient, 'home');
  fs.mkdirSync(hostileBin, { recursive: true });
  fs.mkdirSync(hostileTmp, { recursive: true });
  fs.mkdirSync(hostileHome, { recursive: true });
  const marker = path.join(ambient, 'ambient-git-executed');
  fs.writeFileSync(path.join(hostileBin, 'git'), `#!/bin/sh\ntouch '${marker}'\nexit 86\n`, { mode: 0o700 });
  fs.writeFileSync(path.join(rootDir, 'tracked.txt'), 'after \n');

  const previous = Object.fromEntries(['PATH', 'TMPDIR', 'TMP', 'TEMP', 'HOME']
    .map(name => [name, process.env[name]]));
  Object.assign(process.env, {
    PATH: hostileBin,
    TMPDIR: hostileTmp,
    TMP: hostileTmp,
    TEMP: hostileTmp,
    HOME: hostileHome,
  });
  let report;
  try {
    report = await check(rootDir);
  } finally {
    Object.entries(previous).forEach(([name, value]) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }

  assert.equal(report.ok, false);
  assert.deepEqual(report.blockers, [{ code: 'WHITESPACE_VIOLATIONS', count: 1 }]);
  assert.equal(fs.existsSync(marker), false);
  assert.deepEqual(fs.readdirSync(hostileTmp), []);
  assert.deepEqual(fs.readdirSync(hostileHome), []);
});

test('前后 changed-set stateSha256 漂移时 fail closed', async (t) => {
  const rootDir = createRepository(t, { 'drift.txt': 'before\n' });
  fs.writeFileSync(path.join(rootDir, 'drift.txt'), 'after\n');
  let calls = 0;
  const collectChangedSet = (root) => {
    const report = collectAuthoritativeValidationChangedSet(root);
    if ((calls += 1) === 1) fs.writeFileSync(path.join(root, 'drift.txt'), 'changed-again\n');
    return report;
  };

  const report = await checkAiGovernanceValidationWhitespace({ rootDir, collectChangedSet });

  assert.equal(report.ok, false);
  assert.deepEqual(report.blockers, [{ code: 'CHANGED_SET_DRIFT', count: 1 }]);
  assert.equal(JSON.stringify(report).includes('drift.txt'), false);
});

test('CLI help 零读取，未知或重复参数为 2，检查失败为 1', async () => {
  const output = () => {
    let value = '';
    return { stream: { write: chunk => { value += chunk; } }, read: () => value };
  };
  let checkCalls = 0;
  const helpOut = output(), helpErr = output();
  const helpCode = await runAiValidationWhitespaceCli({
    args: ['--help'], stdout: helpOut.stream, stderr: helpErr.stream,
    check: async () => { checkCalls += 1; },
  });
  assert.equal(helpCode, 0);
  assert.match(helpOut.read(), /^Usage:/);
  assert.equal(helpErr.read(), '');
  assert.equal(checkCalls, 0);

  for (const args of [['--unknown'], ['--json', '--json'], ['--help', '--json']]) {
    const stdout = output(), stderr = output();
    const code = await runAiValidationWhitespaceCli({ args, stdout: stdout.stream, stderr: stderr.stream });
    assert.equal(code, 2);
    assert.equal(stdout.read(), '');
    assert.match(stderr.read(), /AI_VALIDATION_WHITESPACE_ARGUMENTS_INVALID/);
  }

  const stdout = output(), stderr = output();
  const code = await runAiValidationWhitespaceCli({
    args: ['--json'], stdout: stdout.stream, stderr: stderr.stream,
    check: async () => ({ ok: false, status: 'failed', path: '/secret/path' }),
  });
  assert.equal(code, 1);
  const expectedFailure = {
    schemaVersion: 1,
    reportType: 'ai-governance-validation-whitespace',
    ok: false,
    status: 'failed',
    evidenceScope: 'component-only',
    outcomeEligible: false,
    blockers: [{ code: 'WHITESPACE_CHECK_FAILED', count: 1 }],
  };
  assert.deepEqual(JSON.parse(stdout.read()), expectedFailure);
  assert.equal(stdout.read().includes('/secret/path'), false);
  assert.equal(stderr.read(), '');

  const thrownOut = output(), thrownErr = output();
  const thrownCode = await runAiValidationWhitespaceCli({
    args: ['--json'], stdout: thrownOut.stream, stderr: thrownErr.stream,
    check: async () => { throw new Error('/secret/path and body'); },
  });
  assert.equal(thrownCode, 1);
  assert.deepEqual(JSON.parse(thrownOut.read()), expectedFailure);
  assert.equal(thrownOut.read().includes('/secret/path'), false);
  assert.equal(thrownErr.read(), '');
});
