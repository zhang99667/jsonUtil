import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildHermeticGitEnvironment, resolveHermeticGitExecutable } from './aiGovernanceHermeticGitInventory.mjs';
import {
  bindJsonutilsValidationExecutables,
  buildJsonutilsValidationCommandEnvironment,
  cleanupJsonutilsValidationRuntime,
  createJsonutilsValidationRuntime,
  resolveJsonutilsValidationRoot,
  spawnJsonutilsValidationCommand,
  validateJsonutilsValidationExecutableBindings,
  validateJsonutilsValidationRoot,
  validateJsonutilsValidationRuntime,
} from './aiGovernanceValidationRuntime.mjs';

const gitEnvironment = {
  ...process.env,
  GIT_AUTHOR_NAME: 'JSONUtils Test',
  GIT_AUTHOR_EMAIL: 'jsonutils-test@example.invalid',
  GIT_COMMITTER_NAME: 'JSONUtils Test',
  GIT_COMMITTER_EMAIL: 'jsonutils-test@example.invalid',
};

const runGit = (rootDir, args) => {
  const result = spawnSync('git', ['-C', rootDir, ...args], {
    encoding: 'utf8', env: gitEnvironment,
  });
  assert.equal(result.status, 0, result.stderr);
};

const createRepository = () => {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'jsonutils-validation-runtime-test-'));
  const rootDir = path.join(parent, 'repository');
  fs.mkdirSync(path.join(rootDir, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'fixture.txt'), 'fixture\n');
  runGit(rootDir, ['init', '-q']);
  runGit(rootDir, ['add', 'fixture.txt']);
  runGit(rootDir, ['commit', '-qm', 'fixture']);
  return { parent, rootDir };
};

const hasCode = code => error => error?.code === code;
const mode = target => fs.statSync(target).mode & 0o777;
const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative)
    && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};
const nodeCommands = [{ descriptor: { executable: 'node' } }];
const withPlatform = (platform, run) => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { ...descriptor, value: platform });
  try { return run(); } finally { Object.defineProperty(process, 'platform', descriptor); }
};

test('Windows fails closed before ambient executable and runtime paths are considered', () => withPlatform('win32', () => {
  const ambientEnv = { SystemRoot: 'C:\\untrusted', ProgramFiles: 'C:\\untrusted', PATH: 'C:\\untrusted' };
  const unsupported = hasCode('VALIDATION_WINDOWS_EXECUTION_UNSUPPORTED');
  assert.throws(() => resolveHermeticGitExecutable(process.cwd()), hasCode('HERMETIC_GIT_WINDOWS_UNSUPPORTED'));
  assert.throws(() => buildHermeticGitEnvironment('C:\\untrusted\\git.exe'), hasCode('HERMETIC_GIT_WINDOWS_UNSUPPORTED'));
  assert.throws(() => resolveJsonutilsValidationRoot(process.cwd()), unsupported);
  assert.throws(() => bindJsonutilsValidationExecutables({ rootBinding: {}, commands: nodeCommands, ambientEnv }), unsupported);
  assert.throws(() => createJsonutilsValidationRuntime({ realPath: process.cwd() }), unsupported);
  assert.throws(() => validateJsonutilsValidationRuntime({}, {}), unsupported);
  assert.throws(() => buildJsonutilsValidationCommandEnvironment({ descriptor: {}, runtime: {}, safePath: '', ambientEnv }), unsupported);
  assert.throws(() => spawnJsonutilsValidationCommand({}), unsupported);
}));

test('root binding only accepts the exact non-symlink Git top-level', () => {
  const { parent, rootDir } = createRepository();
  try {
    const binding = resolveJsonutilsValidationRoot(rootDir);
    assert.equal(binding.realPath, fs.realpathSync(rootDir));
    assert.match(binding.identitySha256, /^[a-f0-9]{64}$/);
    assert.equal(validateJsonutilsValidationRoot(binding), true);
    assert.throws(
      () => resolveJsonutilsValidationRoot(path.join(rootDir, 'nested')),
      hasCode('VALIDATION_ROOT_REQUIRED'),
    );
    if (process.platform !== 'win32') {
      const linkedRoot = path.join(parent, 'linked-repository');
      fs.symlinkSync(rootDir, linkedRoot);
      assert.throws(
        () => resolveJsonutilsValidationRoot(linkedRoot),
        hasCode('VALIDATION_ROOT_SYMLINKED'),
      );
    }
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});

test('ambient PATH and TMPDIR cannot select Git, Node or the runtime location', () => {
  const { parent, rootDir } = createRepository();
  const previousPath = process.env.PATH, previousTmpdir = process.env.TMPDIR;
  let binding, runtime;
  try {
    const maliciousBin = path.join(rootDir, 'ambient-bin');
    fs.mkdirSync(maliciousBin);
    fs.writeFileSync(path.join(maliciousBin, 'node'), '#!/bin/sh\nexit 99\n', { mode: 0o755 });
    process.env.PATH = maliciousBin;
    process.env.TMPDIR = rootDir;

    binding = resolveJsonutilsValidationRoot(rootDir);
    const executables = bindJsonutilsValidationExecutables({
      rootBinding: binding,
      commands: nodeCommands,
      ambientEnv: { PATH: maliciousBin, TMPDIR: rootDir },
    });
    const node = executables.byExecutable.node;
    assert.equal(node.realPath, fs.realpathSync(process.execPath));
    assert.equal(path.isAbsolute(node.realPath), true);
    assert.equal(isWithin(binding.realPath, node.realPath), false);
    assert.match(node.pathSha256, /^[a-f0-9]{64}$/);
    assert.match(node.sha256, /^[a-f0-9]{64}$/);
    assert.match(executables.setSha256, /^[a-f0-9]{64}$/);
    assert.equal(executables.safePath.includes(maliciousBin), false);
    assert.equal(validateJsonutilsValidationExecutableBindings(executables, binding), true);

    runtime = createJsonutilsValidationRuntime(binding);
    assert.equal(isWithin(binding.realPath, runtime.root), false);
    if (process.platform !== 'win32') assert.equal(path.dirname(runtime.root), fs.realpathSync('/tmp'));
    for (const target of [runtime.root, runtime.codex, runtime.docker, runtime.home, runtime.tmp]) {
      assert.equal(mode(target), 0o700);
    }
    assert.equal(cleanupJsonutilsValidationRuntime(runtime, binding), true);
    runtime = undefined;
  } finally {
    if (previousPath === undefined) delete process.env.PATH; else process.env.PATH = previousPath;
    if (previousTmpdir === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = previousTmpdir;
    if (runtime?.root && fs.existsSync(runtime.root)) fs.rmSync(runtime.root, { recursive: true, force: true });
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('runtime validation rejects mode, extra-entry and symlink drift', {
  skip: process.platform === 'win32',
}, () => {
  const { parent, rootDir } = createRepository();
  const binding = resolveJsonutilsValidationRoot(rootDir);
  const runtime = createJsonutilsValidationRuntime(binding);
  try {
    fs.chmodSync(runtime.home, 0o755);
    assert.throws(
      () => validateJsonutilsValidationRuntime(runtime, binding),
      hasCode('VALIDATION_RUNTIME_DRIFT'),
    );
    fs.chmodSync(runtime.home, 0o700);
    assert.equal(validateJsonutilsValidationRuntime(runtime, binding), true);

    const extra = path.join(runtime.root, 'unexpected');
    fs.writeFileSync(extra, 'unexpected\n');
    assert.throws(
      () => validateJsonutilsValidationRuntime(runtime, binding),
      hasCode('VALIDATION_RUNTIME_DRIFT'),
    );
    fs.unlinkSync(extra);
    assert.equal(validateJsonutilsValidationRuntime(runtime, binding), true);

    fs.rmdirSync(runtime.tmp);
    fs.symlinkSync(runtime.home, runtime.tmp);
    assert.throws(
      () => validateJsonutilsValidationRuntime(runtime, binding),
      hasCode('VALIDATION_RUNTIME_DRIFT'),
    );
  } finally {
    fs.rmSync(runtime.root, { recursive: true, force: true });
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('cleanup removes only an unchanged empty runtime and retains non-empty state', () => {
  const { parent, rootDir } = createRepository();
  const binding = resolveJsonutilsValidationRoot(rootDir);
  let emptyRuntime, retainedRuntime;
  try {
    emptyRuntime = createJsonutilsValidationRuntime(binding);
    const emptyRoot = emptyRuntime.root;
    assert.equal(cleanupJsonutilsValidationRuntime(emptyRuntime, binding), true);
    assert.equal(fs.existsSync(emptyRoot), false);
    emptyRuntime = undefined;

    retainedRuntime = createJsonutilsValidationRuntime(binding);
    const retainedFile = path.join(retainedRuntime.tmp, 'pending');
    fs.writeFileSync(retainedFile, 'retain\n');
    assert.equal(cleanupJsonutilsValidationRuntime(retainedRuntime, binding), false);
    assert.equal(fs.existsSync(retainedRuntime.root), true);
    assert.equal(fs.readFileSync(retainedFile, 'utf8'), 'retain\n');
    fs.unlinkSync(retainedFile);
    assert.equal(cleanupJsonutilsValidationRuntime(retainedRuntime, binding), true);
    retainedRuntime = undefined;
  } finally {
    for (const runtime of [emptyRuntime, retainedRuntime]) {
      if (runtime?.root && fs.existsSync(runtime.root)) fs.rmSync(runtime.root, { recursive: true, force: true });
    }
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('command environments drop ambient control and secret values and pin Compose fakes', () => {
  const { parent, rootDir } = createRepository();
  const binding = resolveJsonutilsValidationRoot(rootDir);
  const runtime = createJsonutilsValidationRuntime(binding);
  try {
    const secret = 'ambient-secret-must-not-escape';
    const ambientEnv = {
      NODE_OPTIONS: secret,
      GITHUB_STEP_SUMMARY: secret,
      GITHUB_ENV: secret,
      GITHUB_OUTPUT: secret,
      OPENAI_API_KEY: secret,
      ANTHROPIC_API_KEY: secret,
      POSTGRES_PASSWORD: secret,
      SPRING_DATASOURCE_PASSWORD: secret,
      JWT_SECRET: secret,
    };
    const build = envProfile => buildJsonutilsValidationCommandEnvironment({
      descriptor: { envProfile }, runtime, safePath: '/fixed/safe/path', ambientEnv,
    });
    const nodeEnv = build('jsonutils-validation-node-v1');
    const composeEnv = build('jsonutils-validation-compose-config-v1');
    for (const key of [
      'NODE_OPTIONS', 'GITHUB_STEP_SUMMARY', 'GITHUB_ENV', 'GITHUB_OUTPUT',
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
    ]) {
      assert.equal(nodeEnv[key], undefined);
      assert.equal(composeEnv[key], undefined);
    }
    assert.equal(nodeEnv.POSTGRES_PASSWORD, undefined);
    assert.equal(nodeEnv.JWT_SECRET, undefined);
    assert.equal(nodeEnv.PATH, '/fixed/safe/path');
    assert.equal(nodeEnv.HOME, runtime.home);
    assert.equal(nodeEnv.TMPDIR, runtime.tmp);
    assert.equal(composeEnv.POSTGRES_PASSWORD, 'ci-postgres-password');
    assert.equal(composeEnv.SPRING_DATASOURCE_PASSWORD, 'ci-postgres-password');
    assert.equal(composeEnv.JWT_SECRET, 'ci-jwt-secret-for-compose-validation');
    assert.equal(JSON.stringify({ nodeEnv, composeEnv }).includes(secret), false);
    assert.equal(cleanupJsonutilsValidationRuntime(runtime, binding), true);
  } finally {
    if (fs.existsSync(runtime.root)) fs.rmSync(runtime.root, { recursive: true, force: true });
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('executable binding validation rejects content digest and stat drift', () => {
  const { parent, rootDir } = createRepository();
  try {
    const rootBinding = resolveJsonutilsValidationRoot(rootDir);
    const bindings = bindJsonutilsValidationExecutables({ rootBinding, commands: nodeCommands });
    const node = bindings.byExecutable.node;
    const tamper = patch => ({
      ...bindings,
      byExecutable: { ...bindings.byExecutable, node: { ...node, ...patch } },
    });
    assert.equal(validateJsonutilsValidationExecutableBindings(bindings, rootBinding), true);
    assert.throws(
      () => validateJsonutilsValidationExecutableBindings(tamper({ sha256: '0'.repeat(64) }), rootBinding),
      hasCode('VALIDATION_EXECUTABLE_DRIFT'),
    );
    assert.throws(
      () => validateJsonutilsValidationExecutableBindings(tamper({
        stat: { ...node.stat, size: (BigInt(node.stat.size) + 1n).toString() },
      }), rootBinding),
      hasCode('VALIDATION_EXECUTABLE_DRIFT'),
    );
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});
